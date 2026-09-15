"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { LayoutDashboard, Building2, CreditCard, Power, ArrowLeft, Menu, X, Plus, CheckCircle, AlertTriangle, Shield, TrendingUp, DollarSign, MapPin, Coffee, Bell, Sparkles, LogOut, Users, RefreshCw, Lock } from "lucide-react";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";
import { useRouter } from "next/navigation";

export default function SuperAdminPortal() {
  const { brands, locations, invoices, toggleTenantStatus, paySubscription, createBrand, createLocation, notifications, markNotificationAsRead, subscribeUserToPush, showPushNotificationPrompt, setShowPushNotificationPrompt } = useApp() as any;

  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>("");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("moods_auth_user");
      const storedStaff = localStorage.getItem("moods_active_staff");

      if (!storedUser && !storedStaff) {
        // ChÆ°a Ä‘Äƒng nháº­p, Ä‘Ã¡ vÄƒng ra trang chá»§ (login)
        router.push("/");
        return;
      }
      setIsAuthChecking(false);

      const savedPage = localStorage.getItem("moods_superadmin_active_page");
      if (savedPage) {
        setPage(savedPage);
      }
    }
  }, [router]);

  const handleSetPage = (key: string) => {
    setPage(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("moods_superadmin_active_page", key);
    }
  };
  const [showNotification, setShowNotification] = useState(false);

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
  const [newStaffLocationIds, setNewStaffLocationIds] = useState<string[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffPhone, setEditStaffPhone] = useState("");
  const [editStaffWage, setEditStaffWage] = useState("");
  const [editStaffRole, setEditStaffRole] = useState(3);
  const [editStaffLocationId, setEditStaffLocationId] = useState("");
  const [editStaffLocationIds, setEditStaffLocationIds] = useState<string[]>([]);

  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [currentUserPhone, setCurrentUserPhone] = useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("moods_auth_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUserPhone(parsed.PhoneNumber || parsed.phone || "saas");
        } catch {
          setCurrentUserPhone("saas");
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
    if (!newStaffPhone.trim() || !newStaffName.trim() || newStaffLocationIds.length === 0) {
      alert("Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ Sá»‘ Ä‘iá»‡n thoáº¡i, Há» tÃªn vÃ  Chá»n Ã­t nháº¥t má»™t chi nhÃ¡nh!");
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
          locationIds: newStaffLocationIds,
          hourlyWage: Number(newStaffWage || 25000)
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("ÄÄƒng kÃ½ nhÃ¢n sá»± thÃ nh cÃ´ng!");
        setNewStaffPhone("");
        setNewStaffName("");
        setNewStaffWage("25000");
        setNewStaffLocationIds([]);
        fetchStaff();
      } else {
        alert(data.message || "ÄÄƒng kÃ½ nhÃ¢n sá»± tháº¥t báº¡i!");
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i mÃ¡y chá»§ khi Ä‘Äƒng kÃ½ nhÃ¢n sá»±!");
    } finally {
      setStaffLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPin.length !== 6 || isNaN(Number(oldPin)) || newPin.length !== 6 || isNaN(Number(newPin))) {
      alert("MÃ£ PIN pháº£i gá»“m Ä‘Ãºng 6 chá»¯ sá»‘!");
      return;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/change-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: currentUserPhone,
          oldPin: oldPin,
          newPin: newPin
          // KhÃ´ng gá»­i locationId - Super Admin khÃ´ng thuá»™c Branch cá»‘ Ä‘á»‹nh
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Äá»•i mÃ£ PIN thÃ nh cÃ´ng!");
        setOldPin("");
        setNewPin("");
      } else {
        alert(data.message || "Äá»•i mÃ£ PIN tháº¥t báº¡i!");
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i mÃ¡y chá»§ khi Ä‘á»•i mÃ£ PIN!");
    }
  };

  const handleUpdateStaff = async (staffId: string) => {
    if (!editStaffName.trim() || !editStaffPhone.trim() || !editStaffWage || editStaffLocationIds.length === 0) {
      alert("Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ thÃ´ng tin vÃ  chá»n Ã­t nháº¥t má»™t chi nhÃ¡nh!");
      return;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: staffId,
          fullName: editStaffName.trim(),
          phoneNumber: editStaffPhone.trim(),
          hourlyWage: Number(editStaffWage),
          roleId: Number(editStaffRole),
          locationIds: editStaffLocationIds
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Cáº­p nháº­t thÃ´ng tin nhÃ¢n viÃªn thÃ nh cÃ´ng!");
        setEditingStaffId(null);
        setEditStaffLocationIds([]);
        fetchStaff();
      } else {
        alert(data.message || "Cáº­p nháº­t tháº¥t báº¡i!");
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i khi cáº­p nháº­t thÃ´ng tin nhÃ¢n viÃªn!");
    }
  };

  const handleSetResigned = async (staffId: string) => {
    if (!confirm("Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n cho nhÃ¢n viÃªn nÃ y nghá»‰ viá»‡c? NhÃ¢n viÃªn sáº½ bá»‹ áº©n khá»i danh sÃ¡ch.")) {
      return;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: staffId,
          isDeleted: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i nghá»‰ viá»‡c!");
        setEditingStaffId(null);
        fetchStaff();
      } else {
        alert(data.message || "Thao tÃ¡c tháº¥t báº¡i!");
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i khi cáº­p nháº­t tráº¡ng thÃ¡i!");
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
      .replace(/[Ä‘Ä]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  // Create Location
  const [locBrandId, setLocBrandId] = useState("");
  const [locName, setLocName] = useState("");

  const menuItems = [
    { key: "dashboard", icon: LayoutDashboard, label: "Há»‡ thá»‘ng chung" },
    { key: "tenants", icon: Building2, label: "Quáº£n lÃ½ Tenants" },
    { key: "billing", icon: CreditCard, label: "CÆ°á»›c thuÃª bao" },
    { key: "staff", icon: Users, label: "NhÃ¢n sá»± SaaS" },
    { key: "killswitch", icon: Power, label: "NÃºt ngáº¯t kháº©n cáº¥p" },
    { key: "config", icon: Lock, label: "Äá»•i mÃ£ PIN" },
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
      { label: "Tá»•ng ThÆ°Æ¡ng Hiá»‡u", value: totalBrands, subText: `${activeBrands} chuá»—i hoáº¡t Ä‘á»™ng`, icon: Building2, subClass: "text-[#7c4831]" },
      { label: "Tá»•ng Sá»‘ Chi NhÃ¡nh", value: totalLocs, subText: "PhÃ¢n bá»• toÃ n quá»‘c", icon: MapPin, subClass: "text-gray-400" },
      { label: "Tá»•ng Doanh Thu MRR", value: `${(totalRevenue / 1000000).toFixed(1)} triá»‡u`, subText: "VNÄ thá»±c thu hÃ ng thÃ¡ng", icon: TrendingUp, subClass: "text-emerald-600" },
      { label: "HÃ³a ÄÆ¡n Chá» CÆ°á»›c", value: unpaid, subText: "HÃ³a Ä‘Æ¡n cáº§n thanh toÃ¡n", icon: AlertTriangle, subClass: unpaid > 0 ? "text-[#7A2F1E]" : "text-gray-400" },
    ];

    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#4B3621]">
              Quáº£n trá»‹ há»‡ thá»‘ng SaaS
            </h2>
            <p className="text-xs text-[#7c4831]/80 mt-1">GiÃ¡m sÃ¡t hoáº¡t Ä‘á»™ng chuá»—i nhÆ°á»£ng quyá»n F&B Multi-tenant</p>
          </div>
          <div className="flex items-center gap-2 bg-[#FAF9F6] border border-gray-100 py-1 px-3 rounded-full text-[10px] font-semibold text-[#4B3621]/80 shrink-0">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Tráº¡ng thÃ¡i: Hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="card border border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <span className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-gray-100 flex items-center justify-center">
                  <k.icon size={14} className="text-[#7c4831]" />
                </span>
                <span className="text-[9px] font-semibold text-[#7c4831]/60">Há»‡ thá»‘ng</span>
              </div>
              <p className="text-xl  font-bold text-[#4B3621] tracking-tight">{k.value}</p>
              <p className="text-xs font-semibold text-[#4B3621] mt-1">{k.label}</p>
              <p className={`text-[9px] font-medium mt-1 ${k.subClass}`}>{k.subText}</p>
            </div>
          ))}
        </div>

        {/* Brand Overview */}
        <div className="card space-y-4 border border-gray-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3.5 text-[#7c4831]">
            <Building2 size={14} className="text-[#7c4831]" /> Tráº¡ng thÃ¡i hoáº¡t Ä‘á»™ng cá»§a thÆ°Æ¡ng hiá»‡u (Tenants)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {(brands || []).map((b: any) => {
              const locs = (locations || []).filter((l: any) => l.brandId === b.code || l.brandId === b.id);
              return (
                <div key={b.id} className="p-4 rounded-xl bg-[#FAF9F6] border border-gray-100 flex flex-col justify-between transition-all hover:bg-white hover:border-gray-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center">{b.logo || "â˜•"}</span>
                        <div>
                          <h4 className="font-bold text-sm text-[#4B3621]">{b.name ? b.name.split(" - ")[0] : "ThÆ°Æ¡ng hiá»‡u"}</h4>
                        </div>
                      </div>
                      <span className={`pill ${b.status === "active" ? "pill-green" : "pill-red"} border`}>
                        {b.status === "active" ? "Hoáº¡t Äá»™ng" : "Táº¡m KhÃ³a"}
                      </span>
                    </div>

                    {/* Technical specs of tenant brand */}
                    <div className="p-3 rounded-lg bg-white border border-gray-100 space-y-1.5 text-xs font-medium text-[#4B3621]/90">
                      <div className="flex justify-between">
                        <span className="text-[#4B3621]/60 text-[9px] uppercase font-bold tracking-wider">MÃ£ Ä‘á»‹nh danh:</span>
                        <span className="w-[30px] h-[30px]" style={{ borderRadius: "100%" }}>{b.code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#4B3621]/60 text-[9px] uppercase font-bold tracking-wider">Chu ká»³ gia háº¡n:</span>
                        <span>{b.nextRenewal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-gray-100 flex justify-between items-center text-[9px] font-semibold text-[#4B3621]/60 uppercase tracking-tight">
                    <span>{locs.length} chi nhÃ¡nh trá»±c thuá»™c</span>
                    <span className="text-[#7c4831]  font-bold">{(b.monthlyFee / 1000000).toFixed(0)} triá»‡u VNÄ/ThÃ¡ng</span>
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
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Cáº¥p PhÃ¡t & Quáº£n LÃ½ Chuá»—i</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Thiáº¿t láº­p cÃ¡c chuá»—i cá»­a hÃ ng (Brand) má»›i vÃ  thÃªm chi nhÃ¡nh phá»¥ thuá»™c</p>
      </div>

      {/* Create Brand */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <Plus size={16} className="text-[#7c4831]" /> Cáº¥p ThÆ°Æ¡ng Hiá»‡u (Tenant Brand) Má»›i
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <input
            type="text"
            placeholder="TÃªn thÆ°Æ¡ng hiá»‡u nhÆ°á»£ng quyá»n *"
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
            placeholder="MÃ£ Ä‘á»‹nh danh (Tá»± Ä‘á»™ng táº¡o theo tÃªn thÆ°Æ¡ng hiá»‡u) *"
            value={newBrandCode}
            readOnly
            className="input text-sm font-semibold bg-gray-50/50 cursor-not-allowed"
            id="sa-brand-code"
          />
          <input
            type="text"
            placeholder="TÃªn miá»n riÃªng (VD: order.highlands.vn - TÃ¹y chá»n)"
            value={newBrandDomain}
            onChange={e => setNewBrandDomain(e.target.value)}
            className="input text-sm font-semibold sm:col-span-2"
            id="sa-brand-domain"
          />
        </div>
        <button onClick={() => {
          if (!newBrandName || !newBrandCode) { alert("Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ cÃ¡c trÆ°á»ng báº¯t buá»™c!"); return; }
          createBrand(newBrandName, newBrandCode, "Standard Tier", parseInt(newBrandFee || "3000000"), newBrandDomain);
          alert("Khá»Ÿi táº¡o vÃ  cáº¥u hÃ¬nh chuá»—i thÆ°Æ¡ng hiá»‡u má»›i thÃ nh cÃ´ng!"); setNewBrandName(""); setNewBrandCode(""); setNewBrandDomain("");
        }} className="btn btn-primary py-3 text-xs w-full sm:w-auto mt-2">
          <Plus size={15} /> Khá»Ÿi Táº¡o Brand
        </button>
      </div>

      {/* Create Location */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <MapPin size={16} className="text-[#7c4831]" /> Khá»Ÿi Táº¡o ThÃªm Chi NhÃ¡nh Phá»¥ Thuá»™c
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <select value={locBrandId} onChange={e => setLocBrandId(e.target.value)} className="input text-sm cursor-pointer font-semibold bg-[#FAF9F6]" id="sa-loc-brand">
            <option value="">Lá»±a chá»n chuá»—i thÆ°Æ¡ng hiá»‡u chá»§ quáº£n...</option>
            {(brands || []).map((b: any) => <option key={b.id} value={b.id}>{b.name.split(" - ")[0]}</option>)}
          </select>
          <input type="text" placeholder="TÃªn / Äá»‹a chá»‰ chi nhÃ¡nh má»›i (VD: 88 HÃ m Nghi, Q.1) *" value={locName} onChange={e => setLocName(e.target.value)} className="input text-sm font-semibold" id="sa-loc-name" />
        </div>
        <button onClick={() => {
          if (!locBrandId || !locName) { alert("Vui lÃ²ng lá»±a chá»n Brand vÃ  Ä‘iá»n tÃªn Location!"); return; }
          createLocation(locBrandId, locName);
          alert("Cáº¥p vÃ  thiáº¿t láº­p Ä‘á»‹a chá»‰ chi nhÃ¡nh má»›i thÃ nh cÃ´ng!"); setLocName("");
        }} className="btn btn-primary py-3 text-xs w-full sm:w-auto mt-2">
          <Plus size={15} /> ThÃªm Chi NhÃ¡nh
        </button>
      </div>

      {/* All Brands & Locations */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] pl-1">Danh SÃ¡ch Chuá»—i Váº­n HÃ nh Chi Tiáº¿t</h3>
        {(brands || []).map((b: any) => {
          const locs = (locations || []).filter((l: any) => l.brandId === b.code || l.brandId === b.id);
          return (
            <div key={b.id} className="card space-y-4 border border-gray-100/60 transition-all hover:border-gray-200">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl w-10 h-10 rounded-2xl bg-[#F4EADF]/40 flex items-center justify-center border border-gray-100 shadow-xs">{b.logo || "â˜•"}</span>
                  <div>
                    <h4 className="font-extrabold text-sm uppercase text-[#4B3621] tracking-tight">{b.name}</h4>
                    <p className="text-[10px] font-bold text-[#4B3621]/60 mt-0.5 uppercase tracking-wider">
                      Äá»‹nh danh: {b.code}
                      {b.customDomain ? ` â€¢ TÃªn miá»n riÃªng: ${b.customDomain}` : ""}
                      â€¢ Gia háº¡n: {b.nextRenewal}
                    </p>
                  </div>
                </div>
                <span className={`pill ${b.status === "active" ? "pill-green" : "pill-red"} border`}>{b.status === "active" ? "Äang cháº¡y" : "Táº¡m khÃ³a"}</span>
              </div>
              <div className="space-y-3.5 pl-2 sm:pl-6">
                <p className="text-[9px] font-black text-[#7c4831] uppercase tracking-widest pl-1">CÃ¡c chi nhÃ¡nh trá»±c thuá»™c ({locs.length}):</p>
                {locs.length === 0 ? (
                  <p className="text-xs font-semibold text-gray-400 italic py-2 pl-1">ThÆ°Æ¡ng hiá»‡u chÆ°a Ä‘Æ°á»£c táº¡o chi nhÃ¡nh nÃ o.</p>
                ) : locs.map((l: any) => (
                  <div key={l.id} className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-gray-100 text-xs flex justify-between items-center shadow-xs transition-all hover:bg-white">
                    <div className="flex items-center gap-2.5 font-bold">
                      <MapPin size={14} className="text-[#7c4831]" />
                      <span>{l.name}</span>
                    </div>
                    <span className={`pill ${l.status === "active" ? "pill-green" : "pill-red"} text-[8px] font-black border`}>{l.status === "active" ? "Hoáº¡t Ä‘á»™ng" : "Bá»‹ ngáº¯t"}</span>
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
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">HÃ³a ÄÆ¡n ThuÃª Bao Chuá»—i</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">GiÃ¡m sÃ¡t tráº¡ng thÃ¡i cÆ°á»›c phÃ­ sá»­ dá»¥ng pháº§n má»m SaaS Ä‘á»‹nh ká»³</p>
      </div>

      <div className="space-y-4">
        {(invoices || []).map((inv: any) => (
          <div key={inv.id} className="card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100/60 hover:border-gray-200/80 transition-all">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-[#7c4831]" />
                <h4 className="font-extrabold text-sm uppercase tracking-tight">{inv.brandName}</h4>
              </div>
              <p className="text-xs font-bold text-[#4B3621]/60 uppercase tracking-wider">Ká»³ thanh toÃ¡n: {inv.period} â€¢ Háº¡n tráº£ cÆ°á»›c: {inv.dueDate}</p>
              <p className="text-2xl  font-black pt-1 text-[#4B3621] tracking-tight">{(inv.amount).toLocaleString("vi-VN")} VNÄ</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
              <span className={`pill ${inv.status === "paid" ? "pill-green" : "pill-red"} border`}>
                {inv.status === "paid" ? "ÄÃ£ Thanh ToÃ¡n" : "ChÆ°a Tráº£ CÆ°á»›c"}
              </span>
              {inv.status === "unpaid" && (
                <button
                  onClick={() => { paySubscription(inv.id); alert("Ghi nháº­n tráº£ cÆ°á»›c thuÃª bao thÃ nh cÃ´ng!"); }}
                  className="btn btn-success py-2 px-4 text-[10px] shadow-xs"
                  id={`pay-${inv.id}`}
                >
                  <CheckCircle size={12} /> Náº¡p Thanh ToÃ¡n
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
          <Power size={20} className="text-[#7A2F1E] shrink-0" /> CÃ´ng táº¯c khÃ³a kháº©n cáº¥p SaaS
        </h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Táº¡m ngÆ°ng cung cáº¥p dá»‹ch vá»¥ Ä‘á»‘i vá»›i cÃ¡c chuá»—i thÆ°Æ¡ng hiá»‡u vi pháº¡m Ä‘iá»u khoáº£n cÆ°á»›c</p>
      </div>

      {/* Warning Sheet */}
      <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-red-200/60 shadow-xs text-[#7A2F1E] font-bold space-y-2">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#7A2F1E] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-wider">LÆ°u Ã½ váº­n hÃ nh há»‡ thá»‘ng</p>
            <p className="text-xs leading-relaxed font-semibold text-[#7A2F1E]/80">
              KÃ­ch hoáº¡t cÃ´ng táº¯c ngáº¯t (Kill-Switch) sáº½ Ä‘Ã³ng bÄƒng tá»©c thá»i toÃ n bá»™ hoáº¡t Ä‘á»™ng cá»§a thÆ°Æ¡ng hiá»‡u. KhÃ¡ch hÃ ng vÃ  nhÃ¢n sá»± cá»§a chi nhÃ¡nh Ä‘Ã³ sáº½ khÃ´ng thá»ƒ truy cáº­p portal cho Ä‘áº¿n khi cÃ´ng táº¯c Ä‘Æ°á»£c má»Ÿ láº¡i.
            </p>
          </div>
        </div>
      </div>

      {/* Brands */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#7c4831] pl-1">
          <Building2 size={16} className="text-[#7c4831]" /> KhÃ³a Kháº©n Cáº¥p Chuá»—i ThÆ°Æ¡ng Hiá»‡u
        </h3>
        {(brands || []).map((b: any) => (
          <div key={b.id} className="card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100 transition-all hover:border-red-100">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold w-9 h-9 rounded-xl bg-[#F4EADF]/40 flex items-center justify-center shadow-xs border border-gray-100">{b.logo || "â˜•"}</span>
              <div>
                <h4 className="font-extrabold text-sm uppercase text-[#4B3621] tracking-tight">{b.name ? b.name.split(" - ")[0] : "ThÆ°Æ¡ng hiá»‡u"}</h4>
                <p className="text-[10px] font-bold text-[#4B3621]/60 mt-0.5 uppercase tracking-wider">CÆ°á»›c: {(b.monthlyFee / 1000000).toFixed(0)} triá»‡u VNÄ</p>
              </div>
            </div>
            <button
              onClick={() => {
                const action = b.status === "active" ? "KHÃ“A" : "Má»ž KHÃ“A";
                if (confirm(`Báº¡n cháº¯c cháº¯n muá»‘n thá»±c hiá»‡n ${action} kháº©n cáº¥p toÃ n bá»™ há»‡ thá»‘ng cá»§a chuá»—i "${b.name ? b.name.split(" - ")[0] : "Brand"}"?`)) {
                  toggleTenantStatus("brand", b.id);
                }
              }}
              className={`btn ${b.status === "active" ? "btn-danger" : "btn-success"} py-2 px-4 text-xs font-bold shrink-0 w-full sm:w-auto`}
              id={`kill-brand-${b.id}`}
            >
              <Power size={12} /> {b.status === "active" ? "KhÃ³a Switch" : "Má»Ÿ Switch"}
            </button>
          </div>
        ))}
      </div>

      {/* Locations */}
      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#7c4831] pl-1">
          <MapPin size={16} className="text-[#7c4831]" /> KhÃ³a Kháº©n Cáº¥p Tá»«ng Chi NhÃ¡nh RiÃªng Láº»
        </h3>
        {(locations || []).map((l: any) => {
          const brand = (brands || []).find((b: any) => b.id === l.brandId || b.code === l.brandId);
          return (
            <div key={l.id} className="card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-gray-100 transition-all hover:border-red-100">
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-sm uppercase text-[#4B3621] tracking-tight">{l.name}</h4>
                <p className="text-[10px] font-bold text-[#4B3621]/60 uppercase tracking-wider">Thuá»™c chuá»—i chá»§ quáº£n: {brand ? brand.name.split(" - ")[0] : "N/A"}</p>
              </div>
              <button
                onClick={() => {
                  const action = l.status === "active" ? "KHÃ“A" : "Má»ž KHÃ“A";
                  if (confirm(`Báº¡n cháº¯c cháº¯n muá»‘n thá»±c hiá»‡n ${action} kháº©n cáº¥p Ä‘á»‘i vá»›i chi nhÃ¡nh Ä‘á»™c láº­p "${l.name}"?`)) {
                    toggleTenantStatus("location", l.id);
                  }
                }}
                className={`btn ${l.status === "active" ? "btn-danger" : "btn-success"} py-2 px-4 text-[10px] font-bold shrink-0 w-full sm:w-auto`}
                id={`kill-loc-${l.id}`}
              >
                <Power size={12} /> {l.status === "active" ? "KhÃ³a Chi NhÃ¡nh" : "Má»Ÿ Chi NhÃ¡nh"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // === CONFIG ===
  const ConfigView = () => {
    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="border-b border-gray-200/50 pb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">CÃ i Ä‘áº·t báº£o máº­t</h2>
          <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Thay Ä‘á»•i mÃ£ PIN truy cáº­p tÃ i khoáº£n Super Admin</p>
        </div>

        <div className="card space-y-4 max-w-md bg-white border border-gray-150 text-left">
          <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
            <Lock size={16} className="text-[#7c4831]" /> Thay Ä‘á»•i mÃ£ PIN cÃ¡ nhÃ¢n
          </h3>
          <p className="text-[11px] text-gray-500 font-medium font-sans">
            Äá»•i mÃ£ PIN gá»“m 6 sá»‘ cá»§a tÃ i khoáº£n super-admin hiá»‡n táº¡i ({currentUserPhone || "saas"}) Ä‘á»ƒ phá»¥c vá»¥ xÃ¡c thá»±c báº£o máº­t.
          </p>
          <form onSubmit={handleChangePin} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] text-[#7c4831] font-bold uppercase tracking-wider block">MÃ£ PIN cÅ© *</label>
              <input
                type="password"
                maxLength={6}
                required
                placeholder="Nháº­p 6 sá»‘ PIN cÅ©"
                value={oldPin}
                onChange={e => setOldPin(e.target.value)}
                className="input w-full text-xs font-semibold bg-white"
                id="sa-old-pin"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-[#7c4831] font-bold uppercase tracking-wider block">MÃ£ PIN má»›i *</label>
              <input
                type="password"
                maxLength={6}
                required
                placeholder="Nháº­p 6 sá»‘ PIN má»›i"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                className="input w-full text-xs font-semibold bg-white"
                id="sa-new-pin"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 text-xs font-bold mt-2"
            >
              Cáº­p nháº­t mÃ£ PIN
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderPage = () => {
    switch (page) {
      case "tenants": return TenantsView();
      case "billing": return BillingView();
      case "killswitch": return KillView();
      case "staff": {
        const filteredStaff = staffList.filter((s: any) => s.roleId === 2 || s.roleId === 3);
        return (
          <div className="space-y-5 anim-fadeUp text-[#4B3621]">
            <div className="border-b border-gray-200/50 pb-3">
              <h2 className="text-xl font-bold uppercase tracking-tight text-[#7c4831]">Quáº£n LÃ½ NhÃ¢n Sá»± Há»‡ Thá»‘ng</h2>
              <p className="text-[10px] font-bold text-[#7c4831]/60 uppercase mt-0.5">ÄÄƒng kÃ½ vÃ  cáº¥u hÃ¬nh phÃ¢n quyá»n nhÃ¢n sá»± toÃ n há»‡ thá»‘ng</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Add Staff Form */}
              <div className="card p-4 space-y-3 h-fit border border-gray-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[#7c4831]">
                  <Plus size={14} className="text-[#7c4831]" /> Táº¡o NhÃ¢n ViÃªn Má»›i
                </h3>
                <form onSubmit={handleRegisterStaff} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Há» vÃ  TÃªn *</label>
                    <input
                      type="text"
                      placeholder="VÃ­ dá»¥: Nguyá»…n VÄƒn A"
                      required
                      value={newStaffName}
                      onChange={e => setNewStaffName(e.target.value)}
                      className="input w-full py-1.5 px-3 text-xs font-semibold"
                      id="new-staff-name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Sá»‘ Äiá»‡n Thoáº¡i *</label>
                    <input
                      type="tel"
                      placeholder="VÃ­ dá»¥: 0912345678"
                      required
                      value={newStaffPhone}
                      onChange={e => setNewStaffPhone(e.target.value)}
                      className="input w-full py-1.5 px-3 text-xs font-semibold"
                      id="new-staff-phone"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Vai TrÃ² / Quyá»n Háº¡n</label>
                    <select
                      value={newStaffRole}
                      onChange={e => setNewStaffRole(Number(e.target.value))}
                      className="input w-full py-1.5 px-3 text-xs font-semibold cursor-pointer bg-[#FAF9F6]"
                      id="new-staff-role"
                    >
                      <option value={3}>NhÃ¢n viÃªn (Staff)</option>
                      <option value={2}>Quáº£n trá»‹ viÃªn (Admin)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Chi NhÃ¡nh Trá»±c Thuá»™c *</label>
                    <div className="flex flex-col gap-1.5 p-2 bg-[#FAF9F6] border border-gray-150 rounded-xl max-h-[140px] overflow-y-auto">
                      {(locations || []).map((loc: any) => {
                        const brand = (brands || []).find((b: any) => b.id === loc.brandId || b.code === loc.brandId);
                        const isChecked = newStaffLocationIds.includes(loc.id);
                        return (
                          <label key={loc.id} className="flex items-center gap-2 bg-white border border-gray-150 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setNewStaffLocationIds(newStaffLocationIds.filter(id => id !== loc.id));
                                } else {
                                  setNewStaffLocationIds([...newStaffLocationIds, loc.id]);
                                }
                              }}
                              className="rounded text-[#7c4831] focus:ring-[#7c4831] w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>{loc.name} {brand ? `(${brand.name.split(" - ")[0]})` : ""}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">LÆ°Æ¡ng theo giá» (VNÄ/giá») *</label>
                    <input
                      type="number"
                      placeholder="VÃ­ dá»¥: 25000"
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
                    {staffLoading ? <RefreshCw size={12} className="animate-spin" /> : <><Plus size={13} /> Khá»Ÿi Táº¡o TÃ i Khoáº£n</>}
                  </button>
                </form>
              </div>

              {/* Staff List */}
              <div className="lg:col-span-2 card p-4 space-y-3 border border-gray-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[#7c4831]">
                  <Users size={14} className="text-[#7c4831]" /> Danh SÃ¡ch NhÃ¢n Sá»± ({filteredStaff.length})
                </h3>
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[11px] text-gray-400 italic">ChÆ°a cÃ³ nhÃ¢n viÃªn nÃ o Ä‘Æ°á»£c táº£i hoáº·c chÆ°a Ä‘Æ°á»£c táº¡o.</p>
                  </div>
                ) : (() => {
                  // Group staff by location
                  const grouped: { [key: string]: any[] } = {};
                  const unassigned: any[] = [];
                  filteredStaff.forEach((s: any) => {
                    if (s.locationIds && s.locationIds.length > 0) {
                      s.locationIds.forEach((locId: string) => {
                        if (!grouped[locId]) grouped[locId] = [];
                        if (!grouped[locId].some((item: any) => item.id === s.id)) {
                          grouped[locId].push(s);
                        }
                      });
                    } else if (s.locationId) {
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
                              {locStaff.map((staff: any) => {
                                const isEditing = editingStaffId === staff.id;
                                if (isEditing) {
                                  return (
                                    <div key={staff.id} className="p-3 rounded-xl bg-white border border-[#7c4831]/40 space-y-3.5 shadow-sm">
                                      <div className="space-y-2 text-left">
                                        <div>
                                          <label className="text-[9px] font-black uppercase text-[#7c4831] block">Há» vÃ  tÃªn</label>
                                          <input
                                            type="text"
                                            value={editStaffName}
                                            onChange={e => setEditStaffName(e.target.value)}
                                            className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-black uppercase text-[#7c4831] block">Sá»‘ Ä‘iá»‡n thoáº¡i</label>
                                          <input
                                            type="text"
                                            value={editStaffPhone}
                                            onChange={e => setEditStaffPhone(e.target.value)}
                                            className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-black uppercase text-[#7c4831] block">Vai TrÃ² / Quyá»n Háº¡n</label>
                                          <select
                                            value={editStaffRole}
                                            onChange={e => setEditStaffRole(Number(e.target.value))}
                                            className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white cursor-pointer"
                                          >
                                            <option value={3}>NhÃ¢n viÃªn (Staff)</option>
                                            <option value={2}>Quáº£n trá»‹ viÃªn (Admin)</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-black uppercase text-[#7c4831] block">Chi NhÃ¡nh Trá»±c Thuá»™c</label>
                                          <div className="flex flex-col gap-1.5 p-2 bg-[#FAF9F6] border border-gray-150 rounded-xl max-h-[140px] overflow-y-auto mt-0.5">
                                            {(locations || []).map((l: any) => {
                                              const b = (brands || []).find((brand: any) => brand.id === l.brandId || brand.code === l.brandId);
                                              const isChecked = editStaffLocationIds.includes(l.id);
                                              return (
                                                <label key={l.id} className="flex items-center gap-2 bg-white border border-gray-150 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none">
                                                  <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                      if (isChecked) {
                                                        setEditStaffLocationIds(editStaffLocationIds.filter(id => id !== l.id));
                                                      } else {
                                                        setEditStaffLocationIds([...editStaffLocationIds, l.id]);
                                                      }
                                                    }}
                                                    className="rounded text-[#7c4831] focus:ring-[#7c4831] w-3.5 h-3.5 cursor-pointer"
                                                  />
                                                  <span>{l.name} {b ? `(${b.name.split(" - ")[0]})` : ""}</span>
                                                </label>
                                              );
                                            })}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-[9px] font-black uppercase text-[#7c4831] block">LÆ°Æ¡ng/giá»</label>
                                          <input
                                            type="number"
                                            value={editStaffWage}
                                            onChange={e => setEditStaffWage(e.target.value)}
                                            className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-2 pt-1 justify-between items-center">
                                        <button
                                          type="button"
                                          onClick={() => handleSetResigned(staff.id)}
                                          className="btn btn-danger py-1 px-2.5 text-[10px] font-bold shadow-xs mr-auto cursor-pointer"
                                        >
                                          Cho nghá»‰ viá»‡c
                                        </button>
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setEditingStaffId(null)}
                                            className="btn btn-ghost py-1 px-2.5 text-[10px] font-bold border border-gray-200 cursor-pointer"
                                          >
                                            Há»§y
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleUpdateStaff(staff.id)}
                                            className="btn btn-primary py-1 px-3 text-[10px] font-bold cursor-pointer"
                                          >
                                            LÆ°u
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return (
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
                                          {staff.phoneNumber || staff.phone} â€¢ <span className="text-emerald-700 font-bold">{staff.hourlyWage ? staff.hourlyWage.toLocaleString("vi-VN") : "0"}Ä‘/giá»</span>
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingStaffId(staff.id);
                                          setEditStaffName(staff.fullName || "");
                                          setEditStaffPhone(staff.phoneNumber || staff.phone || "");
                                          setEditStaffWage(String(staff.hourlyWage || 25000));
                                          setEditStaffRole(staff.roleId || 3);
                                          setEditStaffLocationIds(staff.locationIds || (staff.locationId ? [staff.locationId] : []));
                                        }}
                                        className="btn btn-ghost py-1 px-2 text-[10px] font-bold border border-gray-250 hover:bg-gray-100 cursor-pointer mr-1"
                                      >
                                        Sá»­a
                                      </button>
                                      <span className={`pill font-black text-[8px] border ${staff.roleId === 1
                                        ? "bg-purple-50 text-purple-700 border-purple-100"
                                        : staff.roleId === 2
                                          ? "bg-blue-50 text-blue-700 border-blue-100"
                                          : "bg-amber-50 text-amber-700 border-amber-100"
                                        }`}>
                                        {staff.roleId === 1 ? "SUPER ADMIN" : staff.roleId === 2 ? "ADMIN" : "STAFF"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}

                      {unassigned.length > 0 && (
                        <div className="space-y-2 border-l-2 border-gray-300 pl-3">
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <MapPin size={12} className="text-gray-400" /> ChÆ°a PhÃ¢n Chi NhÃ¡nh
                          </h4>
                          <div className="space-y-2">
                            {unassigned.map((staff: any) => {
                              const isEditing = editingStaffId === staff.id;
                              if (isEditing) {
                                return (
                                  <div key={staff.id} className="p-3 rounded-xl bg-white border border-[#7c4831]/40 space-y-3.5 shadow-sm">
                                    <div className="space-y-2 text-left">
                                      <div>
                                        <label className="text-[9px] font-black uppercase text-[#7c4831] block">Há» vÃ  tÃªn</label>
                                        <input
                                          type="text"
                                          value={editStaffName}
                                          onChange={e => setEditStaffName(e.target.value)}
                                          className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-black uppercase text-[#7c4831] block">Sá»‘ Ä‘iá»‡n thoáº¡i</label>
                                        <input
                                          type="text"
                                          value={editStaffPhone}
                                          onChange={e => setEditStaffPhone(e.target.value)}
                                          className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-black uppercase text-[#7c4831] block">Vai TrÃ² / Quyá»n Háº¡n</label>
                                        <select
                                          value={editStaffRole}
                                          onChange={e => setEditStaffRole(Number(e.target.value))}
                                          className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white cursor-pointer"
                                        >
                                          <option value={3}>NhÃ¢n viÃªn (Staff)</option>
                                          <option value={2}>Quáº£n trá»‹ viÃªn (Admin)</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-black uppercase text-[#7c4831] block">Chi NhÃ¡nh Trá»±c Thuá»™c</label>
                                        <div className="flex flex-col gap-1.5 p-2 bg-[#FAF9F6] border border-gray-150 rounded-xl max-h-[140px] overflow-y-auto mt-0.5">
                                          {(locations || []).map((l: any) => {
                                            const b = (brands || []).find((brand: any) => brand.id === l.brandId || brand.code === l.brandId);
                                            const isChecked = editStaffLocationIds.includes(l.id);
                                            return (
                                              <label key={l.id} className="flex items-center gap-2 bg-white border border-gray-150 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none">
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={() => {
                                                    if (isChecked) {
                                                      setEditStaffLocationIds(editStaffLocationIds.filter(id => id !== l.id));
                                                    } else {
                                                      setEditStaffLocationIds([...editStaffLocationIds, l.id]);
                                                    }
                                                  }}
                                                  className="rounded text-[#7c4831] focus:ring-[#7c4831] w-3.5 h-3.5 cursor-pointer"
                                                />
                                                <span>{l.name} {b ? `(${b.name.split(" - ")[0]})` : ""}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-[9px] font-black uppercase text-[#7c4831] block">LÆ°Æ¡ng/giá»</label>
                                        <input
                                          type="number"
                                          value={editStaffWage}
                                          onChange={e => setEditStaffWage(e.target.value)}
                                          className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-1 justify-between items-center">
                                      <button
                                        type="button"
                                        onClick={() => handleSetResigned(staff.id)}
                                        className="btn btn-danger py-1 px-2.5 text-[10px] font-bold shadow-xs mr-auto cursor-pointer"
                                      >
                                        Cho nghá»‰ viá»‡c
                                      </button>
                                      <div className="flex gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setEditingStaffId(null)}
                                          className="btn btn-ghost py-1 px-2.5 text-[10px] font-bold border border-gray-200 cursor-pointer"
                                        >
                                          Há»§y
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateStaff(staff.id)}
                                          className="btn btn-primary py-1 px-3 text-[10px] font-bold cursor-pointer"
                                        >
                                          LÆ°u
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return (
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
                                        {staff.phoneNumber || staff.phone} â€¢ <span className="text-emerald-700 font-bold">{staff.hourlyWage ? staff.hourlyWage.toLocaleString("vi-VN") : "0"}Ä‘/giá»</span>
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingStaffId(staff.id);
                                        setEditStaffName(staff.fullName || "");
                                        setEditStaffPhone(staff.phoneNumber || staff.phone || "");
                                        setEditStaffWage(String(staff.hourlyWage || 25000));
                                        setEditStaffRole(staff.roleId || 3);
                                        setEditStaffLocationIds(staff.locationIds || (staff.locationId ? [staff.locationId] : []));
                                      }}
                                      className="btn btn-ghost py-1 px-2 text-[10px] font-bold border border-gray-250 hover:bg-gray-100 cursor-pointer mr-1"
                                    >
                                      Sá»­a
                                    </button>
                                    <span className={`pill font-black text-[8px] border ${staff.roleId === 1
                                      ? "bg-purple-50 text-purple-700 border-purple-100"
                                      : staff.roleId === 2
                                        ? "bg-blue-50 text-blue-700 border-blue-100"
                                        : "bg-amber-50 text-amber-700 border-amber-100"
                                      }`}>
                                      {staff.roleId === 1 ? "SUPER ADMIN" : staff.roleId === 2 ? "ADMIN" : "STAFF"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
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
      case "config": return ConfigView();
      default: return DashView();
    }
  };

  if (isAuthChecking) {
    return null;
  }

  return (
    <div className="flex min-h-screen  text-[#4B3621] relative overflow-hidden font-sans">
      {/* Toast Alert */}
      {showNotification && (
        <div className="fixed top-5 right-5 z-99 bg-white border border-gray-150 p-4 rounded-3xl shadow-xl max-w-sm w-full anim-fadeUp flex flex-col gap-3 max-h-[80vh]">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="font-extrabold text-xs uppercase tracking-tight text-[#7c4831] flex items-center gap-1.5">
              <Bell size={15} /> ThÃ´ng bÃ¡o há»‡ thá»‘ng ({(notifications?.filter((n: any) => !n.isRead).length || 0)})
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
              <Bell size={13} /> Báº­t Nháº­n ThÃ´ng BÃ¡o MÃ n HÃ¬nh Chá»
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
              <p className="text-xs text-gray-400 italic text-center py-6">KhÃ´ng cÃ³ thÃ´ng bÃ¡o nÃ o.</p>
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
                title="Thu gá»n menu"
              >
                <ArrowLeft size={16} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 mx-auto">
              <button
                onClick={() => setDesktopExpanded(true)}
                className="w-9 h-9 rounded-2xl bg-[#7c4831] flex items-center justify-center text-white transition-all shadow-sm"
                title="Má»Ÿ rá»™ng menu"
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
              onClick={() => { handleSetPage(key); if (typeof window !== "undefined" && window.innerWidth < 1024) setSideOpen(false); }}
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
            onClick={() => setShowNotification(true)}
            className={`w-full flex items-center gap-2.5 text-xs font-extrabold uppercase text-[#7c4831] p-1.5 rounded-xl hover:bg-[#7c4831]/5 transition-all relative ${(!sideOpen && !desktopExpanded) ? "lg:justify-center" : ""
              }`}
            title={(!sideOpen && !desktopExpanded) ? "ThÃ´ng bÃ¡o" : undefined}
          >
            <Bell size={14} className="shrink-0" />
            {(sideOpen || (typeof window !== "undefined" && window.innerWidth < 1024) || desktopExpanded) && <span>ThÃ´ng bÃ¡o</span>}
            {(notifications?.filter((n: any) => !n.isRead).length || 0) > 0 && (
              <span className="absolute top-0 left-5 bg-red-500 text-white text-[7px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse border-2 border-white">
                {notifications.filter((n: any) => !n.isRead).length}
              </span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2.5 text-xs font-extrabold uppercase text-[#7c4831] hover:underline p-1.5 rounded-xl hover:bg-[#7c4831]/5 transition-all ${(!sideOpen && !desktopExpanded) ? "lg:justify-center" : ""
              }`}
            title={(!sideOpen && !desktopExpanded) ? "ÄÄƒng xuáº¥t" : undefined}
          >
            <LogOut size={14} className="shrink-0" />
            {(sideOpen || (typeof window !== "undefined" && window.innerWidth < 1024) || desktopExpanded) && <span>ÄÄƒng xuáº¥t</span>}
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
                <span className="w-4 h-4 bg-[#7c4831] text-white rounded-full absolute top-1 right-1 border border-white flex items-center justify-center text-[8px] font-black">
                  {notifications.filter((n: any) => !n.isRead).length}
                </span>
              ) : (
                <span className="w-1.5 h-1.5 bg-[#7c4831] rounded-full absolute top-2 right-2 border border-white" />
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