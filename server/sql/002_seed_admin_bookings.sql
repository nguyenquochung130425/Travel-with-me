-- 002_seed_admin_bookings.sql
-- Seed dữ liệu các đơn đặt tour thực tế của khách hàng kết nối SQL Server & biểu đồ tăng trưởng doanh thu 6 tháng

IF (SELECT COUNT(*) FROM dbo.bookings) <= 1
BEGIN
    INSERT INTO dbo.bookings (
        user_id, tour_id, tour_title, tour_image, 
        departure_date, return_date, num_adults, num_children, num_infants, 
        subtotal, discount_amount, total_amount, 
        booking_status, payment_status, payment_method, 
        contact_name, contact_email, contact_phone, 
        booking_code, qr_ticket_code, created_at
    ) VALUES 
    -- Tháng 5 / 2026 (Doanh thu ~ 42.5 triệu)
    (3, 'tour-2', N'Đà Nẵng – Bà Nà Hills – Phố Cổ Hội An 4N3Đ', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
     '2026-05-18', '2026-05-21', 2, 0, 0, 21000000, 0, 21000000, 'COMPLETED', 'PAID', 'VIETQR',
     N'Nguyễn Quốc Hùng', 'hung@example.com', '0912345678', 'TWM-20260512-4011', 'QR-TWM-20260512-4011', '2026-05-12 09:30:00'),
    
    (4, 'tour-1', N'Khám Phá Di Sản Vịnh Hạ Long - Du Thuyền 5 Sao Sang Trọng', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
     '2026-05-28', '2026-05-29', 3, 0, 0, 21500000, 0, 21500000, 'COMPLETED', 'PAID', 'VNPAY',
     N'Trần Thị Mai', 'mai.tran@example.com', '0905123456', 'TWM-20260524-5122', 'QR-TWM-20260524-5122', '2026-05-24 14:15:00'),

    -- Tháng 6 / 2026 (Doanh thu ~ 68 triệu)
    (4, 'tour-3', N'Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Sa Pa Xứ Sở Sương Mù', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
     '2026-06-15', '2026-06-17', 4, 0, 0, 31000000, 0, 31000000, 'COMPLETED', 'PAID', 'VIETQR',
     N'Trần Thị Mai', 'mai.tran@example.com', '0905123456', 'TWM-20260608-6201', 'QR-TWM-20260608-6201', '2026-06-08 10:20:00'),

    (3, 'tour-4', N'Thiên Đường Biển Đảo Phú Quốc - Cáp Treo Hòn Thơm - Sunset Town', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
     '2026-06-25', '2026-06-28', 4, 1, 0, 37000000, 0, 37000000, 'COMPLETED', 'PAID', 'VIETQR',
     N'Nguyễn Quốc Hùng', 'hung@example.com', '0912345678', 'TWM-20260620-6345', 'QR-TWM-20260620-6345', '2026-06-20 16:45:00'),

    -- Tháng 7 / 2026 (Doanh thu ~ 95.2 triệu)
    (6, 'tour-1', N'Khám Phá Di Sản Vịnh Hạ Long - Du Thuyền 5 Sao Sang Trọng', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
     '2026-07-10', '2026-07-11', 4, 0, 0, 35800000, 0, 35800000, 'COMPLETED', 'PAID', 'VNPAY',
     N'Nguyen Quoc Hung', 'hung_test_focus@example.com', '0988776655', 'TWM-20260705-7091', 'QR-TWM-20260705-7091', '2026-07-05 11:00:00'),

    (7, 'tour-2', N'Đà Nẵng – Bà Nà Hills – Phố Cổ Hội An 4N3Đ', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
     '2026-07-22', '2026-07-25', 5, 0, 0, 47500000, 0, 47500000, 'COMPLETED', 'PAID', 'VIETQR',
     N'Nguyen Quoc Hung', 'hunghung144543@gmail.com', '0977889900', 'TWM-20260718-7244', 'QR-TWM-20260718-7244', '2026-07-18 15:30:00'),

    (4, 'tour-3', N'Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Sa Pa Xứ Sở Sương Mù', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
     '2026-08-02', '2026-08-04', 2, 0, 0, 11900000, 0, 11900000, 'COMPLETED', 'PAID', 'VIETQR',
     N'Trần Thị Mai', 'mai.tran@example.com', '0905123456', 'TWM-20260728-7399', 'QR-TWM-20260728-7399', '2026-07-28 08:45:00'),

    -- Tháng 8 / 2026 (Doanh thu thực nhận ~ 78.4 triệu, 1 đơn hủy hoàn phí)
    (3, 'tour-4', N'Thiên Đường Biển Đảo Phú Quốc - Cáp Treo Hòn Thơm - Sunset Town', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
     '2026-08-16', '2026-08-19', 4, 1, 0, 37000000, 0, 37000000, 'COMPLETED', 'PAID', 'VIETQR',
     N'Nguyễn Quốc Hùng', 'hung@example.com', '0912345678', 'TWM-20260810-8102', 'QR-TWM-20260810-8102', '2026-08-10 13:10:00'),

    (7, 'tour-1', N'Khám Phá Di Sản Vịnh Hạ Long - Du Thuyền 5 Sao Sang Trọng', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
     '2026-08-26', '2026-08-27', 3, 0, 0, 26850000, 0, 26850000, 'COMPLETED', 'PAID', 'VNPAY',
     N'Nguyen Quoc Hung', 'hunghung144543@gmail.com', '0977889900', 'TWM-20260822-8233', 'QR-TWM-20260822-8233', '2026-08-22 09:00:00'),

    (4, 'tour-3', N'Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Sa Pa Xứ Sở Sương Mù', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
     '2026-08-20', '2026-08-22', 2, 0, 0, 14550000, 0, 14550000, 'CANCELLED', 'REFUNDED', 'VIETQR',
     N'Trần Thị Mai', 'mai.tran@example.com', '0905123456', 'TWM-20260815-8199', 'QR-TWM-20260815-8199', '2026-08-15 17:20:00'),

    (6, 'tour-3', N'Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Sa Pa Xứ Sở Sương Mù', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
     '2026-08-28', '2026-08-30', 2, 0, 0, 14550000, 0, 14550000, 'COMPLETED', 'PAID', 'VIETQR',
     N'Nguyen Quoc Hung', 'hung_test_focus@example.com', '0988776655', 'TWM-20260825-8277', 'QR-TWM-20260825-8277', '2026-08-25 14:40:00'),

    -- Tháng 9 / 2026 (Doanh thu ~ 84.1 triệu)
    (4, 'tour-2', N'Đà Nẵng – Bà Nà Hills – Phố Cổ Hội An 4N3Đ', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
     '2026-09-10', '2026-09-13', 4, 0, 0, 38000000, 0, 38000000, 'COMPLETED', 'PAID', 'VIETQR',
     N'Trần Thị Mai', 'mai.tran@example.com', '0905123456', 'TWM-20260905-9055', 'QR-TWM-20260905-9055', '2026-09-05 10:15:00'),

    (6, 'tour-1', N'Khám Phá Di Sản Vịnh Hạ Long - Du Thuyền 5 Sao Sang Trọng', 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
     '2026-09-22', '2026-09-23', 3, 0, 0, 26850000, 0, 26850000, 'COMPLETED', 'PAID', 'VNPAY',
     N'Nguyen Quoc Hung', 'hung_test_focus@example.com', '0988776655', 'TWM-20260917-9177', 'QR-TWM-20260917-9177', '2026-09-17 11:30:00'),

    (3, 'tour-4', N'Thiên Đường Biển Đảo Phú Quốc - Cáp Treo Hòn Thơm - Sunset Town', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
     '2026-10-02', '2026-10-05', 2, 0, 0, 19250000, 0, 19250000, 'COMPLETED', 'PAID', 'VIETQR',
     N'Nguyễn Quốc Hùng', 'hung@example.com', '0912345678', 'TWM-20260926-9266', 'QR-TWM-20260926-9266', '2026-09-26 15:00:00'),

    -- Tháng 10 / 2026 (Doanh thu ~ 112.8 triệu)
    (3, 'tour-2', N'Đà Nẵng – Bà Nà Hills – Phố Cổ Hội An 4N3Đ', 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
     '2026-10-18', '2026-10-21', 5, 0, 0, 47500000, 0, 47500000, 'CONFIRMED', 'PAID', 'VIETQR',
     N'Nguyễn Quốc Hùng', 'hung@example.com', '0912345678', 'TWM-20261012-1012', 'QR-TWM-20261012-1012', '2026-10-12 09:20:00'),

    (4, 'tour-4', N'Thiên Đường Biển Đảo Phú Quốc - Cáp Treo Hòn Thơm - Sunset Town', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
     '2026-10-25', '2026-10-28', 3, 1, 0, 33500000, 0, 33500000, 'PAID', 'PAID', 'VIETQR',
     N'Trần Thị Mai', 'mai.tran@example.com', '0905123456', 'TWM-20261018-1018', 'QR-TWM-20261018-1018', '2026-10-18 16:30:00'),

    (6, 'tour-3', N'Chinh Phục Đỉnh Fansipan - Bản Cát Cát - Sa Pa Xứ Sở Sương Mù', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
     '2026-10-28', '2026-10-30', 3, 0, 0, 22850000, 0, 22850000, 'CONFIRMED', 'PAID', 'VIETQR',
     N'Nguyen Quoc Hung', 'hung_test_focus@example.com', '0988776655', 'TWM-20261022-1022', 'QR-TWM-20261022-1022', '2026-10-22 14:10:00');
END;
