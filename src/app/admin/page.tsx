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
  const [weekOffset, setWeekOffset] = useState(0); // 0 = tuáº§n nÃ y, 1 = tuáº§n sau
  const [showSchedModal, setShowSchedModal] = useState(false);
  const [editingSchedId, setEditingSchedId] = useState<string | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState("");

  const handleCreateOrUpdateSchedule = async () => {
    if (!schedStartTime || !schedEndTime) {
      alert("Vui lÃ²ng chá»n giá» báº¯t Ä‘áº§u vÃ  káº¿t thÃºc!");
      return;
    }

    if (editingSchedId) {
      if (selectedScheduleStaffIds.length === 0) {
        alert("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t nhÃ¢n sá»± Ä‘á»ƒ xáº¿p ca!");
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
          alert(data.message || "Cáº­p nháº­t ca trá»±c tháº¥t báº¡i!");
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
            alert(`Cáº­p nháº­t thÃ nh cÃ´ng. Tuy nhiÃªn, Ä‘Ã£ xáº£y ra lá»—i khi thÃªm ${failed.length} nhÃ¢n viÃªn khÃ¡c.`);
          } else {
            alert("Cáº­p nháº­t lá»‹ch trá»±c thÃ nh cÃ´ng!");
          }
        } else {
          alert("Cáº­p nháº­t lá»‹ch trá»±c thÃ nh cÃ´ng!");
        }

        fetchOfficialSchedules();
        setShowSchedModal(false);
        setEditingSchedId(null);
      } catch (err) {
        console.error(err);
        alert("Lá»—i káº¿t ná»‘i khi cáº­p nháº­t ca trá»±c!");
      }
    } else {
      // Creating new schedule(s)
      if (selectedScheduleStaffIds.length === 0) {
        alert("Vui lÃ²ng chá»n Ã­t nháº¥t má»™t nhÃ¢n sá»± Ä‘á»ƒ xáº¿p ca!");
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
          alert("Xáº¿p  chÃ­nh thá»©c thÃ nh cÃ´ng cho cÃ¡c nhÃ¢n viÃªn Ä‘Ã£ chá»n!");
        } else {
          alert(`Xáº¿p ca hoÃ n táº¥t vá»›i ${failed.length} ca tháº¥t báº¡i (do Ä‘Ã£ tá»“n táº¡i lá»‹ch hoáº·c lá»—i).`);
        }

        fetchOfficialSchedules();
        setShowSchedModal(false);
        setEditingSchedId(null);
      } catch (err) {
        console.error(err);
        alert("Lá»—i káº¿t ná»‘i khi xáº¿p ca!");
      }
    }
  };

  const handleDeleteSchedule = async (schedId: string) => {
    if (!confirm("Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a lá»‹ch trá»±c nÃ y?")) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/schedules/${schedId}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("XÃ³a lá»‹ch trá»±c thÃ nh cÃ´ng!");
        fetchOfficialSchedules();
        setShowSchedModal(false);
        setEditingSchedId(null);
      } else {
        alert(data.message || "XÃ³a lá»‹ch trá»±c tháº¥t báº¡i!");
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i!");
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
  const [managerNote, setManagerNote] = useState("ChÃºc má»i ngÆ°á»i má»™t tuáº§n lÃ m viá»‡c vui váº»!");
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
        // ChÆ°a Ä‘Äƒng nháº­p, Ä‘Ã¡ vÄƒng ra trang chá»§ (login)
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
        attribution: "Â© OpenStreetMap contributors"
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
      alert("Thiáº¿t láº­p sinh tráº¯c há»c yÃªu cáº§u káº¿t ná»‘i báº£o máº­t HTTPS (hoáº·c localhost).");
      return;
    }
    if (!navigator.credentials) {
      alert("Thiáº¿t bá»‹ hoáº·c trÃ¬nh duyá»‡t cá»§a báº¡n khÃ´ng há»— trá»£ báº£o máº­t sinh tráº¯c há»c Touch ID!");
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

        // Gá»i API setup-biometric
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
        alert("KÃ­ch hoáº¡t sinh tráº¯c há»c (vÃ¢n tay) thÃ nh cÃ´ng cho thiáº¿t bá»‹ nÃ y!");
      }
    } catch (err: any) {
      console.error(err);
      alert("KÃ­ch hoáº¡t sinh tráº¯c há»c khÃ´ng thÃ nh cÃ´ng: " + (err.message || ""));
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
          addr = addr.replace(/, Viá»‡t Nam$/g, "");
          setAddressSearchQuery(addr);
        }
      }
    } catch (err) {
      console.error("Failed to reverse geocode:", err);
    }
  };

  const fetchStaff = async () => {
    try {
      // Staff-per-Branch: lá»c Staff theo Branch hiá»‡n táº¡i
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
        alert("Cáº­p nháº­t cáº¥u hÃ¬nh tÃ­nh lÆ°Æ¡ng thÃ nh cÃ´ng!");
        fetchHrmConfigs();
      } else {
        alert("KhÃ´ng thá»ƒ cáº­p nháº­t cáº¥u hÃ¬nh!");
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i khi cáº­p nháº­t cáº¥u hÃ¬nh!");
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
        alert("Cáº­p nháº­t ghi chÃº cá»§a quáº£n lÃ½ thÃ nh cÃ´ng!");
        fetchHrmConfigs();
      } else {
        alert("KhÃ´ng thá»ƒ cáº­p nháº­t ghi chÃº!");
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i khi cáº­p nháº­t ghi chÃº!");
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
          alert("KhÃ´ng tÃ¬m tháº¥y Ä‘á»‹a chá»‰ nÃ y. Vui lÃ²ng nháº­p chi tiáº¿t hÆ¡n!");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i khi káº¿t ná»‘i dá»‹ch vá»¥ báº£n Ä‘á»“!");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleGetCurrentLocation = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("TrÃ¬nh duyá»‡t cá»§a báº¡n khÃ´ng há»— trá»£ Ä‘á»‹nh vá»‹ GPS!");
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
      alert("ÄÃ£ láº¥y vá»‹ trÃ­ hiá»‡n táº¡i thÃ nh cÃ´ng!");
    };

    const errorCallback = (error: any) => {
      console.warn("High accuracy geolocation failed, trying fallback...", error);
      // Fallback: try with enableHighAccuracy: false
      navigator.geolocation.getCurrentPosition(
        successCallback,
        (fallbackError) => {
          console.error("Fallback geolocation also failed:", fallbackError);
          if (fallbackError.code === 1) {
            alert("TrÃ¬nh duyá»‡t tá»« chá»‘i quyá»n truy cáº­p GPS. Vui lÃ²ng cáº¥p quyá»n á»Ÿ thanh Ä‘á»‹a chá»‰!");
          } else if (fallbackError.code === 2) {
            alert("Vá»‹ trÃ­ khÃ´ng kháº£ dá»¥ng. TrÃ¬nh duyá»‡t PC (cáº¯m dÃ¢y LAN) khÃ´ng cÃ³ Wi-Fi/GPS cÃ³ thá»ƒ gáº·p lá»—i nÃ y. Báº¡n cÃ³ thá»ƒ kÃ©o tháº£ ghim trÃªn báº£n Ä‘á»“ Ä‘á»ƒ chá»n thá»§ cÃ´ng nhÃ©!");
          } else if (fallbackError.code === 3) {
            alert("YÃªu cáº§u láº¥y vá»‹ trÃ­ háº¿t thá»i gian chá» (Timeout). Báº¡n hÃ£y thá»­ láº¡i hoáº·c kÃ©o tháº£ ghim trÃªn báº£n Ä‘á»“ nhÃ©!");
          } else {
            alert("KhÃ´ng thá»ƒ Ä‘á»‹nh vá»‹ tá»± Ä‘á»™ng. Vui lÃ²ng kÃ©o tháº£ ghim trÃªn báº£n Ä‘á»“ Ä‘á»ƒ chá»n tá»a Ä‘á»™ quÃ¡n nhÃ©!");
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
      alert("Vui lÃ²ng nháº­p ngÃ y vÃ  ghi chÃº ngÃ y lá»…!");
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
          { configKey: "Holidays_Detailed", configValue: JSON.stringify(updated), description: "Danh sÃ¡ch ngÃ y lá»… chi tiáº¿t cÃ³ ghi chÃº (JSON)" }
        ])
      });
      if (res.ok) {
        alert("ThÃªm ngÃ y lá»… thÃ nh cÃ´ng!");
        setNewHolidayDate("");
        setNewHolidayNote("");
        setNewHolidayMultiplier("2.0");
        setNewHolidayFlatBonus("0");
        fetchHrmConfigs();
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i!");
    }
  };

  const handleDeleteDetailedHoliday = async (holidayIndex: number) => {
    if (!confirm("Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a ngÃ y lá»… nÃ y?")) return;
    const updated = detailedHolidaysList.filter((_, idx) => idx !== holidayIndex);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { configKey: "Holidays_Detailed", configValue: JSON.stringify(updated), description: "Danh sÃ¡ch ngÃ y lá»… chi tiáº¿t cÃ³ ghi chÃº (JSON)" }
        ])
      });
      if (res.ok) {
        alert("XÃ³a ngÃ y lá»… thÃ nh cÃ´ng!");
        fetchHrmConfigs();
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i!");
    }
  };
  const handleAddAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdjEmployeeId) {
      alert("Vui lÃ²ng chá»n nhÃ¢n viÃªn!");
      return;
    }
    if (!newAdjNote.trim()) {
      alert("Vui lÃ²ng Ä‘iá»n ghi chÃº lÃ½ do!");
      return;
    }

    const emp = staffList.find((s: any) => s.id === newAdjEmployeeId);
    const empName = emp ? emp.fullName : "NhÃ¢n viÃªn";

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
          { configKey: "Adjustments", configValue: JSON.stringify(updated), description: "Danh sÃ¡ch thÆ°á»Ÿng pháº¡t riÃªng cá»§a nhÃ¢n viÃªn (JSON)" }
        ])
      });
      if (res.ok) {
        alert(editingAdjIndex !== null ? "Cáº­p nháº­t khoáº£n thÆ°á»Ÿng/pháº¡t thÃ nh cÃ´ng!" : "ThÃªm khoáº£n thÆ°á»Ÿng/pháº¡t thÃ nh cÃ´ng!");
        setNewAdjNote("");
        setEditingAdjIndex(null);
        fetchHrmConfigs();
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i!");
    }
  };

  const handleDeleteAdjustment = async (adjIndex: number) => {
    if (!confirm("Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a khoáº£n thÆ°á»Ÿng/pháº¡t nÃ y?")) return;
    const updated = adjustmentsList.filter((_, idx) => idx !== adjIndex);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { configKey: "Adjustments", configValue: JSON.stringify(updated), description: "Danh sÃ¡ch thÆ°á»Ÿng pháº¡t riÃªng cá»§a nhÃ¢n viÃªn (JSON)" }
        ])
      });
      if (res.ok) {
        alert("XÃ³a khoáº£n thÆ°á»Ÿng/pháº¡t thÃ nh cÃ´ng!");
        fetchHrmConfigs();
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i!");
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
        alert(nextState ? "ÄÃ£ khÃ³a cá»•ng Ä‘Äƒng kÃ½ ca ráº£nh cá»§a nhÃ¢n viÃªn!" : "ÄÃ£ má»Ÿ cá»•ng Ä‘Äƒng kÃ½ ca ráº£nh cho nhÃ¢n viÃªn!");
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i khi thay Ä‘á»•i tráº¡ng thÃ¡i cá»•ng!");
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
        alert(data.message || "Táº¡o ká»¹ nÄƒng tháº¥t báº¡i!");
      }
    } catch (err) {
      console.error(err);
      alert("Lá»—i káº¿t ná»‘i khi táº¡o ká»¹ nÄƒng!");
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
      alert("Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ Sá»‘ Ä‘iá»‡n thoáº¡i vÃ  Há» tÃªn!");
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
        alert("ÄÄƒng kÃ½ nhÃ¢n sá»± thÃ nh cÃ´ng!");
        setNewStaffPhone("");
        setNewStaffName("");
        setNewStaffWage("25000");
        setSelectedNewStaffSkills([]);
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

  const handleUpdateStaff = async (staffId: string) => {
    if (!editStaffName.trim() || !editStaffPhone.trim() || !editStaffWage) {
      alert("Vui lÃ²ng nháº­p Ä‘áº§y Ä‘á»§ thÃ´ng tin!");
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
        alert("Cáº­p nháº­t thÃ´ng tin nhÃ¢n viÃªn thÃ nh cÃ´ng!");
        setEditingStaffId(null);
        setSelectedEditStaffSkills([]);
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
    if (!confirm("Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n cho nhÃ¢n viÃªn nÃ y nghá»‰ viá»‡c? NhÃ¢n viÃªn sáº½ bá»‹ áº©n khá»i danh sÃ¡ch vÃ  báº£ng lÆ°Æ¡ng.")) {
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
      alert("Lá»—i káº¿t ná»‘i!");
    }
  };

  const menuItems = [
    { key: "dashboard", icon: LayoutDashboard, label: "Tá»•ng quan" },
    { key: "scanqr", icon: ScanLine, label: "QuÃ©t QR" },
    { key: "staff", icon: Users, label: "NhÃ¢n viÃªn" },
    { key: "adjustments", icon: DollarSign, label: "TÃ­nh lÆ°Æ¡ng" },
    { key: "promos", icon: Megaphone, label: "Khuyáº¿n mÃ£i" },
    { key: "schedule", icon: Calendar, label: "Lá»‹ch trá»±c" },
    { key: "requests", icon: FileCheck, label: "Duyá»‡t Ä‘Æ¡n" },
    { key: "feedback", icon: MessageSquare, label: "Ã kiáº¿n gÃ³p Ã½" },
    { key: "config", icon: Settings, label: "Cáº¥u hÃ¬nh" },
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
      { label: "Tá»•ng KhÃ¡ch HÃ ng", value: totalCust, icon: Users, subText: "+4.2% so vá»›i thÃ¡ng trÆ°á»›c", subClass: "text-emerald-600" },
      { label: "Tá»•ng Äiá»ƒm TÃ­ch LÅ©y", value: totalPts, icon: TrendingUp, subText: "+8.5% so vá»›i thÃ¡ng trÆ°á»›c", subClass: "text-emerald-600" },
      { label: "ÄÆ¡n Chá» XÃ©t Duyá»‡t", value: pendingReqs, icon: FileCheck, subText: "YÃªu cáº§u cáº§n giáº£i quyáº¿t", subClass: pendingReqs > 0 ? "text-[#7A2F1E]" : "text-gray-400" },
      { label: "Sá»‘ Ca Trá»±c Tuáº§n", value: totalShifts, icon: Calendar, subText: "ÄÃ£ phÃ¢n bá»• ca trá»±c", subClass: "text-gray-400" },
    ];

    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#4B3621]">
              Tá»•ng quan váº­n hÃ nh
            </h2>
            <p className="text-xs text-[#7c4831]/80 mt-1">
              Chuá»—i: {activeBrand ? activeBrand.name.split(" - ")[0] : "The Moods"} â€¢ Chi nhÃ¡nh: {activeLocation ? (activeLocation.name.split(" - ")[1] || activeLocation.name) : "ToÃ n há»‡ thá»‘ng"}
            </p>
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
                <span className="text-[9px] font-semibold text-[#7c4831]/60">Sá»‘ liá»‡u</span>
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
                <Clock size={14} className="text-[#7c4831]" /> Nháº­t kÃ½ hoáº¡t Ä‘á»™ng
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
                      <p className="text-[#7c4831]/60 mt-1 text-[9px] font-medium">{l.staffName} â€¢ {l.time}</p>
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
                <TrendingUp size={14} className="text-[#7c4831]" /> Máº­t Ä‘á»™ giao dá»‹ch trong tuáº§n
              </h3>
              <p className="text-xs text-[#4B3621]/80 leading-relaxed mt-2.5">
                Thá»‘ng kÃª lÆ°á»£ng giao dá»‹ch tÃ­ch Ä‘iá»ƒm cá»§a khÃ¡ch hÃ ng táº¡i chi nhÃ¡nh theo khung giá» trong tuáº§n.
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
                <span>ThÆ°a thá»›t</span>
                <div className="w-16 h-1.5 bg-gradient-to-r from-[#FAF9F6] to-[#7c4831] border border-gray-100 rounded-full" />
                <span>ÄÃ´ng Ä‘Ãºc</span>
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
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Khuyáº¿n MÃ£i & Báº£n Tin</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Táº¡o cÃ¡c bÃ i viáº¿t Æ°u Ä‘Ã£i má»›i nháº¥t trÃªn thiáº¿t bá»‹ khÃ¡ch hÃ ng</p>
      </div>

      <form onSubmit={e => { e.preventDefault(); if (!promoTitle) return; addPromotion(promoTitle, promoDesc, promoImg, promoExpiry || undefined); alert("ÄÄƒng táº£i chiáº¿n dá»‹ch khuyáº¿n mÃ£i thÃ nh cÃ´ng!"); setPromoTitle(""); setPromoDesc(""); setPromoExpiry(""); }} className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <Plus size={16} className="text-[#7c4831]" /> Táº¡o ChÆ°Æ¡ng TrÃ¬nh Má»›i
        </h3>
        <div className="space-y-3.5">
          <input type="text" placeholder="TiÃªu Ä‘á» chÆ°Æ¡ng trÃ¬nh Æ°u Ä‘Ã£i *" required value={promoTitle} onChange={e => setPromoTitle(e.target.value)} className="input w-full text-sm font-semibold" id="promo-title" />
          <textarea placeholder="MÃ´ táº£ ná»™i dung chÆ°Æ¡ng trÃ¬nh khuyáº¿n mÃ£i chi tiáº¿t..." value={promoDesc} onChange={e => setPromoDesc(e.target.value)} className="input w-full text-sm resize-none font-semibold" rows={3} id="promo-desc" />
          <input type="url" placeholder="ÄÆ°á»ng dáº«n hÃ¬nh áº£nh quáº£ng cÃ¡o (URL)" value={promoImg} onChange={e => setPromoImg(e.target.value)} className="input w-full text-sm font-semibold" id="promo-img" />
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#7c4831] uppercase tracking-wider block">Thá»i háº¡n bÃ i Ä‘Äƒng (Tá»± Ä‘á»™ng lÆ°u trá»¯ khi háº¿t háº¡n)</label>
            <input type="date" value={promoExpiry} onChange={e => setPromoExpiry(e.target.value)} className="input w-full text-sm font-semibold" id="promo-expiry" />
          </div>
        </div>
        <button type="submit" className="btn btn-primary py-3 text-xs w-full sm:w-auto"><Megaphone size={14} /> ÄÄƒng chiáº¿n dá»‹ch</button>
      </form>

      <div className="space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] pl-1">CÃ¡c Æ°u Ä‘Ã£i Ä‘ang hiá»ƒn thá»‹</h3>
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
                    {p.status === "archived" && <span className="pill pill-amber border text-[8px]">ÄÃ£ lÆ°u trá»¯</span>}
                    {isExpired && <span className="pill pill-red border text-[8px]">Háº¿t háº¡n</span>}
                  </div>
                  <p className="text-xs text-[#4B3621]/80 font-medium leading-relaxed line-clamp-2">{p.description}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">NgÃ y Ä‘Äƒng: {p.date}</span>
                    {p.expiryDate && (
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider block">Háº¡n dÃ¹ng: {p.expiryDate}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0 sm:self-center">
                {p.status !== "archived" && !isExpired && (
                  <button onClick={() => { archivePromotion(p.id); alert("ÄÃ£ thu há»“i bÃ i viáº¿t thÃ nh cÃ´ng!"); }} className="btn btn-danger py-1.5 px-3 text-[10px] font-bold">Thu há»“i</button>
                )}
                <button onClick={() => { if (confirm("XÃ¡c nháº­n xÃ³a vÄ©nh viá»…n bÃ i Ä‘Äƒng nÃ y?")) { deletePromotion(p.id); } }} className="btn btn-ghost py-1.5 px-3 text-[10px] font-bold text-red-600 border-red-200 hover:bg-red-50">XÃ³a</button>
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
      const skills = ["Pha cháº¿", "Phá»¥c vá»¥", "Thu ngÃ¢n"];
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
        staffName: staff ? staff.fullName : (s.user?.fullName || "NhÃ¢n viÃªn")
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
          alert("Xáº¿p ca nhanh thÃ nh cÃ´ng!");
          fetchOfficialSchedules();
        } else {
          alert("Lá»—i khi xáº¿p ca nhanh!");
        }
      } catch (err) {
        console.error(err);
        alert("Lá»—i máº¡ng!");
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
      const labels = ["Thá»© 2", "Thá»© 3", "Thá»© 4", "Thá»© 5", "Thá»© 6", "Thá»© 7", "Chá»§ Nháº­t"];
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
      if (!sched) return { color: "gray", text: "OFF", label: "OFF", icon: "âœ“" };

      const avails = devAvailsList.filter((a: any) => a.userId === userId && a.date === date);
      if (avails.length === 0) {
        return { color: "red", text: "NgoÃ i thá»i gian Ä‘Äƒng kÃ½ (ChÆ°a Ä‘Äƒng kÃ½ ca ráº£nh)", label: "Äá» (Sai Ä‘Äƒng kÃ½)", icon: "âš " };
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
          return { color: "green", text: "ÄÃºng vá»›i thá»i gian Ä‘Äƒng kÃ½", label: "Xanh (Khá»›p 100%)", icon: "âœ“" };
        }
        // Partial overlap / changed shift
        if (sStart >= aStart && sEnd <= aEnd) {
          return { color: "yellow", text: "Ca Ä‘Ã£ Ä‘Æ°á»£c thay Ä‘á»•i/thu nhá» so vá»›i Ä‘Äƒng kÃ½", label: "VÃ ng (Thay Ä‘á»•i)", icon: "âœŽ" };
        }
      }

      return { color: "red", text: "Xáº¿p vÃ o thá»i gian khÃ´ng Ä‘Äƒng kÃ½", label: "Äá» (Sai Ä‘Äƒng kÃ½)", icon: "âš " };
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
              alert("ÄÃ£ cáº­p nháº­t: OFF");
              fetchOfficialSchedules();
            } else {
              alert("Lá»—i khi cáº­p nháº­t OFF!");
            }
          } else {
            alert("ÄÃ£ lÃ  ca OFF");
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
            alert("LÆ°u ca lÃ m viá»‡c thÃ nh cÃ´ng!");
            fetchOfficialSchedules();
          } else {
            alert("Lá»—i khi lÆ°u ca lÃ m viá»‡c!");
          }
        }
        setEditingCell(null);
      } catch (err) {
        console.error(err);
        alert("Lá»—i máº¡ng khi lÆ°u!");
      }
    };

    // Preset options for quick register/matrix setup
    const presetOptions = [
      { value: "OFF", label: "OFF" },
      { value: "06:00-14:00", label: "SÃ¡ng (06-14)" },
      { value: "07:00-14:00", label: "SÃ¡ng (07-14)" },
      { value: "14:00-23:00", label: "Chiá»u (14-23)" },
      { value: "17:00-23:00", label: "Tá»‘i (17-23)" },
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
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">QUáº¢N LÃ Lá»ŠCH CA</h2>
            <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">
              Tuáº§n {weekDays[0].dayNum} â€“ {weekDays[6].dayNum} ({weekDays[0].dateStr.split('-')[0]})
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Week offsets */}
            <div className="flex gap-1 bg-[#FAF9F6] border border-gray-150 p-1 rounded-2xl">
              <button onClick={() => setWeekOffset(weekOffset - 1)} className="py-1.5 px-3 rounded-xl text-xs font-bold text-[#4B3621] hover:bg-[#7c4831]/5">Tuáº§n trÆ°á»›c</button>
              <button onClick={() => setWeekOffset(0)} className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${weekOffset === 0 ? "bg-[#7c4831] text-white shadow-xs" : "text-[#4B3621] hover:bg-[#7c4831]/5"}`}>Tuáº§n nÃ y</button>
              <button onClick={() => setWeekOffset(weekOffset + 1)} className="py-1.5 px-3 rounded-xl text-xs font-bold text-[#4B3621] hover:bg-[#7c4831]/5">Tuáº§n sau</button>
            </div>

            {/* Registration Gate Status */}
            <div className="flex items-center gap-2 bg-[#FAF9F6] border border-gray-150 py-1.5 px-3 rounded-2xl shadow-xs">
              <span className="text-xs font-bold text-[#7c4831] uppercase">Cá»•ng Ä‘Äƒng kÃ½:</span>
              <button
                onClick={handleToggleRegGate}
                type="button"
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!isRegGateLocked ? 'bg-emerald-600' : 'bg-gray-250'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${!isRegGateLocked ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
              <span className={`text-[10px] font-black uppercase ${!isRegGateLocked ? "text-emerald-700" : "text-gray-400"}`}>
                {!isRegGateLocked ? "ÄANG Má»ž" : "ÄÃƒ KHÃ“A"}
              </span>
            </div>

            {/* Standard actions */}


            <button
              onClick={() => window.open(`${getApiBaseUrl()}/api/attendance/schedules/export?locationId=${activeLocation?.id || "govap-branch"}&weekOffset=${weekOffset}`, "_blank")}
              className="btn btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Xuáº¥t Excel</span>
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
              Báº£ng phÃ¢n ca chÃ­nh (Matrix)
            </button>
            <button
              onClick={() => { setDevTab("avail_matrix"); setSelectedDayDetail(null); }}
              className={`py-1.5 px-4 text-xs font-extrabold uppercase rounded-xl transition-all ${devTab === "avail_matrix" ? "bg-white text-[#7c4831] shadow-xs" : "text-[#7c4831]/60 hover:bg-white/30 hover:text-[#7c4831]"}`}
            >
              Báº£ng Ä‘Äƒng kÃ½ ca ráº£nh
            </button>
          </div>
          {selectedDayDetail && (
            <div className="bg-amber-50 border border-amber-250 py-1.5 px-4 text-xs font-extrabold text-[#7c4831] uppercase rounded-2xl shadow-xs">
              Chi tiáº¿t ngÃ y: {selectedDayDetail.split('-').reverse().join('/')}
            </div>
          )}
        </div>

        {/* KPI CARDS */}
        {devTab === "matrix" && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
            <div className="card p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Tá»•ng nhÃ¢n viÃªn</span>
              <span className="text-xl font-black mt-1 text-[#4B3621]">{totalStaff} ngÆ°á»i</span>
            </div>
            <div className="card p-3 bg-stone-50 border border-stone-200 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-stone-500 tracking-wider">Tá»•ng sá»‘ ca tuáº§n</span>
              <span className="text-xl font-black mt-1 text-[#4B3621]">{totalShifts} ca</span>
            </div>
            <div className="card p-3 bg-emerald-50/55 border border-emerald-150 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">Ca khá»›p 100% (Xanh)</span>
              <span className="text-xl font-black mt-1 text-emerald-800">{greenShiftsCount} ca</span>
            </div>
            <div className="card p-3 bg-amber-50/55 border border-amber-150 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider">Ca thay Ä‘á»•i (VÃ ng)</span>
              <span className="text-xl font-black mt-1 text-amber-800">{yellowShiftsCount} ca</span>
            </div>
            <div className="card p-3 bg-rose-50/55 border border-rose-150 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase text-rose-700 tracking-wider">Sai Ä‘Äƒng kÃ½ (Äá»)</span>
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
              <span>Khá»›p 100% Ä‘Äƒng kÃ½</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-250 inline-block" />
              <span>Lá»‡ch khung giá» Ä‘Äƒng kÃ½</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-100 border border-rose-250 inline-block" />
              <span>KhÃ´ng Ä‘Äƒng kÃ½ ráº£nh (Báº­n/ChÆ°a Ä‘Äƒng kÃ½)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-blue-50 border border-dashed border-blue-200 inline-block" />
              <span>OFF (CÃ³ Ä‘Äƒng kÃ½ ráº£nh)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-gray-100 border border-gray-250 inline-block" />
              <span>OFF (KhÃ´ng Ä‘Äƒng kÃ½ ráº£nh)</span>
            </div>
          </div>
        )}

        {devTab === "matrix" && (
          <div className="card p-0 overflow-hidden border border-gray-200 shadow-md bg-white w-full">
            <div className="overflow-x-auto w-full touch-pan-x" style={{ WebkitOverflowScrolling: "touch" }}>
              <table className="w-full min-w-[1000px] text-center border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F6] border-b border-gray-200 text-[#7c4831] text-[10px] font-black uppercase tracking-wider">
                    <th className="p-3 text-left w-[15%]">NhÃ¢n viÃªn</th>
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
                                    <div className="text-[7.5px] font-black tracking-tight mb-1 text-rose-800">ðŸš¨ XIN Váº®NG</div>
                                  ) : (
                                    <div className={`text-[7.5px] font-black tracking-tight mb-1 ${
                                      status.color === "green" ? "text-emerald-800" :
                                      status.color === "yellow" ? "text-amber-800" :
                                      "text-rose-800"
                                    }`}>
                                      {status.color === "green" ? "ðŸŸ¢ ÄÃƒ CHá»T" :
                                       status.color === "yellow" ? "ðŸŸ¡ Lá»†CH GIá»œ" :
                                       "ðŸ”´ SAI Lá»ŠCH"}
                                    </div>
                                  )}
{isLeaveApproved ? (
                                    <>
                                      <div className="line-through text-stone-400">{sched.startTime}</div>
                                      <div className="text-[8px] font-semibold text-stone-400 my-0.5">Ä‘áº¿n</div>
                                      <div className="line-through text-stone-400">{sched.endTime}{crossesMidnight ? " (HÃ´m sau)" : ""}</div>
                                    </>
                                  ) : (
                                    <>
                                      <div>{sched.startTime}</div>
                                      <div className="text-[8px] font-semibold text-stone-500/80 my-0.5">Ä‘áº¿n</div>
                                      <div>{sched.endTime}{crossesMidnight ? " (HÃ´m sau)" : ""}</div>
                                    </>
                                  )}
                                </div>
                              ) : hasAvail ? (
                                <>
                                  <div className="text-blue-900 font-black tracking-wide">Ráº¢NH</div>
                                  <div className="text-[8px] font-extrabold text-blue-800 tracking-tight mt-1.5 leading-normal">
                                    Ráº£nh: {avails.map((a: any) => parseTime(a.endTime) < parseTime(a.startTime) ? `${a.startTime}-${a.endTime} (HÃ´m sau)` : `${a.startTime}-${a.endTime}`).join(', ')}
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
            { key: "sang", title: "SÃ¡ng", hours: "06:00 - 12:00", startHour: 6, filter: (t: string) => parseTime(t) >= 6 && parseTime(t) < 12 },
            { key: "chieu", title: "Chiá»u", hours: "12:00 - 18:00", startHour: 12, filter: (t: string) => parseTime(t) >= 12 && parseTime(t) < 18 },
            { key: "toi", title: "Tá»‘i", hours: "18:00 - 00:00", startHour: 18, filter: (t: string) => parseTime(t) >= 18 && parseTime(t) <= 24 && parseTime(t) != 0 },
            { key: "khuya", title: "Khuya", hours: "00:00 - 06:00", startHour: 0, filter: (t: string) => parseTime(t) >= 0 && parseTime(t) < 6 }
          ];

          return (
            <div className="card p-0 overflow-hidden border border-gray-200 shadow-md bg-white w-full">
              <div className="p-3 border-b border-gray-150 bg-[#FAF9F6] flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#7c4831]">Báº£ng ÄÄƒng KÃ½ Khung Giá» Ráº£nh</h3>
                  <p className="text-[9px] text-[#7c4831]/60 font-semibold mt-0.5">Sáº¯p xáº¿p trá»±c quan theo ca lÃ m viá»‡c cá»§a tá»«ng nhÃ¢n sá»±</p>
                </div>
              </div>

              <div className="overflow-x-auto w-full touch-pan-x" style={{ WebkitOverflowScrolling: "touch" }}>
                <table className="w-full min-w-[1000px] text-center border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-gray-150 text-[#7c4831] text-[10px] font-black uppercase tracking-wider">
                      <th className="p-3 text-left w-[110px] min-w-[110px] whitespace-nowrap">Buá»•i ca</th>
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
                                    Trá»‘ng
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
                                          <span>{skill === "Pha cháº¿" ? "â˜•" : skill === "Phá»¥c vá»¥" ? "ðŸ›Ž" : "ðŸ’µ"}</span>
                                          <span>{s.fullName} [{skill}]</span>
                                        </div>
                                        <div className="space-y-1">
                                          <div className="text-[8px] font-black opacity-85">
                                            {avail.startTime} - {avail.endTime}{crossesMidnight ? " (HÃ´m sau)" : ""}
                                          </div>
                                        </div>
                                        
                                        {/* Scheduling status badge */}
                                        {currentSched ? (
                                          (() => {
                                            const isLeaveApprovedForColleague = (requests || []).some((r: any) => r.type === "leave" && r.targetShiftId === currentSched?.id && r.status === "approved");
                                            if (isLeaveApprovedForColleague) {
                                              return (
                                                <div className="text-[7.5px] font-black uppercase text-rose-800 bg-rose-50/90 px-1.5 py-0.5 rounded-md border border-rose-250 w-fit">
                                                  ðŸš¨ XIN Váº®NG
                                                </div>
                                              );
                                            }
                                            return (
                                              <div className="text-[7.5px] font-black uppercase text-emerald-800 bg-emerald-50/90 px-1.5 py-0.5 rounded-md border border-emerald-250 w-fit">
                                                ðŸŸ¢ ÄÃ£ chá»‘t: {currentSched.startTime}-{currentSched.endTime}{parseTime(currentSched.endTime) < parseTime(currentSched.startTime) ? " (HÃ´m sau)" : ""}
                                              </div>
                                            );
                                          })()
                                        ) : (
                                          <div className="text-[7.5px] font-black uppercase text-gray-500 bg-stone-50/90 px-1.5 py-0.5 rounded-md border border-stone-200 w-fit">
                                            âšª ChÆ°a chá»‘t
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
                  â† Quay láº¡i
                </button>
                <h3 className="text-lg font-black uppercase text-[#7c4831]">
                  CHI TIáº¾T PHÃ‚N CA NGÃ€Y {selectedDayDetail.split('-').reverse().join('/')}
                </h3>
              </div>
            </div>

            {(() => {
              const dayScheds = weekScheds.filter((s: any) => s.date === selectedDayDetail);

              // Helper categorizer
              const categorizeShift = (startTime: string) => {
                const hour = parseTime(startTime);
                if (hour >= 5 && hour < 14) return "SÃNG (05:00 - 14:00)";
                if (hour >= 14 && hour < 22) return "CHIá»€U (14:00 - 22:00)";
                return "KHUYA (22:00 - 05:00)";
              };

              const categories = [
                { title: "SÃNG (06:00 - 12:00)", filter: (t: string) => parseTime(t) >= 6 && parseTime(t) < 12 },
                { title: "CHIá»€U (12:00 - 18:00)", filter: (t: string) => parseTime(t) >= 12 && parseTime(t) < 18 },
                { title: "Tá»I (18:00 - 00:00)", filter: (t: string) => parseTime(t) >= 18 && parseTime(t) <= 24 && parseTime(t) != 0 },
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
                    const defaultStart = cat.title.includes("SÃNG") ? "06:00" : cat.title.includes("CHIá»€U") ? "12:00" : cat.title.includes("Tá»I") ? "18:00" : "00:00";
                    const defaultEnd = cat.title.includes("SÃNG") ? "12:00" : cat.title.includes("CHIá»€U") ? "18:00" : cat.title.includes("Tá»I") ? "00:00" : "06:00";

                    return (
                      <div key={cat.title} className="card border border-[#7c4831]/15 bg-[#FAF9F6] space-y-4 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="border-b border-[#7c4831]/10 pb-2 flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-wider text-[#7c4831]">{cat.title}</h4>
                            <span className={`pill text-[8px] font-black uppercase border ${diff >= 0 ? "bg-emerald-50 text-emerald-800 border-emerald-150" : "bg-rose-50 text-rose-800 border-rose-150"}`}>
                              {currentCount} / {requiredCount} NhÃ¢n viÃªn
                            </span>
                          </div>

                          <div className="space-y-2">
                            {scheds.length === 0 ? (
                              <p className="text-[10px] text-gray-400 italic">ChÆ°a xáº¿p nhÃ¢n sá»± nÃ o ca nÃ y.</p>
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
                              <span className="text-[9px] font-black uppercase text-[#7c4831] tracking-wider block">NhÃ¢n sá»± ráº£nh kháº£ dá»¥ng ({availableCandidates.length}):</span>
                              <div className="flex flex-wrap gap-1">
                                {availableCandidates.map((cand: any) => {
                                  const candAvail = devAvailsList.find((a: any) => a.userId === cand.id && a.date === selectedDayDetail && cat.filter(a.startTime));
                                  const timeRangeStr = candAvail ? `${candAvail.startTime}-${candAvail.endTime}` : "";
                                  return (
                                    <button
                                      key={cand.id}
                                      onClick={() => handleQuickAssign(cand.id, selectedDayDetail, candAvail?.startTime || defaultStart, candAvail?.endTime || defaultEnd)}
                                      className="bg-emerald-55/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase flex items-center gap-1 transition-all cursor-pointer"
                                      title="Click xáº¿p ca nhanh"
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
                            <span className="text-[9px] font-black uppercase text-[#7c4831] tracking-wider block">Xáº¿p ca tÃ¹y chá»‰nh:</span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <select
                                id={`assign-staff-${prefixId}`}
                                className="select text-[9.5px] font-bold py-1 px-1.5 border border-gray-250 bg-white rounded-lg col-span-2"
                                defaultValue=""
                              >
                                <option value="">-- Chá»n nhÃ¢n sá»± --</option>
                                {staffOnly.map((s: any) => (
                                  <option key={s.id} value={s.id}>{s.fullName}</option>
                                ))}
                              </select>

                              <div className="space-y-0.5">
                                <span className="text-[8px] font-bold text-gray-400 block">Báº¯t Ä‘áº§u:</span>
                                <input
                                  type="time"
                                  id={`assign-start-${prefixId}`}
                                  defaultValue={defaultStart}
                                  className="input text-[9.5px] font-semibold py-1 px-1.5 border border-gray-250 bg-white rounded-lg w-full"
                                />
                              </div>

                              <div className="space-y-0.5">
                                <span className="text-[8px] font-bold text-gray-400 block">Káº¿t thÃºc:</span>
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
                                  alert("Vui lÃ²ng chá»n nhÃ¢n sá»±!");
                                }
                              }}
                              className="btn btn-primary w-full py-1.5 text-[9px] font-extrabold uppercase tracking-wide cursor-pointer"
                            >
                              Xáº¿p Ca TÃ¹y Chá»n
                            </button>
                          </div>

                          <div>
                            {diff < 0 ? (
                              <div className="p-2 bg-rose-50/55 border border-rose-200 text-rose-700 rounded-xl text-[10px] font-bold">
                                âš ï¸ Thiáº¿u {Math.abs(diff)} nhÃ¢n sá»± ca nÃ y!
                              </div>
                            ) : (
                              <div className="p-2 bg-emerald-50/55 border border-emerald-250 text-emerald-700 rounded-xl text-[10px] font-bold">
                                âœ… Äá»§ chá»‰ tiÃªu nhÃ¢n sá»±.
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
                  <Calendar size={16} /> Chi Tiáº¿t PhÃ¢n Ca
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
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">NhÃ¢n viÃªn:</span>
                  <span className="text-sm font-extrabold uppercase text-[#7c4831]">{editingCell.userName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">NgÃ y trá»±c:</span>
                  <span>{editingCell.dateLabel}</span>
                </div>

                {/* Registered Availability Info */}
                <div className="p-3 bg-[#FAF9F6] border border-gray-150 rounded-2xl space-y-1">
                  <span className="text-[9px] font-black uppercase text-[#7c4831] tracking-wider block">Giá» Ä‘Äƒng kÃ½ ráº£nh:</span>
                  {(() => {
                    const avails = devAvailsList.filter((a: any) => a.userId === editingCell.userId && a.date === editingCell.date);
                    if (avails.length === 0) {
                      return <span className="text-rose-600 font-bold uppercase text-[10px]">âŒ KhÃ´ng Ä‘Äƒng kÃ½ ca ráº£nh ngÃ y nÃ y</span>;
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
                            <span>âœ“ {a.startTime} â€“ {a.endTime}</span>
                            <span className="text-[8px] bg-emerald-700 text-white py-0.5 px-1.5 rounded-md">Chá»n nhanh</span>
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                {/* Form controls */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">Ca Ä‘Æ°á»£c xáº¿p:</span>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="cellStatus"
                        checked={cellIsOff}
                        onChange={() => setCellIsOff(true)}
                        className="text-[#7c4831] focus:ring-[#7c4831]"
                      />
                      <span>Nghá»‰ (OFF)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="cellStatus"
                        checked={!cellIsOff}
                        onChange={() => setCellIsOff(false)}
                        className="text-[#7c4831] focus:ring-[#7c4831]"
                      />
                      <span>CÃ³ Äi LÃ m</span>
                    </label>
                  </div>
                </div>

                {!cellIsOff && (
                  <div className="grid grid-cols-2 gap-3 anim-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Giá» báº¯t Ä‘áº§u:</label>
                      <input
                        type="time"
                        value={cellStartTime}
                        onChange={e => setCellStartTime(e.target.value)}
                        className="input w-full text-xs font-semibold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Giá» káº¿t thÃºc:</label>
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
                  LÆ°u thay Ä‘á»•i
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="btn btn-ghost text-xs py-2.5 font-bold px-4 border-gray-200"
                >
                  Há»§y
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
            <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">TÃ­nh LÆ°Æ¡ng NhÃ¢n Sá»±</h2>
            <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">TÃ­nh toÃ¡n tá»± Ä‘á»™ng tiá»n lÆ°Æ¡ng, thÆ°á»Ÿng/pháº¡t Ä‘i trá»… cá»§a nhÃ¢n viÃªn chi nhÃ¡nh</p>
          </div>
          <button
            onClick={exportPayrollToExcel}
            disabled={payrollList.length === 0}
            type="button"
            className="btn btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw size={13} />
            <span>Xuáº¥t BÃ¡o CÃ¡o Báº£ng LÆ°Æ¡ng (Excel)</span>
          </button>
        </div>

        {/* Date Selector Form */}
        <div className="card space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Chá»n thá»i gian</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Tá»« ngÃ y:</label>
              <input
                type="date"
                value={payrollFromDate}
                onChange={e => setPayrollFromDate(e.target.value)}
                className="input text-xs font-semibold w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Äáº¿n ngÃ y:</label>
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
              {payrollLoading ? <RefreshCw size={13} className="animate-spin" /> : "TÃ­nh LÆ°Æ¡ng"}
            </button>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="card p-0 overflow-hidden border border-gray-150 shadow-sm bg-white">
          <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Báº£ng lÆ°Æ¡ng chi nhÃ¡nh</span>
            <span className="text-[10px] font-semibold text-gray-500 ">ÄÆ¡n vá»‹: VNÄ</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                  <th className="p-4">TÃªn</th>
                  <th className="p-4">Sá»‘ Ä‘iá»‡n thoáº¡i</th>
                  <th className="p-4 text-right">LÆ°Æ¡ng/giá»</th>
                  <th className="p-4 text-right">Giá» lÃ m</th>
                  <th className="p-4 text-right">LÆ°Æ¡ng cÆ¡ báº£n</th>
                  <th className="p-4 text-right">ThÆ°á»Ÿng</th>
                  <th className="p-4 text-right">Pháº¡t</th>
                  <th className="p-4 text-right">Táº¡m á»©ng</th>
                  <th className="p-4 text-right font-black text-[#7c4831]">Thá»±c nháº­n</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                {payrollList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400 italic">KhÃ´ng cÃ³ dá»¯ liá»‡u tÃ­nh lÆ°Æ¡ng trong khoáº£ng thá»i gian nÃ y. Báº¥m nÃºt "TÃ­nh LÆ°Æ¡ng" Ä‘á»ƒ táº£i dá»¯ liá»‡u.</td>
                  </tr>
                ) : (
                  payrollList.map((p: any) => (
                    <tr key={p.userId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 uppercase tracking-tight font-black">{p.fullName}</td>
                      <td className="p-4  font-medium text-gray-500">{p.phoneNumber}</td>
                      <td className="p-4 text-right ">{p.hourlyWage?.toLocaleString("vi-VN")}Ä‘</td>
                      <td className="p-4 text-right ">{p.totalWorkedHours}h</td>
                      <td className="p-4 text-right ">{p.baseSalary?.toLocaleString("vi-VN")}Ä‘</td>
                      <td className="p-4 text-right  text-emerald-600">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>+{p.totalBonus?.toLocaleString("vi-VN")}Ä‘</span>
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
                          <span>-{p.totalPenalty?.toLocaleString("vi-VN")}Ä‘</span>
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
                          <span>-{p.totalAdvance?.toLocaleString("vi-VN") || 0}Ä‘</span>
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
                      <td className="p-4 text-right  font-black text-sm text-[#7c4831] bg-[#7c4831]/5">{p.finalAmount?.toLocaleString("vi-VN")}Ä‘</td>
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
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Lá»‹ch sá»­ cháº¥m cÃ´ng</span>
            <span className="text-[10px] font-semibold text-gray-500"></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                  <th className="p-4">TÃªn</th>
                  <th className="p-4">NgÃ y</th>
                  <th className="p-4">Ca</th>
                  <th className="p-4 text-center">Giá» vÃ o</th>
                  <th className="p-4 text-center">Giá» ra</th>
                  <th className="p-4 text-center">Tráº¡ng thÃ¡i</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                {(() => {
                  const list = officialSchedulesList.filter((s: any) => s.date >= payrollFromDate && s.date <= payrollToDate);
                  if (list.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 italic">KhÃ´ng cÃ³ dá»¯ liá»‡u ca trá»±c & cháº¥m cÃ´ng trong khoáº£ng thá»i gian nÃ y.</td>
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
                        lateInfo = `(Trá»… ${realMin - startMin} phÃºt)`;
                      } else if (startMin - realMin > 720) {
                        const diff = (realMin + 1440) - startMin;
                        if (diff > 0) {
                          lateInfo = `(Trá»… ${diff} phÃºt)`;
                        }
                      }
                    }

                    if (s.checkOutTime) {
                      const endParts = s.endTime.split(":");
                      const realParts = s.checkOutTime.split(":");
                      const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                      const realMin = parseInt(realParts[0]) * 60 + parseInt(realParts[1]);
                      if (realMin < endMin) {
                        earlyInfo = `(Vá» sá»›m ${endMin - realMin} phÃºt)`;
                      } else if (realMin - endMin > 720) {
                        const diff = (endMin + 1440) - realMin;
                        if (diff > 0) {
                          earlyInfo = `(Vá» sá»›m ${diff} phÃºt)`;
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
                            <span className="pill pill-green border border-emerald-200">HoÃ n thÃ nh</span>
                          ) : s.clockedIn ? (
                            <span className="pill pill-amber border border-amber-200">Äang lÃ m viá»‡c</span>
                          ) : (
                            <span className="pill pill-red border border-red-200">Váº¯ng / ChÆ°a checkin</span>
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
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">PhÃª Duyá»‡t ÄÆ¡n NhÃ¢n Sá»±</h2>
          <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Duyá»‡t xin nghá»‰ phÃ©p vÃ  yÃªu cáº§u Ä‘á»•i ca trá»±c cá»§a nhÃ¢n viÃªn</p>
        </div>

        <div className="card space-y-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#92400E] border-b border-gray-100 pb-3">
            <FileCheck size={16} /> Danh SÃ¡ch ÄÆ¡n Äang Chá» ({pending.length})
          </h3>
          {pending.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-6 text-center">Hiá»‡n táº¡i khÃ´ng cÃ³ Ä‘Æ¡n nÃ o Ä‘ang chá» duyá»‡t.</p>
          ) : pending.map((r: any) => (
            <div key={r.id} className="p-4 rounded-2xl bg-[#FAF9F6] border border-gray-100 space-y-3.5 shadow-xs anim-scaleIn">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[10px] shadow-xs border ${getAvatarBg(r.staffName)}`}>
                    {getInitials(r.staffName)}
                  </div>
                  <span className="font-extrabold text-sm uppercase tracking-tight text-[#4B3621]">{r.staffName}</span>
                </div>
                <span className={`pill ${r.type === "leave" ? "pill-violet" : "pill-blue"} border`}>{r.type === "leave" ? "Nghá»‰ phÃ©p" : "Äá»•i ca"}</span>
              </div>
              <p className="text-xs text-[#4B3621] font-semibold bg-white p-3 rounded-xl border border-gray-100 leading-relaxed">{r.date} â€” LÃ½ do: {r.details}</p>
              <div className="flex gap-2.5 pt-1">
                <button onClick={async () => {
                  await approveRequest(r.id);
                  fetchOfficialSchedules();
                }} className="btn btn-success py-2 px-4 text-[10px] font-bold shadow-xs">Duyá»‡t ÄÆ¡n</button>
                <button onClick={() => { rejectRequest(r.id); }} className="btn btn-danger py-2 px-4 text-[10px] font-bold shadow-xs">Tá»« Chá»‘i</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card space-y-4">
          <h3 className="text-xs font-extrabold uppercase text-gray-400 border-b border-gray-100 pb-2.5">ÄÆ¡n ÄÃ£ Xá»­ LÃ½ ({resolved.length})</h3>
          <div className="space-y-3">
            {resolved.map((r: any) => (
              <div key={r.id} className="p-3.5 rounded-2xl bg-[#FAF9F6]/60 border border-gray-100 text-xs flex justify-between items-center opacity-85 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[9px] border ${getAvatarBg(r.staffName)}`}>
                    {getInitials(r.staffName)}
                  </div>
                  <div>
                    <p className="font-extrabold uppercase text-[#4B3621] tracking-tight">{r.staffName}</p>
                    <p className="text-[#7c4831]/70 font-semibold mt-0.5">{r.date} â€” {r.details}</p>
                  </div>
                </div>
                <span className={`pill ${r.status === "approved" ? "pill-green" : "pill-red"} text-[8px] font-bold border`}>{r.status === "approved" ? "ÄÃ£ Duyá»‡t" : "BÃ¡c Bá»"}</span>
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
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Äiá»ƒm Loyalty & Thá»±c ÄÆ¡n</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Äiá»u chá»‰nh Ä‘iá»ƒm thÃ nh viÃªn thá»§ cÃ´ng & Cáº­p nháº­t Menu chi nhÃ¡nh</p>
      </div>

      {/* Edit Points */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <Edit3 size={16} className="text-[#7c4831]" /> Sá»­a Ä‘iá»ƒm khÃ¡ch hÃ ng thá»§ cÃ´ng
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <input type="tel" placeholder="Sá»‘ Ä‘iá»‡n thoáº¡i khÃ¡ch *" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="input text-sm font-semibold" id="edit-phone" />
          <input type="number" placeholder="Sá»‘ Ä‘iá»ƒm má»›i *" value={editPts} onChange={e => setEditPts(e.target.value)} className="input text-sm font-semibold" id="edit-pts" />
          <button onClick={() => { if (!editPhone || !editPts) return; adjustPointsManually(editPhone.trim(), parseInt(editPts)); alert("Cáº­p nháº­t sá»‘ Ä‘iá»ƒm thÃ nh cÃ´ng!"); setEditPhone(""); setEditPts(""); }}
            className="btn btn-primary py-2.5 text-xs" id="edit-pts-btn">Cáº­p Nháº­t Ngay</button>
        </div>
      </div>

      {/* Customer List */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <Users size={16} className="text-[#7c4831]" /> Danh SÃ¡ch KhÃ¡ch HÃ ng ÄÄƒng KÃ½ ({customers?.length || 0})
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
                  <p className="text-[10px] font-bold text-gray-400 mt-0.5">{c.phone} â€¢ {c.email}</p>
                </div>
              </div>
              <span className="pill bg-[#E0F2FE] text-[#075985]  font-extrabold border border-sky-100">{c.points}Ä‘</span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Upload */}
      <div className="card space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
          <ImagePlus size={16} className="text-[#7c4831]" /> Cáº¥u HÃ¬nh HÃ¬nh áº¢nh Thá»±c ÄÆ¡n
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
                    if (confirm("Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a hÃ¬nh áº£nh thá»±c Ä‘Æ¡n nÃ y?")) {
                      const updated = menuImages.filter((item: any) => item.id !== img.id);
                      updateMenuImages(updated);
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-90 transition-all hover:scale-105"
                  title="XÃ³a áº£nh"
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
                  Hoáº¡t Ä‘á»™ng
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2 max-w-lg">
          <label className="text-xs font-bold text-gray-500 uppercase">Táº£i cÃ¡c tá»‡p hÃ¬nh áº£nh thá»±c Ä‘Æ¡n lÃªn trá»±c tiáº¿p (Chá»n nhiá»u áº£nh):</label>
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
                  alert("Táº£i lÃªn cÃ¡c hÃ¬nh áº£nh thá»±c Ä‘Æ¡n thÃ nh cÃ´ng!");
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
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Ã Kiáº¿n GÃ³p Ã KhÃ¡ch HÃ ng</h2>
          <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Pháº£n há»“i trá»±c tiáº¿p cÃ¡c Ã½ kiáº¿n Ä‘Ã³ng gÃ³p tá»« thá»±c khÃ¡ch</p>
        </div>

        {uniquePhones.length === 0 ? (
          <div className="card text-center py-10 flex-grow flex items-center justify-center"><p className="text-xs text-[#4B3621]/60 font-bold italic">ChÆ°a nháº­n Ä‘Æ°á»£c pháº£n há»“i gÃ³p Ã½ nÃ o.</p></div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-grow border border-gray-150 rounded-2xl overflow-hidden bg-white shadow-sm h-0">
            {/* Split Left: Customer List */}
            <div className="w-full lg:w-80 border-r border-gray-150 flex flex-col h-1/3 lg:h-full bg-[#FAF9F6]">
              <div className="p-3 border-b border-gray-150 bg-white font-bold text-xs uppercase tracking-wider text-[#7c4831]">Danh sÃ¡ch há»™i thoáº¡i</div>
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
                            {isAdmin ? "Báº¡n" : "KhÃ¡ch hÃ ng"} â€¢ {m.timestamp}
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
                        placeholder={`Tráº£ lá»i cho ${currentCustomerName}...`}
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
                <div className="flex-grow flex items-center justify-center text-gray-400 font-bold italic text-xs">Vui lÃ²ng chá»n má»™t cuá»™c trÃ² chuyá»‡n Ä‘á»ƒ báº¯t Ä‘áº§u</div>
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
          employeeName: a.EmployeeName || "NhÃ¢n viÃªn",
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

    // ThÃªm cÃ¡c ca Ä‘i trá»… tá»± Ä‘á»™ng vÃ o báº£ng thÆ°á»Ÿng pháº¡t
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
              employeeName: s.staffName || "NhÃ¢n viÃªn",
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
            Note: `Äi muá»™n ${lateMin} phÃºt (Ca ${s.startTime} - ${s.endTime})`,
            IsAuto: true
          });
        }
        // TÄƒng do Ä‘i lÃ m vÃ o ngÃ y lá»… (ThÆ°á»Ÿng lá»… há»‡ sá»‘ & flat bonus)
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
                  employeeName: s.staffName || "NhÃ¢n viÃªn",
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
                Note: `Äi lÃ m ngÃ y lá»… ${matchedHoliday.Note} (Há»‡ sá»‘ x${mult}${flat > 0 ? ` + ${flat.toLocaleString()}Ä‘` : ''})`,
                IsAuto: true
              });
            }
          }
        }
      });

    return (
      <div className="space-y-6 anim-fadeUp text-[#4B3621]">
        <div className="border-b border-gray-200/50 pb-4">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">TÃ­nh LÆ°Æ¡ng & ThÆ°á»Ÿng Pháº¡t</h2>
          <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">TÃ­nh toÃ¡n tá»± Ä‘á»™ng tiá»n lÆ°Æ¡ng, quáº£n lÃ½ thÆ°á»Ÿng nÃ³ng, pháº¡t hÃ nh chÃ­nh vÃ  cáº¥u hÃ¬nh há»‡ thá»‘ng lÆ°Æ¡ng</p>
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
            Báº£ng LÆ°Æ¡ng
          </button>
          <button
            onClick={() => setAdjActiveTab("history")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${adjActiveTab === "history"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            Lá»‹ch sá»­ ThÆ°á»Ÿng & Pháº¡t
          </button>
          <button
            onClick={() => setAdjActiveTab("rules")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${adjActiveTab === "rules"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            Cáº¥u hÃ¬nh Pháº¡t Ä‘i trá»…
          </button>
          <button
            onClick={() => setAdjActiveTab("holidays")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${adjActiveTab === "holidays"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            NgÃ y nghá»‰ lá»… chi tiáº¿t
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
                  <span>Chá»n thá»i gian</span>
                  <button
                    onClick={exportPayrollToExcel}
                    disabled={payrollList.length === 0}
                    type="button"
                    className="btn btn-primary py-1.5 px-3 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw size={11} />
                    <span>Xuáº¥t Excel</span>
                  </button>
                </h3>
                <div className="flex flex-wrap gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Tá»« ngÃ y:</label>
                    <input
                      type="date"
                      value={payrollFromDate}
                      onChange={e => setPayrollFromDate(e.target.value)}
                      className="input text-xs font-semibold w-36"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Äáº¿n ngÃ y:</label>
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
                    {payrollLoading ? <RefreshCw size={13} className="animate-spin" /> : "TÃ­nh LÆ°Æ¡ng"}
                  </button>
                </div>
              </div>

              {/* Payroll Table */}
              <div className="card p-0 overflow-hidden border border-gray-150 shadow-sm bg-white">
                <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Báº£ng lÆ°Æ¡ng chi nhÃ¡nh</span>
                  <span className="text-[10px] font-semibold text-gray-500 ">ÄÆ¡n vá»‹: VNÄ</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-max whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                        <th className="p-4">TÃªn</th>
                        <th className="p-4">Sá»‘ Ä‘iá»‡n thoáº¡i</th>
                        <th className="p-4 text-right">LÆ°Æ¡ng/giá»</th>
                        <th className="p-4 text-right">Giá» lÃ m</th>
                        <th className="p-4 text-right">LÆ°Æ¡ng cÆ¡ báº£n</th>
                        <th className="p-4 text-right">ThÆ°á»Ÿng</th>
                        <th className="p-4 text-right">Pháº¡t</th>
                        <th className="p-4 text-right">Táº¡m á»©ng</th>
                        <th className="p-4 text-right font-black text-[#7c4831]">Thá»±c nháº­n</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                      {payrollList.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-gray-400 italic">KhÃ´ng cÃ³ dá»¯ liá»‡u tÃ­nh lÆ°Æ¡ng trong khoáº£ng thá»i gian nÃ y. Báº¥m nÃºt "TÃ­nh LÆ°Æ¡ng" Ä‘á»ƒ táº£i dá»¯ liá»‡u.</td>
                        </tr>
                      ) : (
                        payrollList.map((p: any) => (
                          <tr key={p.userId} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 uppercase tracking-tight font-black">{p.fullName}</td>
                            <td className="p-4  font-medium text-gray-500">{p.phoneNumber}</td>
                            <td className="p-4 text-right ">{p.hourlyWage?.toLocaleString("vi-VN")}Ä‘</td>
                            <td className="p-4 text-right ">{p.totalWorkedHours}h</td>
                            <td className="p-4 text-right ">{p.baseSalary?.toLocaleString("vi-VN")}Ä‘</td>
                            <td className="p-4 text-right  text-emerald-600">
                              <div className="flex items-center justify-end gap-1.5">
                                <span>+{p.totalBonus?.toLocaleString("vi-VN")}Ä‘</span>
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
                                <span>-{p.totalPenalty?.toLocaleString("vi-VN")}Ä‘</span>
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
                                <span>-{p.totalAdvance?.toLocaleString("vi-VN") || 0}Ä‘</span>
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
                            <td className="p-4 text-right  font-black text-sm text-[#7c4831] bg-[#7c4831]/5">{p.finalAmount?.toLocaleString("vi-VN")}Ä‘</td>
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
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831]">Lá»‹ch sá»­ cháº¥m cÃ´ng</span>
                  <span className="text-[10px] font-semibold text-gray-500"></span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-max whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                        <th className="p-4">TÃªn</th>
                        <th className="p-4">NgÃ y</th>
                        <th className="p-4">Ca</th>
                        <th className="p-4 text-center">Giá» vÃ o</th>
                        <th className="p-4 text-center">Giá» ra</th>
                        <th className="p-4 text-center">Tráº¡ng thÃ¡i</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                      {(() => {
                        const list = officialSchedulesList.filter((s: any) => s.date >= payrollFromDate && s.date <= payrollToDate);
                        if (list.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400 italic">KhÃ´ng cÃ³ dá»¯ liá»‡u ca trá»±c & cháº¥m cÃ´ng trong khoáº£ng thá»i gian nÃ y.</td>
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
                              lateInfo = `(Trá»… ${realMin - startMin} phÃºt)`;
                            } else if (startMin - realMin > 720) {
                              const diff = (realMin + 1440) - startMin;
                              if (diff > 0) {
                                lateInfo = `(Trá»… ${diff} phÃºt)`;
                              }
                            }
                          }

                          if (s.checkOutTime) {
                            const endParts = s.endTime.split(":");
                            const realParts = s.checkOutTime.split(":");
                            const endMin = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                            const realMin = parseInt(realParts[0]) * 60 + parseInt(realParts[1]);
                            if (realMin < endMin) {
                              earlyInfo = `(Vá» sá»›m ${endMin - realMin} phÃºt)`;
                            } else if (realMin - endMin > 720) {
                              const diff = (endMin + 1440) - realMin;
                              if (diff > 0) {
                                earlyInfo = `(Vá» sá»›m ${diff} phÃºt)`;
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
                                  <span className="pill pill-green border border-emerald-200">HoÃ n thÃ nh</span>
                                ) : s.clockedIn ? (
                                  <span className="pill pill-amber border border-amber-200">Äang lÃ m viá»‡c</span>
                                ) : (
                                  <span className="pill pill-red border border-red-200">Váº¯ng / ChÆ°a checkin</span>
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
                  <Plus size={15} /> {editingAdjIndex !== null ? "Sá»­a ThÆ°á»Ÿng / Pháº¡t NhÃ¢n ViÃªn" : "ThÃªm ThÆ°á»Ÿng / Pháº¡t"}
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
                    Há»§y Sá»­a / ThÃªm Má»›i
                  </button>
                )}
              </div>

              {editingAdjIndex !== null && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-bold">
                  âš ï¸ Báº¡n Ä‘ang chá»‰nh sá»­a má»™t khoáº£n thÆ°á»Ÿng/pháº¡t. Sau khi sá»­a xong hÃ£y báº¥m nÃºt "Cáº­p nháº­t Ä‘iá»u chá»‰nh" bÃªn dÆ°á»›i.
                </div>
              )}

              <form onSubmit={handleAddAdjustment} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">NhÃ¢n viÃªn Ã¡p dá»¥ng:</label>
                  <select
                    id="new-adj-employee-id"
                    value={newAdjEmployeeId}
                    onChange={e => setNewAdjEmployeeId(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  >
                    <option value="">-- Chá»n nhÃ¢n viÃªn --</option>
                    {staffList.filter((s: any) => s.roleId === 3).map((s: any) => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.phoneNumber})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">HÃ¬nh thá»©c Ä‘iá»u chá»‰nh:</label>
                  <select
                    value={newAdjType}
                    onChange={e => setNewAdjType(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                  >
                    <option value="bonus">ThÆ°á»Ÿng (Bonus)</option>
                    <option value="penalty">Pháº¡t (Penalty)</option>
                    <option value="advance">Táº¡m á»©ng lÆ°Æ¡ng (Advance)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">ÄÆ¡n vá»‹ tÃ­nh:</label>
                  <select
                    value={newAdjUnit}
                    onChange={e => setNewAdjUnit(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                  >
                    <option value="co_dinh">Cá»‘ Ä‘á»‹nh (Flat)</option>
                    <option value="lan">Láº§n (Times)</option>
                    <option value="phut">PhÃºt (Minutes)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Sá»‘ lÆ°á»£ng (Quantity):</label>
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
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Sá»‘ tiá»n / ÄÆ¡n vá»‹ (VNÄ):</label>
                  <input
                    type="number"
                    value={newAdjAmountPerUnit}
                    onChange={e => setNewAdjAmountPerUnit(e.target.value)}
                    placeholder="VÃ­ dá»¥: 50000"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">NgÃ y Ã¡p dá»¥ng:</label>
                  <input
                    type="date"
                    value={newAdjDate}
                    onChange={e => setNewAdjDate(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>

                <div className="space-y-1 md:col-span-3 lg:col-span-2">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">LÃ½ do Ä‘iá»u chá»‰nh (Note):</label>
                  <input
                    type="text"
                    value={newAdjNote}
                    onChange={e => setNewAdjNote(e.target.value)}
                    placeholder="VÃ­ dá»¥: ThÆ°á»Ÿng nÃ³ng hiá»‡u suáº¥t tuáº§n / Pháº¡t nghá»‰ tá»± do"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary py-2.5 px-4 text-xs font-bold w-full cursor-pointer h-9">
                  {editingAdjIndex !== null ? "Cáº­p nháº­t Ä‘iá»u chá»‰nh" : "ThÃªm Ä‘iá»u chá»‰nh"}
                </button>
              </form>
            </div>

            {/* Grouped Adjustments Table */}
            <div className="card p-0 overflow-hidden border border-gray-150 bg-white shadow-sm">
              <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] flex items-center gap-1.5">
                  <Users size={14} /> Danh sÃ¡ch ThÆ°á»Ÿng/Pháº¡t
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                      <th className="p-3">TÃªn</th>
                      <th className="p-3 text-right">Tá»•ng ThÆ°á»Ÿng</th>
                      <th className="p-3 text-right">Tá»•ng Pháº¡t</th>
                      <th className="p-3 text-right">Tá»•ng Táº¡m á»¨ng</th>
                      <th className="p-3 text-center">Sá»‘ khoáº£n ghi nháº­n</th>
                      <th className="p-3 text-center">Thao tÃ¡c</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                    {Object.keys(groupedAdjustments).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400 italic">ChÆ°a cÃ³ khoáº£n thÆ°á»Ÿng/pháº¡t riÃªng nÃ o cho nhÃ¢n viÃªn.</td>
                      </tr>
                    ) : (
                      Object.values(groupedAdjustments).map((group: any) => (
                        <tr key={group.employeeKey} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3 uppercase font-black tracking-tight">{group.employeeName}</td>
                          <td className="p-3 text-right text-emerald-600 font-bold">+{group.totalBonus.toLocaleString("vi-VN")}Ä‘</td>
                          <td className="p-3 text-right text-red-600 font-bold">-{group.totalPenalty.toLocaleString("vi-VN")}Ä‘</td>
                          <td className="p-3 text-right text-amber-700 font-bold">-{group.totalAdvance?.toLocaleString("vi-VN") || 0}Ä‘</td>
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
                              Chi tiáº¿t
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
                        <Users size={16} /> Chi Tiáº¿t CÃ¡c Khoáº£n ThÆ°á»Ÿng / Pháº¡t RiÃªng
                      </h3>
                      <p className="text-[10px] font-bold text-gray-500 uppercase mt-0.5">{selectedAdjGroup.employeeName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedAdjGroup(null); }}
                      className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-black uppercase transition-all cursor-pointer border border-gray-200"
                    >
                      ÄÃ³ng / áº¨n chi tiáº¿t
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                          <th className="p-3">NgÃ y</th>
                          <th className="p-3">Loáº¡i</th>
                          <th className="p-3">Chi tiáº¿t Ä‘Æ¡n vá»‹</th>
                          <th className="p-3 text-right">Tá»•ng sá»‘ tiá»n</th>
                          <th className="p-3">Ghi chÃº</th>
                          <th className="p-3 text-center">Thao tÃ¡c</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                        {currentGroupAdjs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-gray-400 italic">KhÃ´ng cÃ³ dá»¯ liá»‡u thÆ°á»Ÿng pháº¡t riÃªng.</td>
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
                                    {item.Type === "bonus" ? "ThÆ°á»Ÿng" : item.Type === "advance" ? "Táº¡m á»©ng" : "Pháº¡t"}
                                  </span>
                                </td>
                                <td className="p-3 text-gray-500 font-medium whitespace-nowrap">
                                  {item.Unit === "co_dinh"
                                    ? "Sá»‘ tiá»n cá»‘ Ä‘á»‹nh"
                                    : item.Unit
                                      ? `${item.Quantity} ${item.Unit === "lan" ? "láº§n" : "phÃºt"} x ${(item.AmountPerUnit || 0).toLocaleString("vi-VN")}Ä‘`
                                      : "Há»‡ thá»‘ng tÃ­nh toÃ¡n"}
                                </td>
                                <td className={`p-3 text-right font-bold whitespace-nowrap ${item.Type === "bonus" ? "text-emerald-600" : item.Type === "advance" ? "text-amber-600" : "text-red-600"}`}>
                                  {item.Type === "bonus" ? "+" : "-"}{amount.toLocaleString("vi-VN")}Ä‘
                                </td>
                                <td className="p-3 italic text-gray-650 max-w-[150px] truncate" title={item.Note}>{item.Note}</td>
                                <td className="p-3 text-center space-x-2.5">
                                  {item.IsAuto ? (
                                    <span className="text-[10px] text-gray-400 font-bold italic uppercase">Tá»± Ä‘á»™ng (Há»‡ thá»‘ng)</span>
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
                                        Sá»­a
                                      </button>
                                      <button
                                        onClick={async () => {
                                          await handleDeleteAdjustment(originalIndex);
                                        }}
                                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                                        type="button"
                                      >
                                        XÃ³a
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
                <Gift size={16} className="text-[#7c4831]" /> Quy Ä‘á»•i Loyalty
              </h3>
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-gray-100/60 space-y-3.5 text-xs font-bold shadow-xs">
                <div className="flex justify-between items-center"><span className="text-[#4B3621]/60 uppercase tracking-wider">Quy cÃ¡ch tÃ­ch Ä‘iá»ƒm:</span><span className="text-xs  text-[#4B3621]">50.000 VNÄ = 1 Äiá»ƒm</span></div>
                <div className="flex justify-between items-center"><span className="text-[#4B3621]/60 uppercase tracking-wider">Quy cÃ¡ch Ä‘á»•i quÃ :</span><span className="text-xs  text-[#4B3621]">10 Äiá»ƒm = Voucher 55K</span></div>
              </div>
            </div>

            <div className="card space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
                <Settings size={16} className="text-[#7c4831]" /> Quáº£n lÃ½ HRM
              </h3>
              <div className="p-4 rounded-2xl bg-[#FAF9F6] border border-gray-100/60 space-y-3.5 text-xs font-bold shadow-xs">
                <div className="flex justify-between items-center"><span className="text-[#4B3621]/60 uppercase tracking-wider">Má»©c pháº¡t má»‘c Ä‘áº§u:</span><span className="text-sm text-[#4B3621]">{(Number(latePenaltyBaseAmount) || 50000).toLocaleString("vi-VN")}Ä‘ (trá»… {latePenaltyStartMinutes}m)</span></div>
                <div className="flex justify-between items-center"><span className="text-[#4B3621]/60 uppercase tracking-wider">Há»‡ sá»‘ pháº¡t tÄƒng:</span><span className="text-sm text-[#4B3621]">x{latePenaltyMultiplier} (má»—i {latePenaltyIntervalMinutes}m)</span></div>
              </div>
            </div>

            <div className="card space-y-4 md:col-span-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
                <Settings size={16} className="text-[#7c4831]" /> Cáº¥u hÃ¬nh Pháº¡t Ä‘i trá»…
              </h3>
              <form onSubmit={handleSaveHrmConfigs} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Báº¯t Ä‘áº§u pháº¡t (Sá»‘ phÃºt trá»…):</label>
                    <input
                      type="number"
                      value={latePenaltyStartMinutes}
                      onChange={e => setLatePenaltyStartMinutes(e.target.value)}
                      placeholder="VÃ­ dá»¥: 10"
                      className="input w-full text-xs font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Sá»‘ tiá»n pháº¡t má»‘c Ä‘áº§u (VNÄ):</label>
                    <input
                      type="number"
                      value={latePenaltyBaseAmount}
                      onChange={e => setLatePenaltyBaseAmount(e.target.value)}
                      placeholder="VÃ­ dá»¥: 50000"
                      className="input w-full text-xs font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Khoáº£ng tÄƒng trá»… (PhÃºt):</label>
                    <input
                      type="number"
                      value={latePenaltyIntervalMinutes}
                      onChange={e => setLatePenaltyIntervalMinutes(e.target.value)}
                      placeholder="VÃ­ dá»¥: 10"
                      className="input w-full text-xs font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Há»‡ sá»‘ nhÃ¢n (LÅ©y tiáº¿n):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={latePenaltyMultiplier}
                      onChange={e => setLatePenaltyMultiplier(e.target.value)}
                      placeholder="VÃ­ dá»¥: 2"
                      className="input w-full text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-[#FAF9F6] border border-gray-150 rounded-2xl text-[11px] font-medium text-gray-500 leading-relaxed space-y-1">
                  <div><strong>Giáº£i thÃ­ch cÃ´ng thá»©c:</strong> Äi trá»… dÆ°á»›i <strong>{latePenaltyStartMinutes} phÃºt</strong> khÃ´ng pháº¡t.</div>
                  <div>Trá»… tá»« <strong>{latePenaltyStartMinutes} phÃºt</strong> trá»Ÿ Ä‘i sáº½ pháº¡t má»‘c Ä‘áº§u lÃ  <strong>{(Number(latePenaltyBaseAmount) || 0).toLocaleString("vi-VN")} VNÄ</strong>.</div>
                  <div>Cá»© má»—i <strong>{latePenaltyIntervalMinutes} phÃºt</strong> tÄƒng thÃªm thÃ¬ sá»‘ tiá»n pháº¡t sáº½ nhÃ¢n lÃªn <strong>{latePenaltyMultiplier} láº§n</strong> (há»‡ sá»‘ lÅ©y tiáº¿n hÃ¬nh há»c).</div>
                </div>

                <button type="submit" className="btn btn-primary py-2.5 px-6 text-xs font-bold cursor-pointer">
                  LÆ°u cáº¥u hÃ¬nh pháº¡t Ä‘i trá»…
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
                <Calendar size={15} /> ThÃªm NgÃ y Nghá»‰ Lá»… Má»›i
              </h3>
              <form onSubmit={handleAddDetailedHoliday} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">NgÃ y nghá»‰ lá»…:</label>
                  <input
                    type="date"
                    value={newHolidayDate}
                    onChange={e => setNewHolidayDate(e.target.value)}
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Ghi chÃº tÃªn ngÃ y lá»…:</label>
                  <input
                    type="text"
                    value={newHolidayNote}
                    onChange={e => setNewHolidayNote(e.target.value)}
                    placeholder="VÃ­ dá»¥: Táº¿t DÆ°Æ¡ng Lá»‹ch"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Há»‡ sá»‘ lÆ°Æ¡ng ngÃ y nÃ y (vÃ­ dá»¥ x2, x3):</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newHolidayMultiplier}
                    onChange={e => setNewHolidayMultiplier(e.target.value)}
                    placeholder="VÃ­ dá»¥: 2.0"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Hoáº·c thÆ°á»Ÿng thÃªm cá»‘ Ä‘á»‹nh (VNÄ):</label>
                  <input
                    type="number"
                    value={newHolidayFlatBonus}
                    onChange={e => setNewHolidayFlatBonus(e.target.value)}
                    placeholder="VÃ­ dá»¥: 100000"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary py-2 px-4 text-xs font-bold w-full cursor-pointer">
                  ThÃªm ngÃ y lá»…
                </button>
              </form>
            </div>

            {/* List Holidays */}
            <div className="card p-0 lg:col-span-2 overflow-hidden border border-gray-150 bg-white">
              <div className="p-2 border-b border-gray-150 mb-1 flex justify-between items-center">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#7c4831] flex items-center gap-1.5">
                  <Calendar size={14} /> Danh sÃ¡ch ngÃ y nghá»‰ lá»… chi tiáº¿t ({detailedHolidaysList.length})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-max whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[#7c4831] uppercase text-[9px] font-black tracking-wider border-b border-gray-150">
                      <th className="p-3">NgÃ y lá»…</th>
                      <th className="p-3">MÃ´ táº£ / TÃªn ngÃ y lá»…</th>
                      <th className="p-3 text-center">Há»‡ sá»‘ lÆ°Æ¡ng</th>
                      <th className="p-3 text-center">ThÆ°á»Ÿng cá»‘ Ä‘á»‹nh</th>
                      <th className="p-3 text-right">Thao tÃ¡c</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-semibold text-[#4B3621]">
                    {detailedHolidaysList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-400 italic">ChÆ°a cÃ³ ngÃ y lá»… nÃ o Ä‘Æ°á»£c thiáº¿t láº­p.</td>
                      </tr>
                    ) : (
                      detailedHolidaysList.map((h: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-3  text-xs text-[#7c4831]">{h.Date}</td>
                          <td className="p-3 text-xs">{h.Note}</td>
                          <td className="p-3 text-center text-xs">x{h.Multiplier ?? "2.0"}</td>
                          <td className="p-3 text-center text-xs">{(h.FlatBonus ?? 0).toLocaleString("vi-VN")}Ä‘</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteDetailedHoliday(idx)}
                              className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                              type="button"
                            >
                              XÃ³a
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
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">Cáº¥u HÃ¬nh Há»‡ Thá»‘ng</h2>
          <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">Quáº£n lÃ½ Ä‘á»‹nh vá»‹ GPS, Ä‘Äƒng kÃ½ ca ráº£nh vÃ  báº£o máº­t sinh tráº¯c há»c</p>
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
            Vá»‹ trÃ­ GPS & Báº£n Ä‘á»“
          </button>
          <button
            onClick={() => setConfigActiveTab("biometrics")}
            type="button"
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${configActiveTab === "biometrics"
              ? "bg-[#7c4831] text-white shadow-xs"
              : "bg-[#FAF9F6] text-[#4B3621] hover:bg-[#7c4831]/5 border border-gray-200/50"
              }`}
          >
            Báº£o máº­t sinh tráº¯c há»c
          </button>
        </div>

        {/* Tab 2: GPS Config */}
        {configActiveTab === "gps" && (
          <div className="card space-y-4 border border-gray-150 bg-white anim-fadeUp">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
              <MapPin size={16} className="text-[#7c4831]" /> Cáº¥u hÃ¬nh vá»‹ trÃ­ GPS & Báº£n Ä‘á»“ giá»›i háº¡n check-in
            </h3>
            <p className="text-[11px] text-gray-500 font-semibold">
              Click hoáº·c kÃ©o tháº£ ghim trÃªn báº£n Ä‘á»“ dÆ°á»›i Ä‘Ã¢y Ä‘á»ƒ xÃ¡c Ä‘á»‹nh tá»a Ä‘á»™ cá»§a quÃ¡n. NhÃ¢n viÃªn chá»‰ cÃ³ thá»ƒ check-in khi Ä‘á»©ng trong vÃ²ng trÃ²n bÃ¡n kÃ­nh cho phÃ©p.
            </p>
            <form onSubmit={handleSaveHrmConfigs} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">VÄ© Ä‘á»™ (Latitude):</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={gpsLatitude}
                    onChange={e => setGpsLatitude(e.target.value)}
                    placeholder="VÃ­ dá»¥: 10.8315"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Kinh Ä‘á»™ (Longitude):</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={gpsLongitude}
                    onChange={e => setGpsLongitude(e.target.value)}
                    placeholder="VÃ­ dá»¥: 106.6645"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">BÃ¡n kÃ­nh check-in cho phÃ©p (MÃ©t):</label>
                  <input
                    type="number"
                    value={gpsRadius}
                    onChange={e => setGpsRadius(e.target.value)}
                    placeholder="VÃ­ dá»¥: 50"
                    className="input w-full text-xs font-semibold bg-white"
                    required
                  />
                </div>
              </div>

              {/* TÃ¬m kiáº¿m Ä‘á»‹a chá»‰ */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">TÃ¬m kiáº¿m Ä‘á»‹a chá»‰ nhanh:</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="VÃ­ dá»¥: 123 Nguyá»…n VÄƒn Cá»«, GÃ² Váº¥p, Há»“ ChÃ­ Minh"
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
                    {searchLoading ? <RefreshCw size={12} className="animate-spin" /> : "TÃ¬m kiáº¿m"}
                  </button>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="btn btn-ghost border border-gray-255 bg-[#FAF9F6] text-xs font-bold py-1.5 px-4 hover:bg-gray-100 flex items-center justify-center gap-1.5 text-amber-800 cursor-pointer"
                    title="Láº¥y vá»‹ trÃ­ GPS hiá»‡n táº¡i cá»§a trÃ¬nh duyá»‡t"
                  >
                    <MapPin size={12} /> Láº¥y vá»‹ trÃ­ cá»§a tÃ´i
                  </button>
                </div>
              </div>

              <div id="map-picker" className="h-72 w-full rounded-2xl border border-gray-250/70 shadow-sm relative z-10 my-3 overflow-hidden"></div>

              <button type="submit" className="btn btn-primary py-2.5 px-6 text-xs font-bold cursor-pointer">
                LÆ°u cáº¥u hÃ¬nh vá»‹ trÃ­ GPS
              </button>
            </form>

            {/* Cáº¥u hÃ¬nh ghi chÃº cá»§a quáº£n lÃ½ */}
            <div className="border-t border-gray-100 pt-4 mt-4 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 text-[#7c4831]">
                <FileText size={16} className="text-[#7c4831]" /> Ghi chÃº cá»§a Quáº£n lÃ½ dÃ nh cho NhÃ¢n viÃªn
              </h3>
              <p className="text-[11px] text-gray-500 font-semibold">
                Ghi chÃº nÃ y sáº½ Ä‘Æ°á»£c hiá»ƒn thá»‹ á»Ÿ pháº§n ÄÄƒng kÃ½ ca lÃ m viá»‡c cá»§a NhÃ¢n viÃªn.
              </p>
              <form onSubmit={handleSaveManagerNote} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Ná»™i dung ghi chÃº:</label>
                  <textarea
                    value={managerNote}
                    onChange={e => setManagerNote(e.target.value)}
                    placeholder="Nháº­p ghi chÃº cho nhÃ¢n viÃªn á»Ÿ Ä‘Ã¢y..."
                    className="textarea w-full text-xs font-semibold bg-white border border-gray-200 rounded-xl p-3 h-24 focus:outline-none focus:border-[#7c4831]"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary py-2.5 px-6 text-xs font-bold cursor-pointer">
                  LÆ°u Ghi ChÃº
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Biometrics */}
        {configActiveTab === "biometrics" && (
          <div className="card space-y-4 md:col-span-2 anim-fadeUp bg-white border border-gray-150">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
              <Lock size={16} className="text-[#7c4831]" /> Báº£o máº­t thiáº¿t bá»‹ (Biometrics)
            </h3>
            <div className="p-5 rounded-2xl bg-[#FAF9F6] border border-gray-100/60 space-y-3.5 text-xs font-bold shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[#4B3621] text-xs font-bold block uppercase">KÃ­ch hoáº¡t vÃ¢n tay / Face ID trÃªn thiáº¿t bá»‹ hiá»‡n táº¡i</span>
                <span className="text-gray-400 font-semibold text-[10px] block normal-case leading-relaxed">
                  ÄÄƒng kÃ½ sinh tráº¯c há»c thiáº¿t bá»‹ nÃ y cho tÃ i khoáº£n quáº£n trá»‹ hiá»‡n táº¡i ({currentUserPhone || "admin"}) Ä‘á»ƒ bá» qua nháº­p mÃ£ PIN hoáº·c máº­t kháº©u khi Ä‘Äƒng nháº­p nhanh.
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
                <span>KÃ­ch hoáº¡t Touch ID thiáº¿t bá»‹ nÃ y</span>
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
      setQrError("Vui lÃ²ng nháº­p mÃ£ QR hoáº·c sá»‘ Ä‘iá»‡n thoáº¡i khÃ¡ch hÃ ng!");
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
          setQrError(errData.message || "KhÃ´ng tÃ¬m tháº¥y khÃ¡ch hÃ ng!");
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
        setQrError("Lá»—i káº¿t ná»‘i API. KhÃ´ng tÃ¬m tháº¥y khÃ¡ch hÃ ng trong dá»¯ liá»‡u cá»¥c bá»™.");
      }
    }
    setQrLoading(false);
  };

  // === ADD POINTS VIA API ===
  const handleQrAddPoints = async () => {
    if (!qrLookupResult || !qrBillAmt) return;
    const billAmount = parseInt(qrBillAmt);
    if (isNaN(billAmount) || billAmount <= 0) {
      setQrError("Sá»‘ tiá»n hÃ³a Ä‘Æ¡n khÃ´ng há»£p lá»‡!");
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
          setQrSuccess(`TÃ­ch Ä‘iá»ƒm thÃ nh cÃ´ng (cá»¥c bá»™)! +${localResult.pointsAdded} Ä‘iá»ƒm tá»« hÃ³a Ä‘Æ¡n ${billAmount.toLocaleString("vi-VN")}Ä‘.`);
          setQrLookupResult({ ...qrLookupResult, Points: (qrLookupResult.Points || 0) + localResult.pointsAdded });
        } else {
          setQrError(errData.message || "KhÃ´ng thá»ƒ tÃ­ch Ä‘iá»ƒm!");
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
        setQrSuccess(`TÃ­ch Ä‘iá»ƒm thÃ nh cÃ´ng! +${localResult.pointsAdded} Ä‘iá»ƒm.`);
        setQrLookupResult({ ...qrLookupResult, Points: (qrLookupResult.Points || 0) + localResult.pointsAdded });
      } else {
        setQrError("Lá»—i káº¿t ná»‘i vÃ  khÃ´ng thá»ƒ tÃ­ch Ä‘iá»ƒm cá»¥c bá»™.");
      }
    }
    setQrLoading(false);
    setQrBillAmt("");
  };

  // === QR SCANNER VIEW ===
  const ScanQrView = () => (
    <div className="space-y-6 anim-fadeUp text-[#4B3621]">
      <div className="border-b border-gray-200/50 pb-4">
        <h2 className="text-2xl font-black uppercase tracking-tight text-[#7c4831]">QuÃ©t QR & KhÃ¡ch HÃ ng</h2>
        <p className="text-xs font-bold text-[#7c4831]/60 uppercase mt-0.5">QuÃ©t mÃ£ QR, quáº£n lÃ½ Ä‘iá»ƒm loyalty vÃ  danh sÃ¡ch khÃ¡ch hÃ ng</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "scan" as const, label: "QuÃ©t QR TÃ­ch Äiá»ƒm", icon: ScanLine },
          { key: "loyalty" as const, label: "Äiá»ƒm Loyalty & Menu", icon: Gift },
          { key: "customers" as const, label: "KhÃ¡ch HÃ ng", icon: Users },
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
            <ScanLine size={16} className="text-[#7c4831]" /> Nháº­p MÃ£ QR / Sá»‘ Äiá»‡n Thoáº¡i
          </h3>

          <div className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder='DÃ¡n ná»™i dung QR hoáº·c nháº­p SÄT khÃ¡ch hÃ ng (VD: 0987654321)'
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
                {qrLoading ? <RefreshCw size={12} className="animate-spin" /> : <><Search size={12} /> Tra cá»©u</>}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 font-semibold">
              Há»— trá»£ nháº­n dáº¡ng: JSON QR {`{"id":"...","phone":"..."}`}, SÄT trá»±c tiáº¿p, hoáº·c ID khÃ¡ch hÃ ng.
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
                <UserCheck size={16} className="text-emerald-600" /> ThÃ´ng Tin KhÃ¡ch HÃ ng
              </h3>
              <button
                onClick={() => { setQrLookupResult(null); setQrInput(""); setQrBillAmt(""); setQrError(""); setQrSuccess(""); }}
                className="text-[10px] text-gray-400 hover:text-[#7c4831] font-bold uppercase tracking-wider cursor-pointer"
              >
                ÄÃ³ng
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
                  <span className="pill bg-[#E0F2FE] text-[#075985]  font-extrabold border border-sky-100 text-[10px]">{qrLookupResult.Points} Ä‘iá»ƒm</span>
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
              <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Nháº­p sá»‘ tiá»n hÃ³a Ä‘Æ¡n Ä‘á»ƒ tÃ­ch Ä‘iá»ƒm:</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 relative">
                  <input
                    type="number"
                    placeholder="VÃ­ dá»¥: 150000"
                    value={qrBillAmt}
                    onChange={e => setQrBillAmt(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleQrAddPoints(); }}
                    className="input w-full text-sm font-semibold "
                    id="qr-bill-input"
                  />
                  {qrBillAmt && parseInt(qrBillAmt) > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      +{Math.floor(parseInt(qrBillAmt) / 50000)} Ä‘iá»ƒm
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
                    <><Gift size={14} /> TÃ­ch Äiá»ƒm</>
                  )}
                </button>
              </div>
              <p className="text-[9px] text-gray-400 font-semibold">
                Quy cÃ¡ch: Má»—i 50,000 VNÄ = 1 Ä‘iá»ƒm tÃ­ch lÅ©y. Äá»§ 10 Ä‘iá»ƒm = tá»± Ä‘á»™ng nháº­n Voucher 55K.
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
                  {amt.toLocaleString("vi-VN")}Ä‘
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Scan History from Logs */}
        <div className="card space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
            <Clock size={14} className="text-[#7c4831]" /> Lá»‹ch Sá»­ QuÃ©t QR Gáº§n ÄÃ¢y
          </h3>
          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {(logs || []).filter((l: any) => l.action?.includes("TÃ­ch Ä‘iá»ƒm") || l.action?.includes("QuÃ©t mÃ£")).slice(0, 10).map((l: any) => (
              <div key={l.id} className="p-3 rounded-xl bg-[#FAF9F6] border border-gray-100 text-xs flex gap-3 items-start transition-all hover:bg-white hover:border-gray-200">
                <div className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 font-bold text-[9px] ${getAvatarBg(l.staffName)}`}>
                  {getInitials(l.staffName)}
                </div>
                <div className="flex-grow font-semibold">
                  <span className="text-[#4B3621]/90 leading-relaxed text-xs">{l.description}</span>
                  <p className="text-[#7c4831]/60 mt-1 text-[9px] font-medium">{l.staffName} â€¢ {l.time}</p>
                </div>
                <span className="pill bg-[#D3ECE1] text-[#1B523A] text-[8px] font-semibold shrink-0 border border-emerald-200">+ÄIá»‚M</span>
              </div>
            ))}
            {(logs || []).filter((l: any) => l.action?.includes("TÃ­ch Ä‘iá»ƒm") || l.action?.includes("QuÃ©t mÃ£")).length === 0 && (
              <p className="text-xs text-gray-400 italic py-6 text-center">ChÆ°a cÃ³ báº£n ghi quÃ©t QR tÃ­ch Ä‘iá»ƒm nÃ o.</p>
            )}
          </div>
        </div>
      </>)}

      {qrActiveTab === "loyalty" && (
        <>
          {/* Edit Points */}
          <div className="card space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
              <Edit3 size={16} className="text-[#7c4831]" /> Sá»­a Ä‘iá»ƒm khÃ¡ch hÃ ng thá»§ cÃ´ng
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <input type="tel" placeholder="Sá»‘ Ä‘iá»‡n thoáº¡i khÃ¡ch *" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="input text-sm font-semibold" id="edit-phone" />
              <input type="number" placeholder="Sá»‘ Ä‘iá»ƒm má»›i *" value={editPts} onChange={e => setEditPts(e.target.value)} className="input text-sm font-semibold" id="edit-pts" />
              <button onClick={() => { if (!editPhone || !editPts) return; adjustPointsManually(editPhone.trim(), parseInt(editPts)); alert("Cáº­p nháº­t sá»‘ Ä‘iá»ƒm thÃ nh cÃ´ng!"); setEditPhone(""); setEditPts(""); }}
                className="btn btn-primary py-2.5 text-xs" id="edit-pts-btn">Cáº­p Nháº­t Ngay</button>
            </div>
          </div>

          {/* Menu Upload */}
          <div className="card space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3 text-[#7c4831]">
              <ImagePlus size={16} className="text-[#7c4831]" /> Cáº¥u HÃ¬nh HÃ¬nh áº¢nh Thá»±c ÄÆ¡n
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
                        if (confirm("Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a hÃ¬nh áº£nh thá»±c Ä‘Æ¡n nÃ y?")) {
                          const updated = menuImages.filter((item: any) => item.id !== img.id);
                          updateMenuImages(updated);
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-90 transition-all hover:scale-105"
                      title="XÃ³a áº£nh"
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
                      Hoáº¡t Ä‘á»™ng
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2 max-w-lg">
              <label className="text-xs font-bold text-gray-500 uppercase">Táº£i cÃ¡c tá»‡p hÃ¬nh áº£nh thá»±c Ä‘Æ¡n lÃªn trá»±c tiáº¿p (Chá»n nhiá»u áº£nh):</label>
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
                      alert("Táº£i lÃªn cÃ¡c hÃ¬nh áº£nh thá»±c Ä‘Æ¡n thÃ nh cÃ´ng!");
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
            <Users size={16} className="text-[#7c4831]" /> Danh SÃ¡ch KhÃ¡ch HÃ ng ÄÄƒng KÃ½ ({customers?.length || 0})
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
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">{c.phone} â€¢ {c.email}</p>
                  </div>
                </div>
                <span className="pill bg-[#E0F2FE] text-[#075985]  font-extrabold border border-sky-100">{c.points}Ä‘</span>
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
        <h3 className="text-xl font-extrabold uppercase text-[#4B3621] tracking-tight">Váº­n HÃ nh Bá»‹ KhÃ³a</h3>
        <p className="text-xs text-[#4B3621]/70 max-w-sm font-semibold leading-relaxed">
          ThÆ°Æ¡ng hiá»‡u hiá»‡n Ä‘ang bá»‹ khÃ³a táº¡m ngÆ°ng váº­n hÃ nh do thuÃª bao gÃ³i SaaS quÃ¡ háº¡n thanh toÃ¡n. Vui lÃ²ng liÃªn há»‡ nhÃ  quáº£n trá»‹ tá»‘i cao.
        </p>
        <button onClick={handleLogout} className="btn btn-ghost py-3 px-6 text-xs flex items-center gap-2 shadow-xs"><LogOut size={14} /> ÄÄƒng xuáº¥t tÃ i khoáº£n</button>
      </div>
    );
    switch (page) {
      case "scanqr": return ScanQrView();
      case "staff": {
        const filteredStaff = staffList.filter((s: any) => s.roleId === 3);
        return (
          <div className="space-y-5 anim-fadeUp text-[#4B3621]">
            <div className="border-b border-gray-200/50 pb-3">
              <h2 className="text-xl font-bold uppercase tracking-tight text-[#7c4831]">Quáº£n LÃ½ NhÃ¢n Sá»±</h2>
              <p className="text-[10px] font-bold text-[#7c4831]/60 uppercase mt-0.5">ThÃªm má»›i vÃ  xem danh sÃ¡ch nhÃ¢n sá»± cá»§a chi nhÃ¡nh</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Add Staff Form */}
              <div className="card p-4 space-y-3 h-fit border border-gray-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[#7c4831]">
                  <Plus size={14} className="text-[#7c4831]" /> ThÃªm NhÃ¢n ViÃªn Má»›i
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
                      className="input w-full py-1.5 px-3 text-xs font-semibold bg-white"
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
                      className="input w-full py-1.5 px-3 text-xs font-semibold bg-white"
                      id="new-staff-phone"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Vai TrÃ² / Quyá»n Háº¡n</label>
                    <div className="input w-full py-1.5 px-3 text-xs font-semibold bg-gray-50/50 border border-gray-150 rounded-xl text-gray-500 select-none">
                      NhÃ¢n viÃªn (Staff)
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
                      className="input w-full py-1.5 px-3 text-xs font-semibold bg-white"
                      id="new-staff-wage"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-[#7c4831] uppercase tracking-wider block">Ká»¹ nÄƒng lÃ m viá»‡c</label>
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
                        placeholder="ThÃªm ká»¹ nÄƒng..."
                        value={newSkillInput}
                        onChange={e => setNewSkillInput(e.target.value)}
                        className="input flex-grow py-1 px-2 text-[10px] font-semibold bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreateSkillInline}
                        className="px-2.5 py-1 bg-[#7c4831] hover:bg-[#7c4831]/90 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        + ThÃªm
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={staffLoading}
                    className="btn btn-primary py-2.5 text-xs w-full mt-1 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {staffLoading ? <RefreshCw size={12} className="animate-spin" /> : <><Plus size={13} /> ÄÄƒng KÃ½ NhÃ¢n Sá»±</>}
                  </button>
                </form>
              </div>

              {/* Staff List */}
              <div className="lg:col-span-2 card p-4 space-y-3 border border-gray-100 bg-white">
                <h3 className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2 text-[#7c4831]">
                  <Users size={14} className="text-[#7c4831]" /> Danh SÃ¡ch NhÃ¢n ViÃªn ({filteredStaff.length})
                </h3>
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[11px] text-gray-400 italic">ChÆ°a cÃ³ nhÃ¢n viÃªn nÃ o Ä‘Æ°á»£c táº£i hoáº·c chÆ°a Ä‘Æ°á»£c táº¡o.</p>
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
                                <label className="text-[9px] font-black uppercase text-[#7c4831] block">LÆ°Æ¡ng/giá»</label>
                                <input
                                  type="number"
                                  value={editStaffWage}
                                  onChange={e => setEditStaffWage(e.target.value)}
                                  className="input w-full text-xs font-semibold py-1 px-2.5 mt-0.5 bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase text-[#7c4831] block">Ká»¹ nÄƒng lÃ m viá»‡c</label>
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
                                    placeholder="ThÃªm ká»¹ nÄƒng..."
                                    value={newSkillInput}
                                    onChange={e => setNewSkillInput(e.target.value)}
                                    className="input flex-grow py-1 px-2 text-[10px] font-semibold bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleCreateSkillInline}
                                    className="px-2.5 py-1 bg-[#7c4831] hover:bg-[#7c4831]/90 text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer"
                                  >
                                    + ThÃªm
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-extrabold text-xs text-[#4B3621] uppercase tracking-tight">{staff.fullName}</p>
                                {staff.skills && staff.skills.map((sk: any) => (
                                  <span key={sk.id} className="px-1 py-0.5 bg-[#7c4831]/10 text-[#7c4831] text-[8px] rounded font-extrabold uppercase leading-none">{sk.name}</span>
                                ))}
                              </div>
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
                                setSelectedEditStaffSkills(staff.skills ? staff.skills.map((sk: any) => sk.id) : []);
                              }}
                              className="btn btn-ghost py-1 px-2 text-[10px] font-bold border border-gray-250 hover:bg-gray-100 cursor-pointer"
                            >
                              Sá»­a
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png?v=5" alt="Logo" className="w-6 h-6 object-contain" />
                </span>
                <span className="text-sm font-extrabold uppercase tracking-tight text-[#7c4831]">Quáº£n trá»‹ quÃ¡n</span>
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png?v=5" alt="Logo" className="w-[30px] h-[30px]" style={{ borderRadius: "100%" }} />
              </span>
              <div>
                <span className="text-xs font-extrabold uppercase tracking-tight text-[#7c4831] block leading-none">Quáº£n trá»‹ quÃ¡n</span>
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
                      <Award size={16} /> Lá»‹ch Sá»­ ThÆ°á»Ÿng & Pháº¡t NhÃ¢n ViÃªn
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
                      ðŸŽ Khoáº£n thÆ°á»Ÿng
                    </h4>
                    {selectedEmpBonuses.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">KhÃ´ng ghi nháº­n khoáº£n thÆ°á»Ÿng thá»§ cÃ´ng.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpBonuses.map((a: any, idx: number) => (
                          <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-emerald-800">
                              <span>{a.Note || "ThÆ°á»Ÿng nÃ³ng"}</span>
                              <span>+{a.Amount?.toLocaleString("vi-VN")}Ä‘</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                              <span>NgÃ y: {a.Date}</span>
                              <span>{a.Unit === "lan" ? `Sá»‘ láº§n: ${a.Quantity} x ${a.AmountPerUnit?.toLocaleString("vi-VN")}Ä‘` : "Sá»‘ tiá»n cá»‘ Ä‘á»‹nh"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 1b. Holiday Work Bonuses Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#7c4831] border-b border-gray-100 pb-1">
                      ðŸŽ‰ ThÆ°á»Ÿng Ä‘i lÃ m ngÃ y lá»… (Há»‡ sá»‘ & thÆ°á»Ÿng thÃªm)
                    </h4>
                    {selectedEmpHolidayBonuses.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">KhÃ´ng ghi nháº­n thÆ°á»Ÿng Ä‘i lÃ m ngÃ y lá»….</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpHolidayBonuses.map((h: any, idx: number) => (
                          <div key={idx} className="p-3 bg-amber-50/50 border border-amber-100/50 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-amber-800">
                              <span>Äi lÃ m ngÃ y lá»…: {h.holidayName} ({h.startTime} - {h.endTime})</span>
                              <span>+{h.amount?.toLocaleString("vi-VN")}Ä‘</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                              <span>NgÃ y: {h.date}</span>
                              <span>Há»‡ sá»‘: x{h.multiplier}{h.flatBonus > 0 ? ` + ${h.flatBonus.toLocaleString("vi-VN")}Ä‘` : ""}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Late Penalty Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#7c4831] border-b border-gray-100 pb-1">
                      ðŸ•’ Vi pháº¡m Ä‘i trá»… (Dá»±a trÃªn Clock-in)
                    </h4>
                    {selectedEmpLateLogs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">KhÃ´ng ghi nháº­n Ä‘i trá»….</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpLateLogs.map((sched: any) => (
                          <div key={sched.id} className="p-3 bg-red-50/50 border border-red-100/50 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-[#7A2F1E]">
                              <span>Äiá»ƒm danh trá»… ca {sched.startTime} - {sched.endTime}</span>
                              <span className="font-mono">({sched.checkInTime})</span>
                            </div>
                            <p className="text-gray-600 font-semibold">NgÃ y: {sched.date} - Ghi nháº­n trá»… {sched.lateMin} phÃºt.</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Individual Adjustments Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#7c4831] border-b border-gray-150 pb-1">
                      ðŸ’¸ Khoáº£n pháº¡t
                    </h4>
                    {selectedEmpPenalties.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">KhÃ´ng ghi nháº­n khoáº£n pháº¡t thá»§ cÃ´ng.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpPenalties.map((a: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-[#4B3621]">
                              <span>{a.Note || "Pháº¡t hÃ nh chÃ­nh"}</span>
                              <span className="text-red-600 ">-{a.Amount?.toLocaleString("vi-VN")}Ä‘</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                              <span>NgÃ y: {a.Date}</span>
                              <span>{a.Unit === "he_so" ? `Há»‡ sá»‘: ${a.Quantity} x ${a.AmountPerUnit?.toLocaleString("vi-VN")}Ä‘` : "Sá»‘ tiá»n cá»‘ Ä‘á»‹nh"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Salary Advance Section */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#7c4831] border-b border-gray-150 pb-1">
                      ðŸ’° Khoáº£n táº¡m á»©ng lÆ°Æ¡ng
                    </h4>
                    {selectedEmpAdvances.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">KhÃ´ng ghi nháº­n táº¡m á»©ng lÆ°Æ¡ng.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedEmpAdvances.map((a: any, idx: number) => (
                          <div key={idx} className="p-3 bg-gray-50 border border-gray-150 rounded-xl text-xs space-y-1">
                            <div className="flex justify-between font-bold text-[#4B3621]">
                              <span>{a.Note || "Táº¡m á»©ng lÆ°Æ¡ng"}</span>
                              <span className="text-amber-700 ">-{a.Amount?.toLocaleString("vi-VN")}Ä‘</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase">
                              <span>NgÃ y: {a.Date}</span>
                              <span>Sá»‘ tiá»n cá»‘ Ä‘á»‹nh</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary Section */}
                  <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs font-extrabold uppercase">
                    <div className="flex justify-between items-center text-emerald-700">
                      <span>Tá»•ng tiá»n thÆ°á»Ÿng:</span>
                      <span>+{selectedPenaltyEmployee.totalBonus?.toLocaleString("vi-VN")}Ä‘</span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span>Tá»•ng kháº¥u trá»« pháº¡t:</span>
                      <span>-{selectedPenaltyEmployee.totalPenalty?.toLocaleString("vi-VN")}Ä‘</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-700">
                      <span>Tá»•ng táº¡m á»©ng:</span>
                      <span>-{selectedPenaltyEmployee.totalAdvance?.toLocaleString("vi-VN") || 0}Ä‘</span>
                    </div>
                    <div className="flex justify-between items-center text-[#7c4831] border-t border-dashed border-gray-200 pt-1.5">
                      <span>Thá»±c lÄ©nh Ä‘iá»u chá»‰nh:</span>
                      <span className="text-base font-black">
                        {(selectedPenaltyEmployee.totalBonus - selectedPenaltyEmployee.totalPenalty - (selectedPenaltyEmployee.totalAdvance || 0)) >= 0 ? "+" : ""}
                        {(selectedPenaltyEmployee.totalBonus - selectedPenaltyEmployee.totalPenalty - (selectedPenaltyEmployee.totalAdvance || 0))?.toLocaleString("vi-VN")}Ä‘
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
                    ÄÃ³ng
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

