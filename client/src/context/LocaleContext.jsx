import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const LocaleContext = createContext(null);

export const translations = {
  vi: {
    // Navbar & Header
    brandTitle: 'TRAVEL WITH ME',
    brandSlogan: 'Trải Nghiệm Du Lịch Đích Thực',
    exploreTours: 'Khám Phá Tour',
    hotTours: 'Tour Bán Chạy',
    topics: 'Chủ Đề Du Lịch',
    myTrips: 'Chuyến Đi Của Tôi',
    wishlist: 'Tour Yêu Thích',
    community: 'Cộng Đồng Du Lịch',
    travelStories: 'Nhật Ký Hành Trình',
    adminPortal: 'Kênh Quản Trị',
    clientPortal: 'Giao Diện Khách',
    notifications: 'Thông Báo',
    login: 'Đăng Nhập',
    logout: 'Đăng Xuất',
    hideMenu: 'Ẩn Menu',
    showMenu: 'Hiện Menu',
    specialOffer: 'Ưu đãi mùa hè giảm tới 30% cho tour gia đình',

    // Hero & Filter
    heroTitle: 'Hành Trình Độc Bản, Ký Ức Vô Giá',
    heroSubtitle: 'Khám phá hơn 100+ tour du lịch cao cấp khắp Việt Nam. Đặt chỗ tức thì, giữ chỗ chống overbooking và thanh toán an toàn.',
    searchPlaceholder: 'Tìm điểm đến, tên tour hoặc địa danh...',
    departureCity: 'Điểm khởi hành',
    destinationCity: 'Điểm đến',
    allCities: 'Tất cả điểm đi',
    allDestinations: 'Tất cả điểm đến',
    priceRange: 'Khoảng giá',
    tourCategory: 'Loại hình tour',
    allCategories: 'Tất cả loại hình',
    searchNow: 'Tìm Kiếm Ngay',
    resetFilter: 'Đặt lại bộ lọc',

    // Tour Card & Details
    fromPrice: 'Giá từ',
    perPerson: 'khách',
    duration: 'Thời lượng',
    viewDetail: 'Xem Chi Tiết',
    bookNow: 'Đặt Tour Ngay',
    seatsLeft: 'chỗ trống khả dụng',
    soldOut: 'Đã hết chỗ',
    rating: 'Đánh giá',
    verifiedTrip: 'Chuyến đi thực tế',
    itinerary: 'Lịch trình chi tiết',
    inclusions: 'Dịch vụ bao gồm',
    exclusions: 'Dịch vụ chưa bao gồm',
    reviewsList: 'Đánh giá & Nhận xét từ du khách',
    writeReview: 'Viết Đánh Giá',
    adminReplyBadge: 'Phản hồi chính thức từ Travel With Me',

    // Community & UGC
    communityTitle: 'Không Gian Cộng Đồng & Nhật Ký Hành Trình',
    communitySubtitle: 'Những câu chuyện, hình ảnh thực tế và mẹo du lịch được chia sẻ bởi du khách sau chuyến đi',
    createStory: 'Chia Sẻ Nhật Ký',
    readStory: 'Đọc Bài Viết',
    travelTips: 'Mẹo du lịch hữu ích',
    like: 'Thích',
    comment: 'Bình luận',
    share: 'Chia sẻ',
    shareCopied: 'Đã sao chép liên kết chia sẻ vào khay nhớ tạm!',
    bookSimilarTour: 'Đặt Chuyến Đi Tương Tự',

    // Notification Hub
    allNotifs: 'Tất cả',
    tripNotifs: 'Chuyến đi & Vé',
    reminderNotifs: 'Nhắc lịch 24h',
    promoNotifs: 'Khuyến mãi',
    communityNotifs: 'Cộng đồng',
    markAllRead: 'Đánh dấu tất cả đã đọc',
    simulate24hReminder: 'Thử nghiệm nhắc lịch 24h (Zalo ZNS / SMS)',
    noNotifs: 'Hiện chưa có thông báo mới nào',

    // Admin & Moderation
    reviewModeration: 'Đánh giá & Kiểm duyệt',
    totalReviews: 'Tổng số đánh giá',
    avgScore: 'Điểm trung bình',
    visibleReviews: 'Đang hiển thị',
    hiddenReviews: 'Đã ẩn kiểm duyệt',
    toggleHide: 'Ẩn đánh giá',
    toggleShow: 'Bỏ ẩn (Hiện)',
    sendReply: 'Gửi phản hồi',
    replyPlaceholder: 'Nhập nội dung phản hồi chính thức từ Ban Quản Trị...',
    cachePerformance: 'Tối Ưu Hiệu Năng Cache (Redis/FastCache)',
    flushCache: 'Xóa Cache',
    cacheEngine: 'Bộ nhớ đệm',
    avgLatency: 'Tốc độ phản hồi'
  },
  en: {
    // Navbar & Header
    brandTitle: 'TRAVEL WITH ME',
    brandSlogan: 'Authentic Travel Experiences',
    exploreTours: 'Explore Tours',
    hotTours: 'Trending Tours',
    topics: 'Travel Themes',
    myTrips: 'My Trips',
    wishlist: 'Wishlist',
    community: 'Community Hub',
    travelStories: 'Travel Stories',
    adminPortal: 'Admin Portal',
    clientPortal: 'Client Portal',
    notifications: 'Notifications',
    login: 'Sign In',
    logout: 'Log Out',
    hideMenu: 'Collapse Menu',
    showMenu: 'Expand Menu',
    specialOffer: 'Summer exclusive discount up to 30% for family tours',

    // Hero & Filter
    heroTitle: 'Unique Journeys, Priceless Memories',
    heroSubtitle: 'Explore over 100+ premium tours across Vietnam. Instant booking, real-time slot lock against overbooking, and verified reviews.',
    searchPlaceholder: 'Search destinations, tour names or landmarks...',
    departureCity: 'Departure City',
    destinationCity: 'Destination',
    allCities: 'All Departures',
    allDestinations: 'All Destinations',
    priceRange: 'Price Range',
    tourCategory: 'Tour Category',
    allCategories: 'All Categories',
    searchNow: 'Search Now',
    resetFilter: 'Reset Filters',

    // Tour Card & Details
    fromPrice: 'From',
    perPerson: 'person',
    duration: 'Duration',
    viewDetail: 'View Details',
    bookNow: 'Book Tour Now',
    seatsLeft: 'slots available',
    soldOut: 'Sold Out',
    rating: 'Rating',
    verifiedTrip: 'Verified Trip',
    itinerary: 'Detailed Itinerary',
    inclusions: 'Inclusions',
    exclusions: 'Exclusions',
    reviewsList: 'Traveler Reviews & Feedback',
    writeReview: 'Write a Review',
    adminReplyBadge: 'Official Response from Travel With Me',

    // Community & UGC
    communityTitle: 'Travel Community & Expedition Stories',
    communitySubtitle: 'Real experiences, authentic photos, and travel hacks shared by travelers after completed trips',
    createStory: 'Share Your Story',
    readStory: 'Read Story',
    travelTips: 'Helpful Travel Tips',
    like: 'Like',
    comment: 'Comment',
    share: 'Share',
    shareCopied: 'Share link copied to clipboard!',
    bookSimilarTour: 'Book Similar Tour',

    // Notification Hub
    allNotifs: 'All',
    tripNotifs: 'Trips & Tickets',
    reminderNotifs: '24h Reminder',
    promoNotifs: 'Promotions',
    communityNotifs: 'Community',
    markAllRead: 'Mark all as read',
    simulate24hReminder: 'Simulate 24h Reminder (Zalo ZNS / SMS)',
    noNotifs: 'No new notifications at this time',

    // Admin & Moderation
    reviewModeration: 'Reviews & Moderation',
    totalReviews: 'Total Reviews',
    avgScore: 'Average Rating',
    visibleReviews: 'Visible',
    hiddenReviews: 'Hidden (Moderated)',
    toggleHide: 'Hide Review',
    toggleShow: 'Show Publicly',
    sendReply: 'Send Reply',
    replyPlaceholder: 'Type official response from Travel With Me Management...',
    cachePerformance: 'Cache Optimization (Redis/FastCache)',
    flushCache: 'Flush Cache',
    cacheEngine: 'Cache Engine',
    avgLatency: 'Response Latency'
  }
};

const defaultRates = {
  VND: 1,
  USD: 0.0000393,
  EUR: 0.0000368,
  JPY: 0.00595
};

const currencySymbols = {
  VND: '₫',
  USD: '$',
  EUR: '€',
  JPY: '¥'
};

export function LocaleProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('twm_lang') || 'vi';
  });

  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('twm_curr') || 'VND';
  });

  const [rates, setRates] = useState(defaultRates);

  // Tải tỷ giá thực tế từ API Backend
  useEffect(() => {
    fetch('/api/exchange-rates')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.rates) {
          setRates(data.data.rates);
        }
      })
      .catch(() => {});
  }, []);

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    localStorage.setItem('twm_lang', lang);
  }, []);

  const changeCurrency = useCallback((curr) => {
    setCurrency(curr);
    localStorage.setItem('twm_curr', curr);
  }, []);

  const t = useCallback(
    (key) => {
      const langDict = translations[language] || translations.vi;
      return langDict[key] || translations.vi[key] || key;
    },
    [language]
  );

  const formatPrice = useCallback(
    (amountInVnd) => {
      const num = Number(amountInVnd) || 0;
      const rate = rates[currency] || 1;
      const converted = num * rate;

      switch (currency) {
        case 'USD':
          return `$${Math.round(converted).toLocaleString('en-US')}`;
        case 'EUR':
          return `€${Math.round(converted).toLocaleString('de-DE')}`;
        case 'JPY':
          return `¥${Math.round(converted).toLocaleString('ja-JP')}`;
        case 'VND':
        default:
          return `${Math.round(num).toLocaleString('vi-VN')} ₫`;
      }
    },
    [currency, rates]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage: changeLanguage,
      currency,
      setCurrency: changeCurrency,
      rates,
      formatPrice,
      currencySymbols,
      t
    }),
    [language, changeLanguage, currency, changeCurrency, rates, formatPrice, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
