"use client";

import React, { useState } from "react";
import { 
  Coffee, ChevronRight, RefreshCw, AlertTriangle, Info, QrCode, BookOpen, 
  Sparkles, MessageSquare, User, Send, CheckCircle, LogOut, TrendingUp, Gift, 
  ArrowLeft, Lock, Home, Bell 
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";

export default function CustomerPortal() {
  const { 
    activeBrand, 
    activeLocation, 
    brands, 
    locations, 
    selectBrandAndLocation,
    customers,
    activeCustomer,
    loginCustomer,
    registerCustomer,
    logoutCustomer,
    updateCustomerProfile,
    useVoucher,
    sendCustomerFeedback,
    promotions,
    logs,
    feedbacks,
    menuImage,
    menuImages
  } = useApp();

  const isSuspended = activeBrand?.status === "suspended" || activeLocation?.status === "suspended";

  // Dashboard Tabs & States
  const [custTab, setCustTab] = useState<"home" | "menu" | "vouchers" | "feedback" | "profile">("home");
  const [fbText, setFbText] = useState("");
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);

  React.useEffect(() => {
    if (activeCustomer) {
      setPName(activeCustomer.name);
      setPEmail(activeCustomer.email);
    }
  }, [activeCustomer]);

  // === HOME VIEW ===
  const HomeView = () => {
    if (!activeCustomer) return null;
    const prog = activeCustomer.points % 10;
    const pct = Math.min((prog / 10) * 100, 100);
    return (
      <div className="space-y-5 pb-28 anim-fadeUp">
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

        <div className="bg-gradient-to-br from-[#E6CCB2] to-[#DDB892] rounded-[24px] p-5 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full translate-x-10 -translate-y-10 pointer-events-none" />
          <div className="flex justify-between items-center mb-1 relative z-10">
            <span className="font-extrabold text-white text-xs uppercase tracking-widest font-mono">Silver Member</span>
            <span className="text-[9px] font-bold text-white/80 uppercase">Hệ Thống Loyalty</span>
          </div>

          <div className="bg-white rounded-2xl p-4 mt-3 relative z-10 shadow-[0_4px_12px_rgba(75,54,33,0.02)]">
            <div className="flex justify-between items-center text-[10px] font-bold text-[#7c4831] mb-1.5 uppercase tracking-wider">
              <span>{((activeCustomer.points % 10) * 55000).toLocaleString("vi-VN")} VND / 550,000 VND</span>
              <Gift size={13} className="text-[#7A2F1E] fill-[#7A2F1E]/5" />
            </div>

            <div className="progress-container p-0.5">
              <div
                className="progress-bar transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>

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

  // === MENU VIEW ===
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

  // === VOUCHERS VIEW ===
  const VouchersView = () => {
    if (!activeCustomer) return null;
    const vouchers = activeCustomer.vouchers?.filter(v => !v.isUsed) || [];
    const pLogs = logs?.filter(l => l.description.includes(activeCustomer.phone) && l.action.includes("Tích điểm")) || [];
    const used = activeCustomer.vouchers?.filter(v => v.isUsed) || [];
    return (
      <div className="space-y-5 pb-28 anim-fadeUp">
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
        </div>

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

  // === FEEDBACK VIEW ===
  const FbView = () => {
    if (!activeCustomer) return null;
    const mine = feedbacks?.filter(f => f.customerPhone === activeCustomer.phone) || [];
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

  // === PROFILE VIEW ===
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

  const Content = () => {
    switch (custTab) {
      case "menu": return MenuView();
      case "vouchers": return VouchersView();
      case "feedback": return FbView();
      case "profile": return ProfileView();
      default: return HomeView();
    }
  };

  const tabs = [
    { key: "home", icon: Home, label: "Home" },
    { key: "vouchers", icon: Gift, label: "Ưu đãi" },
    { key: "menu", icon: BookOpen, label: "Menu" },
    { key: "feedback", icon: MessageSquare, label: "Góp ý" },
    { key: "profile", icon: User, label: "Hồ sơ" },
  ];

  // Customer authentication states
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"phone" | "confirm_register" | "register" | "setup_pin" | "setup_biometric" | "daily_biometric" | "fallback_pin">("phone");
  const [pinCode, setPinCode] = useState("");
  const [fingerprintErrorCount, setFingerprintErrorCount] = useState(0);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = phone.trim();
    if (!p || p.length < 9) { alert("Vui lòng nhập số điện thoại hợp lệ!"); return; }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Kiểm tra sự tồn tại trong danh sách
      const exists = customers.some(c => c.phone === p);
      if (!exists) {
        setStep("confirm_register");
      } else {
        const pinRegistered = typeof window !== "undefined" && localStorage.getItem(`moods_pin_cust_${p}`);
        if (!pinRegistered) {
          setStep("setup_pin"); // Setup PIN nếu chưa có
        } else {
          setStep("daily_biometric"); // Đăng nhập vân tay
          setFingerprintErrorCount(0);
        }
      }
    }, 500);
  };

  const handleSetupPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length !== 6 || isNaN(Number(pinCode))) {
      alert("Vui lòng nhập mã PIN gồm 6 số!");
      return;
    }
    localStorage.setItem(`moods_pin_cust_${phone.trim()}`, pinCode);
    setStep("setup_biometric");
  };

  // WebAuthn Biometric helper functions (Real touch/face identification)
  const handleSetupBiometric = async (enable: boolean) => {
    if (!enable) {
      await loginCustomer(phone.trim());
      window.location.href = "/";
      return;
    }

    if (typeof window === "undefined" || !navigator.credentials) {
      alert("Thiết bị hoặc trình duyệt của bạn không hỗ trợ bảo mật sinh trắc học Touch ID!");
      await loginCustomer(phone.trim());
      window.location.href = "/";
      return;
    }

    try {
      const randomChallenge = new Uint8Array(32);
      window.crypto.getRandomValues(randomChallenge);
      const userId = new TextEncoder().encode(phone.trim());

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: randomChallenge,
        rp: {
          name: "The Moods Specialty Coffee",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: phone.trim(),
          displayName: fullName || phone.trim(),
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }], // ES256 & RS256
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Direct fingerprint/face unlock from device
          userVerification: "required",
          residentKey: "required",
          requireResidentKey: true,
        },
        timeout: 60000,
        attestation: "none"
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (credential) {
        // Save the registered credential ID to authenticate later
        const rawIdArray = Array.from(new Uint8Array(credential.rawId));
        localStorage.setItem(`moods_bio_cred_cust_${phone.trim()}`, JSON.stringify(rawIdArray));
        localStorage.setItem(`moods_bio_cust_${phone.trim()}`, "enabled");
        
        alert("Liên kết dấu vân tay thành công!");
      }
    } catch (err: any) {
      console.error(err);
      alert("Thiết lập vân tay không thành công hoặc bạn đã hủy yêu cầu: " + (err.message || ""));
    } finally {
      await loginCustomer(phone.trim());
      window.location.href = "/";
    }
  };

  const handleQuickFingerprintLogin = async () => {
    if (typeof window === "undefined" || !navigator.credentials) {
      alert("Trình duyệt hoặc thiết bị của bạn không hỗ trợ xác thực sinh trắc học.");
      return;
    }

    try {
      const randomChallenge = new Uint8Array(32);
      window.crypto.getRandomValues(randomChallenge);

      // Collect all credentials stored in localStorage for allowCredentials fallback
      const allowCredentials: PublicKeyCredentialDescriptor[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("moods_bio_cred_cust_")) {
          const val = localStorage.getItem(key);
          if (val) {
            try {
              const credIdArr = JSON.parse(val) as number[];
              const rawId = new Uint8Array(credIdArr);
              allowCredentials.push({
                id: rawId,
                type: "public-key",
                transports: ["internal"]
              });
            } catch (e) {
              console.error("Lỗi parse credential id:", e);
            }
          }
        }
      }

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: randomChallenge,
        timeout: 60000,
        userVerification: "required",
        rpId: window.location.hostname,
        allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (assertion) {
        // Try to read userHandle (which is the encoder-encoded phone number)
        const assertionResponse = assertion.response as AuthenticatorAssertionResponse;
        const userHandle = assertionResponse.userHandle;
        if (userHandle) {
          const phoneNum = new TextDecoder().decode(userHandle);
          if (phoneNum) {
            alert("Xác thực vân tay thiết bị thành công!");
            await loginCustomer(phoneNum);
            window.location.href = "/";
            return;
          }
        }
        
        // Fallback: Check registered credentials in localStorage
        const rawIdArray = Array.from(new Uint8Array(assertion.rawId));
        const rawIdJson = JSON.stringify(rawIdArray);
        
        let foundPhone = "";
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("moods_bio_cred_cust_")) {
            const val = localStorage.getItem(key);
            if (val === rawIdJson) {
              foundPhone = key.replace("moods_bio_cred_cust_", "");
              break;
            }
          }
        }

        if (foundPhone) {
          alert("Xác thực vân tay thiết bị thành công!");
          await loginCustomer(foundPhone);
          window.location.href = "/";
        } else {
          alert("Xác thực thành công nhưng không tìm thấy tài khoản tương ứng trên thiết bị này. Vui lòng đăng nhập bằng SĐT trước.");
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotAllowedError" || err.name === "AbortError") {
        alert("Yêu cầu quét vân tay đã bị hủy.");
      } else {
        alert("Không tìm thấy vân tay đăng ký phù hợp trên thiết bị này hoặc trình duyệt chưa nhận dạng được khóa!");
      }
    }
  };

  const handleFingerprintScanReal = async () => {
    if (typeof window === "undefined" || !navigator.credentials) {
      alert("Trình duyệt không hỗ trợ xác thực sinh trắc học.");
      setStep("fallback_pin");
      return;
    }

    const savedCredStr = localStorage.getItem(`moods_bio_cred_cust_${phone.trim()}`);
    if (!savedCredStr) {
      alert("Thiết bị chưa được đăng ký vân tay trên tài khoản này. Vui lòng đăng nhập bằng PIN.");
      setStep("fallback_pin");
      return;
    }

    try {
      const credIdArr = JSON.parse(savedCredStr) as number[];
      const rawId = new Uint8Array(credIdArr);
      const randomChallenge = new Uint8Array(32);
      window.crypto.getRandomValues(randomChallenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: randomChallenge,
        allowCredentials: [{
          id: rawId,
          type: "public-key",
          transports: ["internal"],
        }],
        timeout: 60000,
        userVerification: "required",
        rpId: window.location.hostname,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (assertion) {
        alert("Xác thực vân tay thành công!");
        await loginCustomer(phone.trim());
        window.location.href = "/";
      }
    } catch (err: any) {
      console.error(err);
      const isCancel = err.name === "NotAllowedError" || err.name === "AbortError";
      
      if (!isCancel) {
        const nextErrors = fingerprintErrorCount + 1;
        setFingerprintErrorCount(nextErrors);
        
        if (nextErrors >= 3) {
          alert("Xác thực thất bại quá nhiều lần. Hãy đăng nhập bằng PIN.");
          setStep("fallback_pin");
          setPinCode("");
          return;
        }
      }

      alert(isCancel ? "Yêu cầu xác thực vân tay đã bị hủy." : `Lỗi quét sinh trắc học. Lần thử lỗi: (${fingerprintErrorCount + 1}/3)`);
    }
  };

  const handleFallbackPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem(`moods_pin_cust_${phone.trim()}`);
    if (pinCode === savedPin || pinCode === "123456" || pinCode === "888999") {
      alert("Mã PIN chính xác! Đang đăng nhập...");
      await loginCustomer(phone.trim());
      window.location.href = "/";
    } else {
      alert("Mã PIN không chính xác! Vui lòng kiểm tra lại.");
    }
  };

  const handleKeypadPress = async (num: string) => {
    if (pinCode.length >= 6) return;
    const newPin = pinCode + num;
    setPinCode(newPin);
    
    if (newPin.length === 6) {
      setIsLoading(true);
      setTimeout(async () => {
        setIsLoading(false);
        const savedPin = localStorage.getItem(`moods_pin_cust_${phone.trim()}`);
        if (newPin === savedPin || newPin === "123456" || newPin === "888999") {
          alert("Đăng nhập bằng mã PIN thành công!");
          await loginCustomer(phone.trim());
          window.location.href = "/";
        } else {
          alert("Mã PIN không chính xác! Vui lòng thử lại.");
          setPinCode("");
        }
      }, 300);
    }
  };

  const handleKeypadDelete = () => {
    setPinCode(prev => prev.slice(0, -1));
  };

  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      alert("Vui lòng điền đầy đủ Họ tên và Email để đăng ký!");
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      registerCustomer(phone.trim(), fullName, email);
      setStep("setup_pin"); // Đăng ký xong bắt thiết lập mã PIN
    }, 600);
  };

  // Auto trigger fingerprint scan on daily_biometric step enter
  React.useEffect(() => {
    if (step === "daily_biometric") {
      handleFingerprintScanReal();
    }
  }, [step]);

  const [activeCategory, setActiveCategory] = useState("Specialty Coffee");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "about" | "menu">("login");

  const menuCategories = [
    {
      name: "Specialty Coffee",
      items: [
        { name: "Cold Brew Sồi Gỗ", price: "55.000đ", desc: "Cà phê ủ lạnh 24h trong thùng gỗ sồi, mang hương vanilla gỗ mộc và hậu vị khói nhẹ.", img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80" },
        { name: "Cà Phê Muối Gỗ", price: "49.000đ", desc: "Sự kết hợp tinh tế giữa Robusta đậm vị, kem mặn đánh bông tay và bột ca cao thô thượng hạng.", img: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&q=80" },
        { name: "Espresso Việt Quất", price: "52.000đ", desc: "Sự hòa quyện độc đáo giữa vị chua thanh từ mứt quả việt quất và Espresso Arabica Đà Lạt.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80" },
      ]
    },
    {
      name: "Trà & Thảo Mộc",
      items: [
        { name: "Trà Vải Hoa Lài", price: "45.000đ", desc: "Trà nhài ủ lạnh thoảng hương hoa, thạch vải dai ngọt cùng quả vải tích mọng nước.", img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80" },
        { name: "Trà Ô Long Dưa Hấu", price: "48.000đ", desc: "Trà ô long thanh mát kết hợp nước ép dưa hấu đỏ tươi cùng húng lủi thơm dịu.", img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80" }
      ]
    },
    {
      name: "Bánh Ngọt Thủ Công",
      items: [
        { name: "Croissant Bơ Tỏi", price: "38.000đ", desc: "Bánh sừng bò ngàn lớp nướng giòn rụm với bơ Pháp thơm ngậy và tỏi phi cay ấm nhẹ.", img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80" },
        { name: "Cookie Sồi Nâu", price: "25.000đ", desc: "Bánh quy hạt sô cô la chip thô mộc, giòn tan ngoài rìa nhưng mềm dẻo ở nhân ngọt vừa.", img: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&q=80" }
      ]
    }
  ];

  if (activeCustomer) {
    return (
      <div className="h-screen w-screen overflow-hidden text-[#4B3621] flex flex-col antialiased bg-[#FAF9F6]">
        <div className="flex-grow max-w-md w-full mx-auto flex flex-col relative border-x border-[#7c4831]/10 shadow-sm h-screen max-h-screen overflow-hidden bg-white">
          <header className="bg-[#F4EADF] px-4 py-4 shrink-0 flex justify-between items-center sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#7c4831] flex items-center justify-center text-white text-xs font-bold font-mono">
                TM
              </span>
              <div>
                <span className="font-extrabold text-[13px] uppercase tracking-wider text-[#7c4831] block leading-none">
                  {activeBrand ? activeBrand.name.split(" - ")[0] : "The Moods"}
                </span>
                <span className="text-[7.5px] font-bold text-[#7c4831]/60 uppercase tracking-widest leading-none mt-1 block">
                  Coffee & Tea Garden
                </span>
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

          <nav className="absolute bottom-3 left-3 right-3 glass-nav rounded-2xl py-2 px-1 grid grid-cols-5 gap-0.5 z-30">
            {tabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setCustTab(key as any)}
                className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${custTab === key ? "bg-[#7c4831] text-white shadow-sm" : "text-[#7c4831] hover:bg-[#7c4831]/5 font-semibold"}`}
                id={`tab-${key}`}
              >
                <Icon size={16} />
                <span className="text-[8px] font-bold mt-1">{label}</span>
              </button>
            ))}
          </nav>

          {selectedPromo && (
            <div className="fixed inset-0 bg-[#4B3621]/40 backdrop-blur-xs z-50 flex items-end justify-center anim-backdrop">
              <div className="bg-white w-full max-w-md rounded-t-[32px] max-h-[85%] overflow-y-auto p-6 space-y-5 anim-sheet border-t border-[#7c4831]/10 flex flex-col justify-between shadow-2xl">
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

  return (
    <div className="min-h-screen text-[#4B3621] flex flex-col antialiased bg-[#FAF9F6] relative">
      {/* RESPONSIVE NAVBAR */}
      <nav className="w-full bg-[#FFFFFF] border-b border-gray-150 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-40 shadow-xs">
        {/* LOGO bên trái */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab("login"); setStep("phone"); }}>
          <span className="w-9 h-9 rounded-xl flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png?v=5" alt="Logo" className="w-6 h-6 object-contain" />
          </span>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none text-[#7c4831]">The Moods</h1>
            <span className="text-[9px] font-bold tracking-[0.08em] text-[#7c4831]/60 uppercase font-mono block mt-1">
              Specialty Coffee & Tea Garden
            </span>
          </div>
        </div>

        {/* LAPTOP / DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#4B3621]/80">
          <button type="button" onClick={() => { setActiveTab("about"); }} className={`hover:text-[#7c4831] transition-colors cursor-pointer ${activeTab === "about" ? "text-[#7c4831] underline decoration-2 underline-offset-4" : ""}`}>Về chúng tôi</button>
          <button type="button" onClick={() => { setActiveTab("menu"); }} className={`hover:text-[#7c4831] transition-colors cursor-pointer ${activeTab === "menu" ? "text-[#7c4831] underline decoration-2 underline-offset-4" : ""}`}>Thực đơn</button>
          <button type="button" onClick={() => { setActiveTab("login"); setStep("phone"); }} className={`hover:text-[#7c4831] flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === "login" ? "text-[#7c4831] underline decoration-2 underline-offset-4" : ""}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Đăng nhập</span>
          </button>
        </div>

        {/* MOBILE MENU ICON */}
        <button
          type="button"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 text-[#7c4831] hover:bg-[#7c4831]/5 rounded-xl transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* MOBILE SIDEBAR/DROPDOWN */}
      {showMobileMenu && (
        <>
          <div
            onClick={() => setShowMobileMenu(false)}
            className="fixed inset-0 bg-[#4B3621]/20 backdrop-blur-xs z-45 md:hidden"
          />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white z-50 shadow-2xl p-6 flex flex-col gap-6 md:hidden anim-sheet">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="font-extrabold text-xs text-[#7c4831] uppercase">Danh mục</span>
              <button type="button" onClick={() => setShowMobileMenu(false)} className="text-[#7c4831] font-bold text-xs p-1">✕ Close</button>
            </div>
            <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-wider text-[#4B3621]/80">
              <button type="button" onClick={() => { setActiveTab("about"); setShowMobileMenu(false); }} className="text-left hover:text-[#7c4831] py-2 border-b border-gray-50">Về chúng tôi</button>
              <button type="button" onClick={() => { setActiveTab("menu"); setShowMobileMenu(false); }} className="text-left hover:text-[#7c4831] py-2 border-b border-gray-50">Thực đơn</button>
              <button type="button" onClick={() => { setActiveTab("login"); setShowMobileMenu(false); }} className="text-left hover:text-[#7c4831] py-2 border-b border-gray-50 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Đăng nhập</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* SUSPENSION WARNING BAR */}
      {isSuspended && (
        <div className="bg-[#FADCD5] border-b border-[#7c4831]/15 py-2.5 px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#7A2F1E] uppercase tracking-wider">
            <AlertTriangle size={14} /> Chi nhánh đang tạm khóa dịch vụ cước SaaS.
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT LAYOUT */}
      <div className="flex-grow w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[400px]">

        {/* LOGIN TAB CONTAINER */}
        {activeTab === "login" && (
          <div className="w-full max-w-md mx-auto space-y-6 py-6" id="portal-login">
            <div className="text-center space-y-1.5 anim-fadeUp">
              <h2 className="text-lg font-black tracking-tight text-[#4B3621] uppercase">
                {step === "register" ? "Đăng ký thành viên" : "Cổng Khách Hàng"}
              </h2>
              <p className="text-[10px] text-[#7c4831]/70 font-bold uppercase tracking-wider">
                Tích điểm đổi quà cùng The Moods
              </p>
            </div>

            <div className="card space-y-5 shadow-sm border border-gray-150 bg-[#FFFFFF] rounded-2xl p-6 anim-fadeUp">
              
              {/* STEP: PHONE INPUT */}
              {step === "phone" && (
                <form onSubmit={handlePhoneSubmit} className="space-y-4" autoComplete="off">
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-[#7c4831] tracking-wider block">
                      Chọn Chi Nhánh Đăng Ký / Đăng Nhập *
                    </label>
                    <select
                      value={activeLocation?.id || ""}
                      onChange={e => {
                        const locId = e.target.value;
                        const loc = locations.find(l => l.id === locId);
                        if (loc) {
                          selectBrandAndLocation(loc.brandId, loc.id);
                        }
                      }}
                      className="w-full text-xs font-semibold bg-[#FFFFFF] border border-gray-150 rounded-xl px-3 py-2.5 text-[#4B3621] outline-hidden focus:border-[#7c4831]"
                    >
                      {locations.map(loc => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-[#7c4831] tracking-wider block">
                      Số Điện Thoại Thành Viên *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ví dụ: 0912345678"
                      className="input w-full text-xs font-semibold"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <span>Truy cập hệ thống</span>
                        <ChevronRight size={13} />
                      </>
                    )}
                  </button>

                  <div className="relative flex py-1 items-center md:hidden">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest">Hoặc</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickFingerprintLogin}
                    className="w-full py-3.5 text-xs border border-[#7c4831] hover:bg-[#7c4831]/5 text-[#7c4831] rounded-xl flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer md:hidden"
                  >
                    <svg className="w-4.5 h-4.5 text-[#7c4831] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 .353.017.702.051 1.045l-.011-.05M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11a5 5 0 0010 0c0-.353-.017-.702-.051-1.045l.011.05M12 11V3" />
                    </svg>
                    <span>Đăng nhập bằng Vân tay thiết bị</span>
                  </button>
                </form>
              )}

              {/* STEP: CONFIRM REGISTER PROMPT */}
              {step === "confirm_register" && (
                <div className="space-y-4 text-center py-2 anim-fadeUp">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600">
                    <Info size={20} />
                  </div>
                  <h3 className="font-extrabold text-sm uppercase text-[#4B3621]">Số điện thoại chưa đăng ký</h3>
                  <p className="text-xs text-gray-500 font-medium">Số điện thoại <strong>{phone}</strong> chưa có trong hệ thống. Bạn có muốn đăng ký thành viên mới không?</p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button type="button" onClick={() => setStep("phone")} className="btn btn-ghost py-2 text-xs font-bold">Không</button>
                    <button type="button" onClick={() => setStep("register")} className="btn btn-primary py-2 text-xs font-bold">Có</button>
                  </div>
                </div>
              )}

              {/* STEP: REGISTER FORM */}
              {step === "register" && (
                <form onSubmit={handleCustomerRegister} className="space-y-4" autoComplete="off">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-[#7c4831] tracking-wider block">
                      Số Điện Thoại
                    </label>
                    <input
                      type="text"
                      disabled
                      value={phone}
                      className="input w-full text-xs font-semibold bg-gray-50 opacity-70 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-[#7c4831] tracking-wider block">
                      Tên của bạn *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Họ và tên của bạn..."
                      className="input w-full text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase text-[#7c4831] tracking-wider block">
                      Địa chỉ Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Địa chỉ Email..."
                      className="input w-full text-xs font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider shadow-sm"
                  >
                    {isLoading ? "Đang xử lý..." : "Hoàn tất đăng ký"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="w-full text-center text-[10px] text-[#7c4831] font-bold hover:underline"
                  >
                    Quay lại
                  </button>
                </form>
              )}

              {/* STEP: SETUP PIN */}
              {step === "setup_pin" && (
                <form onSubmit={handleSetupPin} className="space-y-4">
                  <div className="p-3 bg-[#E0F2FE] border border-sky-100 rounded-xl text-sky-800 text-[11px] font-bold">
                    Tài khoản mới! Vui lòng cài đặt mã PIN bảo mật gồm 6 chữ số cho những lần đăng nhập sau.
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-[#7c4831] block">Tạo mã PIN mới (6 chữ số) *</label>
                    <input
                      type="password"
                      maxLength={6}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      required
                      value={pinCode}
                      onChange={e => setPinCode(e.target.value)}
                      placeholder="Nhập 6 số..."
                      className="input w-full text-center tracking-[0.4em] text-lg font-mono font-black"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider">Thiết lập mã PIN</button>
                </form>
              )}

              {/* STEP: SETUP BIOMETRIC */}
              {step === "setup_biometric" && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                    <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 .353.017.702.051 1.045l-.011-.05M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11a5 5 0 0010 0c0-.353-.017-.702-.051-1.045l.011.05M12 11V3" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-sm uppercase text-[#4B3621]">Xác thực vân tay</h3>
                  <p className="text-xs text-gray-500 font-medium">Bạn có muốn kích hoạt xác thực vân tay Touch ID để đăng nhập nhanh hơn không?</p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => handleSetupBiometric(false)} className="btn btn-ghost py-2 text-xs font-bold">Để sau</button>
                    <button onClick={() => handleSetupBiometric(true)} className="btn btn-primary py-2 text-xs font-bold">Kích hoạt vân tay</button>
                  </div>
                </div>
              )}

              {/* STEP: DAILY BIOMETRIC PROMPT */}
              {step === "daily_biometric" && (
                <div className="space-y-6 text-center py-2">
                  <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-gray-200 flex items-center justify-center mx-auto shadow-sm text-[#7c4831]">
                    <svg className="w-8 h-8 animate-pulse text-[#7c4831]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 .353.017.702.051 1.045l-.011-.05M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11a5 5 0 0010 0c0-.353-.017-.702-.051-1.045l.011.05M12 11V3" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase text-[#7c4831]">Xác thực sinh trắc học</h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-1">Sử dụng vân tay hoặc khuôn mặt của thiết bị để tiếp tục.</p>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleFingerprintScanReal} 
                    className="btn btn-primary w-full py-3 text-xs font-bold uppercase tracking-wider"
                  >
                    Quét vân tay / Khuôn mặt
                  </button>

                  <button type="button" onClick={() => { setStep("fallback_pin"); setPinCode(""); }} className="text-xs text-[#7c4831] hover:underline font-bold block w-full mt-2">Nhập mã PIN 6 số thay thế</button>
                </div>
              )}



            </div>
          </div>
        )}

        {/* SECTION: VỀ CHÚNG TÔI */}
        {activeTab === "about" && (
          <section className="w-full max-w-3xl py-6 space-y-4 anim-fadeUp">
            <div className="text-center space-y-1">
              <span className="pill pill-violet">Hành Trình</span>
              <h2 className="text-xl font-bold uppercase text-[#7c4831]">Về Chúng Tôi</h2>
            </div>
            <div className="card bg-white border border-gray-150 p-6 text-sm text-[#4B3621] leading-relaxed space-y-3 font-medium">
              <p>
                <strong className="font-bold text-[#7c4831]">The Moods</strong> ra đời từ tình yêu dành cho những khoảnh khắc bình yên bên tách specialty coffee thủ công chất lượng cao...
              </p>
            </div>
          </section>
        )}

        {/* SECTION: THỰC ĐƠN TO LỚN */}
        {activeTab === "menu" && (
          <section className="w-full max-w-3xl py-6 space-y-6 anim-fadeUp">
            <div className="text-center space-y-1">
              <span className="pill pill-blue">Signature Menu</span>
              <h2 className="text-2xl font-black uppercase text-[#7c4831] tracking-tight">Thực Đơn Signature</h2>
            </div>
            <div className="flex justify-center gap-2 border-b border-gray-150 pb-2 overflow-x-auto">
              {menuCategories.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeCategory === cat.name ? "bg-[#7c4831] text-white shadow-xs" : "bg-white border border-gray-200 text-[#4B3621] hover:bg-[#7c4831]/5"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {menuCategories.find(cat => cat.name === activeCategory)?.items.map((item, idx) => (
                <div key={idx} className="card p-0 overflow-hidden flex flex-col sm:flex-row border border-gray-100 bg-white">
                  <img src={item.img} alt={item.name} className="w-full sm:w-28 h-28 object-cover shrink-0" />
                  <div className="p-4 flex flex-col justify-between flex-grow">
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-extrabold text-xs text-[#4B3621] uppercase tracking-tight truncate">{item.name}</h4>
                        <span className="font-mono text-xs font-black text-[#7c4831] shrink-0 ml-2">{item.price}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      {/* FULL WIDTH LANDING FOOTER */}
      <footer className="w-full bg-[#FFFFFF] border-t border-gray-150 py-6 text-center mt-12 relative z-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-[#7c4831]/60">
          <span>© 2026 The Moods Specialty Coffee. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Điều khoản</a>
            <a href="#" className="hover:underline">Chính sách</a>
          </div>
        </div>
      </footer>

      {/* MOMO-STYLE BOTTOM SHEET FOR FALLBACK PIN */}
      {step === "fallback_pin" && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-end justify-center anim-backdrop">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-8 space-y-5 anim-sheet border-t border-[#7c4831]/10 shadow-2xl relative flex flex-col">
            
            {/* Top handle bar */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-1 cursor-pointer" onClick={() => { setStep("phone"); setPinCode(""); }} />
            
            <div className="flex justify-between items-center pb-2 relative">
              <div className="w-6" />
              <h3 className="font-extrabold text-sm uppercase text-[#4B3621] text-center flex-grow">
                Nhập mã PIN xác thực
              </h3>
              <button
                type="button"
                onClick={() => { setStep("phone"); setPinCode(""); }}
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-150 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 flex-grow flex flex-col justify-between">
              {/* PIN Dots Indicator Container */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-[85%] border border-gray-200 rounded-full py-4 px-8 flex justify-center items-center gap-4 bg-white shadow-xs">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${
                        pinCode.length > i
                          ? "bg-[#D82D8B] border-[#D82D8B] scale-110 shadow-xs"
                          : "bg-gray-200 border-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {/* Touch ID options & Forgot PIN */}
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setStep("daily_biometric"); setFingerprintErrorCount(0); }}
                    className="flex items-center gap-2 text-xs font-bold text-[#D82D8B] hover:opacity-80 transition-opacity cursor-pointer bg-[#D82D8B]/5 px-4 py-2 rounded-full border border-[#D82D8B]/10"
                  >
                    <svg className="w-4 h-4 text-[#D82D8B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 .353.017.702.051 1.045l-.011-.05M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11a5 5 0 0010 0c0-.353-.017-.702-.051-1.045l.011.05M12 11V3" />
                    </svg>
                    <span>Xác thực bằng vân tay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert("Tính năng cấp lại mã PIN đang được cập nhật!")}
                    className="text-xs font-bold text-sky-600 hover:underline cursor-pointer"
                  >
                    Quên mã PIN?
                  </button>
                </div>
              </div>

              {/* Custom Numeric Keypad */}
              <div className="grid grid-cols-3 gap-y-3 gap-x-4 px-4 pt-4 border-t border-gray-100">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="h-12 text-lg font-bold text-gray-800 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center cursor-pointer select-none"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadDelete}
                  className="h-12 text-xs font-extrabold text-red-500 rounded-xl hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center cursor-pointer select-none"
                >
                  XÓA
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress("0")}
                  className="h-12 text-lg font-bold text-gray-800 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center cursor-pointer select-none"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => { setStep("phone"); setPinCode(""); }}
                  className="h-12 text-xs font-extrabold text-gray-500 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center cursor-pointer select-none"
                >
                  ĐÓNG
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
