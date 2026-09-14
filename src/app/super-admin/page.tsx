"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { LayoutDashboard, Building2, CreditCard, Power, ArrowLeft, Menu, X, Plus, CheckCircle, AlertTriangle, Shield, TrendingUp, DollarSign, MapPin, Coffee, Bell, Sparkles, LogOut, Users, RefreshCw } from "lucide-react";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";

export default function SuperAdminPortal() {
  const { brands, locations, invoices, toggleTenantStatus, paySubscription, createBrand, createLocation, notifications, markNotificationAsRead, subscribeUserToPush, showPushNotificationPrompt, setShowPushNotificationPrompt } = useApp() as any;

  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>("");

  React.useEffect(() => {
    if (showPushNotificationPrompt) {
      setShowNotification(true);
      setShowPushNotificationPrompt(false);
    }
  }, [showPushNotificationPrompt]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, [showNotification]);

  const [desktopExpanded, setDesktopExpanded] = useState(true);

  // Staff Management States
  const [staffList, setStaffList] = useState<any[]>([]);
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState(3);
  const [newStaffWage, setNewStaffWage] = useState("25000");
  const [newStaffLocationId, setNewStaffLocationId] = useState("");
  const [staffLoading, setStaffLoading] = useState(false);

  const getApiBaseUrl = () => {
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      if (hostname.includes("localhost") || hostname.includes("127.0.0.1") || hostname.endsWith(".test")) {
        return "http://localhost:5078";
      }
      const parts = hostname.split(".");
      if (parts.length >= 3) {
        parts[0] = "api";
        return `https://${parts.join(".")}`;
      }
      return `https://api.${hostname}`;
    }
    return "https://api.themoods.tieenz.site";
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };

  const handleRefreshAll = async () => {
    try {
      if (typeof fetchStaff === "function" && page === "staff") {
        await fetchStaff();
      }
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (page === "staff") {
      fetchStaff();
    }
  }, [page]);

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffPhone.trim() || !newStaffName.trim() || !newStaffLocationId) {
      alert("Vui lòng nhập đầy đủ Số điện thoại, Họ tên và Chọn chi nhánh!");
      return;
    }
    setStaffLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: newStaffPhone.trim(),
          fullName: newStaffName.trim(),
          roleId: Number(newStaffRole),
          locationId: newStaffLocationId,
          hourlyWage: Number(newStaffWage || 25000)
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Đăng ký nhân sự thành công!");
        setNewStaffPhone("");
        setNewStaffName("");
        setNewStaffWage("25000");
        setNewStaffLocationId("");
        fetchStaff();
      } else {
        alert(data.message || "Đăng ký nhân sự thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ khi đăng ký nhân sự!");
    } finally {
      setStaffLoading(false);
    }
  };

  const getAvatarBg = (name: string) => {
    return "bg-[#FAF9F6] text-[#4B3621] border-gray-200/80";
  };

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("moods_active_staff");
      localStorage.removeItem("moods_auth_user");
    }
    window.location.href = "/";
  };

  // Create Brand
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCode, setNewBrandCode] = useState("");
  const [newBrandPlan, setNewBrandPlan] = useState("Standard Tier");
  const [newBrandFee, setNewBrandFee] = useState("3000000");
  const [newBrandDomain, setNewBrandDomain] = useState("");

  const toSlug = (str: string) => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Create Location
  const [locBrandId, setLocBrandId] = useState("");
  const [locName, setLocName] = useState("");

  const menuItems = [
    { key: "dashboard", icon: LayoutDashboard, label: "Hệ thống chung" },
    { key: "tenants", icon: Building2, label: "Quản lý Tenants" },
    { key: "billing", icon: CreditCard, label: "Cước thuê bao" },
    { key: "staff", icon: Users, label: "Nhân sự SaaS" },
    { key: "killswitch", icon: Power, label: "Nút ngắt khẩn cấp" },
  ];

  const getBrandImage = (index: number) => {
    const images = [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&q=80", // Modern minimalist shop
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&q=80", // Cozy wood interior
      "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=400&q=80", // Elegant latte & marble table
      "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&q=80"  // Barista counter
    ];
    return images[index % images.length];
  };

  const getPlanBadgeStyle = (plan: string) => {
    if (plan.includes("Premium")) return "bg-purple-100 text-purple-700 border border-purple-200";
    if (plan.includes("Enterprise")) return "bg-rose-100 text-rose-700 border border-rose-200";
    return "bg-blue-100 text-blue-700 border border-blue-200";
  };

  // === DASHBOARD ===
  const DashView = () => {
    const totalBrands = brands?.length || 0;
    const activeBrands = brands?.filter((b: any) => b.status === "active").length || 0;
    const totalLocs = locations?.length || 0;
    const totalRevenue = invoices?.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0) || 0;
    const unpaid = invoices?.filter((i: any) => i.status === "unpaid").length || 0;

    const kpis = [
      { label: "Tổng Thương Hiệu", value: totalBrands, subText: `${activeBrands} chuỗi hoạt động`, icon: Building2, subClass: "text-[#7c4831]" },
      { label: "Tổng Số Chi Nhánh", value: totalLocs, subText: "Phân bổ toàn quốc", icon: MapPin, subClass: "text-gray-400" },
      { label: "Tổng Doanh Thu MRR", value: `${(totalRevenue / 1000000).toFixed(1)} triệu`, subText: "VNĐ thực thu hàng tháng", icon: TrendingUp, subClass: "text-emerald-600" },
      { label: "Hóa Đơn Chờ Cước", value: unpaid, subText: "Hóa đơn cần thanh toán", icon: AlertTriangle, subClass: unpaid > 0 ? "text-[#7A2F1E]" : "text-gray-400" },
    ];

    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#4B3621]">
              Quản trị hệ thống SaaS
            </h2>
            <p className="text-xs text-[#7c4831]/80 mt-1">Giám sát hoạt động chuỗi nhượng quyền F&B Multi-tenant</p>
          </div>
          <div className="flex items-center gap-2 bg-[#FAF9F6] border border-gray-100 py-1 px-3 rounded-full text-[10px] font-semibold text-[#4B3621]/80 shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Trạng thái: Hoạt động bình thường
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="card border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <span className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-gray-100 flex items-center justify-center">
                  <k.icon size={14} className="text-[#7c4831]" />
                </span>
                <span className="text-[9px] font-semibold text-[#7c4831]/60">Hệ thống</span>
              </div>
              <p className="text-xl font-mono font-bold text-[#4B3621] tracking-tight">{k.value}</p>
              <p className="text-xs font-semibold text-[#4B3621] mt-1">{k.label}</p>
              <p className={`text-[9px] font-medium mt-1 ${k.subClass}`}>{k.subText}</p>
            </div>
          ))}
        </div>

        {/* Brand Overview */}
        <div className="card space-y-4 border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3.5 text-[#7c4831]">
            <Building2 size={14} className="text-[#7c4831]" /> Trạng thái hoạt động của thương hiệu (Tenants)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {(brands || []).map((b: any) => {
              const locs = (locations || []).filter((l: any) => l.brandId === b.code || l.brandId === b.id);
              return (
                <div key={b.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-gray-100 flex flex-col justify-between transition-all hover:bg-white hover:border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">{b.logo || "☕"}</span>
                        <div>
                          <h4 className="font-bold text-sm text-[#4B3621]">{b.name ? b.name.split(" - ")[0] : "Thương hiệu"}</h4>
                        </div>
                      </div>
                      <span className={`pill ${b.status === "active" ? "pill-green" : "pill-red"} border`}>
                        {b.status === "active" ? "Hoạt Động" : "Tạm Khóa"}
                      </span>
                    </div>

                    {/* Technical specs of tenant brand */}
                    <div className="p-3 rounded-lg bg-white border border-gray-100 space-y-1.5 text-xs font-medium text-[#4B3621]/90">
                      <div className="flex justify-between">
                        <span className="text-[#4B3621]/60 text-[9px] uppercase font-bold tracking-wider">Mã định danh:</span>
                        <span className="font-mono">{b.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#4B3621]/60 text-[9px] uppercase font-bold tracking-wider">Chu kỳ gia hạn:</span>
                        <span>{b.nextRenewal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-gray-100 flex justify-between items-center text-[9px] font-semibold text-[#4B3621]/60 uppercase tracking-tight">
                    <span>{locs.length} chi nhánh trực thuộc</span>
                    <span className="text-[#7c4831] font-mono font-bold">{(b.monthlyFee / 1000000).toFixed(0)} triệu VNĐ/Tháng</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // === TENANTS ===
  const TenantsView = () => (
    <div className="space-y-6 anim-fadeUp text-[#4B3621]">
      <div className="border-b border-gray-200/50 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Cấp Phát & Quản Lý Chuỗi</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Thiết lập các chuỗi cửa hàng (Brand) mới và thêm chi nhánh phụ thuộc</p>
      </div>

      {/* Create Brand */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <Plus size={16} className="text-[#7c4831]" /> Cấp Thương Hiệu (Tenant Brand) Mới
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <input
            type="text"
            placeholder="Tên thương hiệu nhượng quyền *"
            value={newBrandName}
            onChange={e => {
              setNewBrandName(e.target.value);
              setNewBrandCode(toSlug(e.target.value));
            }}
            className="input text-sm font-semibold"
            id="sa-brand-name"
          />
          <input
            type="text"
            placeholder="Mã định danh (Tự động tạo theo tên thương hiệu) *"
            value={newBrandCode}
            readOnly
            className="input text-sm font-semibold bg-gray-50/50 cursor-not-allowed"
            id="sa-brand-code"
          />
          <input
            type="text"
            placeholder="Tên miền riêng (VD: order.highlands.vn - Tùy chọn)"
            value={newBrandDomain}
            onChange={e => setNewBrandDomain(e.target.value)}
            className="input text-sm font-semibold sm:col-span-2"
            id="sa-brand-domain"
          />
        </div>
        <button onClick={() => {
          if (!newBrandName || !newBrandCode) { alert("Vui lòng điền đầy đủ các trường bắt buộc!"); return; }
          createBrand(newBrandName, newBrandCode, "Standard Tier", parseInt(newBrandFee || "3000000"), newBrandDomain);
          alert("Khởi tạo và cấu hình chuỗi thương hiệu mới thành công!"); setNewBrandName(""); setNewBrandCode(""); setNewBrandDomain("");
        }} className="btn btn-primary py-3 text-xs w-full sm:w-auto mt-2">
          <Plus size={15} /> Khởi Tạo Brand
        </button>
      </div>

      {/* Create Location */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <MapPin size={16} className="text-[#7c4831]" /> Khởi Tạo Thêm Chi Nhánh Phụ Thuộc
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <select value={locBrandId} onChange={e => setLocBrandId(e.target.value)} className="input text-sm cursor-pointer font-semibold bg-[#FAF9F6]" id="sa-loc-brand">
            <option value="">Lựa chọn chuỗi thương hiệu chủ quản...</option>
            {(brands || []).map((b: any) => <option key={b.id} value={b.id}>{b.name.split(" - ")[0]}</option>)}
          </select>
          <input type="text" placeholder="Tên / Địa chỉ chi nhánh mới (VD: 88 Hàm Nghi, Q.1) *" value={locName} onChange={e => setLocName(e.target.value)} className="input text-sm font-semibold" id="sa-loc-name" />
        </div>
        <button onClick={() => {
          if (!locBrandId || !locName) { alert("Vui lòng lựa chọn Brand và điền tên Location!"); return; }
          createLocation(locBrandId, locName);
          alert("Cấp và thiết lập địa chỉ chi nhánh mới thành công!"); setLocName("");
        }} className="btn btn-primary py-3 text-xs w-full sm:w-auto mt-2">
          <Plus size={15} /> Thêm Chi Nhánh
        </button>
      </div>

      {/* All Brands & Locations */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] pl-1">Danh Sách Chuỗi Vận Hành Chi Tiết</h3>
        {(brands || []).map((b: any) => {
          const locs = (locations || []).filter((l: any) => l.brandId === b.code || l.brandId === b.id);
          return (
            <div key={b.id} className="card space-y-4 border border-gray-100/60 transition-all hover:border-gray-200">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-10 h-10 rounded-2xl bg-[#F4EADF]/40 flex items-center justify-center border border-gray-100 shadow-xs">{b.logo || "☕"}</span>
                  <div>
                    <h4 className="font-extrabold text-sm uppercase text-[#4B3621] tracking-tight">{b.name}</h4>
                    <p className="text-[10px] font-bold text-[#4B3621]/60 mt-0.5 uppercase tracking-wider">
                      Định danh: {b.code}
                      {b.customDomain ? ` • Tên miền riêng: ${b.customDomain}` : ""}
                      • Gia hạn: {b.nextRenewal}
                    </p>
                  </div>
                </div>
                <span className={`pill ${b.status === "active" ? "pill-green" : "pill-red"} border`}>{b.status === "active" ? "Đang chạy" : "Tạm khóa"}</span>
              </div>
              <div className="space-y-3.5 pl-2 sm:pl-6">
                <p className="text-[9px] font-black text-[#7c4831] uppercase tracking-widest pl-1">Các chi nhánh trực thuộc ({locs.length}):</p>
                {locs.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-400 italic py-2 pl-1">Thương hiệu chưa được tạo chi nhánh nào.</p>
                ) : locs.map((l: any) => (
                  <div key={l.id} className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-gray-100 text-xs flex justify-between items-center shadow-xs transition-all hover:bg-white">
                    <div className="flex items-center gap-2.5 font-bold">
                      <MapPin size={14} className="text-[#7c4831]" />
                      <span>{l.name}</span>
                    </div>
                    <span className={`pill ${l.status === "active" ? "pill-green" : "pill-red"} text-[8px] font-black border`}>{l.status === "active" ? "Hoạt động" : "Bị ngắt"}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // === BILLING ===
  const BillingView = () => (
    <div className="space-y-6 anim-fadeUp text-[#4B3621]">
      <div className="border-b border-gray-200/50 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Hóa Đơn Thuê Bao Chuỗi</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Giám sát trạng thái cước phí sử dụng phần mềm SaaS định kỳ</p>
      </div>

      <div className="space-y-4">
        {(invoices || []).map((inv: any) => (
          <div key={inv.id} className="card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100/60 hover:border-gray-200/80 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-[#7c4831]" />
                <h4 className="font-extrabold text-sm uppercase tracking-tight">{inv.brandName}</h4>
              </div>
              <p className="text-xs font-bold text-[#4B3621]/60 uppercase tracking-wider">Kỳ thanh toán: {inv.period} • Hạn trả cước: {inv.dueDate}</p>
              <p className="text-2xl font-mono font-black pt-1 text-[#4B3621] tracking-tight">{(inv.amount).toLocaleString("vi-VN")} VNĐ</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
              <span className={`pill ${inv.status === "paid" ? "pill-green" : "pill-red"} border`}>
                {inv.status === "paid" ? "Đã Thanh Toán" : "Chưa Trả Cước"}
              </span>
              {inv.status === "unpaid" && (
                <button
                  onClick={() => { paySubscription(inv.id); alert("Ghi nhận trả cước thuê bao thành công!"); }}
                  className="btn btn-success py-2 px-4 text-[10px] shadow-xs"
                  id={`pay-${inv.id}`}
                >
                  <CheckCircle size={12} /> Nạp Thanh Toán
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // === KILL-SWITCH ===
  const KillView = () => (
    <div className="space-y-6 anim-fadeUp text-[#4B3621]">
      <div className="border-b border-gray-200/50 pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight text-[#7A2F1E] flex items-center gap-2">
          <Power size={20} className="text-[#7A2F1E] shrink-0" /> Công tắc khóa khẩn cấp SaaS
        </h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Tạm ngưng cung cấp dịch vụ đối với các chuỗi thương hiệu vi phạm điều khoản cước</p>
      </div>

      {/* Warning Sheet */}
      <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-red-200/60 shadow-xs text-[#7A2F1E] font-bold space-y-2">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#7A2F1E] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-wider">Lưu ý vận hành hệ thống</p>
            <p className="text-xs leading-relaxed font-semibold text-[#7A2F1E]/80">
              Kích hoạt công tắc ngắt (Kill-Switch) sẽ đóng băng tức thời toàn bộ hoạt động của thương hiệu. Khách hàng và nhân sự của chi nhánh đó sẽ không thể truy cập portal cho đến khi công tắc được mở lại.
            </p>
          </div>
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#7c4831] pl-1">
          <Building2 size={16} className="text-[#7c4831]" /> Khóa Khẩn Cấp Chuỗi Thương Hiệu
        </h3>
        {(brands || []).map((b: any) => (
          <div key={b.id} className="card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100 transition-all hover:border-red-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold w-9 h-9 rounded-xl bg-[#F4EADF]/40 flex items-center justify-center shadow-xs border border-gray-100">{b.logo || "☕"}</span>
              <div>
                <h4 className="font-extrabold text-sm uppercase text-[#4B3621] tracking-tight">{b.name ? b.name.split(" - ")[0] : "Thương hiệu"}</h4>
                <p className="text-[10px] font-bold text-[#4B3621]/60 mt-0.5 uppercase tracking-wider">Cước: {(b.monthlyFee / 1000000).toFixed(0)} triệu VNĐ</p>
              </div>
            </div>
            <button
              onClick={() => {
                const action = b.status === "active" ? "KHÓA" : "MỞ KHÓA";
                if (confirm(`Bạn chắc chắn muốn thực hiện ${action} khẩn cấp toàn bộ hệ thống của chuỗi "${b.name ? b.name.split(" - ")[0] : "Brand"}"?`)) {
                  toggleTenantStatus("brand", b.id);
                }
              }}
              className={`btn ${b.status === "active" ? "btn-danger" : "btn-success"} py-2 px-4 text-xs font-bold shrink-0 w-full sm:w-auto`}
              id={`kill-brand-${b.id}`}
            >
              <Power size={12} /> {b.status === "active" ? "Khóa Switch" : "Mở Switch"}
            </button>
          </div>
        ))}
      </div>

      {/* Locations */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#7c4831] pl-1">
          <MapPin size={16} className="text-[#7c4831]" /> Khóa Khẩn Cấp Từng Chi Nhánh Riêng Lẻ
        </h3>
        {(locations || []).map((l: any) => {
          const brand = (brands || []).find((b: any) => b.id === l.brandId || b.code === l.brandId);
          return (
            <div key={l.id} className="card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100 transition-all hover:border-red-100">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm uppercase text-[#4B3621] tracking-tight">{l.name}</h4>
                <p className="text-[10px] font-bold text-[#4B3621]/60 uppercase tracking-wider">Thuộc chuỗi chủ quản: {brand ? brand.name.split(" - ")[0] : "N/A"}</p>
              </div>
              <button
                onClick={() => {
                  const action = l.status === "active" ? "KHÓA" : "MỞ KHÓA";
                  if (confirm(`Bạn chắc chắn muốn thực hiện ${action} khẩn cấp đối với chi nhánh độc lập "${l.name}"?`)) {
                    toggleTenantStatus("location", l.id);
                  }
                }}
                className={`btn ${l.status === "active" ? "btn-danger" : "btn-success"} py-2 px-4 text-[10px] font-bold shrink-0 w-full sm:w-auto`}
                id={`kill-loc-${l.id}`}
              >
                <Power size={12} /> {l.status === "active" ? "Khóa Chi Nhánh" : "Mở Chi Nhánh"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPage = () => {
    switch (page) {
      case "tenants": return TenantsView();
      case "billing": return BillingView();
      case "staff": {
        const filteredStaff = staffList.filter((s: any) => s.roleId === 2 || s.roleId === 3);
        return (
          <div className="space-y-5 anim-fadeUp text-[#4B3621]">
            <div className="border-b border-gray-200/50 pb-3">
              <h2 className="text-xl font-bold uppercase tracking-tight text-[#7c4831]">Quản Lý Nhân Sự Hệ Thống</h2>
              <p className="text-[10px] font-bold text-[#7c4831]/60 uppercase mt-0.5">Đăng ký và cấu hình phân quyền nhân sự toàn hệ thống</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Add Staff Form */}
              <div className="card p-4 space-y-3 h-fit border border-gray-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[#7c4831]">
                  <Plus size={14} className="text-[#7c4831]" /> Tạo Nhân Viên Mới
                </h3>
                <form onSubmit={handleRegisterStaff} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Họ và Tên *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      required
                      value={newStaffName}
                      onChange={e => setNewStaffName(e.target.value)}
                      className="input w-full py-1.5 px-3 text-xs font-semibold"
                      id="new-staff-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Số Điện Thoại *</label>
                    <input
                      type="tel"
                      placeholder="Ví dụ: 0912345678"
                      required
                      value={newStaffPhone}
                      onChange={e => setNewStaffPhone(e.target.value)}
                      className="input w-full py-1.5 px-3 text-xs font-semibold"
                      id="new-staff-phone"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Vai Trò / Quyền Hạn</label>
                    <select
                      value={newStaffRole}
                      onChange={e => setNewStaffRole(Number(e.target.value))}
                      className="input w-full py-1.5 px-3 text-xs font-semibold cursor-pointer bg-[#FAF9F6]"
                      id="new-staff-role"
                    >
                      <option value={3}>Nhân viên (Staff)</option>
                      <option value={2}>Quản trị viên (Admin)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Chi Nhánh Trực Thuộc *</label>
                    <select
                      value={newStaffLocationId}
                      onChange={e => setNewStaffLocationId(e.target.value)}
                      className="input w-full py-1.5 px-3 text-xs font-semibold cursor-pointer bg-[#FAF9F6]"
                      id="new-staff-location"
                      required
                    >
                      <option value="">-- Chọn Chi Nhánh --</option>
                      {(locations || []).map((loc: any) => {
                        const brand = (brands || []).find((b: any) => b.id === loc.brandId || b.code === loc.brandId);
                        return (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} {brand ? `(${brand.name.split(" - ")[0]})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Lương theo giờ (VNĐ/giờ) *</label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 25000"
                      required
                      value={newStaffWage}
                      onChange={e => setNewStaffWage(e.target.value)}
                      className="input w-full py-1.5 px-3 text-xs font-semibold"
                      id="new-staff-wage"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={staffLoading}
                    className="btn btn-primary py-2.5 text-xs w-full mt-1 flex items-center justify-center gap-1.5"
                  >
                    {staffLoading ? <RefreshCw size={12} className="animate-spin" /> : <><Plus size={13} /> Khởi Tạo Tài Khoản</>}
                  </button>
                </form>
              </div>

              {/* Staff List */}
              <div className="lg:col-span-2 card p-4 space-y-3 border border-gray-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[#7c4831]">
                  <Users size={14} className="text-[#7c4831]" /> Danh Sách Nhân Sự ({filteredStaff.length})
                </h3>
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[11px] text-gray-400 italic">Chưa có nhân viên nào được tải hoặc chưa được tạo.</p>
                  </div>
                ) : (() => {
                  // Group staff by location
                  const grouped: { [key: string]: any[] } = {};
                  const unassigned: any[] = [];
                  filteredStaff.forEach((s: any) => {
                    if (s.locationId) {
                      if (!grouped[s.locationId]) grouped[s.locationId] = [];
                      grouped[s.locationId].push(s);
                    } else {
                      unassigned.push(s);
                    }
                  });

                  return (
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                      {(locations || []).map((loc: any) => {
                        const locStaff = grouped[loc.id] || [];
                        if (locStaff.length === 0) return null;
                        const brand = (brands || []).find((b: any) => b.id === loc.brandId || b.code === loc.brandId);
                        return (
                          <div key={loc.id} className="space-y-2 border-l-2 border-[#7c4831]/20 pl-3">
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-[#7c4831] flex items-center gap-1.5">
                              <MapPin size={12} /> {loc.name} {brand ? <span className="text-[9px] font-bold text-gray-400">({brand.name.split(" - ")[0]})</span> : ""}
                            </h4>
                            <div className="space-y-2">
                              {locStaff.map((staff: any) => (
                                <div
                                  key={staff.phoneNumber || staff.id}
                                  className="p-2.5 rounded-xl bg-[#FAF9F6] border border-gray-100 flex justify-between items-center transition-all hover:bg-white hover:border-gray-200"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[9px] border ${getAvatarBg(staff.fullName || "")}`}>
                                      {getInitials(staff.fullName || "")}
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-xs text-[#4B3621] uppercase tracking-tight">{staff.fullName}</p>
                                      <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                                        {staff.phoneNumber || staff.phone} • <span className="text-emerald-700 font-bold">{staff.hourlyWage ? staff.hourlyWage.toLocaleString("vi-VN") : "0"}đ/giờ</span>
                                      </p>
                                    </div>
                                  </div>
                                  <span className={`pill font-black text-[8px] border ${staff.roleId === 1
                                    ? "bg-purple-50 text-purple-700 border-purple-100"
                                    : staff.roleId === 2
                                      ? "bg-blue-50 text-blue-700 border-blue-100"
                                      : "bg-amber-50 text-amber-700 border-amber-100"
                                    }`}>
                                    {staff.roleId === 1 ? "SUPER ADMIN" : staff.roleId === 2 ? "ADMIN" : "STAFF"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      {unassigned.length > 0 && (
                        <div className="space-y-2 border-l-2 border-gray-300 pl-3">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <MapPin size={12} className="text-gray-400" /> Chưa Phân Chi Nhánh
                          </h4>
                          <div className="space-y-2">
                            {unassigned.map((staff: any) => (
                              <div
                                key={staff.phoneNumber || staff.id}
                                className="p-2.5 rounded-xl bg-[#FAF9F6] border border-gray-100 flex justify-between items-center transition-all hover:bg-white hover:border-gray-200"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[9px] border ${getAvatarBg(staff.fullName || "")}`}>
                                    {getInitials(staff.fullName || "")}
                                  </div>
                                  <div>
                                    <p className="font-extrabold text-xs text-[#4B3621] uppercase tracking-tight">{staff.fullName}</p>
                                    <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                                      {staff.phoneNumber || staff.phone} • <span className="text-emerald-700 font-bold">{staff.hourlyWage ? staff.hourlyWage.toLocaleString("vi-VN") : "0"}đ/giờ</span>
                                    </p>
                                  </div>
                                </div>
                                <span className={`pill font-black text-[8px] border ${staff.roleId === 1
                                  ? "bg-purple-50 text-purple-700 border-purple-100"
                                  : staff.roleId === 2
                                    ? "bg-blue-50 text-blue-700 border-blue-100"
                                    : "bg-amber-50 text-amber-700 border-amber-100"
                                  }`}>
                                  {staff.roleId === 1 ? "SUPER ADMIN" : staff.roleId === 2 ? "ADMIN" : "STAFF"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      }
      case "killswitch": return KillView();
      default: return DashView();
    }
  };

  return (
    <div className="flex min-h-screen  text-[#4B3621] relative overflow-hidden font-sans">
      {/* Toast Alert */}
      {showNotification && (
        <div className="fixed top-5 right-5 z-99 bg-white border border-gray-150 p-4 rounded-3xl shadow-xl max-w-sm w-full anim-fadeUp flex flex-col gap-3 max-h-[80vh]">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="font-extrabold text-xs uppercase tracking-tight text-[#7c4831] flex items-center gap-1.5">
              <Bell size={15} /> Thông báo hệ thống ({(notifications?.filter((n: any) => !n.isRead).length || 0)})
            </span>
            <button onClick={() => setShowNotification(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>

          {pushPermission !== 'granted' && (
            <button
              type="button"
              onClick={async () => {
                const activeStaff = JSON.parse(localStorage.getItem("moods_active_staff") || "{}");
                if (activeStaff.id) {
                  await subscribeUserToPush?.(activeStaff.id);
                  if (typeof window !== "undefined" && "Notification" in window) {
                    setPushPermission(Notification.permission);
                  }
                }
              }}
              className="btn btn-primary w-full py-2 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider shrink-0"
            >
              <Bell size={13} /> Bật Nhận Thông Báo Màn Hình Chờ
            </button>
          )}

          <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
            {notifications && notifications.length > 0 ? (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markNotificationAsRead?.(n.id)}
                  className={`p-3 rounded-2xl border text-xs transition-all relative ${n.isRead
                      ? "bg-gray-50 border-gray-100 opacity-75"
                      : "bg-[#7c4831]/5 border-[#7c4831]/20 font-bold cursor-pointer hover:bg-[#7c4831]/10"
                    }`}
                >
                  {!n.isRead && (
                    <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                  <h5 className="text-[#7c4831] font-bold text-[11px]">{n.title}</h5>
                  <p className="text-gray-600 mt-1 leading-relaxed text-[10.5px]">{n.message}</p>
                  <span className="text-[9px] text-gray-400 font-mono block mt-1">{n.createdAt}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic text-center py-6">Không có thông báo nào.</p>
            )}
          </div>
        </div>
      )}

      {/* Mobile Sidebar Backdrop */}
      {sideOpen && (
        <div
          onClick={() => setSideOpen(false)}
          className="fixed inset-0 bg-[#4B3621]/30 backdrop-blur-sm z-45 lg:hidden transition-all duration-300"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 bottom-0 left-0 z-50 bg-[#FFFFFF] border-r border-gray-200/50 flex flex-col shrink-0 transition-all duration-300 ${sideOpen
          ? "w-64 translate-x-0 shadow-2xl"
          : `-translate-x-full lg:translate-x-0 ${desktopExpanded ? "lg:w-64" : "lg:w-20"}`
          }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-gray-100 min-h-[73px] shrink-0">
          {(sideOpen || (typeof window !== "undefined" && window.innerWidth < 1024) || desktopExpanded) ? (
            <>
              <Link href="/" className="flex items-center gap-2.5 pl-1.5">
                <span className="w-9 h-9 rounded-2xl flex items-center justify-center">
                  <Shield size={17} className="text-white" />
                </span>
                <span className="text-sm font-extrabold uppercase tracking-tight text-[#7c4831]">SaaS Admin</span>
              </Link>
              <button
                onClick={() => setDesktopExpanded(false)}
                className="text-[#7c4831] hover:bg-[#7c4831]/5 transition-all p-1.5 rounded-lg ml-auto hidden lg:flex"
                title="Thu gọn menu"
              >
                <ArrowLeft size={16} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 mx-auto">
              <button
                onClick={() => setDesktopExpanded(true)}
                className="w-9 h-9 rounded-2xl bg-[#7c4831] flex items-center justify-center text-white transition-all shadow-sm"
                title="Mở rộng menu"
              >
                <Shield size={17} className="text-white" />
              </button>
            </div>
          )}
          {/* Mobile Close Button */}
          <button
            onClick={() => setSideOpen(false)}
            className="text-[#7c4831] hover:bg-[#7c4831]/5 transition-all p-1.5 rounded-lg ml-auto lg:hidden flex"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-grow py-5 space-y-1 px-3 overflow-y-auto">
          {menuItems.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => { setPage(key); if (typeof window !== "undefined" && window.innerWidth < 1024) setSideOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold uppercase transition-all ${page === key
                ? "sidebar-active"
                : "text-[#4B3621] hover:bg-[#7c4831]/5 hover:text-[#7c4831]"
                } ${(!sideOpen && !desktopExpanded) ? "lg:justify-center" : ""}`}
              id={`sa-nav-${key}`}
              title={(!sideOpen && !desktopExpanded) ? label : undefined}
            >
              <Icon size={16} className="shrink-0" />
              {(sideOpen || (typeof window !== "undefined" && window.innerWidth < 1024) || desktopExpanded) && <span>{label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 shrink-0 space-y-1.5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 text-xs font-extrabold uppercase text-[#7c4831] hover:underline p-1.5 rounded-xl hover:bg-[#7c4831]/5 transition-all ${(!sideOpen && !desktopExpanded) ? "lg:justify-center" : ""
              }`}
            title={(!sideOpen && !desktopExpanded) ? "Đăng xuất" : undefined}
          >
            <LogOut size={14} className="shrink-0" />
            {(sideOpen || (typeof window !== "undefined" && window.innerWidth < 1024) || desktopExpanded) && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-grow flex flex-col min-h-screen overflow-y-auto max-h-screen relative z-10 w-full">
        {/* Mobile Top Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-[#FFFFFF] border-b border-gray-150/70 lg:hidden shrink-0 shadow-xs sticky top-0 z-40">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSideOpen(true)}
              className="p-2.5 text-[#7c4831] hover:bg-[#7c4831]/5 rounded-xl transition-all mr-1"
              id="mobile-menu-toggle"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-2xl flex items-center justify-center border-0">
                <Shield size={15} className="text-white" />
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-tight text-[#7c4831] block leading-none">SaaS Admin</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5 block leading-none">Command Center</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNotification(true)}
              className="p-2.5 text-[#7c4831] hover:bg-[#7c4831]/5 rounded-xl transition-all relative"
            >
              <Bell size={18} />
              {(notifications?.filter((n: any) => !n.isRead).length || 0) > 0 ? (
                <span className="w-4 h-4 bg-amber-500 rounded-full absolute top-1 right-1 border border-white flex items-center justify-center text-[8px] text-white font-black">
                  {notifications.filter((n: any) => !n.isRead).length}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full absolute top-2 right-2 border border-white" />
              )}
            </button>
          </div>
        </header>

        <PullToRefresh onRefresh={handleRefreshAll}>
          <div className="flex-grow p-4 md:p-8 w-full  mx-auto pb-12">
            {renderPage()}
          </div>
        </PullToRefresh>
      </main>
    </div>
  );
}
