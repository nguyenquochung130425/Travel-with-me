// Mock Data engine for Travel With Me
export const mockCategories = [
  {
    id: "cat-1",
    name: "Du lịch Nghỉ Dưỡng",
    slug: "du-lich-nghi-duong",
    region: "Toàn quốc",
    description: "Tận hưởng không gian sang trọng tại các resort 5 sao biển và núi.",
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cat-2",
    name: "Khám Phá & Trekking",
    slug: "kham-pha-trekking",
    region: "Miền Bắc",
    description: "Chinh phục những cung đường đèo hùng vĩ và đỉnh núi mây mù.",
    imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cat-3",
    name: "Văn Hóa & Di Sản",
    slug: "van-hoa-di-san",
    region: "Miền Trung",
    description: "Chiêm ngưỡng các di sản thế giới cổ kính và bề dày lịch sử.",
    imageUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "cat-4",
    name: "Thiên Đường Biển Đảo",
    slug: "thien-duong-bien-dao",
    region: "Miền Nam",
    description: "Lặn ngắm san hô, đắm mình trong làn nước ngọc bích và hoàng hôn lãng mạn.",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
  }
];

export const mockTours = [
  {
    id: "tour-1",
    title: "Khám Phá Di Sản Vịnh Hạ Long - Du Thuyền 5 Sao Sang Trọng",
    slug: "kham-pha-di-san-vinh-ha-long-du-thuyen-5-sao",
    categoryId: "cat-1",
    categoryName: "Du lịch Nghỉ Dưỡng",
    departureCity: "Hà Nội",
    destinationCity: "Quảng Ninh / Vịnh Hạ Long",
    durationDays: 2,
    durationNights: 1,
    transportType: "BUS", // Xe limousine đón trả
    tourType: "RESORT",
    ratingAverage: 4.9,
    reviewCount: 142,
    isFeatured: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1000&q=80",
    albumImages: [
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
    ],
    overviewDescription: "Trải nghiệm kỳ nghỉ xa hoa trên du thuyền 5 sao đẳng cấp quốc tế lênh đênh giữa lòng kỳ quan thiên nhiên thế giới Vịnh Hạ Long. Thưởng thức buffet hải sản tươi sống, chèo kayak qua hang Sáng Tối, ngắm hoàng hôn trên boong tàu và tham gia lớp học nấu ăn truyền thống.",
    inclusions: "Xe Limousine Dcar đưa đón khứ hồi Hà Nội - Tuần Châu; 01 đêm nghỉ phòng ban công riêng hướng biển trên du thuyền; 04 bữa ăn thượng hạng theo chương trình; Chèo thuyền kayak, đò nan thăm hang động; Vé thắng cảnh vịnh Hạ Long; Tiệc trà chiều ngắm hoàng hôn.",
    exclusions: "Chi phí đồ uống gọi thêm tại quầy bar; Dịch vụ Spa & Massage trên tàu; Thuế VAT; Tiền tip cho thủy thủ đoàn.",
    cancellationPolicy: "Hủy trước 15 ngày hoàn 100%; Hủy 7 - 14 ngày hoàn 70%; Hủy 3 - 6 ngày hoàn 50%; Dưới 3 ngày không hoàn tiền.",
    schedules: [
      {
        id: "sch-101",
        departureDate: "2026-10-25",
        returnDate: "2026-10-26",
        adultPrice: 3250000,
        childPrice: 2450000,
        infantPrice: 500000,
        maxCapacity: 30,
        minCapacity: 10,
        bookedSlots: 22,
        status: "AVAILABLE"
      },
      {
        id: "sch-102",
        departureDate: "2026-11-02",
        returnDate: "2026-11-03",
        adultPrice: 3450000,
        childPrice: 2600000,
        infantPrice: 500000,
        maxCapacity: 30,
        minCapacity: 10,
        bookedSlots: 28,
        status: "AVAILABLE"
      },
      {
        id: "sch-103",
        departureDate: "2026-11-10",
        returnDate: "2026-11-11",
        adultPrice: 3150000,
        childPrice: 2350000,
        infantPrice: 500000,
        maxCapacity: 30,
        minCapacity: 10,
        bookedSlots: 30,
        status: "SOLD_OUT"
      }
    ],
    itineraries: [
      {
        dayNumber: 1,
        title: "Hà Nội - Vịnh Hạ Long - Chèo Kayak Hang Luồn - Sunset Party",
        description: "08:30 Xe đón quý khách tại Hà Nội, di chuyển cao tốc đến Cảng Tuần Châu. 11:45 Lên du thuyền, nhận phòng và thưởng thức bữa trưa buffet hải sản tươi ngon. Chiều chèo kayak khám phá vẻ đẹp kỳ ảo của Hang Luồn và tắm biển đảo Ti Tốp.",
        activities: ["Đón khách cao tốc Hà Nội", "Thưởng thức hải sản vịnh", "Chèo thuyền Kayak", "Sunset Party & Cooking Class"],
        meals: "Trưa, Tối",
        hotel: "Du thuyền Catherine 5 sao Hạ Long"
      },
      {
        dayNumber: 2,
        title: "Tập Thái Cực Quyền - Hang Sửng Sốt - Trở về Hà Nội",
        description: "06:15 Đón bình minh và tập Thái Cực Quyền trên Sundeck. Dùng điểm tâm sáng nhẹ. Tham quan Hang Sửng Sốt - hang động đẹp nhất vịnh với vô vàn nhũ đá lấp lánh. Trưa dùng brunch và cập cảng Tuần Châu, xe đưa đoàn về lại Hà Nội.",
        activities: ["Tập Tai Chi đón bình minh", "Khám phá Hang Sửng Sốt", "Check-out & Thưởng thức Brunch", "Xe đưa về điểm hẹn"],
        meals: "Sáng, Trưa",
        hotel: "Kết thúc tour"
      }
    ]
  },
  {
    id: "tour-2",
    title: "Đà Nẵng - Cầu Vàng Bà Nà Hills - Phố Cổ Hội An - Bán Đảo Sơn Trà",
    slug: "da-nang-cau-vang-ba-na-hills-pho-co-hoi-an",
    categoryId: "cat-3",
    categoryName: "Văn Hóa & Di Sản",
    departureCity: "Hà Nội / TP.HCM",
    destinationCity: "Đà Nẵng - Hội An",
    durationDays: 4,
    durationNights: 3,
    transportType: "PLANE",
    tourType: "CULTURAL",
    ratingAverage: 4.8,
    reviewCount: 210,
    isFeatured: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1000&q=80",
    albumImages: [
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
    ],
    overviewDescription: "Hành trình di sản miền Trung rực rỡ sắc màu: Chạm tay vào mây trời tại Cầu Vàng - Bà Nà Hills, thả đèn hoa đăng lung linh trên dòng sông Hoài thơ mộng ở Phố Cổ Hội An, và ngắm nhìn tượng Phật Bà Quan Âm cao nhất Việt Nam tại Chùa Linh Ứng Sơn Trà.",
    inclusions: "Vé máy bay khứ hồi gồm 20kg ký gửi; Khách sạn 4 sao trung tâm gần biển Mỹ Khê; Vé cáp treo Bà Nà Hills + Buffet trưa đỉnh Bà Nà; Vé tham quan Phố Cổ Hội An; Hướng dẫn viên suốt tuyến tận tâm.",
    exclusions: "Chi phí cá nhân; Vé xem show 'Ký Ức Hội An'; Nước uống trong bữa ăn.",
    cancellationPolicy: "Hủy trước 15 ngày hoàn 100%; Hủy 7 - 14 ngày hoàn 70%; Hủy 3 - 6 ngày hoàn 50%; Dưới 3 ngày không hoàn tiền.",
    schedules: [
      {
        id: "sch-201",
        departureDate: "2026-10-28",
        returnDate: "2026-10-31",
        adultPrice: 5890000,
        childPrice: 4500000,
        infantPrice: 900000,
        maxCapacity: 35,
        minCapacity: 15,
        bookedSlots: 26,
        status: "AVAILABLE"
      },
      {
        id: "sch-202",
        departureDate: "2026-11-05",
        returnDate: "2026-11-08",
        adultPrice: 6190000,
        childPrice: 4700000,
        infantPrice: 900000,
        maxCapacity: 35,
        minCapacity: 15,
        bookedSlots: 18,
        status: "AVAILABLE"
      }
    ],
    itineraries: [
      {
        dayNumber: 1,
        title: "Đón sân bay Đà Nẵng - Bán Đảo Sơn Trà - Biển Mỹ Khê",
        description: "Xe và HDV đón đoàn tại sân bay Quốc tế Đà Nẵng. Khởi hành viếng Chùa Linh Ứng Bãi Bụt. Tự do tắm biển Mỹ Khê - một trong những bãi biển quyến rũ nhất hành tinh.",
        activities: ["Đón sân bay", "Viếng Linh Ứng Tự", "Tắm biển Mỹ Khê", "Ngắm Cầu Rồng phun lửa"],
        meals: "Trưa, Tối",
        hotel: "Khách sạn Stella Maris 4 sao Đà Nẵng"
      },
      {
        dayNumber: 2,
        title: "Khu du lịch Bà Nà Hills - Cầu Vàng - Fantasy Park",
        description: "Trải nghiệm hệ thống cáp treo đạt kỷ lục Guinness. Check-in siêu phẩm Cầu Vàng Bàn Tay Khổng Lồ, Làng Pháp cổ kính và thỏa sức vui chơi tại Fantasy Park.",
        activities: ["Cáp treo Bà Nà", "Check-in Cầu Vàng", "Buffet trưa hơn 100 món", "Khu vui chơi Fantasy"],
        meals: "Sáng, Trưa, Tối",
        hotel: "Khách sạn Stella Maris 4 sao Đà Nẵng"
      },
      {
        dayNumber: 3,
        title: "Ngũ Hành Sơn - Làng Đá Mỹ Nghệ - Đêm Phố Cổ Hội An",
        description: "Tham quan Ngũ Hành Sơn hùng vĩ, ghé làng đá Non Nước. Chiều đến Hội An bách bộ ngắm Chùa Cầu, nhà cổ trăm năm, thưởng thức cao lầu và chèo thuyền thả hoa đăng.",
        activities: ["Ngũ Hành Sơn", "Khám phá Hội An", "Ẩm thực xứ Quảng", "Thả hoa đăng sông Hoài"],
        meals: "Sáng, Trưa, Tối",
        hotel: "Khách sạn Stella Maris 4 sao Đà Nẵng"
      },
      {
        dayNumber: 4,
        title: "Chợ Hàn đặc sản - Mua sắm quà lưu niệm - Tiễn sân bay",
        description: "Dùng buffet sáng tại khách sạn. Quý khách tự do ghé Chợ Hàn mua chả bò, hải sản khô làm quà. Xe đưa đoàn ra sân bay hoàn tất chuyến đi.",
        activities: ["Mua sắm Chợ Hàn", "Check out khách sạn", "Tiễn sân bay"],
        meals: "Sáng",
        hotel: "Kết thúc tour"
      }
    ]
  },
  {
    id: "tour-3",
    title: "Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Sa Pa Xứ Sở Sương Mù",
    slug: "chinh-phuc-dinh-fansipan-ban-cat-cat-sa-pa",
    categoryId: "cat-2",
    categoryName: "Khám Phá & Trekking",
    departureCity: "Hà Nội",
    destinationCity: "Lào Cai / Sa Pa",
    durationDays: 3,
    durationNights: 2,
    transportType: "BUS",
    tourType: "TREKKING",
    ratingAverage: 4.9,
    reviewCount: 96,
    isFeatured: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80",
    albumImages: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80"
    ],
    overviewDescription: "Chạm tay vào 'Nóc nhà Đông Dương' ở độ cao 3.143m huyền thoại. Lạc bước giữa những thảm ruộng bậc thang mộng mơ, thưởng thức lẩu cá tầm nóng hổi và cảm nhận nét văn hóa độc đáo của đồng bào H'Mông, Dao Đỏ.",
    inclusions: "Xe Cabin đôi cao cấp giường nằm êm ái khứ hồi; Khách sạn 4 sao view thung lũng Mường Hoa; Vé cáp treo Fansipan khứ hồi; Vé tham quan Bản Cát Cát; Ăn các bữa đặc sản vùng cao.",
    exclusions: "Vé tàu hỏa leo núi Mường Hoa; Chi phí thuê trang phục dân tộc; Đồ uống cá nhân.",
    cancellationPolicy: "Hủy trước 15 ngày hoàn 100%; Hủy 7 - 14 ngày hoàn 70%; Hủy 3 - 6 ngày hoàn 50%; Dưới 3 ngày không hoàn tiền.",
    schedules: [
      {
        id: "sch-301",
        departureDate: "2026-10-30",
        returnDate: "2026-11-01",
        adultPrice: 3890000,
        childPrice: 2890000,
        infantPrice: 400000,
        maxCapacity: 25,
        minCapacity: 10,
        bookedSlots: 15,
        status: "AVAILABLE"
      },
      {
        id: "sch-302",
        departureDate: "2026-11-06",
        returnDate: "2026-11-08",
        adultPrice: 3990000,
        childPrice: 2990000,
        infantPrice: 400000,
        maxCapacity: 25,
        minCapacity: 10,
        bookedSlots: 24,
        status: "AVAILABLE"
      }
    ],
    itineraries: [
      {
        dayNumber: 1,
        title: "Hà Nội - Cao tốc Lào Cai - Sa Pa - Bản Cát Cát thơ mộng",
        description: "Khởi hành từ Hà Nội theo cao tốc Nội Bài - Lào Cai. Đến thị xã Sa Pa dùng bữa trưa lẩu cá hồi. Chiều bách bộ xuống Bản Cát Cát, ngắm thác Tiên Sa và guồng nước khổng lồ.",
        activities: ["Di chuyển xe cabin êm ái", "Bản Cát Cát mộng mơ", "Check-in cầu gỗ", "Thưởng thức lẩu cá hồi"],
        meals: "Trưa, Tối",
        hotel: "Bamboo Sa Pa Hotel 4 sao"
      },
      {
        dayNumber: 2,
        title: "Chinh phục đỉnh Fansipan 3.143m - Đèo Ô Quy Hồ tráng lệ",
        description: "Đi cáp treo băng qua biển mây bồng bềnh lên đỉnh Fansipan. Viếng quần thể tâm linh kỳ vĩ. Chiều ngắm hoàng hôn đỏ rực tại Cổng trời Đèo Ô Quy Hồ.",
        activities: ["Cáp treo Fansipan", "Chạm mốc 3.143m", "Cổng trời Ô Quy Hồ", "Chợ đêm Sa Pa"],
        meals: "Sáng, Trưa, Tối",
        hotel: "Bamboo Sa Pa Hotel 4 sao"
      },
      {
        dayNumber: 3,
        title: "Nhà Thờ Đá Sa Pa - Mua sắm đặc sản mầm đá - Hà Nội",
        description: "Bách bộ tham quan Nhà thờ đá cổ kính, dạo hồ Sa Pa và mua quà đặc sản thịt trâu gác bếp, hạt dẻ nóng. Lên xe trở về Hà Nội.",
        activities: ["Check-in Nhà thờ đá", "Mua quà đặc sản", "Khởi hành về Hà Nội"],
        meals: "Sáng, Trưa",
        hotel: "Kết thúc tour"
      }
    ]
  },
  {
    id: "tour-4",
    title: "Phú Quốc Thiên Đường Đảo Ngọc - Sunset Sanato - Grand World",
    slug: "phu-quoc-thien-duong-dao-ngoc-grand-world",
    categoryId: "cat-4",
    categoryName: "Thiên Đường Biển Đảo",
    departureCity: "Hà Nội / TP.HCM",
    destinationCity: "Kiên Giang / Phú Quốc",
    durationDays: 4,
    durationNights: 3,
    transportType: "PLANE",
    tourType: "RESORT",
    ratingAverage: 4.95,
    reviewCount: 318,
    isFeatured: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
    albumImages: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
    ],
    overviewDescription: "Tận hưởng kỳ nghỉ biển đỉnh cao tại Phú Quốc: Tour cano lặn ngắm san hô tại 4 hòn đảo đẹp nhất vịnh Thái Lan, ngắm hoàng hôn rực rỡ tại Sunset Sanato, xem show thực cảnh triệu đô Sắc Màu Venice tại 'Thành phố không ngủ' Grand World.",
    inclusions: "Vé máy bay khứ hồi Vietjet/Vietnam Airlines; 3 đêm Resort 5 sao có bãi biển riêng; Tour cano 4 đảo + Flycam chụp ảnh chuyên nghiệp; Vé xem show nhạc nước Venice; Xe du lịch đời mới.",
    exclusions: "Vé vào cổng VinWonders & Safari; Chi phí câu mực đêm tự túc.",
    cancellationPolicy: "Hủy trước 15 ngày hoàn 100%; Hủy 7 - 14 ngày hoàn 70%; Hủy 3 - 6 ngày hoàn 50%; Dưới 3 ngày không hoàn tiền.",
    schedules: [
      {
        id: "sch-401",
        departureDate: "2026-11-01",
        returnDate: "2026-11-04",
        adultPrice: 6990000,
        childPrice: 5290000,
        infantPrice: 990000,
        maxCapacity: 30,
        minCapacity: 12,
        bookedSlots: 20,
        status: "AVAILABLE"
      },
      {
        id: "sch-402",
        departureDate: "2026-11-15",
        returnDate: "2026-11-18",
        adultPrice: 7290000,
        childPrice: 5590000,
        infantPrice: 990000,
        maxCapacity: 30,
        minCapacity: 12,
        bookedSlots: 10,
        status: "AVAILABLE"
      }
    ],
    itineraries: [
      {
        dayNumber: 1,
        title: "Đón sân bay Phú Quốc - Check-in Resort - Sunset Sanato",
        description: "Xe đón khách tại sân bay Quốc tế Phú Quốc, nhận phòng resort nghỉ ngơi. Chiều đến Sunset Sanato chụp ảnh cùng những chú voi chân dài và ngắm hoàng hôn lộng lẫy.",
        activities: ["Đón sân bay", "Nghỉ ngơi bãi biển", "Sunset Sanato", "Chợ đêm Phú Quốc"],
        meals: "Trưa, Tối",
        hotel: "Seashells Hotel & Spa 5 sao"
      },
      {
        dayNumber: 2,
        title: "Tour Cano 4 Đảo - Công Viên San Hô - Cáp Treo Hòn Thơm",
        description: "Trải nghiệm lướt cano cao tốc ra Hòn Mây Rút, Hòn Gầm Ghì, Hòn Móng Tay. Lặn ngắm rạn san hô tự nhiên, quay video flycam miễn phí. Trải nghiệm cáp treo 3 dây vượt biển.",
        activities: ["Cano 4 đảo", "Lặn ngắm san hô", "Chụp ảnh flycam", "Cáp treo vượt biển Hòn Thơm"],
        meals: "Sáng, Trưa, Tối",
        hotel: "Seashells Hotel & Spa 5 sao"
      },
      {
        dayNumber: 3,
        title: "Grand World Phú Quốc - Show Sắc Màu Venice",
        description: "Khám phá thành phố không ngủ Grand World với kiến trúc Ý lộng lẫy, đi thuyền Gondola trên dòng kênh Venice, chiêm ngưỡng công trình tre khổng lồ và show nhạc nước ánh sáng đẳng cấp.",
        activities: ["Grand World Venice", "Công trình Tre", "Thuyền Gondola", "Show nhạc nước triệu đô"],
        meals: "Sáng, Trưa, Tối",
        hotel: "Seashells Hotel & Spa 5 sao"
      },
      {
        dayNumber: 4,
        title: "Vườn tiêu Suối Đá - Nhà thùng nước mắm - Tiễn sân bay",
        description: "Thăm các làng nghề truyền thống Phú Quốc: nước mắm cá cơm danh tiếng, vườn tiêu thơm cay và rượu sim rừng. Xe tiễn khách ra sân bay Phú Quốc.",
        activities: ["Làng nghề nước mắm", "Vườn tiêu Suối Đá", "Mua đặc sản ngọc trai", "Tiễn sân bay"],
        meals: "Sáng",
        hotel: "Kết thúc tour"
      }
    ]
  }
];

export const mockCoupons = [
  {
    code: "TRAVEL2026",
    description: "Giảm ngay 10% cho khách đặt tour mùa thu đông",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrder: 3000000,
    maxDiscount: 1000000,
    usageLimit: 500,
    usedCount: 88,
    startDate: "2026-09-01",
    endDate: "2026-12-31",
    isActive: true
  },
  {
    code: "WELCOME500K",
    description: "Tặng 500.000 VNĐ cho đơn từ 5.000.000 VNĐ",
    discountType: "FIXED_AMOUNT",
    discountValue: 500000,
    minOrder: 5000000,
    maxDiscount: 500000,
    usageLimit: 200,
    usedCount: 45,
    startDate: "2026-10-01",
    endDate: "2026-11-30",
    isActive: true
  }
];

export const mockUserBookings = [
  {
    id: "bk-1001",
    bookingCode: "TWM-20261015-8821",
    tourId: "tour-1",
    tourTitle: "Khám Phá Di Sản Vịnh Hạ Long - Du Thuyền 5 Sao Sang Trọng",
    tourImage: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
    departureDate: "2026-10-25",
    returnDate: "2026-10-26",
    numAdults: 2,
    numChildren: 1,
    numInfants: 0,
    totalPassengers: 3,
    finalAmount: 8950000,
    paymentMethod: "VNPAY",
    paymentStatus: "PAID",
    status: "CONFIRMED",
    contactName: "Nguyễn Quốc Hùng",
    contactEmail: "hung.nguyen@example.com",
    contactPhone: "0912345678",
    createdAt: "2026-10-15T09:30:00Z",
    qrCodeToken: "QR-TWM-20261015-8821-SECURE"
  },
  {
    id: "bk-1002",
    bookingCode: "TWM-20260902-1205",
    tourId: "tour-3",
    tourTitle: "Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Sa Pa Xứ Sở Sương Mù",
    tourImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
    departureDate: "2026-09-12",
    returnDate: "2026-09-14",
    numAdults: 2,
    numChildren: 0,
    numInfants: 0,
    totalPassengers: 2,
    finalAmount: 7780000,
    paymentMethod: "VIETQR",
    paymentStatus: "PAID",
    status: "COMPLETED",
    contactName: "Nguyễn Quốc Hùng",
    contactEmail: "hung.nguyen@example.com",
    contactPhone: "0912345678",
    createdAt: "2026-09-02T14:15:00Z",
    qrCodeToken: "QR-TWM-20260902-1205-SECURE"
  }
];

export const mockReviews = [
  {
    id: "rev-1",
    tourId: "tour-1",
    authorName: "Trần Minh Anh",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    date: "12/10/2026",
    comment: "Chuyến đi Hạ Long tuyệt vời hơn cả mong đợi! Du thuyền rất sang xịn, phòng tắm kính nhìn thẳng ra vịnh. Đồ ăn hải sản tươi rói, nhân viên phục vụ tận tình chu đáo.",
    photos: ["https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80"]
  },
  {
    id: "rev-2",
    tourId: "tour-1",
    authorName: "Lê Hoàng Long",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    rating: 5,
    date: "05/10/2026",
    comment: "Chèo kayak vào Hang Luồn siêu thích. Sunset party có nhạc acoustic và cocktail ngon. Nhất định sẽ quay lại cùng đại gia đình vào kỳ nghỉ tới!",
    photos: []
  }
];
