import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../config/api';

const DEFAULT_RATES = {
  VND: 1,
  USD: 0.0000393,
  EUR: 0.0000368,
  JPY: 0.00595
};

const CURRENCY_ORDER = ['VND', 'USD', 'EUR', 'JPY'];

const TRANSLATIONS = {
  vi: {
    brandSub: 'Khám Phá Việt Nam Kỳ Vĩ',
    tabExplore: 'Khám phá',
    tabTrips: 'Chuyến đi',
    tabCommunity: 'Cộng đồng',
    tabAlerts: 'Thông báo',
    tabProfile: 'Tài khoản',
    searchPlaceholder: 'Tìm tour Hạ Long, Sapa, Phú Quốc...',
    allCategories: 'Tất cả',
    bookNow: 'Đặt Tour Ngay',
    viewTicket: 'Xem Vé QR',
    writeReview: 'Viết Đánh Giá',
    verifiedCompleted: 'Đơn COMPLETED - Đủ điều kiện đánh giá',
    lockedReview: 'Chỉ mở đánh giá khi đơn đã COMPLETED',
    bookSimilar: 'Đặt Chuyến Đi Tương Tự',
    simulate24h: 'Mô phỏng Nhắc lịch 24h (Zalo ZNS)'
  },
  en: {
    brandSub: 'Discover Majestic Vietnam',
    tabExplore: 'Explore',
    tabTrips: 'My Trips',
    tabCommunity: 'Community',
    tabAlerts: 'Alerts',
    tabProfile: 'Account',
    searchPlaceholder: 'Search Ha Long, Sapa, Phu Quoc tours...',
    allCategories: 'All Tours',
    bookNow: 'Book Tour Now',
    viewTicket: 'QR E-Ticket',
    writeReview: 'Write Review',
    verifiedCompleted: 'COMPLETED Trip - Eligible for Review',
    lockedReview: 'Review unlocked after trip is COMPLETED',
    bookSimilar: 'Book Similar Trip',
    simulate24h: 'Simulate 24h Reminder (Zalo ZNS)'
  }
};

const MobileLocaleContext = createContext(null);

export function MobileLocaleProvider({ children }) {
  const [lang, setLang] = useState('vi');
  const [currency, setCurrency] = useState('VND');
  const [rates, setRates] = useState(DEFAULT_RATES);

  useEffect(() => {
    (async () => {
      try {
        const savedLang = await AsyncStorage.getItem('twm_mobile_lang');
        const savedCurr = await AsyncStorage.getItem('twm_mobile_curr');
        if (savedLang === 'vi' || savedLang === 'en') setLang(savedLang);
        if (CURRENCY_ORDER.includes(savedCurr)) setCurrency(savedCurr);
      } catch {}

      const res = await apiRequest('/api/exchange-rates');
      if (res.ok && res.data?.data?.rates) {
        setRates(res.data.data.rates);
      }
    })();
  }, []);

  const toggleLanguage = useCallback(async () => {
    const next = lang === 'vi' ? 'en' : 'vi';
    setLang(next);
    try {
      await AsyncStorage.setItem('twm_mobile_lang', next);
    } catch {}
  }, [lang]);

  const cycleCurrency = useCallback(async () => {
    const idx = CURRENCY_ORDER.indexOf(currency);
    const next = CURRENCY_ORDER[(idx + 1) % CURRENCY_ORDER.length];
    setCurrency(next);
    try {
      await AsyncStorage.setItem('twm_mobile_curr', next);
    } catch {}
  }, [currency]);

  const formatPrice = useCallback(
    (amountInVnd) => {
      const num = Number(amountInVnd) || 0;
      if (currency === 'VND') {
        return `${num.toLocaleString('vi-VN')} ₫`;
      }
      const rate = rates[currency] || DEFAULT_RATES[currency] || 1;
      const converted = num * rate;
      if (currency === 'JPY') {
        return `¥${Math.round(converted).toLocaleString('en-US')}`;
      }
      if (currency === 'EUR') {
        return `€${converted.toFixed(2)}`;
      }
      return `$${converted.toFixed(2)}`;
    },
    [currency, rates]
  );

  const t = useCallback(
    (key) => {
      return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.vi[key] || key;
    },
    [lang]
  );

  return (
    <MobileLocaleContext.Provider
      value={{
        lang,
        currency,
        toggleLanguage,
        cycleCurrency,
        formatPrice,
        t
      }}
    >
      {children}
    </MobileLocaleContext.Provider>
  );
}

export function useMobileLocale() {
  return useContext(MobileLocaleContext);
}

