"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { LayoutDashboard, Megaphone, Calendar, FileCheck, Settings, Users, ImagePlus, MessageSquare, ArrowLeft, Menu, X, ChevronRight, TrendingUp, MapPin, UserCheck, Clock, Gift, Plus, CheckCircle, XCircle, Search, Edit3, Coffee, Send, Bell, ScanLine, AlertTriangle, RefreshCw, LogOut, Lock, DollarSign, Award, Trash2, FileText } from "lucide-react";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";
import { useRouter } from "next/navigation";

const parseTimeToFloat = (timeStr: string) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  return parseFloat(parts[0]) + (parts[1] ? parseFloat(parts[1]) / 60 : 0);
};

const getVisualEventsForDay = (eventsList: any[], dayDateStr: string) => {
  if (!eventsList) return [];
  const d = new Date(dayDateStr);
  d.setDate(d.getDate() - 1);
  const prevDateStr = d.toISOString().split('T')[0];

  const list: any[] = [];
  eventsList.forEach((e: any) => {
    const startVal = parseTimeToFloat(e.startTime);
    const endVal = parseTimeToFloat(e.endTime);
    const isOvernight = endVal < startVal;

    if (e.date === dayDateStr) {
      if (isOvernight) {
        list.push({
          ...e,
          startTime: e.startTime,
          endTime: "24:00",
          origStartTime: e.startTime,
          origEndTime: e.endTime
        });
      } else {
        list.push({
          ...e,
          startTime: e.startTime,
          endTime: e.endTime
        });
      }
    } else if (e.date === prevDateStr && isOvernight) {
      list.push({
        ...e,
        startTime: "00:00",
        endTime: e.endTime,
        origStartTime: e.startTime,
        origEndTime: e.endTime
      });
    }
  });
  return list;
};


const getLayoutedEvents = (events: any[]) => {
  const sorted = [...events].sort((a, b) => parseTimeToFloat(a.startTime) - parseTimeToFloat(b.startTime));
  const columns: any[][] = [];

  for (const event of sorted) {
    let placed = false;
    const eventStart = parseTimeToFloat(event.startTime);

    for (const col of columns) {
      const lastEvent = col[col.length - 1];
      const lastEnd = parseTimeToFloat(lastEvent.endTime);

      if (eventStart >= lastEnd) {
        col.push(event);
        placed = true;
        break;
      }
    }

    if (!placed) {
      columns.push([event]);
    }
  }

  const result: any[] = [];
  const totalCols = columns.length;
  columns.forEach((col, colIdx) => {
    col.forEach(event => {
      result.push({
        ...event,
        left: (colIdx / totalCols) * 100,
        width: (1 / totalCols) * 100
      });
    });
  });
  return result;
};

export default function AdminPortal() {
  const { activeBrand, activeLocation, customers, promotions, shifts, requests, feedbacks, menuImage, menuImages, addPromotion, deletePromotion, archivePromotion, approveRequest, rejectRequest, adjustPointsManually, updateMenuImage, updateMenuImages, sendFeedbackReply, logs, addPointsToCustomer, notifications, markNotificationAsRead, subscribeUserToPush, showPushNotificationPrompt, setShowPushNotificationPrompt } = useApp() as any;

  const [page, setPage] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const [devTab, setDevTab] = useState("matrix");
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ userId: string; userName: string; date: string; dateLabel: string } | null>(null);
  const [cellIsOff, setCellIsOff] = useState(false);
  const [cellStartTime, setCellStartTime] = useState("08:00");
  const [cellEndTime, setCellEndTime] = useState("16:00");
  const [mobileTab, setMobileTab] = useState<"shifts" | "availabilities">("shifts");

  const handleRefreshAll = async () => {
    try {
      if (typeof fetchStaff === "function") await fetchStaff();
      if (typeof fetchHrmConfigs === "function") await fetchHrmConfigs();
      if (typeof fetchAvailabilities === "function") await fetchAvailabilities();
      if (typeof fetchOfficialSchedules === "function") await fetchOfficialSchedules();
      if (typeof fetchPayrollData === "function") await fetchPayrollData();
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPage = localStorage.getItem("moods_admin_active_page");
      if (savedPage) {
        setPage(savedPage);
      }
    }
  }, []);

  const handleSetPage = (key: string) => {
    setPage(key);
    if (typeof window !== "undefined") {
      localStorage.setItem("moods_admin_active_page", key);
    }
  };
  const [showNotification, setShowNotification] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>("");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

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
  const [staffLoading, setStaffLoading] = useState(false);

  // Staff Editing States
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editStaffName, setEditStaffName] = useState("");
  const [editStaffPhone, setEditStaffPhone] = useState("");
  const [editStaffWage, setEditStaffWage] = useState("");

  // Schedule Management States
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedScheduleStaffId, setSelectedScheduleStaffId] = useState("");
  const [selectedScheduleStaffIds, setSelectedScheduleStaffIds] = useState<string[]>([]);
  const [schedStartTime, setSchedStartTime] = useState("08:00");
  const [schedEndTime, setSchedEndTime] = useState("12:00");
  const [isRegGateLocked, setIsRegGateLocked] = useState(false);
  const [availabilitiesList, setAvailabilitiesList] = useState<any[]>([]);
  const [officialSchedulesList, setOfficialSchedulesList] = useState<any[]>([]);
  const [filterByAvailability, setFilterByAvailability] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = tuần này, 1 = tuần sau
  const [showSchedModal, setShowSchedModal] = useState(false);
  const [editingSchedId, setEditingSchedId] = useState<string | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");

  const handleCreateOrUpdateSchedule = async () => {
    if (!schedStartTime || !schedEndTime) {
      alert("Vui lòng chọn giờ bắt đầu và kết thúc!");
      return;
    }

    if (editingSchedId) {
      if (selectedScheduleStaffIds.length === 0) {
        alert("Vui lòng chọn ít nhất một nhân sự để xếp ca!");
        return;
      }
      const firstUid = selectedScheduleStaffIds[0];
      const otherUids = selectedScheduleStaffIds.slice(1);

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/attendance/schedules/${editingSchedId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: firstUid,
            locationId: activeLocation?.id || "govap-branch",
            date: selectedScheduleDate,
            startTime: schedStartTime,
            endTime: schedEndTime,
            createdBy: "Admin"
          })
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Cập nhật ca trực thất bại!");
          return;
        }

        if (otherUids.length > 0) {
          const promises = otherUids.map(async (uid) => {
            const resPost = await fetch(`${getApiBaseUrl()}/api/attendance/schedules`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: uid,
                locationId: activeLocation?.id || "govap-branch",
                date: selectedScheduleDate,
                startTime: schedStartTime,
                endTime: schedEndTime,
                createdBy: "Admin"
              })
            });
            return { ok: resPost.ok, userId: uid };
          });

          const results = await Promise.all(promises);
          const failed = results.filter(r => !r.ok);
          if (failed.length > 0) {
            alert(`Cập nhật thành công. Tuy nhiên, đã xảy ra lỗi khi thêm ${failed.length} nhân viên khác.`);
          } else {
            alert("Cập nhật lịch trực thành công!");
          }
        } else {
          alert("Cập nhật lịch trực thành công!");
        }

        fetchOfficialSchedules();
        setShowSchedModal(false);
        setEditingSchedId(null);
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối khi cập nhật ca trực!");
      }
    } else {
      // Creating new schedule(s)
      if (selectedScheduleStaffIds.length === 0) {
        alert("Vui lòng chọn ít nhất một nhân sự để xếp ca!");
        return;
      }

      try {
        const promises = selectedScheduleStaffIds.map(async (uid) => {
          const res = await fetch(`${getApiBaseUrl()}/api/attendance/schedules`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: uid,
              locationId: activeLocation?.id || "govap-branch",
              date: selectedScheduleDate,
              startTime: schedStartTime,
              endTime: schedEndTime,
              createdBy: "Admin"
            })
          });
          return { ok: res.ok, userId: uid };
        });

        const results = await Promise.all(promises);
        const failed = results.filter(r => !r.ok);

        if (failed.length === 0) {
          alert("Xếp  chính thức thành công cho các nhân viên đã chọn!");
        } else {
          alert(`Xếp ca hoàn tất với ${failed.length} ca thất bại (do đã tồn tại lịch hoặc lỗi).`);
        }

        fetchOfficialSchedules();
        setShowSchedModal(false);
        setEditingSchedId(null);
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối khi xếp ca!");
      }
    }
  };

  const handleDeleteSchedule = async (schedId: string) => {
    if (!confirm("Bạn có chắc muốn xóa lịch trực này?")) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/schedules/${schedId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("Xóa lịch trực thành công!");
        fetchOfficialSchedules();
        setShowSchedModal(false);
        setEditingSchedId(null);
      } else {
        alert(data.message || "Xóa lịch trực thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  // Payroll States
  const [payrollList, setPayrollList] = useState<any[]>([]);
  const [payrollFromDate, setPayrollFromDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [payrollToDate, setPayrollToDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [payrollLoading, setPayrollLoading] = useState(false);

  // Dynamic Penalties/Configs
  const [latePenaltyRule, setLatePenaltyRule] = useState("10:-50000,20:-100000,30:-200000");
  const [holidaysStr, setHolidaysStr] = useState("2026-01-01,2026-04-30,2026-05-01");
  const [activeBonusStr, setActiveBonusStr] = useState("100000");

  // Adjustments & Config Tab State
  const [adjActiveTab, setAdjActiveTab] = useState("payroll"); // "payroll", "history", "rules", "holidays"
  const [configActiveTab, setConfigActiveTab] = useState("gps"); // "gps", "biometrics"
  const [newHolidayMultiplier, setNewHolidayMultiplier] = useState("2.0");
  const [newHolidayFlatBonus, setNewHolidayFlatBonus] = useState("0");

  // Late Penalty Parameters States
  const [latePenaltyStartMinutes, setLatePenaltyStartMinutes] = useState("10");
  const [latePenaltyBaseAmount, setLatePenaltyBaseAmount] = useState("50000");
  const [latePenaltyIntervalMinutes, setLatePenaltyIntervalMinutes] = useState("10");
  const [latePenaltyMultiplier, setLatePenaltyMultiplier] = useState("2");
  const [holidayMultiplier, setHolidayMultiplier] = useState("2.0");

  // GPS Configuration States
  const [gpsLatitude, setGpsLatitude] = useState("10.8315");
  const [gpsLongitude, setGpsLongitude] = useState("106.6645");
  const [gpsRadius, setGpsRadius] = useState("50");
  const [managerNote, setManagerNote] = useState("Chúc mọi người một tuần làm việc vui vẻ!");
  const [addressSearchQuery, setAddressSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Detailed Holidays list
  const [detailedHolidaysList, setDetailedHolidaysList] = useState<any[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayNote, setNewHolidayNote] = useState("");

  // Adjustments (individual bonus/penalty) list
  const [adjustmentsList, setAdjustmentsList] = useState<any[]>([]);

  // Form for adding new adjustment
  const [newAdjEmployeeId, setNewAdjEmployeeId] = useState("");
  const [newAdjType, setNewAdjType] = useState("bonus"); // "bonus" or "penalty"
  const [newAdjUnit, setNewAdjUnit] = useState("co_dinh"); // "lan", "phut", "co_dinh"
  const [newAdjQuantity, setNewAdjQuantity] = useState("1");
  const [newAdjAmountPerUnit, setNewAdjAmountPerUnit] = useState("50000");
  const [newAdjDate, setNewAdjDate] = useState("2026-06-08");
  const [newAdjNote, setNewAdjNote] = useState("");
  const [allConfigsList, setAllConfigsList] = useState<any[]>([]);

  // Penalty Modal States
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedPenaltyEmployee, setSelectedPenaltyEmployee] = useState<any>(null);

  // Grouped Adjustments Details Modal States
  const [showAdjDetailModal, setShowAdjDetailModal] = useState(false);
  const [selectedAdjGroup, setSelectedAdjGroup] = useState<any>(null);
  const [editingAdjIndex, setEditingAdjIndex] = useState<number | null>(null);

  // Staff Skills States
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [selectedNewStaffSkills, setSelectedNewStaffSkills] = useState<string[]>([]);
  const [selectedEditStaffSkills, setSelectedEditStaffSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");


  const [currentUserPhone, setCurrentUserPhone] = useState("");
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("moods_auth_user");
      const storedStaff = localStorage.getItem("moods_active_staff");
      
      if (!storedUser && !storedStaff) {
        // Chưa đăng nhập, đá văng ra trang chủ (login)
        router.push("/");
        return;
      }
      setIsAuthChecking(false);

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUserPhone(parsed.PhoneNumber || parsed.phone || "admin");
        } catch {
          setCurrentUserPhone("admin");
        }
      } else if (storedStaff) {
        try {
          const parsed = JSON.parse(storedStaff);
          setCurrentUserPhone(parsed.phone || "admin");
        } catch {
          setCurrentUserPhone("admin");
        }
      }
    }
  }, [router]);

  // Leaflet map picker initialization
  const mapRef = React.useRef<any>(null);
  const markerRef = React.useRef<any>(null);
  const circleRef = React.useRef<any>(null);
  const isUpdatingFromMap = React.useRef<boolean>(false);

  const gpsLatitudeRef = React.useRef(gpsLatitude);
  const gpsLongitudeRef = React.useRef(gpsLongitude);
  const gpsRadiusRef = React.useRef(gpsRadius);

  React.useEffect(() => {
    gpsLatitudeRef.current = gpsLatitude;
  }, [gpsLatitude]);

  React.useEffect(() => {
    gpsLongitudeRef.current = gpsLongitude;
  }, [gpsLongitude]);

  React.useEffect(() => {
    gpsRadiusRef.current = gpsRadius;
  }, [gpsRadius]);

  React.useEffect(() => {
    if (page !== "config" || configActiveTab !== "gps" || typeof window === "undefined") return;

    let intervalId: any;
    const initMap = () => {
      const L = (window as any).L;
      if (!L) return false;

      const latNum = parseFloat(gpsLatitudeRef.current) || 10.8315;
      const lngNum = parseFloat(gpsLongitudeRef.current) || 106.6645;
      const radiusNum = parseFloat(gpsRadiusRef.current) || 50;

      const mapEl = document.getElementById("map-picker");
      if (!mapEl) return false;

      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {
          console.error("Error removing map instance:", e);
        }
        mapRef.current = null;
      }

      if (mapEl && (mapEl as any)._leaflet_id) {
        (mapEl as any)._leaflet_id = null;
      }

      const map = L.map("map-picker").setView([latNum, lngNum], 16);
      mapRef.current = map;

      L.tileLayer("/proxy/osm-tiles/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors"
      }).addTo(map);

      const marker = L.marker([latNum, lngNum], { draggable: true }).addTo(map);
      markerRef.current = marker;

      const circle = L.circle([latNum, lngNum], {
        color: "#7c4831",
        fillColor: "#7c4831",
        fillOpacity: 0.15,
        radius: radiusNum
      }).addTo(map);
      circleRef.current = circle;

      // Handle marker drag end
      marker.on("dragend", () => {
        isUpdatingFromMap.current = true;
        const position = marker.getLatLng();
        const latStr = position.lat.toFixed(6);
        const lngStr = position.lng.toFixed(6);
        setGpsLatitude(latStr);
        setGpsLongitude(lngStr);
        circle.setLatLng(position);
        fetchAddressFromCoords(latStr, lngStr);
        setTimeout(() => { isUpdatingFromMap.current = false; }, 100);
      });

      // Handle map click
      map.on("click", (e: any) => {
        isUpdatingFromMap.current = true;
        const coords = e.latlng;
        const latStr = coords.lat.toFixed(6);
        const lngStr = coords.lng.toFixed(6);
        marker.setLatLng(coords);
        circle.setLatLng(coords);
        setGpsLatitude(latStr);
        setGpsLongitude(lngStr);
        fetchAddressFromCoords(latStr, lngStr);
        setTimeout(() => { isUpdatingFromMap.current = false; }, 100);
      });

      return true;
    };

    // Try to initialize immediately, otherwise check periodically
    if (!initMap()) {
      intervalId = setInterval(() => {
        if (initMap()) {
          clearInterval(intervalId);
        }
      }, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [configActiveTab, page, activeLocation?.id]);

  React.useEffect(() => {
    if (circleRef.current && gpsRadius) {
      const radiusNum = parseFloat(gpsRadius) || 50;
      circleRef.current.setRadius(radiusNum);
    }
  }, [gpsRadius]);

  React.useEffect(() => {
    if (isUpdatingFromMap.current) return;
    const lat = parseFloat(gpsLatitude);
    const lng = parseFloat(gpsLongitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
      if (circleRef.current) circleRef.current.setLatLng([lat, lng]);
      if (mapRef.current) mapRef.current.panTo([lat, lng]);
    }
  }, [gpsLatitude, gpsLongitude]);

  const getRpId = () => {
    if (typeof window === "undefined") return "localhost";
    return window.location.hostname;
  };

  const handleRegisterBiometricDirectly = async () => {
    if (typeof window === "undefined") return;
    if (!window.isSecureContext) {
      alert("Thiết lập sinh trắc học yêu cầu kết nối bảo mật HTTPS (hoặc localhost).");
      return;
    }
    if (!navigator.credentials) {
      alert("Thiết bị hoặc trình duyệt của bạn không hỗ trợ bảo mật sinh trắc học Touch ID!");
      return;
    }

    const phone = currentUserPhone || "admin";
    try {
      const randomChallenge = new Uint8Array(32);
      window.crypto.getRandomValues(randomChallenge);
      const userId = new TextEncoder().encode(phone);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: randomChallenge,
        rp: {
          name: "The Moods Specialty Coffee",
          id: getRpId(),
        },
        user: {
          id: userId,
          name: phone,
          displayName: phone,
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
        const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/setup-biometric`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber: phone, biometricKey: bioKey, locationId: activeLocation?.id || "govap-branch" }) // Staff-per-Branch
        });
        if (res.ok) {
          console.log("Biometric linked to DB successfully");
        }

        localStorage.setItem(`moods_bio_cred_${phone}`, bioKey);
        localStorage.setItem(`moods_bio_${phone}`, "enabled");
        alert("Kích hoạt sinh trắc học (vân tay) thành công cho thiết bị này!");
      }
    } catch (err: any) {
      console.error(err);
      alert("Kích hoạt sinh trắc học không thành công: " + (err.message || ""));
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("moods_active_staff");
      localStorage.removeItem("moods_auth_user");
    }
    window.location.href = "/";
  };

  // Promos
  const [promoTitle, setPromoTitle] = useState("");
  const [promoDesc, setPromoDesc] = useState("");
  const [promoImg, setPromoImg] = useState("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80");
  const [promoExpiry, setPromoExpiry] = useState("");

  // Points
  const [editPhone, setEditPhone] = useState("");
  const [editPts, setEditPts] = useState("");

  // Feedback Chat
  const [selectedFeedbackPhone, setSelectedFeedbackPhone] = useState<string | null>(null);

  // QR Scanner State
  const [qrInput, setQrInput] = useState("");
  const [qrBillAmt, setQrBillAmt] = useState("");
  const [qrLookupResult, setQrLookupResult] = useState<any>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [qrSuccess, setQrSuccess] = useState("");
  const [qrActiveTab, setQrActiveTab] = useState<"scan" | "loyalty" | "customers">("scan");

  const locked = activeBrand?.status === "suspended" || activeLocation?.status === "suspended";

  const fetchAddressFromCoords = async (lat: string, lon: string) => {
    try {
      const res = await fetch(`/proxy/nominatim/reverse?format=json&lat=${lat}&lon=${lon}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) {
          let addr = data.display_name;
          addr = addr.replace(/, 7\d{5}/g, "");
          addr = addr.replace(/, Việt Nam$/g, "");
          setAddressSearchQuery(addr);
        }
      }
    } catch (err) {
      console.error("Failed to reverse geocode:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      // Staff-per-Branch: lọc Staff theo Branch hiện tại
      const locId = activeLocation?.id || "govap-branch";
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff?locationId=${locId}`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };
  const fetchHrmConfigs = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`);
      if (res.ok) {
        const data = await res.json();
        setAllConfigsList(data);
        const lockVal = data.find((c: any) => c.configKey === "ShiftRegistrationLocked")?.configValue;
        setIsRegGateLocked(lockVal === "true");

        const lateVal = data.find((c: any) => c.configKey === "LatePenaltyRule")?.configValue;
        if (lateVal) setLatePenaltyRule(lateVal);

        const holVal = data.find((c: any) => c.configKey === "Holidays")?.configValue;
        if (holVal) setHolidaysStr(holVal);

        const bonVal = data.find((c: any) => c.configKey === "ActiveBonus")?.configValue;
        if (bonVal) setActiveBonusStr(bonVal);

        // New formula keys
        const startVal = data.find((c: any) => c.configKey === "LatePenaltyStartMinutes")?.configValue;
        if (startVal) setLatePenaltyStartMinutes(startVal);

        const baseVal = data.find((c: any) => c.configKey === "LatePenaltyBaseAmount")?.configValue;
        if (baseVal) setLatePenaltyBaseAmount(baseVal);

        const intervalVal = data.find((c: any) => c.configKey === "LatePenaltyIntervalMinutes")?.configValue;
        if (intervalVal) setLatePenaltyIntervalMinutes(intervalVal);

        const multVal = data.find((c: any) => c.configKey === "LatePenaltyMultiplier")?.configValue;
        if (multVal) setLatePenaltyMultiplier(multVal);

        const holMultVal = data.find((c: any) => c.configKey === "HolidayMultiplier")?.configValue;
        if (holMultVal) setHolidayMultiplier(holMultVal);

        const latVal = data.find((c: any) => c.configKey === "GpsLatitude")?.configValue;
        if (latVal) setGpsLatitude(latVal);

        const lngVal = data.find((c: any) => c.configKey === "GpsLongitude")?.configValue;
        if (lngVal) setGpsLongitude(lngVal);

        const radVal = data.find((c: any) => c.configKey === "GpsRadius")?.configValue;
        if (radVal) setGpsRadius(radVal);

        const noteVal = data.find((c: any) => c.configKey === "ManagerNote")?.configValue;
        if (noteVal) setManagerNote(noteVal);

        if (latVal && lngVal) {
          fetchAddressFromCoords(latVal, lngVal);
        }

        // Detailed Holidays
        const holDetVal = data.find((c: any) => c.configKey === "Holidays_Detailed")?.configValue;
        if (holDetVal) {
          try {
            setDetailedHolidaysList(JSON.parse(holDetVal));
          } catch {
            setDetailedHolidaysList([]);
          }
        } else {
          setDetailedHolidaysList([]);
        }

        // Adjustments
        const adjVal = data.find((c: any) => c.configKey === "Adjustments")?.configValue;
        if (adjVal) {
          try {
            setAdjustmentsList(JSON.parse(adjVal));
          } catch {
            setAdjustmentsList([]);
          }
        } else {
          setAdjustmentsList([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/availability?locationId=${activeLocation?.id || "govap-branch"}`);
      if (res.ok) {
        const data = await res.json();
        setAvailabilitiesList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOfficialSchedules = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/schedules?locationId=${activeLocation?.id || "govap-branch"}`);
      if (res.ok) {
        const data = await res.json();
        setOfficialSchedulesList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPayrollData = async () => {
    setPayrollLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/payroll?locationId=${activeLocation?.id || "govap-branch"}&fromDate=${payrollFromDate}&toDate=${payrollToDate}`);
      if (res.ok) {
        const data = await res.json();
        setPayrollList(data);
      }
      await fetchOfficialSchedules();
    } catch (err) {
      console.error(err);
    } finally {
      setPayrollLoading(false);
    }
  };

  const handleSaveHrmConfigs = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { configKey: "LatePenaltyStartMinutes", configValue: latePenaltyStartMinutes },
          { configKey: "LatePenaltyBaseAmount", configValue: latePenaltyBaseAmount },
          { configKey: "LatePenaltyIntervalMinutes", configValue: latePenaltyIntervalMinutes },
          { configKey: "LatePenaltyMultiplier", configValue: latePenaltyMultiplier },
          { configKey: "HolidayMultiplier", configValue: holidayMultiplier },
          { configKey: "GpsLatitude", configValue: gpsLatitude },
          { configKey: "GpsLongitude", configValue: gpsLongitude },
          { configKey: "GpsRadius", configValue: gpsRadius }
        ])
      });
      if (res.ok) {
        alert("Cập nhật cấu hình tính lương thành công!");
        fetchHrmConfigs();
      } else {
        alert("Không thể cập nhật cấu hình!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi cập nhật cấu hình!");
    }
  };

  const handleSaveManagerNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { configKey: "ManagerNote", configValue: managerNote }
        ])
      });
      if (res.ok) {
        alert("Cập nhật ghi chú của quản lý thành công!");
        fetchHrmConfigs();
      } else {
        alert("Không thể cập nhật ghi chú!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi cập nhật ghi chú!");
    }
  };

  const handleAddressSearch = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!addressSearchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/proxy/nominatim/search?format=json&q=${encodeURIComponent(addressSearchQuery)}&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const first = data[0];
          const lat = parseFloat(first.lat);
          const lon = parseFloat(first.lon);
          setGpsLatitude(lat.toFixed(6));
          setGpsLongitude(lon.toFixed(6));
          if (markerRef.current) markerRef.current.setLatLng([lat, lon]);
          if (circleRef.current) circleRef.current.setLatLng([lat, lon]);
          if (mapRef.current) {
            mapRef.current.setView([lat, lon], 16);
          }
        } else {
          alert("Không tìm thấy địa chỉ này. Vui lòng nhập chi tiết hơn!");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi khi kết nối dịch vụ bản đồ!");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGetCurrentLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS!");
      return;
    }

    const successCallback = (position: any) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      setGpsLatitude(lat.toFixed(6));
      setGpsLongitude(lon.toFixed(6));
      if (markerRef.current) markerRef.current.setLatLng([lat, lon]);
      if (circleRef.current) circleRef.current.setLatLng([lat, lon]);
      if (mapRef.current) {
        mapRef.current.setView([lat, lon], 16);
      }
      fetchAddressFromCoords(lat.toFixed(6), lon.toFixed(6));
      alert("Đã lấy vị trí hiện tại thành công!");
    };

    const errorCallback = (error: any) => {
      console.warn("High accuracy geolocation failed, trying fallback...", error);
      // Fallback: try with enableHighAccuracy: false
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (fallbackError) => {
          console.error("Fallback geolocation also failed:", fallbackError);
          if (fallbackError.code === 1) {
            alert("Trình duyệt từ chối quyền truy cập GPS. Vui lòng cấp quyền ở thanh địa chỉ!");
          } else if (fallbackError.code === 2) {
            alert("Vị trí không khả dụng. Trình duyệt PC (cắm dây LAN) không có Wi-Fi/GPS có thể gặp lỗi này. Bạn có thể kéo thả ghim trên bản đồ để chọn thủ công nhé!");
          } else if (fallbackError.code === 3) {
            alert("Yêu cầu lấy vị trí hết thời gian chờ (Timeout). Bạn hãy thử lại hoặc kéo thả ghim trên bản đồ nhé!");
          } else {
            alert("Không thể định vị tự động. Vui lòng kéo thả ghim trên bản đồ để chọn tọa độ quán nhé!");
          }
        },
        { enableHighAccuracy: false, timeout: 15000 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleAddDetailedHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate || !newHolidayNote.trim()) {
      alert("Vui lòng nhập ngày và ghi chú ngày lễ!");
      return;
    }
    const updated = [
      ...detailedHolidaysList,
      {
        Date: newHolidayDate,
        Note: newHolidayNote.trim(),
        Multiplier: parseFloat(newHolidayMultiplier) || 2.0,
        FlatBonus: parseFloat(newHolidayFlatBonus) || 0
      }
    ];
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { configKey: "Holidays_Detailed", configValue: JSON.stringify(updated), description: "Danh sách ngày lễ chi tiết có ghi chú (JSON)" }
        ])
      });
      if (res.ok) {
        alert("Thêm ngày lễ thành công!");
        setNewHolidayDate("");
        setNewHolidayNote("");
        setNewHolidayMultiplier("2.0");
        setNewHolidayFlatBonus("0");
        fetchHrmConfigs();
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const handleDeleteDetailedHoliday = async (holidayIndex: number) => {
    if (!confirm("Bạn có chắc muốn xóa ngày lễ này?")) return;
    const updated = detailedHolidaysList.filter((_, idx) => idx !== holidayIndex);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { configKey: "Holidays_Detailed", configValue: JSON.stringify(updated), description: "Danh sách ngày lễ chi tiết có ghi chú (JSON)" }
        ])
      });
      if (res.ok) {
        alert("Xóa ngày lễ thành công!");
        fetchHrmConfigs();
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };
  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdjEmployeeId) {
      alert("Vui lòng chọn nhân viên!");
      return;
    }
    if (!newAdjNote.trim()) {
      alert("Vui lòng điền ghi chú lý do!");
      return;
    }

    const emp = staffList.find((s: any) => s.id === newAdjEmployeeId);
    const empName = emp ? emp.fullName : "Nhân viên";

    const qty = parseFloat(newAdjQuantity) || 1;
    const price = parseFloat(newAdjAmountPerUnit) || 0;
    const totalAmt = newAdjUnit === "co_dinh" ? price : qty * price;

    const newAdj = {
      EmployeeId: newAdjEmployeeId,
      EmployeeName: empName,
      Type: newAdjType,
      Unit: newAdjUnit,
      Quantity: qty,
      AmountPerUnit: price,
      Amount: totalAmt,
      Date: newAdjDate,
      Note: newAdjNote.trim()
    };

    let updated = [...adjustmentsList];
    if (editingAdjIndex !== null) {
      updated[editingAdjIndex] = newAdj;
    } else {
      updated.push(newAdj);
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { configKey: "Adjustments", configValue: JSON.stringify(updated), description: "Danh sách thưởng phạt riêng của nhân viên (JSON)" }
        ])
      });
      if (res.ok) {
        alert(editingAdjIndex !== null ? "Cập nhật khoản thưởng/phạt thành công!" : "Thêm khoản thưởng/phạt thành công!");
        setNewAdjNote("");
        setEditingAdjIndex(null);
        fetchHrmConfigs();
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const handleDeleteAdjustment = async (adjIndex: number) => {
    if (!confirm("Bạn có chắc muốn xóa khoản thưởng/phạt này?")) return;
    const updated = adjustmentsList.filter((_, idx) => idx !== adjIndex);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { configKey: "Adjustments", configValue: JSON.stringify(updated), description: "Danh sách thưởng phạt riêng của nhân viên (JSON)" }
        ])
      });
      if (res.ok) {
        alert("Xóa khoản thưởng/phạt thành công!");
        fetchHrmConfigs();
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const handleToggleRegGate = async () => {
    const nextState = !isRegGateLocked;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { configKey: "ShiftRegistrationLocked", configValue: String(nextState) }
        ])
      });
      if (res.ok) {
        setIsRegGateLocked(nextState);
        alert(nextState ? "Đã khóa cổng đăng ký ca rảnh của nhân viên!" : "Đã mở cổng đăng ký ca rảnh cho nhân viên!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi thay đổi trạng thái cổng!");
    }
  };
  const fetchSkills = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/skills`);
      if (res.ok) {
        const data = await res.json();
        setSkillsList(data);
      }
    } catch (err) {
      console.error("Failed to fetch skills:", err);
    }
  };

  const handleCreateSkillInline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/skills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSkillInput.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setSkillsList(prev => [...prev, data.skill]);
        setSelectedNewStaffSkills(prev => [...prev, data.skill.id]);
        setSelectedEditStaffSkills(prev => [...prev, data.skill.id]);
        setNewSkillInput("");
      } else {
        alert(data.message || "Tạo kỹ năng thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi tạo kỹ năng!");
    }
  };

  React.useEffect(() => {
    if (page === "staff") {
      fetchStaff();
      fetchSkills();
    } else if (page === "adjustments") {
      fetchHrmConfigs();
      fetchStaff();
      fetchPayrollData();
    } else if (page === "schedule") {
      fetchHrmConfigs();
      fetchAvailabilities();
      fetchOfficialSchedules();
      fetchStaff();
      fetchSkills();
    } else if (page === "payroll") {
      fetchPayrollData();
    } else if (page === "config") {
      fetchHrmConfigs();
      fetchStaff();
    }
  }, [page, activeLocation?.id]);

  const handleRegisterStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffPhone.trim() || !newStaffName.trim()) {
      alert("Vui lòng nhập đầy đủ Số điện thoại và Họ tên!");
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
          locationId: activeLocation?.id || "govap-branch",
          hourlyWage: Number(newStaffWage || 25000),
          skillIds: selectedNewStaffSkills
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Đăng ký nhân sự thành công!");
        setNewStaffPhone("");
        setNewStaffName("");
        setNewStaffWage("25000");
        setSelectedNewStaffSkills([]);
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

  const handleUpdateStaff = async (staffId: string) => {
    if (!editStaffName.trim() || !editStaffPhone.trim() || !editStaffWage) {
      alert("Vui lòng nhập đầy đủ thông tin!");
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
          skillIds: selectedEditStaffSkills
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Cập nhật thông tin nhân viên thành công!");
        setEditingStaffId(null);
        setSelectedEditStaffSkills([]);
        fetchStaff();
      } else {
        alert(data.message || "Cập nhật thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối khi cập nhật thông tin nhân viên!");
    }
  };

  const handleSetResigned = async (staffId: string) => {
    if (!confirm("Bạn có chắc chắn muốn cho nhân viên này nghỉ việc? Nhân viên sẽ bị ẩn khỏi danh sách và bảng lương.")) {
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
        alert("Đã cập nhật trạng thái nghỉ việc!");
        setEditingStaffId(null);
        fetchStaff();
      } else {
        alert(data.message || "Thao tác thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối!");
    }
  };

  const menuItems = [
    { key: "dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { key: "scanqr", icon: ScanLine, label: "Quét QR" },
    { key: "staff", icon: Users, label: "Nhân viên" },
    { key: "adjustments", icon: DollarSign, label: "Tính lương" },
    { key: "promos", icon: Megaphone, label: "Khuyến mãi" },
    { key: "schedule", icon: Calendar, label: "Lịch trực" },
    { key: "requests", icon: FileCheck, label: "Duyệt đơn" },
    { key: "feedback", icon: MessageSquare, label: "Ý kiến góp ý" },
    { key: "config", icon: Settings, label: "Cấu hình" },
  ];

  const getAvatarBg = (name: string) => {
    return "bg-[#FAF9F6] text-[#4B3621] border-gray-200/80";
  };

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // === DASHBOARD ===
  const DashView = () => {
    const totalCust = customers?.length || 0;
    const totalPts = customers?.reduce((s: number, c: any) => s + c.points, 0) || 0;
    const pendingReqs = requests?.filter((r: any) => r.status === "pending").length || 0;
    const totalShifts = shifts?.length || 0;

    const kpis = [
      { label: "Tổng Khách Hàng", value: totalCust, icon: Users, subText: "+4.2% so với tháng trước", subClass: "text-emerald-600" },
      { label: "Tổng Điểm Tích Lũy", value: totalPts, icon: TrendingUp, subText: "+8.5% so với tháng trước", subClass: "text-emerald-600" },
      { label: "Đơn Chờ Xét Duyệt", value: pendingReqs, icon: FileCheck, subText: "Yêu cầu cần giải quyết", subClass: pendingReqs > 0 ? "text-[#7A2F1E]" : "text-gray-400" },
      { label: "Số Ca Trực Tuần", value: totalShifts, icon: Calendar, subText: "Đã phân bổ ca trực", subClass: "text-gray-400" },
    ];

    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#4B3621]">
              Tổng quan vận hành
            </h2>
            <p className="text-xs text-[#7c4831]/80 mt-1">
              Chuỗi: {activeBrand ? activeBrand.name.split(" - ")[0] : "The Moods"} • Chi nhánh: {activeLocation ? (activeLocation.name.split(" - ")[1] || activeLocation.name) : "Toàn hệ thống"}
            </p>
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
                <span className="text-[9px] font-semibold text-[#7c4831]/60">Số liệu</span>
              </div>
              <p className="text-xl  font-bold text-[#4B3621] tracking-tight">{k.value.toLocaleString("vi-VN")}</p>
              <p className="text-xs font-semibold text-[#4B3621] mt-1">{k.label}</p>
              <p className={`text-[9px] font-medium mt-1 ${k.subClass}`}>{k.subText}</p>
            </div>
          ))}
        </div>

        {/* Recent Logs & Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Logs */}
          <div className="card space-y-4 flex flex-col justify-between border border-gray-100">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3.5 text-[#7c4831]">
                <Clock size={14} className="text-[#7c4831]" /> Nhật ký hoạt động
              </h3>
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 mt-3">
                {(logs || []).slice(-8).reverse().map((l: any) => (
                  <div key={l.id} className="p-3 rounded-xl bg-[#FAF9F6] border border-gray-100 text-xs flex gap-3 items-start transition-all hover:bg-white hover:border-gray-200">
                    <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 font-bold text-[9px] ${getAvatarBg(l.staffName)}`}>
                      {getInitials(l.staffName)}
                    </div>
                    <div className="flex-grow font-semibold">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[#4B3621]/90 leading-relaxed text-xs">{l.description}</span>
                        <span className="pill bg-[#FAF3E0] text-[#7c4831] text-[8px] font-semibold shrink-0 border border-[#7c4831]/10">{l.action}</span>
                      </div>
                      <p className="text-[#7c4831]/60 mt-1 text-[9px] font-medium">{l.staffName} • {l.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="card space-y-4 flex flex-col justify-between border border-gray-100">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3.5 text-[#7c4831]">
                <TrendingUp size={14} className="text-[#7c4831]" /> Mật độ giao dịch trong tuần
              </h3>
              <p className="text-xs text-[#4B3621]/80 leading-relaxed mt-2.5">
                Thống kê lượng giao dịch tích điểm của khách hàng tại chi nhánh theo khung giờ trong tuần.
              </p>

              <div className="grid grid-cols-7 gap-2.5 pt-3.5">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => {
                  const intensity = [0.25, 0.5, 0.85, 0.4, 0.65, 1.0, 0.45][i];
                  return (
                    <div key={d} className="text-center">
                      <div
                        className="w-full aspect-square rounded-lg border border-gray-100 transition-all duration-300 hover:scale-105"
                        style={{ background: `rgba(127, 85, 57, ${intensity * 0.9})` }}
                      />
                      <span className="text-[9px] font-semibold text-[#7c4831] mt-2 block">{d}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-end gap-2.5 text-[8px] font-semibold text-[#7c4831]/60 uppercase tracking-widest">
                <span>Thưa thớt</span>
                <div className="w-16 h-1.5 bg-gradient-to-r from-[#FAF9F6] to-[#7c4831] border border-gray-100 rounded-full" />
                <span>Đông đúc</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // === PROMOS ===
  const PromosView = () => (
    <div className="space-y-6 anim-fadeUp text-[#4B3621]">
      <div className="border-b border-gray-200/50 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Khuyến Mãi & Bản Tin</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Tạo các bài viết ưu đãi mới nhất trên thiết bị khách hàng</p>
      </div>

      <form onSubmit={e => { e.preventDefault(); if (!promoTitle) return; addPromotion(promoTitle, promoDesc, promoImg, promoExpiry || undefined); alert("Đăng tải chiến dịch khuyến mãi thành công!"); setPromoTitle(""); setPromoDesc(""); setPromoExpiry(""); }} className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <Plus size={16} className="text-[#7c4831]" /> Tạo Chương Trình Mới
        </h3>
        <div className="space-y-3.5">
          <input type="text" placeholder="Tiêu đề chương trình ưu đãi *" required value={promoTitle} onChange={e => setPromoTitle(e.target.value)} className="input w-full text-sm font-semibold" id="promo-title" />
          <textarea placeholder="Mô tả nội dung chương trình khuyến mãi chi tiết..." value={promoDesc} onChange={e => setPromoDesc(e.target.value)} className="input w-full text-sm resize-none font-semibold" rows={3} id="promo-desc" />
          <input type="url" placeholder="Đường dẫn hình ảnh quảng cáo (URL)" value={promoImg} onChange={e => setPromoImg(e.target.value)} className="input w-full text-sm font-semibold" id="promo-img" />
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#7c4831] uppercase tracking-wider block">Thời hạn bài đăng (Tự động lưu trữ khi hết hạn)</label>
            <input type="date" value={promoExpiry} onChange={e => setPromoExpiry(e.target.value)} className="input w-full text-sm font-semibold" id="promo-expiry" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary py-3 text-xs w-full sm:w-auto"><Megaphone size={14} /> Đăng chiến dịch</button>
      </form>

      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] pl-1">Các ưu đãi đang hiển thị</h3>
        {promotions?.map((p: any) => {
          const isExpired = p.expiryDate && new Date(p.expiryDate) < new Date();
          return (
            <div key={p.id} className="card flex flex-col sm:flex-row items-start justify-between gap-4 border border-gray-100/60 transition-all hover:border-gray-200">
              <div className="flex gap-4 items-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.title} className="w-20 h-20 rounded-2xl object-cover shrink-0 shadow-sm border border-gray-100" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-extrabold uppercase text-[#4B3621]">{p.title}</h4>
                    {p.status === "archived" && <span className="pill pill-amber border text-[8px]">Đã lưu trữ</span>}
                    {isExpired && <span className="pill pill-red border text-[8px]">Hết hạn</span>}
                  </div>
                  <p className="text-xs text-[#4B3621]/80 font-medium leading-relaxed line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Ngày đăng: {p.date}</span>
                    {p.expiryDate && (
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider block">Hạn dùng: {p.expiryDate}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 sm:self-center">
                {p.status !== "archived" && !isExpired && (
                  <button onClick={() => { archivePromotion(p.id); alert("Đã thu hồi bài viết thành công!"); }} className="btn btn-danger py-1.5 px-3 text-[10px] font-bold">Thu hồi</button>
                )}
                <button onClick={() => { if (confirm("Xác nhận xóa vĩnh viễn bài đăng này?")) { deletePromotion(p.id); } }} className="btn btn-ghost py-1.5 px-3 text-[10px] font-bold text-red-600 border-red-200 hover:bg-red-50">Xóa</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // === SCHEDULE ===
  // === SCHEDULE ===
  const SchedView = () => {
    const staffOnly = staffList.filter((s: any) => s.roleId === 3);

    const getStaffSkill = (sIdx: number) => {
      const skills = ["Pha chế", "Phục vụ", "Thu ngân"];
      return skills[sIdx % 3];
    };

    const getStaffColor = (sIdx: number) => {
      const colors = [
        { bg: "bg-[#FFF9E6] border-[#F3D9A2] text-[#7C5A14]", bar: "bg-[#E6A23C]" },
        { bg: "bg-[#EBF8F2] border-[#A3E2C9] text-[#1D6F4E]", bar: "bg-[#2ECC71]" },
        { bg: "bg-[#ECF5FF] border-[#B3D8FF] text-[#1A569A]", bar: "bg-[#409EFF]" },
        { bg: "bg-[#FFF0F2] border-[#FFC2CC] text-[#B81D33]", bar: "bg-[#FF4949]" },
        { bg: "bg-[#F3E8FF] border-[#D8B4FE] text-[#6B21A8]", bar: "bg-[#A855F7]" },
        { bg: "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]", bar: "bg-[#22C55E]" },
        { bg: "bg-[#E0F7FA] border-[#B2EBF2] text-[#006064]", bar: "bg-[#00BCD4]" }
      ];
      return colors[sIdx % colors.length];
    };

    const devAvailsList = availabilitiesList;
    const devOfficialSchedsList = officialSchedulesList.map((s: any) => {
      if (s.staffName) return s;
      const staff = staffOnly.find((st: any) => st.id === s.userId);
      return {
        ...s,
        staffName: staff ? staff.fullName : (s.user?.fullName || "Nhân viên")
      };
    });

    const handleQuickAssign = async (userId: string, date: string, startTime: string, endTime: string) => {
      try {
        const body = {
          userId,
          date,
          startTime,
          endTime,
          locationId: activeLocation?.id || "govap-branch"
        };
        const res = await fetch(`${getApiBaseUrl()}/api/attendance/schedules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if (res.ok) {
          alert("Xếp ca nhanh thành công!");
          fetchOfficialSchedules();
        } else {
          alert("Lỗi khi xếp ca nhanh!");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi mạng!");
      }
    };

    // States for REDESIGN




    // States for Cell Editing




    const getMondayOfCurrentWeek = () => {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(today.setDate(diff));
    };

    const getWeekDays = (offset: number) => {
      const monday = getMondayOfCurrentWeek();
      monday.setDate(monday.getDate() + offset * 7);
      const days = [];
      const labels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        days.push({
          dateStr,
          label: labels[i],
          dayNum: `${dd}/${mm}`
        });
      }
      return days;
    };

    const weekDays = getWeekDays(weekOffset);

    // Helper: Parse time string to float
    const parseTime = (t: string) => {
      if (!t) return 0;
      const parts = t.split(":");
      return parseFloat(parts[0]) + (parts[1] ? parseFloat(parts[1]) / 60 : 0);
    };

    // Helper: Get shift status color and description
    const getShiftStatus = (userId: string, date: string, sched: any) => {
      if (!sched) return { color: "gray", text: "OFF", label: "OFF", icon: "✓" };

      const avails = devAvailsList.filter((a: any) => a.userId === userId && a.date === date);
      if (avails.length === 0) {
        return { color: "red", text: "Ngoài thời gian đăng ký (Chưa đăng ký ca rảnh)", label: "Đỏ (Sai đăng ký)", icon: "⚠" };
      }

      const sStart = parseTime(sched.startTime);
      let sEnd = parseTime(sched.endTime);
      if (sEnd < sStart) sEnd += 24;

      for (const a of avails) {
        const aStart = parseTime(a.startTime);
        let aEnd = parseTime(a.endTime);
        if (aEnd < aStart) aEnd += 24;

        // Exact match
        if (Math.abs(sStart - aStart) < 0.05 && Math.abs(sEnd - aEnd) < 0.05) {
          return { color: "green", text: "Đúng với thời gian đăng ký", label: "Xanh (Khớp 100%)", icon: "✓" };
        }
        // Partial overlap / changed shift
        if (sStart >= aStart && sEnd <= aEnd) {
          return { color: "yellow", text: "Ca đã được thay đổi/thu nhỏ so với đăng ký", label: "Vàng (Thay đổi)", icon: "✎" };
        }
      }

      return { color: "red", text: "Xếp vào thời gian không đăng ký", label: "Đỏ (Sai đăng ký)", icon: "⚠" };
    };

    // KPI Calculations
    const weekScheds = devOfficialSchedsList.filter((s: any) => s.date >= weekDays[0].dateStr && s.date <= weekDays[6].dateStr);
    const totalStaff = staffOnly.length;
    const totalShifts = weekScheds.length;

    let greenShiftsCount = 0;
    let yellowShiftsCount = 0;
    let redShiftsCount = 0;

    weekScheds.forEach((sched: any) => {
      const status = getShiftStatus(sched.userId, sched.date, sched);
      if (status.color === "green") greenShiftsCount++;
      else if (status.color === "yellow") yellowShiftsCount++;
      else if (status.color === "red") redShiftsCount++;
    });

    // Handle Quick Save from Cell Dialog
    const handleQuickSaveCell = async () => {
      if (!editingCell) return;
      try {
        const { userId, date } = editingCell;

        // Find existing schedule for this user on this date
        const existing = weekScheds.find((s: any) => s.userId === userId && s.date === date);

        if (cellIsOff) {
          // If marked OFF, delete existing schedule
          if (existing) {
            const res = await fetch(`${getApiBaseUrl()}/api/attendance/schedules/${existing.id}`, { method: "DELETE" });
            if (res.ok) {
              alert("Đã cập nhật: OFF");
              fetchOfficialSchedules();
            } else {
              alert("Lỗi khi cập nhật OFF!");
            }
          } else {
            alert("Đã là ca OFF");
          }
        } else {
          // Save / Update schedule
          const body = {
            userId,
            date,
            startTime: cellStartTime,
            endTime: cellEndTime,
            locationId: activeLocation?.id || "govap-branch"
          };

          const url = existing
            ? `${getApiBaseUrl()}/api/attendance/schedules/${existing.id}`
            : `${getApiBaseUrl()}/api/attendance/schedules`;

          const method = existing ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });

          if (res.ok) {
            alert("Lưu ca làm việc thành công!");
            fetchOfficialSchedules();
          } else {
            alert("Lỗi khi lưu ca làm việc!");
          }
        }
        setEditingCell(null);
      } catch (err) {
        console.error(err);
        alert("Lỗi mạng khi lưu!");
      }
    };

    // Preset options for quick register/matrix setup
    const presetOptions = [
      { value: "OFF", label: "OFF" },
      { value: "06:00-14:00", label: "Sáng (06-14)" },
      { value: "07:00-14:00", label: "Sáng (07-14)" },
      { value: "14:00-23:00", label: "Chiều (14-23)" },
      { value: "17:00-23:00", label: "Tối (17-23)" },
      { value: "23:00-07:00", label: "Khuya (23-07)" }
    ];

    // Handle Quick Avail registration
    const handleQuickAvailChange = async (userId: string, date: string, value: string) => {
      try {
        // Find existing availability
        const existing = devAvailsList.find((a: any) => a.userId === userId && a.date === date);

        if (value === "OFF") {
          if (existing) {
            const res = await fetch(`${getApiBaseUrl()}/api/attendance/availability/${existing.id}`, { method: "DELETE" });
            if (res.ok) fetchAvailabilities();
          }
        } else {
          const [start, end] = value.split("-");
          const body = {
            userId,
            date,
            startTime: start,
            endTime: end,
            locationId: activeLocation?.id || "govap-branch"
          };
          const url = existing
            ? `${getApiBaseUrl()}/api/attendance/availability/${existing.id}`
            : `${getApiBaseUrl()}/api/attendance/availability`;
          const method = existing ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
          });
          if (res.ok) fetchAvailabilities();
        }
      } catch (err) {
        console.error(err);
      }
    };

    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/50 pb-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">QUẢN LÝ LỊCH CA</h2>
            <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">
              Tuần {weekDays[0].dayNum} – {weekDays[6].dayNum} ({weekDays[0].dateStr.split('-')[0]})
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Week offsets */}
            <div className="flex gap-1 bg-[#FAF9F6] border border-gray-150 p-1 rounded-2xl">
              <button onClick={() => setWeekOffset(weekOffset - 1)} className="py-1.5 px-3 rounded-xl text-xs font-bold text-[#4B3621] hover:bg-[#7c4831]/5">Tuần trước</button>
              <button onClick={() => setWeekOffset(0)} className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${weekOffset === 0 ? "bg-[#7c4831] text-white shadow-xs" : "text-[#4B3621] hover:bg-[#7c4831]/5"}`}>Tuần này</button>
              <button onClick={() => setWeekOffset(weekOffset + 1)} className="py-1.5 px-3 rounded-xl text-xs font-bold text-[#4B3621] hover:bg-[#7c4831]/5">Tuần sau</button>
            </div>

            {/* Registration Gate Status */}
            <div className="flex items-center gap-2 bg-[#FAF9F6] border border-gray-150 py-1.5 px-3 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-[#7c4831] uppercase">Cổng đăng ký:</span>
              <button
                onClick={handleToggleRegGate}
                type="button"
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!isRegGateLocked ? 'bg-emerald-600' : 'bg-gray-250'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${!isRegGateLocked ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className={`text-[10px] font-black uppercase ${!isRegGateLocked ? "text-emerald-700" : "text-gray-400"}`}>
                {!isRegGateLocked ? "ĐANG MỞ" : "ĐÃ KHÓA"}
              </span>
            </div>

            {/* Standard actions */}


            <button
              onClick={() => window.open(`${getApiBaseUrl()}/api/attendance/schedules/export?locationId=${activeLocation?.id || "govap-branch"}&weekOffset=${weekOffset}`, "_blank")}
              className="btn btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* SUB-TABS (Segmented Control style) */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 bg-[#FAF9F6] border border-gray-200 p-1 rounded-2xl max-w-lg shadow-xs">
            <button
              onClick={() => { setDevTab("matrix"); setSelectedDayDetail(null); }}
              className={`py-1.5 px-4 text-xs font-extrabold uppercase rounded-xl transition-all ${devTab === "matrix" && !selectedDayDetail ? "bg-white text-[#7c4831] shadow-xs" : "text-[#7c4831]/60 hover:bg-white/30 hover:text-[#7c4831]"}`}
            >
              Bảng phân ca chính (Matrix)
            </button>
            <button
              onClick={() => { setDevTab("avail_matrix"); setSelectedDayDetail(null); }}
              className={`py-1.5 px-4 text-xs font-extrabold uppercase rounded-xl transition-all ${devTab === "avail_matrix" ? "bg-white text-[#7c4831] shadow-xs" : "text-[#7c4831]/60 hover:bg-white/30 hover:text-[#7c4831]"}`}
            >
              Bảng đăng ký ca rảnh
            </button>
          </div>
          {selectedDayDetail && (
            <div className="bg-amber-50 border border-amber-250 py-1.5 px-4 text-xs font-extrabold text-[#7c4831] uppercase rounded-2xl shadow-xs">
              Chi tiết ngày: {selectedDayDetail.split('-').reverse().join('/')}
            </div>
          )}
        </div>

        {/* KPI CARDS */}
        {devTab === "matrix" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="card p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Tổng nhân viên</span>
              <span className="text-xl font-black mt-1 text-[#4B3621]">{totalStaff} người</span>
            </div>
            <div className="card p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Tổng số ca tuần</span>
              <span className="text-xl font-black mt-1 text-[#4B3621]">{totalShifts} ca</span>
            </div>
            <div className="card p-3 bg-emerald-50/55 border border-emerald-150 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">Ca khớp 100% (Xanh)</span>
              <span className="text-xl font-black mt-1 text-emerald-800">{greenShiftsCount} ca</span>
            </div>
            <div className="card p-3 bg-amber-50/55 border border-amber-150 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider">Ca thay đổi (Vàng)</span>
              <span className="text-xl font-black mt-1 text-amber-800">{yellowShiftsCount} ca</span>
            </div>
            <div className="card p-3 bg-rose-50/55 border border-rose-150 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-rose-700 tracking-wider">Sai đăng ký (Đỏ)</span>
              <span className="text-xl font-black mt-1 text-rose-800">{redShiftsCount} ca</span>
            </div>
          </div>
        )}

        {/* MAIN MATRIX TAB */}
        {/* Legend guide (Top version) */}
        {devTab === "matrix" && (
          <div className="card p-3.5 bg-[#FAF9F6] border border-gray-150 rounded-2xl flex flex-wrap justify-center gap-6 text-[9px] md:text-[10px] font-extrabold uppercase text-[#7c4831]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-250 inline-block" />
              <span>Khớp 100% đăng ký</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-250 inline-block" />
              <span>Lệch khung giờ đăng ký</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-100 border border-rose-250 inline-block" />
              <span>Không đăng ký rảnh (Bận/Chưa đăng ký)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-blue-50 border border-dashed border-blue-200 inline-block" />
              <span>OFF (Có đăng ký rảnh)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-gray-100 border border-gray-250 inline-block" />
              <span>OFF (Không đăng ký rảnh)</span>
            </div>
          </div>
        )}

        {devTab === "matrix" && (
          <div className="card p-0 overflow-hidden border border-gray-200 shadow-md bg-white w-full">
            <div className="overflow-x-auto w-full touch-pan-x" style={{ WebkitOverflowScrolling: "touch" }}>
              <table className="w-full min-w-[1000px] text-center border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-gray-200 text-[#7c4831] text-[10px] font-black uppercase tracking-wider">
                    <th className="p-3 text-left w-[15%]">Nhân viên</th>
                    {weekDays.map(day => (
                      <th
                        key={day.dateStr}
                        onClick={() => setSelectedDayDetail(day.dateStr)}
                        className="p-1.5 md:p-2.5 border-l border-gray-250/70 hover:bg-[#7c4831]/5 cursor-pointer transition-colors"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] md:text-[10px]">{day.label}</span>
                          <span className="text-gray-400 text-[8px] md:text-[9px] font-bold mt-0.5">{day.dayNum}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 text-[11px] font-bold text-[#4B3621]">
                  {staffOnly.map((staff: any) => (
                    <tr key={staff.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="p-3 text-left bg-stone-50/30 w-[110px] min-w-[110px] whitespace-nowrap">
                        <div className="font-extrabold uppercase">{staff.fullName}</div>
                        <div className="text-[9px] text-gray-400 font-semibold mt-0.5">{staff.phoneNumber}</div>
                      </td>
                      {weekDays.map(day => {
                        const sched = weekScheds.find((s: any) => s.userId === staff.id && s.date === day.dateStr);
                        const status = getShiftStatus(staff.id, day.dateStr, sched);
                        const avails = devAvailsList.filter((a: any) => a.userId === staff.id && a.date === day.dateStr);
                        const hasAvail = avails.length > 0;
                        const crossesMidnight = sched && parseTime(sched.endTime) < parseTime(sched.startTime);

                        const isLeaveApproved = (requests || []).some((r: any) => r.type === "leave" && r.targetShiftId === sched?.id && r.status === "approved");
                        let cellClass = "bg-stone-100 text-stone-400 border-stone-200";
                        if (sched) {
                          if (isLeaveApproved) cellClass = "bg-stone-200/60 text-stone-500 border-stone-300 border-dashed hover:bg-stone-300/60";
                          else if (status.color === "green") cellClass = "bg-emerald-100 text-emerald-950 border-emerald-350 hover:bg-emerald-200/70";
                          else if (status.color === "yellow") cellClass = "bg-amber-100 text-amber-950 border-amber-350 hover:bg-amber-200/70";
                          else if (status.color === "red") cellClass = "bg-rose-100 text-rose-950 border-rose-350 hover:bg-rose-200/70";
                        } else if (hasAvail) {
                          cellClass = "bg-[#E6F4FE] text-blue-900 border-2 border-dashed border-[#60A5FA] hover:bg-[#D4ECFC]";
                        }

                        return (
                          <td
                            key={day.dateStr}
                            onClick={() => {
                              setEditingCell({
                                userId: staff.id,
                                userName: staff.fullName,
                                date: day.dateStr,
                                dateLabel: `${day.label} (${day.dayNum})`
                              });
                              if (sched) {
                                setCellIsOff(false);
                                setCellStartTime(sched.startTime);
                                setCellEndTime(sched.endTime);
                              } else {
                                setCellIsOff(true);
                                if (avails && avails.length > 0) {
                                  setCellStartTime(avails[0].startTime);
                                  setCellEndTime(avails[0].endTime);
                                } else {
                                  setCellStartTime("08:00");
                                  setCellEndTime("16:00");
                                }
                              }
                            }}
                            className={`p-3.5 border-l border-gray-150 cursor-pointer transition-all duration-150 select-none touch-pan-x`}
                          >
                            <div className={`mx-auto max-w-[105px] py-1.5 px-2 rounded-xl border text-[10px] font-black uppercase text-center space-y-1.5 tracking-wide shadow-xs pointer-events-none ${cellClass}`}>
                              {sched ? (
                                <div>
{isLeaveApproved ? (
                                    <div className="text-[7.5px] font-black tracking-tight mb-1 text-rose-800">🚨 XIN VẮNG</div>
                                  ) : (
                                    <div className={`text-[7.5px] font-black tracking-tight mb-1 ${
                                      status.color === "green" ? "text-emerald-800" :
                                      status.color === "yellow" ? "text-amber-800" :
                                      "text-rose-800"
                                    }`}>
                                      {status.color === "green" ? "🟢 ĐÃ CHỐT" :
                                       status.color === "yellow" ? "🟡 LỆCH GIỜ" :
                                       "🔴 SAI LỊCH"}
                                    </div>
                                  )}
{isLeaveApproved ? (
                                    <>
                                      <div className="line-through text-stone-400">{sched.startTime}</div>
                                      <div className="text-[8px] font-semibold text-stone-400 my-0.5">đến</div>
                                      <div className="line-through text-stone-400">{sched.endTime}{crossesMidnight ? " (Hôm sau)" : ""}</div>
                                    </>
                                  ) : (
                                    <>
                                      <div>{sched.startTime}</div>
                                      <div className="text-[8px] font-semibold text-stone-500/80 my-0.5">đến</div>
                                      <div>{sched.endTime}{crossesMidnight ? " (Hôm sau)" : ""}</div>
                                    </>
                                  )}
                                </div>
                              ) : hasAvail ? (
                                <>
                                  <div className="text-blue-900 font-black tracking-wide">RẢNH</div>
                                  <div className="text-[8px] font-extrabold text-blue-800 tracking-tight mt-1.5 leading-normal">
                                    Rảnh: {avails.map((a: any) => parseTime(a.endTime) < parseTime(a.startTime) ? `${a.startTime}-${a.endTime} (Hôm sau)` : `${a.startTime}-${a.endTime}`).join(', ')}
                                  </div>
                                </>
                              ) : (
                                <div className="py-2.5 font-bold tracking-widest opacity-60">OFF</div>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>


          </div>
        )}

        {/* STAFF AVAILS REGISTRY MATRIX */}
        {devTab === "avail_matrix" && !selectedDayDetail && (() => {
          const shiftCategories = [
            { key: "sang", title: "Sáng", hours: "06:00 - 12:00", startHour: 6, filter: (t: string) => parseTime(t) >= 6 && parseTime(t) < 12 },
            { key: "chieu", title: "Chiều", hours: "12:00 - 18:00", startHour: 12, filter: (t: string) => parseTime(t) >= 12 && parseTime(t) < 18 },
            { key: "toi", title: "Tối", hours: "18:00 - 00:00", startHour: 18, filter: (t: string) => parseTime(t) >= 18 && parseTime(t) <= 24 && parseTime(t) != 0 },
            { key: "khuya", title: "Khuya", hours: "00:00 - 06:00", startHour: 0, filter: (t: string) => parseTime(t) >= 0 && parseTime(t) < 6 }
          ];

          return (
            <div className="card p-0 overflow-hidden border border-gray-200 shadow-md bg-white w-full">
              <div className="p-3 border-b border-gray-150 bg-[#FAF9F6] flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#7c4831]">Bảng Đăng Ký Khung Giờ Rảnh</h3>
                  <p className="text-[9px] text-[#7c4831]/60 font-semibold mt-0.5">Sắp xếp trực quan theo ca làm việc của từng nhân sự</p>
                </div>
              </div>

              <div className="overflow-x-auto w-full touch-pan-x" style={{ WebkitOverflowScrolling: "touch" }}>
                <table className="w-full min-w-[1000px] text-center border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-gray-150 text-[#7c4831] text-[10px] font-black uppercase tracking-wider">
                      <th className="p-3 text-left w-[110px] min-w-[110px] whitespace-nowrap">Buổi ca</th>
                      {weekDays.map(day => (
                        <th key={day.dateStr} className="p-1.5 md:p-2.5 border-l border-gray-200">
                          <div className="text-[9px] md:text-[10px]">{day.label}</div>
                          <div className="text-gray-400 text-[8px] md:text-[9px] font-bold mt-0.5">{day.dayNum}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-[11px] font-bold text-[#4B3621]">
                    {shiftCategories.map(cat => (
                      <tr key={cat.key} className="hover:bg-stone-50/30 transition-colors">
                        <td className="p-3 text-left bg-stone-50/30 w-[110px] min-w-[110px] whitespace-nowrap">
                          <div className="font-extrabold text-xs uppercase text-[#7c4831]">{cat.title}</div>
                          <div className="text-[9px] text-gray-400 font-semibold mt-0.5">{cat.hours}</div>
                        </td>
                        {weekDays.map(day => {
                          const avails = devAvailsList.filter((a: any) => a.date === day.dateStr && cat.filter(a.startTime)).filter((v: any, i: number, arr: any[]) => arr.findIndex(t => t.id === v.id) === i);

                          return (
                            <td key={day.dateStr} className="p-2 border-l border-gray-150 align-top text-left min-w-[125px]">
                              <div className="space-y-2 min-h-[95px] flex flex-col justify-start">
                                {avails.length === 0 ? (
                                  <div className="py-7 px-1 text-center border border-dashed border-gray-200 rounded-2xl text-[8.5px] text-gray-400 font-extrabold uppercase select-none flex-grow flex items-center justify-center">
                                    Trống
                                  </div>
                                ) : (
                                  avails.map((avail: any) => {
                                    const sIdx = staffOnly.findIndex((s: any) => s.id === avail.userId);
                                    if (sIdx === -1) return null;
                                    const s = staffOnly[sIdx];
                                    const skill = getStaffSkill(sIdx);
                                    const col = getStaffColor(sIdx);
                                    const crossesMidnight = parseTime(avail.endTime) < parseTime(avail.startTime);
                                    
                                    // Check if this candidate is scheduled on this day
                                    const dayScheds = devOfficialSchedsList.filter((sc: any) => sc.userId === avail.userId && sc.date === day.dateStr);
                                    const currentSched = dayScheds.find((sc: any) => {
                                      let ss = parseTime(sc.startTime);
                                      let se = parseTime(sc.endTime);
                                      if (se < ss) se += 24;
                                      let as = parseTime(avail.startTime);
                                      let ae = parseTime(avail.endTime);
                                      if (ae < as) ae += 24;
                                      return ss >= as && se <= ae;
                                    });

                                    return (
                                      <div key={avail.id} className={`p-2.5 rounded-2xl border ${col.bg} space-y-2 shadow-xs transition-transform duration-100 hover:scale-[1.02] touch-pan-x pointer-events-none`}>
                                        <div className="font-extrabold uppercase text-[9.5px] tracking-tight truncate flex items-center gap-1">
                                          <span>{skill === "Pha chế" ? "☕" : skill === "Phục vụ" ? "🛎" : "💵"}</span>
                                          <span>{s.fullName} [{skill}]</span>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-[8px] font-black opacity-85">
                                            {avail.startTime} - {avail.endTime}{crossesMidnight ? " (Hôm sau)" : ""}
                                          </div>
                                        </div>
                                        
                                        {/* Scheduling status badge */}
                                        {currentSched ? (
                                          (() => {
                                            const isLeaveApprovedForColleague = (requests || []).some((r: any) => r.type === "leave" && r.targetShiftId === currentSched?.id && r.status === "approved");
                                            if (isLeaveApprovedForColleague) {
                                              return (
                                                <div className="text-[7.5px] font-black uppercase text-rose-800 bg-rose-50/90 px-1.5 py-0.5 rounded-md border border-rose-250 w-fit">
                                                  🚨 XIN VẮNG
                                                </div>
                                              );
                                            }
                                            return (
                                              <div className="text-[7.5px] font-black uppercase text-emerald-800 bg-emerald-50/90 px-1.5 py-0.5 rounded-md border border-emerald-250 w-fit">
                                                🟢 Đã chốt: {currentSched.startTime}-{currentSched.endTime}{parseTime(currentSched.endTime) < parseTime(currentSched.startTime) ? " (Hôm sau)" : ""}
                                              </div>
                                            );
                                          })()
                                        ) : (
                                          <div className="text-[7.5px] font-black uppercase text-gray-500 bg-stone-50/90 px-1.5 py-0.5 rounded-md border border-stone-200 w-fit">
                                            ⚪ Chưa chốt
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* DAILY DETAIL VIEW */}
        {devTab === "matrix" && selectedDayDetail && (
          <div className="space-y-4 anim-fadeUp mt-6 border-t-2 border-dashed border-[#7c4831]/20 pt-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDayDetail(null)}
                  className="px-3 py-1.5 rounded-xl border border-gray-250 bg-[#FAF9F6] text-xs font-black uppercase text-[#7c4831] hover:bg-gray-100"
                >
                  ← Quay lại
                </button>
                <h3 className="text-lg font-black uppercase text-[#7c4831]">
                  CHI TIẾT PHÂN CA NGÀY {selectedDayDetail.split('-').reverse().join('/')}
                </h3>
              </div>
            </div>

            {(() => {
              const dayScheds = weekScheds.filter((s: any) => s.date === selectedDayDetail);

              // Helper categorizer
              const categorizeShift = (startTime: string) => {
                const hour = parseTime(startTime);
                if (hour >= 5 && hour < 14) return "SÁNG (05:00 - 14:00)";
                if (hour >= 14 && hour < 22) return "CHIỀU (14:00 - 22:00)";
                return "KHUYA (22:00 - 05:00)";
              };

              const categories = [
                { title: "SÁNG (06:00 - 12:00)", filter: (t: string) => parseTime(t) >= 6 && parseTime(t) < 12 },
                { title: "CHIỀU (12:00 - 18:00)", filter: (t: string) => parseTime(t) >= 12 && parseTime(t) < 18 },
                { title: "TỐI (18:00 - 00:00)", filter: (t: string) => parseTime(t) >= 18 && parseTime(t) <= 24 && parseTime(t) != 0 },
                { title: "KHUYA (00:00 - 06:00)", filter: (t: string) => parseTime(t) >= 0 && parseTime(t) < 6 }
              ];

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {categories.map(cat => {
                    const scheds = dayScheds.filter((s: any) => cat.filter(s.startTime));
                    const currentCount = scheds.length;
                    const requiredCount = 3; // Target default required staff per shift
                    const diff = currentCount - requiredCount;

                    // Find staff who registered free time for this day that overlaps with the shift hours,
                    // but are not currently scheduled in this shift.
                    const availableCandidates = staffOnly.filter((s: any) => {
                      const isScheduled = scheds.some((sc: any) => sc.userId === s.id);
                      if (isScheduled) return false;

                      const avails = devAvailsList.filter((a: any) => a.userId === s.id && a.date === selectedDayDetail);
                      if (avails.length === 0) return false;

                      return avails.some((a: any) => cat.filter(a.startTime));
                    });

                    const prefixId = cat.title.split(' ')[0]; // SANG, CHIEU, KHUYA, TOI
                    const defaultStart = cat.title.includes("SÁNG") ? "06:00" : cat.title.includes("CHIỀU") ? "12:00" : cat.title.includes("TỐI") ? "18:00" : "00:00";
                    const defaultEnd = cat.title.includes("SÁNG") ? "12:00" : cat.title.includes("CHIỀU") ? "18:00" : cat.title.includes("TỐI") ? "00:00" : "06:00";

                    return (
                      <div key={cat.title} className="card border border-[#7c4831]/15 bg-[#FAF9F6] space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="border-b border-[#7c4831]/10 pb-2 flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[#7c4831]">{cat.title}</h4>
                            <span className={`pill text-[8px] font-black uppercase border ${diff >= 0 ? "bg-emerald-50 text-emerald-800 border-emerald-150" : "bg-rose-50 text-rose-800 border-rose-150"}`}>
                              {currentCount} / {requiredCount} Nhân viên
                            </span>
                          </div>

                          <div className="space-y-2">
                            {scheds.length === 0 ? (
                              <p className="text-[10px] text-gray-400 italic">Chưa xếp nhân sự nào ca này.</p>
                            ) : (
                              scheds.map((s: any) => (
                                <div key={s.id} className="flex justify-between items-center p-2.5 bg-white border border-gray-150 rounded-xl shadow-xs">
                                  <span className="font-extrabold uppercase text-xs">{s.staffName}</span>
                                  <span className="text-[10px] text-gray-500 font-semibold">{s.startTime} - {s.endTime}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="space-y-3.5 pt-3 border-t border-gray-150/60 mt-auto">
                          {/* Candidates list for quick assign */}
                          {availableCandidates.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[9px] font-black uppercase text-[#7c4831] tracking-wider block">Nhân sự rảnh khả dụng ({availableCandidates.length}):</span>
                              <div className="flex flex-wrap gap-1">
                                {availableCandidates.map((cand: any) => {
                                  const candAvail = devAvailsList.find((a: any) => a.userId === cand.id && a.date === selectedDayDetail && cat.filter(a.startTime));
                                  const timeRangeStr = candAvail ? `${candAvail.startTime}-${candAvail.endTime}` : "";
                                  return (
                                    <button
                                      key={cand.id}
                                      onClick={() => handleQuickAssign(cand.id, selectedDayDetail, candAvail?.startTime || defaultStart, candAvail?.endTime || defaultEnd)}
                                      className="bg-emerald-55/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1 transition-all cursor-pointer"
                                      title="Click xếp ca nhanh"
                                    >
                                      + {cand.fullName} ({timeRangeStr})
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Custom Assign Form inline */}
                          <div className="bg-[#FAF9F6] border border-gray-200 p-2.5 rounded-2xl space-y-2">
                            <span className="text-[9px] font-black uppercase text-[#7c4831] tracking-wider block">Xếp ca tùy chỉnh:</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <select
                                id={`assign-staff-${prefixId}`}
                                className="select text-[9.5px] font-bold py-1 px-1.5 border border-gray-250 bg-white rounded-lg col-span-2"
                                defaultValue=""
                              >
                                <option value="">-- Chọn nhân sự --</option>
                                {staffOnly.map((s: any) => (
                                  <option key={s.id} value={s.id}>{s.fullName}</option>
                                ))}
                              </select>

                              <div className="space-y-0.5">
                                <span className="text-[8px] font-bold text-gray-400 block">Bắt đầu:</span>
                                <input
                                  type="time"
                                  id={`assign-start-${prefixId}`}
                                  defaultValue={defaultStart}
                                  className="input text-[9.5px] font-semibold py-1 px-1.5 border border-gray-250 bg-white rounded-lg w-full"
                                />
                              </div>

                              <div className="space-y-0.5">
                                <span className="text-[8px] font-bold text-gray-400 block">Kết thúc:</span>
                                <input
                                  type="time"
                                  id={`assign-end-${prefixId}`}
                                  defaultValue={defaultEnd}
                                  className="input text-[9.5px] font-semibold py-1 px-1.5 border border-gray-250 bg-white rounded-lg w-full"
                                />
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const staffSelect = document.getElementById(`assign-staff-${prefixId}`) as HTMLSelectElement;
                                const startInput = document.getElementById(`assign-start-${prefixId}`) as HTMLInputElement;
                                const endInput = document.getElementById(`assign-end-${prefixId}`) as HTMLInputElement;
                                if (staffSelect && staffSelect.value) {
                                  handleQuickAssign(staffSelect.value, selectedDayDetail, startInput.value, endInput.value);
                                  staffSelect.value = "";
                                } else {
                                  alert("Vui lòng chọn nhân sự!");
                                }
                              }}
                              className="btn btn-primary w-full py-1.5 text-[9px] font-extrabold uppercase tracking-wide cursor-pointer"
                            >
                              Xếp Ca Tùy Chọn
                            </button>
                          </div>

                          <div>
                            {diff < 0 ? (
                              <div className="p-2 bg-rose-50/55 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-bold">
                                ⚠️ Thiếu {Math.abs(diff)} nhân sự ca này!
                              </div>
                            ) : (
                              <div className="p-2 bg-emerald-50/55 border border-emerald-250 text-emerald-700 rounded-xl text-[10px] font-bold">
                                ✅ Đủ chỉ tiêu nhân sự.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* CELL QUICK EDIT MODAL */}
        {editingCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4B3621]/45 backdrop-blur-xs">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-100 anim-scaleIn space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#7c4831] flex items-center gap-1.5">
                  <Calendar size={16} /> Chi Tiết Phân Ca
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="text-gray-450 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5 text-xs text-[#4B3621] font-semibold">
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Nhân viên:</span>
                  <span className="text-sm font-extrabold uppercase text-[#7c4831]">{editingCell.userName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Ngày trực:</span>
                  <span>{editingCell.dateLabel}</span>
                </div>

                {/* Registered Availability Info */}
                <div className="p-3 bg-[#FAF9F6] border border-gray-150 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-[#7c4831] tracking-wider block">Giờ đăng ký rảnh:</span>
                  {(() => {
                    const avails = devAvailsList.filter((a: any) => a.userId === editingCell.userId && a.date === editingCell.date);
                    if (avails.length === 0) {
                      return <span className="text-rose-600 font-bold uppercase text-[10px]">❌ Không đăng ký ca rảnh ngày này</span>;
                    }
                    return (
                      <div className="space-y-2 mt-1">
                        {avails.map((a: any) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setCellIsOff(false);
                              setCellStartTime(a.startTime);
                              setCellEndTime(a.endTime);
                            }}
                            className="w-full text-left p-2 rounded-xl border border-emerald-350 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-[10.5px] font-black uppercase flex items-center justify-between cursor-pointer transition-colors"
                          >
                            <span>✓ {a.startTime} – {a.endTime}</span>
                            <span className="text-[8px] bg-emerald-700 text-white py-0.5 px-1.5 rounded-md">Chọn nhanh</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Form controls */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Ca được xếp:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="cellStatus"
                        checked={cellIsOff}
                        onChange={() => setCellIsOff(true)}
                        className="text-[#7c4831] focus:ring-[#7c4831]"
                      />
                      <span>Nghỉ (OFF)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="cellStatus"
                        checked={!cellIsOff}
                        onChange={() => setCellIsOff(false)}
                        className="text-[#7c4831] focus:ring-[#7c4831]"
                      />
                      <span>Có Đi Làm</span>
                    </label>
                  </div>
                </div>

                {!cellIsOff && (
                  <div className="grid grid-cols-2 gap-3 anim-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Giờ bắt đầu:</label>
                      <input
                        type="time"
                        value={cellStartTime}
                        onChange={e => setCellStartTime(e.target.value)}
                        className="input w-full text-xs font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Giờ kết thúc:</label>
                      <input
                        type="time"
                        value={cellEndTime}
                        onChange={e => setCellEndTime(e.target.value)}
                        className="input w-full text-xs font-semibold bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={handleQuickSaveCell}
                  className="btn btn-primary flex-grow text-xs py-2.5 font-bold"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="btn btn-ghost text-xs py-2.5 font-bold px-4 border-gray-200"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };;
  // === PAYROLL ===
  const PayrollView = () => {
    const exportPayrollToExcel = () => {
      window.open(`${getApiBaseUrl()}/api/attendance/payroll/export?locationId=${activeLocation?.id || "govap-branch"}&fromDate=${payrollFromDate}&toDate=${payrollToDate}`, "_blank");
    };

    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/50 pb-4">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Tính Lương Nhân Sự</h2>
            <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Tính toán tự động tiền lương, thưởng/phạt đi trễ của nhân viên chi nhánh</p>
          </div>
          <button
            onClick={exportPayrollToExcel}
            disabled={payrollList.length === 0}
            type="button"
            className="btn btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} />
            <span>Xuất Báo Cáo Bảng Lương (Excel)</span>
          </button>
        </div>

        {/* Date Selector Form */}
        <div className="card space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Chọn thời gian</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Từ ngày:</label>
              <input
                type="date"
                value={payrollFromDate}
                onChange={e => setPayrollFromDate(e.target.value)}
                className="input text-xs font-semibold w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Đến ngày:</label>
              <input
                type="date"
                value={payrollToDate}
                onChange={e => setPayrollToDate(e.target.value)}
                className="input text-xs font-semibold w-36"
              />
            </div>
            <button
              onClick={fetchPayrollData}
              disabled={payrollLoading}
              type="button"
              className="btn btn-primary text-xs py-2 px-4 h-9 flex items-center gap-1.5"
            >
              {payrollLoading ? <RefreshCw size={13} className="animate-spin" /> : "Tính Lương"}
            </button>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="card p-0 overflow-hidden border border-gray-150 shadow-sm bg-white">
          <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Bảng lương chi nhánh</span>
            <span className="text-[10px] font-semibold text-gray-500 ">Đơn vị: VNĐ</span>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-max text-left text-xs border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                  <th className="px-6 py-4">Tên</th>
                  <th className="px-6 py-4">Số điện thoại</th>
                  <th className="px-6 py-4 text-right">Lương/giờ</th>
                  <th className="px-6 py-4 text-right">Giờ làm</th>
                  <th className="px-6 py-4 text-right">Lương cơ bản</th>
                  <th className="px-6 py-4 text-right">Thưởng</th>
                  <th className="px-6 py-4 text-right">Phạt</th>
                  <th className="px-6 py-4 text-right">Tạm ứng</th>
                  <th className="px-6 py-4 text-right font-black text-[#7c4831]">Thực nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                {payrollList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400 italic">Không có dữ liệu tính lương trong khoảng thời gian này. Bấm nút "Tính Lương" để tải dữ liệu.</td>
                  </tr>
                ) : (
                  payrollList.map((p: any) => (
                    <tr key={p.userId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 uppercase tracking-tight font-black">{p.fullName}</td>
                      <td className="p-4  font-medium text-gray-500">{p.phoneNumber}</td>
                      <td className="p-4 text-right ">{p.hourlyWage?.toLocaleString("vi-VN")}đ</td>
                      <td className="p-4 text-right ">{p.totalWorkedHours}h</td>
                      <td className="p-4 text-right ">{p.baseSalary?.toLocaleString("vi-VN")}đ</td>
                      <td className="p-4 text-right  text-emerald-600">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>+{p.totalBonus?.toLocaleString("vi-VN")}đ</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPenaltyEmployee(p);
                              setShowPenaltyModal(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase transition-all cursor-pointer"
                          >
                            Xem
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right  text-red-600">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>-{p.totalPenalty?.toLocaleString("vi-VN")}đ</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPenaltyEmployee(p);
                              setShowPenaltyModal(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-[#7A2F1E] text-[9px] font-black uppercase transition-all cursor-pointer"
                          >
                            Xem
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right  text-amber-700">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>-{p.totalAdvance?.toLocaleString("vi-VN") || 0}đ</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPenaltyEmployee(p);
                              setShowPenaltyModal(true);
                            }}
                            className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[9px] font-black uppercase transition-all cursor-pointer"
                          >
                            Xem
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-right  font-black text-sm text-[#7c4831] bg-[#7c4831]/5">{p.finalAmount?.toLocaleString("vi-VN")}đ</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Attendance Logs Table */}
        <div className="card p-0 overflow-hidden border border-gray-150 shadow-sm bg-white mt-6">
          <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Lịch sử chấm công</span>
            <span className="text-[10px] font-semibold text-gray-500"></span>
          </div>

          <div className="overflow-x-auto pb-4">
            <table className="w-full min-w-max text-left text-xs border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                  <th className="px-6 py-4">Tên</th>
                  <th className="px-6 py-4">Ngày</th>
                  <th className="px-6 py-4">Ca</th>
                  <th className="px-6 py-4 text-center">Giờ vào</th>
                  <th className="px-6 py-4 text-center">Giờ ra</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                {(() => {
                  const list = officialSchedulesList.filter((s: any) => s.date >= payrollFromDate && s.date <= payrollToDate);
                  if (list.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">Không có dữ liệu ca trực & chấm công trong khoảng thời gian này.</td>
                      </tr>
                    );
                  }
                  return list.map((s: any) => {
                    let lateInfo = "";
                    let earlyInfo = "";

                    if (s.checkInTime) {
                      // Parse times
                      const startParts = s.startTime.split(":");
                      const realParts = s.checkInTime.split(":");
                      const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                      const realMin = parseInt(realParts[0]) * 60 + parseInt(realParts[1]);
                      if (realMin > startMin) {
                        lateInfo = `(Trễ ${realMin - startMin} phút)`;
                      } else if (startMin - realMin > 720) {
                        const diff = (realMin + 1440) - startMin;
                        if (diff > 0) {
                          lateInfo = `(Trễ ${diff} phút)`;
                        }
                      }
                    }

                    if (s.checkOutTime) {
                      const endParts = s.endTime.split(":");
                      const realParts = s.checkOutTime.split(":");
                      const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                      const realMin = parseInt(realParts[0]) * 60 + parseInt(realParts[1]);
                      if (realMin < endMin) {
                        earlyInfo = `(Về sớm ${endMin - realMin} phút)`;
                      } else if (realMin - endMin > 720) {
                        const diff = (endMin + 1440) - realMin;
                        if (diff > 0) {
                          earlyInfo = `(Về sớm ${diff} phút)`;
                        }
                      }
                    }

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 uppercase tracking-tight font-black">{s.staffName}</td>
                        <td className="p-4 font-mono">{s.date}</td>
                        <td className="p-4 font-mono text-gray-600">{s.startTime} - {s.endTime}</td>
                        <td className="p-4 text-center font-mono font-black">
                          <span className="text-emerald-700">{s.checkInTime || "--:--"}</span>{" "}
                          {lateInfo && <span className="text-red-600 text-[10px] block font-bold">{lateInfo}</span>}
                        </td>
                        <td className="p-4 text-center font-mono font-black">
                          <span className="text-amber-700">{s.checkOutTime || "--:--"}</span>{" "}
                          {earlyInfo && <span className="text-[#92400E] text-[10px] block font-bold">{earlyInfo}</span>}
                        </td>
                        <td className="p-4 text-center">
                          {s.clockedOut ? (
                            <span className="pill pill-green border border-emerald-200">Hoàn thành</span>
                          ) : s.clockedIn ? (
                            <span className="pill pill-amber border border-amber-200">Đang làm việc</span>
                          ) : (
                            <span className="pill pill-red border border-red-200">Vắng / Chưa checkin</span>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // === REQUESTS ===
  const ReqsView = () => {
    const pending = requests?.filter((r: any) => r.status === "pending") || [];
    const resolved = requests?.filter((r: any) => r.status !== "pending") || [];
    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="border-b border-gray-200/50 pb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Phê Duyệt Đơn Nhân Sự</h2>
          <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Duyệt xin nghỉ phép và yêu cầu đổi ca trực của nhân viên</p>
        </div>

        <div className="card space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#92400E] border-b border-gray-100 pb-3">
            <FileCheck size={16} /> Danh Sách Đơn Đang Chờ ({pending.length})
          </h3>
          {pending.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6 text-center">Hiện tại không có đơn nào đang chờ duyệt.</p>
          ) : pending.map((r: any) => (
            <div key={r.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-gray-100 space-y-3.5 shadow-xs anim-scaleIn">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[10px] shadow-xs border ${getAvatarBg(r.staffName)}`}>
                    {getInitials(r.staffName)}
                  </div>
                  <span className="font-extrabold text-sm uppercase tracking-tight text-[#4B3621]">{r.staffName}</span>
                </div>
                <span className={`pill ${r.type === "leave" ? "pill-violet" : "pill-blue"} border`}>{r.type === "leave" ? "Nghỉ phép" : "Đổi ca"}</span>
              </div>
              <p className="text-xs text-[#4B3621] font-semibold bg-white p-3 rounded-xl border border-gray-100 leading-relaxed">{r.date} — Lý do: {r.details}</p>
              <div className="flex gap-2.5 pt-1">
                <button onClick={async () => {
                  await approveRequest(r.id);
                  fetchOfficialSchedules();
                }} className="btn btn-success py-2 px-4 text-[10px] font-bold shadow-xs">Duyệt Đơn</button>
                <button onClick={() => { rejectRequest(r.id); }} className="btn btn-danger py-2 px-4 text-[10px] font-bold shadow-xs">Từ Chối</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card space-y-4">
          <h3 className="text-xs font-extrabold uppercase text-gray-400 border-b border-gray-100 pb-2.5">Đơn Đã Xử Lý ({resolved.length})</h3>
          <div className="space-y-3">
            {resolved.map((r: any) => (
              <div key={r.id} className="p-3.5 rounded-2xl bg-[#FAF9F6]/60 border border-gray-100 text-xs flex justify-between items-center opacity-85 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[9px] border ${getAvatarBg(r.staffName)}`}>
                    {getInitials(r.staffName)}
                  </div>
                  <div>
                    <p className="font-extrabold uppercase text-[#4B3621] tracking-tight">{r.staffName}</p>
                    <p className="text-[#7c4831]/70 font-semibold mt-0.5">{r.date} — {r.details}</p>
                  </div>
                </div>
                <span className={`pill ${r.status === "approved" ? "pill-green" : "pill-red"} text-[8px] font-bold border`}>{r.status === "approved" ? "Đã Duyệt" : "Bác Bỏ"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // === LOYALTY ===
  const LoyaltyView = () => (
    <div className="space-y-6 anim-fadeUp text-[#4B3621]">
      <div className="border-b border-gray-200/50 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Điểm Loyalty & Thực Đơn</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Điều chỉnh điểm thành viên thủ công & Cập nhật Menu chi nhánh</p>
      </div>

      {/* Edit Points */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <Edit3 size={16} className="text-[#7c4831]" /> Sửa điểm khách hàng thủ công
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <input type="tel" placeholder="Số điện thoại khách *" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="input text-sm font-semibold" id="edit-phone" />
          <input type="number" placeholder="Số điểm mới *" value={editPts} onChange={e => setEditPts(e.target.value)} className="input text-sm font-semibold" id="edit-pts" />
          <button onClick={() => { if (!editPhone || !editPts) return; adjustPointsManually(editPhone.trim(), parseInt(editPts)); alert("Cập nhật số điểm thành công!"); setEditPhone(""); setEditPts(""); }}
            className="btn btn-primary py-2.5 text-xs" id="edit-pts-btn">Cập Nhật Ngay</button>
        </div>
      </div>

      {/* Customer List */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <Users size={16} className="text-[#7c4831]" /> Danh Sách Khách Hàng Đăng Ký ({customers?.length || 0})
        </h3>
        <div className="space-y-3">
          {(customers || []).map((c: any) => (
            <div key={c.phone} className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-gray-100 text-sm flex justify-between items-center shadow-xs transition-all hover:bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[10px] shadow-xs border ${getAvatarBg(c.name)}`}>
                  {getInitials(c.name)}
                </div>
                <div>
                  <p className="font-extrabold text-sm text-[#4B3621] uppercase tracking-tight">{c.name}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">{c.phone} • {c.email}</p>
                </div>
              </div>
              <span className="pill bg-[#E0F2FE] text-[#075985]  font-extrabold border border-sky-100">{c.points}đ</span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Upload */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <ImagePlus size={16} className="text-[#7c4831]" /> Cấu Hình Hình Ảnh Thực Đơn
        </h3>

        {/* Responsive grid for multi menu images */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
          {menuImages && menuImages.map((img: any) => (
            <div key={img.id} className="relative group border border-gray-100 rounded-2xl overflow-hidden shadow-xs bg-gray-50 flex flex-col">
              <div className="relative aspect-square w-full overflow-hidden bg-white">
                <img src={img.url} alt="Menu thumbnail" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Bạn có chắc chắn muốn xóa hình ảnh thực đơn này?")) {
                      const updated = menuImages.filter((item: any) => item.id !== img.id);
                      updateMenuImages(updated);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-90 transition-all hover:scale-105"
                  title="Xóa ảnh"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="p-2.5 flex items-center gap-2 border-t border-gray-100 bg-white">
                <input
                  type="checkbox"
                  checked={img.active}
                  onChange={(e) => {
                    const updated = menuImages.map((item: any) =>
                      item.id === img.id ? { ...item, active: e.target.checked } : item
                    );
                    updateMenuImages(updated);
                  }}
                  className="w-4 h-4 rounded-sm border-gray-300 text-[#7c4831] focus:ring-[#7c4831]"
                  id={`check-${img.id}`}
                />
                <label htmlFor={`check-${img.id}`} className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                  Hoạt động
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2 max-w-lg">
          <label className="text-xs font-bold text-gray-500 uppercase">Tải các tệp hình ảnh thực đơn lên trực tiếp (Chọn nhiều ảnh):</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => {
              const files = e.target.files;
              if (files && files.length > 0) {
                const promises = Array.from(files).map(file => {
                  return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === "string") {
                        resolve(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                });
                Promise.all(promises).then(urls => {
                  const newItems = urls.map((url, idx) => ({
                    id: `menu-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
                    url,
                    active: true
                  }));
                  updateMenuImages([...(menuImages || []), ...newItems]);
                  alert("Tải lên các hình ảnh thực đơn thành công!");
                });
              }
            }}
            className="input w-full text-xs font-semibold cursor-pointer"
            id="menu-file"
          />
        </div>
      </div>
    </div>
  );

  // === FEEDBACK ===
  const FeedbackView = () => {
    const uniquePhones = Array.from(new Set((feedbacks || []).map((f: any) => f.customerPhone))) as string[];

    // Pick the first phone number if none is selected yet
    const currentPhone = selectedFeedbackPhone || uniquePhones[0] || null;
    const currentMessages = feedbacks?.filter((f: any) => f.customerPhone === currentPhone) || [];
    const currentCustomerName = currentMessages[0]?.customerName || currentPhone || "";

    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621] h-[calc(100vh-160px)] flex flex-col">
        <div className="border-b border-gray-200/50 pb-4 shrink-0">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Ý Kiến Góp Ý Khách Hàng</h2>
          <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Phản hồi trực tiếp các ý kiến đóng góp từ thực khách</p>
        </div>

        {uniquePhones.length === 0 ? (
          <div className="card text-center py-10 flex-grow flex items-center justify-center"><p className="text-xs text-[#4B3621]/60 font-bold italic">Chưa nhận được phản hồi góp ý nào.</p></div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-grow border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-sm h-0">
            {/* Split Left: Customer List */}
            <div className="w-full lg:w-80 border-r border-gray-150 flex flex-col h-1/3 lg:h-full bg-[#FAF9F6]">
              <div className="p-3 border-b border-gray-150 bg-white font-bold text-xs uppercase tracking-wider text-[#7c4831]">Danh sách hội thoại</div>
              <div className="overflow-y-auto flex-grow divide-y divide-gray-100">
                {uniquePhones.map(phone => {
                  const userMessages = feedbacks.filter((f: any) => f.customerPhone === phone);
                  const lastMessage = userMessages[userMessages.length - 1];
                  const name = lastMessage?.customerName || phone;
                  const isSelected = currentPhone === phone;

                  return (
                    <button
                      key={phone}
                      onClick={() => setSelectedFeedbackPhone(phone)}
                      className={`w-full text-left p-3.5 transition-all flex items-center gap-3 hover:bg-[#7c4831]/5 ${isSelected ? "bg-[#7c4831]/10 border-l-4 border-l-[#7c4831]" : ""}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[10px] border shrink-0 ${getAvatarBg(name)}`}>
                        {getInitials(name)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <p className="font-extrabold text-xs text-[#4B3621] uppercase truncate">{name}</p>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold ">{phone}</p>
                        {lastMessage && (
                          <p className="text-[10.5px] text-gray-600 truncate mt-0.5 font-medium">{lastMessage.message}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Right: Conversational Chat Pane */}
            <div className="flex-grow flex flex-col h-2/3 lg:h-full bg-white">
              {currentPhone ? (
                <>
                  {/* Chat Pane Header */}
                  <div className="p-3.5 border-b border-gray-150 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[10px] border ${getAvatarBg(currentCustomerName)}`}>
                        {getInitials(currentCustomerName)}
                      </div>
                      <div>
                        <h4 className="font-extrabold uppercase text-xs text-[#4B3621] tracking-tight">{currentCustomerName}</h4>
                        <span className="text-[9px] font-bold text-gray-400  mt-0.5 block">{currentPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Message Bubble Feed */}
                  <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-[#FAF9F6]">
                    {currentMessages.map((m: any) => {
                      const isAdmin = m.sender === "admin";
                      return (
                        <div key={m.id} className={`flex flex-col max-w-[75%] ${isAdmin ? "ml-auto items-end" : "mr-auto items-start"}`}>
                          <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed ${isAdmin ? "bg-[#7c4831] text-white rounded-tr-none shadow-sm" : "bg-white text-[#4B3621] rounded-tl-none border border-gray-200/80 shadow-sm"}`}>
                            <p>{m.message}</p>
                          </div>
                          <span className="text-[8px] font-bold text-[#7c4831]/60 mt-1 uppercase tracking-wider">
                            {isAdmin ? "Bạn" : "Khách hàng"} • {m.timestamp}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input Panel */}
                  <div className="p-3.5 border-t border-gray-150 bg-white shrink-0">
                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        placeholder={`Trả lời cho ${currentCustomerName}...`}
                        className="input flex-grow text-xs font-semibold"
                        onKeyDown={e => {
                          if (e.key === "Enter" && (e.target as any).value) {
                            sendFeedbackReply(currentPhone, (e.target as any).value);
                            (e.target as any).value = "";
                          }
                        }}
                        id={`reply-${currentPhone}`}
                      />
                      <button
                        onClick={() => {
                          const el = document.getElementById(`reply-${currentPhone}`) as HTMLInputElement;
                          if (el?.value) {
                            sendFeedbackReply(currentPhone, el.value);
                            el.value = "";
                          }
                        }}
                        className="btn btn-primary px-5 text-xs shrink-0"
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center text-gray-400 font-bold italic text-xs">Vui lòng chọn một cuộc trò chuyện để bắt đầu</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // === ADJUSTMENTS ===
  const AdjustmentsView = () => {
    const getLatePenaltyAmount = (lateMin: number) => {
      const startMins = parseInt(latePenaltyStartMinutes) || 10;
      const baseAmt = parseFloat(latePenaltyBaseAmount) || 50000;
      const intervalMins = parseInt(latePenaltyIntervalMinutes) || 10;
      const multiplier = parseFloat(latePenaltyMultiplier) || 2;

      if (lateMin < startMins) return 0;
      const intervals = Math.floor((lateMin - startMins) / intervalMins);
      const multiplierFactor = Math.pow(multiplier, intervals);
      return baseAmt * multiplierFactor;
    };

    // Group adjustments by employee id/name
    const groupedAdjustments: { [key: string]: { employeeKey: string; employeeName: string; adjustments: any[]; totalBonus: number; totalPenalty: number; totalAdvance: number } } = {};
    adjustmentsList.forEach((a: any, idx: number) => {
      const key = a.EmployeeId || a.EmployeeName || "unknown";
      if (!groupedAdjustments[key]) {
        groupedAdjustments[key] = {
          employeeKey: key,
          employeeName: a.EmployeeName || "Nhân viên",
          adjustments: [],
          totalBonus: 0,
          totalPenalty: 0,
          totalAdvance: 0
        };
      }
      const amount = a.Amount || (a.Quantity * (a.AmountPerUnit || 0)) || 0;
      if (a.Type === "bonus") {
        groupedAdjustments[key].totalBonus += amount;
      } else if (a.Type === "advance") {
        groupedAdjustments[key].totalAdvance += amount;
      } else {
        groupedAdjustments[key].totalPenalty += amount;
      }
      groupedAdjustments[key].adjustments.push({ ...a, originalIndex: idx });
    });

    // Thêm các ca đi trễ tự động vào bảng thưởng phạt
    (officialSchedulesList || [])
      .filter((s: any) => s.checkInTime)
      .forEach((s: any) => {
        const startParts = s.startTime.split(":");
        const realParts = s.checkInTime.split(":");
        const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const realMin = parseInt(realParts[0]) * 60 + parseInt(realParts[1]);
        let lateMin = 0;
        if (realMin > startMin) {
          lateMin = realMin - startMin;
        } else if (startMin - realMin > 720) {
          lateMin = (realMin + 1440) - startMin;
        }
        const amount = getLatePenaltyAmount(lateMin);
        if (amount > 0) {
          const key = s.userId || s.staffName || "unknown";
          if (!groupedAdjustments[key]) {
            groupedAdjustments[key] = {
              employeeKey: key,
              employeeName: s.staffName || "Nhân viên",
              adjustments: [],
              totalBonus: 0,
              totalPenalty: 0,
              totalAdvance: 0
            };
          }
          groupedAdjustments[key].totalPenalty += amount;
          groupedAdjustments[key].adjustments.push({
            EmployeeId: s.userId,
            EmployeeName: s.staffName,
            Type: "penalty",
            Amount: amount,
            Date: s.date,
            Note: `Đi muộn ${lateMin} phút (Ca ${s.startTime} - ${s.endTime})`,
            IsAuto: true
          });
        }
        // Tăng do đi làm vào ngày lễ (Thưởng lễ hệ số & flat bonus)
        const matchedHoliday = detailedHolidaysList.find((h: any) => h.Date === s.date);
        if (matchedHoliday && s.clockedOut) {
          const mult = matchedHoliday.Multiplier > 0 ? matchedHoliday.Multiplier : 2.0;
          const flat = matchedHoliday.FlatBonus || 0;
          if (mult > 1.0 || flat > 0) {
            const staff = staffList.find((emp: any) => emp.id === s.userId);
            const hourlyWage = staff ? staff.hourlyWage : 25000;

            const [sh, sm] = s.startTime.split(":").map(Number);
            let [eh, em] = s.endTime.split(":").map(Number);
            if (eh < sh) eh += 24;

            let actualHours = 0;
            if (s.checkInTime && s.checkOutTime) {
              const [ciH, ciM] = s.checkInTime.split(":").map(Number);
              let [coH, coM] = s.checkOutTime.split(":").map(Number);
              const schedEndMins = eh * 60 + em;
              const checkInMins = ciH * 60 + ciM;
              let checkOutMins = coH * 60 + coM;
              if (checkOutMins < checkInMins) {
                checkOutMins += 1440;
              }
              const limitOutMins = checkOutMins > schedEndMins ? schedEndMins : checkOutMins;
              actualHours = (limitOutMins - checkInMins) / 60;
              if (actualHours < 0) actualHours = 0;
            } else {
              actualHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
            }

            const extraMultSalary = Math.round(actualHours * hourlyWage * (mult - 1));
            const totalHolidayBonus = extraMultSalary + flat;

            if (totalHolidayBonus > 0) {
              const key = s.userId || s.staffName || "unknown";
              if (!groupedAdjustments[key]) {
                groupedAdjustments[key] = {
                  employeeKey: key,
                  employeeName: s.staffName || "Nhân viên",
                  adjustments: [],
                  totalBonus: 0,
                  totalPenalty: 0,
                  totalAdvance: 0
                };
              }
              groupedAdjustments[key].totalBonus += totalHolidayBonus;
              groupedAdjustments[key].adjustments.push({
                EmployeeId: s.userId,
                EmployeeName: s.staffName,
                Type: "bonus",
                Amount: totalHolidayBonus,
                Date: s.date,
                Note: `Đi làm ngày lễ ${matchedHoliday.Note} (Hệ số x${mult}${flat > 0 ? ` + ${flat.toLocaleString()}đ` : ''})`,
                IsAuto: true
              });
            }
          }
        }
      });

    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="border-b border-gray-200/50 pb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Tính Lương & Thưởng Phạt</h2>
          <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Tính toán tự động tiền lương, quản lý thưởng nóng, phạt hành chính và cấu hình hệ thống lương</p>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-150 pb-3 mb-4">
          <button
            onClick={() => setAdjActiveTab("payroll")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${adjActiveTab === "payroll"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            Bảng Lương
          </button>
          <button
            onClick={() => setAdjActiveTab("history")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${adjActiveTab === "history"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            Lịch sử Thưởng & Phạt
          </button>
          <button
            onClick={() => setAdjActiveTab("rules")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${adjActiveTab === "rules"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            Cấu hình Phạt đi trễ
          </button>
          <button
            onClick={() => setAdjActiveTab("holidays")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${adjActiveTab === "holidays"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            Ngày nghỉ lễ chi tiết
          </button>
        </div>

        {/* Tab 0: Payroll calculator */}
        {adjActiveTab === "payroll" && (() => {
          const exportPayrollToExcel = () => {
            window.open(`${getApiBaseUrl()}/api/attendance/payroll/export?locationId=${activeLocation?.id || "govap-branch"}&fromDate=${payrollFromDate}&toDate=${payrollToDate}`, "_blank");
          };

          return (
            <div className="space-y-6">
              {/* Date Selector Form */}
              <div className="card space-y-4">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] flex justify-between items-center time">
                  <span>Chọn thời gian</span>
                  <button
                    onClick={exportPayrollToExcel}
                    disabled={payrollList.length === 0}
                    type="button"
                    className="btn btn-primary py-1.5 px-3 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={11} />
                    <span>Xuất Excel</span>
                  </button>
                </h3>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Từ ngày:</label>
                    <input
                      type="date"
                      value={payrollFromDate}
                      onChange={e => setPayrollFromDate(e.target.value)}
                      className="input text-xs font-semibold w-36"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Đến ngày:</label>
                    <input
                      type="date"
                      value={payrollToDate}
                      onChange={e => setPayrollToDate(e.target.value)}
                      className="input text-xs font-semibold w-36"
                    />
                  </div>
                  <button
                    onClick={fetchPayrollData}
                    disabled={payrollLoading}
                    type="button"
                    className="btn btn-primary text-xs py-2 px-4 h-9 flex items-center gap-1.5"
                  >
                    {payrollLoading ? <RefreshCw size={13} className="animate-spin" /> : "Tính Lương"}
                  </button>
                </div>
              </div>

              {/* Payroll Table */}
              <div className="card p-0 overflow-hidden border border-gray-150 shadow-sm bg-white">
                <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Bảng lương chi nhánh</span>
                  <span className="text-[10px] font-semibold text-gray-500 ">Đơn vị: VNĐ</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                        <th className="p-4">Tên</th>
                        <th className="p-4">Số điện thoại</th>
                        <th className="p-4 text-right">Lương/giờ</th>
                        <th className="p-4 text-right">Giờ làm</th>
                        <th className="p-4 text-right">Lương cơ bản</th>
                        <th className="p-4 text-right">Thưởng</th>
                        <th className="p-4 text-right">Phạt</th>
                        <th className="p-4 text-right">Tạm ứng</th>
                        <th className="p-4 text-right font-black text-[#7c4831]">Thực nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                      {payrollList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-gray-400 italic">Không có dữ liệu tính lương trong khoảng thời gian này. Bấm nút "Tính Lương" để tải dữ liệu.</td>
                        </tr>
                      ) : (
                        payrollList.map((p: any) => (
                          <tr key={p.userId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 uppercase tracking-tight font-black">{p.fullName}</td>
                            <td className="p-4  font-medium text-gray-500">{p.phoneNumber}</td>
                            <td className="p-4 text-right ">{p.hourlyWage?.toLocaleString("vi-VN")}đ</td>
                            <td className="p-4 text-right ">{p.totalWorkedHours}h</td>
                            <td className="p-4 text-right ">{p.baseSalary?.toLocaleString("vi-VN")}đ</td>
                            <td className="p-4 text-right  text-emerald-600">
                              <div className="flex items-center justify-end gap-1.5">
                                <span>+{p.totalBonus?.toLocaleString("vi-VN")}đ</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPenaltyEmployee(p);
                                    setShowPenaltyModal(true);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase transition-all cursor-pointer"
                                >
                                  Xem
                                </button>
                              </div>
                            </td>
                            <td className="p-4 text-right  text-red-600">
                              <div className="flex items-center justify-end gap-1.5">
                                <span>-{p.totalPenalty?.toLocaleString("vi-VN")}đ</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPenaltyEmployee(p);
                                    setShowPenaltyModal(true);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-[#7A2F1E] text-[9px] font-black uppercase transition-all cursor-pointer"
                                >
                                  Xem
                                </button>
                              </div>
                            </td>
                            <td className="p-4 text-right  text-amber-700">
                              <div className="flex items-center justify-end gap-1.5">
                                <span>-{p.totalAdvance?.toLocaleString("vi-VN") || 0}đ</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPenaltyEmployee(p);
                                    setShowPenaltyModal(true);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[9px] font-black uppercase transition-all cursor-pointer"
                                >
                                  Xem
                                </button>
                              </div>
                            </td>
                            <td className="p-4 text-right  font-black text-sm text-[#7c4831] bg-[#7c4831]/5">{p.finalAmount?.toLocaleString("vi-VN")}đ</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Attendance Logs Table */}
              <div className="card p-0 overflow-hidden border border-gray-150 shadow-sm bg-white mt-6">
                <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Lịch sử chấm công</span>
                  <span className="text-[10px] font-semibold text-gray-500"></span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                        <th className="p-4">Tên</th>
                        <th className="p-4">Ngày</th>
                        <th className="p-4">Ca</th>
                        <th className="p-4 text-center">Giờ vào</th>
                        <th className="p-4 text-center">Giờ ra</th>
                        <th className="p-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                      {(() => {
                        const list = officialSchedulesList.filter((s: any) => s.date >= payrollFromDate && s.date <= payrollToDate);
                        if (list.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400 italic">Không có dữ liệu ca trực & chấm công trong khoảng thời gian này.</td>
                            </tr>
                          );
                        }
                        return list.map((s: any) => {
                          let lateInfo = "";
                          let earlyInfo = "";

                          if (s.checkInTime) {
                            // Parse times
                            const startParts = s.startTime.split(":");
                            const realParts = s.checkInTime.split(":");
                            const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                            const realMin = parseInt(realParts[0]) * 60 + parseInt(realParts[1]);
                            if (realMin > startMin) {
                              lateInfo = `(Trễ ${realMin - startMin} phút)`;
                            } else if (startMin - realMin > 720) {
                              const diff = (realMin + 1440) - startMin;
                              if (diff > 0) {
                                lateInfo = `(Trễ ${diff} phút)`;
                              }
                            }
                          }

                          if (s.checkOutTime) {
                            const endParts = s.endTime.split(":");
                            const realParts = s.checkOutTime.split(":");
                            const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                            const realMin = parseInt(realParts[0]) * 60 + parseInt(realParts[1]);
                            if (realMin < endMin) {
                              earlyInfo = `(Về sớm ${endMin - realMin} phút)`;
                            } else if (realMin - endMin > 720) {
                              const diff = (endMin + 1440) - realMin;
                              if (diff > 0) {
                                earlyInfo = `(Về sớm ${diff} phút)`;
                              }
                            }
                          }

                          return (
                            <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="p-4 uppercase tracking-tight font-black">{s.staffName}</td>
                              <td className="p-4 font-mono">{s.date}</td>
                              <td className="p-4 font-mono text-gray-600">{s.startTime} - {s.endTime}</td>
                              <td className="p-4 text-center font-mono font-black">
                                <span className="text-emerald-700">{s.checkInTime || "--:--"}</span>{" "}
                                {lateInfo && <span className="text-red-600 text-[10px] block font-bold">{lateInfo}</span>}
                              </td>
                              <td className="p-4 text-center font-mono font-black">
                                <span className="text-amber-700">{s.checkOutTime || "--:--"}</span>{" "}
                                {earlyInfo && <span className="text-[#92400E] text-[10px] block font-bold">{earlyInfo}</span>}
                              </td>
                              <td className="p-4 text-center">
                                {s.clockedOut ? (
                                  <span className="pill pill-green border border-emerald-200">Hoàn thành</span>
                                ) : s.clockedIn ? (
                                  <span className="pill pill-amber border border-amber-200">Đang làm việc</span>
                                ) : (
                                  <span className="pill pill-red border border-red-200">Vắng / Chưa checkin</span>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab 1: History of Rewards/Penalties */}
        {adjActiveTab === "history" && (
          <div className="space-y-6">
            {/* Form Adjustment */}
            <div className="card space-y-4 border border-gray-150">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] flex items-center gap-2">
                  <Plus size={15} /> {editingAdjIndex !== null ? "Sửa Thưởng / Phạt Nhân Viên" : "Thêm Thưởng / Phạt"}
                </h3>
                {editingAdjIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAdjIndex(null);
                      setNewAdjNote("");
                    }}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[10px] font-bold text-gray-500 uppercase transition-all cursor-pointer"
                  >
                    Hủy Sửa / Thêm Mới
                  </button>
                )}
              </div>

              {editingAdjIndex !== null && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-bold">
                  ⚠️ Bạn đang chỉnh sửa một khoản thưởng/phạt. Sau khi sửa xong hãy bấm nút "Cập nhật điều chỉnh" bên dưới.
                </div>
              )}

              <form onSubmit={handleAddAdjustment} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Nhân viên áp dụng:</label>
                  <select
                    id="new-adj-employee-id"
                    value={newAdjEmployeeId}
                    onChange={e => setNewAdjEmployeeId(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {staffList.filter((s: any) => s.roleId === 3).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.phoneNumber})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Hình thức điều chỉnh:</label>
                  <select
                    value={newAdjType}
                    onChange={e => setNewAdjType(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                  >
                    <option value="bonus">Thưởng (Bonus)</option>
                    <option value="penalty">Phạt (Penalty)</option>
                    <option value="advance">Tạm ứng lương (Advance)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Đơn vị tính:</label>
                  <select
                    value={newAdjUnit}
                    onChange={e => setNewAdjUnit(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                  >
                    <option value="co_dinh">Cố định (Flat)</option>
                    <option value="lan">Lần (Times)</option>
                    <option value="phut">Phút (Minutes)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Số lượng (Quantity):</label>
                  <input
                    type="number"
                    step="any"
                    value={newAdjQuantity}
                    onChange={e => setNewAdjQuantity(e.target.value)}
                    disabled={newAdjUnit === "co_dinh"}
                    className="input w-full text-xs font-semibold bg-white disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Số tiền / Đơn vị (VNĐ):</label>
                  <input
                    type="number"
                    value={newAdjAmountPerUnit}
                    onChange={e => setNewAdjAmountPerUnit(e.target.value)}
                    placeholder="Ví dụ: 50000"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Ngày áp dụng:</label>
                  <input
                    type="date"
                    value={newAdjDate}
                    onChange={e => setNewAdjDate(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>

                <div className="space-y-1 md:col-span-3 lg:col-span-2">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Lý do điều chỉnh (Note):</label>
                  <input
                    type="text"
                    value={newAdjNote}
                    onChange={e => setNewAdjNote(e.target.value)}
                    placeholder="Ví dụ: Thưởng nóng hiệu suất tuần / Phạt nghỉ tự do"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary py-2.5 px-4 text-xs font-bold w-full cursor-pointer h-9">
                  {editingAdjIndex !== null ? "Cập nhật điều chỉnh" : "Thêm điều chỉnh"}
                </button>
              </form>
            </div>

            {/* Grouped Adjustments Table */}
            <div className="card p-0 overflow-hidden border border-gray-150 bg-white shadow-sm">
              <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] flex items-center gap-1.5">
                  <Users size={14} /> Danh sách Thưởng/Phạt
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                      <th className="p-3">Tên</th>
                      <th className="p-3 text-right">Tổng Thưởng</th>
                      <th className="p-3 text-right">Tổng Phạt</th>
                      <th className="p-3 text-right">Tổng Tạm Ứng</th>
                      <th className="p-3 text-center">Số khoản ghi nhận</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                    {Object.keys(groupedAdjustments).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400 italic">Chưa có khoản thưởng/phạt riêng nào cho nhân viên.</td>
                      </tr>
                    ) : (
                      Object.values(groupedAdjustments).map((group: any) => (
                        <tr key={group.employeeKey} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3 uppercase font-black tracking-tight">{group.employeeName}</td>
                          <td className="p-3 text-right text-emerald-600 font-bold">+{group.totalBonus.toLocaleString("vi-VN")}đ</td>
                          <td className="p-3 text-right text-red-600 font-bold">-{group.totalPenalty.toLocaleString("vi-VN")}đ</td>
                          <td className="p-3 text-right text-amber-700 font-bold">-{group.totalAdvance?.toLocaleString("vi-VN") || 0}đ</td>
                          <td className="p-3 text-center text-gray-500 font-bold">{group.adjustments.length}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedAdjGroup(group);
                                setTimeout(() => {
                                  const detailsEl = document.getElementById("detailed-adj-section");
                                  if (detailsEl) {
                                    detailsEl.scrollIntoView({ behavior: "smooth", block: "start" });
                                  }
                                }, 50);
                              }}
                              className="px-2.5 py-1 rounded bg-[#7c4831]/10 hover:bg-[#7c4831]/20 text-[#7c4831] text-[10px] font-black uppercase transition-all cursor-pointer"
                              type="button"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Adjustments Table (Inline instead of Popup) */}
            {selectedAdjGroup && (() => {
              const currentGroupAdjs = selectedAdjGroup.adjustments || [];

              return (
                <div id="detailed-adj-section" className="card p-0 overflow-hidden border border-[#7c4831]/20 bg-white shadow-md anim-fadeUp mt-4">
                  <div className="p-4 border-b border-gray-150 bg-gradient-to-r from-[#FAF9F6] to-[#F5EDE4] flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#7c4831] flex items-center gap-1.5">
                        <Users size={16} /> Chi Tiết Các Khoản Thưởng / Phạt Riêng
                      </h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">{selectedAdjGroup.employeeName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedAdjGroup(null); }}
                      className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase transition-all cursor-pointer border border-gray-200"
                    >
                      Đóng / Ẩn chi tiết
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                          <th className="p-3">Ngày</th>
                          <th className="p-3">Loại</th>
                          <th className="p-3">Chi tiết đơn vị</th>
                          <th className="p-3 text-right">Tổng số tiền</th>
                          <th className="p-3">Ghi chú</th>
                          <th className="p-3 text-center">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                        {currentGroupAdjs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-gray-400 italic">Không có dữ liệu thưởng phạt riêng.</td>
                          </tr>
                        ) : (
                          currentGroupAdjs.map((item: any, idx: number) => {
                            const amount = item.Amount || (item.Quantity * item.AmountPerUnit) || 0;
                            const originalIndex = item.originalIndex;
                            return (
                              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-3 whitespace-nowrap">{item.Date}</td>
                                <td className="p-3">
                                  <span className={`pill ${item.Type === "bonus" ? "pill-green" : item.Type === "advance" ? "pill-amber" : "pill-red"} border text-[8px] font-black uppercase`}>
                                    {item.Type === "bonus" ? "Thưởng" : item.Type === "advance" ? "Tạm ứng" : "Phạt"}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-500 font-medium whitespace-nowrap">
                                  {item.Unit === "co_dinh"
                                    ? "Số tiền cố định"
                                    : item.Unit
                                      ? `${item.Quantity} ${item.Unit === "lan" ? "lần" : "phút"} x ${(item.AmountPerUnit || 0).toLocaleString("vi-VN")}đ`
                                      : "Hệ thống tính toán"}
                                </td>
                                <td className={`p-3 text-right font-bold whitespace-nowrap ${item.Type === "bonus" ? "text-emerald-600" : item.Type === "advance" ? "text-amber-600" : "text-red-600"}`}>
                                  {item.Type === "bonus" ? "+" : "-"}{amount.toLocaleString("vi-VN")}đ
                                </td>
                                <td className="p-3 italic text-gray-650 max-w-[150px] truncate" title={item.Note}>{item.Note}</td>
                                <td className="p-3 text-center space-x-2.5">
                                  {item.IsAuto ? (
                                    <span className="text-[10px] text-gray-400 font-bold italic uppercase">Tự động (Hệ thống)</span>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => {
                                          setNewAdjEmployeeId(item.EmployeeId || "");
                                          setNewAdjType(item.Type || "bonus");
                                          setNewAdjUnit(item.Unit || "co_dinh");
                                          setNewAdjQuantity(String(item.Quantity || 1));
                                          setNewAdjAmountPerUnit(String(item.AmountPerUnit || 50000));
                                          setNewAdjDate(item.Date || "2026-06-08");
                                          setNewAdjNote(item.Note || "");
                                          setEditingAdjIndex(originalIndex);
                                          setSelectedAdjGroup(null);

                                          const formElement = document.getElementById("new-adj-employee-id");
                                          if (formElement) {
                                            formElement.scrollIntoView({ behavior: "smooth", block: "center" });
                                          }
                                        }}
                                        className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                                        type="button"
                                      >
                                        Sửa
                                      </button>
                                      <button
                                        onClick={async () => {
                                          await handleDeleteAdjustment(originalIndex);
                                        }}
                                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                                        type="button"
                                      >
                                        Xóa
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 2: Rules */}
        {adjActiveTab === "rules" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 anim-fadeUp">
            <div className="card space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
                <Gift size={16} className="text-[#7c4831]" /> Quy đổi Loyalty
              </h3>
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-gray-100/60 space-y-3.5 text-xs font-bold shadow-xs">
                <div className="flex justify-between items-center"><span className="text-[#4B3621]/60 uppercase tracking-wider">Quy cách tích điểm:</span><span className="text-xs  text-[#4B3621]">50.000 VNĐ = 1 Điểm</span></div>
                <div className="flex justify-between items-center"><span className="text-[#4B3621]/60 uppercase tracking-wider">Quy cách đổi quà:</span><span className="text-xs  text-[#4B3621]">10 Điểm = Voucher 55K</span></div>
              </div>
            </div>

            <div className="card space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
                <Settings size={16} className="text-[#7c4831]" /> Quản lý HRM
              </h3>
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-gray-100/60 space-y-3.5 text-xs font-bold shadow-xs">
                <div className="flex justify-between items-center"><span className="text-[#4B3621]/60 uppercase tracking-wider">Mức phạt mốc đầu:</span><span className="text-sm text-[#4B3621]">{(Number(latePenaltyBaseAmount) || 50000).toLocaleString("vi-VN")}đ (trễ {latePenaltyStartMinutes}m)</span></div>
                <div className="flex justify-between items-center"><span className="text-[#4B3621]/60 uppercase tracking-wider">Hệ số phạt tăng:</span><span className="text-sm text-[#4B3621]">x{latePenaltyMultiplier} (mỗi {latePenaltyIntervalMinutes}m)</span></div>
              </div>
            </div>

            <div className="card space-y-4 md:col-span-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
                <Settings size={16} className="text-[#7c4831]" /> Cấu hình Phạt đi trễ
              </h3>
              <form onSubmit={handleSaveHrmConfigs} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Bắt đầu phạt (Số phút trễ):</label>
                    <input
                      type="number"
                      value={latePenaltyStartMinutes}
                      onChange={e => setLatePenaltyStartMinutes(e.target.value)}
                      placeholder="Ví dụ: 10"
                      className="input w-full text-xs font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Số tiền phạt mốc đầu (VNĐ):</label>
                    <input
                      type="number"
                      value={latePenaltyBaseAmount}
                      onChange={e => setLatePenaltyBaseAmount(e.target.value)}
                      placeholder="Ví dụ: 50000"
                      className="input w-full text-xs font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Khoảng tăng trễ (Phút):</label>
                    <input
                      type="number"
                      value={latePenaltyIntervalMinutes}
                      onChange={e => setLatePenaltyIntervalMinutes(e.target.value)}
                      placeholder="Ví dụ: 10"
                      className="input w-full text-xs font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Hệ số nhân (Lũy tiến):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={latePenaltyMultiplier}
                      onChange={e => setLatePenaltyMultiplier(e.target.value)}
                      placeholder="Ví dụ: 2"
                      className="input w-full text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAF9F6] border border-gray-150 rounded-2xl text-[11px] font-medium text-gray-500 leading-relaxed space-y-1">
                  <div><strong>Giải thích công thức:</strong> Đi trễ dưới <strong>{latePenaltyStartMinutes} phút</strong> không phạt.</div>
                  <div>Trễ từ <strong>{latePenaltyStartMinutes} phút</strong> trở đi sẽ phạt mốc đầu là <strong>{(Number(latePenaltyBaseAmount) || 0).toLocaleString("vi-VN")} VNĐ</strong>.</div>
                  <div>Cứ mỗi <strong>{latePenaltyIntervalMinutes} phút</strong> tăng thêm thì số tiền phạt sẽ nhân lên <strong>{latePenaltyMultiplier} lần</strong> (hệ số lũy tiến hình học).</div>
                </div>

                <button type="submit" className="btn btn-primary py-2.5 px-6 text-xs font-bold cursor-pointer">
                  Lưu cấu hình phạt đi trễ
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Holidays list & form */}
        {adjActiveTab === "holidays" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 anim-fadeUp">
            {/* Form Holiday */}
            <div className="card space-y-4 h-fit border border-gray-150 bg-white">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] border-b border-gray-100 pb-3 flex items-center gap-2">
                <Calendar size={15} /> Thêm Ngày Nghỉ Lễ Mới
              </h3>
              <form onSubmit={handleAddDetailedHoliday} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Ngày nghỉ lễ:</label>
                  <input
                    type="date"
                    value={newHolidayDate}
                    onChange={e => setNewHolidayDate(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Ghi chú tên ngày lễ:</label>
                  <input
                    type="text"
                    value={newHolidayNote}
                    onChange={e => setNewHolidayNote(e.target.value)}
                    placeholder="Ví dụ: Tết Dương Lịch"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Hệ số lương ngày này (ví dụ x2, x3):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newHolidayMultiplier}
                    onChange={e => setNewHolidayMultiplier(e.target.value)}
                    placeholder="Ví dụ: 2.0"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Hoặc thưởng thêm cố định (VNĐ):</label>
                  <input
                    type="number"
                    value={newHolidayFlatBonus}
                    onChange={e => setNewHolidayFlatBonus(e.target.value)}
                    placeholder="Ví dụ: 100000"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary py-2 px-4 text-xs font-bold w-full cursor-pointer">
                  Thêm ngày lễ
                </button>
              </form>
            </div>

            {/* List Holidays */}
            <div className="card p-0 lg:col-span-2 overflow-hidden border border-gray-150 bg-white">
              <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] flex items-center gap-1.5">
                  <Calendar size={14} /> Danh sách ngày nghỉ lễ chi tiết ({detailedHolidaysList.length})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                      <th className="p-3">Ngày lễ</th>
                      <th className="p-3">Mô tả / Tên ngày lễ</th>
                      <th className="p-3 text-center">Hệ số lương</th>
                      <th className="p-3 text-center">Thưởng cố định</th>
                      <th className="p-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                    {detailedHolidaysList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400 italic">Chưa có ngày lễ nào được thiết lập.</td>
                      </tr>
                    ) : (
                      detailedHolidaysList.map((h: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3  text-xs text-[#7c4831]">{h.Date}</td>
                          <td className="p-3 text-xs">{h.Note}</td>
                          <td className="p-3 text-center text-xs">x{h.Multiplier ?? "2.0"}</td>
                          <td className="p-3 text-center text-xs">{(h.FlatBonus ?? 0).toLocaleString("vi-VN")}đ</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteDetailedHoliday(idx)}
                              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                              type="button"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  // === CONFIGURATION ===
  const ConfigView = () => {
    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="border-b border-gray-200/50 pb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Cấu Hình Hệ Thống</h2>
          <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Quản lý định vị GPS, đăng ký ca rảnh và bảo mật sinh trắc học</p>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-150 pb-3 mb-4">
          <button
            onClick={() => setConfigActiveTab("gps")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${configActiveTab === "gps"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            Vị trí GPS & Bản đồ
          </button>
          <button
            onClick={() => setConfigActiveTab("biometrics")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${configActiveTab === "biometrics"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            Bảo mật sinh trắc học
          </button>
        </div>

        {/* Tab 2: GPS Config */}
        {configActiveTab === "gps" && (
          <div className="card space-y-4 border border-gray-150 bg-white anim-fadeUp">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
              <MapPin size={16} className="text-[#7c4831]" /> Cấu hình vị trí GPS & Bản đồ giới hạn check-in
            </h3>
            <p className="text-[11px] text-gray-500 font-semibold">
              Click hoặc kéo thả ghim trên bản đồ dưới đây để xác định tọa độ của quán. Nhân viên chỉ có thể check-in khi đứng trong vòng tròn bán kính cho phép.
            </p>
            <form onSubmit={handleSaveHrmConfigs} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Vĩ độ (Latitude):</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={gpsLatitude}
                    onChange={e => setGpsLatitude(e.target.value)}
                    placeholder="Ví dụ: 10.8315"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Kinh độ (Longitude):</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={gpsLongitude}
                    onChange={e => setGpsLongitude(e.target.value)}
                    placeholder="Ví dụ: 106.6645"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Bán kính check-in cho phép (Mét):</label>
                  <input
                    type="number"
                    value={gpsRadius}
                    onChange={e => setGpsRadius(e.target.value)}
                    placeholder="Ví dụ: 50"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
              </div>

              {/* Tìm kiếm địa chỉ */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Tìm kiếm địa chỉ nhanh:</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Ví dụ: 123 Nguyễn Văn Cừ, Gò Vấp, Hồ Chí Minh"
                    value={addressSearchQuery}
                    onChange={e => setAddressSearchQuery(e.target.value)}
                    className="input flex-grow text-xs font-semibold bg-white"
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddressSearch(e as any);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={searchLoading}
                    className="btn btn-ghost border border-gray-255 bg-[#FAF9F6] text-xs font-bold py-1.5 px-4 hover:bg-gray-100 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {searchLoading ? <RefreshCw size={12} className="animate-spin" /> : "Tìm kiếm"}
                  </button>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="btn btn-ghost border border-gray-255 bg-[#FAF9F6] text-xs font-bold py-1.5 px-4 hover:bg-gray-100 flex items-center justify-center gap-1.5 text-amber-800 cursor-pointer"
                    title="Lấy vị trí GPS hiện tại của trình duyệt"
                  >
                    <MapPin size={12} /> Lấy vị trí của tôi
                  </button>
                </div>
              </div>

              <div id="map-picker" className="h-72 w-full rounded-2xl border border-gray-250/70 shadow-sm relative z-10 my-3 overflow-hidden"></div>

              <button type="submit" className="btn btn-primary py-2.5 px-6 text-xs font-bold cursor-pointer">
                Lưu cấu hình vị trí GPS
              </button>
            </form>

            {/* Cấu hình ghi chú của quản lý */}
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#7c4831]">
                <FileText size={16} className="text-[#7c4831]" /> Ghi chú của Quản lý dành cho Nhân viên
              </h3>
              <p className="text-[11px] text-gray-500 font-semibold">
                Ghi chú này sẽ được hiển thị ở phần Đăng ký ca làm việc của Nhân viên.
              </p>
              <form onSubmit={handleSaveManagerNote} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Nội dung ghi chú:</label>
                  <textarea
                    value={managerNote}
                    onChange={e => setManagerNote(e.target.value)}
                    placeholder="Nhập ghi chú cho nhân viên ở đây..."
                    className="textarea w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl p-3 h-24 focus:outline-none focus:border-[#7c4831]"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary py-2.5 px-6 text-xs font-bold cursor-pointer">
                  Lưu Ghi Chú
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Biometrics */}
        {configActiveTab === "biometrics" && (
          <div className="card space-y-4 md:col-span-2 anim-fadeUp bg-white border border-gray-150">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
              <Lock size={16} className="text-[#7c4831]" /> Bảo mật thiết bị (Biometrics)
            </h3>
            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-gray-100/60 space-y-3.5 text-xs font-bold shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[#4B3621] text-xs font-bold block uppercase">Kích hoạt vân tay / Face ID trên thiết bị hiện tại</span>
                <span className="text-gray-400 font-semibold text-[10px] block normal-case leading-relaxed">
                  Đăng ký sinh trắc học thiết bị này cho tài khoản quản trị hiện tại ({currentUserPhone || "admin"}) để bỏ qua nhập mã PIN hoặc mật khẩu khi đăng nhập nhanh.
                </span>
              </div>
              <button
                type="button"
                onClick={handleRegisterBiometricDirectly}
                className="btn btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <svg className="w-4.5 h-4.5 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 .353.017.702.051 1.045l-.011-.05M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11a5 5 0 0010 0c0-.353-.017-.702-.051-1.045l.011.05M12 11V3" />
                </svg>
                <span>Kích hoạt Touch ID thiết bị này</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

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



  // === QR LOOKUP ===
  const handleQrLookup = async () => {
    if (!qrInput.trim()) {
      setQrError("Vui lòng nhập mã QR hoặc số điện thoại khách hàng!");
      return;
    }
    setQrLoading(true);
    setQrError("");
    setQrSuccess("");
    setQrLookupResult(null);

    // Try decoding the raw text as JSON or use as phone
    let qrData = qrInput.trim();
    try {
      // If it looks like URL-encoded JSON, decode it
      const decoded = decodeURIComponent(qrData);
      JSON.parse(decoded); // validate JSON
      qrData = decoded;
    } catch {
      // Not JSON, could be phone number - wrap as JSON
      if (/^[0-9]{10,11}$/.test(qrData)) {
        qrData = JSON.stringify({ phone: qrData });
      }
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/customers/lookup-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrData,
          locationId: activeLocation?.id || "govap-branch"
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        // Fallback to local context search
        const localCustomer = customers?.find((c: any) =>
          c.phone === qrInput.trim() || c.id === qrInput.trim()
        );
        if (localCustomer) {
          setQrLookupResult({
            Id: localCustomer.id || `cust-${localCustomer.phone}`,
            PhoneNumber: localCustomer.phone,
            FullName: localCustomer.name,
            Points: localCustomer.points
          });
        } else {
          setQrError(errData.message || "Không tìm thấy khách hàng!");
        }
      } else {
        const data = await response.json();
        setQrLookupResult(data.customer);
      }
    } catch {
      // Fallback to local context if API down
      const localCustomer = customers?.find((c: any) =>
        c.phone === qrInput.trim() || c.id === qrInput.trim()
      );
      if (localCustomer) {
        setQrLookupResult({
          Id: localCustomer.id || `cust-${localCustomer.phone}`,
          PhoneNumber: localCustomer.phone,
          FullName: localCustomer.name,
          Points: localCustomer.points
        });
      } else {
        setQrError("Lỗi kết nối API. Không tìm thấy khách hàng trong dữ liệu cục bộ.");
      }
    }
    setQrLoading(false);
  };

  // === ADD POINTS VIA API ===
  const handleQrAddPoints = async () => {
    if (!qrLookupResult || !qrBillAmt) return;
    const billAmount = parseInt(qrBillAmt);
    if (isNaN(billAmount) || billAmount <= 0) {
      setQrError("Số tiền hóa đơn không hợp lệ!");
      return;
    }
    setQrLoading(true);
    setQrError("");
    setQrSuccess("");

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/customers/add-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: qrLookupResult.Id,
          billAmount,
          locationId: activeLocation?.id || "govap-branch",
          staffId: "admin"
        })
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        // Fallback local
        const localResult = addPointsToCustomer(qrLookupResult.PhoneNumber, billAmount, "Admin");
        if (localResult?.success) {
          setQrSuccess(`Tích điểm thành công (cục bộ)! +${localResult.pointsAdded} điểm từ hóa đơn ${billAmount.toLocaleString("vi-VN")}đ.`);
          setQrLookupResult({ ...qrLookupResult, Points: (qrLookupResult.Points || 0) + localResult.pointsAdded });
        } else {
          setQrError(errData.message || "Không thể tích điểm!");
        }
      } else {
        const data = await response.json();
        setQrSuccess(data.message);
        setQrLookupResult({ ...qrLookupResult, Points: data.totalPoints });
        // Also sync to local context
        if (addPointsToCustomer) {
          addPointsToCustomer(qrLookupResult.PhoneNumber, billAmount, "Admin");
        }
      }
    } catch {
      // Fallback local
      const localResult = addPointsToCustomer(qrLookupResult.PhoneNumber, billAmount, "Admin");
      if (localResult?.success) {
        setQrSuccess(`Tích điểm thành công! +${localResult.pointsAdded} điểm.`);
        setQrLookupResult({ ...qrLookupResult, Points: (qrLookupResult.Points || 0) + localResult.pointsAdded });
      } else {
        setQrError("Lỗi kết nối và không thể tích điểm cục bộ.");
      }
    }
    setQrLoading(false);
    setQrBillAmt("");
  };

  // === QR SCANNER VIEW ===
  const ScanQrView = () => (
    <div className="space-y-6 anim-fadeUp text-[#4B3621]">
      <div className="border-b border-gray-200/50 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Quét QR & Khách Hàng</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Quét mã QR, quản lý điểm loyalty và danh sách khách hàng</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "scan" as const, label: "Quét QR Tích Điểm", icon: ScanLine },
          { key: "loyalty" as const, label: "Điểm Loyalty & Menu", icon: Gift },
          { key: "customers" as const, label: "Khách Hàng", icon: Users },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setQrActiveTab(t.key)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${qrActiveTab === t.key
              ? "bg-[#7c4831] text-white shadow-sm"
              : "bg-[#FAF9F6] text-[#4B3621] border border-gray-150 hover:border-[#7c4831]/30"
              }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {qrActiveTab === "scan" && (<>

        {/* QR Input Card */}
        <div className="card space-y-5">
          <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
            <ScanLine size={16} className="text-[#7c4831]" /> Nhập Mã QR / Số Điện Thoại
          </h3>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder='Dán nội dung QR hoặc nhập SĐT khách hàng (VD: 0987654321)'
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleQrLookup(); }}
                className="input w-full text-sm font-semibold pr-24"
                id="qr-input-field"
              />
              <button
                onClick={handleQrLookup}
                disabled={qrLoading}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 btn btn-primary py-1.5 px-4 text-[10px] font-bold uppercase tracking-wider"
                id="qr-lookup-btn"
              >
                {qrLoading ? <RefreshCw size={12} className="animate-spin" /> : <><Search size={12} /> Tra cứu</>}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 font-semibold">
              Hỗ trợ nhận dạng: JSON QR {`{"id":"...","phone":"..."}`}, SĐT trực tiếp, hoặc ID khách hàng.
            </p>
          </div>

          {/* Error/Success Messages */}
          {qrError && (
            <div className="p-3 bg-[#FADCD5] border border-red-200 rounded-xl text-[#7A2F1E] text-xs font-bold flex items-center gap-2 anim-fadeUp">
              <AlertTriangle size={14} /> {qrError}
            </div>
          )}
          {qrSuccess && (
            <div className="p-3 bg-[#D3ECE1] border border-emerald-200 rounded-xl text-[#1B523A] text-xs font-bold flex items-center gap-2 anim-fadeUp">
              <CheckCircle size={14} /> {qrSuccess}
            </div>
          )}
        </div>

        {/* Customer Info Card (Shown after lookup) */}
        {qrLookupResult && (
          <div className="card space-y-5 border-2 border-[#7c4831]/15 anim-fadeUp">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#7c4831]">
                <UserCheck size={16} className="text-emerald-600" /> Thông Tin Khách Hàng
              </h3>
              <button
                onClick={() => { setQrLookupResult(null); setQrInput(""); setQrBillAmt(""); setQrError(""); setQrSuccess(""); }}
                className="text-[10px] text-gray-400 hover:text-[#7c4831] font-bold uppercase tracking-wider cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Customer Profile Strip */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FAF9F6] to-[#F5EDE4] border border-[#7c4831]/10 flex items-center gap-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-[#7c4831] flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0">
                {getInitials(qrLookupResult.FullName)}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-extrabold text-base text-[#4B3621] uppercase tracking-tight truncate">{qrLookupResult.FullName}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs  font-bold text-[#7c4831]/70">{qrLookupResult.PhoneNumber}</span>
                  <span className="pill bg-[#E0F2FE] text-[#075985]  font-extrabold border border-sky-100 text-[10px]">{qrLookupResult.Points} điểm</span>
                </div>
                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wider">ID: {qrLookupResult.Id?.substring(0, 12)}...</p>
              </div>
              {/* QR Code Preview */}
              <div className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&color=7c4831&data=${encodeURIComponent(JSON.stringify({ id: qrLookupResult.Id, phone: qrLookupResult.PhoneNumber }))}`}
                  alt="QR"
                  className="w-16 h-16 rounded-lg border border-gray-100 shadow-xs"
                />
              </div>
            </div>

            {/* Bill Amount Input & Add Points */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Nhập số tiền hóa đơn để tích điểm:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <input
                    type="number"
                    placeholder="Ví dụ: 150000"
                    value={qrBillAmt}
                    onChange={e => setQrBillAmt(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleQrAddPoints(); }}
                    className="input w-full text-sm font-semibold "
                    id="qr-bill-input"
                  />
                  {qrBillAmt && parseInt(qrBillAmt) > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      +{Math.floor(parseInt(qrBillAmt) / 50000)} điểm
                    </span>
                  )}
                </div>
                <button
                  onClick={handleQrAddPoints}
                  disabled={qrLoading || !qrBillAmt}
                  className="btn btn-primary py-3 text-xs font-bold flex items-center justify-center gap-1.5"
                  id="qr-add-points-btn"
                >
                  {qrLoading ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <><Gift size={14} /> Tích Điểm</>
                  )}
                </button>
              </div>
              <p className="text-[9px] text-gray-400 font-semibold">
                Quy cách: Mỗi 50,000 VNĐ = 1 điểm tích lũy. Đủ 10 điểm = tự động nhận Voucher 55K.
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider self-center mr-1">Nhanh:</span>
              {[50000, 100000, 150000, 200000, 300000, 500000].map(amt => (
                <button
                  key={amt}
                  onClick={() => setQrBillAmt(String(amt))}
                  className={`py-1.5 px-3 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${qrBillAmt === String(amt)
                    ? "bg-[#7c4831] text-white border-[#7c4831] shadow-sm"
                    : "bg-[#FAF9F6] text-[#4B3621] border-gray-150 hover:border-[#7c4831]/30"
                    }`}
                >
                  {amt.toLocaleString("vi-VN")}đ
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Scan History from Logs */}
        <div className="card space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
            <Clock size={14} className="text-[#7c4831]" /> Lịch Sử Quét QR Gần Đây
          </h3>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {(logs || []).filter((l: any) => l.action?.includes("Tích điểm") || l.action?.includes("Quét mã")).slice(0, 10).map((l: any) => (
              <div key={l.id} className="p-3 rounded-xl bg-[#FAF9F6] border border-gray-100 text-xs flex gap-3 items-start transition-all hover:bg-white hover:border-gray-200">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 font-bold text-[9px] ${getAvatarBg(l.staffName)}`}>
                  {getInitials(l.staffName)}
                </div>
                <div className="flex-grow font-semibold">
                  <span className="text-[#4B3621]/90 leading-relaxed text-xs">{l.description}</span>
                  <p className="text-[#7c4831]/60 mt-1 text-[9px] font-medium">{l.staffName} • {l.time}</p>
                </div>
                <span className="pill bg-[#D3ECE1] text-[#1B523A] text-[8px] font-semibold shrink-0 border border-emerald-200">+ĐIỂM</span>
              </div>
            ))}
            {(logs || []).filter((l: any) => l.action?.includes("Tích điểm") || l.action?.includes("Quét mã")).length === 0 && (
              <p className="text-xs text-gray-400 italic py-6 text-center">Chưa có bản ghi quét QR tích điểm nào.</p>
            )}
          </div>
        </div>
      </>)}

      {qrActiveTab === "loyalty" && (
        <>
          {/* Edit Points */}
          <div className="card space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
              <Edit3 size={16} className="text-[#7c4831]" /> Sửa điểm khách hàng thủ công
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <input type="tel" placeholder="Số điện thoại khách *" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="input text-sm font-semibold" id="edit-phone" />
              <input type="number" placeholder="Số điểm mới *" value={editPts} onChange={e => setEditPts(e.target.value)} className="input text-sm font-semibold" id="edit-pts" />
              <button onClick={() => { if (!editPhone || !editPts) return; adjustPointsManually(editPhone.trim(), parseInt(editPts)); alert("Cập nhật số điểm thành công!"); setEditPhone(""); setEditPts(""); }}
                className="btn btn-primary py-2.5 text-xs" id="edit-pts-btn">Cập Nhật Ngay</button>
            </div>
          </div>

          {/* Menu Upload */}
          <div className="card space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
              <ImagePlus size={16} className="text-[#7c4831]" /> Cấu Hình Hình Ảnh Thực Đơn
            </h3>

            {/* Responsive grid for multi menu images */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl">
              {menuImages && menuImages.map((img: any) => (
                <div key={img.id} className="relative group border border-gray-100 rounded-2xl overflow-hidden shadow-xs bg-gray-50 flex flex-col">
                  <div className="relative aspect-square w-full overflow-hidden bg-white">
                    <img src={img.url} alt="Menu thumbnail" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("Bạn có chắc chắn muốn xóa hình ảnh thực đơn này?")) {
                          const updated = menuImages.filter((item: any) => item.id !== img.id);
                          updateMenuImages(updated);
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-90 transition-all hover:scale-105"
                      title="Xóa ảnh"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="p-2.5 flex items-center gap-2 border-t border-gray-100 bg-white">
                    <input
                      type="checkbox"
                      checked={img.active}
                      onChange={(e) => {
                        const updated = menuImages.map((item: any) =>
                          item.id === img.id ? { ...item, active: e.target.checked } : item
                        );
                        updateMenuImages(updated);
                      }}
                      className="w-4 h-4 rounded-sm border-gray-300 text-[#7c4831] focus:ring-[#7c4831]"
                      id={`check-qr-${img.id}`}
                    />
                    <label htmlFor={`check-qr-${img.id}`} className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                      Hoạt động
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 max-w-lg">
              <label className="text-xs font-bold text-gray-500 uppercase">Tải các tệp hình ảnh thực đơn lên trực tiếp (Chọn nhiều ảnh):</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => {
                  const files = e.target.files;
                  if (files && files.length > 0) {
                    const promises = Array.from(files).map(file => {
                      return new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          if (typeof reader.result === "string") {
                            resolve(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    });
                    Promise.all(promises).then(urls => {
                      const newItems = urls.map((url, idx) => ({
                        id: `menu-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
                        url,
                        active: true
                      }));
                      updateMenuImages([...(menuImages || []), ...newItems]);
                      alert("Tải lên các hình ảnh thực đơn thành công!");
                    });
                  }
                }}
                className="input w-full text-xs font-semibold cursor-pointer"
                id="menu-file-qr"
              />
            </div>
          </div>
        </>
      )}

      {qrActiveTab === "customers" && (
        <div className="card space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
            <Users size={16} className="text-[#7c4831]" /> Danh Sách Khách Hàng Đăng Ký ({customers?.length || 0})
          </h3>
          <div className="space-y-3">
            {(customers || []).map((c: any) => (
              <div key={c.phone} className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-gray-100 text-sm flex justify-between items-center shadow-xs transition-all hover:bg-white">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[10px] shadow-xs border ${getAvatarBg(c.name)}`}>
                    {getInitials(c.name)}
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-[#4B3621] uppercase tracking-tight">{c.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{c.phone} • {c.email}</p>
                  </div>
                </div>
                <span className="pill bg-[#E0F2FE] text-[#075985]  font-extrabold border border-sky-100">{c.points}đ</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPage = () => {
    if (locked) return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-5 anim-fadeUp py-16">
        <div className="w-16 h-16 rounded-full bg-[#FADCD5] flex items-center justify-center shadow-sm border border-red-200">
          <Settings size={26} className="text-[#7A2F1E]" />
        </div>
        <h3 className="text-xl font-extrabold uppercase text-[#4B3621] tracking-tight">Vận Hành Bị Khóa</h3>
        <p className="text-xs text-[#4B3621]/70 max-w-sm font-semibold leading-relaxed">
          Thương hiệu hiện đang bị khóa tạm ngưng vận hành do thuê bao gói SaaS quá hạn thanh toán. Vui lòng liên hệ nhà quản trị tối cao.
        </p>
        <button onClick={handleLogout} className="btn btn-ghost py-3 px-6 text-xs flex items-center gap-2 shadow-xs"><LogOut size={14} /> Đăng xuất tài khoản</button>
      </div>
    );
    switch (page) {
      case "scanqr": return ScanQrView();
      case "staff": {
        const filteredStaff = staffList.filter((s: any) => s.roleId === 3);
        return (
          <div className="space-y-5 anim-fadeUp text-[#4B3621]">
            <div className="border-b border-gray-200/50 pb-3">
              <h2 className="text-xl font-bold uppercase tracking-tight text-[#7c4831]">Quản Lý Nhân Sự</h2>
              <p className="text-[10px] font-bold text-[#7c4831]/60 uppercase mt-0.5">Thêm mới và xem danh sách nhân sự của chi nhánh</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Add Staff Form */}
              <div className="card p-4 space-y-3 h-fit border border-gray-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[#7c4831]">
                  <Plus size={14} className="text-[#7c4831]" /> Thêm Nhân Viên Mới
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
                      className="input w-full py-1.5 px-3 text-xs font-semibold bg-white"
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
                      className="input w-full py-1.5 px-3 text-xs font-semibold bg-white"
                      id="new-staff-phone"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Vai Trò / Quyền Hạn</label>
                    <div className="input w-full py-1.5 px-3 text-xs font-semibold bg-gray-50/50 border border-gray-150 rounded-xl text-gray-500 select-none">
                      Nhân viên (Staff)
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Lương theo giờ (VNĐ/giờ) *</label>
                    <input
                      type="number"
                      placeholder="Ví dụ: 25000"
                      required
                      value={newStaffWage}
                      onChange={e => setNewStaffWage(e.target.value)}
                      className="input w-full py-1.5 px-3 text-xs font-semibold bg-white"
                      id="new-staff-wage"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Kỹ năng làm việc</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[#FAF9F6] border border-gray-150 rounded-xl max-h-[100px] overflow-y-auto">
                      {skillsList.map((sk: any) => {
                        const isChecked = selectedNewStaffSkills.includes(sk.id);
                        return (
                          <label key={sk.id} className="flex items-center gap-1.5 bg-white border border-gray-150 px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedNewStaffSkills(selectedNewStaffSkills.filter(id => id !== sk.id));
                                } else {
                                  setSelectedNewStaffSkills([...selectedNewStaffSkills, sk.id]);
                                }
                              }}
                              className="rounded text-[#7c4831] focus:ring-[#7c4831] w-3 h-3 cursor-pointer"
                            />
                            <span>{sk.name}</span>
                          </label>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      <input
                        type="text"
                        placeholder="Thêm kỹ năng..."
                        value={newSkillInput}
                        onChange={e => setNewSkillInput(e.target.value)}
                        className="input flex-grow py-1 px-2 text-[10px] font-semibold bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreateSkillInline}
                        className="px-2.5 py-1 bg-[#7c4831] hover:bg-[#7c4831]/90 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        + Thêm
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={staffLoading}
                    className="btn btn-primary py-2.5 text-xs w-full mt-1 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {staffLoading ? <RefreshCw size={12} className="animate-spin" /> : <><Plus size={13} /> Đăng Ký Nhân Sự</>}
                  </button>
                </form>
              </div>

              {/* Staff List */}
              <div className="lg:col-span-2 card p-4 space-y-3 border border-gray-100 bg-white">
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[#7c4831]">
                  <Users size={14} className="text-[#7c4831]" /> Danh Sách Nhân Viên ({filteredStaff.length})
                </h3>
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[11px] text-gray-400 italic">Chưa có nhân viên nào được tải hoặc chưa được tạo.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {filteredStaff.map((staff: any) => {
                      const isEditing = editingStaffId === staff.id;
                      if (isEditing) {
                        return (
                          <div key={staff.id} className="p-3 rounded-xl bg-white border border-[#7c4831]/40 space-y-3.5 shadow-sm">
                            <div className="space-y-2">
                              <div>
                                <label className="text-[9px] font-black uppercase text-[#7c4831] block">Họ và tên</label>
                                <input
                                  type="text"
                                  value={editStaffName}
                                  onChange={e => setEditStaffName(e.target.value)}
                                  className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-[#7c4831] block">Số điện thoại</label>
                                <input
                                  type="text"
                                  value={editStaffPhone}
                                  onChange={e => setEditStaffPhone(e.target.value)}
                                  className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-[#7c4831] block">Lương/giờ</label>
                                <input
                                  type="number"
                                  value={editStaffWage}
                                  onChange={e => setEditStaffWage(e.target.value)}
                                  className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-[#7c4831] block">Kỹ năng làm việc</label>
                                <div className="flex flex-wrap gap-1.5 p-2 bg-[#FAF9F6] border border-gray-150 rounded-xl max-h-[100px] overflow-y-auto mt-0.5">
                                  {skillsList.map((sk: any) => {
                                    const isChecked = selectedEditStaffSkills.includes(sk.id);
                                    return (
                                      <label key={sk.id} className="flex items-center gap-1.5 bg-white border border-gray-150 px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => {
                                            if (isChecked) {
                                              setSelectedEditStaffSkills(selectedEditStaffSkills.filter(id => id !== sk.id));
                                            } else {
                                              setSelectedEditStaffSkills([...selectedEditStaffSkills, sk.id]);
                                            }
                                          }}
                                          className="rounded text-[#7c4831] focus:ring-[#7c4831] w-3 h-3 cursor-pointer"
                                        />
                                        <span>{sk.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-1.5 mt-1.5">
                                  <input
                                    type="text"
                                    placeholder="Thêm kỹ năng..."
                                    value={newSkillInput}
                                    onChange={e => setNewSkillInput(e.target.value)}
                                    className="input flex-grow py-1 px-2 text-[10px] font-semibold bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleCreateSkillInline}
                                    className="px-2.5 py-1 bg-[#7c4831] hover:bg-[#7c4831]/90 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
                                  >
                                    + Thêm
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1 justify-between items-center">
                              <button
                                type="button"
                                onClick={() => handleSetResigned(staff.id)}
                                className="btn btn-danger py-1 px-2.5 text-[10px] font-bold shadow-xs mr-auto cursor-pointer"
                              >
                                Cho nghỉ việc
                              </button>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingStaffId(null)}
                                  className="btn btn-ghost py-1 px-2.5 text-[10px] font-bold border border-gray-200 cursor-pointer"
                                >
                                  Hủy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStaff(staff.id)}
                                  className="btn btn-primary py-1 px-3 text-[10px] font-bold cursor-pointer"
                                >
                                  Lưu
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-extrabold text-xs text-[#4B3621] uppercase tracking-tight">{staff.fullName}</p>
                                {staff.skills && staff.skills.map((sk: any) => (
                                  <span key={sk.id} className="px-1 py-0.5 bg-[#7c4831]/10 text-[#7c4831] text-[8px] rounded font-extrabold uppercase leading-none">{sk.name}</span>
                                ))}
                              </div>
                              <p className="text-[10px] font-semibold text-gray-400 mt-0.5">
                                {staff.phoneNumber || staff.phone} • <span className="text-emerald-700 font-bold">{staff.hourlyWage ? staff.hourlyWage.toLocaleString("vi-VN") : "0"}đ/giờ</span>
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
                                setSelectedEditStaffSkills(staff.skills ? staff.skills.map((sk: any) => sk.id) : []);
                              }}
                              className="btn btn-ghost py-1 px-2 text-[10px] font-bold border border-gray-250 hover:bg-gray-100 cursor-pointer"
                            >
                              Sửa
                            </button>
                            <span className="pill bg-amber-50 text-amber-700 border-amber-100 font-black text-[8px] border">
                              STAFF
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
      case "promos": return PromosView();
      case "adjustments": return AdjustmentsView();
      case "schedule": return SchedView();
      case "payroll": return AdjustmentsView();
      case "requests": return ReqsView();
      case "loyalty": return ScanQrView();
      case "feedback": return FeedbackView();
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
      {/* Notifications Panel */}
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png?v=5" alt="Logo" className="w-6 h-6 object-contain" />
                </span>
                <span className="text-sm font-extrabold uppercase tracking-tight text-[#7c4831]">Quản trị quán</span>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png?v=5" alt="Logo" className="w-6 h-6 object-contain" />
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
              id={`admin-nav-${key}`}
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png?v=5" alt="Logo" className="w-[30px] h-[30px]" style={{ borderRadius: "100%" }} />
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-tight text-[#7c4831] block leading-none">Quản trị quán</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-0.5 block leading-none">THE MOODS</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNotification(true)}
              className="p-2.5 text-[#7c4831] hover:bg-[#7c4831]/5 rounded-xl transition-all relative"
            >
              <Bell size={18} />
              {(notifications?.filter((n: any) => !n.isRead).length || 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[7px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse border border-white">
                  {notifications.filter((n: any) => !n.isRead).length}
                </span>
              )}
            </button>
          </div>
        </header>

        <PullToRefresh onRefresh={handleRefreshAll}>
          <div className="flex-grow p-4 md:p-8 w-full  mx-auto pb-12">
            {renderPage()}
          </div>
        </PullToRefresh>

        {/* Penalty History Modal */}
        {showPenaltyModal && selectedPenaltyEmployee && (() => {
          const selectedEmpPenalties = adjustmentsList
            ? adjustmentsList.filter((a: any) => a.EmployeeId === selectedPenaltyEmployee.userId && a.Type === "penalty")
            : [];
          const selectedEmpBonuses = adjustmentsList
            ? adjustmentsList.filter((a: any) => a.EmployeeId === selectedPenaltyEmployee.userId && a.Type === "bonus")
            : [];
          const selectedEmpAdvances = adjustmentsList
            ? adjustmentsList.filter((a: any) => a.EmployeeId === selectedPenaltyEmployee.userId && a.Type === "advance")
            : [];
          const selectedEmpLateLogs = officialSchedulesList
            ? officialSchedulesList
              .filter((s: any) => s.userId === selectedPenaltyEmployee.userId && s.checkInTime)
              .map((s: any) => {
                const startParts = s.startTime.split(":");
                const realParts = s.checkInTime.split(":");
                const startMin = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                const realMin = parseInt(realParts[0]) * 60 + parseInt(realParts[1]);
                let lateMin = 0;
                if (realMin > startMin) {
                  lateMin = realMin - startMin;
                } else if (startMin - realMin > 720) {
                  lateMin = (realMin + 1440) - startMin;
                }
                return { ...s, lateMin };
              })
              .filter((s: any) => s.lateMin > 0)
            : [];
          const selectedEmpHolidayBonuses = officialSchedulesList
            ? officialSchedulesList
              .filter((s: any) => s.userId === selectedPenaltyEmployee.userId && s.clockedOut && s.checkInTime)
              .map((s: any) => {
                const matchedHoliday = detailedHolidaysList.find((h: any) => h.Date === s.date);
                if (!matchedHoliday) return null;
                const mult = matchedHoliday.Multiplier > 0 ? matchedHoliday.Multiplier : 2.0;
                const flat = matchedHoliday.FlatBonus || 0;
                if (mult <= 1.0 && flat === 0) return null;

                const staff = staffList.find((emp: any) => emp.id === s.userId);
                const hourlyWage = staff ? staff.hourlyWage : 25000;

                const [sh, sm] = s.startTime.split(":").map(Number);
                let [eh, em] = s.endTime.split(":").map(Number);
                if (eh < sh) eh += 24;

                let actualHours = 0;
                if (s.checkInTime && s.checkOutTime) {
                  const [ciH, ciM] = s.checkInTime.split(":").map(Number);
                  let [coH, coM] = s.checkOutTime.split(":").map(Number);
                  const schedEndMins = eh * 60 + em;
                  const checkInMins = ciH * 60 + ciM;
                  let checkOutMins = coH * 60 + coM;
                  if (checkOutMins < checkInMins) {
                    checkOutMins += 1440;
                  }
                  const limitOutMins = checkOutMins > schedEndMins ? schedEndMins : checkOutMins;
                  actualHours = (limitOutMins - checkInMins) / 60;
                  if (actualHours < 0) actualHours = 0;
                } else {
                  actualHours = (eh * 60 + em - (sh * 60 + sm)) / 60;
                }

                const extraMultSalary = Math.round(actualHours * hourlyWage * (mult - 1));
                const amount = extraMultSalary + flat;

                if (amount <= 0) return null;

                return {
                  date: s.date,
                  holidayName: matchedHoliday.Note,
                  multiplier: mult,
                  flatBonus: flat,
                  amount: amount,
                  startTime: s.startTime,
                  endTime: s.endTime
                };
              })
              .filter(Boolean)
            : [];
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#4B3621]/45 backdrop-blur-xs">
              <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-100 anim-scaleIn space-y-4 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#7c4831] flex items-center gap-1.5">
                      <Award size={16} /> Lịch Sử Thưởng & Phạt Nhân Viên
                    </h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">{selectedPenaltyEmployee.fullName} ({selectedPenaltyEmployee.phoneNumber})</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowPenaltyModal(false); setSelectedPenaltyEmployee(null); }}
                    className="text-gray-455 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* 1. Bonuses Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#7c4831] border-b border-gray-100 pb-1">
                      🎁 Khoản thưởng
                    </h4>
                    {selectedEmpBonuses.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Không ghi nhận khoản thưởng thủ công.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpBonuses.map((a: any, idx: number) => (
                          <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-emerald-800">
                              <span>{a.Note || "Thưởng nóng"}</span>
                              <span>+{a.Amount?.toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                              <span>Ngày: {a.Date}</span>
                              <span>{a.Unit === "lan" ? `Số lần: ${a.Quantity} x ${a.AmountPerUnit?.toLocaleString("vi-VN")}đ` : "Số tiền cố định"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 1b. Holiday Work Bonuses Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#7c4831] border-b border-gray-100 pb-1">
                      🎉 Thưởng đi làm ngày lễ (Hệ số & thưởng thêm)
                    </h4>
                    {selectedEmpHolidayBonuses.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Không ghi nhận thưởng đi làm ngày lễ.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpHolidayBonuses.map((h: any, idx: number) => (
                          <div key={idx} className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-amber-800">
                              <span>Đi làm ngày lễ: {h.holidayName} ({h.startTime} - {h.endTime})</span>
                              <span>+{h.amount?.toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                              <span>Ngày: {h.date}</span>
                              <span>Hệ số: x{h.multiplier}{h.flatBonus > 0 ? ` + ${h.flatBonus.toLocaleString("vi-VN")}đ` : ""}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Late Penalty Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#7c4831] border-b border-gray-100 pb-1">
                      🕒 Vi phạm đi trễ (Dựa trên Clock-in)
                    </h4>
                    {selectedEmpLateLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Không ghi nhận đi trễ.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpLateLogs.map((sched: any) => (
                          <div key={sched.id} className="p-3 bg-red-50/50 border border-red-100/50 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-[#7A2F1E]">
                              <span>Điểm danh trễ ca {sched.startTime} - {sched.endTime}</span>
                              <span className="font-mono">({sched.checkInTime})</span>
                            </div>
                            <p className="text-gray-600 font-semibold">Ngày: {sched.date} - Ghi nhận trễ {sched.lateMin} phút.</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Individual Adjustments Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#7c4831] border-b border-gray-150 pb-1">
                      💸 Khoản phạt
                    </h4>
                    {selectedEmpPenalties.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Không ghi nhận khoản phạt thủ công.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpPenalties.map((a: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-[#4B3621]">
                              <span>{a.Note || "Phạt hành chính"}</span>
                              <span className="text-red-600 ">-{a.Amount?.toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                              <span>Ngày: {a.Date}</span>
                              <span>{a.Unit === "he_so" ? `Hệ số: ${a.Quantity} x ${a.AmountPerUnit?.toLocaleString("vi-VN")}đ` : "Số tiền cố định"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Salary Advance Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#7c4831] border-b border-gray-150 pb-1">
                      💰 Khoản tạm ứng lương
                    </h4>
                    {selectedEmpAdvances.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Không ghi nhận tạm ứng lương.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpAdvances.map((a: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-[#4B3621]">
                              <span>{a.Note || "Tạm ứng lương"}</span>
                              <span className="text-amber-700 ">-{a.Amount?.toLocaleString("vi-VN")}đ</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                              <span>Ngày: {a.Date}</span>
                              <span>Số tiền cố định</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary Section */}
                  <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs font-extrabold uppercase">
                    <div className="flex justify-between items-center text-emerald-700">
                      <span>Tổng tiền thưởng:</span>
                      <span>+{selectedPenaltyEmployee.totalBonus?.toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span>Tổng khấu trừ phạt:</span>
                      <span>-{selectedPenaltyEmployee.totalPenalty?.toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-700">
                      <span>Tổng tạm ứng:</span>
                      <span>-{selectedPenaltyEmployee.totalAdvance?.toLocaleString("vi-VN") || 0}đ</span>
                    </div>
                    <div className="flex justify-between items-center text-[#7c4831] border-t border-dashed border-gray-200 pt-1.5">
                      <span>Thực lĩnh điều chỉnh:</span>
                      <span className="text-base font-black">
                        {(selectedPenaltyEmployee.totalBonus - selectedPenaltyEmployee.totalPenalty - (selectedPenaltyEmployee.totalAdvance || 0)) >= 0 ? "+" : ""}
                        {(selectedPenaltyEmployee.totalBonus - selectedPenaltyEmployee.totalPenalty - (selectedPenaltyEmployee.totalAdvance || 0))?.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => { setShowPenaltyModal(false); setSelectedPenaltyEmployee(null); }}
                    className="btn btn-primary w-full py-2.5 text-xs font-bold"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          );
        })()}


      </main>
    </div>
  );
}
