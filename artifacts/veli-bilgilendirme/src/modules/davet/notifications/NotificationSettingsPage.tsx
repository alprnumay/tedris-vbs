import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, Send } from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { backendApi } from "@/lib/backendApi";
import {
  enablePushNotifications,
  getPermissionLabel,
  getPushSupportState,
  isIosDevice,
  isStandalonePwa,
  type PushPermissionState,
} from "@/lib/pushNotifications";
import { NEHARI_PLATFORM_HOME } from "@/modules/davet/okul-takip/routes";

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [permission, setPermission] = useState<PushPermissionState>("default");
  const [enabled, setEnabled] = useState(true);
  const [time, setTime] = useState("17:00");
  const [hasSubscription, setHasSubscription] = useState(false);

  const refresh = useCallback(async () => {
    setPermission(getPushSupportState());
    try {
      const data = await backendApi.getPushSettings();
      setEnabled(data.settings.dailyReminderEnabled);
      setTime(data.settings.dailyReminderTime);
      setHasSubscription(data.hasActiveSubscription);
    } catch {
      /* oturum yoksa varsayılanlar */
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
      const settings = await enablePushNotifications({
        dailyReminderEnabled: enabled,
        dailyReminderTime: time,
      });
      setEnabled(settings.dailyReminderEnabled);
      setTime(settings.dailyReminderTime);
      setHasSubscription(true);
      setPermission("granted");
      toast.success("Bildirimler açıldı ve cihaz kaydedildi.");
    } catch (err) {
      setPermission(getPushSupportState());
      toast.error(err instanceof Error ? err.message : "Bildirim açılamadı.");
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { settings } = await backendApi.updatePushSettings({
        dailyReminderEnabled: enabled,
        dailyReminderTime: time,
      });
      setEnabled(settings.dailyReminderEnabled);
      setTime(settings.dailyReminderTime);
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
      if (!hasSubscription) {
        await handleEnable();
      }
      await backendApi.sendPushTest();
      toast.success("Test bildirimi gönderildi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test bildirimi gönderilemedi.");
    } finally {
      setSaving(false);
    }
  };

  const showIosHint = isIosDevice() && !isStandalonePwa();

  return (
    <DavetLayout>
      <div className="mx-auto max-w-lg space-y-6 pb-10">
        <BackButton label="Nehari Platformu" href={NEHARI_PLATFORM_HOME} />

        <div>
          <h1 className="text-xl font-bold text-slate-900">Bildirim Ayarları</h1>
          <p className="mt-1 text-sm text-slate-600">
            Günlük takip hatırlatmasını buradan açıp kapatabilir, bildirim saatini değiştirebilirsiniz.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">İzin durumu</p>
          <p className="mt-1 text-sm font-medium text-slate-800">{getPermissionLabel(permission)}</p>
          {hasSubscription ? (
            <p className="mt-1 text-xs text-emerald-700">Bu cihaz push aboneliğine kayıtlı.</p>
          ) : (
            <p className="mt-1 text-xs text-amber-700">Henüz push aboneliği yok.</p>
          )}
        </div>

        {showIosHint ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            iPhone&apos;da bildirim almak için siteyi Safari&apos;den Ana Ekrana Eklemeniz ve uygulamayı
            ana ekran ikonundan açmanız gerekir.
          </div>
        ) : null}

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Button
            className="w-full bg-violet-600 hover:bg-violet-700"
            onClick={handleEnable}
            disabled={saving || permission === "unsupported" || permission === "denied"}
          >
            <Bell size={18} className="mr-2" />
            Bildirimleri Aç
          </Button>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="daily-reminder">Günlük hatırlatma bildirimi</Label>
              <p className="text-xs text-slate-500">Tek günlük genel hatırlatma</p>
            </div>
            <Switch
              id="daily-reminder"
              checked={enabled}
              onCheckedChange={setEnabled}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="reminder-time">Hatırlatma saati</Label>
            <Input
              id="reminder-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-slate-500">Varsayılan: 17:00</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="outline" onClick={saveSettings} disabled={saving}>
              Ayarları Kaydet
            </Button>
            <Button variant="outline" onClick={sendTest} disabled={saving || permission === "unsupported"}>
              <Send size={16} className="mr-2" />
              Test bildirimi gönder
            </Button>
          </div>

          {!enabled ? (
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <BellOff size={14} className="mt-0.5 shrink-0" />
              Hatırlatma kapalıyken günlük bildirim gönderilmez.
            </p>
          ) : null}
        </div>
      </div>
    </DavetLayout>
  );
}
