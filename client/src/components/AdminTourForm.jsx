import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

function getInitialSchedule(tour) {
  if (tour?.schedules?.length) {
    return tour.schedules.map((schedule) => ({
      ...schedule,
      departureDate: schedule.departureDate.slice(0, 10),
      returnDate: schedule.returnDate.slice(0, 10)
    }));
  }
  const departure = new Date();
  departure.setDate(departure.getDate() + 7);
  const returning = new Date(departure);
  returning.setDate(returning.getDate() + 1);
  return [{
    departureDate: departure.toISOString().slice(0, 10),
    returnDate: returning.toISOString().slice(0, 10),
    adultPrice: 0,
    childPrice: 0,
    infantPrice: 0,
    maxCapacity: 20,
    minCapacity: 5
  }];
}

export function AdminTourForm({ tour, onSave, onClose }) {
  const [form, setForm] = useState({
    title: tour?.title || '',
    categoryName: tour?.categoryName || '',
    destinationCity: tour?.destinationCity || '',
    departureCity: tour?.departureCity || '',
    durationDays: tour?.durationDays || 1,
    durationNights: tour?.durationNights || 0,
    transportType: tour?.transportType || 'BUS',
    tourType: tour?.tourType || 'RESORT',
    overviewDescription: tour?.overviewDescription || '',
    inclusions: tour?.inclusions || '',
    exclusions: tour?.exclusions || '',
    cancellationPolicy: tour?.cancellationPolicy || '',
    thumbnailUrl: tour?.thumbnailUrl || '',
    albumImagesText: tour?.albumImages?.join('\n') || '',
    isFeatured: Boolean(tour?.isFeatured),
    schedules: getInitialSchedule(tour),
    itineraries: (tour?.itineraries || []).map((itinerary) => ({
      ...itinerary,
      activitiesText: (itinerary.activities || []).join(', ')
    }))
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const setSchedule = (index, name, value) => {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? { ...schedule, [name]: value } : schedule
      )
    }));
  };
  const setItinerary = (index, name, value) => {
    setForm((current) => ({
      ...current,
      itineraries: current.itineraries.map((itinerary, itineraryIndex) =>
        itineraryIndex === index ? { ...itinerary, [name]: value } : itinerary
      )
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        durationDays: Number(form.durationDays),
        durationNights: Number(form.durationNights),
        albumImages: form.albumImagesText.split(/\r?\n/).map((image) => image.trim()).filter(Boolean),
        schedules: form.schedules.map((schedule) => ({
          ...schedule,
          adultPrice: Number(schedule.adultPrice),
          childPrice: Number(schedule.childPrice),
          infantPrice: Number(schedule.infantPrice),
          maxCapacity: Number(schedule.maxCapacity),
          minCapacity: Number(schedule.minCapacity)
        })),
        itineraries: form.itineraries.map((itinerary) => ({
          ...itinerary,
          dayNumber: Number(itinerary.dayNumber),
          activities: itinerary.activitiesText.split(',').map((activity) => activity.trim()).filter(Boolean)
        }))
      });
    } catch (saveError) {
      setError(saveError.message || 'Không thể lưu tour. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const input = (name, label, type = 'text', options = {}) => (
    <label className="admin-tour-field">
      <span>{label}</span>
      <input
        type={type}
        value={form[name]}
        onChange={(event) => setField(name, event.target.value)}
        required={options.required !== false}
        min={options.min}
        step={options.step}
      />
    </label>
  );

  return (
    <div className="admin-tour-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <form className="admin-tour-modal" onSubmit={handleSubmit}>
        <div className="admin-tour-modal-header">
          <div>
            <h3>{tour ? 'Chỉnh sửa tour' : 'Thêm tour mới'}</h3>
            <p>Thông tin tour và lịch khởi hành được lưu vào SQL Server.</p>
          </div>
          <button type="button" className="admin-tour-icon-button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="admin-tour-form-grid">
          {input('title', 'Tên tour')}
          {input('categoryName', 'Danh mục')}
          {input('destinationCity', 'Điểm đến')}
          {input('departureCity', 'Điểm khởi hành')}
          {input('durationDays', 'Số ngày', 'number', { min: 1 })}
          {input('durationNights', 'Số đêm', 'number', { min: 0 })}
          <label className="admin-tour-field">
            <span>Phương tiện</span>
            <select value={form.transportType} onChange={(event) => setField('transportType', event.target.value)}>
              <option value="BUS">Xe du lịch</option>
              <option value="PLANE">Máy bay</option>
              <option value="TRAIN">Tàu hỏa</option>
              <option value="MIXED">Kết hợp</option>
            </select>
          </label>
          <label className="admin-tour-field">
            <span>Loại hình tour</span>
            <select value={form.tourType} onChange={(event) => setField('tourType', event.target.value)}>
              <option value="RESORT">Nghỉ dưỡng</option>
              <option value="TREKKING">Trekking</option>
              <option value="CULTURAL">Văn hóa</option>
              <option value="FOOD">Ẩm thực</option>
              <option value="FAMILY">Gia đình</option>
            </select>
          </label>
          {input('thumbnailUrl', 'URL ảnh đại diện', 'url')}
          <label className="admin-tour-featured">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => setField('isFeatured', event.target.checked)}
            />
            <span>Đánh dấu tour nổi bật</span>
          </label>
        </div>

        <label className="admin-tour-field">
          <span>Mô tả tour</span>
          <textarea
            rows="3"
            required
            value={form.overviewDescription}
            onChange={(event) => setField('overviewDescription', event.target.value)}
          />
        </label>
        <div className="admin-tour-form-grid">
          <label className="admin-tour-field">
            <span>Dịch vụ bao gồm</span>
            <textarea rows="2" value={form.inclusions} onChange={(event) => setField('inclusions', event.target.value)} />
          </label>
          <label className="admin-tour-field">
            <span>Dịch vụ không bao gồm</span>
            <textarea rows="2" value={form.exclusions} onChange={(event) => setField('exclusions', event.target.value)} />
          </label>
        </div>
        <label className="admin-tour-field">
          <span>Chính sách hủy</span>
          <textarea rows="2" value={form.cancellationPolicy} onChange={(event) => setField('cancellationPolicy', event.target.value)} />
        </label>
        <label className="admin-tour-field">
          <span>Ảnh album (mỗi URL một dòng)</span>
          <textarea
            rows="3"
            value={form.albumImagesText}
            onChange={(event) => setField('albumImagesText', event.target.value)}
          />
        </label>

        <div className="admin-tour-schedule-heading">
          <h4>Lịch khởi hành và giá</h4>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setForm((current) => ({
              ...current,
              schedules: [...current.schedules, { ...current.schedules[0], id: undefined }]
            }))}
          >
            <Plus size={15} /> Thêm lịch
          </button>
        </div>
        {form.schedules.map((schedule, index) => (
          <div className="admin-tour-schedule" key={schedule.id || `new-${index}`}>
            <div className="admin-tour-form-grid">
              <label className="admin-tour-field">
                <span>Ngày khởi hành</span>
                <input type="date" required value={schedule.departureDate} onChange={(event) => setSchedule(index, 'departureDate', event.target.value)} />
              </label>
              <label className="admin-tour-field">
                <span>Ngày về</span>
                <input type="date" required value={schedule.returnDate} onChange={(event) => setSchedule(index, 'returnDate', event.target.value)} />
              </label>
              <label className="admin-tour-field">
                <span>Giá người lớn</span>
                <input type="number" required min="0" step="1000" value={schedule.adultPrice} onChange={(event) => setSchedule(index, 'adultPrice', event.target.value)} />
              </label>
              <label className="admin-tour-field">
                <span>Giá trẻ em</span>
                <input type="number" required min="0" step="1000" value={schedule.childPrice} onChange={(event) => setSchedule(index, 'childPrice', event.target.value)} />
              </label>
              <label className="admin-tour-field">
                <span>Giá trẻ sơ sinh</span>
                <input type="number" required min="0" step="1000" value={schedule.infantPrice} onChange={(event) => setSchedule(index, 'infantPrice', event.target.value)} />
              </label>
              <label className="admin-tour-field">
                <span>Sức chứa tối đa</span>
                <input type="number" required min="1" value={schedule.maxCapacity} onChange={(event) => setSchedule(index, 'maxCapacity', event.target.value)} />
              </label>
              <label className="admin-tour-field">
                <span>Số khách tối thiểu</span>
                <input type="number" required min="0" value={schedule.minCapacity} onChange={(event) => setSchedule(index, 'minCapacity', event.target.value)} />
              </label>
            </div>
            {form.schedules.length > 1 && (
              <button
                type="button"
                className="admin-tour-remove-schedule"
                onClick={() => setForm((current) => ({
                  ...current,
                  schedules: current.schedules.filter((_, scheduleIndex) => scheduleIndex !== index)
                }))}
                aria-label="Xóa lịch khởi hành"
              >
                <Trash2 size={16} /> Xóa lịch này
              </button>
            )}
          </div>
        ))}

        <div className="admin-tour-schedule-heading">
          <h4>Lịch trình chi tiết</h4>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setForm((current) => ({
              ...current,
              itineraries: [...current.itineraries, {
                dayNumber: current.itineraries.length + 1,
                title: '',
                description: '',
                activitiesText: '',
                meals: '',
                hotel: ''
              }]
            }))}
          >
            <Plus size={15} /> Thêm ngày
          </button>
        </div>
        {form.itineraries.map((itinerary, index) => (
          <div className="admin-tour-schedule" key={`itinerary-${index}`}>
            <div className="admin-tour-form-grid">
              <label className="admin-tour-field">
                <span>Ngày số</span>
                <input type="number" min="1" required value={itinerary.dayNumber} onChange={(event) => setItinerary(index, 'dayNumber', event.target.value)} />
              </label>
              <label className="admin-tour-field">
                <span>Tiêu đề ngày</span>
                <input required value={itinerary.title} onChange={(event) => setItinerary(index, 'title', event.target.value)} />
              </label>
            </div>
            <label className="admin-tour-field">
              <span>Mô tả lịch trình</span>
              <textarea required rows="3" value={itinerary.description} onChange={(event) => setItinerary(index, 'description', event.target.value)} />
            </label>
            <div className="admin-tour-form-grid">
              <label className="admin-tour-field">
                <span>Hoạt động (phân cách bằng dấu phẩy)</span>
                <input value={itinerary.activitiesText} onChange={(event) => setItinerary(index, 'activitiesText', event.target.value)} />
              </label>
              <label className="admin-tour-field">
                <span>Bữa ăn</span>
                <input value={itinerary.meals || ''} onChange={(event) => setItinerary(index, 'meals', event.target.value)} />
              </label>
              <label className="admin-tour-field">
                <span>Khách sạn / lưu trú</span>
                <input value={itinerary.hotel || ''} onChange={(event) => setItinerary(index, 'hotel', event.target.value)} />
              </label>
            </div>
            <button
              type="button"
              className="admin-tour-remove-schedule"
              onClick={() => setForm((current) => ({
                ...current,
                itineraries: current.itineraries.filter((_, dayIndex) => dayIndex !== index)
              }))}
            >
              <Trash2 size={16} /> Xóa ngày này
            </button>
          </div>
        ))}

        {error && <p className="admin-tour-error" role="alert">{error}</p>}
        <div className="admin-tour-form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Hủy</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu tour'}
          </button>
        </div>
      </form>
    </div>
  );
}
