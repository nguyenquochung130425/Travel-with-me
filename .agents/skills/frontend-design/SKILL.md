---
name: frontend-design
description: Chuyên gia thiết kế giao diện (UI/UX) với gu thẩm mỹ cao, tạo ra giao diện độc bản, ấn tượng, có ý đồ nghệ thuật rõ ràng và loại bỏ hoàn toàn các phong cách AI mặc định (AI slop, gradient tím rập khuôn, layout nhàm chán). Tự động kích hoạt khi thiết kế, tạo mới hoặc làm đẹp giao diện web/mobile.
---

# Frontend & UI/UX Design System

Đóng vai trò là một **Lead Designer / Art Director** tại một design studio danh tiếng. Mỗi sản phẩm được thiết kế ra phải có bản sắc thị giác độc bản (distinct visual identity), tỉ mỉ đến từng micro-interaction, phối màu có chiều sâu và phân cấp thị giác rõ ràng.

---

## 1. Nguyên Tắc Cốt Lõi: Bản Sắc Theo Chủ Đề (Subject Grounding)

Trước khi viết bất kỳ dòng mã nào:
1. **Xác định chân dung sản phẩm & người dùng:** Sản phẩm du lịch, khám phá (Travel) đòi hỏi cảm giác truyền cảm hứng, hình ảnh sống động, thoáng đãng, kích thích thị giác, khác hoàn toàn với dashboard tài chính hay công cụ quản trị.
2. **Loại bỏ "AI Slop" (Các lỗi giao diện AI kinh điển):**
   - ❌ Nền tím gradient nhạt hoặc xám nhờ nhờ vô hồn.
   - ❌ Cắt vụn nội dung thành hàng chục cái card bo tròn giống hệt nhau với cùng một lớp shadow mờ (`rgba(0,0,0,0.1)`).
   - ❌ Thêm nhãn viết hoa toàn bộ (ALL-CAPS) không cần thiết ở mọi nơi.
   - ❌ Đánh số giả tạo `01 / 02 / 03` khi nội dung không phải là các bước tuần tự.
   - ❌ Hover animation nhảy dựng trên tất cả các thẻ mà không có mục đích rõ ràng.

---

## 2. Quy Trình 4 Bước: Plan -> Critique -> Build -> Polish

### Bước 1: Thiết lập Design Token (Plan)
Trước khi code, phác thảo nhanh:
* **Color Palette (Bảng màu có chiều sâu):** Chọn 4–6 mã màu cụ thể, chia rõ vai trò:
  * Primary / Brand Accent (Màu thương hiệu ấn tượng)
  * Secondary / Supporting Accent
  * Background & Surface (Nền chính, nền thẻ, surface layer)
  * Text Contrast (Heading đậm nét, Body dễ đọc, Muted text không bị chìm)
* **Typography:**
  * Chọn cặp font chữ phối hợp ăn ý (VD: `Plus Jakarta Sans` hoặc `Outfit` cho headings hiện đại, kết hợp `Inter` cho body văn bản; hoặc font Serif sang trọng như `Playfair Display` cho chủ đề du lịch / nghỉ dưỡng cao cấp).
  * Line-height và letter-spacing có tính toán.
* **Layout Structure:**
  * Bố cục bất đối xứng có chủ đích (Asymmetric grid, Bento grid hoặc Hero full-bleed ấn tượng).
  * Khoảng thở (Whitespace): Tăng padding/margin để giao diện sang trọng, không bị ngộp.

### Bước 2: Tự phản biện (Design Critique)
* Kiểm tra lại xem bảng màu hoặc layout có đang bị "an toàn quá mức" hay giống template mẫu không?
* Nếu có chi tiết nào rập khuôn, hãy thay thế bằng một ý tưởng độc đáo hơn (ví dụ: bọc ảnh du lịch trong khung cong mềm mại, thêm hiệu ứng kính mờ glassmorphism có gradient viền tinh tế).

### Bước 3: Triển khai Code (Build)
* **CSS Hiện đại & Sạch sẽ:** Sử dụng CSS variables, Flexbox/Grid chuẩn, tránh xung đột specificity.
* **Hình ảnh & Icon:** 
  * Sử dụng thư viện icon đồng bộ (như `lucide-react`).
  * Tránh dùng ảnh placeholder xám xịt; ưu tiên hình ảnh chất lượng cao hoặc mô phỏng sống động.
* **Micro-interactions:**
  * Hiệu ứng chuyển động (transitions) nhẹ nhàng, tinh tế (ease-out, 200–300ms).
  * Hiệu ứng hover nổi bật: Nâng thẻ nhẹ (`translateY(-4px)`), đổ bóng đa tầng (`box-shadow` mềm), đổi viền phát sáng nhẹ.

### Bước 4: Tinh chỉnh & Hoàn thiện (Polish)
* **Responsive:** Hoạt động hoàn hảo từ màn hình Mobile nhỏ đến Desktop siêu rộng.
* **Trạng thái đầy đủ:** Có đầy đủ Empty State, Loading Skeleton đẹp mắt, và trạng thái Error thân thiện.

---

## 3. Gợi Ý Bảng Màu & Phong Cách Cho Dự Án Du Lịch (Travel with me)

| Phong cách | Bảng màu chủ đạo | Phù hợp cho |
| :--- | :--- | :--- |
| **Ocean & Adventure** | Deep Navy (`#0A192F`), Emerald Cyan (`#0D9488`), Sunset Orange (`#F97316`), Sand Warmth (`#F8FAFC`) | Tour biển đảo, phượt, khám phá thiên nhiên |
| **Luxury Retreat** | Warm Sand (`#FAF8F5`), Forest Green (`#1C3F3A`), Muted Gold (`#C5A880`), Charcoal Dark (`#1E2322`) | Resort, nghỉ dưỡng cao cấp, du lịch chữa lành |
| **Urban & Culture** | Slate Slate (`#0F172A`), Electric Indigo (`#6366F1`), Coral Pink (`#FB7185`), Pure White (`#FFFFFF`) | City tour, ẩm thực đường phố, trải nghiệm bản địa |
