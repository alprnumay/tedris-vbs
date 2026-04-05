import { FormData, Faaliyet } from "../types";

const turMap: Record<string, string> = {
  Ders: "ders çalışması",
  Etüt: "etüt çalışması",
  Gezi: "gezi etkinliği",
  Etkinlik: "sınıf etkinliği",
  Rehberlik: "rehberlik görüşmesi",
};

const turBaslikMap: Record<string, string> = {
  Ders: "Ders Çalışması",
  Etüt: "Etüt Çalışması",
  Gezi: "Gezi Etkinliği",
  Etkinlik: "Sınıf Etkinliği",
  Rehberlik: "Rehberlik Görüşmesi",
};

export const KAPANIS_CUMLELERI = [
  "",
  "Çalışmaların devamı için süreci yakından takip ediyoruz.",
  "Bugünkü verimli çalışmadan kısa bir kesiti sizlerle paylaşıyoruz.",
  "Evde kısa bir tekrar ile öğrenme desteklenebilir.",
  "Herhangi bir sorunuz için iletişime geçmekten çekinmeyiniz.",
];

function faaliyetAdi(f: Faaliyet): string {
  if (f.alan && f.tur) return `${f.alan} alanında ${turMap[f.tur] || f.tur.toLowerCase()}`;
  if (f.alan) return `${f.alan} çalışması`;
  if (f.tur) return `${turMap[f.tur] || f.tur.toLowerCase()}`;
  return "";
}

function kisaMetin(form: FormData, aktif: Faaliyet[]): string {
  const ton = form.metinTonu ?? "kurumsal";
  const ogrenci = ton === "sicak" ? "çocuğunuz" : "öğrencimiz";
  const ogrenciler = ton === "sicak" ? "çocuklarınız" : "öğrencilerimiz";
  const parcalar: string[] = [];

  if (aktif.length === 0) {
    parcalar.push(ton === "sicak"
      ? "Çocuğunuz için güzel bir faaliyet gerçekleştirildi."
      : "Öğrencimize yönelik faaliyet gerçekleştirilmiştir.");
  } else if (aktif.length === 1) {
    const ad = faaliyetAdi(aktif[0]);
    if (ad) parcalar.push(ton === "sicak"
      ? `Bugün ${ad} yapıldı.`
      : `Bugün ${ad} gerçekleştirilmiştir.`);
    if (aktif[0].ozelNot?.trim()) {
      const not = aktif[0].ozelNot.trim();
      parcalar.push(not.endsWith(".") || not.endsWith("!") || not.endsWith("?") ? not : not + ".");
    } else {
      parcalar.push(ton === "aciklayici"
        ? `Bu çalışma, ${ogrenciler}in konuyu pekiştirmesine katkı sağlamayı hedeflemektedir.`
        : ton === "sicak"
          ? `${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} derse büyük ilgi gösterdi.`
          : `${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} derse aktif şekilde katılmıştır.`);
    }
  } else {
    const adlar = aktif.map(faaliyetAdi).filter(Boolean);
    if (adlar.length) parcalar.push(ton === "sicak"
      ? `Bugün ${adlar.join(" ve ")} yapıldı.`
      : `Bugün ${adlar.join(" ve ")} gerçekleştirilmiştir.`);
    parcalar.push(ton === "sicak"
      ? `${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} tüm etkinliklere büyük istekle katıldı.`
      : `${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} tüm etkinliklere aktif katılım göstermiştir.`);
  }

  if (form.ekNot?.trim()) {
    const not = form.ekNot.trim();
    parcalar.push(not.endsWith(".") || not.endsWith("!") || not.endsWith("?") ? not : not + ".");
  }
  if (form.kapanisCumlesi?.trim()) {
    parcalar.push(form.kapanisCumlesi.trim());
  }

  return parcalar.join(" ");
}

function detayliMetin(form: FormData, aktif: Faaliyet[]): string {
  const ton = form.metinTonu ?? "kurumsal";
  const ogrenci = ton === "sicak" ? "çocuğunuz" : "öğrencimiz";
  const ogrenciler = ton === "sicak" ? "çocuklarınız" : "öğrencilerimiz";
  const parcalar: string[] = [];

  if (aktif.length === 0) {
    if (ton === "sicak") {
      parcalar.push("Çocuğunuz için düzenli gelişim faaliyetleri yürütülmektedir.");
      parcalar.push("Bu çalışmalar onun hem sosyal hem de akademik gelişimine katkı sağlamaktadır.");
    } else if (ton === "aciklayici") {
      parcalar.push("Öğrencimizin gelişimine katkı sağlamayı amaçlayan etkinlikler gerçekleştirilmiştir.");
      parcalar.push("Bu tür faaliyetlerin temel amacı, öğrencilerin bilişsel ve sosyal becerilerini bütünleşik biçimde desteklemektir.");
    } else {
      parcalar.push("Öğrencimizin gelişimine katkı sağlayan etkinlikler gerçekleştirilmiştir.");
      parcalar.push("Yapılan çalışmalar, öğrencimizin bilişsel ve sosyal becerilerini desteklemeye yönelik olarak planlanmıştır.");
    }
  } else if (aktif.length === 1) {
    const f = aktif[0];
    const ad = faaliyetAdi(f);

    if (ad) {
      if (ton === "sicak") {
        parcalar.push(`Bugün ${ad} yapıldı ve çok verimli geçti.`);
      } else {
        parcalar.push(`Bugün ${ad} gerçekleştirilmiştir.`);
      }
    }

    if (f.tur === "Ders" || f.tur === "Etüt") {
      if (ton === "aciklayici") {
        parcalar.push(`Bu çalışmanın temel amacı, ${ogrenciler}in ${f.alan ? f.alan + " konularını" : "işlenen konuları"} derinlemesine kavramasını desteklemektir.`);
        parcalar.push("Yapılan etkinlikler kalıcı öğrenmeyi pekiştirmeye yönelik tasarlanmıştır.");
      } else if (ton === "sicak") {
        parcalar.push(`${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} ${f.alan ? f.alan + " dersinde" : ""} bugün harika bir performans sergiledi.`);
        parcalar.push("Bu güzel çalışmaların evde de tekrarlanması öğrenmeyi kalıcı kılacaktır.");
      } else {
        parcalar.push(`${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} ${f.alan ? f.alan + " dersinde " : ""}konuları aktif şekilde işleyerek kavramsal düzeyde ilerleme kaydetmiştir.`);
        parcalar.push("Yapılan çalışmalar, öğrencilerin kalıcı öğrenme süreçlerine katkı sağlamaktadır.");
      }
    } else if (f.tur === "Gezi") {
      if (ton === "sicak") {
        parcalar.push(`${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} bu gezi etkinliğinde çok şey keşfetti ve eğlendi.`);
        parcalar.push("Gerçek yaşamla kurulan bu bağ, öğrenmeyi çok daha anlamlı kıldı.");
      } else if (ton === "aciklayici") {
        parcalar.push("Bu gezi etkinliğinin amacı, öğrencilerin gözlem ve araştırma becerilerini saha deneyimiyle geliştirmektir.");
        parcalar.push("Gerçek ortamda edinilen deneyimler, sınıf içi öğrenmeyi güçlü biçimde desteklemektedir.");
      } else {
        parcalar.push(`${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} bu gezi etkinliğinde gözlem ve araştırma becerilerini geliştirme fırsatı bulmuştur.`);
        parcalar.push("Gerçek yaşam deneyimleriyle desteklenen bu etkinlik, öğrencilerin merak ve keşfetme duygusunu güçlendirmiştir.");
      }
    } else if (f.tur === "Etkinlik") {
      if (ton === "sicak") {
        parcalar.push(`${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} bu etkinlikte hem eğlendi hem de yaratıcılığını ortaya koydu.`);
        parcalar.push("Arkadaşlarıyla birlikte yaptığı çalışmalar sosyal becerilerini de güçlendirdi.");
      } else if (ton === "aciklayici") {
        parcalar.push("Bu etkinliğin amacı, öğrencilerin el becerisi, yaratıcılık ve sosyal etkileşim becerilerini eş zamanlı geliştirmektir.");
        parcalar.push("Grup çalışmalarına dayalı etkinlikler, işbirlikli öğrenme ortamlarının oluşmasını sağlamaktadır.");
      } else {
        parcalar.push(`${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} etkinlik sürecinde hem el becerilerini geliştirmiş hem de sosyal etkileşimlerini güçlendirmiştir.`);
        parcalar.push("Yapılan çalışmalar dikkat, odaklanma ve yaratıcılık becerilerine katkı sağlamıştır.");
      }
    } else if (f.tur === "Rehberlik") {
      if (ton === "sicak") {
        parcalar.push(`${ogrenci.charAt(0).toUpperCase() + ogrenci.slice(1)} ile bugün sıcak ve destekleyici bir görüşme gerçekleştirdik.`);
        parcalar.push("Kendini ifade edebildiği bu ortam, onun güven ve motivasyon duygusunu pekiştirdi.");
      } else if (ton === "aciklayici") {
        parcalar.push(`Bu rehberlik görüşmesinin amacı, ${ogrenci}nin öz farkındalık, hedef belirleme ve motivasyon becerilerini güçlendirmektir.`);
        parcalar.push("Düzenli aralıklarla gerçekleştirilen bu görüşmeler, öğrencinin duygusal iyilik halini destekler.");
      } else {
        parcalar.push(`${ogrenci.charAt(0).toUpperCase() + ogrenci.slice(1)} ile gerçekleştirilen bu görüşme, öz farkındalık ve motivasyon gelişimine olumlu katkılar sunmuştur.`);
        parcalar.push("Destekleyici bir ortamda yürütülen görüşme, öğrencimizin duygusal ve sosyal gelişimine destek olmuştur.");
      }
    } else {
      if (ton === "sicak") {
        parcalar.push(`${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} bugün çok güzel bir çalışma ortaya koydu.`);
      } else {
        parcalar.push("Öğrencilerimiz bu süreçte dikkat ve odaklanma becerilerini güçlendirmiştir.");
      }
    }

    if (f.ozelNot?.trim()) {
      const not = f.ozelNot.trim();
      parcalar.push(not.endsWith(".") || not.endsWith("!") || not.endsWith("?") ? not : not + ".");
    }
  } else {
    const adlar = aktif.map(faaliyetAdi).filter(Boolean);
    if (adlar.length) {
      if (ton === "sicak") {
        parcalar.push(`Bugün ${adlar.join(", ")} gibi çeşitli etkinlikler yapıldı.`);
      } else {
        parcalar.push(`Bugün ${adlar.join(", ")} gibi çeşitli etkinlikler gerçekleştirilmiştir.`);
      }
    }

    if (ton === "aciklayici") {
      parcalar.push("Bu çok yönlü programın amacı, öğrencilerin farklı alanlardaki yeterliliklerini dengeli biçimde geliştirmektir.");
      parcalar.push("Her bir etkinlik, akademik, sosyal ve duygusal gelişim hedeflerine yönelik olarak tasarlanmıştır.");
    } else if (ton === "sicak") {
      parcalar.push(`${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} bu zengin programa büyük bir istekle katıldı.`);
      parcalar.push("Her etkinlikte farklı bir yetenek ortaya çıktı — gurur verici bir gündü!");
    } else {
      parcalar.push(`${ogrenciler.charAt(0).toUpperCase() + ogrenciler.slice(1)} bu çok yönlü faaliyet sürecinde farklı alanlarda bilgi ve becerilerini pekiştirme imkânı bulmuştur.`);
      parcalar.push("Her bir etkinlik, öğrencilerin bütünsel gelişimine katkı sağlayacak şekilde planlanmıştır.");
    }

    aktif.forEach((f) => {
      if (f.ozelNot?.trim()) {
        const not = f.ozelNot.trim();
        parcalar.push(not.endsWith(".") || not.endsWith("!") || not.endsWith("?") ? not : not + ".");
      }
    });
  }

  if (form.ekNot?.trim()) {
    const not = form.ekNot.trim();
    parcalar.push(not.endsWith(".") || not.endsWith("!") || not.endsWith("?") ? not : not + ".");
  }
  if (form.kapanisCumlesi?.trim()) {
    parcalar.push(form.kapanisCumlesi.trim());
  }

  return parcalar.join(" ");
}

export function aciklamaolustur(form: FormData): string {
  const aktif = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.tur || f.alan);
  const uzunluk = form.metinUzunlugu ?? "detayli";
  const metin = uzunluk === "kisa" ? kisaMetin(form, aktif) : detayliMetin(form, aktif);
  return metin || "Öğrencimizin gelişimine katkı sağlayan faaliyetler bugün gerçekleştirilmiştir.";
}

export function baslikAlternatifleri(form: FormData): [string, string, string] {
  const aktif = form.faaliyetler.slice(0, form.faaliyetSayisi).filter((f) => f.alan || f.tur);

  if (aktif.length === 0) {
    return [
      "Öğrenci Faaliyet Bilgilendirmesi",
      "Veli Bilgilendirme Notu",
      "Değerli Velimize",
    ];
  }

  if (aktif.length === 1) {
    const f = aktif[0];
    const title1 = f.tur && f.alan
      ? `${f.alan} — ${turBaslikMap[f.tur] || f.tur}`
      : f.alan
        ? `${f.alan} Çalışması`
        : `${f.tur} Faaliyeti`;

    const title2 = f.alan
      ? `${f.alan} Alanında Gelişim`
      : f.tur === "Rehberlik"
        ? "Rehberlik Görüşmesinden"
        : "Öğrencimizin Başarı Günü";

    const title3 = f.tur === "Gezi"
      ? "Keşfederek Öğreniyoruz"
      : f.tur === "Rehberlik"
        ? "Destek ve Gelişim Zamanı"
        : f.tur === "Etkinlik"
          ? "Yaratıcılığımızı Keşfediyoruz"
          : "Verimli Bir Öğrenme Günü";

    return [title1, title2, title3];
  }

  const alanlar = aktif.map((f) => f.alan).filter(Boolean);
  const title1 = alanlar.length > 0
    ? `${alanlar.slice(0, 2).join(" ve ")} Etkinlikleri`
    : "Çok Yönlü Faaliyet Günü";

  return [
    title1,
    "Zengin Öğrenme Deneyimi",
    "Gelişim ve Öğrenme Zamanı",
  ];
}

export function baslikolustur(form: FormData): string {
  const alts = baslikAlternatifleri(form);
  const idx = form.seciliBaslikIdx ?? 0;
  return alts[Math.min(idx, 2)] || alts[0];
}
