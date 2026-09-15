"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Types
export interface Voucher {
  id: string;
  code: string;
  value: string;
  title: string;
  isUsed: boolean;
  expiry: string;
  usedAt?: string;
}

export interface Customer {
  id?: string;
  phone: string;
  name: string;
  email: string;
  points: number;
  vouchers: Voucher[];
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  expiryDate?: string;
  status: "active" | "archived";
}

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  shiftType: "Sáng (07:00 - 12:00)" | "Chiều (12:00 - 17:00)" | "Tối (17:00 - 22:00)";
  locationId: string;
  locationName: string;
  approved: boolean;
}

export interface RequestItem {
  id: string;
  staffId: string;
  staffName: string;
  type: "leave" | "swap";
  details: string; // Lý do nghỉ hoặc Ca muốn đổi
  date: string; // YYYY-MM-DD
  status: "pending" | "approved" | "rejected";
  targetShiftId?: string; // Ca trực muốn nghỉ/đổi
  swapWithStaffName?: string; // Tên nhân viên muốn đổi ca (nếu có)
}

export interface ActivityLog {
  id: string;
  time: string;
  staffName: string;
  action: string;
  description: string;
}

export interface FeedbackMessage {
  id: string;
  customerPhone: string;
  customerName: string;
  message: string;
  sender: "customer" | "admin";
  timestamp: string;
}

export interface MenuImageItem {
  id: string;
  url: string;
  active: boolean;
}

// SaaS Levels
export interface Brand {
  id: string;
  name: string;
  code: string;
  logo: string;
  status: "active" | "suspended";
  plan: "Premium Tier" | "Standard Tier" | "Enterprise Custom";
  monthlyFee: number;
  nextRenewal: string;
  customDomain?: string;
}

export interface LocationItem {
  id: string;
  brandId: string;
  name: string;
  status: "active" | "suspended";
  monthlyRent?: number;
}

export interface BillingInvoice {
  id: string;
  brandId: string;
  brandName: string;
  amount: number;
  period: string; // Ví dụ: Tháng 06/2026
  status: "paid" | "unpaid";
  dueDate: string;
  paidAt?: string;
}

interface AppContextType {
  // SaaS Tenants
  brands: Brand[];
  locations: LocationItem[];
  activeBrand: Brand | null;
  activeLocation: LocationItem | null;
  invoices: BillingInvoice[];

  // Dynamic Datasets
  customers: Customer[];
  activeCustomer: Customer | null;
  activeStaff: { id: string; name: string; role: string } | null;
  promotions: Promotion[];
  shifts: Shift[];
  requests: RequestItem[];
  logs: ActivityLog[];
  feedbacks: FeedbackMessage[];
  menuImage: string;
  menuImages: MenuImageItem[];
  notifications: any[];

  // Timekeeping State
  timekeeping: {
    clockedIn: boolean;
    clockInTime: string | null;
    lateMinutes: number;
    gpsDistance: number; // Simulated distance in meters
    gpsStatus: "inside" | "outside";
    clockedOut: boolean;
    clockOutTime?: string | null;
  };

  // Actions - SaaS Tenant Picker
  selectBrandAndLocation: (brandId: string, locationId: string) => void;

  // Actions - Customer Portal
  loginCustomer: (phone: string) => Promise<boolean> | boolean;
  registerCustomer: (phone: string, name: string, email: string) => Promise<void> | void;
  logoutCustomer: () => void;
  updateCustomerProfile: (name: string, email: string) => void;

  // Actions - Loyalty & Points
  addPointsToCustomer: (phone: string, billAmount: number, staffName: string) => { success: boolean; pointsAdded: number };
  adjustPointsManually: (phone: string, points: number) => void;
  useVoucher: (phone: string, voucherId: string) => boolean;

  // Actions - Staff Clocking & scheduling
  clockInStaff: (lat: number, lng: number) => Promise<{ success: boolean; lateMinutes: number }> | { success: boolean; lateMinutes: number };
  clockOutStaff: (autoAntiOt?: boolean) => void;
  registerShift: (date: string, shiftType: any, locationId: string) => void;
  submitRequest: (type: "leave" | "swap" | "extension", details: string, date: string, targetShiftId?: string, swapWithStaffName?: string, swapWithStaffId?: string, swapWithShiftId?: string, extensionDurationMinutes?: number) => void;
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  subscribeUserToPush: (userId: string) => Promise<void>;
  getDeviceSubscriptions: (userId: string) => Promise<any>;
  testPushNotification: (userId: string) => Promise<any>;
  getCurrentPushEndpoint: () => Promise<string | null>;
  unsubscribeUserFromPush: () => Promise<void>;
  showPushNotificationPrompt: boolean;
  setShowPushNotificationPrompt: React.Dispatch<React.SetStateAction<boolean>>;

  // Actions - Admin Panel
  approveRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  addPromotion: (title: string, description: string, image: string, expiryDate?: string) => void;
  deletePromotion: (promoId: string) => void;
  archivePromotion: (promoId: string) => void;
  updateMenuImage: (url: string) => void;
  updateMenuImages: (images: MenuImageItem[]) => void;
  sendFeedbackReply: (customerPhone: string, message: string) => void;
  sendCustomerFeedback: (message: string) => void;

  // Actions - Super Admin
  toggleTenantStatus: (type: "brand" | "location", id: string) => void;
  paySubscription: (invoiceId: string) => void;
  createBrand: (name: string, code: string, plan: any, fee: number, customDomain?: string) => void;
  createLocation: (brandId: string, name: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial SaaS Data
const INITIAL_BRANDS: Brand[] = [
  {
    id: "b-1",
    name: "The Moods - Premium Coffee",
    code: "themoods",
    logo: "☕",
    status: "active",
    plan: "Premium Tier",
    monthlyFee: 5000000,
    nextRenewal: "01/07/2026"
  },
  {
    id: "b-2",
    name: "Wood & Beans - Craft Roastery",
    code: "woodbeans",
    logo: "🪵",
    status: "suspended", // Initially locked due to unpaid SaaS invoices
    plan: "Standard Tier",
    monthlyFee: 3000000,
    nextRenewal: "01/06/2026"
  }
];

const INITIAL_LOCATIONS: LocationItem[] = [
  { id: "govap-branch", brandId: "b-1", name: "The Moods Gò Vấp", status: "active" },

];

const INITIAL_INVOICES: BillingInvoice[] = [
  {
    id: "inv-1",
    brandId: "b-1",
    brandName: "The Moods - Premium Coffee",
    amount: 5000000,
    period: "Thuê bao tháng 06/2026",
    status: "paid",
    dueDate: "05/06/2026",
    paidAt: "28/05/2026"
  },
  {
    id: "inv-2",
    brandId: "b-2",
    brandName: "Wood & Beans - Craft Roastery",
    amount: 3000000,
    period: "Thuê bao tháng 06/2026",
    status: "unpaid", // Unpaid causing the Brand suspension (Kill-switch alert!)
    dueDate: "01/06/2026"
  }
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    phone: "0987654321",
    name: "Nguyễn Hoàng Nam",
    email: "nam.nguyen@gmail.com",
    points: 8,
    vouchers: []
  },
  {
    phone: "0912345678",
    name: "Lê Minh Thư",
    email: "thu.le@gmail.com",
    points: 12,
    vouchers: [
      {
        id: "v-init-1",
        code: "MOODS55K-A12",
        value: "55.000đ",
        title: "Voucher giảm 55K tri ân khách hàng thân thiết",
        isUsed: false,
        expiry: "30/08/2026"
      }
    ]
  },
  {
    phone: "0909090909",
    name: "Phạm Thành Đạt",
    email: "dat.pham@gmail.com",
    points: 3,
    vouchers: []
  }
];

const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: "p1",
    title: "Cà phê Gỗ Ấm - Đậm Vị Mộc Mạc",
    description: "Trải nghiệm dòng Signature mới sử dụng hạt Robusta Đắk Lắk 100% chín mọng, ủ lạnh trong thùng gỗ sồi 24 giờ. Giảm ngay 15% cho ly thứ hai trong tuần lễ ra mắt.",
    image: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=600",
    date: "01/06/2026",
    status: "active"
  },
  {
    id: "p2",
    title: "Retro Sunday - Thanh Âm Đĩa Than",
    description: "Mỗi chủ nhật từ 19h30, không gian The Moods sẽ tắt nhạc số để thưởng thức đĩa than Acoustic Jazz cổ điển. Khách hàng mặc đồ phong cách Vintage/Retro được tặng kèm 1 bánh Cookie bơ gỗ.",
    image: "https://images.unsplash.com/photo-1485278562681-2a3e013d6c5b?q=80&w=600",
    date: "28/05/2026",
    status: "active"
  },
  {
    id: "p3",
    title: "Neo-Brutalism Art Cup - Cốc Sứ Thiết Kế Hạn Chế",
    description: "Sự kết hợp táo bạo giữa The Moods và Studio Gốm Bát Tràng tạo nên chiếc cốc sứ góc cạnh, màu nâu đen thô mộc. Chỉ 100 cốc duy nhất dành cho thành viên tích đủ 50 điểm hoặc mua với giá 185k.",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600",
    date: "20/05/2026",
    status: "active"
  }
];

const INITIAL_SHIFTS: Shift[] = [
  {
    id: "s1",
    staffId: "st-1",
    staffName: "Trần Thế Huy",
    date: "2026-06-01",
    shiftType: "Sáng (07:00 - 12:00)",
    locationId: "l-1",
    locationName: "145 Lê Lợi, Q. 1, TP. HCM",
    approved: true
  },
  {
    id: "s2",
    staffId: "st-2",
    staffName: "Nguyễn Khánh Vy",
    date: "2026-06-01",
    shiftType: "Chiều (12:00 - 17:00)",
    locationId: "l-1",
    locationName: "145 Lê Lợi, Q. 1, TP. HCM",
    approved: true
  },
  {
    id: "s3",
    staffId: "st-1",
    staffName: "Trần Thế Huy",
    date: "2026-06-02",
    shiftType: "Tối (17:00 - 22:00)",
    locationId: "l-1",
    locationName: "145 Lê Lợi, Q. 1, TP. HCM",
    approved: true
  },
  {
    id: "s4",
    staffId: "st-3",
    staffName: "Phan Hoài Nam",
    date: "2026-06-02",
    shiftType: "Sáng (07:00 - 12:00)",
    locationId: "l-2",
    locationName: "88 Nguyễn Hữu Huân, Hà Nội",
    approved: false
  }
];

const INITIAL_REQUESTS: RequestItem[] = [
  {
    id: "r1",
    staffId: "st-1",
    staffName: "Trần Thế Huy",
    type: "leave",
    details: "Em có lịch thi cuối kỳ đột xuất tại trường sáng 03/06 ạ.",
    date: "2026-06-03",
    status: "pending",
    targetShiftId: "s3"
  },
  {
    id: "r2",
    staffId: "st-2",
    staffName: "Nguyễn Khánh Vy",
    type: "swap",
    details: "Muốn đổi ca Chiều 04/06 sang ca Tối với bạn Vy để có việc gia đình.",
    date: "2026-06-04",
    status: "pending",
    swapWithStaffName: "Phan Hoài Nam"
  }
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: "l1",
    time: "08:15 - 01/06/2026",
    staffName: "Trần Thế Huy",
    action: "Điểm danh (Clock in)",
    description: "Đăng nhập ca trực Sáng thành công tại chi nhánh Quận 1. GPS trễ 15 phút."
  },
  {
    id: "l2",
    time: "09:30 - 01/06/2026",
    staffName: "Trần Thế Huy",
    action: "Quét mã & Tích điểm",
    description: "Đã quét QR khách hàng Lê Minh Thư (0912345678), tích thành công 3 điểm từ hóa đơn 180,000đ."
  },
  {
    id: "l3",
    time: "14:10 - 01/06/2026",
    staffName: "Nguyễn Khánh Vy",
    action: "Quét mã & Tích điểm",
    description: "Đã quét QR khách hàng Nguyễn Hoàng Nam (0987654321), tích thành công 4 điểm từ hóa đơn 250,000đ."
  }
];

const INITIAL_FEEDBACKS: FeedbackMessage[] = [
  {
    id: "f1",
    customerPhone: "0987654321",
    customerName: "Nguyễn Hoàng Nam",
    message: "Chào quán, hôm nay mình ghé chi nhánh Quận 1 uống cà phê kem muối gỗ ngon lắm. Không gian bày trí rất thơ!",
    sender: "customer",
    timestamp: "10:15 - 01/06/2026"
  },
  {
    id: "f2",
    customerPhone: "0987654321",
    customerName: "Nguyễn Hoàng Nam",
    message: "Cảm ơn bạn Nam rất nhiều đã dành tình cảm cho The Moods. Rất hân hạnh được phục vụ bạn lần sau!",
    sender: "admin",
    timestamp: "11:00 - 01/06/2026"
  },
  {
    id: "f3",
    customerPhone: "0912345678",
    customerName: "Lê Minh Thư",
    message: "Quán ơi, voucher giảm 55K đổi điểm của mình áp dụng cho đơn ship tận nơi được không hay chỉ dùng tại quán thế?",
    sender: "customer",
    timestamp: "14:45 - 01/06/2026"
  }
];

const DEFAULT_MENU_IMAGE = "https://images.unsplash.com/photo-1544787219-7f47ccb76574?q=80&w=1000";

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



export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);

  // SaaS Tenants States
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [locations, setLocations] = useState<LocationItem[]>(INITIAL_LOCATIONS);
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [activeLocation, setActiveLocation] = useState<LocationItem | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>(INITIAL_INVOICES);

  // Dynamic Datasets States
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [activeStaff, setActiveStaff] = useState<{ id: string; name: string; role: string } | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [requests, setRequests] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>(INITIAL_FEEDBACKS);
  const [menuImage, setMenuImage] = useState<string>(DEFAULT_MENU_IMAGE);
  const [menuImages, setMenuImages] = useState<MenuImageItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPushNotificationPrompt, setShowPushNotificationPrompt] = useState(false);

  // Timekeeping State
  const [timekeeping, setTimekeeping] = useState({
    clockedIn: false,
    clockInTime: null as string | null,
    lateMinutes: 0,
    gpsDistance: 8, // Initial distance: 8m from store (inside)
    gpsStatus: "inside" as "inside" | "outside",
    clockedOut: false,
    clockOutTime: null as string | null
  });

  // Load from localStorage
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const storedBrands = localStorage.getItem("moods_saas_brands");
      const storedLocations = localStorage.getItem("moods_saas_locations");
      const storedActiveBrand = localStorage.getItem("moods_saas_active_brand");
      const storedActiveLoc = localStorage.getItem("moods_saas_active_loc");
      const storedInvoices = localStorage.getItem("moods_saas_invoices");

      const storedCustomers = localStorage.getItem("moods_customers");
      const storedActiveCustomer = localStorage.getItem("moods_active_customer");
      const storedPromotions = localStorage.getItem("moods_promotions");
      const storedShifts = localStorage.getItem("moods_shifts");
      const storedRequests = localStorage.getItem("moods_requests");
      const storedLogs = localStorage.getItem("moods_logs");
      const storedFeedbacks = localStorage.getItem("moods_feedbacks");
      const storedMenuImage = localStorage.getItem("moods_menu_image");
      const storedMenuImages = localStorage.getItem("moods_menu_images");
      const storedTk = localStorage.getItem("moods_timekeeping");

      let parsedBrands = INITIAL_BRANDS;
      if (storedBrands) {
        try {
          parsedBrands = JSON.parse(storedBrands);
          setBrands(parsedBrands);
        } catch (e) {
          console.error(e);
        }
      } else {
        setBrands(INITIAL_BRANDS);
      }

      let locs = INITIAL_LOCATIONS;
      if (storedLocations) {
        try {
          const parsed = JSON.parse(storedLocations);
          if (Array.isArray(parsed)) {
            if (!parsed.some((l: any) => l.id === "govap-branch")) {
              parsed.unshift({ id: "govap-branch", brandId: "b-1", name: "The Moods Gò Vấp", status: "active" });
            }
            locs = parsed;
          }
        } catch (e) {
          console.error(e);
        }
      }
      setLocations(locs);

      const hostname = window.location.hostname;
      const matchingBrand = parsedBrands.find(b =>
        (b.customDomain && b.customDomain.toLowerCase() === hostname.toLowerCase()) ||
        (hostname.startsWith(b.code + ".") && !hostname.endsWith("themoods.tieenz.site") && b.code) ||
        (hostname.includes(b.code) && hostname !== "themoods.tieenz.site" && hostname !== "localhost" && hostname !== "127.0.0.1")
      );

      if (matchingBrand) {
        setActiveBrand(matchingBrand);
      } else if (storedActiveBrand) {
        setActiveBrand(JSON.parse(storedActiveBrand));
      } else {
        setActiveBrand(parsedBrands[0]);
      }

      let activeLoc = locs.find(l => l.id === "govap-branch") || locs[0];
      if (storedActiveLoc) {
        try {
          const parsedLoc = JSON.parse(storedActiveLoc);
          if (parsedLoc && parsedLoc.id) {
            const foundLoc = locs.find(l => l.id === parsedLoc.id);
            if (foundLoc) {
              activeLoc = foundLoc;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
      setActiveLocation(activeLoc);

      if (storedInvoices) setInvoices(JSON.parse(storedInvoices));
      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      if (storedActiveCustomer) setActiveCustomer(JSON.parse(storedActiveCustomer));
      if (storedPromotions) setPromotions(JSON.parse(storedPromotions));
      if (storedShifts) setShifts(JSON.parse(storedShifts));
      if (storedRequests) setRequests(JSON.parse(storedRequests));
      if (storedLogs) setLogs(JSON.parse(storedLogs));
      if (storedFeedbacks) setFeedbacks(JSON.parse(storedFeedbacks));
      if (storedMenuImages) {
        try {
          const parsed = JSON.parse(storedMenuImages);
          setMenuImages(parsed);
          const firstActive = parsed.find((img: any) => img.active);
          if (firstActive) {
            setMenuImage(firstActive.url);
          } else {
            setMenuImage(DEFAULT_MENU_IMAGE);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        const initialUrl = storedMenuImage || DEFAULT_MENU_IMAGE;
        setMenuImages([
          {
            id: "default-menu",
            url: initialUrl,
            active: true
          }
        ]);
        setMenuImage(initialUrl);
      }

      const storedActiveStaff = localStorage.getItem("moods_active_staff");
      let currentStaffId = "default";
      if (storedActiveStaff) {
        try {
          const parsedStaff = JSON.parse(storedActiveStaff);
          setActiveStaff(parsedStaff);
          if (parsedStaff && parsedStaff.id) {
            currentStaffId = parsedStaff.id;
          }
        } catch (e) { }
      }

      const userStoredTk = localStorage.getItem(`moods_timekeeping_${currentStaffId}`);
      if (userStoredTk) {
        try {
          setTimekeeping(JSON.parse(userStoredTk));
        } catch (e) { }
      }
    }
  }, []);

  // Fetch locations, brands and customers from DB
  useEffect(() => {
    const fetchDbData = async () => {
      // 0. Fetch brands
      try {
        const brandResponse = await fetch(`${getApiBaseUrl()}/api/brands`);
        if (brandResponse.ok) {
          const data = await brandResponse.json();
          if (Array.isArray(data)) {
            setBrands(data);

            // Resolve active brand from host URL
            const hostname = window.location.hostname;
            const matchingBrand = data.find((b: any) =>
              (b.customDomain && b.customDomain.toLowerCase() === hostname.toLowerCase()) ||
              (hostname.startsWith(b.code + ".") && !hostname.endsWith("themoods.tieenz.site") && b.code) ||
              (hostname.includes(b.code) && hostname !== "themoods.tieenz.site" && hostname !== "localhost" && hostname !== "127.0.0.1")
            );

            if (matchingBrand) {
              setActiveBrand(matchingBrand);
            } else if (typeof window !== "undefined") {
              const storedActiveBrand = localStorage.getItem("moods_saas_active_brand");
              if (storedActiveBrand) {
                try {
                  const parsedBrand = JSON.parse(storedActiveBrand);
                  const foundBrand = data.find((b: any) => b.id === parsedBrand.id);
                  if (foundBrand) {
                    setActiveBrand(foundBrand);
                  } else if (data.length > 0) {
                    setActiveBrand(data[0]);
                  }
                } catch (e) {
                  if (data.length > 0) setActiveBrand(data[0]);
                }
              } else if (data.length > 0) {
                setActiveBrand(data[0]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch brands from database:", err);
      }

      try {
        // 1. Fetch locations
        const locResponse = await fetch(`${getApiBaseUrl()}/api/locations`);
        if (locResponse.ok) {
          const data = await locResponse.json();
          if (Array.isArray(data)) {
            setLocations(data);

            // Sync active location with fetched one
            if (typeof window !== "undefined") {
              const storedActiveLoc = localStorage.getItem("moods_saas_active_loc");
              let activeLoc = data.find((l: any) => l.id === "govap-branch") || data[0];
              if (storedActiveLoc) {
                try {
                  const parsedLoc = JSON.parse(storedActiveLoc);
                  const foundLoc = data.find((l: any) => l.id === parsedLoc.id);
                  if (foundLoc) {
                    activeLoc = foundLoc;
                  }
                } catch (e) { }
              }
              setActiveLocation(activeLoc);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch locations from database:", err);
      }

      try {
        // 2. Fetch customers
        const custResponse = await fetch(`${getApiBaseUrl()}/api/customers`);
        if (custResponse.ok) {
          const custData = await custResponse.json();
          if (Array.isArray(custData)) {
            setCustomers(custData);
          }
        }
      } catch (err) {
        console.error("Failed to fetch customers from database:", err);
      }
    };

    if (isMounted) {
      fetchDbData();
    }
  }, [isMounted]);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/requests?locationId=${activeLocation?.id || "govap-branch"}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setRequests(data.map((r: any) => ({
            id: r.id,
            staffId: r.userId,
            staffName: r.staffName,
            type: r.type,
            details: r.details,
            date: r.date,
            status: r.status,
            targetShiftId: r.targetShiftId,
            swapWithStaffName: r.swapWithStaffName
          })));
        }
      }
    } catch (err) {
      console.error("Failed to fetch requests from database:", err);
    }
  };

  useEffect(() => {
    if (isMounted && activeLocation) {
      fetchRequests();
    }
  }, [isMounted, activeLocation]);

  // Reset timekeeping state to default whenever activeStaff?.id changes to prevent state pollution when switching accounts
  useEffect(() => {
    setTimekeeping({
      clockedIn: false,
      clockInTime: null,
      lateMinutes: 0,
      gpsDistance: 8,
      gpsStatus: "inside",
      clockedOut: false,
      clockOutTime: null
    });
  }, [activeStaff?.id]);

  // Sync attendance state from server on active staff or location change
  useEffect(() => {
    const syncTimekeepingFromServer = async () => {
      if (!activeStaff || !activeLocation) return;
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/attendance/schedules?locationId=${activeLocation.id}&userId=${activeStaff.id}`);
        if (res.ok) {
          const data = await res.json();

          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          const todayStr = `${yyyy}-${mm}-${dd}`;

          const currentTimeFloat = now.getHours() + now.getMinutes() / 60;

          const parseTimeToFloat = (timeStr: string) => {
            if (!timeStr) return 0;
            const parts = timeStr.split(":");
            return parseFloat(parts[0]) + (parts[1] ? parseFloat(parts[1]) / 60 : 0);
          };

          // Filter shifts for today only, ignore other days' un-clocked-out/stale shifts
          const todaySchedules = data.filter((s: any) => s.date === todayStr);

          // Find if there is a shift currently active (within shift time window [start - 30m, end])
          let activeSchedule = todaySchedules.find((s: any) => {
            const startFloat = parseTimeToFloat(s.startTime);
            let endFloat = parseTimeToFloat(s.endTime);
            if (endFloat < startFloat) endFloat += 24; // overnight shift
            return currentTimeFloat >= (startFloat - 0.5) && currentTimeFloat <= endFloat;
          });

          // If no shift is currently in its time window, but we have today's shifts:
          if (!activeSchedule && todaySchedules.length > 0) {
            // Find today's shift closest to current time that is NOT yet fully past
            const futureOrCurrentShifts = todaySchedules.filter((s: any) => {
              let endFloat = parseTimeToFloat(s.endTime);
              const startFloat = parseTimeToFloat(s.startTime);
              if (endFloat < startFloat) endFloat += 24;
              return currentTimeFloat <= endFloat;
            });

            if (futureOrCurrentShifts.length > 0) {
              futureOrCurrentShifts.sort((a: any, b: any) => parseTimeToFloat(a.startTime) - parseTimeToFloat(b.startTime));
              activeSchedule = futureOrCurrentShifts[0];
            } else {
              // All today's shifts are in the past. Grab the last one of today
              todaySchedules.sort((a: any, b: any) => parseTimeToFloat(a.startTime) - parseTimeToFloat(b.startTime));
              activeSchedule = todaySchedules[todaySchedules.length - 1];
            }
          }

          if (activeSchedule) {
            const startFloat = parseTimeToFloat(activeSchedule.startTime);
            let endFloat = parseTimeToFloat(activeSchedule.endTime);
            if (endFloat < startFloat) endFloat += 24;

            const isPastShift = currentTimeFloat > endFloat;

            if (isPastShift) {
              // If the shift is already past, treat it as completed (or clockedOut/inactive)
              setTimekeeping({
                clockedIn: false,
                clockInTime: activeSchedule.checkInTime,
                lateMinutes: 0,
                gpsDistance: 8,
                gpsStatus: "inside",
                clockedOut: true,
                clockOutTime: activeSchedule.checkOutTime || activeSchedule.endTime
              });
            } else {
              setTimekeeping({
                clockedIn: activeSchedule.clockedIn && !activeSchedule.clockedOut,
                clockInTime: activeSchedule.checkInTime,
                lateMinutes: 0,
                gpsDistance: 8,
                gpsStatus: "inside",
                clockedOut: activeSchedule.clockedOut,
                clockOutTime: activeSchedule.checkOutTime
              });
            }
          } else {
            // Reset to default empty state if no schedule exists today
            setTimekeeping({
              clockedIn: false,
              clockInTime: null,
              lateMinutes: 0,
              gpsDistance: 8,
              gpsStatus: "inside",
              clockedOut: false,
              clockOutTime: null
            });
          }
        }
      } catch (err) {
        console.error("Failed to sync attendance status from server:", err);
      }
    };

    if (isMounted) {
      syncTimekeepingFromServer();
    }
  }, [activeStaff, activeLocation, isMounted]);

  // Sync to localStorage
  useEffect(() => {
    if (isMounted && typeof window !== "undefined") {
      localStorage.setItem("moods_saas_brands", JSON.stringify(brands));
      localStorage.setItem("moods_saas_locations", JSON.stringify(locations));
      localStorage.setItem("moods_saas_active_brand", JSON.stringify(activeBrand));
      localStorage.setItem("moods_saas_active_loc", JSON.stringify(activeLocation));
      localStorage.setItem("moods_saas_invoices", JSON.stringify(invoices));
      localStorage.setItem("moods_customers", JSON.stringify(customers));
      localStorage.setItem("moods_active_customer", JSON.stringify(activeCustomer));
      localStorage.setItem("moods_promotions", JSON.stringify(promotions));
      localStorage.setItem("moods_shifts", JSON.stringify(shifts));
      localStorage.setItem("moods_requests", JSON.stringify(requests));
      localStorage.setItem("moods_logs", JSON.stringify(logs));
      localStorage.setItem("moods_feedbacks", JSON.stringify(feedbacks));
      localStorage.setItem("moods_menu_image", menuImage);
      localStorage.setItem("moods_menu_images", JSON.stringify(menuImages));
      localStorage.setItem(`moods_timekeeping_${activeStaff?.id || "default"}`, JSON.stringify(timekeeping));
    }
  }, [
    brands, locations, activeBrand, activeLocation, invoices,
    customers, activeCustomer, promotions, shifts, requests,
    logs, feedbacks, menuImage, menuImages, timekeeping, isMounted, activeStaff
  ]);

  // Actions - Select Tenant
  const selectBrandAndLocation = (brandId: string, locationId: string) => {
    const brand = brands.find(b => b.id === brandId || b.code === brandId);
    const loc = locations.find(l => l.id === locationId);
    if (brand && loc) {
      setActiveBrand(brand);
      setActiveLocation(loc);
      if (typeof window !== "undefined") {
        localStorage.setItem("moods_saas_active_loc", JSON.stringify(loc));
        localStorage.setItem("moods_saas_active_brand", JSON.stringify(brand));
      }
    } else if (loc) {
      setActiveLocation(loc);
      if (typeof window !== "undefined") {
        localStorage.setItem("moods_saas_active_loc", JSON.stringify(loc));
      }
    }
  };

  // Helper dynamic voucher generator
  const checkAndGenerateVoucher = (phone: string, currentPoints: number) => {
    if (currentPoints >= 10) {
      const voucherCount = Math.floor(currentPoints / 10);
      const newlyAddedVouchers: Voucher[] = [];

      for (let i = 0; i < voucherCount; i++) {
        const randId = Math.random().toString(36).substring(7).toUpperCase();
        newlyAddedVouchers.push({
          id: `v-auto-${Date.now()}-${i}`,
          code: `MOODS55K-${randId}`,
          value: "55.000đ",
          title: "Voucher giảm 55K tự động khi đạt 10 điểm",
          isUsed: false,
          expiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString("vi-VN")
        });
      }

      const remainingPoints = currentPoints % 10;
      return { remainingPoints, addedVouchers: newlyAddedVouchers };
    }
    return null;
  };

  // Actions - Auth Customer
  const loginCustomer = async (phone: string): Promise<boolean> => {
    const p = phone.trim();
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/customer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: p,
          locationId: activeLocation?.id || "govap-branch"
        })
      });
      if (!response.ok) {
        console.warn("API login failed, status:", response.status);
      } else {
        const data = await response.json();
        if (data.user) {
          const newCust: Customer = {
            id: data.user.id,
            phone: data.user.phoneNumber,
            name: data.user.fullName,
            email: "",
            points: data.user.points || 0,
            vouchers: []
          };
          const existing = customers.find(c => c.phone === newCust.phone);
          if (existing) {
            newCust.email = existing.email;
            newCust.vouchers = existing.vouchers;
          }
          setActiveCustomer(newCust);
          if (typeof window !== "undefined") {
            localStorage.setItem("moods_active_customer", JSON.stringify(newCust));
          }
          setCustomers(prev => {
            const filtered = prev.filter(c => c.phone !== newCust.phone);
            return [...filtered, newCust];
          });
          return true;
        }
      }
    } catch (err) {
      console.error("Login API error:", err);
    }

    // Fallback to local data
    const found = customers.find(c => c.phone === p);
    if (found) {
      if (!found.id) found.id = `cust-${p}`;
      setActiveCustomer(found);
      if (typeof window !== "undefined") {
        localStorage.setItem("moods_active_customer", JSON.stringify(found));
      }
      return true;
    }
    return false;
  };

  const registerCustomer = async (phone: string, name: string, email: string) => {
    const formattedPhone = phone.trim();
    let dbId = "";
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/customer/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          fullName: name.trim(),
          locationId: activeLocation?.id || "govap-branch"
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.warn("Register API failed:", errData.message);
      } else {
        const data = await response.json();
        console.log("Registered to DB successfully:", data);
        if (data.user && data.user.id) {
          dbId = data.user.id;
        }
      }
    } catch (err) {
      console.error("Register API error:", err);
    }

    const exists = customers.find(c => c.phone === formattedPhone);
    if (exists) {
      if (dbId) exists.id = dbId;
      return;
    }

    const newCust: Customer = {
      id: dbId || `cust-${formattedPhone}`,
      phone: formattedPhone,
      name: name.trim() || "Khách Hàng Mới",
      email: email.trim() || "chua_co_email@domain.com",
      points: 0,
      vouchers: []
    };

    setCustomers(prev => [...prev, newCust]);
  };

  const logoutCustomer = () => {
    setActiveCustomer(null);
  };

  const updateCustomerProfile = (name: string, email: string) => {
    if (!activeCustomer) return;
    const updated = {
      ...activeCustomer,
      name: name.trim(),
      email: email.trim()
    };
    setActiveCustomer(updated);
    setCustomers(prev => prev.map(c => c.phone === updated.phone ? updated : c));
  };

  // Actions - Loyalty Points Scan
  const addPointsToCustomer = (phone: string, billAmount: number, staffName: string) => {
    const formattedPhone = phone.trim();
    const customerIdx = customers.findIndex(c => c.phone === formattedPhone);

    if (customerIdx === -1) {
      return { success: false, pointsAdded: 0 };
    }

    const pointsToAdd = Math.floor(billAmount / 50000);
    if (pointsToAdd <= 0) {
      return { success: false, pointsAdded: 0 };
    }

    const customer = customers[customerIdx];
    const totalPoints = customer.points + pointsToAdd;
    let finalPoints = totalPoints;
    let finalVouchers = [...customer.vouchers];
    let pointsMessage = `Đã cộng ${pointsToAdd} điểm từ hóa đơn ${billAmount.toLocaleString("vi-VN")}đ.`;

    const rewardResult = checkAndGenerateVoucher(formattedPhone, totalPoints);
    if (rewardResult) {
      finalPoints = rewardResult.remainingPoints;
      finalVouchers = [...finalVouchers, ...rewardResult.addedVouchers];
      pointsMessage += ` Tự động quy đổi ${rewardResult.addedVouchers.length * 10} điểm lấy ${rewardResult.addedVouchers.length} Voucher giảm 55K!`;
    }

    const updatedCustomer: Customer = {
      ...customer,
      points: finalPoints,
      vouchers: finalVouchers
    };

    setCustomers(prev => prev.map(c => c.phone === formattedPhone ? updatedCustomer : c));
    if (activeCustomer && activeCustomer.phone === formattedPhone) {
      setActiveCustomer(updatedCustomer);
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
      staffName,
      action: "Quét mã & Tích điểm",
      description: `Đã tích điểm cho khách hàng ${customer.name} (${formattedPhone}). Hóa đơn: ${billAmount.toLocaleString("vi-VN")}đ. ${pointsMessage}`
    };

    setLogs(prev => [newLog, ...prev]);

    return { success: true, pointsAdded: pointsToAdd };
  };

  const adjustPointsManually = (phone: string, points: number) => {
    const formattedPhone = phone.trim();
    const customerIdx = customers.findIndex(c => c.phone === formattedPhone);
    if (customerIdx === -1) return;

    const customer = customers[customerIdx];
    let totalPoints = points < 0 ? 0 : points;
    let finalPoints = totalPoints;
    let finalVouchers = [...customer.vouchers];

    const rewardResult = checkAndGenerateVoucher(formattedPhone, totalPoints);
    if (rewardResult) {
      finalPoints = rewardResult.remainingPoints;
      finalVouchers = [...finalVouchers, ...rewardResult.addedVouchers];
    }

    const updatedCustomer: Customer = {
      ...customer,
      points: finalPoints,
      vouchers: finalVouchers
    };

    setCustomers(prev => prev.map(c => c.phone === formattedPhone ? updatedCustomer : c));
    if (activeCustomer && activeCustomer.phone === formattedPhone) {
      setActiveCustomer(updatedCustomer);
    }

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
      staffName: "Admin/Hệ thống",
      action: "Điều chỉnh điểm số",
      description: `Admin đã điều chỉnh điểm số của khách hàng ${customer.name} (${formattedPhone}) lên ${points}đ.`
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const useVoucher = (phone: string, voucherId: string): boolean => {
    const formattedPhone = phone.trim();
    const customerIdx = customers.findIndex(c => c.phone === formattedPhone);
    if (customerIdx === -1) return false;

    const customer = customers[customerIdx];
    const voucherIdx = customer.vouchers.findIndex(v => v.id === voucherId && !v.isUsed);
    if (voucherIdx === -1) return false;

    const updatedVouchers = customer.vouchers.map(v =>
      v.id === voucherId
        ? { ...v, isUsed: true, usedAt: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN") }
        : v
    );

    const updatedCustomer: Customer = { ...customer, vouchers: updatedVouchers };
    setCustomers(prev => prev.map(c => c.phone === formattedPhone ? updatedCustomer : c));

    if (activeCustomer && activeCustomer.phone === formattedPhone) {
      setActiveCustomer(updatedCustomer);
    }

    const usedVoucher = customer.vouchers[voucherIdx];
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
      staffName: "Tự phục vụ",
      action: "Áp dụng Voucher",
      description: `Khách hàng ${customer.name} (${formattedPhone}) áp dụng thành công Voucher mã ${usedVoucher.code} (Giảm 55K).`
    };
    setLogs(prev => [newLog, ...prev]);

    return true;
  };

  // Actions - Staff Timekeeping GPS
  const clockInStaff = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/clock-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeStaff?.id || "st-3",
          locationId: activeLocation?.id || "govap-branch",
          lat,
          lng
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Chấm công thất bại!");
        return { success: false, lateMinutes: 0 };
      }

      const dist = Number(data.distance || 0);
      setTimekeeping({
        clockedIn: true,
        clockInTime: data.checkInTime,
        lateMinutes: Number(data.lateMinutes || 0),
        gpsDistance: dist,
        gpsStatus: dist <= 50 ? "inside" : "outside",
        clockedOut: false,
        clockOutTime: null
      });

      alert("Vào ca thành công!");

      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
        staffName: activeStaff?.name || "Nhân viên",
        action: "Chấm công (Clock-in)",
        description: `Nhân viên ${activeStaff?.name} đã Clock-in thành công qua định vị GPS (Cự ly: ${dist}m). Ghi nhận trễ: ${data.lateMinutes} phút.`
      };
      setLogs(prev => [newLog, ...prev]);

      return { success: true, lateMinutes: Number(data.lateMinutes || 0) };
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi chấm công!");
      return { success: false, lateMinutes: 0 };
    }
  };

  const clockOutStaff = async (autoAntiOt: boolean = false) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/clock-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeStaff?.id || "st-3",
          locationId: activeLocation?.id || "govap-branch"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Clock-out thất bại!");
        return;
      }

      setTimekeeping(prev => ({
        ...prev,
        clockedIn: false,
        clockedOut: true,
        clockOutTime: data.checkOutTime
      }));

      alert(data.message);

      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
        staffName: activeStaff?.name || "Nhân viên",
        action: autoAntiOt ? "Auto Checkout (Anti-OT)" : "Chấm công (Clock-out)",
        description: autoAntiOt
          ? `Hệ thống tự động Checkout ca trực cho ${activeStaff?.name} để phòng chống tính gian lận làm thêm giờ (Anti-OT).`
          : `Nhân viên ${activeStaff?.name} đã Clock-out thành công.`
      };
      setLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi chấm công ra ca!");
    }
  };

  const registerShift = async (date: string, shiftType: any, locationId: string) => {
    if (!activeStaff) return;

    let startTime = "07:00";
    let endTime = "12:00";
    if (shiftType.includes("12:00") && shiftType.includes("17:00")) {
      startTime = "12:00";
      endTime = "17:00";
    } else if (shiftType.includes("17:00") && shiftType.includes("22:00")) {
      startTime = "17:00";
      endTime = "22:00";
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeStaff.id,
          locationId,
          date,
          startTime,
          endTime
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể đăng ký ca rảnh!");
        return;
      }
      alert("Đăng ký ca rảnh thành công!");

      // Refresh schedules
      const schedResponse = await fetch(`${getApiBaseUrl()}/api/attendance/schedules?locationId=${locationId}`);
      if (schedResponse.ok) {
        const schedData = await schedResponse.json();
        setShifts(schedData.map((s: any) => ({
          id: s.id,
          staffId: s.userId,
          staffName: s.staffName,
          date: s.date,
          shiftType: `${s.startTime} - ${s.endTime}`,
          locationId,
          locationName: activeLocation?.name || "Chi nhánh",
          approved: true
        })));
      }
      const newLog: ActivityLog = {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
        staffName: activeStaff.name,
        action: "Đăng ký ca rảnh",
        description: `Đã nộp ca trực rảnh ca ${shiftType} ngày ${new Date(date).toLocaleDateString("vi-VN")} để chờ Admin duyệt.`
      };
      setLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi đăng ký ca rảnh!");
    }
  };

  const submitRequest = async (type: "leave" | "swap" | "extension", details: string, date: string, targetShiftId?: string, swapWithStaffName?: string, swapWithStaffId?: string, swapWithShiftId?: string, extensionDurationMinutes?: number) => {
    if (!activeStaff) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeStaff.id,
          locationId: activeLocation?.id || "govap-branch",
          type,
          details,
          date,
          targetShiftId,
          swapWithStaffName,
          swapWithStaffId,
          swapWithShiftId,
          extensionDurationMinutes
        })
      });
      if (res.ok) {
        await fetchRequests();
        const newLog: ActivityLog = {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
          staffName: activeStaff.name,
          action: type === "leave" ? "Đơn xin nghỉ ca" : "Yêu cầu đổi ca",
          description: `Đã nộp đơn ${type === "leave" ? "xin nghỉ" : "đổi ca"} ngày ${new Date(date).toLocaleDateString("vi-VN")} với lý do: "${details}"`
        };
        setLogs(prev => [newLog, ...prev]);
      } else {
        const errData = await res.json();
        alert(errData.message || "Gửi yêu cầu thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi gửi yêu cầu!");
    }
  };

  const fetchNotifications = async () => {
    if (!activeStaff) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/notifications?userId=${activeStaff.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/notifications/${id}/read`, {
        method: "POST"
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUserToPush = async (userId: string) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported in this browser environment');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      await registration.update(); // Force check for new SW version
      console.log('Service Worker registered & updated:', registration);

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission not granted');
        return;
      }

      const vapidPublicKey = 'BA4Sd0l3Lz3CDUBwhnuop63n0Wd7zQo5UA4wz12aNdZshB9CXhbqsWMUCMdaMKNw2KE_9vgoKcc97rDTTX1cPuw';
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });

      console.log('Push subscription successful:', subscription);

      const subJson = subscription.toJSON();
      const p256dh = subJson.keys?.p256dh || '';
      const auth = subJson.keys?.auth || '';

      await fetch(`${getApiBaseUrl()}/api/attendance/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          endpoint: subscription.endpoint,
          p256Dh: p256dh,
          auth: auth
        })
      });
      console.log('Push subscription saved to DB');
    } catch (err) {
      console.error('Failed to subscribe user to Web Push:', err);
    }
  };

  const getDeviceSubscriptions = async (userId: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/push/subscriptions?userId=${userId}`);
      if (res.ok) return await res.json();
      return { count: 0, subscriptions: [] };
    } catch { return { count: 0, subscriptions: [] }; }
  };

  const testPushNotification = async (userId: string) => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/push/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (res.ok) return await res.json();
      return { message: 'Failed', error: res.statusText };
    } catch (err: any) { return { message: 'Error', error: err.message }; }
  };

  const getCurrentPushEndpoint = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return sub ? sub.endpoint : null;
    } catch { return null; }
  };

  const unsubscribeUserFromPush = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch(`${getApiBaseUrl()}/api/attendance/push/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        await subscription.unsubscribe();
        console.log('Push subscription removed successfully');
      }
    } catch (err) {
      console.error('Failed to unsubscribe user from Web Push:', err);
    }
  };
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED') {
        // Play notification sound
        try {
          const audio = new Audio('/notification.wav');
          audio.volume = 0.7;
          audio.play().catch(() => {
            // Fallback: try with AudioContext for browsers that block autoplay
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = ctx.createOscillator();
              const gainNode = ctx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(ctx.destination);
              oscillator.frequency.value = 880;
              oscillator.type = 'sine';
              gainNode.gain.value = 0.3;
              oscillator.start();
              setTimeout(() => {
                oscillator.stop();
                ctx.close();
              }, 300);
            } catch { /* silent fallback */ }
          });
        } catch { /* ignore audio errors */ }

        // Also refresh notifications list
        fetchNotifications();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, []);

  useEffect(() => {
    if (activeStaff) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);

      const checkAndSetupPush = async () => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
          return;
        }

        if (Notification.permission !== 'granted') {
          setShowPushNotificationPrompt(true);
        } else {
          try {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (!sub) {
              await subscribeUserToPush(activeStaff.id);
            } else {
              const subsResult = await getDeviceSubscriptions(activeStaff.id);
              const exists = subsResult?.subscriptions?.some((s: any) => s.endpoint === sub.endpoint);
              if (!exists) {
                console.log('Push subscription not found in DB for this user, syncing...');
                await subscribeUserToPush(activeStaff.id);
              }
            }
          } catch (e) {
            console.error('Error checking push subscription status:', e);
            subscribeUserToPush(activeStaff.id);
          }
        }
      };

      checkAndSetupPush();

      return () => clearInterval(interval);
    }
  }, [activeStaff]);

  // Actions - Admin Panel
  const approveRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/requests/${requestId}/approve`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchRequests();

        // If it was a leave request, refresh schedules to reflect shift deletion immediately
        if (request.type === "leave" && request.targetShiftId) {
          try {
            const schedResponse = await fetch(`${getApiBaseUrl()}/api/attendance/schedules?locationId=${activeLocation?.id || "govap-branch"}`);
            if (schedResponse.ok) {
              const schedData = await schedResponse.json();
              setShifts(schedData.map((s: any) => ({
                id: s.id,
                staffId: s.userId,
                staffName: s.staffName,
                date: s.date,
                shiftType: `${s.startTime} - ${s.endTime}`,
                locationId: activeLocation?.id || "govap-branch",
                locationName: activeLocation?.name || "Chi nhánh",
                approved: true
              })));
            }
          } catch (e) {
            console.error("Failed to refresh shifts:", e);
          }
        }

        const newLog: ActivityLog = {
          id: `log-admin-${Date.now()}`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
          staffName: request.staffName,
          action: "Đơn được duyệt",
          description: request.type === "leave"
            ? `Đơn xin nghỉ ca ngày ${new Date(request.date).toLocaleDateString("vi-VN")} của bạn đã được duyệt và xóa khỏi lịch trực.`
            : `Đơn đổi ca ngày ${new Date(request.date).toLocaleDateString("vi-VN")} của bạn đã được duyệt.`
        };
        setLogs(prev => [newLog, ...prev]);
      } else {
        const errData = await res.json();
        alert(errData.message || "Phê duyệt đơn thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi phê duyệt đơn!");
    }
  };

  const rejectRequest = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/requests/${requestId}/reject`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchRequests();
        const newLog: ActivityLog = {
          id: `log-admin-${Date.now()}`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
          staffName: request.staffName,
          action: "Đơn bị từ chối",
          description: `Đơn ${request.type === "leave" ? "xin nghỉ" : "đổi ca"} ngày ${new Date(request.date).toLocaleDateString("vi-VN")} của bạn đã bị từ chối.`
        };
        setLogs(prev => [newLog, ...prev]);
      } else {
        const errData = await res.json();
        alert(errData.message || "Từ chối đơn thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi từ chối đơn!");
    }
  };

  const addPromotion = (title: string, description: string, image: string, expiryDate?: string) => {
    const newPromo: Promotion = {
      id: `p-${Date.now()}`,
      title,
      description,
      image: image || "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600",
      date: new Date().toLocaleDateString("vi-VN"),
      expiryDate,
      status: "active"
    };

    setPromotions(prev => [newPromo, ...prev]);

    const newLog: ActivityLog = {
      id: `log-admin-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
      staffName: "Admin",
      action: "Đăng khuyến mãi mới",
      description: `Đã đăng chiến dịch ưu đãi mới: "${title}"`
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const deletePromotion = (promoId: string) => {
    setPromotions(prev => prev.filter(p => p.id !== promoId));
    const newLog: ActivityLog = {
      id: `log-admin-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
      staffName: "Admin",
      action: "Xóa khuyến mãi",
      description: `Đã xóa vĩnh viễn bài đăng khuyến mãi ID: ${promoId}`
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const archivePromotion = (promoId: string) => {
    setPromotions(prev => prev.map(p => p.id === promoId ? { ...p, status: "archived" } : p));
    const newLog: ActivityLog = {
      id: `log-admin-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
      staffName: "Admin",
      action: "Thu hồi khuyến mãi",
      description: `Đã lưu trữ/thu hồi bài đăng khuyến mãi ID: ${promoId}`
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const updateMenuImage = (url: string) => {
    setMenuImage(url);
    const newImg: MenuImageItem = {
      id: `menu-${Date.now()}`,
      url,
      active: true
    };
    setMenuImages(prev => [...prev, newImg]);

    const newLog: ActivityLog = {
      id: `log-admin-${Date.now()}`,
      time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
      staffName: "Admin",
      action: "Cập nhật menu quán",
      description: "Đã đăng tải một tệp hình ảnh Menu tấm lớn mới lên hệ thống."
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const updateMenuImages = (images: MenuImageItem[]) => {
    setMenuImages(images);
    const firstActive = images.find(img => img.active);
    if (firstActive) {
      setMenuImage(firstActive.url);
    } else {
      setMenuImage(DEFAULT_MENU_IMAGE);
    }
  };

  const sendCustomerFeedback = (message: string) => {
    if (!activeCustomer) return;

    const newMsg: FeedbackMessage = {
      id: `f-${Date.now()}`,
      customerPhone: activeCustomer.phone,
      customerName: activeCustomer.name,
      message,
      sender: "customer",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN")
    };

    setFeedbacks(prev => [...prev, newMsg]);
  };

  const sendFeedbackReply = (customerPhone: string, message: string) => {
    const customer = customers.find(c => c.phone === customerPhone);
    if (!customer) return;

    const newMsg: FeedbackMessage = {
      id: `f-${Date.now()}`,
      customerPhone,
      customerName: customer.name,
      message,
      sender: "admin",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN")
    };

    setFeedbacks(prev => [...prev, newMsg]);
  };

  // Actions - Super Admin (Kill-Switch toggling and Billing renewals)
  const toggleTenantStatus = async (type: "brand" | "location", id: string) => {
    if (type === "brand") {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/brands/toggle-status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId: id })
        });
        if (response.ok) {
          const resData = await response.json();
          setBrands(prev => prev.map(b => {
            if (b.id === id) {
              const newStatus = resData.status;

              // Cascade status to locations matching the brand code
              setLocations(lPrev => lPrev.map(l => l.brandId === b.code ? { ...l, status: newStatus } : l));

              const newLog: ActivityLog = {
                id: `log-sa-${Date.now()}`,
                time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
                staffName: "Super Admin",
                action: newStatus === "suspended" ? "Kích Hoạt Nút Ngắt (Kill-Switch ON)" : "Hủy Ngắt Kết Nối (Kill-Switch OFF)",
                description: `Super Admin đã ${newStatus === "suspended" ? "TẠM KHÓA" : "MỞ KHÓA"} quyền truy cập hệ thống của toàn bộ thương hiệu: "${b.name}".`
              };
              setLogs(logPrev => [newLog, ...logPrev]);

              if (activeBrand && activeBrand.id === id) {
                setActiveBrand({ ...activeBrand, status: newStatus });
              }

              return { ...b, status: newStatus };
            }
            return b;
          }));
        }
      } catch (err) {
        console.error("Failed to toggle brand status:", err);
      }
    } else {
      setLocations(prev => prev.map(l => {
        if (l.id === id) {
          const newStatus = l.status === "active" ? "suspended" : "active";

          const newLog: ActivityLog = {
            id: `log-sa-${Date.now()}`,
            time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
            staffName: "Super Admin",
            action: "Ngắt Chi Nhánh",
            description: `Super Admin đã thay đổi trạng thái chi nhánh "${l.name}" thành: ${newStatus === "suspended" ? "TẠM KHÓA" : "ĐANG CHẠY"}.`
          };
          setLogs(logPrev => [newLog, ...logPrev]);

          if (activeLocation && activeLocation.id === id) {
            setActiveLocation({ ...activeLocation, status: newStatus });
          }

          return { ...l, status: newStatus };
        }
        return l;
      }));
    }
  };

  const paySubscription = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (!invoice) return;

    // Mark paid
    setInvoices(prev => prev.map(i => i.id === invoiceId
      ? { ...i, status: "paid", paidAt: new Date().toLocaleDateString("vi-VN") }
      : i
    ));

    // Reactive brand
    setBrands(prev => prev.map(b => {
      if (b.id === invoice.brandId) {
        // Cascade reactivate
        setLocations(lPrev => lPrev.map(l => l.brandId === invoice.brandId ? { ...l, status: "active" } : l));

        // Log action
        const newLog: ActivityLog = {
          id: `log-sa-${Date.now()}`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
          staffName: "Super Admin",
          action: "Gia Hạn Thuê Bao",
          description: `Thương hiệu "${b.name}" đã thanh toán cước thuê bao phí ${invoice.amount.toLocaleString("vi-VN")}đ. Hệ thống tự động mở khóa các cổng hoạt động bình thường.`
        };
        setLogs(logPrev => [newLog, ...logPrev]);

        if (activeBrand && activeBrand.id === b.id) {
          setActiveBrand({ ...activeBrand, status: "active" });
        }

        return { ...b, status: "active" };
      }
      return b;
    }));
  };

  const createBrand = async (name: string, code: string, plan: any, fee: number, customDomain?: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/brands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          plan,
          monthlyFee: fee,
          customDomain
        })
      });
      if (response.ok) {
        const data = await response.json();
        setBrands(prev => [...prev, data.brand]);

        const newLog: ActivityLog = {
          id: `log-sa-${Date.now()}`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
          staffName: "Super Admin",
          action: "Cấp tài khoản Tenant",
          description: `Đã khởi tạo thành công tài khoản thương hiệu SaaS mới: "${name}" đăng ký gói "${plan}".`
        };
        setLogs(logPrev => [newLog, ...logPrev]);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || "Tạo thương hiệu thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi tạo thương hiệu!");
    }
  };

  const createLocation = async (brandId: string, name: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/brands/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId,
          name
        })
      });
      if (response.ok) {
        const data = await response.json();
        setLocations(prev => [...prev, data.location]);

        const newLog: ActivityLog = {
          id: `log-sa-${Date.now()}`,
          time: new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' }) + " - " + new Date().toLocaleDateString("vi-VN"),
          staffName: "Super Admin",
          action: "Tạo chi nhánh mới",
          description: `Đã cấp phép mở rộng chi nhánh mới "${data.location.name}" cho chủ chuỗi thương hiệu.`
        };
        setLogs(logPrev => [newLog, ...logPrev]);
      } else {
        const errData = await response.json().catch(() => ({}));
        alert(errData.message || "Tạo chi nhánh thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi tạo chi nhánh!");
    }
  };

  return (
    <AppContext.Provider
      value={{
        brands,
        locations,
        activeBrand,
        activeLocation,
        invoices,
        customers,
        activeCustomer,
        activeStaff,
        promotions,
        shifts,
        requests,
        logs,
        feedbacks,
        menuImage,
        menuImages,
        timekeeping,
        notifications,

        selectBrandAndLocation,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        updateCustomerProfile,
        addPointsToCustomer,
        adjustPointsManually,
        useVoucher,
        clockInStaff,
        clockOutStaff,
        registerShift,
        submitRequest,
        fetchNotifications,
        markNotificationAsRead,
        subscribeUserToPush,
        getDeviceSubscriptions,
        testPushNotification,
        getCurrentPushEndpoint,
        unsubscribeUserFromPush,
        showPushNotificationPrompt,
        setShowPushNotificationPrompt,
        approveRequest,
        rejectRequest,
        addPromotion,
        deletePromotion,
        archivePromotion,
        updateMenuImage,
        updateMenuImages,
        sendCustomerFeedback,
        sendFeedbackReply,

        toggleTenantStatus,
        paySubscription,
        createBrand,
        createLocation
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
