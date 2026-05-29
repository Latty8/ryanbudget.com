const PUSH_CONSENT_KEY = "planner-push-consent";

export function getPushConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PUSH_CONSENT_KEY) === "true";
}

export function setPushConsent(enabled: boolean) {
  localStorage.setItem(PUSH_CONSENT_KEY, enabled ? "true" : "false");
}

export async function requestWebPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  const permission = await Notification.requestPermission();
  setPushConsent(permission === "granted");
  return permission;
}

export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      icon: "/icon.svg",
      badge: "/icon.svg",
      ...options,
    });
  } catch {
    // Service worker may handle push instead
  }
}
