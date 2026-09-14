"use client";
 
import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Heart, Globe } from "lucide-react";
 
export default function ContactAbout() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) return;
    setSent(true);
    setTimeout(() => {
      setForm({ name: "", email: "", message: "" });
      setSent(false);
      alert("Cảm ơn bạn! Chúng tôi đã nhận được góp ý và sẽ phản hồi sớm nhất.");
    }, 1500);
  };
 
  return (
    <section className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 my-16" id="about-contact">
      {/* Về Chúng Tôi */}
      <div className="card">
        <div className="flex justify-between items-center mb-5">
          <div className="pill pill-violet">
            <Globe size={11} /> HÀNH TRÌNH
          </div>
          <span className="font-sans text-xs font-bold text-[#7c4831]/60">EST. 2020</span>
        </div>
        
        <h2 className="text-xl font-bold mb-5 uppercase tracking-tight text-[#7c4831] border-b border-[#7c4831]/10 pb-2.5">
          Về Chúng Tôi
        </h2>
        
        <div className="space-y-4 text-sm leading-relaxed text-[#4B3621] font-medium">
          <p>
            <strong className="font-bold text-[#7c4831]">The Moods</strong> ra đời từ tình yêu dành cho những khoảnh khắc bình yên 
            bên tách specialty coffee thủ công chất lượng cao, nơi mỗi tách cà phê mang một cảm xúc riêng.
          </p>
          <p>
            Chúng tôi tự hào tuyển chọn 100% hạt Arabica chất lượng cao từ các nông trại bền vững tại Đắk Lắk và Lâm Đồng, rang mộc tỉ mỉ kết hợp 
            kỹ thuật ủ lạnh độc quyền để mang lại những ly cà phê đậm đà bản sắc đương đại.
          </p>
          <p>
            Hệ thống quản lý chuỗi cửa hàng và nhượng quyền của <strong className="font-bold text-[#7c4831]">The Moods</strong> được vận hành đồng bộ trên nền tảng SaaS thông minh, giúp tối ưu ca trực nhân viên, chấm công và tích điểm ưu đãi thành viên thành một trải nghiệm liền mạch và nhẹ nhàng.
          </p>
        </div>
        
        <div className="mt-8 pt-5 border-t border-[#7c4831]/10 flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-[#7A2F1E] font-semibold">
            <Heart size={12} className="fill-[#7A2F1E]/25" /> Crafted with love
          </span>
          <span className="font-sans font-semibold text-[#7c4831]/60">THE MOODS SPECIALTY</span>
        </div>
      </div>
 
      {/* Liên Hệ */}
      <div className="card" id="contact-info">
        <div className="flex justify-between items-center mb-5">
          <div className="pill pill-blue">
            <Phone size={11} /> KẾT NỐI
          </div>
          <span className="font-sans text-xs font-bold text-[#7c4831]/60">HỖ TRỢ 24/7</span>
        </div>
        
        <h2 className="text-xl font-bold mb-5 uppercase tracking-tight text-[#7c4831] border-b border-[#7c4831]/10 pb-2.5">
          Liên Hệ
        </h2>
        
        <div className="space-y-3.5 text-sm mb-6">
          {[
            { icon: Phone, text: "1900 6868", sub: "08:00 – 22:00" },
            { icon: Mail, text: "hopthu@themoods.vn", sub: "Phản hồi trong 24h" },
            { icon: Clock, text: "07:00 – 22:30 hàng ngày", sub: null },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-[#4B3621] font-semibold">
              <span className="w-8 h-8 rounded-xl bg-[#F4EADF]/40 border border-[#7c4831]/10 flex items-center justify-center shrink-0">
                <item.icon size={13} className="text-[#7c4831]" />
              </span>
              <span>
                {item.text} {item.sub && <span className="text-[#7c4831]/60 text-xs font-normal">({item.sub})</span>}
              </span>
            </div>
          ))}
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <input 
              type="text" 
              placeholder="Họ tên của bạn *" 
              required 
              className="input w-full text-sm font-semibold"
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
              id="contact-name" 
            />
            <input 
              type="email" 
              placeholder="Địa chỉ Email" 
              className="input w-full text-sm font-semibold"
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
              id="contact-email" 
            />
          </div>
          <textarea 
            placeholder="Nội dung góp ý của bạn... *" 
            required 
            rows={3} 
            className="input w-full text-sm resize-none font-semibold"
            value={form.message} 
            onChange={e => setForm({ ...form, message: e.target.value })} 
            id="contact-msg" 
          />
          <button type="submit" className="btn btn-primary w-full py-3.5 text-sm" id="contact-send-btn">
            {sent ? (
              <span className="flex items-center gap-1.5"><CheckCircle size={14} /> Đang gửi thư...</span>
            ) : (
              <span className="flex items-center gap-1.5"><Send size={14} /> Gửi Ý Kiến Đóng Góp</span>
            )}
          </button>
        </form>
 
        <div className="mt-6 pt-4 border-t border-[#7c4831]/10 flex justify-between text-[10px] font-bold text-[#7c4831]/60">
          <span>THE MOODS chuỗi nhượng quyền</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline transition-all">Facebook</a>
            <a href="#" className="hover:underline transition-all">Instagram</a>
          </div>
        </div>
      </div>
    </section>
  );
}
