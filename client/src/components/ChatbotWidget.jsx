import React, { useState } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles, User } from 'lucide-react';

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào quý khách! Tôi là Trợ lý ảo Travel With Me. Tôi có thể hỗ trợ quý khách tìm tour du lịch phù hợp, kiểm tra lịch trình, giá vé hoặc chính sách hoàn hủy ngay bây giờ ạ!'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  const quickQuestions = [
    'Tour Hạ Long du thuyền giá bao nhiêu?',
    'Chính sách hoàn tiền khi hủy tour?',
    'Có mã giảm giá nào hôm nay không?',
    'Gợi ý tour cho gia đình có trẻ nhỏ'
  ];

  const handleSend = (userText) => {
    const textToSend = userText || inputVal;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInputVal('');

    // Generate intelligent response based on keywords
    setTimeout(() => {
      let botReply = '';
      const lower = textToSend.toLowerCase();

      if (lower.includes('hạ long') || lower.includes('du thuyền')) {
        botReply = 'Tour Vịnh Hạ Long trên du thuyền 5 sao hiện có giá từ 3.250.000 đ/khách (đã bao gồm xe Limousine khứ hồi, trọn gói ăn 4 bữa hải sản, chèo kayak và vé thắng cảnh). Đợt khởi hành gần nhất là ngày 25/10/2026!';
      } else if (lower.includes('hủy') || lower.includes('hoàn tiền') || lower.includes('chính sách')) {
        botReply = 'Chính sách hoàn tiền minh bạch của Travel With Me:\n• Hủy trước 15 ngày: Hoàn 100% tiền vé.\n• Hủy 7 - 14 ngày: Hoàn 70% tiền vé.\n• Hủy 3 - 6 ngày: Hoàn 50% tiền vé.\n• Dưới 3 ngày: Không hoàn phí theo quy định hàng không/khách sạn.';
      } else if (lower.includes('mã') || lower.includes('giảm giá') || lower.includes('coupon') || lower.includes('voucher')) {
        botReply = 'Bạn hãy nhập mã ưu đãi sau ở bước thanh toán nhé:\n1. TRAVEL2026: Giảm 10% (Tối đa 1.000.000 đ)\n2. WELCOME500K: Giảm 500.000 đ cho đơn từ 5 triệu!';
      } else if (lower.includes('gia đình') || lower.includes('trẻ em')) {
        botReply = 'Tour Đà Nẵng - Cầu Vàng - Hội An (4N3Đ) hoặc Phú Quốc Đảo Ngọc là sự lựa chọn số 1 cho gia đình! Trẻ em từ 2-11 tuổi được ưu đãi chỉ tính 75% giá vé người lớn, em bé dưới 2 tuổi chỉ phụ thu bảo hiểm nhỏ.';
      } else {
        botReply = `Cảm ơn quý khách đã quan tâm! Chuyên viên du lịch của Travel With Me luôn sẵn sàng hỗ trợ quý khách qua Hotline 1900 6868 hoặc bạn có thể chọn tour trực tiếp trên website để giữ chỗ nhận vé điện tử QR ngay nhé!`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: botReply
        }
      ]);
    }, 600);
  };

  return (
    <div className="chatbot-widget-container">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          className="chatbot-fab-btn animate-glow"
          onClick={() => setIsOpen(true)}
          title="Trò chuyện với AI tư vấn tour"
        >
          <Bot size={26} />
          <span className="fab-online-dot"></span>
        </button>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div className="chatbot-window glass-panel animate-fade-in">
          {/* Header */}
          <div className="chatbot-header">
            <div className="bot-info-row">
              <div className="bot-avatar">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="bot-name">Trợ Lý Du Lịch AI</h4>
                <span className="bot-status">🟢 Trực tuyến 24/7</span>
              </div>
            </div>

            <button className="btn-close-chat" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages list */}
          <div className="chatbot-messages-box">
            {messages.map((m) => (
              <div key={m.id} className={`chat-message-row ${m.sender === 'user' ? 'user-row' : 'bot-row'}`}>
                {m.sender === 'bot' && (
                  <div className="chat-avatar-small">
                    <Bot size={14} />
                  </div>
                )}
                <div className={`chat-bubble ${m.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                  {m.text.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Suggestions */}
          <div className="quick-suggestions-row">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                className="suggestion-chip"
                onClick={() => handleSend(q)}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form
            className="chatbot-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi tư vấn..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button type="submit" className="btn-send-chat" disabled={!inputVal.trim()}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
