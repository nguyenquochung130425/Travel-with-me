import { getDbPool, sql } from '../src/db.js';
import { mockTours } from '../src/mockData.js';

async function seedTours() {
  const pool = await getDbPool();
  console.log('[Seed Tours] Bắt đầu đồng bộ 4 tour mẫu vào SQL Server...');

  for (const tour of mockTours) {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Ensure Category
      const catRes = await new sql.Request(transaction)
        .input('name', sql.NVarChar(100), tour.categoryName)
        .query('SELECT category_id FROM dbo.categories WHERE category_name = @name');
      let categoryId = catRes.recordset[0]?.category_id;
      if (!categoryId) {
        const catIns = await new sql.Request(transaction)
          .input('name', sql.NVarChar(100), tour.categoryName)
          .input('slug', sql.VarChar(120), tour.categoryId)
          .query('INSERT INTO dbo.categories (category_name, slug) OUTPUT INSERTED.category_id VALUES (@name, @slug)');
        categoryId = catIns.recordset[0].category_id;
      }

      // 2. Ensure Destination
      const destRes = await new sql.Request(transaction)
        .input('name', sql.NVarChar(100), tour.destinationCity)
        .query('SELECT destination_id FROM dbo.destinations WHERE destination_name = @name');
      let destinationId = destRes.recordset[0]?.destination_id;
      if (!destinationId) {
        const destIns = await new sql.Request(transaction)
          .input('name', sql.NVarChar(100), tour.destinationCity)
          .input('region', sql.NVarChar(50), 'Việt Nam')
          .query('INSERT INTO dbo.destinations (destination_name, region) OUTPUT INSERTED.destination_id VALUES (@name, @region)');
        destinationId = destIns.recordset[0].destination_id;
      }

      // 3. Check if tour exists by title
      const existingTour = await new sql.Request(transaction)
        .input('title', sql.NVarChar(200), tour.title)
        .query('SELECT tour_id FROM dbo.tours WHERE title = @title');

      let tourId;
      const firstSchedule = tour.schedules[0];

      if (existingTour.recordset.length > 0) {
        tourId = existingTour.recordset[0].tour_id;
        console.log(`Tour "${tour.title}" đã tồn tại với ID ${tourId}, cập nhật...`);
        await new sql.Request(transaction)
          .input('tourId', sql.BigInt, tourId)
          .input('title', sql.NVarChar(200), tour.title)
          .input('categoryId', sql.Int, categoryId)
          .input('destinationId', sql.Int, destinationId)
          .input('durationDays', sql.Int, tour.durationDays)
          .input('durationNights', sql.Int, tour.durationNights)
          .input('departureLocation', sql.NVarChar(150), tour.departureCity)
          .input('transportation', sql.NVarChar(100), tour.transportType)
          .input('adultPrice', sql.Decimal(18, 2), firstSchedule.adultPrice)
          .input('childPrice', sql.Decimal(18, 2), firstSchedule.childPrice)
          .input('infantPrice', sql.Decimal(18, 2), firstSchedule.infantPrice)
          .input('overviewDescription', sql.NVarChar(sql.MAX), tour.overviewDescription)
          .input('inclusions', sql.NVarChar(sql.MAX), tour.inclusions || '')
          .input('exclusions', sql.NVarChar(sql.MAX), tour.exclusions || '')
          .input('cancellationPolicy', sql.NVarChar(sql.MAX), tour.cancellationPolicy || '')
          .input('thumbnailUrl', sql.NVarChar(500), tour.thumbnailUrl)
          .input('tourType', sql.VarChar(30), tour.tourType || 'RESORT')
          .input('isFeatured', sql.Bit, Boolean(tour.isFeatured))
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
            WHERE tour_id = @tourId;
          `);
      } else {
        const insTour = await new sql.Request(transaction)
          .input('title', sql.NVarChar(200), tour.title)
          .input('slug', sql.VarChar(220), tour.slug)
          .input('categoryId', sql.Int, categoryId)
          .input('destinationId', sql.Int, destinationId)
          .input('durationDays', sql.Int, tour.durationDays)
          .input('durationNights', sql.Int, tour.durationNights)
          .input('departureLocation', sql.NVarChar(150), tour.departureCity)
          .input('transportation', sql.NVarChar(100), tour.transportType)
          .input('adultPrice', sql.Decimal(18, 2), firstSchedule.adultPrice)
          .input('childPrice', sql.Decimal(18, 2), firstSchedule.childPrice)
          .input('infantPrice', sql.Decimal(18, 2), firstSchedule.infantPrice)
          .input('overviewDescription', sql.NVarChar(sql.MAX), tour.overviewDescription)
          .input('inclusions', sql.NVarChar(sql.MAX), tour.inclusions || '')
          .input('exclusions', sql.NVarChar(sql.MAX), tour.exclusions || '')
          .input('cancellationPolicy', sql.NVarChar(sql.MAX), tour.cancellationPolicy || '')
          .input('thumbnailUrl', sql.NVarChar(500), tour.thumbnailUrl)
          .input('tourType', sql.VarChar(30), tour.tourType || 'RESORT')
          .input('isFeatured', sql.Bit, Boolean(tour.isFeatured))
          .input('ratingAvg', sql.Decimal(3, 2), tour.ratingAverage || 5.0)
          .input('totalReviews', sql.Int, tour.reviewCount || 10)
          .query(`
            INSERT INTO dbo.tours (
              title, slug, category_id, destination_id, duration_days, duration_nights,
              departure_location, transportation, adult_price, child_price, infant_price,
              overview_description, inclusions, exclusions, cancellation_policy,
              thumbnail_url, tour_type, is_featured, rating_avg, total_reviews
            )
            OUTPUT INSERTED.tour_id
            VALUES (
              @title, @slug, @categoryId, @destinationId, @durationDays, @durationNights,
              @departureLocation, @transportation, @adultPrice, @childPrice, @infantPrice,
              @overviewDescription, @inclusions, @exclusions, @cancellationPolicy,
              @thumbnailUrl, @tourType, @isFeatured, @ratingAvg, @totalReviews
            );
          `);
        tourId = insTour.recordset[0].tour_id;
        console.log(`Đã thêm tour mới "${tour.title}" với ID ${tourId}`);
      }

      // 4. Save Schedules
      await new sql.Request(transaction).input('tourId', sql.BigInt, tourId).query('DELETE FROM dbo.tour_schedules WHERE tour_id = @tourId');
      for (const s of tour.schedules) {
        await new sql.Request(transaction)
          .input('tourId', sql.BigInt, tourId)
          .input('departureDate', sql.Date, s.departureDate)
          .input('returnDate', sql.Date, s.returnDate)
          .input('adultPrice', sql.Decimal(18, 2), s.adultPrice)
          .input('childPrice', sql.Decimal(18, 2), s.childPrice)
          .input('infantPrice', sql.Decimal(18, 2), s.infantPrice)
          .input('maxCapacity', sql.Int, s.maxCapacity)
          .input('minCapacity', sql.Int, s.minCapacity)
          .input('bookedSlots', sql.Int, s.bookedSlots || 0)
          .input('status', sql.VarChar(20), s.status || 'AVAILABLE')
          .query(`
            INSERT INTO dbo.tour_schedules (
              tour_id, departure_date, return_date, adult_price, child_price, infant_price,
              max_capacity, min_capacity, booked_slots, hold_slots, status
            )
            VALUES (
              @tourId, @departureDate, @returnDate, @adultPrice, @childPrice, @infantPrice,
              @maxCapacity, @minCapacity, @bookedSlots, 0, @status
            );
          `);
      }

      // 5. Save Images
      await new sql.Request(transaction).input('tourId', sql.BigInt, tourId).query('DELETE FROM dbo.tour_images WHERE tour_id = @tourId');
      for (const img of tour.albumImages || []) {
        await new sql.Request(transaction)
          .input('tourId', sql.BigInt, tourId)
          .input('imageUrl', sql.NVarChar(500), img)
          .query('INSERT INTO dbo.tour_images (tour_id, image_url, is_thumbnail) VALUES (@tourId, @imageUrl, 0)');
      }

      // 6. Save Itineraries
      await new sql.Request(transaction).input('tourId', sql.BigInt, tourId).query('DELETE FROM dbo.tour_itineraries WHERE tour_id = @tourId');
      for (const it of tour.itineraries || []) {
        await new sql.Request(transaction)
          .input('tourId', sql.BigInt, tourId)
          .input('dayNumber', sql.Int, it.dayNumber)
          .input('dayTitle', sql.NVarChar(200), it.title)
          .input('description', sql.NVarChar(sql.MAX), it.description)
          .input('activities', sql.NVarChar(sql.MAX), JSON.stringify(it.activities || []))
          .input('meals', sql.NVarChar(100), it.meals || '')
          .input('hotel', sql.NVarChar(200), it.hotel || '')
          .query(`
            INSERT INTO dbo.tour_itineraries (tour_id, day_number, day_title, description, activities, meals, hotel)
            VALUES (@tourId, @dayNumber, @dayTitle, @description, @activities, @meals, @hotel);
          `);
      }

      await transaction.commit();
      console.log(`✅ Hoàn tất đồng bộ tour ID ${tourId}`);
    } catch (err) {
      await transaction.rollback();
      console.error(`❌ Lỗi khi seed tour "${tour.title}":`, err.message);
    }
  }

  console.log('🎉 Toàn bộ tour đã được đồng bộ vào SQL Server!');
  process.exit(0);
}

seedTours().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
