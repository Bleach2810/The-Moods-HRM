"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { QrCode, BookOpen, Sparkles, History, MessageSquare, User, Phone, Mail, Send, CheckCircle, LogOut, TrendingUp, Gift, ArrowLeft, Lock, Coffee, ChevronRight, Home, Bell } from "lucide-react";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";

export default function CustomerPortal() {
  const { activeBrand, activeLocation, customers, activeCustomer, promotions, logs, feedbacks, menuImage, menuImages, loginCustomer, registerCustomer, logoutCustomer, updateCustomerProfile, useVoucher, sendCustomerFeedback } = useApp();

  const [tab, setTab] = useState<"home" | "menu" | "vouchers" | "feedback" | "profile">("home");
  const [phoneIn, setPhoneIn] = useState("");
  const [nameIn, setNameIn] = useState("");
  const [emailIn, setEmailIn] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpIn, setOtpIn] = useState("");
  const [genOtp, setGenOtp] = useState("");
  const [showReg, setShowReg] = useState(false);
  const [toast, setToast] = useState(false);
  const [fbText, setFbText] = useState("");
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);

  useEffect(() => {
    if (activeCustomer) { setPName(activeCustomer.name); setPEmail(activeCustomer.email); }
  }, [activeCustomer]);

  const locked = activeBrand?.status === "suspended" || activeLocation?.status === "suspended";

  const doOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneIn || phoneIn.length < 9) { alert("Vui lòng nhập số điện thoại hợp lệ!"); return; }
    if (!customers.some(c => c.phone === phoneIn.trim())) {
      setShowReg(true);
      if (!nameIn || !emailIn) { alert("Số điện thoại chưa đăng ký thành viên. Vui lòng nhập thêm Họ tên và Email!"); return; }
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGenOtp(otp); setOtpSent(true); setToast(true);
    setTimeout(() => setToast(false), 15000);
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpIn === genOtp || otpIn === "888999") {
      const p = phoneIn.trim();
      if (!customers.some(c => c.phone === p)) registerCustomer(p, nameIn, emailIn);
      else loginCustomer(p);
      setOtpSent(false); setOtpIn(""); setGenOtp(""); setShowReg(false);
    } else alert("Mã xác thực OTP không đúng!");
  };

  // === LOCK ===
  const LockView = () => (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center space-y-6 anim-fadeUp py-20">
      <div className="w-14 h-14 rounded-full bg-[#FADCD5] flex items-center justify-center shadow-sm">
        <Lock size={22} className="text-[#7A2F1E]" />
      </div>
      <div className="space-y-2">
        <span className="pill pill-red">Dịch Vụ Tạm Khóa</span>
        <h3 className="text-lg font-bold mt-2 uppercase tracking-tight text-[#4B3621]">Hệ Thống Đang Bảo Trì</h3>
        <p className="text-xs text-[#4B3621]/70 max-w-xs mx-auto font-semibold leading-relaxed">
          Tài khoản doanh nghiệp của thương hiệu đang tạm ngưng do gói thuê bao phần mềm quá hạn thanh toán.
        </p>
      </div>
      <Link href="/" className="btn btn-ghost py-2.5 px-5 text-xs flex items-center gap-1.5"><ArrowLeft size={12} /> Quay lại trang chủ</Link>
    </div>
  );

  // === AUTH ===
  const AuthView = () => (
    <div className="flex flex-col justify-center h-full px-5 py-8 min-h-[500px]">
      {toast && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-[#F4EADF] text-[#7c4831] border border-[#7c4831]/10 p-4 rounded-2xl anim-slideDown shadow-md">
          <div className="flex items-start gap-2.5">
            <Mail size={16} className="animate-pulse shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-xs">✉️ OTP SIMULATOR</p>
              <p className="text-[11px] mt-1 font-semibold">Mã xác thực gửi về tin nhắn là:</p>
              <p className="text-base bg-white/60 border border-[#7c4831]/10 rounded px-2 py-0.5 mt-1 font-mono font-black inline-block text-center">{genOtp}</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-8 space-y-3">
        <div className="w-12 h-12 rounded-full bg-[#7c4831] flex items-center justify-center mx-auto shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png?v=5" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight text-[#7c4831]">Đăng Nhập</h2>
        <p className="text-xs text-[#4B3621]/60 font-semibold uppercase tracking-wider">Tích điểm thưởng · Nhận Voucher 55K</p>
      </div>

      {!otpSent ? (
        <form onSubmit={doOtp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#7c4831] uppercase tracking-wider block">Số điện thoại thành viên *</label>
            <input
              type="tel"
              placeholder="Ví dụ: 0912345678"
              required
              value={phoneIn}
              onChange={e => setPhoneIn(e.target.value)}
              className="input w-full text-sm font-semibold"
              id="cust-phone"
            />
          </div>
          {showReg && (
            <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-[#7c4831]/10 space-y-3 anim-fadeUp shadow-sm">
              <p className="text-[10px] font-bold text-[#7c4831] uppercase tracking-wider">📌 Đăng ký thành viên mới:</p>
              <input
                type="text"
                placeholder="Họ và tên đầy đủ *"
                required={showReg}
                value={nameIn}
                onChange={e => setNameIn(e.target.value)}
                className="input w-full text-sm font-semibold"
                id="cust-name"
              />
              <input
                type="email"
                placeholder="Địa chỉ Email nhận OTP *"
                required={showReg}
                value={emailIn}
                onChange={e => setEmailIn(e.target.value)}
                className="input w-full text-sm font-semibold"
                id="cust-email"
              />
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full py-3 text-sm" id="cust-otp-btn">
            {showReg ? "Đăng Ký Thành Viên" : "Gửi Mã OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-4">
          <div className="p-4 rounded-xl bg-white border border-[#7c4831]/10 text-center space-y-1.5 shadow-sm">
            <p className="text-xs font-semibold text-[#7c4831]">Mô phỏng mã OTP đã gửi:</p>
            <p className="text-2xl font-mono font-black tracking-[0.2em] text-[#7c4831]">{genOtp}</p>
          </div>
          <input
            type="text"
            maxLength={6}
            placeholder="Nhập 6 số OTP"
            required
            value={otpIn}
            onChange={e => setOtpIn(e.target.value)}
            className="input w-full text-center tracking-[0.2em] text-lg font-mono font-black"
            id="cust-otp-in"
          />
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setOtpIn(genOtp)} className="btn btn-ghost py-2 text-xs font-bold">Điền nhanh</button>
            <button type="submit" className="btn btn-primary py-2 text-xs font-bold" id="cust-verify">Xác nhận</button>
          </div>
          <button
            type="button"
            onClick={() => { setOtpSent(false); setOtpIn(""); }}
            className="w-full text-center text-xs text-[#7c4831] hover:underline flex items-center justify-center gap-1 mt-2 font-bold transition-all"
          >
            <ArrowLeft size={12} /> Thay số điện thoại
          </button>
        </form>
      )}
    </div>
  );

  // === HOME ===
  const HomeView = () => {
    if (!activeCustomer) return null;
    const prog = activeCustomer.points % 10;
    const pct = Math.min((prog / 10) * 100, 100);
    const vouchers = activeCustomer.vouchers.filter(v => !v.isUsed);
    return (
      <div className="space-y-5 pb-28 anim-fadeUp">
        {/* Lucas User Profile Row */}
        <div className="flex justify-between items-center py-1">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-[#FAF9F6] border border-[#7c4831]/10 flex items-center justify-center text-[#7c4831] font-bold shadow-sm">
              <User size={15} />
            </span>
            <span className="font-extrabold text-sm text-[#4B3621]">{activeCustomer.name}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#7c4831] text-white px-3.5 py-1 rounded-full text-xs font-bold shadow-sm">
            <span className="w-4 h-4 rounded-full bg-[#F5B041] flex items-center justify-center text-[#7c4831] text-[9px] font-black font-mono">C</span>
            <span className="font-mono">{activeCustomer.points.toLocaleString("vi-VN")}</span>
          </div>
        </div>

        {/* Silver Member Loyalty Card */}
        <div className="bg-gradient-to-br from-[#E6CCB2] to-[#DDB892] rounded-[24px] p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 pointer-events-none" />

          <div className="flex justify-between items-center mb-1 relative z-10">
            <span className="font-extrabold text-white text-xs uppercase tracking-widest font-mono">Silver Member</span>
            <span className="text-[9px] font-bold text-white/80 uppercase">Hệ Thống Loyalty</span>
          </div>

          {/* White inner container */}
          <div className="bg-white rounded-2xl p-4 mt-3 relative z-10 shadow-[0_4px_12px_rgba(75,54,33,0.02)]">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#7c4831] mb-1.5 uppercase tracking-wider">
              <span>{((activeCustomer.points % 10) * 55000).toLocaleString("vi-VN")} VND / 550,000 VND</span>
              <Gift size={13} className="text-[#7A2F1E] fill-[#7A2F1E]/5" />
            </div>

            {/* Soft progress bar */}
            <div className="progress-container p-0.5">
              <div
                className="progress-bar transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Centered QR Code */}
            <div className="flex justify-center pt-4 pb-1">
              <div className="p-3 bg-white border border-[#E6CCB2]/20 rounded-2xl shadow-sm">
                <svg width="105" height="105" viewBox="0 0 29 29"><rect width="29" height="29" fill="white" /><path d="M0 0h7v7H0zm22 0h7v7h-7zM0 22h7v7H0zm9 0h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9zm4-4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm4-4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm4-16h2v2h-2zm-2 2h2v2h-2zm-2-4h2v2h-2zm6 2h2v2h-2zm-2 2h2v2h-2zm-4-4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm10 8h2v2h-2zm-2 2h2v2h-2zm-2-4h2v2h-2zm4 4h2v2h-2zm-2 2h2v2h-2zm-4-4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm10 8h2v2h-2zm-2 2h2v2h-2zm-2-4h2v2h-2zm4 4h2v2h-2zm-2 2h2v2h-2zm-4-4h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2z" fill="#7c4831" /><path d="M1 1h5v5H1zm23 0h5v5h-5zM1 23h5v5H1z" fill="#7c4831" /><path d="M2 2h3v3H2zm23 0h3v3h-23zM2 24h3v3H2z" fill="#7c4831" /></svg>
              </div>
            </div>

            <p className="text-[9px] text-center text-[#7c4831]/70 font-bold uppercase tracking-wider mt-2.5">
              Đưa mã này cho nhân sự để tích điểm đơn hàng
            </p>
          </div>
        </div>
      </div>
    );
  };

  // === MENU ===
  const MenuView = () => (
    <div className="space-y-4 pb-28 anim-fadeUp">
      <div className="card">
        <h3 className="text-base font-bold text-[#7c4831] uppercase">Thực Đơn Cửa Hàng</h3>
        <p className="text-xs text-[#4B3621]/70 font-semibold mt-1">Các sản phẩm specialty coffee & thức uống signature</p>
      </div>
      <div className="card p-2 overflow-hidden shadow-sm border border-[#7c4831]/5">
        {menuImages && menuImages.filter((img: any) => img.active).length > 0 ? (
          menuImages.filter((img: any) => img.active).map((img: any) => (
            <img key={img.id} src={img.url} alt="Menu" className="w-full rounded-2xl object-cover mb-4 last:mb-0" />
          ))
        ) : (
          <img src={menuImage} alt="Menu" className="w-full rounded-2xl object-cover" />
        )}
      </div>
    </div>
  );

  // === VOUCHERS & HISTORY ===
  const VouchersView = () => {
    if (!activeCustomer) return null;
    const vouchers = activeCustomer.vouchers.filter(v => !v.isUsed);
    const pLogs = logs.filter(l => l.description.includes(activeCustomer.phone) && l.action.includes("Tích điểm"));
    const used = activeCustomer.vouchers.filter(v => v.isUsed);
    return (
      <div className="space-y-5 pb-28 anim-fadeUp">
        {/* Ad Promotions Feed */}
        <div className="space-y-4 pt-1">
          <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-extrabold text-[#7c4831] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#7c4831]" /> Chương trình ưu đãi nổi bật
            </h4>
            <span className="text-[9px] font-bold text-[#7c4831]/60 hover:underline cursor-pointer uppercase">Xem tất cả</span>
          </div>
          {promotions
            ?.filter((p: any) => {
              const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
              return p.status !== "archived" && !isExpired;
            })
            .map((p: any) => (
              <div
                key={p.id}
                onClick={() => setSelectedPromo(p)}
                className="card overflow-hidden p-0 shadow-sm border border-[#7c4831]/5 cursor-pointer hover:border-[#7c4831]/20 hover:shadow-md transition-all active:scale-98"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.title} className="w-full h-40 object-cover" />
                <div className="p-4 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-[#7c4831]/60">
                    <span className="pill bg-[#F4EADF] text-[#7c4831] text-[8px] tracking-wide">TIN MỚI</span>
                    <span>{p.date}</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-[#4B3621] leading-tight">{p.title}</h4>
                  <p className="text-xs text-[#4B3621]/80 font-medium leading-relaxed line-clamp-2">{p.description}</p>
                </div>
              </div>
            ))}

          {/* Carousel dots */}
          <div className="flex justify-center gap-1.5 pt-2">
            <span className="w-3.5 h-1.5 rounded-full bg-[#7c4831]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c4831]/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c4831]/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#7c4831]/20" />
          </div>
        </div>

        {/* Active Vouchers list */}
        <div className="space-y-3.5">
          <h4 className="text-[11px] font-extrabold text-[#7c4831] flex items-center gap-1.5 uppercase tracking-wider">
            <Gift size={13} className="text-[#7c4831]" /> Quà tặng / Vouchers khả dụng ({vouchers.length})
          </h4>
          {vouchers.length === 0 ? (
            <div className="card text-center border-dashed py-8">
              <p className="text-xs text-[#4B3621]/60 font-semibold italic">Bạn chưa tích đủ 10 điểm để quy đổi voucher 55K.</p>
            </div>
          ) : vouchers.map(v => (
            <div key={v.id} className="card p-4 flex flex-col justify-between shadow-sm relative overflow-hidden border border-[#7c4831]/5">
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-mono text-[9px] font-bold text-[#075985] pill bg-[#E0F2FE]">{v.code}</span>
                <span className="text-[9px] font-bold text-[#4B3621]/60">Hạn dùng: {v.expiry}</span>
              </div>
              <h5 className="text-sm font-extrabold text-[#4B3621] uppercase">{v.title}</h5>
              <p className="text-xs text-[#4B3621]/80 font-medium">
                Giá trị: <span className="text-[#7c4831] font-mono font-black text-sm">{v.value}</span>
              </p>
              <div className="mt-3.5 pt-3.5 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => { if (confirm(`Xác nhận áp dụng voucher ${v.code}?`)) { useVoucher(activeCustomer.phone, v.id); } }}
                  className="btn btn-primary py-1.5 px-4 text-[10px]"
                >
                  Sử dụng ngay
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Points History */}
        <div className="card space-y-4">
          <h4 className="text-xs font-extrabold text-[#7c4831] uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={13} /> Lịch sử tích lũy điểm ({pLogs.length})
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {pLogs.length === 0 ? (
              <p className="text-xs text-[#4B3621]/50 italic">Chưa có giao dịch tích điểm.</p>
            ) : pLogs.map(l => (
              <div key={l.id} className="p-3 rounded-xl bg-[#FAF9F6] text-xs flex justify-between items-start border border-[#7c4831]/5">
                <div>
                  <p className="text-[#4B3621] font-semibold">{l.description.split(".")[1] || l.description}</p>
                  <p className="text-[9px] text-[#7c4831]/60 font-bold uppercase mt-1">{l.time}</p>
                </div>
                <span className="pill bg-[#D3ECE1] text-[#1B523A] text-[8px] font-black shrink-0">+ĐIỂM</span>
              </div>
            ))}
          </div>
        </div>

        {/* Used Vouchers */}
        {used.length > 0 && (
          <div className="card space-y-4 opacity-75">
            <h4 className="text-xs font-extrabold text-[#4B3621]/70 uppercase tracking-wider">🎟️ Voucher đã áp dụng ({used.length})</h4>
            <div className="space-y-3">
              {used.map(v => (
                <div key={v.id} className="p-3 rounded-xl bg-[#FAF9F6] text-xs flex justify-between items-center border border-gray-100">
                  <div className="font-semibold">
                    <p className="text-[#4B3621]">{v.title}</p>
                    <p className="text-[9px] text-[#4B3621]/50 mt-0.5">Mã: {v.code} • Dùng lúc: {v.usedAt || "vừa xong"}</p>
                  </div>
                  <span className="pill bg-[#FADCD5] text-[#7A2F1E] text-[8px]">ĐÃ DÙNG</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // === FEEDBACK ===
  const FbView = () => {
    if (!activeCustomer) return null;
    const mine = feedbacks.filter(f => f.customerPhone === activeCustomer.phone);
    return (
      <div className="space-y-3 pb-28 flex flex-col h-[500px] justify-between anim-fadeUp">
        <div className="card shrink-0">
          <h3 className="text-base font-bold text-[#7c4831] uppercase">Góp Ý & Gửi Phản Hồi</h3>
          <p className="text-xs text-[#4B3621]/60 font-semibold mt-0.5">Chúng tôi luôn lắng nghe ý kiến đóng góp của bạn</p>
        </div>

        <div className="flex-grow my-2 p-4 rounded-2xl bg-white border border-[#7c4831]/10 overflow-y-auto space-y-4 min-h-[250px] shadow-inner">
          {mine.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#4B3621]/40 text-[10px] font-bold text-center p-6">
              <MessageSquare size={20} className="mb-2 text-[#7c4831]/30" />
              CHƯA CÓ TIN NHẮN
            </div>
          ) : mine.map(m => (
            <div key={m.id} className={`flex flex-col max-w-[85%] ${m.sender === "customer" ? "ml-auto items-end" : "mr-auto items-start"}`}>
              <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed ${m.sender === "customer" ? "bg-[#7c4831] text-white rounded-tr-none shadow-sm" : "bg-[#FAF9F6] text-[#4B3621] rounded-tl-none border border-gray-100 shadow-sm"}`}>
                <p>{m.message}</p>
              </div>
              <span className="text-[9px] font-bold text-[#7c4831]/60 mt-1">{m.sender === "customer" ? "Bạn" : "Cửa Hàng"} • {m.timestamp.split(" - ")[0]}</span>
            </div>
          ))}
        </div>

        <form onSubmit={e => { e.preventDefault(); if (!fbText.trim()) return; sendCustomerFeedback(fbText); setFbText(""); }} className="flex gap-2 shrink-0">
          <input
            type="text"
            placeholder="Nhập nội dung tin nhắn gửi tới quán..."
            required
            value={fbText}
            onChange={e => setFbText(e.target.value)}
            className="input flex-grow text-xs font-semibold"
            id="cust-fb-in"
          />
          <button type="submit" className="btn btn-primary px-5 rounded-xl flex items-center justify-center" id="cust-fb-send"><Send size={13} /></button>
        </form>
      </div>
    );
  };

  // === PROFILE ===
  const ProfileView = () => {
    if (!activeCustomer) return null;
    return (
      <div className="space-y-5 pb-28 anim-fadeUp">
        <div className="card">
          <h3 className="text-base font-bold text-[#7c4831] uppercase">Hồ Sơ Cá Nhân</h3>
        </div>

        <form onSubmit={e => { e.preventDefault(); updateCustomerProfile(pName, pEmail); setSaved(true); setTimeout(() => setSaved(false), 3000); }} className="card space-y-4">
          {saved && (
            <div className="p-3 bg-[#D3ECE1] rounded-xl text-xs text-[#1B523A] flex items-center gap-1.5 font-bold shadow-sm">
              <CheckCircle size={14} /> Đã cập nhật thành công!
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#7c4831] font-bold uppercase tracking-wider block">Số điện thoại</label>
            <input type="text" disabled value={activeCustomer.phone} className="input w-full text-sm opacity-60 cursor-not-allowed font-mono font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#4B3621]/80 font-bold uppercase tracking-wider block">Họ và tên *</label>
            <input type="text" required value={pName} onChange={e => setPName(e.target.value)} className="input w-full text-sm font-semibold" id="cust-p-name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#4B3621]/80 font-bold uppercase tracking-wider block">Địa chỉ Email *</label>
            <input type="email" required value={pEmail} onChange={e => setPEmail(e.target.value)} className="input w-full text-sm font-semibold" id="cust-p-email" />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3.5 text-sm font-bold" id="cust-save">Lưu hồ sơ</button>
        </form>

        <button onClick={() => { logoutCustomer(); }} className="btn btn-ghost w-full py-3.5 text-sm flex items-center gap-1.5 font-bold" id="cust-logout"><LogOut size={14} /> Đăng xuất tài khoản</button>
      </div>
    );
  };

  const tabs = [
    { key: "home", icon: Home, label: "Home" },
    { key: "vouchers", icon: Gift, label: "Ưu đãi" },
    { key: "menu", icon: BookOpen, label: "Menu" },
    { key: "feedback", icon: MessageSquare, label: "Góp ý" },
    { key: "profile", icon: User, label: "Hồ sơ" },
  ];

  const Content = () => {
    if (locked) return LockView();
    if (!activeCustomer) return AuthView();
    switch (tab) {
      case "menu": return MenuView();
      case "vouchers": return VouchersView();
      case "feedback": return FbView();
      case "profile": return ProfileView();
      default: return HomeView();
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden text-[#4B3621] flex flex-col antialiased">
      <div className="flex-grow max-w-md w-full mx-auto flex flex-col relative border-x border-[#7c4831]/10 shadow-sm h-screen max-h-screen overflow-hidden">

        {/* Header PWA exactly like screenshot */}
        <header className="bg-[#F4EADF] px-4 py-4 shrink-0 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            <Link href="/" className="w-7 h-7 rounded-full bg-white border border-[#7c4831]/10 flex items-center justify-center hover:scale-95 transition-transform mr-1" id="cust-back-btn">
              <ArrowLeft size={12} className="text-[#7c4831]" />
            </Link>
            <span className="w-8 h-8 rounded-full bg-[#7c4831] flex items-center justify-center text-white text-xs font-bold font-mono">
              TM
            </span>
            <div>
              <span className="font-extrabold text-[13px] uppercase tracking-wider text-[#7c4831] block leading-none">{activeBrand ? activeBrand.name.split(" - ")[0] : "The Moods"}</span>
              <span className="text-[7.5px] font-bold text-[#7c4831]/60 uppercase tracking-widest leading-none mt-1 block">Coffee & Tea Garden</span>
            </div>
          </div>
          <button className="text-[#7c4831] p-1 bg-white rounded-full border border-gray-100 hover:scale-95 transition-transform" id="cust-bell-btn">
            <Bell size={15} />
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto relative">
          <PullToRefresh>
            {Content()}
          </PullToRefresh>
        </main>

        {activeCustomer && !locked && (
          <nav className="absolute bottom-3 left-3 right-3 glass-nav rounded-2xl py-2 px-1 grid grid-cols-5 gap-0.5 z-30">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${tab === key ? "bg-[#7c4831] text-white shadow-sm" : "text-[#7c4831] hover:bg-[#7c4831]/5 font-semibold"}`}
                id={`tab-${key}`}
              >
                <Icon size={16} />
                <span className="text-[8px] font-bold mt-1">{label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Premium Promotion Detail Modal Sheet */}
        {selectedPromo && (
          <div className="absolute inset-0 bg-[#4B3621]/40 backdrop-blur-xs z-50 flex items-end justify-center anim-backdrop">
            <div className="bg-white w-full rounded-t-[32px] max-h-[85%] overflow-y-auto p-6 space-y-5 anim-sheet border-t border-[#7c4831]/10 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex justify-between items-start mb-2.5">
                  <span className="pill bg-[#F4EADF] text-[#7c4831] text-[9px] font-bold tracking-wide">CHI TIẾT ƯU ĐÃI</span>
                  <button
                    onClick={() => setSelectedPromo(null)}
                    className="w-7 h-7 rounded-full bg-[#FAF9F6] border border-[#7c4831]/10 flex items-center justify-center text-[#7c4831] font-bold hover:scale-95 active:scale-90 transition-all shadow-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedPromo.image} alt={selectedPromo.title} className="w-full h-48 object-cover rounded-2xl border border-[#7c4831]/5 shadow-sm" />

                <div className="space-y-2 mt-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Ngày đăng: {selectedPromo.date}</span>
                  <h3 className="text-base font-extrabold text-[#4B3621] uppercase leading-tight">{selectedPromo.title}</h3>
                  <p className="text-xs text-[#4B3621]/80 font-medium leading-relaxed pt-2.5 whitespace-pre-line border-t border-[#7c4831]/5">
                    {selectedPromo.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 shrink-0">
                <button
                  onClick={() => setSelectedPromo(null)}
                  className="btn btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider"
                >
                  Đóng bài viết
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
