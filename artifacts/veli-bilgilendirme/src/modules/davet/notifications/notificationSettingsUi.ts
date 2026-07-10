import type { PushSettings } from "@/lib/pushNotifications";

export type StatusTone = "success" | "warning" | "danger" | "neutral";

export const NOTIFICATION_COPY = {
  pageDescription:
    "Yoklama ve ödev takiplerinizi unutmamak için günlük hatırlatma bildirimleri alabilirsiniz.",
  accountInfo:
    "Bildirimler, bu hesabınızda bildirim izni verdiğiniz cihazlara gönderilir. Telefonunuza bildirim gelmesi için bu sayfayı telefondan açıp bildirimleri aktif etmeniz gerekir.",
  deviceCardTitle: "Bildirim hangi cihaza gelir?",
  deviceCardBody:
    "Bildirimler, bu hesabınızla bildirim izni verdiğiniz cihazlara gelir. Telefonunuzdan bildirim almak için bu sayfayı telefonda açıp «Bildirimleri Aç» veya «Aboneliği Yeniden Oluştur» butonuna basın.",
  desktopHint:
    "Şu an bilgisayardan işlem yapıyorsunuz. Telefon bildirimi için aynı işlemi telefonda da yapmanız gerekir.",
  enableHint: "Bu cihazda bildirim izni ister.",
  resubscribeHint: "Bildirim gelmiyorsa veya cihaz değiştiyse aboneliği yeniler.",
  testHint: "Bu hesaba bağlı aktif cihazlara deneme bildirimi gönderilir.",
  timeHint: "Tüm açık hatırlatmalar bu saatte gönderilir. Türkiye saatine göre çalışır.",
  saveSuccess: "Bildirim ayarları kaydedildi.",
  saveError: "Bildirim ayarları kaydedilemedi. Lütfen tekrar deneyin.",
  testSuccess: "Test bildirimi gönderildi. Cihazınızda bildirimi kontrol edin.",
  testNoSub: "Bu cihazda bildirim aboneliği yok. Önce Bildirimleri Aç butonuna basın.",
  testResubscribe: "Bildirim aboneliğiniz yenilenmeli. Aboneliği Yeniden Oluştur butonuna basın.",
  testDenied: "Bildirim izni engellenmiş. Tarayıcı ayarlarından izin vermeniz gerekiyor.",
} as const;

export function getDeviceKind(): "mobile" | "desktop" {
  if (typeof navigator === "undefined") return "desktop";
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ? "mobile" : "desktop";
}

export function getDeviceKindLabel(): string {
  return getDeviceKind() === "mobile" ? "Mobil cihaz" : "Bilgisayar";
}

export function getPermissionStatusLabel(permission: string): { label: string; tone: StatusTone } {
  switch (permission) {
    case "granted":
      return { label: "Verildi", tone: "success" };
    case "denied":
      return { label: "Engellendi", tone: "danger" };
    case "default":
      return { label: "Verilmedi", tone: "warning" };
    default:
      return { label: "Desteklenmiyor", tone: "neutral" };
  }
}

export function getInfraStatusLabel(configured: boolean): { label: string; tone: StatusTone } {
  return configured
    ? { label: "Hazır", tone: "success" }
    : { label: "Hazır değil", tone: "danger" };
}

export function getDeviceSubscriptionStatus(opts: {
  permission: string;
  browserHasSub: boolean;
  serverHasSub: boolean;
  needsRenewal: boolean;
}): { label: string; tone: StatusTone } {
  if (opts.needsRenewal) {
    return { label: "Yenilenmeli", tone: "warning" };
  }
  if (opts.permission !== "granted") {
    return { label: "Yok", tone: "warning" };
  }
  if (opts.browserHasSub && opts.serverHasSub) {
    return { label: "Aktif", tone: "success" };
  }
  if (opts.browserHasSub) {
    return { label: "Kayıt bekleniyor", tone: "warning" };
  }
  return { label: "Yok", tone: "warning" };
}

export function getReminderStatusLabel(enabled: boolean): { label: string; tone: StatusTone } {
  return enabled ? { label: "Açık", tone: "success" } : { label: "Kapalı", tone: "neutral" };
}

export function buildNotificationPreview(settings: PushSettings): { title: string; body: string } {
  const { dailyReminderEnabled, attendanceReminderEnabled, homeworkReminderEnabled } = settings;
  const title = "Nehari Platformu Hatırlatma";

  if (!dailyReminderEnabled && !attendanceReminderEnabled && !homeworkReminderEnabled) {
    return { title, body: "Şu an hatırlatma kapalı — bildirim gönderilmez." };
  }

  if (attendanceReminderEnabled && homeworkReminderEnabled) {
    return {
      title,
      body: "Bugünkü yoklama ve ödev takibini doldurmayı unutmayınız.",
    };
  }

  if (attendanceReminderEnabled && !homeworkReminderEnabled) {
    return {
      title,
      body: "Bugünkü yoklama bilgilerini kontrol etmeyi unutmayınız.",
    };
  }

  if (homeworkReminderEnabled && !attendanceReminderEnabled) {
    return {
      title,
      body: "Bugünkü ödev takiplerini tamamlamayı unutmayınız.",
    };
  }

  if (dailyReminderEnabled) {
    return {
      title,
      body: "Bugünkü yoklama ve ödev takibini doldurmayı unutmayınız.",
    };
  }

  return { title, body: "Hatırlatma ayarlarınızı kontrol edin." };
}

export const HELP_SECTIONS = {
  android: {
    title: "Android / Chrome",
    steps: [
      "Bu sayfayı telefonda açın.",
      "Bildirimleri Aç butonuna basın.",
      "İzin sorulursa «İzin ver» seçin.",
      "Bildirim gelmiyorsa Aboneliği Yeniden Oluştur butonuna basın.",
    ],
  },
  ios: {
    title: "iPhone / Safari",
    steps: [
      "Uygulamayı Safari'de açın.",
      "Paylaş simgesinden Ana Ekrana Ekle yapın.",
      "Uygulamayı ana ekrandan açın.",
      "Bildirimleri Aç butonuna basın.",
    ],
  },
  desktop: {
    title: "Bilgisayar / Chrome",
    steps: [
      "Bildirimleri Aç butonuna basın.",
      "İzin verin.",
      "Windows bildirimleri kapalıysa sistem ayarlarından Chrome bildirimlerini açın.",
    ],
  },
} as const;

export const REMINDER_TYPE_COPY = {
  daily: {
    title: "Günlük takip hatırlatması",
    description:
      "Her gün belirlediğiniz saatte genel yoklama ve ödev takip hatırlatması gönderilir.",
    example: "Bugünkü yoklama ve ödev takibini doldurmayı unutmayınız.",
  },
  attendance: {
    title: "Yoklama hatırlatması",
    description: "Günlük yoklama bilgilerinin doldurulmasını hatırlatır.",
    example: "Bugünkü yoklama bilgilerini kontrol etmeyi unutmayınız.",
  },
  homework: {
    title: "Ödev hatırlatması",
    description: "Günlük ödev takiplerinin kontrol edilmesini hatırlatır.",
    example: "Bugünkü ödev takiplerini tamamlamayı unutmayınız.",
  },
} as const;
