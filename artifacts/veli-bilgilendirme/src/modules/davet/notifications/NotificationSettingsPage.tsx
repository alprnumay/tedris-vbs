import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Monitor,
  RefreshCw,
  Send,
  Smartphone,
} from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { backendApi, getBackendToken } from "@/lib/backendApi";
import {
  checkBrowserSubscription,
  enablePushNotifications,
  getPushSupportState,
  isIosDevice,
  isStandalonePwa,
  loadLocalReminderSettings,
  resubscribePush,
  saveLocalReminderSettings,
  syncPushSubscription,
  type PushPermissionState,
  type PushSettings,
} from "@/lib/pushNotifications";
import { NEHARI_PLATFORM_HOME } from "@/modules/davet/okul-takip/routes";
import {
  buildNotificationPreview,
  getDeviceKind,
  getDeviceKindLabel,
  getDeviceSubscriptionStatus,
  getInfraStatusLabel,
  getPermissionStatusLabel,
  getReminderStatusLabel,
  HELP_SECTIONS,
  NOTIFICATION_COPY,
  REMINDER_TYPE_COPY,
  type StatusTone,
} from "./notificationSettingsUi";

const DEFAULT_SETTINGS: PushSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: "17:00",
  attendanceReminderEnabled: true,
  homeworkReminderEnabled: true,
};

function settingsEqual(a: PushSettings, b: PushSettings): boolean {
  return (
    a.dailyReminderEnabled === b.dailyReminderEnabled &&
    a.dailyReminderTime === b.dailyReminderTime &&
    a.attendanceReminderEnabled === b.attendanceReminderEnabled &&
    a.homeworkReminderEnabled === b.homeworkReminderEnabled
  );
}

function StatusBadge({ tone, label }: { tone: StatusTone; label: string }) {
  const styles: Record<StatusTone, string> = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-red-50 text-red-800 border-red-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[tone],
      )}
    >
      {label}
    </span>
  );
}

function StatusRow({ label, tone, value }: { label: string; tone: StatusTone; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <StatusBadge tone={tone} label={value} />
    </div>
  );
}

function ActionButtonBlock({
  title,
  hint,
  onClick,
  disabled,
  loading,
  loadingLabel,
  variant = "default",
  icon,
  highlight,
}: {
  title: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  variant?: "default" | "secondary" | "outline";
  icon: ReactNode;
  highlight?: boolean;
}) {
  const variantClass =
    variant === "default"
      ? "bg-violet-600 hover:bg-violet-700 text-white"
      : variant === "secondary"
        ? ""
        : "";

  return (
    <div className="space-y-1">
      <Button
        className={cn("w-full h-auto py-3 flex-col gap-0.5 sm:flex-row sm:gap-2", variantClass, highlight && "ring-2 ring-violet-500 ring-offset-2")}
        variant={variant === "default" ? "default" : variant}
        onClick={onClick}
        disabled={disabled || loading}
      >
        <span className="inline-flex items-center gap-2">
          {icon}
          {loading && loadingLabel ? loadingLabel : title}
        </span>
      </Button>
      <p className="text-xs text-slate-500 px-1">{hint}</p>
    </div>
  );
}

function ReminderSettingCard({
  id,
  title,
  description,
  example,
  checked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  title: string;
  description: string;
  example?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Label htmlFor={id} className="text-sm font-semibold text-slate-900">
            {title}
          </Label>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">{description}</p>
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      </div>
      {example ? (
        <p className="text-xs text-slate-500 italic border-l-2 border-violet-200 pl-3">
          Örnek: «Nehari Platformu: {example}»
        </p>
      ) : null}
    </div>
  );
}

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [settings, setSettings] = useState<PushSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<PushSettings>(DEFAULT_SETTINGS);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [browserHasSub, setBrowserHasSub] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [pushInfraError, setPushInfraError] = useState<string | null>(null);
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [highlightResubscribe, setHighlightResubscribe] = useState(false);
  const autoPermissionRequested = useRef(false);

  const hasUnsavedChanges = !settingsEqual(settings, savedSettings);
  const preview = buildNotificationPreview(settings);
  const deviceKind = getDeviceKind();
  const permissionStatus = getPermissionStatusLabel(permission);
  const infraStatus = getInfraStatusLabel(pushConfigured);
  const deviceSubStatus = getDeviceSubscriptionStatus({
    permission,
    browserHasSub,
    serverHasSub: hasSubscription,
    needsRenewal: highlightResubscribe,
  });
  const dailyStatus = getReminderStatusLabel(settings.dailyReminderEnabled);
  const anyReminderOn =
    settings.dailyReminderEnabled ||
    settings.attendanceReminderEnabled ||
    settings.homeworkReminderEnabled;

  const applySettings = useCallback((next: Partial<PushSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setSettingsLoadError(null);
    setAuthRequired(false);
    setPermission(getPushSupportState());

    if (getPushSupportState() === "granted") {
      setBrowserHasSub(await checkBrowserSubscription());
    } else {
      setBrowserHasSub(false);
    }

    if (!getBackendToken()) {
      setAuthRequired(true);
      setSettingsLoadError("Bildirim ayarlarını kullanmak için tekrar giriş yapmanız gerekiyor.");
      setHasSubscription(false);
      setPushConfigured(false);
      setLoading(false);
      return;
    }

    const localSettings = loadLocalReminderSettings();
    setSettings(localSettings);

    try {
      const data = await backendApi.getPushSettings();
      setSettings(data.settings);
      setSavedSettings(data.settings);
      saveLocalReminderSettings(data.settings);

      const infraReady = Boolean(data.pushConfigured ?? data.vapidPublicKey);
      setPushConfigured(infraReady);
      if (!infraReady) {
        setPushInfraError("Bildirim altyapısı henüz yapılandırılmamış. VAPID anahtarları eksik.");
      } else {
        setPushInfraError(null);
      }

      let serverHasSub = data.hasActiveSubscription;
      const browserSub = getPushSupportState() === "granted" ? await checkBrowserSubscription() : false;
      setBrowserHasSub(browserSub);

      if (getPushSupportState() === "granted" && infraReady) {
        if (browserSub && !serverHasSub) {
          try {
            await syncPushSubscription(data.settings);
            serverHasSub = true;
          } catch (syncErr) {
            const msg = syncErr instanceof Error ? syncErr.message : "";
            if (msg.includes("yapılandır") || msg.includes("VAPID")) {
              setPushInfraError(msg);
            }
            serverHasSub = false;
          }
        }
      }

      setHasSubscription(serverHasSub);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bildirim ayarları alınamadı.";
      if (message.includes("tekrar giriş")) {
        setAuthRequired(true);
      }
      if (message.includes("yapılandır") || message.includes("VAPID")) {
        setPushInfraError(message);
        setPushConfigured(false);
      }
      setHasSubscription(false);
      setSettingsLoadError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const state = getPushSupportState();
    if (loading || authRequired || pushInfraError) return;
    if (state === "unsupported" || state === "denied") return;
    if (permission !== "default" || autoPermissionRequested.current) return;
    autoPermissionRequested.current = true;
    void Notification.requestPermission().then((next) => {
      setPermission(next as PushPermissionState);
    });
  }, [loading, authRequired, pushInfraError, permission]);

  const handleEnable = async () => {
    setSaving(true);
    try {
      const next = await enablePushNotifications(settings);
      setSettings(next);
      setSavedSettings(next);
      setHasSubscription(true);
      setBrowserHasSub(true);
      setPermission("granted");
      setPushInfraError(null);
      setHighlightResubscribe(false);
      toast.success("Bildirimler açıldı. Bu cihaz artık hatırlatma alabilir.");
    } catch (err) {
      setPermission(getPushSupportState());
      setBrowserHasSub(await checkBrowserSubscription());
      const message = err instanceof Error ? err.message : "Bildirim açılamadı.";
      if (message.includes("VAPID") || message.includes("Push bildirim") || message.includes("yapılandır")) {
        setPushInfraError(message);
      }
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleResubscribe = async () => {
    setSaving(true);
    setHighlightResubscribe(false);
    try {
      const next = await resubscribePush(settings);
      setSettings(next);
      setSavedSettings(next);
      setHasSubscription(true);
      setBrowserHasSub(true);
      toast.success("Bu cihazın bildirim aboneliği yenilendi.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Push aboneliği oluşturulamadı.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    saveLocalReminderSettings(settings);

    try {
      const { settings: saved } = await backendApi.updatePushSettings(settings);
      setSettings(saved);
      setSavedSettings(saved);
      saveLocalReminderSettings(saved);
      toast.success(NOTIFICATION_COPY.saveSuccess);
    } catch {
      toast.error(NOTIFICATION_COPY.saveError);
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setTestSending(true);
    try {
      if (permission === "denied") {
        toast.error(NOTIFICATION_COPY.testDenied);
        return;
      }
      if (!browserHasSub || !hasSubscription) {
        if (permission === "default") {
          toast.error(NOTIFICATION_COPY.testNoSub);
          return;
        }
        await resubscribePush(settings);
        setHasSubscription(true);
        setBrowserHasSub(true);
        setHighlightResubscribe(false);
      }
      await backendApi.sendPushTest();
      setHighlightResubscribe(false);
      toast.success(NOTIFICATION_COPY.testSuccess);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Test bildirimi gönderilemedi.";
      if (message.includes("eski anahtar") || message.includes("geçersiz") || message.includes("yeniden oluştur")) {
        setHasSubscription(false);
        setHighlightResubscribe(true);
        toast.error(NOTIFICATION_COPY.testResubscribe);
      } else if (message.includes("abonelik") || message.includes("Önce bildirim")) {
        toast.error(NOTIFICATION_COPY.testNoSub);
      } else if (message.includes("engellenmiş")) {
        toast.error(NOTIFICATION_COPY.testDenied);
      } else {
        toast.error(message);
      }
    } finally {
      setTestSending(false);
    }
  };

  const unsupported = permission === "unsupported";
  const denied = permission === "denied";
  const granted = permission === "granted";
  const showIosHint = isIosDevice() && !isStandalonePwa();
  const actionsDisabled = saving || testSending || Boolean(pushInfraError) || authRequired || loading;

  return (
    <DavetLayout>
      <div className="mx-auto max-w-lg space-y-5 pb-24 sm:pb-10">
        <BackButton label="Nehari Platformu" href={NEHARI_PLATFORM_HOME} />

        {/* 1. Üst bilgi */}
        <header className="space-y-3">
          <h1 className="text-xl font-bold text-slate-900">Bildirim Ayarları</h1>
          <p className="text-sm text-slate-600 leading-relaxed">{NOTIFICATION_COPY.pageDescription}</p>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 leading-relaxed">
            {NOTIFICATION_COPY.accountInfo}
          </div>
        </header>

        {settingsLoadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {settingsLoadError}
            {!authRequired ? (
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()} disabled={loading}>
                Tekrar dene
              </Button>
            ) : null}
          </div>
        ) : null}

        {pushInfraError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {pushInfraError}
          </div>
        ) : null}

        {highlightResubscribe ? (
          <div className="rounded-xl border border-violet-300 bg-violet-50 p-4 text-sm text-violet-900">
            {NOTIFICATION_COPY.testResubscribe}
          </div>
        ) : null}

        {unsupported ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Bu cihaz veya tarayıcı web bildirimlerini desteklemiyor olabilir.
          </div>
        ) : null}

        {/* 2. Durum kartı */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">Bildirim sistemi durumu</h2>
          <p className="text-xs text-slate-500 mb-3">Hesabınız ve bu cihaz için özet bilgi</p>
          {loading ? (
            <p className="text-sm text-slate-500 py-4">Durum yükleniyor…</p>
          ) : (
            <div>
              <StatusRow label="Bildirim izni" tone={permissionStatus.tone} value={permissionStatus.label} />
              <StatusRow label="Bildirim altyapısı" tone={infraStatus.tone} value={infraStatus.label} />
              <StatusRow label="Bu cihazın aboneliği" tone={deviceSubStatus.tone} value={deviceSubStatus.label} />
              <StatusRow label="Günlük hatırlatma" tone={dailyStatus.tone} value={dailyStatus.label} />
              <StatusRow label="Hatırlatma saati" tone="neutral" value={settings.dailyReminderTime} />
            </div>
          )}
        </section>

        {/* 3. Cihaz açıklaması */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            {deviceKind === "mobile" ? (
              <Smartphone className="h-4 w-4 text-violet-600 shrink-0" />
            ) : (
              <Monitor className="h-4 w-4 text-violet-600 shrink-0" />
            )}
            <h2 className="text-sm font-semibold text-slate-900">{NOTIFICATION_COPY.deviceCardTitle}</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{NOTIFICATION_COPY.deviceCardBody}</p>
          <p className="text-xs text-slate-500">
            Şu anki cihaz: <span className="font-medium text-slate-700">{getDeviceKindLabel()}</span>
          </p>
          {deviceKind === "desktop" ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              {NOTIFICATION_COPY.desktopHint}
            </p>
          ) : null}
        </section>

        {denied ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold mb-1">Bildirim izni engellenmiş</p>
            <p>Tarayıcı ayarlarından bu siteye bildirim izni vermeniz gerekiyor.</p>
          </div>
        ) : null}

        {showIosHint ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            iPhone&apos;da bildirim alabilmek için uygulamayı ana ekrana eklemeniz gerekebilir. Kurulum yardımı
            bölümüne bakın.
          </div>
        ) : null}

        {/* 4. Aksiyon butonları */}
        {!unsupported ? (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Bu cihazda bildirimleri yönet</h2>

            {!denied ? (
              <ActionButtonBlock
                title="Bildirimleri Aç"
                hint={NOTIFICATION_COPY.enableHint}
                onClick={handleEnable}
                disabled={actionsDisabled || granted}
                loading={saving}
                loadingLabel="Açılıyor…"
                variant="default"
                icon={<Bell size={18} />}
              />
            ) : null}

            {granted ? (
              <ActionButtonBlock
                title="Aboneliği Yeniden Oluştur"
                hint={NOTIFICATION_COPY.resubscribeHint}
                onClick={handleResubscribe}
                disabled={actionsDisabled}
                loading={saving}
                loadingLabel="Yenileniyor…"
                variant={hasSubscription ? "outline" : "secondary"}
                icon={<RefreshCw size={16} />}
                highlight={highlightResubscribe}
              />
            ) : null}

            <ActionButtonBlock
              title="Test bildirimi gönder"
              hint={NOTIFICATION_COPY.testHint}
              onClick={sendTest}
              disabled={actionsDisabled || unsupported}
              loading={testSending}
              loadingLabel="Gönderiliyor…"
              variant="outline"
              icon={<Send size={16} />}
            />
          </section>
        ) : null}

        {/* 5. Hatırlatma ayarları */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Hatırlatma ayarları</h2>
            <p className="text-xs text-slate-500 mt-1">Hangi hatırlatmaları almak istediğinizi seçin</p>
          </div>

          <ReminderSettingCard
            id="daily-reminder"
            title={REMINDER_TYPE_COPY.daily.title}
            description={REMINDER_TYPE_COPY.daily.description}
            example={REMINDER_TYPE_COPY.daily.example}
            checked={settings.dailyReminderEnabled}
            onCheckedChange={(checked) => applySettings({ dailyReminderEnabled: checked })}
            disabled={loading}
          />

          <ReminderSettingCard
            id="attendance-reminder"
            title={REMINDER_TYPE_COPY.attendance.title}
            description={REMINDER_TYPE_COPY.attendance.description}
            example={REMINDER_TYPE_COPY.attendance.example}
            checked={settings.attendanceReminderEnabled}
            onCheckedChange={(checked) => applySettings({ attendanceReminderEnabled: checked })}
            disabled={loading}
          />

          <ReminderSettingCard
            id="homework-reminder"
            title={REMINDER_TYPE_COPY.homework.title}
            description={REMINDER_TYPE_COPY.homework.description}
            example={REMINDER_TYPE_COPY.homework.example}
            checked={settings.homeworkReminderEnabled}
            onCheckedChange={(checked) => applySettings({ homeworkReminderEnabled: checked })}
            disabled={loading}
          />

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Label htmlFor="reminder-time" className="text-sm font-semibold text-slate-900">
              Günlük hatırlatma saati
            </Label>
            <Input
              id="reminder-time"
              type="time"
              value={settings.dailyReminderTime}
              onChange={(e) => applySettings({ dailyReminderTime: e.target.value })}
              className="mt-2"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-slate-500">{NOTIFICATION_COPY.timeHint}</p>
          </div>
        </section>

        {/* 6. Bildirim önizlemesi */}
        <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Bildirim önizlemesi</h2>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-violet-700">Nehari Platformu</p>
            <p className="text-sm font-medium text-slate-900 mt-1">{preview.title}</p>
            <p className="text-sm text-slate-600 mt-1 leading-relaxed">{preview.body}</p>
          </div>
          <p className="text-xs text-slate-500">
            Gönderim saati:{" "}
            <span className="font-medium text-slate-700">{settings.dailyReminderTime}</span>
            {anyReminderOn ? " (Türkiye saati)" : " — hatırlatmalar kapalı"}
          </p>
        </section>

        {/* Kaydet + yardım — sticky mobil alt */}
        <div className="sticky bottom-0 z-10 -mx-1 space-y-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
          <Button
            className={cn(
              "w-full sm:w-auto",
              hasUnsavedChanges && "ring-2 ring-violet-500 ring-offset-2 bg-violet-600 hover:bg-violet-700 text-white",
            )}
            variant={hasUnsavedChanges ? "default" : "outline"}
            onClick={saveSettings}
            disabled={saving || testSending || Boolean(settingsLoadError) || authRequired || !hasUnsavedChanges}
          >
            {saving ? "Kaydediliyor…" : "Ayarları Kaydet"}
          </Button>
          {hasUnsavedChanges ? (
            <p className="text-xs text-amber-700">Kaydedilmemiş değişiklikler var.</p>
          ) : null}

          <Button
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto text-slate-600"
            onClick={() => setShowHelp((v) => !v)}
          >
            <HelpCircle size={16} className="mr-2" />
            Kurulum / İzin Yardımı
            {showHelp ? <ChevronUp size={16} className="ml-auto" /> : <ChevronDown size={16} className="ml-auto" />}
          </Button>

          {showHelp ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-4">
              {[HELP_SECTIONS.android, HELP_SECTIONS.ios, HELP_SECTIONS.desktop].map((section) => (
                <div key={section.title}>
                  <p className="font-semibold text-slate-800 mb-2">{section.title}</p>
                  <ol className="list-decimal space-y-1 pl-5">
                    {section.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ) : null}

          {!anyReminderOn ? (
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
              <BellOff size={14} className="mt-0.5 shrink-0" />
              Tüm hatırlatmalar kapalıyken bildirim gönderilmez.
            </p>
          ) : null}
        </div>
      </div>
    </DavetLayout>
  );
}
