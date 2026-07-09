import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, HelpCircle, RefreshCw, Send } from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { backendApi } from "@/lib/backendApi";
import {
  buildPermissionHelpSteps,
  checkBrowserSubscription,
  enablePushNotifications,
  fetchVapidPublicKey,
  getPermissionLabel,
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

const DEFAULT_SETTINGS: PushSettings = {
  dailyReminderEnabled: true,
  dailyReminderTime: "17:00",
  attendanceReminderEnabled: true,
  homeworkReminderEnabled: true,
};

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [settings, setSettings] = useState<PushSettings>(DEFAULT_SETTINGS);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [pushInfraError, setPushInfraError] = useState<string | null>(null);
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const applySettings = useCallback((next: Partial<PushSettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setSettingsLoadError(null);
    setPermission(getPushSupportState());

    const localSettings = loadLocalReminderSettings();
    setSettings(localSettings);

    try {
      await fetchVapidPublicKey();
      setPushInfraError(null);
    } catch (err) {
      setPushInfraError(
        err instanceof Error
          ? err.message
          : "Push bildirim altyapısı henüz aktif değil. VAPID key eksik olabilir.",
      );
    }

    try {
      const data = await backendApi.getPushSettings();
      setSettings(data.settings);
      setHasSubscription(data.hasActiveSubscription);
      saveLocalReminderSettings(data.settings);

      if (getPushSupportState() === "granted") {
        const browserHasSub = await checkBrowserSubscription();
        if (browserHasSub && !data.hasActiveSubscription) {
          try {
            await syncPushSubscription(data.settings);
            setHasSubscription(true);
          } catch {
            setHasSubscription(browserHasSub);
          }
        } else {
          setHasSubscription(data.hasActiveSubscription || browserHasSub);
        }
      }
    } catch {
      setSettingsLoadError("Bildirim ayarları şu anda alınamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleEnable = async () => {
    setSaving(true);
    try {
      const next = await enablePushNotifications(settings);
      setSettings(next);
      setHasSubscription(true);
      setPermission("granted");
      setPushInfraError(null);
      toast.success("Bildirimler açıldı ve push aboneliği aktif.");
    } catch (err) {
      setPermission(getPushSupportState());
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
    try {
      const next = await resubscribePush(settings);
      setSettings(next);
      setHasSubscription(true);
      toast.success("Push aboneliği yeniden oluşturuldu.");
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
      saveLocalReminderSettings(saved);
      toast.success("Ayarlar kaydedildi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ayarlar kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    setSaving(true);
    try {
      if (permission === "denied") {
        toast.error("Bildirim izni engellenmiş. Lütfen site ayarlarından izin verin.");
        return;
      }
      if (!hasSubscription) {
        if (permission === "default") {
          toast.error("Önce bildirimleri açmanız gerekiyor.");
          return;
        }
        await handleResubscribe();
      }
      await backendApi.sendPushTest();
      toast.success("Test bildirimi gönderildi.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Test bildirimi gönderilemedi.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const showIosHint = isIosDevice() && !isStandalonePwa();
  const unsupported = permission === "unsupported";
  const denied = permission === "denied";
  const granted = permission === "granted";
  const helpSteps = buildPermissionHelpSteps();

  return (
    <DavetLayout>
      <div className="mx-auto max-w-lg space-y-6 pb-10">
        <BackButton label="Nehari Platformu" href={NEHARI_PLATFORM_HOME} />

        <div>
          <h1 className="text-xl font-bold text-slate-900">Bildirim Ayarları</h1>
          <p className="mt-1 text-sm text-slate-600">
            Günlük yoklama ve ödev takibi hatırlatmalarını buradan yönetebilirsiniz.
          </p>
        </div>

        {settingsLoadError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            {settingsLoadError}
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refresh()} disabled={loading}>
              Tekrar dene
            </Button>
          </div>
        ) : null}

        {pushInfraError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {pushInfraError}
          </div>
        ) : null}

        {unsupported ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Bu cihaz veya tarayıcı web bildirimlerini desteklemiyor olabilir.
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Durum</p>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Bildirim izni</span>
              <span className="font-medium text-slate-800">{getPermissionLabel(permission)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Push aboneliği</span>
              <span className={`font-medium ${hasSubscription ? "text-emerald-700" : "text-amber-700"}`}>
                {hasSubscription ? "Aktif" : "Yok"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Günlük hatırlatma</span>
              <span className="font-medium text-slate-800">
                {settings.dailyReminderEnabled ? "Açık" : "Kapalı"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-600">Hatırlatma saati</span>
              <span className="font-medium text-slate-800">{settings.dailyReminderTime}</span>
            </div>
          </div>
        </div>

        {denied ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 space-y-3">
            <p className="font-semibold">Bildirim izni engellenmiş</p>
            <p>
              Bildirim almak için tarayıcı ayarlarından bu siteye bildirim izni vermeniz gerekiyor.
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              {helpSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        {showIosHint ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            iPhone&apos;da bildirim alabilmek için uygulamayı ana ekrana eklemeniz gerekebilir.
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              {helpSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!denied && !unsupported ? (
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700"
              onClick={handleEnable}
              disabled={saving || granted || Boolean(pushInfraError)}
            >
              <Bell size={18} className="mr-2" />
              Bildirimleri Aç
            </Button>
          ) : null}

          {granted && !hasSubscription ? (
            <Button
              className="w-full"
              variant="secondary"
              onClick={handleResubscribe}
              disabled={saving || Boolean(pushInfraError)}
            >
              <RefreshCw size={16} className="mr-2" />
              Aboneliği Yeniden Oluştur
            </Button>
          ) : null}

          {granted && hasSubscription ? (
            <Button
              className="w-full"
              variant="outline"
              onClick={handleResubscribe}
              disabled={saving || Boolean(pushInfraError)}
            >
              <RefreshCw size={16} className="mr-2" />
              Aboneliği Yeniden Oluştur
            </Button>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="daily-reminder">Günlük hatırlatma bildirimi</Label>
              <p className="text-xs text-slate-500">Genel takip hatırlatması</p>
            </div>
            <Switch
              id="daily-reminder"
              checked={settings.dailyReminderEnabled}
              onCheckedChange={(checked) => applySettings({ dailyReminderEnabled: checked })}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="attendance-reminder">Yoklama hatırlatması</Label>
              <p className="text-xs text-slate-500">Günlük yoklama takibi</p>
            </div>
            <Switch
              id="attendance-reminder"
              checked={settings.attendanceReminderEnabled}
              onCheckedChange={(checked) => applySettings({ attendanceReminderEnabled: checked })}
              disabled={loading}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="homework-reminder">Ödev hatırlatması</Label>
              <p className="text-xs text-slate-500">Günlük ödev takibi</p>
            </div>
            <Switch
              id="homework-reminder"
              checked={settings.homeworkReminderEnabled}
              onCheckedChange={(checked) => applySettings({ homeworkReminderEnabled: checked })}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="reminder-time">Günlük hatırlatma saati</Label>
            <Input
              id="reminder-time"
              type="time"
              value={settings.dailyReminderTime}
              onChange={(e) => applySettings({ dailyReminderTime: e.target.value })}
              className="mt-1"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500">Tüm hatırlatmalar bu saatte gönderilir (Türkiye saati)</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={saveSettings} disabled={saving || Boolean(settingsLoadError)}>
              Ayarları Kaydet
            </Button>
            <Button
              variant="outline"
              onClick={sendTest}
              disabled={saving || unsupported || Boolean(pushInfraError)}
            >
              <Send size={16} className="mr-2" />
              Test bildirimi gönder
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowHelp((v) => !v)}>
              <HelpCircle size={16} className="mr-2" />
              Kurulum / İzin Yardımı
            </Button>
          </div>

          {showHelp ? (
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 space-y-2">
              <p className="font-medium text-slate-800">Kurulum adımları</p>
              <ol className="list-decimal space-y-1 pl-5">
                <li>&quot;Bildirimleri Aç&quot; butonuna dokunun.</li>
                <li>Tarayıcı izin penceresinde &quot;İzin ver&quot; seçin.</li>
                <li>Push aboneliği otomatik oluşturulur.</li>
                <li>Test bildirimi göndererek doğrulayın.</li>
              </ol>
              {denied ? (
                <ol className="list-decimal space-y-1 pl-5 pt-2 border-t border-slate-200">
                  {helpSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}

          {!settings.dailyReminderEnabled &&
          !settings.attendanceReminderEnabled &&
          !settings.homeworkReminderEnabled ? (
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <BellOff size={14} className="mt-0.5 shrink-0" />
              Tüm hatırlatmalar kapalıyken bildirim gönderilmez.
            </p>
          ) : null}
        </div>
      </div>
    </DavetLayout>
  );
}
