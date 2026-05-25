import ExcelJS from "exceljs";
import type { AdminYurtMetrik, AdminMintikaMetrik, AdminDataHealthIssue, AdminKullanici, AdminAktiviteLog } from "../api";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1E3A5F" },
};

const STATUS_COLORS: Record<string, string> = {
  bugun_aktif: "FFDCFCE7",
  son_7_gun_aktif: "FFDBEAFE",
  pasif_7: "FFFEF9C3",
  pasif_30: "FFFFEDD5",
  hic_giris_yok: "FFFEE2E2",
  veri_eksik: "FFF1F5F9",
};

const DISCLAIMER =
  "Bu rapor Tedris VBS kayıtlarındaki gerçek giriş ve kurum verilerine göre oluşturulmuştur. Eksik veya eşleşmemiş kayıtlar Veri Sağlığı sayfasında listelenmiştir.";

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });
  row.height = 22;
}

function autoWidth(sheet: ExcelJS.Worksheet, min = 10, max = 42) {
  sheet.columns.forEach((col) => {
    let w = min;
    if (col.eachCell) {
      col.eachCell({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? "").length;
        w = Math.max(w, Math.min(max, len + 2));
      });
    }
    col.width = w;
  });
}

export async function indirAdminExcel(opts: {
  raporAdi: string;
  rangeLabel: string;
  filtreler: string;
  ozet: Record<string, number | string>;
  mintikalar?: AdminMintikaMetrik[];
  yurts?: AdminYurtMetrik[];
  users?: AdminKullanici[];
  activityLogs?: AdminAktiviteLog[];
  issues?: AdminDataHealthIssue[];
}) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Tedris VBS";
  wb.created = new Date();

  const kapak = wb.addWorksheet("Özet", { views: [{ state: "frozen", ySplit: 1 }] });
  kapak.addRow(["Tedris VBS — " + opts.raporAdi]);
  kapak.addRow(["Tarih aralığı", opts.rangeLabel]);
  kapak.addRow(["Filtreler", opts.filtreler]);
  kapak.addRow(["Oluşturulma", new Date().toLocaleString("tr-TR")]);
  kapak.addRow([]);
  kapak.addRow(["Özet göstergeler"]);
  for (const [k, v] of Object.entries(opts.ozet)) {
    kapak.addRow([k, v]);
  }
  kapak.addRow([]);
  kapak.addRow([DISCLAIMER]);
  kapak.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF1E3A5F" } };

  if (opts.mintikalar?.length) {
    const sh = wb.addWorksheet("Mıntıka Özeti", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    const hdr = sh.addRow([
      "Mıntıka",
      "Toplam yurt",
      "Toplam kullanıcı",
      "Bugün aktif yurt",
      "7 gün aktif yurt",
      "7+ gün pasif",
      "Hiç giriş yok",
      "Açık destek",
      "Kullanım %",
      "Sağlık skoru",
      "Durum",
    ]);
    styleHeaderRow(hdr);
    for (const m of opts.mintikalar) {
      const row = sh.addRow([
        m.districtName,
        m.totalYurts,
        m.totalUsers,
        m.todayActiveYurts,
        m.active7dYurts,
        m.passive7dYurts,
        m.neverLoginYurts,
        m.openSupport,
        m.usageRate != null ? `${m.usageRate}%` : "—",
        m.healthScore ?? "Yetersiz veri",
        m.healthLabel,
      ]);
      const score = m.healthScore;
      if (score != null) {
        const fill =
          score >= 80 ? "FFDCFCE7" : score >= 50 ? "FFFEF9C3" : "FFFEE2E2";
        row.getCell(10).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
      }
    }
    sh.autoFilter = { from: "A1", to: "K1" };
    autoWidth(sh);
  }

  if (opts.yurts?.length) {
    const sh = wb.addWorksheet("Yurt Detayı", {
      views: [{ state: "frozen", ySplit: 1 }],
    });
    const hdr = sh.addRow([
      "Yurt / Kurum",
      "Mıntıka",
      "İl",
      "Kullanıcı",
      "Bugün giriş",
      "7 gün giriş",
      "30 gün giriş",
      "Son giriş",
      "Açık destek",
      "Durum",
      "Kod",
    ]);
    styleHeaderRow(hdr);
    for (const y of opts.yurts) {
      const row = sh.addRow([
        y.institutionName,
        y.districtName,
        y.province ?? "—",
        y.userCount,
        y.todayLoginUsers,
        y.logins7d,
        y.logins30d,
        y.lastLoginAt ? new Date(y.lastLoginAt).toLocaleString("tr-TR") : "—",
        y.openSupport,
        y.activityStatus,
        y.institutionCode,
      ]);
      const fill = STATUS_COLORS[y.activityStatus] ?? STATUS_COLORS.veri_eksik;
      row.getCell(10).fill = { type: "pattern", pattern: "solid", fgColor: { argb: fill } };
    }
    sh.autoFilter = { from: "A1", to: "K1" };
    autoWidth(sh);
  }

  if (opts.issues?.length) {
    const sh = wb.addWorksheet("Veri Sağlığı");
    const hdr = sh.addRow(["Sorun türü", "Kayıt", "Açıklama", "Önerilen düzeltme"]);
    styleHeaderRow(hdr);
    for (const i of opts.issues) {
      sh.addRow([i.type, i.record, i.description, i.suggestion]);
    }
    autoWidth(sh);
  }

  if (opts.users?.length) {
    const sh = wb.addWorksheet("Kullanıcılar");
    const hdr = sh.addRow(["Ad Soyad", "E-posta", "Mıntıka", "Yurt / Kurum", "Rol", "Son giriş", "Durum"]);
    styleHeaderRow(hdr);
    for (const u of opts.users) {
      sh.addRow([
        u.name,
        u.email,
        u.district ?? "—",
        u.institutionName ?? "—",
        u.role,
        u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("tr-TR") : "—",
        u.isActive ? "Aktif" : "Pasif",
      ]);
    }
    autoWidth(sh);
  }

  if (opts.activityLogs?.length) {
    const sh = wb.addWorksheet("Aktivite");
    const hdr = sh.addRow(["Tarih", "Kullanıcı", "Mıntıka", "Yurt / Kurum", "İşlem"]);
    styleHeaderRow(hdr);
    for (const l of opts.activityLogs) {
      sh.addRow([
        new Date(l.createdAt).toLocaleString("tr-TR"),
        l.userName ?? "—",
        l.district ?? "—",
        l.institutionName ?? l.institutionCode ?? "—",
        l.action,
      ]);
    }
    autoWidth(sh);
  }

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tedris-vbs-${opts.raporAdi.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
