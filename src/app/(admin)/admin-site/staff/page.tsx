"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { ScanLine, Clock, Calendar, ArrowLeftRight, Activity, ArrowLeft, Coffee, Lock, MapPin, CheckCircle, XCircle, AlertTriangle, LogOut, Plus, FileText, Send, User, Award, Bell } from "lucide-react";
import Link from "next/link";
import PullToRefresh from "@/components/PullToRefresh";
import WheelPicker from "@/components/WheelPicker";
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

const LiveClock = () => {
  const [time, setTime] = useState("");
  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="text-2xl font-black text-[#7c4831]  tracking-widest leading-none">
      {time || "07:30:00"}
    </span>
  );
};

export default function StaffPortal() {
  const { activeBrand, activeLocation, activeStaff: contextActiveStaff, loginStaff, logoutStaff, timekeeping, clockInStaff, clockOutStaff, shifts, registerShift, requests, submitRequest, logs, addPointsToCustomer, customers, notifications, markNotificationAsRead, subscribeUserToPush, showPushNotificationPrompt, setShowPushNotificationPrompt } = useApp() as any;

  const [localStaff, setLocalStaff] = useState<any>(null);
  const [pName, setPName] = useState("");
  const [saved, setSaved] = useState(false);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const router = useRouter();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("moods_active_staff");
      const storedUser = localStorage.getItem("moods_auth_user");
      
      if (!stored && !storedUser) {
        // Chưa đăng nhập, đá văng ra trang chủ (login)
        router.push("/");
        return;
      }
      
      setIsAuthChecking(false);

      if (stored) {
        setLocalStaff(JSON.parse(stored));
      } else {
        setLocalStaff(contextActiveStaff);
      }
    }
  }, [contextActiveStaff, router]);

  const activeStaff = localStaff || contextActiveStaff;

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

    const phone = activeStaff?.phone || "";
    if (!phone) {
      alert("Không tìm thấy thông tin tài khoản nhân sự!");
      return;
    }

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
          displayName: activeStaff.name || phone,
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

  React.useEffect(() => {
    if (activeStaff) {
      setPName(activeStaff.name || "");
    }
  }, [activeStaff]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStaff = {
      ...activeStaff,
      name: pName
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("moods_active_staff", JSON.stringify(updatedStaff));
    }
    setLocalStaff(updatedStaff);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPin.length !== 6 || isNaN(Number(oldPin)) || newPin.length !== 6 || isNaN(Number(newPin))) {
      alert("Mã PIN phải gồm đúng 6 chữ số!");
      return;
    }
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff/change-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: activeStaff?.phone || activeStaff?.phoneNumber || "",
          oldPin: oldPin,
          newPin: newPin,
          locationId: activeStaff?.locationId || activeLocation?.id || "govap-branch" // Staff-per-Branch
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert("Đổi mã PIN thành công!");
        setOldPin("");
        setNewPin("");
      } else {
        alert(data.message || "Đổi mã PIN thất bại!");
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi kết nối máy chủ khi đổi mã PIN!");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("moods_active_staff");
    }
    logoutStaff?.();
    window.location.href = "/";
  };

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isScanningSimulated, setIsScanningSimulated] = useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 550) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const triggerMockScan = () => {
    if (isScanningSimulated) return;
    setIsScanningSimulated(true);
    setTimeout(() => {
      setIsScanningSimulated(false);
      const mockPhones = ["0912345678", "0987654321", "0909090909"];
      const randomPhone = mockPhones[Math.floor(Math.random() * mockPhones.length)];
      const randomBill = (Math.floor(Math.random() * 4) + 1) * 50000 + 25000;
      setScanPhone(randomPhone);
      setBillAmt(randomBill.toString());
      alert("Đã nhận diện mã QR khách hàng!");
    }, 1500);
  };

  const [tab, setTab] = useState<"scan" | "attend" | "schedule" | "requests" | "logs" | "profile">("scan");
  const handleTabChange = (newTab: typeof tab) => {
    setTab(newTab);
    if (typeof window !== "undefined") {
      localStorage.setItem("staff_active_tab", newTab);
    }
  };
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTab = localStorage.getItem("staff_active_tab");
      if (storedTab) {
        setTab(storedTab as any);
      }
    }
  }, []);
  const [staffId, setStaffId] = useState("");
  const [isRegGateLocked, setIsRegGateLocked] = useState(false);
  const [managerNote, setManagerNote] = useState("Chúc mọi người một tuần làm việc vui vẻ!");
  const [availList, setAvailList] = useState<any[]>([]);
  const [adjustmentsList, setAdjustmentsList] = useState<any[]>([]);
  const [detailedHolidaysList, setDetailedHolidaysList] = useState<any[]>([]);
  const [latePenaltyStartMinutes, setLatePenaltyStartMinutes] = useState("10");
  const [latePenaltyBaseAmount, setLatePenaltyBaseAmount] = useState("50000");
  const [latePenaltyIntervalMinutes, setLatePenaltyIntervalMinutes] = useState("10");
  const [latePenaltyMultiplier, setLatePenaltyMultiplier] = useState("2");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "warning" | "info">("success");

  const showToast = (msg: string, type: "success" | "warning" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };
  const [officialSchedulesList, setOfficialSchedulesList] = useState<any[]>([]);
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedStartHour, setSelectedStartHour] = useState("07:00");
  const [selectedEndHour, setSelectedEndHour] = useState("12:00");
  const [isOvernightReg, setIsOvernightReg] = useState(false);

  // Scanner
  const [scanning, setScanning] = useState(true);
  const [scanPhone, setScanPhone] = useState("");
  const [billAmt, setBillAmt] = useState("");
  const [scanResult, setScanResult] = useState<any>(null);

  // Attendance
  const [gpsDist, setGpsDist] = useState(30);
  const [isNearCounter, setIsNearCounter] = useState(true);

  // Schedule
  const [shiftDate, setShiftDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [shiftType, setShiftType] = useState("Sáng (07:00 - 12:00)");
  const [expandReg, setExpandReg] = useState(false);
  const [expandShifts, setExpandShifts] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [weekOffset, setWeekOffset] = useState(0);

  // Requests
  const [reqType, setReqType] = useState<"leave" | "swap">("leave");
  const [reqDate, setReqDate] = useState("");
  const [reqDetails, setReqDetails] = useState("");
  const [swapShiftId, setSwapShiftId] = useState("");
  const [swapStaffName, setSwapStaffName] = useState("");
  const [targetShiftId, setTargetShiftId] = useState("");
  const [swapWithStaffId, setSwapWithStaffId] = useState("");
  const [swapWithShiftId, setSwapWithShiftId] = useState("");
  const [swapColleagueDate, setSwapColleagueDate] = useState("");
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>("");

  React.useEffect(() => {
    if (showPushNotificationPrompt) {
      setShowNotifications(true);
      setShowPushNotificationPrompt(false);
    }
  }, [showPushNotificationPrompt]);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, [showNotifications]);

  const parseTimeToFloat = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    return parseFloat(parts[0]) + (parts[1] ? parseFloat(parts[1]) / 60 : 0);
  };

  React.useEffect(() => {
    const startVal = parseTimeToFloat(selectedStartHour);
    const endVal = parseTimeToFloat(selectedEndHour);
    if (endVal < startVal) {
      setIsOvernightReg(true);
    } else {
      setIsOvernightReg(false);
    }
  }, [selectedStartHour, selectedEndHour]);

  const [ownShiftsCollapsed, setOwnShiftsCollapsed] = useState(false);
  const [colleagueShiftsCollapsed, setColleagueShiftsCollapsed] = useState(false);

  const locked = activeBrand?.status === "suspended" || activeLocation?.status === "suspended";

  const fetchHrmConfigs = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/config?locationId=${activeLocation?.id || "govap-branch"}`);
      if (res.ok) {
        const data = await res.json();
        const lockVal = data.find((c: any) => c.configKey === "ShiftRegistrationLocked")?.configValue;
        setIsRegGateLocked(lockVal === "true");

        const noteVal = data.find((c: any) => c.configKey === "ManagerNote")?.configValue;
        if (noteVal) setManagerNote(noteVal);

        const startVal = data.find((c: any) => c.configKey === "LatePenaltyStartMinutes")?.configValue;
        if (startVal) setLatePenaltyStartMinutes(startVal);
        const baseVal = data.find((c: any) => c.configKey === "LatePenaltyBaseAmount")?.configValue;
        if (baseVal) setLatePenaltyBaseAmount(baseVal);
        const intervalVal = data.find((c: any) => c.configKey === "LatePenaltyIntervalMinutes")?.configValue;
        if (intervalVal) setLatePenaltyIntervalMinutes(intervalVal);
        const multVal = data.find((c: any) => c.configKey === "LatePenaltyMultiplier")?.configValue;
        if (multVal) setLatePenaltyMultiplier(multVal);

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
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAvails = async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/attendance/availability?locationId=${activeLocation?.id || "govap-branch"}`);
      if (res.ok) {
        const data = await res.json();
        setAvailList(data);
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

  const fetchColleagues = async () => {
    try {
      // Staff-per-Branch: chỉ lấy đồng nghiệp cùng Branch
      const locId = activeLocation?.id || "govap-branch";
      const res = await fetch(`${getApiBaseUrl()}/api/auth/staff?locationId=${locId}`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((u: any) =>
          u.id !== activeStaff?.id &&
          u.roleId !== 1 && u.roleId !== 2
        );
        setColleagues(filtered);
      }
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (activeStaff) {
      fetchHrmConfigs();
      fetchAvails();
      fetchOfficialSchedules();
      fetchColleagues();
      if (!reqDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        setReqDate(todayStr);
        setSwapColleagueDate(todayStr);
      }
      if (!swapColleagueDate) {
        setSwapColleagueDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [activeStaff, tab, activeLocation?.id, reqDate, swapColleagueDate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffId) return;
    const ok = loginStaff?.(staffId);
    if (!ok) alert("Mã ID nhân sự không hợp lệ!");
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanPhone || !billAmt) return;
    const customer = customers.find((c: any) => c.phone === scanPhone.trim());
    if (!customer) { alert("Không tìm thấy thành viên có số điện thoại trên hệ thống!"); return; }
    const result = addPointsToCustomer(scanPhone.trim(), parseInt(billAmt), activeStaff?.name || "NV");
    setScanResult(result);
    setTimeout(() => { setScanResult(null); setScanPhone(""); setBillAmt(""); setScanning(true); }, 3000);
  };

  const handleClockIn = () => {
    if (!navigator.geolocation) {
      showToast("Trình duyệt của bạn không hỗ trợ định vị GPS!", "warning");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const result = await clockInStaff(latitude, longitude);
        if (result.success && result.lateMinutes > 0) {
          showToast(`Chấm công thành công. Trễ ca ${result.lateMinutes} phút!`, "warning");
        } else if (result.success) {
          showToast("Chấm công vào ca thành công!", "success");
        } else {
          showToast("Chấm công thất bại: " + (result.message || ""), "warning");
        }
      },
      (error) => {
        console.error(error);
        showToast("Không thể lấy định vị GPS. Vui lòng cấp quyền truy cập vị trí trên thiết bị!", "warning");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleClockOut = async () => {
    if (confirm("Xác nhận ra ca? Lưu ý: Nếu Checkout sớm trước giờ ca kết thúc, hệ thống sẽ ghi nhận cảnh báo sớm gửi về quản lý!")) {
      await clockOutStaff();
      showToast("Chấm công ra ca thành công!", "success");
    }
  };

  const handleRegShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftDate) return;
    if (isRegGateLocked) {
      alert("Cổng đăng ký ca rảnh hiện đang khóa!");
      return;
    }
    registerShift?.(shiftDate, shiftType, activeLocation?.id || "govap-branch");
    setShiftDate("");
  };

  const handleReq = (e: React.FormEvent) => {
    e.preventDefault();
    if (reqType === "leave" && !targetShiftId) {
      alert("Vui lòng chọn ca trực muốn xin nghỉ!");
      return;
    }
    if (!reqDate) return;

    let detailsText = reqDetails;
    if (reqType === "swap") {
      if (!targetShiftId || !swapWithStaffId || !swapWithShiftId) {
        alert("Vui lòng chọn đầy đủ ca của bạn, đồng nghiệp và ca của đồng nghiệp!");
        return;
      }
      const mySelectedShift = (officialSchedulesList || []).find((s: any) => s.id === targetShiftId);
      const colleagueSelectedShift = (officialSchedulesList || []).find((s: any) => s.id === swapWithShiftId);
      const myTimeRange = mySelectedShift ? `${mySelectedShift.startTime} - ${mySelectedShift.endTime}` : "";
      const colleagueTimeRange = colleagueSelectedShift ? `${colleagueSelectedShift.startTime} - ${colleagueSelectedShift.endTime}` : "";
      detailsText = `Đổi ca (${myTimeRange}) ngày ${reqDate} với đồng nghiệp ${swapStaffName} (ca ${colleagueTimeRange}). Lý do: ${reqDetails}`;
    } else {
      if (!reqDetails) return;
      const mySelectedShift = (officialSchedulesList || []).find((s: any) => s.id === targetShiftId);
      if (mySelectedShift) {
        detailsText = `Xin vắng mặt ca ${mySelectedShift.startTime} - ${mySelectedShift.endTime} ngày ${mySelectedShift.date}. Lý do: ${reqDetails}`;
      }
    }

    submitRequest?.(
      reqType,
      detailsText,
      reqDate,
      reqType === "leave" ? targetShiftId : (reqType === "swap" ? targetShiftId : undefined),
      reqType === "swap" ? swapStaffName : undefined,
      reqType === "swap" ? swapWithStaffId : undefined,
      reqType === "swap" ? swapWithShiftId : undefined
    );
    alert("Yêu cầu đã được gửi lên hệ thống phê duyệt!");
    setReqDate(""); setReqDetails(""); setSwapShiftId(""); setSwapStaffName(""); setTargetShiftId("");
    setSwapWithStaffId(""); setSwapWithShiftId("");
  };

  // === LOCK ===
  const LockView = () => (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center space-y-6 anim-fadeUp py-20">
      <div className="w-16 h-16 rounded-3xl bg-[#FADCD5] border border-[#7c4831]/15 flex items-center justify-center text-[#7A2F1E] shadow-sm animate-bounce">
        <Lock size={28} />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-black text-[#7A2F1E] uppercase">Hệ Thống Tạm Khóa</h2>
        <p className="text-xs text-[#7c4831] font-semibold max-w-xs leading-relaxed">
          Tài khoản chi nhánh F&B này đã bị tạm khóa do quá hạn thanh toán hóa đơn cước SaaS hoặc vi phạm chính sách bảo mật hệ thống. Vui lòng liên hệ Super Admin.
        </p>
      </div>
      <Link href="/" className="btn btn-ghost py-2.5 px-5 text-xs flex items-center gap-1.5"><ArrowLeft size={12} /> Quay lại trang chủ</Link>
    </div>
  );

  // === AUTH ===
  const AuthView = () => (
    <div className="flex flex-col justify-center h-full px-5 py-8 min-h-[500px]">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#7c4831] flex items-center justify-center mx-auto shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png?v=5" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        <h2 className="text-base font-black text-[#7c4831] uppercase tracking-wide">Cổng Nhân Viên</h2>
        <p className="text-[10px] text-[#4B3621]/60 font-bold uppercase tracking-widest ">Staff Authentication Portal</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-[#7c4831] uppercase tracking-wider block">Mã số ID nhân sự *</label>
          <input
            type="text"
            placeholder="Ví dụ: s-1, s-2, s-3"
            required
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            className="input w-full text-sm font-semibold"
            id="staff-id"
          />
        </div>
        <button type="submit" className="btn btn-primary w-full py-3 text-sm font-bold" id="staff-login">
          Xác thực nhân viên
        </button>
        <div className="text-center">
          <Link href="/" className="text-[9px] font-bold text-[#7c4831]/60 hover:text-[#7c4831] transition-all uppercase tracking-wider">
            Quay lại Cổng Đăng Nhập
          </Link>
        </div>
      </form>
    </div>
  );

  // === SCAN ===
  const ScanView = () => (
    <div className="space-y-4 pb-28 anim-fadeUp">
      <div className="card">
        <h3 className="text-base font-bold text-[#7c4831] uppercase">Tích Điểm Cho Khách</h3>
        <p className="text-xs text-[#4B3621]/70 font-semibold mt-1">Cộng điểm hóa đơn thanh toán cho thực khách tại quầy</p>
      </div>

      {scanResult ? (
        <div className="card text-center bg-[#D3ECE1] border border-[#7c4831]/10 shadow-sm anim-scaleIn py-8">
          <CheckCircle size={40} className="text-[#1B523A] mx-auto mb-3" />
          <h4 className="text-base font-bold text-[#1B523A] uppercase">Thao Tác Thành Công!</h4>
          <p className="text-xs  font-bold text-[#1B523A] mt-2">+{scanResult.pointsAdded} điểm đã nạp vào tài khoản khách</p>
        </div>
      ) : (
        <form onSubmit={handleScan} className="card space-y-4 anim-fadeUp">
          <div
            onClick={triggerMockScan}
            className="w-full h-28 rounded-2xl bg-[#FAF9F6] hover:bg-[#FAF9F6]/80 flex flex-col items-center justify-center border border-[#7c4831]/10 cursor-pointer transition-colors relative overflow-hidden"
          >
            {isScanningSimulated ? (
              <div className="absolute inset-0 bg-[#7c4831]/5 flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 border-2 border-[#7c4831] border-t-transparent rounded-full animate-spin" />
                <span className="text-[10px] font-bold text-[#7c4831] animate-pulse uppercase">Đang mở camera quét...</span>
              </div>
            ) : (
              <>
                <ScanLine size={32} className="text-[#7c4831] animate-pulse" />
                <span className="text-[9px] font-bold text-[#7c4831]/60 uppercase tracking-wider mt-2">Bấm để quét mã QR thẻ thành viên</span>
              </>
            )}
          </div>
          <div className="space-y-3">
            <input
              type="tel"
              placeholder="Số điện thoại khách hàng *"
              required
              value={scanPhone}
              onChange={e => setScanPhone(e.target.value)}
              className="input w-full text-sm font-semibold"
              id="scan-phone"
            />
            <input
              type="number"
              placeholder="Số tiền trên hóa đơn (VNĐ) *"
              required
              value={billAmt}
              onChange={e => setBillAmt(e.target.value)}
              className="input w-full text-sm font-semibold"
              id="scan-bill"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button type="button" onClick={() => { setScanPhone(""); setBillAmt(""); }} className="btn btn-ghost py-2 text-xs">Xóa nhập liệu</button>
            <button type="submit" className="btn btn-primary py-2 text-xs" id="scan-confirm">Xác Nhận</button>
          </div>
        </form>
      )}
    </div>
  );

  // === ATTEND ===
  const AttendView = () => {
    const todayStr = new Date().toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const todayDateStr = `${yyyy}-${mm}-${dd}`;

    const shiftsToday = (officialSchedulesList || []).filter(
      (s: any) => s.userId === activeStaff?.id && s.date === todayDateStr
    );

    const currentHourFloat = now.getHours() + now.getMinutes() / 60;

    const activeShiftNow = shiftsToday.find((s: any) => {
      const startFloat = parseTimeToFloat(s.startTime);
      let endFloat = parseTimeToFloat(s.endTime);
      if (endFloat < startFloat) endFloat += 24;
      return currentHourFloat >= (startFloat - 0.5) && currentHourFloat <= endFloat;
    });

    const hasShiftToday = timekeeping.clockedIn || shiftsToday.length > 0;
    const isShiftTimeNow = timekeeping.clockedIn || !!activeShiftNow;

    return (
      <div className="space-y-4 pb-28 anim-fadeUp">
        <div className="card space-y-6">
          {/* Header */}
          <div className="border-b border-[#7c4831]/10 pb-3.5">
            <h3 className="text-base font-extrabold text-[#7c4831] uppercase tracking-wide">Điểm danh ca trực</h3>
            <p className="text-xs text-[#4B3621]/60 font-medium">Xác thực giờ làm việc qua định vị GPS chi nhánh</p>
          </div>

          {/* Simple Employee Profile Row */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#7c4831]/10 flex items-center justify-center text-[#7c4831] font-black text-sm shadow-sm shrink-0">
              {activeStaff?.name ? activeStaff.name.charAt(0) : "NV"}
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-[#7c4831] uppercase tracking-wide">{activeStaff?.name || "Nhân viên"}</h4>
              <p className="text-[10px] text-[#4B3621]/60 font-semibold mt-0.5">Pha Chế · ID: {activeStaff?.id || "s-1"}</p>
            </div>
          </div>

          {/* Minimal Live Clock */}
          <div className="flex flex-col items-center justify-center py-4 bg-[#FAF9F6] border border-[#7c4831]/10 rounded-2xl">
            <LiveClock />
            <span className="text-[9px] font-bold text-[#7c4831]/50 uppercase tracking-wider mt-1.5">{todayStr}</span>
          </div>

          {/* Real GPS Info Badge */}
          <div className="p-3.5 rounded-xl border bg-amber-50 border-amber-200/40 text-[#7c4831] flex items-center gap-2 text-[11px] font-bold">
            <MapPin size={13} className="animate-pulse" />
            <span>Yêu cầu định vị GPS thực tế khi chấm công</span>
          </div>

          {/* Minimal Time Logs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-[#FAF9F6] border border-[#7c4831]/10 rounded-xl space-y-1 text-center">
              <span className="text-[9px] font-bold text-[#7c4831]/60 uppercase tracking-wider">Giờ vào</span>
              <p className="text-sm  font-black text-[#7c4831]">{timekeeping.clockInTime || "--:--"}</p>
            </div>
            <div className="p-3 bg-[#FAF9F6] border border-[#7c4831]/10 rounded-xl space-y-1 text-center">
              <span className="text-[9px] font-bold text-[#7c4831]/60 uppercase tracking-wider">Giờ ra</span>
              <p className="text-sm  font-black text-[#7c4831]">{timekeeping.clockOutTime || "--:--"}</p>
            </div>
          </div>

          {timekeeping.lateMinutes > 0 && (
            <div className="p-3 rounded-xl bg-[#FEF3C7] text-[10px] text-[#92400E] flex items-center gap-1.5 font-bold border border-[#92400E]/10">
              <AlertTriangle size={12} /> Ghi nhận đi trễ {timekeeping.lateMinutes} phút
            </div>
          )}

          {/* Unified Primary Action Button */}
          <div className="pt-1">
            {!hasShiftToday ? (
              <div className="p-4 bg-amber-50 text-[#7c4831] border border-amber-200/50 rounded-2xl text-center text-xs font-bold space-y-1">
                <AlertTriangle size={20} className="mx-auto text-amber-600 mb-1" />
                <p>Hôm nay bạn không có ca trực nào được xếp.</p>
                <p className="text-[10px] text-gray-500 font-semibold">Chức năng chấm công chỉ mở khi bạn có  chính thức hôm nay.</p>
              </div>
            ) : !isShiftTimeNow ? (
              <div className="p-4 bg-amber-50 text-[#7c4831] border border-amber-200/50 rounded-2xl text-center text-xs font-bold space-y-1">
                <AlertTriangle size={20} className="mx-auto text-amber-600 mb-1" />
                <p>Chưa đến giờ làm việc hoặc đã qua ca trực của bạn.</p>
                <p className="text-[10px] text-gray-500 font-semibold">Chức năng vào ca chỉ mở từ 30 phút trước khi ca trực bắt đầu cho đến khi kết thúc ca.</p>
              </div>
            ) : timekeeping.clockedOut ? (
              <button
                disabled
                className="btn w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all bg-gray-300 text-gray-500 cursor-not-allowed"
              >
                <CheckCircle size={13} /> ĐÃ HOÀN THÀNH CA
              </button>
            ) : !timekeeping.clockedIn ? (
              <button
                onClick={handleClockIn}
                className="btn w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 bg-[#7c4831] text-white hover:bg-[#643621] cursor-pointer"
                id="clock-in"
              >
                <Clock size={13} /> VÀO CA
              </button>
            ) : (
              <button
                onClick={handleClockOut}
                className="btn w-full py-3.5 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 bg-[#7c4831] text-white hover:bg-[#643621]"
                id="clock-out"
              >
                <LogOut size={13} /> RA CA
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // === SCHEDULE ===
  const SchedView = () => {
    const staffList = activeStaff ? [activeStaff, ...colleagues] : colleagues;
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
      const labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
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

    const handleRegisterFreeShift = async (e: React.FormEvent) => {
      e.preventDefault();
      const startVal = parseTimeToFloat(selectedStartHour);
      let rawEndVal = parseTimeToFloat(selectedEndHour);
      if (isOvernightReg) {
        rawEndVal += 24;
      }
      const duration = rawEndVal === startVal ? 0 : rawEndVal - startVal;
      if (duration < 4.0) {
        alert("Ca rảnh đăng ký phải tối thiểu 4 tiếng!");
        return;
      }
      if (isRegGateLocked) {
        alert("Cổng đăng ký ca rảnh hiện đang bị khóa!");
        return;
      }

      try {
        const myAvails = (availList || []).filter((a: any) => a.userId === activeStaff?.id);
        const existing = myAvails.find((a: any) => a.date === selectedDate);
        
        const body = {
          userId: activeStaff.id,
          locationId: activeLocation?.id || "govap-branch",
          date: selectedDate,
          startTime: selectedStartHour,
          endTime: selectedEndHour
        };

        const res = await fetch(`${getApiBaseUrl()}/api/attendance/availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Không thể đăng ký ca rảnh!");
          return;
        }
        alert("Đăng ký ca rảnh thành công!");
        setShowRegModal(false);
        fetchAvails();
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối khi đăng ký ca rảnh!");
      }
    };

    const handleDeleteAvail = async (availId: string) => {
      if (isRegGateLocked) {
        alert("Cổng đăng ký ca rảnh hiện đang bị khóa!");
        return;
      }
      if (!confirm("Xác nhận xóa ca rảnh này?")) return;

      try {
        const res = await fetch(`${getApiBaseUrl()}/api/attendance/availability/${availId}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.message || "Không thể xóa ca rảnh!");
          return;
        }
        alert("Xóa ca rảnh thành công!");
        fetchAvails();
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối khi xóa ca rảnh!");
      }
    };

    const shiftCategories = [
      { key: "sang", title: "SÁNG", hours: "06:00 - 12:00", startHour: 6, filter: (t: string) => parseTimeToFloat(t) >= 6 && parseTimeToFloat(t) < 12 },
      { key: "chieu", title: "CHIỀU", hours: "12:00 - 18:00", startHour: 12, filter: (t: string) => parseTimeToFloat(t) >= 12 && parseTimeToFloat(t) < 18 },
      { key: "toi", title: "TỐI", hours: "18:00 - 00:00", startHour: 18, filter: (t: string) => parseTimeToFloat(t) >= 18 && parseTimeToFloat(t) <= 24 && parseTimeToFloat(t) != 0 },
      { key: "khuya", title: "KHUYA", hours: "00:00 - 06:00", startHour: 0, filter: (t: string) => parseTimeToFloat(t) >= 0 && parseTimeToFloat(t) < 6 }
    ];

    const getStaffSkill = (idx: number) => {
      const skills = ["Pha chế", "Phục vụ", "Thu ngân"];
      return skills[idx % 3];
    };

    const getStaffColor = (idx: number) => {
      const colors = [
        { bg: "bg-[#FFF9E6] border-[#F3D9A2] text-[#7C5A14]", bar: "bg-[#E6A23C]" },
        { bg: "bg-[#EBF8F2] border-[#A3E2C9] text-[#1D6F4E]", bar: "bg-[#2ECC71]" },
        { bg: "bg-[#FDF2F2] border-[#F8B4B4] text-[#9B1C1C]", bar: "bg-[#E74C3C]" },
        { bg: "bg-[#F0F5FF] border-[#D0E2FF] text-[#0043CE]", bar: "bg-[#3F51B5]" },
        { bg: "bg-[#F2F1FD] border-[#D7D4FB] text-[#4F46E5]", bar: "bg-[#6366F1]" }
      ];
      return colors[idx % colors.length];
    };

    return (
      <div className="space-y-4 pb-28 anim-fadeUp text-[#4B3621]">
        {/* Header Title with responsive layout */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#7c4831]/10 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#7c4831] uppercase tracking-wide">Lịch ca trực</h3>
            <p className="text-[11px] text-gray-500 font-semibold mt-0.5">
              Tuần {weekDays[0].dayNum} – {weekDays[6].dayNum}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Week navigation */}
            <div className="flex gap-1 bg-[#FAF9F6] border border-gray-150 p-0.5 rounded-2xl">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="py-1 px-2.5 rounded-xl text-[10px] font-bold text-[#4B3621] hover:bg-[#7c4831]/5"
              >
                Trước
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className={`py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${weekOffset === 0
                  ? "bg-[#7c4831] text-white shadow-xs"
                  : "text-[#4B3621] hover:bg-[#7c4831]/5"
                  }`}
              >
                Hiện tại
              </button>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className={`py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${weekOffset === 1
                  ? "bg-[#7c4831] text-white shadow-xs"
                  : "text-[#4B3621] hover:bg-[#7c4831]/5"
                  }`}
              >
                Sau
              </button>
            </div>
            {isRegGateLocked && (
              <span className="pill pill-red border text-[9px] font-bold">🔒 Cổng khóa</span>
            )}
          </div>
        </div>

        {/* Info Legend */}
        <div className="card p-3 bg-[#FAF9F6] border border-gray-150 rounded-2xl flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-black uppercase text-[#7c4831]">
          <span>💡 Nhấn vào ngày bất kỳ trên bảng để đăng ký hoặc chỉnh sửa ca rảnh</span>
        </div>

        {/* Bảng Đăng Ký Khung Giờ Rảnh */}
        <div className="card p-0 overflow-hidden border border-gray-150 shadow-sm bg-white rounded-3xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-150 bg-[#FAF9F6] text-center text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <th className="p-3 text-left w-[110px] min-w-[110px] bg-stone-50/50">Ca</th>
                  {weekDays.map(day => (
                    <th key={day.dateStr} className="p-3 border-l border-gray-150">
                      <div className="text-[10px]">{day.label}</div>
                      <div className="text-gray-400 text-[9px] font-bold mt-0.5">{day.dayNum}</div>
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
                      const avails = (availList || []).filter((a: any) => a.date === day.dateStr && cat.filter(a.startTime)).filter((v: any, i: number, arr: any[]) => arr.findIndex(t => t.id === v.id) === i);
                      
                      // Check if this category has already been scheduled/chốt by some other staff member
                      const hasOfficialInCat = (officialSchedulesList || []).some(
                        (s: any) => s.date === day.dateStr && cat.filter(s.startTime)
                      );

                      return (
                        <td
                          key={day.dateStr}
                          onClick={() => {
                            if (isRegGateLocked) {
                              alert("Cổng đăng ký ca rảnh hiện đang bị khóa!");
                              return;
                            }
                            
                            if (hasOfficialInCat) {
                              alert("Ca làm việc này đã được quản lý chốt nhân sự trực, không thể đăng ký rảnh thêm!");
                              return;
                            }
                            
                            // Check if they already have an official schedule chốt
                            const myOfficial = (officialSchedulesList || []).find((sc: any) => sc.userId === activeStaff?.id && sc.date === day.dateStr);
                            if (myOfficial) {
                              alert("Lịch ngày này đã được quản lý chốt chính thức, không thể thay đổi ca rảnh!");
                              return;
                            }

                            setSelectedDate(day.dateStr);
                            setShiftDate(day.dateStr);

                            // Pre-fill existing avails if any
                            const myExisting = (availList || []).find((a: any) => a.userId === activeStaff?.id && a.date === day.dateStr);
                            if (myExisting) {
                              setSelectedStartHour(myExisting.startTime);
                              setSelectedEndHour(myExisting.endTime);
                              setIsOvernightReg(parseTimeToFloat(myExisting.endTime) < parseTimeToFloat(myExisting.startTime));
                            } else {
                              // Default start based on category
                              if (cat.key === "sang") {
                                setSelectedStartHour("06:00");
                                setSelectedEndHour("12:00");
                              } else if (cat.key === "chieu") {
                                setSelectedStartHour("12:00");
                                setSelectedEndHour("18:00");
                              } else if (cat.key === "toi") {
                                setSelectedStartHour("18:00");
                                setSelectedEndHour("23:00");
                              } else {
                                setSelectedStartHour("23:00");
                                setSelectedEndHour("07:00");
                              }
                              setIsOvernightReg(cat.key === "khuya" || cat.key === "toi");
                            }
                            setShowRegModal(true);
                          }}
                          className={`p-2 border-l border-gray-150 align-top text-left min-w-[125px] ${
                            hasOfficialInCat ? "bg-stone-50 cursor-not-allowed opacity-80" : "cursor-pointer hover:bg-[#7c4831]/5 transition-colors"
                          }`}
                        >
                          <div className="space-y-2 min-h-[95px] flex flex-col justify-start">
                            {avails.length === 0 ? (
                              hasOfficialInCat ? (
                                <div className="py-7 px-1 text-center border border-dashed border-stone-250 bg-stone-100 rounded-2xl text-[8px] text-stone-500 font-extrabold uppercase select-none flex-grow flex items-center justify-center gap-1">
                                  <span>🔒 Đã có người trực</span>
                                </div>
                              ) : (
                                <div className="py-7 px-1 text-center border border-dashed border-gray-200 rounded-2xl text-[8px] text-gray-400 font-extrabold uppercase select-none flex-grow flex items-center justify-center">
                                  Trống
                                </div>
                              )
                            ) : (
                              avails.map((avail: any) => {
                                const sIdx = (staffList || []).findIndex((s: any) => s.id === avail.userId);
                                const isMe = avail.userId === activeStaff?.id;
                                const staffName = isMe ? "Bạn" : (avail.userFullName || "Nhân viên");
                                const skill = getStaffSkill(sIdx === -1 ? 0 : sIdx);
                                const col = getStaffColor(sIdx === -1 ? 0 : sIdx);
                                const crossesMidnight = parseTimeToFloat(avail.endTime) < parseTimeToFloat(avail.startTime);

                                // Check if this candidate is scheduled on this day
                                const dayScheds = (officialSchedulesList || []).filter((sc: any) => sc.userId === avail.userId && sc.date === day.dateStr);
                                const currentSched = dayScheds.find((sc: any) => {
                                  let ss = parseTimeToFloat(sc.startTime);
                                  let se = parseTimeToFloat(sc.endTime);
                                  if (se < ss) se += 24;
                                  let as = parseTimeToFloat(avail.startTime);
                                  let ae = parseTimeToFloat(avail.endTime);
                                  if (ae < as) ae += 24;
                                  return ss >= as && se <= ae;
                                });

                                return (
                                  <div key={avail.id} className={`p-2 rounded-xl border ${isMe ? 'border-2 border-dashed border-blue-500 bg-[#E6F4FE]' : col.bg} space-y-1 shadow-2xs relative`}>
                                    {isMe && !isRegGateLocked && !currentSched && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteAvail(avail.id);
                                        }}
                                        className="absolute -top-1 -right-1 bg-rose-500 hover:bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black pointer-events-auto cursor-pointer shadow-xs border border-white z-20"
                                        title="Xóa ca rảnh của bạn"
                                      >
                                        ×
                                      </button>
                                    )}
                                    <div className="font-extrabold uppercase text-[9px] tracking-tight truncate flex items-center gap-1 pr-3">
                                      <span>{isMe ? "⭐" : (skill === "Pha chế" ? "☕" : skill === "Phục vụ" ? "🛎" : "💵")}</span>
                                      <span>{staffName}</span>
                                    </div>
                                    <div className="text-[8px] font-black opacity-80">
                                      {avail.startTime} - {avail.endTime}{crossesMidnight ? " (Hôm sau)" : ""}
                                    </div>
                                    
                                    {/* Scheduling status badge */}
                                    {currentSched ? (
                                      (() => {
                                        const isLeaveApprovedForColleague = (requests || []).some((r: any) => r.type === "leave" && r.targetShiftId === currentSched?.id && r.status === "approved");
                                        if (isLeaveApprovedForColleague) {
                                          return (
                                            <div className="text-[7.5px] font-black uppercase text-rose-800 bg-rose-50/90 px-1 py-0.5 rounded-md border border-rose-250 w-fit">
                                              🚨 XIN VẮNG
                                            </div>
                                          );
                                        }
                                        return (
                                          <div className="text-[7.5px] font-black uppercase text-emerald-800 bg-emerald-50/90 px-1 py-0.5 rounded-md border border-emerald-250 w-fit">
                                            🟢 Đã chốt: {currentSched.startTime}-{currentSched.endTime}{parseTimeToFloat(currentSched.endTime) < parseTimeToFloat(currentSched.startTime) ? " (Hôm sau)" : ""}
                                          </div>
                                        );
                                      })()
                                    ) : (
                                      <div className="text-[7.5px] font-black uppercase text-gray-500 bg-stone-50/90 px-1 py-0.5 rounded-md border border-stone-200 w-fit">
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

        {/* REGISTRATION MODAL WITH FIXED OVERLAY CLASS */}
        {showRegModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 anim-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative space-y-4 anim-scaleUp">
              <h3 className="text-sm font-black uppercase text-[#7c4831] border-b pb-2">
                ĐĂNG KÝ KHUNG GIỜ RẢNH
              </h3>
              <form onSubmit={handleRegisterFreeShift} className="space-y-3.5">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Ngày đăng ký</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setShiftDate(e.target.value);
                    }}
                    className="select text-xs font-bold w-full p-2.5 border border-gray-250 rounded-2xl bg-white"
                  >
                    {weekDays.map(d => (
                      <option key={d.dateStr} value={d.dateStr}>{d.label} ({d.dayNum})</option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const hoursList = [];
                  for (let h = 0; h < 24; h++) {
                    const hh = String(h).padStart(2, '0');
                    hoursList.push(`${hh}:00`);
                    hoursList.push(`${hh}:30`);
                  }
                  return (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Bắt đầu</label>
                        <select
                          value={selectedStartHour}
                          onChange={(e) => setSelectedStartHour(e.target.value)}
                          className="select text-xs font-bold w-full p-2.5 border border-gray-250 rounded-2xl bg-white"
                        >
                          {hoursList.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Kết thúc</label>
                        <select
                          value={selectedEndHour}
                          onChange={(e) => setSelectedEndHour(e.target.value)}
                          className="select text-xs font-bold w-full p-2.5 border border-gray-250 rounded-2xl bg-white"
                        >
                          {hoursList.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="overnight-chk"
                    checked={isOvernightReg}
                    onChange={(e) => setIsOvernightReg(e.target.checked)}
                    className="checkbox"
                  />
                  <label htmlFor="overnight-chk" className="text-[10px] font-bold text-gray-600 uppercase select-none cursor-pointer">
                    Ca qua đêm (Kết thúc vào hôm sau)
                  </label>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowRegModal(false)}
                    className="px-4 py-2 rounded-2xl border border-gray-300 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                  >
                    HỦY
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#7c4831] hover:bg-[#633926] text-white rounded-2xl text-xs font-black uppercase cursor-pointer"
                  >
                    ĐỒNG Ý
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };
  // === REQUESTS ===
  const ReqView = () => {
    const myReqs = requests?.filter((r: any) => r.staffId === activeStaff?.id) || [];

    const formatShiftDisplay = (sched: any) => {
      const daysOfWeek = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
      const parts = sched.date.split('-');
      const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const startDayStr = daysOfWeek[dObj.getDay()];

      const startHour = sched.startTime;
      const endHour = sched.endTime;

      if (endHour < startHour) {
        // Shift extends to next day
        const endDate = new Date(dObj);
        endDate.setDate(endDate.getDate() + 1);
        const endDayStr = daysOfWeek[endDate.getDay()];
        return `${startDayStr} (${sched.date}) ${startHour} - ${endDayStr} (${endDate.toISOString().split('T')[0]}) ${endHour}`;
      }
      return `${startDayStr} (${sched.date}) ${startHour} - ${endHour}`;
    };

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${hours}:${minutes}`;

    const isShiftInFuture = (s: any) => {
      if (s.date > todayStr) return true;
      if (s.date === todayStr) {
        return s.endTime > currentTimeStr;
      }
      return false;
    };

    const isOverlap = (s1: any, s2: any) => {
      const parseTimeToDate = (dateStr: string, timeStr: string) => {
        const parts = timeStr.split(":");
        const hour = parseInt(parts[0], 10);
        const min = parseInt(parts[1], 10);
        const d = new Date(dateStr);
        d.setHours(hour, min, 0, 0);
        return d;
      };

      const start1 = parseTimeToDate(s1.date, s1.startTime);
      let end1 = parseTimeToDate(s1.date, s1.endTime);
      if (parseTimeToFloat(s1.endTime) < parseTimeToFloat(s1.startTime)) {
        end1.setDate(end1.getDate() + 1);
      }

      const start2 = parseTimeToDate(s2.date, s2.startTime);
      let end2 = parseTimeToDate(s2.date, s2.endTime);
      if (parseTimeToFloat(s2.endTime) < parseTimeToFloat(s2.startTime)) {
        end2.setDate(end2.getDate() + 1);
      }

      return start1 < end2 && start2 < end1;
    };

    const myOfficialShifts = (officialSchedulesList || []).filter(
      (s: any) => s.userId === activeStaff?.id
    );

    const myEligibleShifts = (officialSchedulesList || []).filter(
      (s: any) => s.userId === activeStaff?.id && s.date === reqDate && !s.clockedIn && isShiftInFuture(s)
    );

    const colleagueEligibleShifts = (officialSchedulesList || []).filter(
      (s: any) => {
        if (s.userId !== swapWithStaffId || s.date !== swapColleagueDate || s.clockedIn || !isShiftInFuture(s)) {
          return false;
        }
        const overlapsWithMe = myOfficialShifts.some(myShift => isOverlap(s, myShift));
        return !overlapsWithMe;
      }
    );

    return (
      <div className="space-y-4 pb-28 anim-fadeUp">
        <div className="card"><h3 className="text-base font-bold text-[#7c4831] uppercase">Đơn Yêu Cầu Nhân Sự</h3></div>



        <form onSubmit={handleReq} className="card space-y-3">
          <h4 className="text-[10px] font-bold text-[#7c4831] uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={12} className="text-[#7c4831]" /> Gửi đơn yêu cầu mới
          </h4>
          <select
            value={reqType}
            onChange={e => {
              setReqType(e.target.value as any);
              setSwapShiftId("");
              setSwapStaffName("");
              setTargetShiftId("");
              setSwapWithStaffId("");
              setSwapWithShiftId("");
            }}
            className="input w-full text-sm cursor-pointer font-semibold"
            id="req-type"
          >
            <option value="leave">Xin vắng mặt ca trực</option>
            <option value="swap">Đăng ký đổi ca trực</option>
          </select>

          {reqType === "leave" && (
            <select
              required
              value={targetShiftId}
              onChange={e => {
                const shiftId = e.target.value;
                setTargetShiftId(shiftId);
                const sh = (officialSchedulesList || []).find((s: any) => s.id === shiftId);
                if (sh) {
                  setReqDate(sh.date);
                }
              }}
              className="input w-full text-sm font-semibold cursor-pointer"
            >
              <option value="">Chọn ca trực của bạn muốn xin nghỉ</option>
              {(() => {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                const currentTimeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });

                return (officialSchedulesList || [])
                  .filter((s: any) => {
                    if (s.userId !== activeStaff?.id) return false;
                    if (s.date > todayStr) return true;
                    if (s.date === todayStr) {
                      return s.endTime > currentTimeStr;
                    }
                    return false;
                  })
                  .map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.date} (Ca: {s.startTime} - {s.endTime})
                    </option>
                  ));
              })()}
            </select>
          )}

          {reqType === "swap" && (
            <input
              type="date"
              required
              value={reqDate}
              onChange={e => {
                setReqDate(e.target.value);
                setTargetShiftId("");
                setSwapWithShiftId("");
              }}
              className="input w-full text-sm font-semibold"
              id="req-date"
            />
          )}

          {/* Swap selects shown under date only if date is chosen */}
          {reqType === "swap" && (
            <>
              {/* Own shifts collapsible list */}
              <div className="border border-[#7c4831]/10 rounded-2xl p-3 bg-[#FAF9F6]/50">
                <div
                  className="flex justify-between items-center cursor-pointer pb-2 border-b border-[#7c4831]/5"
                  onClick={() => setOwnShiftsCollapsed(!ownShiftsCollapsed)}
                >
                  <span className="text-[10px] font-bold text-[#7c4831] uppercase tracking-wider">Ca làm của bạn ({myEligibleShifts.length})</span>
                  <span className="text-[10px] text-[#7c4831]/60 font-bold">{ownShiftsCollapsed ? "▼ Hiện" : "▲ Ẩn"}</span>
                </div>
                {!ownShiftsCollapsed && (
                  <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                    {myEligibleShifts.length === 0 ? (
                      <p className="text-[10px] text-gray-500 italic mt-1">Không có ca trực khả dụng (hoặc đã checkin) trong ngày này.</p>
                    ) : (
                      myEligibleShifts.map((s: any) => (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${targetShiftId === s.id
                            ? "bg-[#7c4831]/5 border-[#7c4831]"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                          <input
                            type="radio"
                            name="ownShift"
                            value={s.id}
                            checked={targetShiftId === s.id}
                            onChange={() => setTargetShiftId(s.id)}
                            className="accent-[#7c4831]"
                          />
                          <span>{formatShiftDisplay(s)}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Colleague selection */}
              <select
                required
                value={swapWithStaffId}
                onChange={e => {
                  const selectedId = e.target.value;
                  setSwapWithStaffId(selectedId);
                  const matched = colleagues.find(c => c.id === selectedId);
                  setSwapStaffName(matched ? matched.fullName : "");
                  setSwapWithShiftId("");
                }}
                className="input w-full text-sm font-semibold cursor-pointer"
              >
                <option value="">Chọn đồng nghiệp muốn đổi ca</option>
                {colleagues.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>

              {/* Colleague date selection */}
              {swapWithStaffId && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-[#7c4831] block">Ngày trực của đồng nghiệp muốn đổi</label>
                  <input
                    type="date"
                    required
                    value={swapColleagueDate}
                    onChange={e => {
                      setSwapColleagueDate(e.target.value);
                      setSwapWithShiftId("");
                    }}
                    className="input w-full text-sm font-semibold"
                  />
                </div>
              )}

              {/* Colleague shifts collapsible list */}
              {swapWithStaffId && (
                <div className="border border-[#7c4831]/10 rounded-2xl p-3 bg-[#FAF9F6]/50">
                  <div
                    className="flex justify-between items-center cursor-pointer pb-2 border-b border-[#7c4831]/5"
                    onClick={() => setColleagueShiftsCollapsed(!colleagueShiftsCollapsed)}
                  >
                    <span className="text-[10px] font-bold text-[#7c4831] uppercase tracking-wider">Ca làm của đồng nghiệp ({colleagueEligibleShifts.length})</span>
                    <span className="text-[10px] text-[#7c4831]/60 font-bold">{colleagueShiftsCollapsed ? "▼ Hiện" : "▲ Ẩn"}</span>
                  </div>
                  {!colleagueShiftsCollapsed && (
                    <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                      {colleagueEligibleShifts.length === 0 ? (
                        <p className="text-[10px] text-gray-500 italic mt-1">Đồng nghiệp không có ca trực khả dụng (hoặc đã checkin) trong ngày này.</p>
                      ) : (
                        colleagueEligibleShifts.map((s: any) => (
                          <label
                            key={s.id}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${swapWithShiftId === s.id
                              ? "bg-[#7c4831]/5 border-[#7c4831]"
                              : "bg-white border-gray-200 hover:bg-gray-50"
                              }`}
                          >
                            <input
                              type="radio"
                              name="colleagueShift"
                              value={s.id}
                              checked={swapWithShiftId === s.id}
                              onChange={() => setSwapWithShiftId(s.id)}
                              className="accent-[#7c4831]"
                            />
                            <span>{formatShiftDisplay(s)}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <textarea
            placeholder="Lý do chi tiết gửi Ban Quản Trị..."
            required
            value={reqDetails}
            onChange={e => setReqDetails(e.target.value)}
            className="input w-full text-sm resize-none font-semibold"
            rows={2}
            id="req-detail"
          />
          <button type="submit" className="btn btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5 font-bold" id="req-send">
            <Send size={11} /> Gửi đơn yêu cầu
          </button>
        </form>

        <div className="card space-y-3.5">
          <h4 className="text-[10px] font-bold text-[#7c4831] uppercase tracking-wider">📋 Đơn đã gửi ({myReqs.length})</h4>
          {myReqs.length === 0 ? (
            <p className="text-xs text-[#4B3621]/60 font-semibold italic">Chưa gửi đơn yêu cầu nào.</p>
          ) : myReqs.map((r: any) => (
            <div key={r.id} className="p-3.5 rounded-2xl bg-[#FAF9F6] border border-[#7c4831]/5 text-xs space-y-1.5 shadow-sm">
              <div className="flex justify-between items-center">
                <span className={`pill ${r.type === "leave" ? "pill-violet" : "pill-blue"}`}>{r.type === "leave" ? "Nghỉ phép" : "Đổi ca"}</span>
                <span className={`pill ${r.status === "approved" ? "pill-green" : r.status === "rejected" ? "pill-red" : "pill-amber"} text-[8px]`}>
                  {r.status === "approved" ? "Đã duyệt" : r.status === "rejected" ? "Từ chối" : "Chờ"}
                </span>
              </div>
              <p className="text-[#4B3621] font-semibold mt-1">{r.date} — {r.details}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // === LOGS ===
  const LogsView = () => {
    const myLogs = logs?.filter((l: any) => activeStaff && l.staffName === activeStaff.name) || [];

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

    const myManualAdjustments = adjustmentsList.filter(
      (item: any) =>
        activeStaff &&
        ((item.EmployeeId && item.EmployeeId === activeStaff.id) ||
          (item.EmployeeName && item.EmployeeName === activeStaff.name) ||
          (item.EmployeeId && item.EmployeeId === activeStaff.name))
    );

    // Tính toán các ca đi trễ tự động từ lịch sử check-in
    const myAutoLatePenalties = (officialSchedulesList || [])
      .filter((s: any) => activeStaff && s.userId === activeStaff.id && s.checkInTime)
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
        const amount = getLatePenaltyAmount(lateMin);
        return {
          Date: s.date,
          Type: "penalty",
          Amount: amount,
          Note: `Đi muộn ${lateMin} phút (Ca ${s.startTime} - ${s.endTime})`,
          IsAuto: true
        };
      })
      .filter((item: any) => item.Amount > 0);

    // Tính toán các ca đi làm ngày lễ tự động (Thưởng lễ hệ số & flat bonus)
    const myAutoHolidayBonuses = (officialSchedulesList || [])
      .filter((s: any) => activeStaff && s.userId === activeStaff.id && s.clockedOut)
      .map((s: any) => {
        const matchedHoliday = detailedHolidaysList.find((h: any) => h.Date === s.date);
        if (matchedHoliday) {
          const mult = matchedHoliday.Multiplier > 0 ? matchedHoliday.Multiplier : 2.0;
          const flat = matchedHoliday.FlatBonus || 0;
          if (mult > 1.0 || flat > 0) {
            const hourlyWage = activeStaff.hourlyWage || 25000;
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
              return {
                Date: s.date,
                Type: "bonus",
                Amount: totalHolidayBonus,
                Note: `Đi làm ngày lễ ${matchedHoliday.Note} (Hệ số x${mult}${flat > 0 ? ` + ${flat.toLocaleString()}đ` : ''})`,
                IsAuto: true
              };
            }
          }
        }
        return null;
      })
      .filter((item: any) => item !== null);

    // Hợp nhất các danh sách thưởng/phạt
    const myAdjustments = [
      ...myManualAdjustments,
      ...myAutoLatePenalties,
      ...myAutoHolidayBonuses
    ];

    const totalBonus = myAdjustments
      .filter((item: any) => item.Type === "bonus")
      .reduce((sum: number, item: any) => sum + (item.Amount || (item.Quantity * item.AmountPerUnit) || 0), 0);

    const totalPenalty = myAdjustments
      .filter((item: any) => item.Type === "penalty")
      .reduce((sum: number, item: any) => sum + (item.Amount || (item.Quantity * item.AmountPerUnit) || 0), 0);

    const totalAdvance = myAdjustments
      .filter((item: any) => item.Type === "advance")
      .reduce((sum: number, item: any) => sum + (item.Amount || (item.Quantity * item.AmountPerUnit) || 0), 0);

    const netAdjustment = totalBonus - totalPenalty - totalAdvance;

    return (
      <div className="space-y-4 pb-28 anim-fadeUp">
        {/* Rewards / Penalties Summary */}
        <div className="card space-y-4">
          <h3 className="text-base font-bold text-[#7c4831] uppercase flex items-center gap-1.5 font-sans">
            <Award size={18} className="text-[#7c4831]" /> Thưởng & Phạt của tôi
          </h3>

          <div className="grid grid-cols-4 gap-1.5 font-sans">
            <div className="p-1 sm:p-2 bg-emerald-50 border border-emerald-150 rounded-xl text-center flex flex-col justify-between">
              <span className="text-[7px] sm:text-[9px] font-black uppercase text-emerald-800">Tổng thưởng</span>
              <p className="text-[10px] sm:text-xs font-bold text-emerald-600 mt-1 font-mono">+{totalBonus.toLocaleString("vi-VN")}đ</p>
            </div>
            <div className="p-1 sm:p-2 bg-red-50 border border-red-150 rounded-xl text-center flex flex-col justify-between">
              <span className="text-[7px] sm:text-[9px] font-black uppercase text-red-800">Tổng phạt</span>
              <p className="text-[10px] sm:text-xs font-bold text-red-600 mt-1 font-mono">-{totalPenalty.toLocaleString("vi-VN")}đ</p>
            </div>
            <div className="p-1 sm:p-2 bg-amber-50 border border-amber-150 rounded-xl text-center flex flex-col justify-between">
              <span className="text-[7px] sm:text-[9px] font-black uppercase text-amber-800">Tạm ứng</span>
              <p className="text-[10px] sm:text-xs font-bold text-amber-600 mt-1 font-mono">-{totalAdvance.toLocaleString("vi-VN")}đ</p>
            </div>
            <div className={`p-1 sm:p-2 border rounded-xl text-center flex flex-col justify-between ${netAdjustment >= 0 ? "bg-amber-50 border-amber-150" : "bg-red-50 border-red-150"}`}>
              <span className="text-[7px] sm:text-[9px] font-black uppercase text-[#7c4831]">Thực nhận</span>
              <p className={`text-[10px] sm:text-xs font-bold mt-1 font-mono ${netAdjustment >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {netAdjustment >= 0 ? "+" : ""}{netAdjustment.toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>

          {/* Details list of adjustments */}
          {myAdjustments.length > 0 ? (
            <div className="border-t border-[#7c4831]/10 pt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
              <span className="text-[9px] font-black uppercase text-gray-400 block tracking-wide font-sans">Chi tiết các khoản</span>
              {myAdjustments.map((item: any, idx: number) => {
                const amount = item.Amount || (item.Quantity * item.AmountPerUnit) || 0;
                return (
                  <div key={idx} className="flex justify-between items-center bg-[#FAF9F6] border border-[#7c4831]/5 p-2 rounded-xl text-[11px] font-semibold">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-mono text-gray-400">{item.Date}</span>
                        <span className={`pill ${item.Type === "bonus" ? "pill-green" : item.Type === "advance" ? "pill-amber" : "pill-red"} border text-[7px] font-black uppercase px-1 py-0 font-sans`}>
                          {item.Type === "bonus" ? "Thưởng" : item.Type === "advance" ? "Tạm ứng" : "Phạt"}
                        </span>
                      </div>
                      <p className="text-[#4B3621] text-[10px] leading-tight italic">{item.Note}</p>
                    </div>
                    <span className={`font-bold font-mono text-xs ${item.Type === "bonus" ? "text-emerald-600" : item.Type === "advance" ? "text-amber-600" : "text-red-600"}`}>
                      {item.Type === "bonus" ? "+" : "-"}{amount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 italic text-center pt-2 font-sans">Không có khoản thưởng/phạt riêng nào.</p>
          )}
        </div>

        {/* Activity Logs */}
        <div className="card"><h3 className="text-base font-bold text-[#7c4831] uppercase font-sans">Lịch Sử Hoạt Động Cá Nhân</h3></div>
        <div className="space-y-3">
          {myLogs.length === 0 ? (
            <div className="card text-center py-6"><p className="text-xs text-[#4B3621]/60 font-semibold italic font-sans">Chưa ghi nhận hoạt động công ca nào.</p></div>
          ) : myLogs.map((l: any) => (
            <div key={l.id} className="card p-4 border-l-4 border-l-[#7c4831]">
              <div className="flex justify-between text-[9px] font-bold mb-1.5">
                <span className="text-[#7c4831]/70 font-mono">{l.time}</span>
                <span className="pill bg-[#E0F2FE] text-[#075985] text-[8px] font-extrabold font-sans">{l.action}</span>
              </div>
              <p className="text-xs font-semibold text-[#4B3621]">{l.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ProfileView = () => {
    if (!activeStaff) return null;
    return (
      <div className="space-y-5 pb-28 anim-fadeUp">
        <div className="card">
          <h3 className="text-base font-bold text-[#7c4831] uppercase">Hồ Sơ Nhân Viên</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="card space-y-4">
          {saved && (
            <div className="p-3 bg-[#D3ECE1] rounded-xl text-xs text-[#1B523A] flex items-center gap-1.5 font-bold shadow-sm animate-scaleIn">
              <CheckCircle size={14} /> Cập nhật họ tên thành công!
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#7c4831] font-bold uppercase tracking-wider block">Mã số nhân viên (ID)</label>
            <input type="text" disabled value={activeStaff.id} className="input w-full text-sm opacity-60 cursor-not-allowed  font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#7c4831] font-bold uppercase tracking-wider block">Số điện thoại</label>
            <input type="text" disabled value={activeStaff.phone || "0900000003"} className="input w-full text-sm opacity-60 cursor-not-allowed  font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#4B3621]/80 font-bold uppercase tracking-wider block">Họ và tên *</label>
            <input type="text" required value={pName} onChange={e => setPName(e.target.value)} className="input w-full text-sm font-semibold" id="staff-p-name" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#7c4831] font-bold uppercase tracking-wider block">Vai trò công việc</label>
            <input type="text" disabled value={activeStaff.role || "Nhân viên ca trực"} className="input w-full text-sm opacity-60 cursor-not-allowed font-semibold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#7c4831] font-bold uppercase tracking-wider block">Mức lương theo giờ</label>
            <input type="text" disabled value={`${(activeStaff.hourlyWage || 25000).toLocaleString("vi-VN")}đ/giờ`} className="input w-full text-sm opacity-60 cursor-not-allowed font-semibold " />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#7c4831] font-bold uppercase tracking-wider block">Chi nhánh đang trực</label>
            <input type="text" disabled value={activeLocation?.name || "The Moods Gò Vấp"} className="input w-full text-sm opacity-60 cursor-not-allowed font-semibold" />
          </div>
          <button type="submit" className="btn btn-primary w-full py-3.5 text-sm font-bold" id="staff-save">Lưu hồ sơ</button>
        </form>

        <div className="card space-y-4">
          <h4 className="text-xs font-bold text-[#7c4831] uppercase">Thiết lập bảo mật thiết bị</h4>
          <p className="text-[11px] text-gray-500 font-medium">Đăng ký vân tay/sinh trắc học trên trình duyệt này để phục vụ chấm công và đăng nhập nhanh.</p>
          <button
            type="button"
            onClick={handleRegisterBiometricDirectly}
            className="btn btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11a5 5 0 00-10 0c0 .353.017.702.051 1.045l-.011-.05M12 11c0-3.517 1.009-6.799 2.753-9.571m3.44 2.04l-.054.09A13.916 13.916 0 0015 11a5 5 0 0010 0c0-.353-.017-.702-.051-1.045l.011.05M12 11V3" />
            </svg>
            <span>Kích hoạt Touch ID thiết bị này</span>
          </button>
        </div>

        <div className="card space-y-4 text-left">
          <h4 className="text-xs font-bold text-[#7c4831] uppercase">Đổi mã PIN cá nhân</h4>
          <p className="text-[11px] text-gray-500 font-medium">Thay đổi mã PIN gồm 6 số để đăng nhập cổng nhân viên hoặc xác thực.</p>
          <form onSubmit={handleChangePin} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] text-[#7c4831] font-bold uppercase tracking-wider block">Mã PIN cũ *</label>
              <input
                type="password"
                maxLength={6}
                required
                placeholder="Nhập 6 số PIN cũ"
                value={oldPin}
                onChange={e => setOldPin(e.target.value)}
                className="input w-full text-xs font-semibold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-[#7c4831] font-bold uppercase tracking-wider block">Mã PIN mới *</label>
              <input
                type="password"
                maxLength={6}
                required
                placeholder="Nhập 6 số PIN mới"
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                className="input w-full text-xs font-semibold"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary w-full py-2.5 text-xs font-bold mt-1"
            >
              Cập nhật mã PIN
            </button>
          </form>
        </div>

        <button onClick={handleLogout} className="btn btn-ghost w-full py-3.5 text-sm flex items-center justify-center gap-1.5 font-bold text-rose-700 hover:bg-rose-50" id="staff-logout-btn">
          <LogOut size={14} /> Đăng xuất tài khoản
        </button>
      </div>
    );
  };

  const navTabs = [
    { key: "scan", icon: ScanLine, label: "Quét QR" },
    { key: "attend", icon: Clock, label: "Chấm công" },
    { key: "schedule", icon: Calendar, label: "Lịch ca" },
    { key: "requests", icon: ArrowLeftRight, label: "Yêu cầu" },
    { key: "logs", icon: Activity, label: "Nhật ký" },
    { key: "profile", icon: User, label: "Hồ sơ" },
  ];

  const Content = () => {
    if (locked) return LockView();
    if (!activeStaff) return AuthView();
    switch (tab) {
      case "attend": return AttendView();
      case "schedule": return SchedView();
      case "requests": return ReqView();
      case "logs": return LogsView();
      case "profile": return ProfileView();
      default: return ScanView();
    }
  };

  if (isAuthChecking) {
    return null;
  }

  return (
    <div className="h-[100dvh] w-screen overflow-hidden text-[#4B3621] flex flex-col antialiased">
      <div className="flex-grow max-w-md w-full mx-auto flex flex-col relative border-x border-[#7c4831]/10 shadow-sm h-[100dvh] max-h-[100dvh] overflow-hidden">

        {/* Header PWA */}
        <header className="bg-[#F4EADF] px-4 py-4 shrink-0 flex justify-between items-center sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2">
            {!activeStaff && (
              <Link href="/" className="w-7 h-7 rounded-full bg-white border border-[#7c4831]/10 flex items-center justify-center hover:scale-95 transition-transform mr-1" id="staff-back-btn">
                <ArrowLeft size={12} className="text-[#7c4831]" />
              </Link>
            )}
            <span className="w-8 h-8 rounded-full bg-[#7c4831] flex items-center justify-center text-white text-xs font-bold ">
              TM
            </span>
            <div>
              <span className="font-extrabold text-[13px] uppercase tracking-wider text-[#7c4831] block leading-none">{activeBrand ? activeBrand.name.split(" - ")[0] : "Staff"}</span>
              <span className="text-[7.5px] font-bold text-[#7c4831]/60 uppercase tracking-widest leading-none mt-1 block">Staff Portal</span>
            </div>
          </div>
          {activeStaff && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotifications(true)}
                className="text-[#7c4831] hover:text-[#7A2F1E] transition-colors p-1 bg-white rounded-full border border-[#7c4831]/10 shadow-xs relative"
                title="Thông báo"
              >
                <Bell size={15} />
                {(notifications?.filter((n: any) => !n.isRead).length || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center animate-pulse">
                    {notifications.filter((n: any) => !n.isRead).length}
                  </span>
                )}
              </button>
              <span className="text-[11px] font-extrabold text-[#7c4831] tracking-wide">{activeStaff.name}</span>
              <button onClick={handleLogout} className="text-[#7c4831] hover:text-[#7A2F1E] transition-colors p-1 bg-white rounded-full border border-[#7c4831]/10 shadow-xs" id="staff-logout"><LogOut size={15} /></button>
            </div>
          )}
        </header>

        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-55 animate-fadeIn pointer-events-none">
            <div className={`p-3 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 pointer-events-auto bg-white ${toastType === "success" ? "border-emerald-200 text-emerald-800 bg-emerald-50/95" :
              toastType === "warning" ? "border-amber-200 text-amber-800 bg-amber-50/95" :
                "border-blue-200 text-blue-800 bg-blue-50/95"
              }`}>
              {toastType === "success" && <CheckCircle size={16} className="text-emerald-600 shrink-0" />}
              {toastType === "warning" && <AlertTriangle size={16} className="text-amber-600 shrink-0" />}
              {toastType === "info" && <Clock size={16} className="text-blue-600 shrink-0" />}
              <span className="flex-1">{toastMessage}</span>
            </div>
          </div>
        )}

        <main className="flex-grow p-4 overflow-y-auto relative">
          <PullToRefresh>
            {Content()}
          </PullToRefresh>
        </main>

        {activeStaff && !locked && !isKeyboardOpen && (
          <nav className="absolute bottom-3 left-3 right-3 glass-nav rounded-2xl py-2 px-1 grid grid-cols-6 gap-0.5 z-30 animate-scaleIn">
            {navTabs.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key as any)}
                className={`flex flex-col items-center justify-center py-2 rounded-xl transition-all ${tab === key ? "bg-[#7c4831] text-white shadow-sm" : "text-[#7c4831] hover:bg-[#7c4831]/5 font-semibold"}`}
                id={`staff-tab-${key}`}
              >
                <Icon size={16} />
                <span className="text-[10px] font-bold mt-1">{label}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Notification Drawer Modal */}
        {showNotifications && (
          <div className="fixed inset-0 bg-[#4B3621]/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-gray-150 shadow-xl space-y-4 animate-scaleIn text-[#4B3621] flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5 shrink-0">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-[#7c4831] flex items-center gap-1.5">
                    <Bell size={16} /> Thông báo của bạn ({(notifications?.filter((n: any) => !n.isRead).length || 0)})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 font-bold text-2xl transition-colors"
                  title="Đóng"
                >
                  ✕
                </button>
              </div>

              {pushPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={async () => {
                    await subscribeUserToPush?.(activeStaff.id);
                    if (typeof window !== "undefined" && "Notification" in window) {
                      setPushPermission(Notification.permission);
                    }
                  }}
                  className="btn btn-primary w-full py-2 flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider shrink-0"
                >
                  <Bell size={13} /> Bật Nhận Thông Báo Màn Hình Chờ
                </button>
              )}

              <div className="flex-grow overflow-y-auto space-y-2.5 pr-1">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && markNotificationAsRead?.(n.id)}
                      className={`p-3.5 rounded-2xl border text-xs transition-all relative ${n.isRead
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
          </div>
        )}
      </div>
    </div>
  );
}
