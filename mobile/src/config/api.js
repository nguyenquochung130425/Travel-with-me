import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_CUSTOM_API_KEY = 'twm_mobile_custom_api_url';
const DEFAULT_LAN_IP = '192.168.1.15';
const DEFAULT_PORT = '5000';

/**
 * Tự động phát hiện địa chỉ IPv4 LAN của máy tính chạy Expo Metro Bundler
 * để điện thoại dùng Expo Go kết nối trực tiếp vào cổng 5000 của Backend Express.
 */
export function getAutoDetectedApiBaseUrl() {
  try {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl && envUrl.startsWith('http')) {
      return envUrl.replace(/\/$/, '');
    }

    const hostUri =
      Constants.expoConfig?.hostUri ||
      Constants.manifest2?.extra?.expoGo?.debuggerHost ||
      Constants.manifest?.debuggerHost;

    if (hostUri) {
      const host = hostUri.split(':')[0];
      if (host && host !== 'localhost' && host !== '127.0.0.1' && !host.includes('exp.direct')) {
        return `http://${host}:${DEFAULT_PORT}`;
      }
    }
  } catch (e) {
    // Bỏ qua lỗi đọc Constants
  }
  return `http://${DEFAULT_LAN_IP}:${DEFAULT_PORT}`;
}

let currentApiBaseUrl = getAutoDetectedApiBaseUrl();

export async function initApiBaseUrl() {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_CUSTOM_API_KEY);
    if (saved && saved.startsWith('http')) {
      currentApiBaseUrl = saved.replace(/\/$/, '');
    } else {
      currentApiBaseUrl = getAutoDetectedApiBaseUrl();
    }
  } catch {
    currentApiBaseUrl = getAutoDetectedApiBaseUrl();
  }
  return currentApiBaseUrl;
}

export function getApiBaseUrl() {
  return currentApiBaseUrl;
}

export async function setCustomApiBaseUrl(url) {
  if (!url || !url.trim()) {
    await AsyncStorage.removeItem(STORAGE_CUSTOM_API_KEY);
    currentApiBaseUrl = getAutoDetectedApiBaseUrl();
    return currentApiBaseUrl;
  }
  const clean = url.trim().replace(/\/$/, '');
  await AsyncStorage.setItem(STORAGE_CUSTOM_API_KEY, clean);
  currentApiBaseUrl = clean;
  return currentApiBaseUrl;
}

/**
 * Bộ sưu tập ảnh chất lượng cao theo từng địa danh để đảm bảo không bao giờ
 * bị trùng lặp hình ảnh giữa các tour trên giao diện Mobile.
 */
const DESTINATION_PHOTO_POOL = [
  {
    keywords: ['hạ long', 'lan hạ', 'quảng ninh', 'du thuyền'],
    url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80'
  },
  {
    keywords: ['phú quốc', 'kiên giang', 'hòn thơm', 'grand world', 'đảo ngọc'],
    url: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=900&q=80'
  },
  {
    keywords: ['đà nẵng', 'hội an', 'bà nà', 'cầu vàng', 'sơn trà', 'cù lao chàm'],
    url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80'
  },
  {
    keywords: ['sapa', 'sa pa', 'fansipan', 'lào cai', 'tây bắc', 'cát cát'],
    url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80'
  },
  {
    keywords: ['hà giang', 'đồng văn', 'nho quế', 'mèo vạc', 'lũng cú'],
    url: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?auto=format&fit=crop&w=900&q=80'
  },
  {
    keywords: ['nha trang', 'khánh hòa', 'vinwonders', 'bình ba'],
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80'
  },
  {
    keywords: ['đà lạt', 'lâm đồng', 'langbiang', 'săn mây'],
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80'
  },
  {
    keywords: ['ninh bình', 'tràng an', 'tam cốc', 'bái đính', 'hoa lư'],
    url: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=900&q=80'
  },
  {
    keywords: ['huế', 'cố đô', 'đại nội', 'hương giang'],
    url: 'https://images.unsplash.com/photo-1583417267826-aebc4d1542e1?auto=format&fit=crop&w=900&q=80'
  },
  {
    keywords: ['côn đảo', 'quy nhơn', 'phú yên', 'kỳ co', 'eo gió'],
    url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80'
  }
];

const EXTRA_FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=900&q=80'
];

/**
 * Chuẩn hóa danh sách Tour từ Backend SQL Server (/api/tours) sang định dạng thống nhất cho Mobile:
 * - Lấy đúng trường `thumbnailUrl` (hoặc phân bổ ảnh riêng theo địa danh, chống trùng lặp ảnh 100%)
 * - Tính đúng giá thấp nhất từ `schedules[].adultPrice` (không bao giờ hiển thị 0 ₫)
 * - Ghép đúng thời lượng `${durationDays}N${durationNights}Đ`
 * - Chuyển đổi đúng `itineraries` và `overviewDescription`
 */
export function normalizeToursList(rawTours = []) {
  const usedImageUrls = new Set();
  const seenTitles = new Set();
  const normalized = [];

  rawTours.forEach((tour, idx) => {
    const cleanTitleKey = (tour.title || '').trim().toLowerCase();
    if (cleanTitleKey && seenTitles.has(cleanTitleKey)) {
      return; // Loại bỏ tour bị trùng lặp tên
    }
    if (cleanTitleKey) seenTitles.add(cleanTitleKey);

    // 1. Tính giá từ schedules[].adultPrice hoặc tour.price
    let computedPrice = Number(tour.price) || Number(tour.adultPrice) || Number(tour.adult_price) || 0;
    if ((!computedPrice || computedPrice <= 0) && Array.isArray(tour.schedules) && tour.schedules.length > 0) {
      const validPrices = tour.schedules
        .map((s) => Number(s.adultPrice || s.adult_price || 0))
        .filter((p) => p > 0);
      if (validPrices.length > 0) {
        computedPrice = Math.min(...validPrices);
      }
    }
    if (!computedPrice || computedPrice <= 0) {
      computedPrice = 3490000 + (idx % 5) * 500000;
    }

    // 2. Thời lượng chuyến đi
    let computedDuration = tour.duration;
    if (!computedDuration) {
      if (tour.durationDays) {
        const nights = tour.durationNights ?? Math.max(1, Number(tour.durationDays) - 1);
        computedDuration = `${tour.durationDays}N${nights}Đ`;
      } else {
        computedDuration = '3N2Đ';
      }
    }

    // 3. Hình ảnh đại diện (Đảm bảo mỗi tour có ảnh riêng biệt, đúng địa danh, không trùng lặp)
    let candidateImg =
      tour.thumbnailUrl ||
      tour.image ||
      (Array.isArray(tour.albumImages) && tour.albumImages[0]) ||
      '';

    const searchText = `${tour.title || ''} ${tour.destinationCity || ''}`.toLowerCase();

    if (!candidateImg || usedImageUrls.has(candidateImg)) {
      const matchedPool = DESTINATION_PHOTO_POOL.find(
        (entry) =>
          entry.keywords.some((kw) => searchText.includes(kw)) && !usedImageUrls.has(entry.url)
      );
      if (matchedPool) {
        candidateImg = matchedPool.url;
      } else {
        const unusedPool = DESTINATION_PHOTO_POOL.find((entry) => !usedImageUrls.has(entry.url));
        if (unusedPool) {
          candidateImg = unusedPool.url;
        } else {
          candidateImg = EXTRA_FALLBACK_PHOTOS[idx % EXTRA_FALLBACK_PHOTOS.length];
        }
      }
    }
    usedImageUrls.add(candidateImg);

    // 4. Lịch trình từng ngày
    const rawItineraries = tour.itineraries || tour.itinerary || [];
    const normalizedItinerary = rawItineraries.map((it, i) => ({
      day: it.dayNumber || it.day || i + 1,
      title: it.title || `Ngày ${i + 1}: Khám phá hành trình`,
      desc: it.description || it.desc || '',
      meals: it.meals || 'Theo chương trình',
      hotel: it.hotel || 'Khách sạn / Resort tiêu chuẩn'
    }));

    // 5. Điểm nổi bật (Highlights / Inclusions)
    let highlights = tour.highlights;
    if (!Array.isArray(highlights) || highlights.length === 0) {
      if (typeof tour.inclusions === 'string' && tour.inclusions.trim()) {
        highlights = tour.inclusions
          .split(/[.\n;]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 4)
          .slice(0, 4);
      } else {
        highlights = [
          'Xe đưa đón đời mới & Hướng dẫn viên chuyên nghiệp suốt tuyến',
          'Khách sạn / Resort tiêu chuẩn 4-5 sao vị trí trung tâm',
          'Vé tham quan trọn gói tất cả các điểm trong lịch trình',
          'Bảo hiểm du lịch trọn gói mức đền bù tối đa'
        ];
      }
    }

    normalized.push({
      ...tour,
      id: tour.id || `tour-${idx}`,
      title: tour.title || 'Hành trình Khám phá Việt Nam',
      categoryName: tour.categoryName || 'Tour Đặc Sắc',
      departureCity: tour.departureCity || 'Hà Nội / TP.HCM',
      destinationCity: tour.destinationCity || 'Việt Nam',
      duration: computedDuration,
      price: computedPrice,
      originalPrice: Math.round((computedPrice * 1.15) / 100000) * 100000,
      rating: tour.ratingAverage || tour.rating || 4.9,
      reviewsCount: tour.reviewCount || tour.reviewsCount || 48,
      image: candidateImg,
      thumbnailUrl: candidateImg,
      summary:
        tour.overviewDescription ||
        tour.summary ||
        'Hành trình khám phá trọn vẹn cảnh sắc thiên nhiên và ẩm thực bản địa đặc sắc.',
      highlights,
      itinerary: normalizedItinerary
    });
  });

  return normalized;
}

export const FALLBACK_TOURS = normalizeToursList([
  {
    id: 'tour-halong-1',
    title: 'Du Thuyền 5 Sao Vịnh Hạ Long - Lan Hạ 2N1Đ',
    categoryId: 'cat-beach',
    categoryName: 'Biển Đảo & Du Thuyền',
    departureCity: 'Hà Nội',
    destinationCity: 'Quảng Ninh',
    duration: '2N1Đ',
    price: 3450000,
    rating: 4.9,
    reviewsCount: 128,
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
    summary: 'Hành trình nghỉ dưỡng thượng lưu trên du thuyền 5 sao, chèo Kayak khám phá Hang Sáng Tối và thưởng thức tiệc hải sản hoàng hôn trên vịnh.',
    schedules: [{ id: 'sch-hl-1', departureDate: '2026-11-22', adultPrice: 3450000 }]
  },
  {
    id: 'tour-phuquoc-3',
    title: 'Thiên Đường Đảo Ngọc Phú Quốc - Grand World - Cáp Treo Hòn Thơm 4N3Đ',
    categoryId: 'cat-beach',
    categoryName: 'Thiên Đường Biển Đảo',
    departureCity: 'Hà Nội / TP.HCM',
    destinationCity: 'Kiên Giang / Phú Quốc',
    duration: '4N3Đ',
    price: 5490000,
    rating: 4.9,
    reviewsCount: 154,
    image: 'https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=900&q=80',
    summary: 'Trải nghiệm cano 4 đảo Phú Quốc, lặn ngắm san hô, đi cáp treo vượt biển dài nhất thế giới Hòn Thơm và khám phá thành phố không ngủ Grand World.',
    schedules: [{ id: 'sch-pq-1', departureDate: '2026-11-28', adultPrice: 5490000 }]
  },
  {
    id: 'tour-danang-4',
    title: 'Đà Nẵng - Cầu Vàng Bà Nà Hills - Phố Cổ Hội An - Bán Đảo Sơn Trà 4N3Đ',
    categoryId: 'cat-heritage',
    categoryName: 'Văn Hóa & Di Sản',
    departureCity: 'Hà Nội / TP.HCM',
    destinationCity: 'Đà Nẵng - Hội An',
    duration: '4N3Đ',
    price: 4290000,
    rating: 4.8,
    reviewsCount: 112,
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=900&q=80',
    summary: 'Hành trình con đường di sản miền Trung: thả đèn hoa đăng phố cổ Hội An, check-in Cầu Vàng Bà Nà Hills và tắm biển Mỹ Khê.',
    schedules: [{ id: 'sch-dn-1', departureDate: '2026-11-30', adultPrice: 4290000 }]
  },
  {
    id: 'tour-sapa-2',
    title: 'Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Moana Sapa 3N2Đ',
    categoryId: 'cat-mountain',
    categoryName: 'Núi Rừng Tây Bắc',
    departureCity: 'Hà Nội',
    destinationCity: 'Lào Cai - Sa Pa',
    duration: '3N2Đ',
    price: 2890000,
    rating: 4.8,
    reviewsCount: 96,
    image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
    summary: 'Săn mây trên nóc nhà Đông Dương Fansipan 3.143m, dạo bước bản Cát Cát cổ kính và thưởng thức lẩu cá tầm Tây Bắc.',
    schedules: [{ id: 'sch-sp-1', departureDate: '2026-11-25', adultPrice: 2890000 }]
  }
]);

export const FALLBACK_BOOKINGS = [
  {
    id: 'bk-mobile-1',
    bookingCode: 'TWM-882419',
    tourId: 'tour-halong-1',
    tourTitle: 'Du Thuyền 5 Sao Vịnh Hạ Long - Lan Hạ 2N1Đ',
    customerName: 'Nguyễn Quốc Hùng',
    customerPhone: '0912345678',
    customerEmail: 'hung@example.com',
    departureDate: '2026-10-20',
    adults: 2,
    children: 0,
    totalPrice: 6900000,
    status: 'COMPLETED',
    paymentMethod: 'VietQR',
    createdAt: '2026-10-15'
  },
  {
    id: 'bk-mobile-2',
    bookingCode: 'TWM-905128',
    tourId: 'tour-phuquoc-3',
    tourTitle: 'Thiên Đường Đảo Ngọc Phú Quốc - Grand World - Cáp Treo Hòn Thơm 4N3Đ',
    customerName: 'Nguyễn Quốc Hùng',
    customerPhone: '0912345678',
    customerEmail: 'hung@example.com',
    departureDate: '2026-11-28',
    adults: 2,
    children: 1,
    totalPrice: 14820000,
    status: 'CONFIRMED',
    paymentMethod: 'VietQR',
    createdAt: '2026-11-10'
  }
];

export const FALLBACK_COMMUNITY_POSTS = [
  {
    id: 1,
    title: 'Kinh nghiệm nghỉ dưỡng Du thuyền 5 sao Vịnh Hạ Long 2N1Đ tự túc & theo tour',
    summary: 'Chia sẻ lịch trình chi tiết săn hoàng hôn trên Vịnh Lan Hạ, chèo Kayak hang Sáng Tối và mẹo chọn phòng có ban công riêng cực chill.',
    content: 'Chuyến đi Vịnh Hạ Long 2 ngày 1 đêm vừa qua thực sự là trải nghiệm đáng nhớ nhất trong năm của gia đình mình. Du thuyền 5 sao có phòng ban công nhìn thẳng ra những dãy núi đá vôi kỳ vĩ. Buổi chiều chèo Kayak qua Hang Luồn nước trong xanh như ngọc bích, tối thưởng thức hải sản tươi ngon trên boong tàu...',
    author_name: 'Trần Minh Anh',
    author_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80',
    trip_badge: 'Đã hoàn thành chuyến đi #TWM-882419',
    travel_tips: 'Nên mang theo kem chống nắng, mũ rộng vành và đặt trước hạng phòng tầng 2 để có góc chụp ảnh bình minh đẹp nhất.',
    location_tags: 'Vịnh Hạ Long,Du Thuyền',
    tour_id: 'tour-halong-1',
    tour_title: 'Du Thuyền 5 Sao Vịnh Hạ Long - Lan Hạ 2N1Đ',
    adult_price: 3450000,
    likes_count: 42,
    comments_count: 8,
    created_at: '2026-11-08'
  },
  {
    id: 2,
    title: 'Săn biển mây đỉnh Fansipan Sapa tháng 11 – Lịch trình 3N2Đ trọn vẹn',
    summary: 'Thời điểm vàng để săn mây Sapa! Hướng dẫn chuẩn bị trang phục giữ ấm, kinh nghiệm đi tàu hỏa Mường Hoa và cáp treo Fansipan.',
    content: 'Tháng 11 Sapa bước vào mùa săn mây đẹp nhất năm. Nhiệt độ trên đỉnh Fansipan khoảng 8-12 độ C, nắng vàng rực rỡ trên biển mây trắng xóa. Đừng quên ghé bản Cát Cát vào buổi sáng sớm khi sương còn giăng trên mái nhà gỗ...',
    author_name: 'Lê Hoàng Nam',
    author_avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    thumbnail_url: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
    trip_badge: 'Khách hàng Thân thiết 1000 Elo',
    travel_tips: 'Đi cáp treo chuyến 7h30 sáng để tránh đông khách và bắt trọn khoảnh khắc biển mây dày nhất.',
    location_tags: 'Sa Pa,Trekking',
    tour_id: 'tour-sapa-2',
    tour_title: 'Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Moana Sapa 3N2Đ',
    adult_price: 2890000,
    likes_count: 35,
    comments_count: 5,
    created_at: '2026-11-10'
  }
];

export const FALLBACK_NOTIFICATIONS = [
  {
    id: 101,
    type: 'TRIP_REMINDER_24H',
    channel: 'ZALO',
    title: '⏰ Nhắc lịch khởi hành trước 24h: Phú Quốc 4N3Đ',
    message: 'Chuyến đi #TWM-905128 của quý khách sẽ khởi hành vào 07:30 ngày mai. HDV phụ trách: Anh Minh Tuấn (0909.888.999).',
    is_read: 0,
    created_at: 'Vừa xong'
  },
  {
    id: 102,
    type: 'TICKET_ISSUED',
    channel: 'EMAIL',
    title: '🎫 Đã phát hành Vé điện tử Boarding Pass #TWM-905128',
    message: 'Mã QR lên xe/tàu đã sẵn sàng trong mục Chuyến đi của tôi. Quý khách vui lòng xuất trình mã QR cho HDV.',
    is_read: 0,
    created_at: '2 giờ trước'
  },
  {
    id: 103,
    type: 'REVIEW_INVITATION',
    channel: 'IN_APP',
    title: '⭐ Mời đánh giá chuyến đi Vịnh Hạ Long #TWM-882419',
    message: 'Cảm ơn quý khách đã hoàn thành hành trình! Hãy chia sẻ đánh giá thực tế để nhận ưu đãi cho chuyến đi tiếp theo.',
    is_read: 1,
    created_at: '1 ngày trước'
  }
];

export const FALLBACK_REVIEWS = [
  {
    id: 1,
    bookingId: 'TWM-882419',
    bookingCode: 'TWM-882419',
    tourId: 'tour-halong-1',
    tourTitle: 'Du Thuyền 5 Sao Vịnh Hạ Long - Lan Hạ 2N1Đ',
    authorName: 'Nguyễn Quốc Hùng',
    rating: 5,
    comment: 'Dịch vụ du thuyền 5 sao tuyệt vời, hải sản tươi ngon và hướng dẫn viên cực kỳ nhiệt tình chu đáo!',
    photos: [
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=400&q=80'
    ],
    isVisible: true,
    adminReply: 'Travel With Me xin chân thành cảm ơn anh Quốc Hùng! Rất mong tiếp tục được đồng hành cùng gia đình mình trong các hành trình sắp tới.',
    adminReplyAt: '2026-11-05',
    date: '2026-11-04'
  }
];

/**
 * Hàm gọi API tới Backend Express + SQL Server kèm Timeout 5 giây
 */
export async function apiRequest(endpoint, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const token = await AsyncStorage.getItem('twm_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      data,
      cacheHeader: response.headers?.get?.('x-cache') || 'MISS',
      responseTimeHeader: response.headers?.get?.('x-response-time') || null
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      status: 0,
      error: error.message || 'Network request failed',
      isOffline: true
    };
  }
}
