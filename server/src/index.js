import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getDbPool, sql } from './db.js';
import authRouter, { requireAdmin } from './auth.js';
import {
  mockCategories,
  mockTours,
  mockCoupons,
  mockUserBookings,
  mockReviews
} from './mockData.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Authentication (register, login, forgot/reset password) ──
app.use('/api/auth', authRouter);

// In-memory data store for live state changes
let toursData = JSON.parse(JSON.stringify(mockTours));
let bookingsData = [];
let reviewsData = JSON.parse(JSON.stringify(mockReviews));
let couponsData = JSON.parse(JSON.stringify(mockCoupons));

function createSlug(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapSqlTourRows(tourRows, scheduleRows, imageRows, itineraryRows) {
  return tourRows.map((row) => ({
    id: `dbtour-${row.tour_id}`,
    source: 'database',
    title: row.title,
    slug: row.slug,
    categoryId: `dbcat-${row.category_id}`,
    categoryName: row.category_name,
    departureCity: row.departure_location,
    destinationCity: row.destination_name,
    durationDays: row.duration_days,
    durationNights: row.duration_nights,
    transportType: row.transportation,
    tourType: row.tour_type,
    ratingAverage: Number(row.rating_avg),
    reviewCount: row.total_reviews,
    isFeatured: Boolean(row.is_featured),
    isActive: Boolean(row.is_active),
    thumbnailUrl: row.thumbnail_url || '',
    albumImages: imageRows
      .filter((image) => image.tour_id === row.tour_id)
      .map((image) => image.image_url),
    overviewDescription: row.overview_description || '',
    inclusions: row.inclusions || '',
    exclusions: row.exclusions || '',
    cancellationPolicy: row.cancellation_policy || '',
    schedules: scheduleRows
      .filter((schedule) => schedule.tour_id === row.tour_id)
      .map((schedule) => ({
        id: `dbsch-${schedule.schedule_id}`,
        departureDate: schedule.departure_date.toISOString().slice(0, 10),
        returnDate: schedule.return_date.toISOString().slice(0, 10),
        adultPrice: Number(schedule.adult_price),
        childPrice: Number(schedule.child_price),
        infantPrice: Number(schedule.infant_price),
        maxCapacity: schedule.max_capacity,
        minCapacity: schedule.min_capacity,
        bookedSlots: schedule.booked_slots,
        status: schedule.status
      })),
    itineraries: itineraryRows
      .filter((itinerary) => itinerary.tour_id === row.tour_id)
      .map((itinerary) => ({
        dayNumber: itinerary.day_number,
        title: itinerary.day_title,
        description: itinerary.description,
        activities: itinerary.activities ? JSON.parse(itinerary.activities) : [],
        meals: itinerary.meals || '',
        hotel: itinerary.hotel || ''
      }))
  }));
}

async function getSqlTours(includeInactive = false) {
  const pool = await getDbPool();
  const tourResult = await pool.request()
    .input('includeInactive', sql.Bit, includeInactive)
    .query(`
      SELECT t.tour_id, t.title, t.slug, t.category_id, c.category_name,
             t.destination_id, d.destination_name, t.duration_days, t.duration_nights,
             t.departure_location, t.transportation, t.inclusions, t.exclusions,
             t.cancellation_policy, t.thumbnail_url, t.rating_avg, t.total_reviews,
             t.is_active, t.overview_description, t.tour_type, t.is_featured
      FROM dbo.tours t
      INNER JOIN dbo.categories c ON c.category_id = t.category_id
      INNER JOIN dbo.destinations d ON d.destination_id = t.destination_id
      WHERE @includeInactive = 1 OR t.is_active = 1
      ORDER BY t.created_at DESC;
    `);

  if (tourResult.recordset.length === 0) return [];

  const ids = tourResult.recordset.map((tour) => tour.tour_id);
  const tourIdList = ids.map((_, index) => `@tourId${index}`).join(', ');
  const bindTourIds = (request) => {
    ids.forEach((id, index) => request.input(`tourId${index}`, sql.BigInt, id));
    return request;
  };
  const [scheduleResult, imageResult, itineraryResult] = await Promise.all([
    bindTourIds(pool.request())
      .query(`
        SELECT s.schedule_id, s.tour_id, s.departure_date, s.return_date,
               s.adult_price, s.child_price, s.infant_price, s.max_capacity,
               s.min_capacity, s.booked_slots, s.status
        FROM dbo.tour_schedules s
        WHERE s.tour_id IN (${tourIdList});
      `),
    bindTourIds(pool.request())
      .query(`
        SELECT image_id, tour_id, image_url
        FROM dbo.tour_images
        WHERE tour_id IN (${tourIdList})
        ORDER BY image_id;
      `),
    bindTourIds(pool.request())
      .query(`
        SELECT itinerary_id, tour_id, day_number, day_title, description, activities, meals, hotel
        FROM dbo.tour_itineraries
        WHERE tour_id IN (${tourIdList})
        ORDER BY day_number;
      `)
  ]);

  return mapSqlTourRows(
    tourResult.recordset,
    scheduleResult.recordset,
    imageResult.recordset,
    itineraryResult.recordset
  );
}

function validateTourPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Dữ liệu tour không hợp lệ';
  }
  const requiredText = [
    'title', 'categoryName', 'destinationCity', 'departureCity',
    'transportType', 'overviewDescription', 'thumbnailUrl'
  ];
  if (requiredText.some((key) => typeof body[key] !== 'string' || !body[key].trim())) {
    return 'Vui lòng nhập đầy đủ tên tour, danh mục, điểm đến, điểm khởi hành, phương tiện, mô tả và ảnh đại diện';
  }
  if (body.title.trim().length > 200 || body.categoryName.trim().length > 100 ||
      body.destinationCity.trim().length > 100 || body.departureCity.trim().length > 150 ||
      body.thumbnailUrl.trim().length > 500) {
    return 'Một số nội dung vượt quá giới hạn độ dài cho phép';
  }
  if (!['BUS', 'PLANE', 'TRAIN', 'MIXED'].includes(body.transportType) ||
      !['RESORT', 'TREKKING', 'CULTURAL', 'FOOD', 'FAMILY'].includes(body.tourType || 'RESORT')) {
    return 'Phương tiện hoặc loại hình tour không hợp lệ';
  }
  if (!Number.isInteger(Number(body.durationDays)) || Number(body.durationDays) < 1 ||
      !Number.isInteger(Number(body.durationNights)) || Number(body.durationNights) < 0) {
    return 'Thời lượng tour không hợp lệ';
  }
  if (!Array.isArray(body.schedules) || body.schedules.length === 0) {
    return 'Tour cần có ít nhất một lịch khởi hành';
  }
  for (const schedule of body.schedules) {
    const departureDate = new Date(schedule.departureDate);
    const returnDate = new Date(schedule.returnDate);
    if (!schedule.departureDate || !schedule.returnDate ||
        Number.isNaN(departureDate.getTime()) || Number.isNaN(returnDate.getTime()) ||
        returnDate < departureDate ||
        !Number.isFinite(Number(schedule.adultPrice)) || Number(schedule.adultPrice) < 0 ||
        !Number.isFinite(Number(schedule.childPrice)) || Number(schedule.childPrice) < 0 ||
        !Number.isFinite(Number(schedule.infantPrice)) || Number(schedule.infantPrice) < 0 ||
        !Number.isInteger(Number(schedule.maxCapacity)) || Number(schedule.maxCapacity) < 1 ||
        !Number.isInteger(Number(schedule.minCapacity)) || Number(schedule.minCapacity) < 0 ||
        Number(schedule.minCapacity) > Number(schedule.maxCapacity)) {
      return 'Thông tin lịch khởi hành, giá hoặc sức chứa không hợp lệ';
    }
  }
  if (body.albumImages !== undefined &&
      (!Array.isArray(body.albumImages) || body.albumImages.some((image) => typeof image !== 'string' || image.length > 500))) {
    return 'Danh sách ảnh tour không hợp lệ';
  }
  if (body.itineraries !== undefined) {
    if (!Array.isArray(body.itineraries)) return 'Lịch trình tour không hợp lệ';
    const days = new Set();
    for (const itinerary of body.itineraries) {
      const dayNumber = Number(itinerary.dayNumber);
      if (!Number.isInteger(dayNumber) || dayNumber < 1 ||
          dayNumber > Number(body.durationDays) ||
          typeof itinerary.title !== 'string' || !itinerary.title.trim() || itinerary.title.length > 200 ||
          typeof itinerary.description !== 'string' || !itinerary.description.trim() ||
          (itinerary.activities !== undefined &&
            (!Array.isArray(itinerary.activities) || itinerary.activities.some((activity) => typeof activity !== 'string'))) ||
          days.has(dayNumber)) {
        return 'Thông tin ngày trong lịch trình không hợp lệ hoặc bị trùng';
      }
      days.add(dayNumber);
    }
  }
  return null;
}

async function ensureCategoryAndDestination(transaction, body) {
  const categoryName = body.categoryName.trim();
  const destinationName = body.destinationCity.trim();
  const category = await new sql.Request(transaction)
    .input('categoryName', sql.NVarChar(100), categoryName)
    .query(`
      SELECT category_id FROM dbo.categories WHERE category_name = @categoryName;
    `);
  let categoryId = category.recordset[0]?.category_id;
  if (!categoryId) {
    const categorySlug = createSlug(categoryName);
    const inserted = await new sql.Request(transaction)
      .input('categoryName', sql.NVarChar(100), categoryName)
      .input('categorySlug', sql.VarChar(120), `${categorySlug}-${Date.now().toString(36)}`)
      .query(`
        INSERT INTO dbo.categories (category_name, slug)
        OUTPUT INSERTED.category_id
        VALUES (@categoryName, @categorySlug);
      `);
    categoryId = inserted.recordset[0].category_id;
  }

  const destination = await new sql.Request(transaction)
    .input('destinationName', sql.NVarChar(100), destinationName)
    .query(`
      SELECT TOP 1 destination_id FROM dbo.destinations
      WHERE destination_name = @destinationName ORDER BY destination_id;
    `);
  let destinationId = destination.recordset[0]?.destination_id;
  if (!destinationId) {
    const inserted = await new sql.Request(transaction)
      .input('destinationName', sql.NVarChar(100), destinationName)
      .query(`
        INSERT INTO dbo.destinations (destination_name, region)
        OUTPUT INSERTED.destination_id
        VALUES (@destinationName, N'Toàn quốc');
      `);
    destinationId = inserted.recordset[0].destination_id;
  }

  return { categoryId, destinationId };
}

async function saveTourSchedules(transaction, tourId, schedules) {
  const existingResult = await new sql.Request(transaction)
    .input('tourId', sql.BigInt, tourId)
    .query('SELECT schedule_id, booked_slots, hold_slots, status FROM dbo.tour_schedules WHERE tour_id = @tourId;');
  const existing = new Map(existingResult.recordset.map((row) => [String(row.schedule_id), row]));
  const retainedIds = new Set();

  for (const schedule of schedules) {
    const cleanId = schedule.id ? String(schedule.id).replace(/^dbsch-/, '') : '';
    const current = cleanId ? existing.get(cleanId) : null;
    if (cleanId && !current) {
      throw Object.assign(new Error('Lịch khởi hành không thuộc tour này'), { statusCode: 400 });
    }
    const maxCapacity = Number(schedule.maxCapacity);
    if (current && maxCapacity < current.booked_slots + current.hold_slots) {
      throw Object.assign(new Error('Sức chứa không thể thấp hơn số chỗ đã đặt hoặc đang giữ'), { statusCode: 409 });
    }
    const request = new sql.Request(transaction)
      .input('tourId', sql.BigInt, tourId)
      .input('departureDate', sql.Date, schedule.departureDate)
      .input('returnDate', sql.Date, schedule.returnDate)
      .input('adultPrice', sql.Decimal(18, 2), Number(schedule.adultPrice))
      .input('childPrice', sql.Decimal(18, 2), Number(schedule.childPrice))
      .input('infantPrice', sql.Decimal(18, 2), Number(schedule.infantPrice))
      .input('maxCapacity', sql.Int, maxCapacity)
      .input('minCapacity', sql.Int, Number(schedule.minCapacity));

    if (current) {
      retainedIds.add(cleanId);
      await request
        .input('scheduleId', sql.BigInt, cleanId)
        .query(`
          UPDATE dbo.tour_schedules
          SET departure_date = @departureDate, return_date = @returnDate,
              adult_price = @adultPrice, child_price = @childPrice, infant_price = @infantPrice,
              max_capacity = @maxCapacity, min_capacity = @minCapacity,
              status = CASE
                WHEN status IN ('COMPLETED', 'CANCELLED') THEN status
                WHEN booked_slots + hold_slots >= @maxCapacity THEN 'SOLD_OUT'
                ELSE 'AVAILABLE'
              END
          WHERE schedule_id = @scheduleId AND tour_id = @tourId;
        `);
    } else {
      await request.query(`
        INSERT INTO dbo.tour_schedules (
          tour_id, departure_date, return_date, adult_price, child_price, infant_price,
          max_capacity, min_capacity, booked_slots, hold_slots, status
        )
        VALUES (
          @tourId, @departureDate, @returnDate, @adultPrice, @childPrice, @infantPrice,
          @maxCapacity, @minCapacity, 0, 0, 'AVAILABLE'
        );
      `);
    }
  }

  for (const [id] of existing) {
    if (retainedIds.has(id)) continue;
    const bookingResult = await new sql.Request(transaction)
      .input('scheduleId', sql.BigInt, id)
      .query('SELECT COUNT_BIG(*) AS booking_count FROM dbo.bookings WHERE schedule_id = @scheduleId;');
    if (Number(bookingResult.recordset[0].booking_count) > 0) {
      throw Object.assign(new Error('Không thể xóa lịch khởi hành đã có đơn đặt tour'), { statusCode: 409 });
    }
    await new sql.Request(transaction)
      .input('scheduleId', sql.BigInt, id)
      .query('DELETE FROM dbo.tour_schedules WHERE schedule_id = @scheduleId;');
  }
}

async function saveTourImages(transaction, tourId, images) {
  await new sql.Request(transaction)
    .input('tourId', sql.BigInt, tourId)
    .query('DELETE FROM dbo.tour_images WHERE tour_id = @tourId;');
  for (const imageUrl of images || []) {
    if (!imageUrl.trim()) continue;
    await new sql.Request(transaction)
      .input('tourId', sql.BigInt, tourId)
      .input('imageUrl', sql.NVarChar(500), imageUrl.trim())
      .query(`
        INSERT INTO dbo.tour_images (tour_id, image_url, is_thumbnail)
        VALUES (@tourId, @imageUrl, 0);
      `);
  }
}

async function saveTourItineraries(transaction, tourId, itineraries) {
  await new sql.Request(transaction)
    .input('tourId', sql.BigInt, tourId)
    .query('DELETE FROM dbo.tour_itineraries WHERE tour_id = @tourId;');
  for (const itinerary of itineraries || []) {
    await new sql.Request(transaction)
      .input('tourId', sql.BigInt, tourId)
      .input('dayNumber', sql.Int, Number(itinerary.dayNumber))
      .input('dayTitle', sql.NVarChar(200), itinerary.title.trim())
      .input('description', sql.NVarChar(sql.MAX), itinerary.description.trim())
      .input('activities', sql.NVarChar(sql.MAX), JSON.stringify(itinerary.activities || []))
      .input('meals', sql.NVarChar(100), itinerary.meals || '')
      .input('hotel', sql.NVarChar(200), itinerary.hotel || '')
      .query(`
        INSERT INTO dbo.tour_itineraries (tour_id, day_number, day_title, description, activities, meals, hotel)
        VALUES (@tourId, @dayNumber, @dayTitle, @description, @activities, @meals, @hotel);
      `);
  }
}

async function executeTourWrite(req, res, operation) {
  const validationMessage = validateTourPayload(req.body);
  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  let transaction;
  let transactionStarted = false;
  try {
    transaction = new sql.Transaction(await getDbPool());
    await transaction.begin();
    transactionStarted = true;
    const { categoryId, destinationId } = await ensureCategoryAndDestination(transaction, req.body);
    const firstSchedule = req.body.schedules[0];
    const tourId = await operation(transaction, categoryId, destinationId, firstSchedule);
    await saveTourSchedules(transaction, tourId, req.body.schedules);
    await saveTourImages(transaction, tourId, req.body.albumImages || []);
    await saveTourItineraries(transaction, tourId, req.body.itineraries || []);
    await transaction.commit();
    return res.json({ success: true, message: 'Lưu tour thành công' });
  } catch (err) {
    if (transactionStarted) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error('[Admin tours] Lỗi rollback transaction:', rollbackError.message);
      }
    }
    console.error('[Admin tours] Lỗi lưu tour:', err.message);
    return res.status(err.statusCode || 500).json({ success: false, message: err.statusCode ? err.message : 'Không thể lưu tour vào SQL Server' });
  }
}

// Khởi tạo và nạp dữ liệu từ SQL Server dbo.bookings nếu có
getDbPool().then(async (pool) => {
  if (pool) {
    try {
      const res = await pool.request().query('SELECT * FROM dbo.bookings ORDER BY created_at DESC');
      if (res.recordset && res.recordset.length > 0) {
        bookingsData = res.recordset.map((row) => ({
          id: `bk-${row.booking_id}`,
          bookingId: row.booking_id,
          bookingCode: row.booking_code,
          userId: row.user_id,
          tourId: row.tour_id,
          tourTitle: row.tour_title,
          tourImage: row.tour_image,
          scheduleId: row.schedule_id ? `sch-${row.schedule_id}` : null,
          departureDate: row.departure_date,
          returnDate: row.return_date,
          numAdults: row.num_adults,
          numChildren: row.num_children,
          numInfants: row.num_infants,
          totalPassengers: (row.num_adults || 0) + (row.num_children || 0) + (row.num_infants || 0),
          baseAmount: Number(row.subtotal),
          discountAmount: Number(row.discount_amount),
          finalAmount: Number(row.total_amount),
          paymentMethod: row.payment_method,
          paymentStatus: row.payment_status,
          status: row.booking_status,
          contactName: row.contact_name,
          contactEmail: row.contact_email,
          contactPhone: row.contact_phone,
          specialNotes: row.special_requests,
          passengers: row.passengers_json ? JSON.parse(row.passengers_json) : [],
          qrCodeToken: row.qr_ticket_code,
          createdAt: row.created_at
        }));
        console.log(`[SQL Server] Đã nạp ${bookingsData.length} đơn đặt tour từ database TravelWithMe`);
      }
    } catch (e) {
      console.error('[SQL Server] Lỗi nạp bookings ban đầu:', e.message);
    }
  }
}).catch(() => {});

// 1. Lấy danh sách danh mục
app.get('/api/categories', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT category_id, category_name, slug, description
      FROM dbo.categories
      ORDER BY category_id;
    `);
    const databaseCategories = result.recordset.map((row) => ({
      id: `dbcat-${row.category_id}`,
      name: row.category_name,
      slug: row.slug,
      description: row.description || '',
      region: 'Toàn quốc'
    }));
    res.json({ success: true, data: [...mockCategories, ...databaseCategories] });
  } catch (err) {
    console.error('[GET /api/categories] Không tải được danh mục từ SQL Server:', err.message);
    res.json({ success: true, data: mockCategories });
  }
});

// 2. Lấy danh sách Tours (hỗ trợ lọc & sắp xếp)
app.get('/api/tours', async (req, res) => {
  const {
    keyword,
    departureCity,
    destinationCity,
    categoryId,
    tourType,
    transportType,
    minPrice,
    maxPrice,
    sortBy
  } = req.query;

  let databaseTours = [];
  try {
    databaseTours = await getSqlTours();
  } catch (err) {
    console.error('[GET /api/tours] Không tải được tour từ SQL Server:', err.message);
  }
  let results = [...toursData, ...databaseTours];

  // Lọc theo từ khóa
  if (keyword) {
    const kw = keyword.toLowerCase().trim();
    results = results.filter(
      (t) =>
        t.title.toLowerCase().includes(kw) ||
        t.destinationCity.toLowerCase().includes(kw) ||
        t.departureCity.toLowerCase().includes(kw)
    );
  }

  // Lọc theo điểm đi
  if (departureCity && departureCity !== 'all') {
    results = results.filter((t) =>
      t.departureCity.toLowerCase().includes(departureCity.toLowerCase())
    );
  }

  // Lọc theo điểm đến
  if (destinationCity && destinationCity !== 'all') {
    results = results.filter((t) =>
      t.destinationCity.toLowerCase().includes(destinationCity.toLowerCase())
    );
  }

  // Lọc theo danh mục
  if (categoryId && categoryId !== 'all') {
    results = results.filter((t) => t.categoryId === categoryId);
  }

  // Lọc theo loại hình tour
  if (tourType && tourType !== 'all') {
    results = results.filter((t) => t.tourType === tourType);
  }

  // Lọc theo phương tiện
  if (transportType && transportType !== 'all') {
    results = results.filter((t) => t.transportType === transportType);
  }

  // Lọc theo khoảng giá (dựa trên giá người lớn thấp nhất của các schedule)
  if (minPrice || maxPrice) {
    const min = minPrice ? Number(minPrice) : 0;
    const max = maxPrice ? Number(maxPrice) : Infinity;

    results = results.filter((t) => {
      const minTourPrice = Math.min(
        ...t.schedules.map((s) => Number(s.adultPrice))
      );
      return minTourPrice >= min && minTourPrice <= max;
    });
  }

  // Sắp xếp
  if (sortBy === 'price_asc') {
    results.sort((a, b) => {
      const minA = Math.min(...a.schedules.map((s) => Number(s.adultPrice)));
      const minB = Math.min(...b.schedules.map((s) => Number(s.adultPrice)));
      return minA - minB;
    });
  } else if (sortBy === 'price_desc') {
    results.sort((a, b) => {
      const minA = Math.min(...a.schedules.map((s) => Number(s.adultPrice)));
      const minB = Math.min(...b.schedules.map((s) => Number(s.adultPrice)));
      return minB - minA;
    });
  } else if (sortBy === 'rating') {
    results.sort((a, b) => b.ratingAverage - a.ratingAverage);
  } else {
    // Mặc định: Phổ biến (số lượng review)
    results.sort((a, b) => b.reviewCount - a.reviewCount);
  }

  res.json({
    success: true,
    total: results.length,
    data: results
  });
});

app.get('/api/admin/tours', requireAdmin, async (req, res) => {
  try {
    const tours = await getSqlTours(true);
    res.json({ success: true, data: tours });
  } catch (err) {
    console.error('[GET /api/admin/tours] Lỗi:', err.message);
    res.status(500).json({ success: false, message: 'Không thể tải danh sách tour từ SQL Server' });
  }
});

app.post('/api/admin/tours', requireAdmin, async (req, res) => {
  return executeTourWrite(req, res, async (transaction, categoryId, destinationId, firstSchedule) => {
    const result = await new sql.Request(transaction)
      .input('title', sql.NVarChar(200), req.body.title.trim())
      .input('slug', sql.VarChar(220), `${createSlug(req.body.title)}-${Date.now().toString(36)}`)
      .input('categoryId', sql.Int, categoryId)
      .input('destinationId', sql.Int, destinationId)
      .input('durationDays', sql.Int, Number(req.body.durationDays))
      .input('durationNights', sql.Int, Number(req.body.durationNights))
      .input('departureLocation', sql.NVarChar(150), req.body.departureCity.trim())
      .input('transportation', sql.NVarChar(100), req.body.transportType)
      .input('adultPrice', sql.Decimal(18, 2), Number(firstSchedule.adultPrice))
      .input('childPrice', sql.Decimal(18, 2), Number(firstSchedule.childPrice))
      .input('infantPrice', sql.Decimal(18, 2), Number(firstSchedule.infantPrice))
      .input('overviewDescription', sql.NVarChar(sql.MAX), req.body.overviewDescription.trim())
      .input('inclusions', sql.NVarChar(sql.MAX), req.body.inclusions || '')
      .input('exclusions', sql.NVarChar(sql.MAX), req.body.exclusions || '')
      .input('cancellationPolicy', sql.NVarChar(sql.MAX), req.body.cancellationPolicy || '')
      .input('thumbnailUrl', sql.NVarChar(500), req.body.thumbnailUrl.trim())
      .input('tourType', sql.VarChar(30), req.body.tourType || 'RESORT')
      .input('isFeatured', sql.Bit, Boolean(req.body.isFeatured))
      .query(`
        INSERT INTO dbo.tours (
          title, slug, category_id, destination_id, duration_days, duration_nights,
          departure_location, transportation, adult_price, child_price, infant_price,
          overview_description, inclusions, exclusions, cancellation_policy,
          thumbnail_url, tour_type, is_featured
        )
        OUTPUT INSERTED.tour_id
        VALUES (
          @title, @slug, @categoryId, @destinationId, @durationDays, @durationNights,
          @departureLocation, @transportation, @adultPrice, @childPrice, @infantPrice,
          @overviewDescription, @inclusions, @exclusions, @cancellationPolicy,
          @thumbnailUrl, @tourType, @isFeatured
        );
      `);
    return result.recordset[0].tour_id;
  });
});

app.put('/api/admin/tours/:id', requireAdmin, async (req, res) => {
  const tourId = String(req.params.id).replace(/^dbtour-/, '');
  if (!/^\d+$/.test(tourId)) {
    return res.status(400).json({ success: false, message: 'Mã tour không hợp lệ' });
  }
  return executeTourWrite(req, res, async (transaction, categoryId, destinationId, firstSchedule) => {
    const result = await new sql.Request(transaction)
      .input('tourId', sql.BigInt, tourId)
      .input('title', sql.NVarChar(200), req.body.title.trim())
      .input('categoryId', sql.Int, categoryId)
      .input('destinationId', sql.Int, destinationId)
      .input('durationDays', sql.Int, Number(req.body.durationDays))
      .input('durationNights', sql.Int, Number(req.body.durationNights))
      .input('departureLocation', sql.NVarChar(150), req.body.departureCity.trim())
      .input('transportation', sql.NVarChar(100), req.body.transportType)
      .input('adultPrice', sql.Decimal(18, 2), Number(firstSchedule.adultPrice))
      .input('childPrice', sql.Decimal(18, 2), Number(firstSchedule.childPrice))
      .input('infantPrice', sql.Decimal(18, 2), Number(firstSchedule.infantPrice))
      .input('overviewDescription', sql.NVarChar(sql.MAX), req.body.overviewDescription.trim())
      .input('inclusions', sql.NVarChar(sql.MAX), req.body.inclusions || '')
      .input('exclusions', sql.NVarChar(sql.MAX), req.body.exclusions || '')
      .input('cancellationPolicy', sql.NVarChar(sql.MAX), req.body.cancellationPolicy || '')
      .input('thumbnailUrl', sql.NVarChar(500), req.body.thumbnailUrl.trim())
      .input('tourType', sql.VarChar(30), req.body.tourType || 'RESORT')
      .input('isFeatured', sql.Bit, Boolean(req.body.isFeatured))
      .query(`
        UPDATE dbo.tours
        SET title = @title, category_id = @categoryId, destination_id = @destinationId,
            duration_days = @durationDays, duration_nights = @durationNights,
            departure_location = @departureLocation, transportation = @transportation,
            adult_price = @adultPrice, child_price = @childPrice, infant_price = @infantPrice,
            overview_description = @overviewDescription, inclusions = @inclusions,
            exclusions = @exclusions, cancellation_policy = @cancellationPolicy,
            thumbnail_url = @thumbnailUrl, tour_type = @tourType, is_featured = @isFeatured,
            updated_at = GETDATE()
        OUTPUT INSERTED.tour_id
        WHERE tour_id = @tourId;
      `);
    if (result.recordset.length === 0) {
      throw Object.assign(new Error('Không tìm thấy tour'), { statusCode: 404 });
    }
    return result.recordset[0].tour_id;
  });
});

app.delete('/api/admin/tours/:id', requireAdmin, async (req, res) => {
  const tourId = String(req.params.id).replace(/^dbtour-/, '');
  if (!/^\d+$/.test(tourId)) {
    return res.status(400).json({ success: false, message: 'Mã tour không hợp lệ' });
  }
  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('tourId', sql.BigInt, tourId)
      .query(`
        UPDATE dbo.tours
        SET is_active = 0, updated_at = GETDATE()
        WHERE tour_id = @tourId AND is_active = 1;
      `);
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tour đang hoạt động' });
    }
    res.json({ success: true, message: 'Đã ngừng kinh doanh tour' });
  } catch (err) {
    console.error('[DELETE /api/admin/tours/:id] Lỗi:', err.message);
    res.status(500).json({ success: false, message: 'Không thể ngừng kinh doanh tour trong SQL Server' });
  }
});

// 3. Lấy chi tiết 1 Tour
app.get('/api/tours/:id', async (req, res) => {
  let tour = toursData.find(
    (t) => t.id === req.params.id || t.slug === req.params.id
  );
  if (!tour) {
    try {
      const databaseTours = await getSqlTours();
      tour = databaseTours.find((t) => t.id === req.params.id || t.slug === req.params.id);
    } catch (err) {
      console.error('[GET /api/tours/:id] Không tải được tour từ SQL Server:', err.message);
    }
  }
  if (!tour) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tour du lịch' });
  }

  const tourReviews = reviewsData.filter((r) => r.tourId === tour.id);
  res.json({
    success: true,
    data: {
      ...tour,
      reviews: tourReviews
    }
  });
});

// 4. Kiểm tra mã giảm giá (Coupon validation)
app.post('/api/coupons/validate', (req, res) => {
  const { code, orderAmount } = req.body;
  if (!code) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập mã coupon' });
  }

  const coupon = couponsData.find(
    (c) => c.code.toUpperCase() === code.toUpperCase().trim() && c.isActive
  );

  if (!coupon) {
    return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' });
  }

  const amount = Number(orderAmount) || 0;
  if (amount < coupon.minOrder) {
    return res.status(400).json({
      success: false,
      message: `Đơn hàng tối thiểu phải từ ${coupon.minOrder.toLocaleString('vi-VN')} đ để áp dụng mã này`
    });
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = (amount * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  res.json({
    success: true,
    data: {
      code: coupon.code,
      description: coupon.description,
      discountAmount: discount,
      finalAmount: Math.max(0, amount - discount)
    }
  });
});

// 5. Đặt tour (Booking Creation & Concurrency Check & Lưu vào SQL Server)
app.post('/api/bookings', async (req, res) => {
  try {
    const {
      userId,
      tourId,
      scheduleId,
      numAdults,
      numChildren,
      numInfants,
      contactName,
      contactEmail,
      contactPhone,
      specialNotes,
      couponCode,
      paymentMethod,
      passengers,
      baseAmount: clientBaseAmount,
      discountAmount: clientDiscountAmount,
      finalAmount: clientFinalAmount
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập tài khoản để tiến hành đặt tour!'
      });
    }

    // Tìm tour & schedule
    let tour = toursData.find((t) => t.id === tourId);
    if (!tour && /^dbtour-\d+$/.test(String(tourId))) {
      try {
        tour = (await getSqlTours()).find((item) => item.id === tourId);
      } catch (err) {
        console.error('[POST /api/bookings] Không tải được tour từ SQL Server:', err.message);
        return res.status(500).json({ success: false, message: 'Không thể tải thông tin tour để đặt chỗ' });
      }
    }
    if (!tour) {
      return res.status(404).json({ success: false, message: 'Tour không tồn tại' });
    }

    const schedule = (tour.schedules && tour.schedules.find((s) => s.id === scheduleId)) || (tour.schedules && tour.schedules[0]) || {
      id: 'sch-default',
      departureDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      returnDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
      adultPrice: tour.adultPrice || 3500000,
      childPrice: tour.childPrice || 2500000,
      infantPrice: 0,
      bookedSlots: 0,
      maxCapacity: 30
    };

    const adultCount = Number(numAdults) || 1;
    const childCount = Number(numChildren) || 0;
    const infantCount = Number(numInfants) || 0;
    const totalSeatsNeeded = adultCount + childCount; // Trẻ sơ sinh thường không chiếm ghế riêng

    // KIỂM SOÁT OVERBOOKING REALTIME
    if (schedule && schedule.maxCapacity) {
      const availableSlots = schedule.maxCapacity - (schedule.bookedSlots || 0);
      if (availableSlots < totalSeatsNeeded) {
        return res.status(400).json({
          success: false,
          message: `Rất tiếc! Tour này chỉ còn ${availableSlots} chỗ trống, không đủ cho ${totalSeatsNeeded} hành khách.`
        });
      }
      schedule.bookedSlots = (schedule.bookedSlots || 0) + totalSeatsNeeded;
      if (schedule.bookedSlots >= schedule.maxCapacity) {
        schedule.status = 'SOLD_OUT';
      }
    }

    // Tính tiền
    const baseAmount = clientBaseAmount || (
      adultCount * (schedule.adultPrice || 0) +
      childCount * (schedule.childPrice || 0) +
      infantCount * (schedule.infantPrice || 0)
    );

    let discountAmount = clientDiscountAmount || 0;
    if (couponCode && !clientDiscountAmount) {
      const coupon = couponsData.find(
        (c) => c.code.toUpperCase() === couponCode.toUpperCase().trim() && c.isActive
      );
      if (coupon && baseAmount >= coupon.minOrder) {
        if (coupon.discountType === 'PERCENTAGE') {
          discountAmount = (baseAmount * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    const finalAmount = clientFinalAmount || Math.max(0, baseAmount - discountAmount);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingCode = `TWM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;
    const qrTicketCode = `QR-${bookingCode}-VERIFIED`;
    const departureDate = schedule.departureDate || new Date().toISOString().slice(0, 10);
    const returnDate = schedule.returnDate || new Date().toISOString().slice(0, 10);
    const paymentStatus = paymentMethod === 'CASH' ? 'PENDING' : 'PAID';
    const status = paymentMethod === 'CASH' ? 'PENDING_PAYMENT' : 'CONFIRMED';
    const passengersJson = JSON.stringify(passengers || []);

    let dbBookingId = null;

    // Lưu trực tiếp vào Microsoft SQL Server (TravelWithMe.dbo.bookings)
    try {
      const pool = await getDbPool();
      if (pool) {
        const cleanScheduleId = scheduleId && !isNaN(Number(String(scheduleId).replace(/\D/g, '')))
          ? Number(String(scheduleId).replace(/\D/g, ''))
          : null;

        const result = await pool.request()
          .input('bookingCode', bookingCode)
          .input('userId', Number(userId))
          .input('scheduleId', cleanScheduleId)
          .input('numAdults', adultCount)
          .input('numChildren', childCount)
          .input('numInfants', infantCount)
          .input('subtotal', baseAmount)
          .input('discountAmount', discountAmount)
          .input('totalAmount', finalAmount)
          .input('bookingStatus', status)
          .input('paymentStatus', paymentStatus)
          .input('qrTicketCode', qrTicketCode)
          .input('specialRequests', specialNotes || '')
          .input('tourId', tour.id || tourId)
          .input('tourTitle', tour.title)
          .input('tourImage', tour.thumbnailUrl || tour.image || '')
          .input('departureDate', departureDate)
          .input('returnDate', returnDate)
          .input('contactName', contactName || '')
          .input('contactEmail', contactEmail || '')
          .input('contactPhone', contactPhone || '')
          .input('paymentMethod', paymentMethod || 'VNPAY')
          .input('passengersJson', passengersJson)
          .query(`
            INSERT INTO dbo.bookings (
              booking_code, user_id, schedule_id, num_adults, num_children, num_infants,
              subtotal, discount_amount, total_amount, booking_status, payment_status,
              qr_ticket_code, special_requests, tour_id, tour_title, tour_image,
              departure_date, return_date, contact_name, contact_email, contact_phone,
              payment_method, passengers_json, created_at, updated_at
            )
            OUTPUT INSERTED.booking_id
            VALUES (
              @bookingCode, @userId, @scheduleId, @numAdults, @numChildren, @numInfants,
              @subtotal, @discountAmount, @totalAmount, @bookingStatus, @paymentStatus,
              @qrTicketCode, @specialRequests, @tourId, @tourTitle, @tourImage,
              @departureDate, @returnDate, @contactName, @contactEmail, @contactPhone,
              @paymentMethod, @passengersJson, GETDATE(), GETDATE()
            )
          `);

        if (result.recordset && result.recordset.length > 0) {
          dbBookingId = result.recordset[0].booking_id;
        }
      }
    } catch (sqlErr) {
      console.error('[SQL Server] Lỗi lưu booking vào dbo.bookings:', sqlErr.message);
    }

    const newBooking = {
      id: dbBookingId ? `bk-${dbBookingId}` : `bk-${Date.now()}`,
      bookingId: dbBookingId,
      bookingCode,
      userId: Number(userId),
      tourId: tour.id,
      tourTitle: tour.title,
      tourImage: tour.thumbnailUrl || tour.image || '',
      scheduleId: schedule.id,
      departureDate,
      returnDate,
      numAdults: adultCount,
      numChildren: childCount,
      numInfants: infantCount,
      totalPassengers: adultCount + childCount + infantCount,
      baseAmount,
      discountAmount,
      finalAmount,
      paymentMethod: paymentMethod || 'VNPAY',
      paymentStatus,
      status,
      contactName,
      contactEmail,
      contactPhone,
      specialNotes: specialNotes || '',
      passengers: passengers || [],
      qrCodeToken: qrTicketCode,
      createdAt: new Date().toISOString()
    };

    bookingsData.unshift(newBooking);

    return res.status(201).json({
      success: true,
      message: 'Đặt tour thành công!',
      data: newBooking
    });
  } catch (err) {
    console.error('[POST /api/bookings] Lỗi:', err);
    return res.status(500).json({ success: false, message: 'Lỗi xử lý đặt tour: ' + err.message });
  }
});

// 6. Lấy danh sách chuyến đi của khách hàng (Được lọc theo userId từ SQL Server)
app.get('/api/bookings/my-trips', async (req, res) => {
  const userId = req.query.userId || req.headers['x-user-id'];

  // Nếu không có tài khoản đăng nhập, trả về danh sách rỗng []
  if (!userId) {
    return res.json({
      success: true,
      data: []
    });
  }

  try {
    const pool = await getDbPool();
    if (pool) {
      const result = await pool.request()
        .input('userId', Number(userId))
        .query(`
          SELECT * FROM dbo.bookings
          WHERE user_id = @userId
          ORDER BY created_at DESC
        `);

      const formattedTrips = result.recordset.map((row) => ({
        id: `bk-${row.booking_id}`,
        bookingId: row.booking_id,
        bookingCode: row.booking_code,
        userId: row.user_id,
        tourId: row.tour_id,
        tourTitle: row.tour_title,
        tourImage: row.tour_image,
        scheduleId: row.schedule_id ? `sch-${row.schedule_id}` : null,
        departureDate: row.departure_date,
        returnDate: row.return_date,
        numAdults: row.num_adults,
        numChildren: row.num_children,
        numInfants: row.num_infants,
        totalPassengers: (row.num_adults || 0) + (row.num_children || 0) + (row.num_infants || 0),
        baseAmount: Number(row.subtotal),
        discountAmount: Number(row.discount_amount),
        finalAmount: Number(row.total_amount),
        paymentMethod: row.payment_method,
        paymentStatus: row.payment_status,
        status: row.booking_status,
        contactName: row.contact_name,
        contactEmail: row.contact_email,
        contactPhone: row.contact_phone,
        specialNotes: row.special_requests,
        passengers: row.passengers_json ? JSON.parse(row.passengers_json) : [],
        qrCodeToken: row.qr_ticket_code,
        createdAt: row.created_at
      }));

      return res.json({
        success: true,
        data: formattedTrips
      });
    }
  } catch (sqlErr) {
    console.error('[SQL Server] Lỗi truy vấn my-trips:', sqlErr.message);
  }

  // Fallback: Lọc từ in-memory theo đúng userId của tài khoản đó
  const userBookings = bookingsData.filter((b) => String(b.userId) === String(userId));
  return res.json({
    success: true,
    data: userBookings
  });
});

// 7. Xem chi tiết vé điện tử / Đơn đặt
app.get('/api/bookings/:id', (req, res) => {
  const booking = bookingsData.find(
    (b) => b.id === req.params.id || b.bookingCode === req.params.id
  );
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy vé đặt tour' });
  }
  res.json({ success: true, data: booking });
});

// 8. Hủy tour & Tính toán hoàn tiền (Cập nhật SQL Server & bộ nhớ)
app.post('/api/bookings/:id/cancel', async (req, res) => {
  const booking = bookingsData.find((b) => b.id === req.params.id || b.bookingCode === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn đặt tour' });
  }

  if (booking.status === 'CANCELLED' || booking.status === 'REFUNDED') {
    return res.status(400).json({ success: false, message: 'Đơn này đã bị hủy trước đó' });
  }

  // Tính số ngày trước khi khởi hành
  const depDate = new Date(booking.departureDate);
  const now = new Date();
  const diffDays = Math.ceil((depDate - now) / (1000 * 60 * 60 * 24));

  let refundPercent = 0;
  let penaltyPercent = 100;

  if (diffDays >= 15) {
    refundPercent = 100;
    penaltyPercent = 0;
  } else if (diffDays >= 7) {
    refundPercent = 70;
    penaltyPercent = 30;
  } else if (diffDays >= 3) {
    refundPercent = 50;
    penaltyPercent = 50;
  } else {
    refundPercent = 0;
    penaltyPercent = 100;
  }

  const refundAmount = (booking.finalAmount * refundPercent) / 100;

  // Cập nhật trạng thái booking
  booking.status = refundPercent > 0 ? 'REFUNDED' : 'CANCELLED';
  booking.refundAmount = refundAmount;
  booking.penaltyPercent = penaltyPercent;

  // Cập nhật vào SQL Server
  try {
    const pool = await getDbPool();
    if (pool) {
      await pool.request()
        .input('code', booking.bookingCode)
        .input('status', booking.status)
        .query(`
          UPDATE dbo.bookings 
          SET booking_status = @status, updated_at = GETDATE()
          WHERE booking_code = @code
        `);
    }
  } catch (sqlErr) {
    console.error('[SQL Server] Lỗi cập nhật hủy booking:', sqlErr.message);
  }

  // Hoàn trả lại số chỗ trống (Inventory)
  const tour = toursData.find((t) => t.id === booking.tourId);
  if (tour) {
    const schedule = tour.schedules.find((s) => s.id === booking.scheduleId);
    if (schedule) {
      schedule.bookedSlots = Math.max(0, schedule.bookedSlots - (booking.numAdults + booking.numChildren));
      schedule.status = 'AVAILABLE';
    }
  }

  res.json({
    success: true,
    message: 'Yêu cầu hủy đơn đã được xử lý theo chính sách',
    data: {
      bookingCode: booking.bookingCode,
      daysBeforeDeparture: diffDays,
      refundPercent,
      penaltyPercent,
      refundAmount,
      status: booking.status
    }
  });
});

// 9. Gửi đánh giá cho tour đã hoàn thành
app.post('/api/reviews', (req, res) => {
  const { bookingId, tourId, rating, comment, photos, authorName } = req.body;

  // Kiểm tra đơn đã hoàn thành chưa
  const booking = bookingsData.find((b) => b.id === bookingId);
  if (!booking || booking.status !== 'COMPLETED') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ du khách đã hoàn thành chuyến đi mới có thể gửi đánh giá'
    });
  }

  const newReview = {
    id: `rev-${Date.now()}`,
    tourId,
    bookingId,
    authorName: authorName || booking.contactName,
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    rating: Number(rating) || 5,
    date: new Date().toLocaleDateString('vi-VN'),
    comment,
    photos: photos || []
  };

  reviewsData.unshift(newReview);

  // Cập nhật điểm rating của tour
  const tour = toursData.find((t) => t.id === tourId);
  if (tour) {
    const tourRevs = reviewsData.filter((r) => r.tourId === tourId);
    const avg = tourRevs.reduce((acc, cur) => acc + cur.rating, 0) / tourRevs.length;
    tour.ratingAverage = Number(avg.toFixed(1));
    tour.reviewCount = tourRevs.length;
  }

  res.status(201).json({
    success: true,
    message: 'Cảm ơn bạn đã gửi đánh giá chuyến đi!',
    data: newReview
  });
});

// 10. Admin: Thống kê & Báo cáo Dashboard
app.get('/api/admin/dashboard', (req, res) => {
  const totalBookings = bookingsData.length;
  const completedOrPaid = bookingsData.filter(
    (b) => b.status === 'CONFIRMED' || b.status === 'PAID' || b.status === 'COMPLETED'
  );
  const totalRevenue = completedOrPaid.reduce((sum, b) => sum + Number(b.finalAmount), 0);
  const cancelledBookings = bookingsData.filter(
    (b) => b.status === 'CANCELLED' || b.status === 'REFUNDED'
  ).length;

  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        totalBookings,
        completedBookings: completedOrPaid.length,
        cancelledBookings,
        cancellationRate: totalBookings ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : 0,
        activeTours: toursData.filter((t) => t.status === 'ACTIVE').length
      },
      revenueChart: [
        { month: 'Tháng 5', revenue: 42000000 },
        { month: 'Tháng 6', revenue: 68000000 },
        { month: 'Tháng 7', revenue: 95000000 },
        { month: 'Tháng 8', revenue: 78000000 },
        { month: 'Tháng 9', revenue: 84000000 },
        { month: 'Tháng 10', revenue: 112000000 }
      ],
      topTours: toursData.slice(0, 3).map((t) => ({
        id: t.id,
        title: t.title,
        bookingsCount: t.reviewCount,
        rating: t.ratingAverage
      }))
    }
  });
});

// 11. Admin: Cập nhật trạng thái đơn đặt
app.patch('/api/admin/bookings/:id/status', (req, res) => {
  const { status } = req.body;
  const booking = bookingsData.find((b) => b.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }

  booking.status = status;
  res.json({
    success: true,
    message: `Cập nhật trạng thái đơn thành ${status} thành công`,
    data: booking
  });
});

// ============================================================================
// PHÂN HỆ PHÂN QUYỀN – RBAC QUERIES (read-only, served by index.js)
// Full register/login/forgot/reset handled by /api/auth router above
// ============================================================================

// Lấy danh sách vai trò hệ thống từ SQL Server
app.get('/api/auth/roles', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT role_id, role_name, description FROM dbo.roles ORDER BY role_id ASC;
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Lấy danh sách người dùng kèm vai trò từ SQL Server
app.get('/api/auth/users', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        u.user_id,
        u.full_name,
        u.email,
        u.phone_number,
        r.role_id,
        r.role_name,
        r.description AS role_description,
        u.is_active,
        u.created_at
      FROM dbo.users u
      INNER JOIN dbo.roles r ON u.role_id = r.role_id
      ORDER BY r.role_id ASC, u.user_id ASC;
    `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// API Đăng nhập phân quyền
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email đăng nhập' });
  }

  try {
    const pool = await getDbPool();
    const result = await pool.request()
      .input('email', email.trim().toLowerCase())
      .query(`
        SELECT 
          u.user_id,
          u.full_name,
          u.email,
          u.phone_number,
          u.password_hash,
          r.role_id,
          r.role_name,
          r.description AS role_description,
          u.is_active
        FROM dbo.users u
        INNER JOIN dbo.roles r ON u.role_id = r.role_id
        WHERE LOWER(u.email) = @email;
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại trong hệ thống' });
    }

    const user = result.recordset[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa' });
    }

    res.json({
      success: true,
      message: `Đăng nhập thành công với vai trò ${user.role_name}`,
      data: {
        userId: user.user_id,
        fullName: user.full_name,
        email: user.email,
        phone: user.phone_number,
        role: user.role_name,
        roleDescription: user.role_description,
        isAdmin: user.role_name === 'SUPER_ADMIN' || user.role_name === 'ADMIN',
        isStaff: user.role_name === 'STAFF',
        isUser: user.role_name === 'USER'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 12. Kiểm tra kết nối SQL Server
app.get('/api/db/health', async (req, res) => {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        DB_NAME() AS current_database,
        (SELECT COUNT(*) FROM sys.tables) AS total_tables
    `);
    res.json({
      success: true,
      status: 'CONNECTED',
      database: result.recordset[0].current_database,
      totalTables: result.recordset[0].total_tables,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 'DISCONNECTED',
      error: err.message
    });
  }
});

app.listen(PORT, async () => {
  console.log(`[Travel With Me API] Server running at http://localhost:${PORT}`);
  try {
    const pool = await getDbPool();
    console.log('[Travel With Me API] ✅ Đã kết nối thành công với Microsoft SQL Server (Database: TravelWithMe)!');
  } catch (err) {
    console.warn('[Travel With Me API] ⚠️ Chưa thể kết nối SQL Server:', err.message);
  }
});
