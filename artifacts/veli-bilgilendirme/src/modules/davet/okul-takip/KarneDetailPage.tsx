import { useRef, useState } from "react";
import { useRoute } from "wouter";
import { toast } from "sonner";
import { Copy, Image, Loader2, MessageCircle, Printer } from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getKarneData, KarnePoster } from "@/modules/davet/okul-takip/components/KarnePoster";
import {
  buildKarneAnalysis,
  buildTeacherCommentSuggestion,
} from "@/modules/davet/okul-takip/calculations";
import { downloadKarnePng, getKarneShareToastMessage, shareKarneViaWhatsApp } from "@/modules/davet/okul-takip/karneExport";
import { OKUL_TAKIP_KARNELER } from "@/modules/davet/okul-takip/routes";
import { todayIso, useOkulTakipStore } from "@/modules/davet/okul-takip/store";

function getWeekFromSearch(): string {
  if (typeof window === "undefined") return todayIso();
  return new URLSearchParams(window.location.search).get("week") ?? todayIso();
}

function notifyKarneShareResult(
  result: Parameters<typeof getKarneShareToastMessage>[0],
  hasPhone: boolean,
) {
  const toastMessage = getKarneShareToastMessage(result, hasPhone);
  if (!toastMessage) return;
  if (toastMessage.type === "success") toast.success(toastMessage.message);
  else toast.info(toastMessage.message);
}

export default function KarneDetailPage() {
  const [, params] = useRoute(`${OKUL_TAKIP_KARNELER}/:studentId`);
  const studentId = params?.studentId ?? "";
  const weekRef = getWeekFromSearch();

  const { students, dailyRecords } = useOkulTakipStore();
  const student = students.find((s) => s.id === studentId);
  const karneRef = useRef<HTMLDivElement>(null);
  const [teacherCommentDraft, setTeacherCommentDraft] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  if (!student) {
    return (
      <DavetLayout>
        <BackButton label="Karneler" href={OKUL_TAKIP_KARNELER} />
        <p className="text-muted-foreground">Öğrenci bulunamadı.</p>
      </DavetLayout>
    );
  }

  const { start, end, stats } = getKarneData(student, dailyRecords, weekRef);
  const weekNote = dailyRecords
    .filter((r) => r.studentId === student.id && r.note)
    .map((r) => r.note)
    .join(" ");
  const aiSuggestedComment = buildTeacherCommentSuggestion(student, stats, weekNote);
  const teacherComment = teacherCommentDraft.trim() || aiSuggestedComment;
  const analysis = buildKarneAnalysis(student, stats, teacherComment);

  const exportKarne = async () => {
    if (!student.name.trim()) {
      toast.error("Öğrenci adı olmadan karne indirilemez.");
      return;
    }
    setDownloading(true);
    try {
      await downloadKarnePng(karneRef.current, student.name);
      toast.success("Karne PNG olarak indirildi.");
    } catch (err) {
      console.error("[karne/download]", err);
      toast.error("Karne indirilemedi. Lütfen tekrar deneyin.");
    } finally {
      setDownloading(false);
    }
  };

  const shareKarne = async () => {
    if (!student.name.trim()) {
      toast.error("Öğrenci adı olmadan karne paylaşılamaz.");
      return;
    }
    if (sharing) return;

    const hasPhone = Boolean(student.parentPhone?.trim());
    setSharing(true);
    try {
      const result = await shareKarneViaWhatsApp({
        element: karneRef.current,
        studentId: student.id,
        studentName: student.name,
        shareText: analysis.whatsAppMessage,
        parentPhone: student.parentPhone,
      });
      notifyKarneShareResult(result, hasPhone);
    } catch (err) {
      console.error("[karne/share]", err);
      if (err instanceof DOMException && err.name === "InvalidStateError") {
        toast.info("Önce açık olan paylaşım penceresini kapatın ve tekrar deneyin.");
      } else {
        toast.error("Karne hazırlanamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <DavetLayout>
      <div className="space-y-5 pb-8">
        <BackButton label="Karneler" href={OKUL_TAKIP_KARNELER} />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void exportKarne()} disabled={downloading}>
            {downloading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Image size={16} className="mr-2" />}
            {downloading ? "Hazırlanıyor..." : "Karne indir"}
          </Button>
          <Button variant="outline" onClick={() => void shareKarne()} disabled={sharing || downloading}>
            {sharing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <MessageCircle size={16} className="mr-2" />}
            {sharing ? "Hazırlanıyor..." : "WhatsApp ile gönder"}
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(analysis.whatsAppMessage);
              toast.success("WhatsApp metni kopyalandı.");
            }}
          >
            <Copy size={16} className="mr-2" />
            WhatsApp metni
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer size={16} className="mr-2" />
            Yazdır
          </Button>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Hoca Görüşü</p>
              <p className="text-xs text-slate-500">
                Öneri metni otomatik gelir; değiştirirseniz indirme ve WhatsApp'ta manuel metin kullanılır.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setTeacherCommentDraft(aiSuggestedComment)}
            >
              Öneriyi kullan
            </Button>
          </div>
          <Textarea
            value={teacherCommentDraft}
            onChange={(e) => setTeacherCommentDraft(e.target.value)}
            placeholder={aiSuggestedComment}
            rows={4}
          />
        </div>

        <KarnePoster
          ref={karneRef}
          student={student}
          stats={stats}
          weekStart={start}
          weekEnd={end}
          records={dailyRecords}
          teacherComment={teacherComment}
        />
      </div>
    </DavetLayout>
  );
}
