// Biometric & WebAuthn helper utilities for The Moods HRM

/**
 * Checks if the current browser environment is an in-app WebView
 * (Zalo, Facebook, Instagram, Messenger, WeChat, TikTok, Line, etc.)
 * which typically blocks or does not support WebAuthn / FIDO2.
 */
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined" || !navigator?.userAgent) return false;
  const ua = navigator.userAgent;
  return /FBAN|FBAV|Instagram|Line|MicroMessenger|Zalo|musical_ly|BytedanceWebview/i.test(ua);
}

/**
 * Returns a friendly explanation for users on how to open the site in Safari or Chrome
 * if they are currently inside an in-app browser.
 */
export const IN_APP_BROWSER_WARNING =
  "Bạn đang mở trang trong Zalo hoặc Facebook. Trình duyệt này không hỗ trợ Face ID / Vân tay.\n\n" +
  "Vui lòng nhấn vào biểu tượng dấu 3 chấm (⋯ hoặc ⋮) ở góc trên màn hình và chọn 'Mở bằng trình duyệt' (Safari trên iPhone hoặc Chrome trên Android) để sử dụng.";

/**
 * Safely resolves the Relying Party ID (rpId).
 * Must match the current domain without port/protocol.
 */
export function getRpId(): string {
  if (typeof window === "undefined") return "localhost";
  return window.location.hostname;
}

/**
 * Checks if WebAuthn is supported on the current device and context.
 */
export function isWebAuthnSupported(): { supported: boolean; reason?: string } {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Môi trường không hợp lệ." };
  }
  if (isInAppBrowser()) {
    return { supported: false, reason: IN_APP_BROWSER_WARNING };
  }
  if (!window.isSecureContext) {
    return {
      supported: false,
      reason: "Sinh trắc học yêu cầu kết nối bảo mật HTTPS (hoặc localhost).",
    };
  }
  if (!navigator.credentials || !window.PublicKeyCredential) {
    return {
      supported: false,
      reason: "Trình duyệt hoặc thiết bị của bạn không hỗ trợ API sinh trắc học WebAuthn.",
    };
  }
  return { supported: true };
}

/**
 * Parses raw biometric key strings from DB or localStorage into an array of Uint8Array credential IDs.
 * Handles single JSON number array: "[12,34,56...]"
 * As well as JSON string array of keys: "[\"[12,34]\",\"[56,78]\"]"
 */
export function parseBiometricKeys(raw: string | null | undefined): Uint8Array[] {
  if (!raw) return [];
  const result: Uint8Array[] = [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      if (parsed.length > 0 && typeof parsed[0] === "number") {
        // Single credential ID stored as number array
        result.push(new Uint8Array(parsed));
      } else if (parsed.length > 0 && typeof parsed[0] === "string") {
        // Multi-device: Array of serialized credential IDs
        for (const item of parsed) {
          try {
            const arr = JSON.parse(item);
            if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "number") {
              result.push(new Uint8Array(arr));
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  return result;
}
