"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, ChevronRight, RefreshCw, AlertTriangle, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function LandingPage() {
  const router = useRouter();
  const { selectBrandAndLocation, brands, locations, activeBrand, activeLocation, menuImage, menuImages } = useApp();

  const isSuspended = activeBrand?.status === "suspended" || activeLocation?.status === "suspended";

  const [identifier, setIdentifier] = useState("");
  const [passwordOrOtp, setPasswordOrOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Biometric & PIN Staff authentication states
  const [isStaffFlow, setIsStaffFlow] = useState(false);
  const [staffFullName, setStaffFullName] = useState("");
  const [staffRoleId, setStaffRoleId] = useState<number | null>(null);
  const [staffDbId, setStaffDbId] = useState("");
  const [step, setStep] = useState<"phone" | "setup_pin" | "setup_biometric" | "daily_biometric" | "fallback_pin">("phone");
  const [pinCode, setPinCode] = useState("");
  const [fingerprintErrorCount, setFingerprintErrorCount] = useState(0);

  // Auto trigger fingerprint scan on daily_biometric step enter
  React.useEffect(() => {
    if (step === "daily_biometric") {
      handleFingerprintScanReal();
    }
  }, [step]);

  // Auto redirect if staff is already logged in
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedStaffStr = localStorage.getItem("moods_active_staff");
      if (storedStaffStr) {
        try {
          const storedStaff = JSON.parse(storedStaffStr);
          const rId = storedStaff.roleId;
          if (rId === 1) {
            window.location.href = "/super-admin";
          } else if (rId === 2) {
            window.location.href = "/admin";
          } else {
            window.location.href = "/staff";
          }
        } catch {
          window.location.href = "/staff";
        }
      }
    }
  }, []);

  const getApiBaseUrl = () => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.includes("localhost") || hostname.includes("127.0.0.1") || hostname.endsWith(".test")) {
        return "http://localhost:5078";
      }
      return ""; // Use Next.js rewrites to proxy /api directly
    }
    return "http://127.0.0.1:5078"; // SSR fallback
  };

  const getRpId = () => {
    if (typeof window === "undefined") return "localhost";
    return window.location.hostname;
  };



  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    const typedVal = identifier.trim().toLowerCase();

    // 1. Kiểm tra luồng Nhân viên (Staff Flow)
    // Nếu là từ khóa staff/nhanvien hoặc số điện thoại (bắt đầu bằng 0, hoặc có độ dài/ký tự phù hợp)
    const isPotentialStaff = typedVal === "nhanvien" || typedVal === "staff" || /^[0-9+]/.test(typedVal);

    if (isPotentialStaff) {
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: identifier.trim(), locationId: activeLocation?.id || "" }) // Staff-per-Branch
        });

        if (res.ok) {
          const data = await res.json();
          setIsLoading(false);
          setIsStaffFlow(true);
          setStaffFullName(data.fullName || "");
          setStaffRoleId(data.roleId || 3);
          setStaffDbId(data.id || "");

          if (data.hasPin) {
            if (data.bioEnabled && data.biometricKey) {
              localStorage.setItem(`moods_bio_${data.phoneNumber}`, "enabled");
              localStorage.setItem(`moods_bio_cred_${data.phoneNumber}`, data.biometricKey);
              localStorage.setItem(`moods_bio_${identifier.trim()}`, "enabled");
              localStorage.setItem(`moods_bio_cred_${identifier.trim()}`, data.biometricKey);
            }
            setStep("daily_biometric");
            triggerBiometricCheck(identifier.trim());
          } else {
            setStep("setup_pin");
          }
          return;
        }
      } catch (err) {
        console.error("Staff check API error:", err);
      }
    }

    // 2. Kiểm tra luồng Admin / Super Admin
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        // Lưu thông tin admin vào localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("moods_auth_user", JSON.stringify(data.user));
          
          const roleIdVal = data.user?.RoleId || data.user?.roleId || 2;
          const userRole = roleIdVal === 1 ? "Super Admin" : "Admin";
          const activeStaffData = {
            id: data.user?.Id || data.user?.id || (roleIdVal === 1 ? "st-1" : "st-2"),
            name: data.user?.FullName || data.user?.fullName || userRole,
            phone: data.user?.PhoneNumber || data.user?.phoneNumber || "",
            role: userRole,
            roleId: roleIdVal,
            hourlyWage: roleIdVal === 1 ? 100000 : 50000
          };
          localStorage.setItem("moods_active_staff", JSON.stringify(activeStaffData));
        }

        if (brands?.length > 0 && locations?.length > 0) {
          const selectedLoc = activeLocation || locations.find((l: any) => l.id === "govap-branch") || locations[0];
          const selectedBrand = brands.find((b: any) => b.id === selectedLoc.brandId || b.code === selectedLoc.brandId) || brands[0];
          selectBrandAndLocation(selectedBrand.id, selectedLoc.id);
        }

        const roleName = data.user?.RoleName || "";
        let route = "/admin";
        if (roleName === "Super Admin" || data.user?.RoleId === 1) {
          route = "/super-admin";
        }

        setIsLoading(false);
        window.location.href = route;
        return;
      }
    } catch (err) {
      console.error("Admin login API error:", err);
    }
    // 3. Nếu không khớp tài khoản nào trong hệ thống -> CHẶN LUÔN
    setIsLoading(false);
    alert("Không có quyền truy cập!");
  };

  const triggerBiometricCheck = (phoneId: string) => {
    setTimeout(() => {
      // Prompt will appear to user.
    }, 100);
  };

  const handleSetupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length !== 6 || isNaN(Number(pinCode))) {
      alert("Vui lòng nhập mã PIN gồm 6 số!");
      return;
    }

    // Gọi API setup-pin
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/setup-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: identifier.trim(), pin: pinCode, locationId: activeLocation?.id || "" }) // Staff-per-Branch
      });
      if (res.ok) {
        console.log("PIN saved to DB successfully");
      } else {
        console.warn("Setup PIN API failed, saving locally");
      }
    } catch {
      console.warn("Setup PIN API unreachable, saving locally");
    }

    // Luôn lưu local song song để fallback
    localStorage.setItem(`moods_pin_${identifier.trim()}`, pinCode);

    // Khởi tạo thông tin nhân sự chính xác để đè lên phiên cũ
    const userRole = staffRoleId === 1 ? "Super Admin" : staffRoleId === 2 ? "Admin" : "Nhân viên ca trực";
    const roleIdVal = staffRoleId || 3;
    const activeStaffData = {
      id: staffDbId || (roleIdVal === 1 ? "st-1" : roleIdVal === 2 ? "st-2" : "st-3"),
      name: staffFullName || userRole,
      phone: identifier.trim(),
      role: userRole,
      roleId: roleIdVal,
      hourlyWage: roleIdVal === 1 ? 100000 : roleIdVal === 2 ? 50000 : 25000
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("moods_active_staff", JSON.stringify(activeStaffData));
    }

    setStep("setup_biometric");
  };

  const handleSetupBiometric = async (enable: boolean) => {
    const destRoute = staffRoleId === 1 ? "/super-admin" : staffRoleId === 2 ? "/admin" : "/staff";
    if (!enable) {
      window.location.href = destRoute;
      return;
    }

    if (typeof window === "undefined") return;
    if (!window.isSecureContext) {
      alert("Thiết lập sinh trắc học yêu cầu kết nối bảo mật HTTPS (hoặc localhost).");
      window.location.href = destRoute;
      return;
    }
    if (!navigator.credentials) {
      alert("Thiết bị hoặc trình duyệt của bạn không hỗ trợ bảo mật sinh trắc học Touch ID!");
      window.location.href = destRoute;
      return;
    }

    try {
      const randomChallenge = new Uint8Array(32);
      window.crypto.getRandomValues(randomChallenge);
      const userId = new TextEncoder().encode(identifier.trim());

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: randomChallenge,
        rp: {
          name: "The Moods Specialty Coffee",
          id: getRpId(),
        },
        user: {
          id: userId,
          name: identifier.trim(),
          displayName: staffFullName || identifier.trim(),
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
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
        const rawIdArray = Array.from(new Uint8Array(credential.rawId));
        const bioKey = JSON.stringify(rawIdArray);

        // Gọi API setup-biometric
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/setup-biometric`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: identifier.trim(), biometricKey: bioKey, locationId: activeLocation?.id || "" }) // Staff-per-Branch
          });
          if (res.ok) {
            console.log("Biometric linked to DB successfully");
          }
        } catch {
          console.warn("Setup biometric API unreachable");
        }

        localStorage.setItem(`moods_bio_cred_${identifier.trim()}`, bioKey);
        localStorage.setItem(`moods_bio_${identifier.trim()}`, "enabled");
        alert("Đã liên kết xác thực vân tay thành công với thiết bị!");
      }
    } catch (err: any) {
      console.error(err);
      alert("Thiết lập vân tay không thành công hoặc bạn đã hủy yêu cầu: " + (err.message || ""));
    } finally {
      window.location.href = destRoute;
    }
  };

  const handleFingerprintScanReal = async () => {
    if (typeof window === "undefined") return;
    if (!window.isSecureContext) {
      alert("Sinh trắc học yêu cầu kết nối bảo mật HTTPS (hoặc localhost). Vui lòng sử dụng mã PIN.");
      setStep("fallback_pin");
      return;
    }
    if (!navigator.credentials) {
      alert("Trình duyệt không hỗ trợ xác thực sinh trắc học.");
      setStep("fallback_pin");
      return;
    }

    const savedCredStr = localStorage.getItem(`moods_bio_cred_${identifier.trim()}`);
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
        rpId: getRpId(),
        userVerification: "required",
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (assertion) {
        const userRole = staffRoleId === 1 ? "Super Admin" : staffRoleId === 2 ? "Admin" : "Nhân viên ca trực";
        const roleIdVal = staffRoleId || 3;
        const activeStaffData = {
          id: staffDbId || (roleIdVal === 1 ? "st-1" : roleIdVal === 2 ? "st-2" : "st-3"),
          name: staffFullName || userRole,
          phone: identifier.trim(),
          role: userRole,
          roleId: roleIdVal,
          hourlyWage: roleIdVal === 1 ? 100000 : roleIdVal === 2 ? 50000 : 25000
        };
        const destRoute = roleIdVal === 1 ? "/super-admin" : roleIdVal === 2 ? "/admin" : "/staff";

        // Gọi API verify-biometric
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/verify-biometric`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phoneNumber: identifier.trim(), biometricKey: savedCredStr, locationId: activeLocation?.id || "" }) // Staff-per-Branch
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              alert("Xác thực vân tay thành công!");
              if (typeof window !== "undefined") {
                localStorage.setItem("moods_active_staff", JSON.stringify(activeStaffData));
              }
              window.location.href = destRoute;
              return;
            }
          }
        } catch (err) {
          console.error("Biometric verify API unreachable, checking local credentials");
        }

        // Fallback local
        alert("Xác thực vân tay thành công!");
        if (typeof window !== "undefined") {
          localStorage.setItem("moods_active_staff", JSON.stringify(activeStaffData));
        }
        window.location.href = destRoute;
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

  const handleKeypadPress = async (num: string) => {
    if (pinCode.length >= 6) return;
    const newPin = pinCode + num;
    setPinCode(newPin);

    if (newPin.length === 6) {
      setIsLoading(true);
      setTimeout(async () => {
        setIsLoading(false);
        await handleFallbackPinSubmitDirect(newPin);
      }, 300);
    }
  };

  const handleKeypadDelete = () => {
    setPinCode(prev => prev.slice(0, -1));
  };

  const handleFallbackPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleFallbackPinSubmitDirect(pinCode);
  };

  const handleFallbackPinSubmitDirect = async (pinVal: string) => {
    setIsLoading(true);
    const userRole = staffRoleId === 1 ? "Super Admin" : staffRoleId === 2 ? "Admin" : "Nhân viên ca trực";
    const roleIdVal = staffRoleId || 3;
    const activeStaffData = {
      id: staffDbId || (roleIdVal === 1 ? "st-1" : roleIdVal === 2 ? "st-2" : "st-3"),
      name: staffFullName || userRole,
      phone: identifier.trim(),
      role: userRole,
      roleId: roleIdVal,
      hourlyWage: roleIdVal === 1 ? 100000 : roleIdVal === 2 ? 50000 : 25000
    };
    const destRoute = roleIdVal === 1 ? "/super-admin" : roleIdVal === 2 ? "/admin" : "/staff";

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: identifier.trim(), pin: pinVal, locationId: activeLocation?.id || "" }) // Staff-per-Branch
      });

      setIsLoading(false);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          alert("Mã PIN chính xác! Đang đăng nhập...");
          if (typeof window !== "undefined") {
            localStorage.setItem("moods_active_staff", JSON.stringify(activeStaffData));
          }

          const bioEnabled = localStorage.getItem(`moods_bio_${identifier.trim()}`) === "enabled";
          if (!bioEnabled) {
            setStep("setup_biometric");
            setPinCode("");
          } else {
            window.location.href = destRoute;
          }
          return;
        }
      }

      alert("Mã PIN không chính xác! Vui lòng kiểm tra lại.");
      setPinCode("");
      return;
    } catch (err) {
      console.error("Verify PIN API error:", err);
      setIsLoading(false);

      // Chỉ khi mạng lỗi mới dùng local để cứu hộ, nhưng không dùng master pin tùy tiện
      const savedPin = localStorage.getItem(`moods_pin_${identifier.trim()}`);
      if (savedPin && pinVal === savedPin) {
        alert("Mã PIN chính xác (Chế độ ngoại tuyến)! Đang đăng nhập...");
        if (typeof window !== "undefined") {
          localStorage.setItem("moods_active_staff", JSON.stringify(activeStaffData));
        }

        const bioEnabled = localStorage.getItem(`moods_bio_${identifier.trim()}`) === "enabled";
        if (!bioEnabled) {
          setStep("setup_biometric");
          setPinCode("");
        } else {
          window.location.href = destRoute;
        }
        return;
      }
      alert("Mã PIN không chính xác hoặc hệ thống không thể xác thực!");
      setPinCode("");
    }
  };

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

  return (
    <div className="min-h-screen text-[#4B3621] flex flex-col antialiased bg-[#FAF9F6] relative">
      {/* RESPONSIVE NAVBAR */}
      <nav className="w-full bg-[#FFFFFF] border-b border-gray-150 py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-40 shadow-xs">
        {/* LOGO bên trái */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setActiveTab("login"); setIsStaffFlow(false); setStep("phone"); }}>
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

        {/* LAPTOP / DESKTOP MENU: Hiện thẳng các link */}
        <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-[#4B3621]/80">
          <button onClick={() => { setActiveTab("about"); setIsStaffFlow(false); }} className={`hover:text-[#7c4831] transition-colors cursor-pointer ${activeTab === "about" && !isStaffFlow ? "text-[#7c4831] underline decoration-2 underline-offset-4" : ""}`}>Về chúng tôi</button>
          <button onClick={() => { setActiveTab("menu"); setIsStaffFlow(false); }} className={`hover:text-[#7c4831] transition-colors cursor-pointer ${activeTab === "menu" && !isStaffFlow ? "text-[#7c4831] underline decoration-2 underline-offset-4" : ""}`}>Thực đơn</button>
          <button onClick={() => { setActiveTab("login"); setIsStaffFlow(false); setStep("phone"); }} className={`hover:text-[#7c4831] flex items-center gap-1.5 transition-colors cursor-pointer ${activeTab === "login" && !isStaffFlow ? "text-[#7c4831] underline decoration-2 underline-offset-4" : ""}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Đăng nhập</span>
          </button>
        </div>

        {/* MOBILE MENU ICON: Nút danh sách bên phải */}
        <button
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
              <button onClick={() => setShowMobileMenu(false)} className="text-[#7c4831] font-bold text-xs p-1">✕ Close</button>
            </div>
            <div className="flex flex-col gap-4 text-xs font-bold uppercase tracking-wider text-[#4B3621]/80">
              <button onClick={() => { setActiveTab("about"); setIsStaffFlow(false); setShowMobileMenu(false); }} className="text-left hover:text-[#7c4831] py-2 border-b border-gray-50 flex items-center justify-between">Về chúng tôi</button>
              <button onClick={() => { setActiveTab("menu"); setIsStaffFlow(false); setShowMobileMenu(false); }} className="text-left hover:text-[#7c4831] py-2 border-b border-gray-50 flex items-center justify-between">Thực đơn</button>
              <button onClick={() => { setActiveTab("login"); setIsStaffFlow(false); setStep("phone"); setShowMobileMenu(false); }} className="text-left hover:text-[#7c4831] py-2 border-b border-gray-50 flex items-center gap-2">
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
                {isStaffFlow ? "Xác thực nhân sự" : "Đăng Nhập Hệ Thống"}
              </h2>
              <p className="text-[10px] text-[#7c4831]/70 font-bold uppercase tracking-wider">
                The Moods Specialty Coffee
              </p>
            </div>

            <div className="card space-y-5 shadow-sm border border-gray-150 bg-[#FFFFFF] rounded-2xl p-6 anim-fadeUp" style={{ animationDelay: "80ms" }}>

              {/* LUỒNG BÌNH THƯỜNG / PHONE STEP */}
              {!isStaffFlow && step === "phone" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-[#7c4831] tracking-wider block">
                      Chọn Chi Nhánh *
                    </label>
                    <select
                      value={activeLocation?.id || ""}
                      onChange={e => {
                        const locId = e.target.value;
                        const loc = locations.find((l: any) => l.id === locId);
                        if (loc) {
                          selectBrandAndLocation(loc.brandId, loc.id);
                        }
                      }}
                      className="w-full text-xs font-semibold bg-[#FFFFFF] border border-gray-150 rounded-xl px-3 py-2.5 text-[#4B3621] outline-hidden focus:border-[#7c4831]"
                    >
                      {locations.map((loc: any) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-black uppercase text-[#7c4831] tracking-wider block">
                      Số Điện Thoại / Tài Khoản *
                    </label>
                    <input
                      type="text"
                      required
                      name="fb-auth-field"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Ví dụ: 0900000003, admin, super"
                      className="input w-full text-xs font-semibold"
                      id="fb-auth-field"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-full py-3.5 text-xs flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider shadow-sm"
                    id="login-btn"
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

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-[9px] text-gray-400 font-bold uppercase tracking-widest">Hoặc</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={async () => {
                      const typedVal = identifier.trim().toLowerCase();
                      if (!typedVal) {
                        alert("Vui lòng nhập số điện thoại hoặc tài khoản trước!");
                        return;
                      }

                      setIsLoading(true);
                      try {
                        const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/check`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ phoneNumber: identifier.trim(), locationId: activeLocation?.id || "" }) // Staff-per-Branch
                        });

                        setIsLoading(false);
                        if (res.ok) {
                          const data = await res.json();
                          setIsLoading(false);
                          setIsStaffFlow(true);
                          setStaffFullName(data.fullName || "");
                          setStaffRoleId(data.roleId || 3);
                          setStaffDbId(data.id || "");

                          if (data.hasPin) {
                            if (data.bioEnabled && data.biometricKey) {
                              localStorage.setItem(`moods_bio_${data.phoneNumber}`, "enabled");
                              localStorage.setItem(`moods_bio_cred_${data.phoneNumber}`, data.biometricKey);
                              localStorage.setItem(`moods_bio_${identifier.trim()}`, "enabled");
                              localStorage.setItem(`moods_bio_cred_${identifier.trim()}`, data.biometricKey);
                            }
                            setStep("daily_biometric");
                            triggerBiometricCheck(identifier.trim());
                          } else {
                            setStep("setup_pin");
                          }
                          return;
                        } else {
                          alert("Không có quyền truy cập!");
                        }
                      } catch (err) {
                        console.error("Staff check error:", err);
                        setIsLoading(false);
                        // Fallback ngoại tuyến chỉ dùng nếu mất mạng hoàn toàn và có PIN sẵn trong máy
                        const pinRegistered = typeof window !== "undefined" && localStorage.getItem(`moods_pin_${typedVal}`);
                        if (pinRegistered) {
                          setIsStaffFlow(true);
                          setStep("daily_biometric");
                          triggerBiometricCheck(typedVal);
                        } else {
                          alert("Không có quyền truy cập hoặc không thể kết nối máy chủ!");
                        }
                      }
                    }}
                    className="w-full py-3.5 text-xs border border-[#7c4831] hover:bg-[#7c4831]/5 text-[#7c4831] rounded-xl flex items-center justify-center gap-1.5 font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                  >
                    <svg className="w-4.5 h-4.5 text-[#7c4831]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 .353.017.702.051 1.045l-.011-.05M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11a5 5 0 0010 0c0-.353-.017-.702-.051-1.045l.011.05M12 11V3" />
                    </svg>
                    <span>Đăng nhập bằng Vân tay / Mã PIN</span>
                  </button>
                </form>
              )}

              {/* STAFF FLOW: SETUP PIN */}
              {isStaffFlow && step === "setup_pin" && (
                <form onSubmit={handleSetupPin} className="space-y-4">
                  <div className="p-3 bg-[#E0F2FE] border border-sky-100 rounded-xl text-sky-800 text-[11px] font-bold">
                    Đăng nhập lần đầu! Vui lòng cài đặt mã PIN bảo mật gồm 6 chữ số để sử dụng cho các phiên tiếp theo.
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

              {/* STAFF FLOW: SETUP BIOMETRIC OPTION */}
              {isStaffFlow && step === "setup_biometric" && (
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                    <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 .353.017.702.051 1.045l-.011-.05M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11a5 5 0 0010 0c0-.353-.017-.702-.051-1.045l.011.05M12 11V3" />
                    </svg>
                  </div>
                  <h3 className="font-extrabold text-sm uppercase text-[#4B3621]">Xác thực vân tay</h3>
                  <p className="text-xs text-gray-500 font-medium">Bạn có muốn kích hoạt xác thực vân tay Touch ID để chấm công nhanh hơn cho những lần sau không?</p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => handleSetupBiometric(false)} className="btn btn-ghost py-2 text-xs font-bold">Để sau</button>
                    <button onClick={() => handleSetupBiometric(true)} className="btn btn-primary py-2 text-xs font-bold">Kích hoạt vân tay</button>
                  </div>
                </div>
              )}

              {/* STAFF FLOW: DAILY BIOMETRIC PROMPT */}
              {isStaffFlow && step === "daily_biometric" && (
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

                  <button onClick={() => { setStep("fallback_pin"); setPinCode(""); }} className="text-xs text-[#7c4831] hover:underline font-bold block w-full mt-2">Nhập mã PIN 6 số thay thế</button>
                </div>
              )}

              {/* STAFF FLOW: FALLBACK PIN SCREEN placeholder (renders as bottom sheet overlay) */}
              {isStaffFlow && step === "fallback_pin" && (
                <div className="py-4 text-center text-xs font-bold text-gray-400 animate-pulse">
                  Đang mở trình nhập mã PIN bảo mật...
                </div>
              )}


            </div>
          </div>
        )}

        {/* SECTION: VỀ CHÚNG TÔI */}
        {activeTab === "about" && (
          <section className="w-full max-w-3xl py-6 space-y-4 anim-fadeUp" id="about-us">
            <div className="text-center space-y-1">
              <span className="pill pill-violet">Hành Trình</span>
              <h2 className="text-xl font-bold uppercase text-[#7c4831]">Về Chúng Tôi</h2>
            </div>
            <div className="card bg-white border border-gray-150 p-6 text-sm text-[#4B3621] leading-relaxed space-y-3 font-medium">
              <p>
                <strong className="font-bold text-[#7c4831]">The Moods</strong> ra đời từ tình yêu dành cho những khoảnh khắc bình yên bên tách specialty coffee thủ công chất lượng cao, nơi mỗi tách cà phê mang một cảm xúc riêng biệt.
              </p>
              <p>
                Chúng tôi tuyển chọn hạt chín mọng từ các vùng nguyên liệu nổi tiếng, kết hợp công nghệ rang sồi hiện đại mang lại hương vị thô mộc đặc biệt, nâng tầm trải nghiệm của quý thực khách.
              </p>
            </div>
          </section>
        )}

        {/* SECTION: THỰC ĐƠN TO LỚN (Có bộ lọc category như yêu cầu) */}
        {activeTab === "menu" && (
          <section className="w-full max-w-3xl py-6 space-y-6 anim-fadeUp" id="menu-to">
            {/* Menu tấm lớn của quán */}
            <div className="card space-y-4 border border-gray-150 bg-white mt-4">
              <div className="border-b border-gray-100 pb-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Bảng Menu Tấm Lớn Chi Nhánh</h3>
              </div>
              <div className="rounded-2xl overflow-hidden border border-gray-100/60 shadow-xs max-w-full">
                {menuImages && menuImages.filter((img: any) => img.active).length > 0 ? (
                  menuImages.filter((img: any) => img.active).map((img: any) => (
                    <img key={img.id} src={img.url} alt="Menu lớn tại quán" className="w-full object-cover max-h-96 mb-4 last:mb-0" />
                  ))
                ) : (
                  <img src={menuImage} alt="Menu lớn tại quán" className="w-full object-cover max-h-96" />
                )}
              </div>
            </div>
          </section>
        )}

      </div>
      {/* MOMO-STYLE BOTTOM SHEET FOR STAFF FALLBACK PIN */}
      {isStaffFlow && step === "fallback_pin" && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs z-50 flex items-end justify-center anim-backdrop">
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-8 space-y-5 anim-sheet border-t border-[#7c4831]/10 shadow-2xl relative flex flex-col">

            {/* Top handle bar */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-1 cursor-pointer" onClick={() => { setStep("phone"); setIsStaffFlow(false); setPinCode(""); }} />

            <div className="flex justify-between items-center pb-2 relative">
              <div className="w-6" />
              <h3 className="font-extrabold text-sm uppercase text-[#4B3621] text-center flex-grow">
                Nhập mã PIN xác thực
              </h3>
              <button
                type="button"
                onClick={() => { setStep("phone"); setIsStaffFlow(false); setPinCode(""); }}
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
                      className={`w-3.5 h-3.5 rounded-full border transition-all duration-150 ${pinCode.length > i
                          ? "bg-[#7c4831] border-[#7c4831] scale-110 shadow-xs"
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
                    className="flex items-center gap-2 text-xs font-bold text-[#7c4831] hover:opacity-80 transition-opacity cursor-pointer bg-[#7c4831]/5 px-4 py-2 rounded-full border border-[#7c4831]/10"
                  >
                    <svg className="w-4 h-4 text-[#7c4831]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 .353.017.702.051 1.045l-.011-.05M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11a5 5 0 0010 0c0-.353-.017-.702-.051-1.045l.011.05M12 11V3" />
                    </svg>
                    <span>Xác thực bằng vân tay</span>
                  </button>
                </div>
              </div>

              {/* Custom Numeric Keypad */}
              <div className="grid grid-cols-3 grid-cols-3-forced gap-y-3 gap-x-4 px-4 pt-4 border-t border-gray-100">
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
                  onClick={() => { setStep("phone"); setIsStaffFlow(false); setPinCode(""); }}
                  className="h-12 text-xs font-extrabold text-gray-500 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center cursor-pointer select-none"
                >
                  ĐÓNG
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FULL WIDTH LANDING FOOTER */}
      <footer className="w-full bg-[#FFFFFF] border-t border-gray-150 py-6 text-center mt-auto relative z-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-[#7c4831]/60">
          <span>© 2026 The Moods Specialty Coffee. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Điều khoản</a>
            <a href="#" className="hover:underline">Chính sách</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
