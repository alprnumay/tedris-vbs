import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/davet-ui/card";
import { Button } from "@/components/davet-ui/button";
import { FileText, CalendarDays, Share2, Globe, ShieldCheck, Clock } from "lucide-react";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";

const modules = [
  {
    title: "Veliye Davet Hazırla",
    description:
      "Veli toplantısı, yurt tanıtımı, kahvaltı, seminer veya özel programlar için davet görseli hazırlayın.",
    icon: FileText,
    color: "text-blue-500",
    href: "/veli",
    external: false,
  },
  {
    title: "Yatılı Alıştırma Programı",
    description:
      "Talebeleri yatılı hayata hazırlayan programlar için tarih, akış, veli notu ve kayıt bilgisi içeren afiş hazırlayın.",
    icon: CalendarDays,
    color: "text-indigo-500",
    href: "/yatili-program",
    external: false,
  },
  {
    title: "Faydalı Çalışma Paylaş",
    description:
      "Yurdunuzda yaptığınız güzel bir çalışmayı görsel ve yönlendirmeli açıklamayla paylaşın. Çalışma onayından sonra yayına alınır.",
    icon: Share2,
    color: "text-emerald-500",
    href: "/calisma-paylas",
    external: false,
  },
  {
    title: "Yayındaki Çalışmalar",
    description: "Diğer yurtların onaylanmış örnek çalışmalarını inceleyin.",
    icon: Globe,
    color: "text-cyan-500",
    href: "/yayindaki-calismalar",
    external: false,
  },
  {
    title: "Geri Sayım",
    description: "Ayrı modül olarak eklenecek; etkinlik geri sayım sayacı yakında.",
    icon: Clock,
    color: "text-amber-500",
    href: "",
    external: false,
    yakinda: true,
  },
  {
    title: "Çalışma Onayı",
    description: "Onay bekleyen çalışmaları inceleyin, yayına alın, revize isteyin veya reddedin.",
    icon: ShieldCheck,
    color: "text-red-500",
    href: "/calisma-onay",
    external: false,
  },
] as const;

type HomeModule = (typeof modules)[number] & { yakinda?: boolean };

export default function HomePage() {
  return (
    <DavetLayout>
      <div className="space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hoş Geldiniz</h1>
          <p className="text-lg text-muted-foreground">
            Kurumunuza özel profesyonel davetiyeler ve afişler hazırlayın, çalışmalarınızı diğer kurumlarla paylaşın.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(modules as HomeModule[]).map((mod, index) => {
            const Icon = mod.icon;
            const yakinda = Boolean(mod.yakinda);
            return (
              <Card
                key={index}
                className="flex h-full flex-col overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-muted ${mod.color}`}>
                    <Icon size={24} />
                  </div>
                  <CardTitle>{mod.title}</CardTitle>
                  <CardDescription className="min-h-[80px]">{mod.description}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto border-t pt-4">
                  {yakinda ? (
                    <Button className="w-full" variant="secondary" disabled title="Yakında">
                      Yakında
                    </Button>
                  ) : mod.external ? (
                    <a href={mod.href}>
                      <Button className="w-full">Başla</Button>
                    </a>
                  ) : (
                    <Link href={mod.href}>
                      <Button className="w-full">Başla</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DavetLayout>
  );
}
