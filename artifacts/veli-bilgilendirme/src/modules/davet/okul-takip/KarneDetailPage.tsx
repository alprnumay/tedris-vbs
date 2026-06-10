import { useRef } from "react";
import { useRoute } from "wouter";
import { toast } from "sonner";
import { Copy, Download, Image, Printer } from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";
import { Button } from "@/components/ui/button";
import { getKarneData, KarnePoster } from "@/modules/davet/okul-takip/components/KarnePoster";
import { buildKarneAnalysis } from "@/modules/davet/okul-takip/calculations";
import { todayIso, useOkulTakipStore } from "@/modules/davet/okul-takip/store";
import { exportElementAsPdf, exportElementAsPng } from "@/modules/davet/utils/exportUtils";

function getWeekFromSearch(): string {
  if (typeof window === "undefined") return todayIso();
  return new URLSearchParams(window.location.search).get("week") ?? todayIso();
}

export default function KarneDetailPage() {
  const [, params] = useRoute("/okul-takip/karneler/:studentId");
  const studentId = params?.studentId ?? "";
  const weekRef = getWeekFromSearch();

  const { students, dailyRecords } = useOkulTakipStore();
  const student = students.find((s) => s.id === studentId);
  const karneRef = useRef<HTMLDivElement>(null);

  if (!student) {
    return (
      <DavetLayout>
        <BackButton label="Karneler" href="/okul-takip/karneler" />
        <p className="text-muted-foreground">Öğrenci bulunamadı.</p>
      </DavetLayout>
    );
  }

  const { start, end, stats } = getKarneData(student, dailyRecords, weekRef);
  const analysis = buildKarneAnalysis(student, stats);

  const exportKarne = async (format: "png" | "pdf") => {
    const spec = { width: 640, height: 900, orientation: "portrait" as const };
    const name = `karne-${student.name.replace(/\s+/g, "-").toLowerCase()}`;
    try {
      if (format === "png") {
        await exportElementAsPng(karneRef.current, `${name}.png`, spec);
      } else {
        await exportElementAsPdf(karneRef.current, `${name}.pdf`, "portrait", spec);
      }
      toast.success(`${format.toUpperCase()} indirildi.`);
    } catch {
      toast.error("Dışa aktarma başarısız.");
    }
  };

  return (
    <DavetLayout>
      <div className="space-y-5 pb-8">
        <BackButton label="Karneler" href="/okul-takip/karneler" />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportKarne("pdf")}>
            <Download size={16} className="mr-2" />
            PDF indir
          </Button>
          <Button variant="outline" onClick={() => exportKarne("png")}>
            <Image size={16} className="mr-2" />
            PNG indir
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

        <KarnePoster
          ref={karneRef}
          student={student}
          stats={stats}
          weekStart={start}
          weekEnd={end}
          records={dailyRecords}
        />
      </div>
    </DavetLayout>
  );
}
