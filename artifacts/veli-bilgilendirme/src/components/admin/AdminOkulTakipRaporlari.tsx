import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildOkulTakipWhatsappMessage,
  fetchOkulTakipInstitutionDetail,
  fetchOkulTakipMissingReport,
  fetchOkulTakipSummaryReport,
  pct,
  resolveOkulTakipReportDate,
  statusColors,
  statusLabel,
  type OkulTakipInstitutionDetail,
  type OkulTakipInstitutionRow,
  type OkulTakipMissingReport,
  type OkulTakipSummaryReport,
} from "@/lib/okulTakipReportsApi";
import type { ReportAccess } from "@/lib/admin/reportAccess";
import { TRACKED_DISTRICTS } from "@/lib/admin/trackedDistricts";
import {
  FiltreAlan,
  FiltreSatir,
  StatKart,
  formatTarih,
  inputStyle,
  selectStyle,
} from "./adminUi";

const TARIH_PRESETLERI = [
  { v: "today", l: "Bugün" },
  { v: "yesterday", l: "Dün" },
  { v: "this_week", l: "Bu hafta" },
  { v: "this_month", l: "Bu ay" },
  { v: "custom", l: "Özel tarih" },
] as const;

type TarihPreset = (typeof TARIH_PRESETLERI)[number]["v"];

interface AdminOkulTakipRaporlariProps {
  reportAccess: ReportAccess;
  scrollToMissing?: boolean;
  onScrollHandled?: () => void;
}

function attendancePct(row: OkulTakipInstitutionRow): number {
  return pct(row.attendanceCompleted, row.activeStudents);
}

function homeworkPct(row: OkulTakipInstitutionRow): number {
  return pct(row.homeworkCompleted, row.activeStudents);
}

export function AdminOkulTakipRaporlari({
  reportAccess,
  scrollToMissing = false,
  onScrollHandled,
}: AdminOkulTakipRaporlariProps) {
  const [tarihPreset, setTarihPreset] = useState<TarihPreset>("today");
  const [ozelTarih, setOzelTarih] = useState("");
  const [mintika, setMintika] = useState("");
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [summary, setSummary] = useState<OkulTakipSummaryReport | null>(null);
  const [missing, setMissing] = useState<OkulTakipMissingReport | null>(null);
  const [detay, setDetay] = useState<OkulTakipInstitutionDetail | null>(null);
  const [whatsappMetin, setWhatsappMetin] = useState<string | null>(null);

  const gorunenMintikalar = useMemo(() => {
    if (reportAccess.type === "all") return [...TRACKED_DISTRICTS];
    if (reportAccess.type === "mintika" && reportAccess.mintikas.length) return reportAccess.mintikas;
    return [];
  }, [reportAccess]);

  const seciliTarih = useMemo(
    () =>
      resolveOkulTakipReportDate(
        tarihPreset,
        tarihPreset === "custom" ? ozelTarih : undefined,
      ),
    [tarihPreset, ozelTarih],
  );

  const veriYukle = useCallback(async () => {
    setYukleniyor(true);
    setHata(null);
    setDetay(null);
    setWhatsappMetin(null);
    try {
      const mintikaParam = mintika || undefined;
      const [summaryRes, missingRes] = await Promise.all([
        fetchOkulTakipSummaryReport(seciliTarih, mintikaParam),
        fetchOkulTakipMissingReport(seciliTarih, mintikaParam),
      ]);
      setSummary(summaryRes);
      setMissing(missingRes);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Rapor yüklenemedi.");
      setSummary(null);
      setMissing(null);
    } finally {
      setYukleniyor(false);
    }
  }, [mintika, seciliTarih]);

  useEffect(() => {
    void veriYukle();
  }, [veriYukle]);

  useEffect(() => {
    if (!scrollToMissing) return;
    const el = document.getElementById("okul-takip-eksik-liste");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      onScrollHandled?.();
    }
  }, [scrollToMissing, missing, onScrollHandled]);

  const attendanceOran = summary
    ? pct(summary.totals.attendanceCompleted, summary.totals.activeStudents)
    : 0;
  const homeworkOran = summary
    ? pct(summary.totals.homeworkCompleted, summary.totals.activeStudents)
    : 0;

  const whatsappMintika =
    mintika ||
    (reportAccess.type === "mintika" && reportAccess.mintikas.length === 1
      ? reportAccess.mintikas[0]
      : "Mıntıka");

  const whatsappOlustur = () => {
    if (!missing?.missingInstitutions.length) return;
    setWhatsappMetin(
      buildOkulTakipWhatsappMessage(
        whatsappMintika,
        seciliTarih,
        missing.missingInstitutions,
      ),
    );
  };

  const detayAc = async (row: OkulTakipInstitutionRow) => {
    try {
      const detail = await fetchOkulTakipInstitutionDetail(
        row.institutionName,
        seciliTarih,
        mintika || undefined,
      );
      setDetay(detail);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Kurum detayı yüklenemedi.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <FiltreSatir>
        <FiltreAlan label="Tarih">
          <select
            value={tarihPreset}
            onChange={(e) => setTarihPreset(e.target.value as TarihPreset)}
            style={selectStyle}
          >
            {TARIH_PRESETLERI.map((p) => (
              <option key={p.v} value={p.v}>
                {p.l}
              </option>
            ))}
          </select>
        </FiltreAlan>
        {tarihPreset === "custom" && (
          <FiltreAlan label="Tarih seç">
            <input
              type="date"
              value={ozelTarih}
              onChange={(e) => setOzelTarih(e.target.value)}
              style={inputStyle}
            />
          </FiltreAlan>
        )}
        <FiltreAlan label="Mıntıka">
          <select
            value={mintika}
            onChange={(e) => setMintika(e.target.value)}
            style={selectStyle}
            disabled={reportAccess.type === "mintika" && gorunenMintikalar.length === 1}
          >
            <option value="">
              {reportAccess.type === "mintika" && gorunenMintikalar.length === 1
                ? gorunenMintikalar[0]
                : "Tümü"}
            </option>
            {gorunenMintikalar.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </FiltreAlan>
        <button
          type="button"
          onClick={() => void veriYukle()}
          style={{
            padding: "9px 16px",
            borderRadius: 10,
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 700,
            fontSize: 12,
            cursor: "pointer",
            alignSelf: "flex-end",
          }}
        >
          Uygula
        </button>
      </FiltreSatir>

      {hata && (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            background: "#fee2e2",
            color: "#991b1b",
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {hata}
        </div>
      )}

      {yukleniyor && (
        <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Yükleniyor...</div>
      )}

      {!yukleniyor && summary && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <StatKart
              baslik="Aktif öğrenci"
              deger={summary.totals.activeStudents}
              renk="#1e3a5f"
              simge="👨‍🎓"
            />
            <StatKart
              baslik="Yoklama tamamlanma"
              deger={`%${attendanceOran}`}
              renk="#2563eb"
              simge="✅"
              altMetin={`${summary.totals.attendanceCompleted}/${summary.totals.activeStudents}`}
            />
            <StatKart
              baslik="Ödev tamamlanma"
              deger={`%${homeworkOran}`}
              renk="#7c3aed"
              simge="📚"
              altMetin={`${summary.totals.homeworkCompleted}/${summary.totals.activeStudents}`}
            />
            <StatKart
              baslik="Eksik yurt"
              deger={missing?.missingInstitutions.length ?? 0}
              renk="#d97706"
              simge="⚠️"
            />
            <StatKart
              baslik="Karne hazır öğrenci"
              deger={summary.totals.reportCardsGenerated}
              renk="#16a34a"
              simge="📄"
            />
          </div>

          <div
            id="okul-takip-eksik-liste"
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              border: "1.5px solid #fde68a",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 800 }}>
                Bugün takibi tamamlamayan yurtlar ({seciliTarih})
              </div>
              <button
                type="button"
                onClick={whatsappOlustur}
                disabled={!missing?.missingInstitutions.length}
                style={{
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "none",
                  background: missing?.missingInstitutions.length ? "#16a34a" : "#cbd5e1",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: missing?.missingInstitutions.length ? "pointer" : "not-allowed",
                }}
              >
                WhatsApp Uyarı Metni Oluştur
              </button>
            </div>

            {!missing?.missingInstitutions.length && (
              <div style={{ fontSize: 12, color: "#166534", fontWeight: 600 }}>
                Seçili kapsamda eksik takip bulunmuyor.
              </div>
            )}

            {!!missing?.missingInstitutions.length && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ color: "#64748b", textAlign: "left" }}>
                      <th style={{ padding: 8 }}>Kurum</th>
                      <th>Mıntıka</th>
                      <th>Yoklama</th>
                      <th>Ödev</th>
                      <th>Aktif öğrenci</th>
                      <th>Son güncelleme</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {missing.missingInstitutions.map((row) => {
                      const attDone = row.activeStudents - row.attendanceMissing;
                      const hwDone = row.activeStudents - row.homeworkMissing;
                      return (
                        <tr key={`${row.mintikaName}-${row.institutionName}`} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: 8, fontWeight: 700 }}>{row.institutionName}</td>
                          <td>{row.mintikaName}</td>
                          <td>
                            {row.status === "not_started"
                              ? "Yapılmadı"
                              : `${attDone}/${row.activeStudents}`}
                          </td>
                          <td>
                            {row.status === "not_started"
                              ? "Yapılmadı"
                              : `${hwDone}/${row.activeStudents}`}
                          </td>
                          <td>{row.activeStudents}</td>
                          <td>{formatTarih(row.lastUpdateAt)}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => void detayAc(row as OkulTakipInstitutionRow)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                border: "1px solid #cbd5e1",
                                background: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              Detay
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {whatsappMetin && (
              <div style={{ marginTop: 12 }}>
                <textarea
                  readOnly
                  value={whatsappMetin}
                  style={{
                    ...inputStyle,
                    minHeight: 120,
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(whatsappMetin)}
                  style={{
                    marginTop: 8,
                    padding: "7px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: "#2563eb",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Metni Kopyala
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 16,
              border: "1.5px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 10 }}>
              Kurum / yurt bazlı özet
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: 8 }}>Kurum</th>
                    <th>Mıntıka</th>
                    <th>Aktif öğrenci</th>
                    <th>Yoklama %</th>
                    <th>Ödev %</th>
                    <th>Eksik öğrenci</th>
                    <th>Son kayıt</th>
                    <th>Durum</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {summary.institutions.map((row) => {
                    const c = statusColors(row.status);
                    const eksikOgrenci = Math.max(row.attendanceMissing, row.homeworkMissing);
                    return (
                      <tr key={`${row.mintikaName}-${row.institutionName}`} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 8, fontWeight: 700 }}>{row.institutionName}</td>
                        <td>{row.mintikaName}</td>
                        <td>{row.activeStudents}</td>
                        <td>%{attendancePct(row)}</td>
                        <td>%{homeworkPct(row)}</td>
                        <td>{eksikOgrenci}</td>
                        <td>{formatTarih(row.lastUpdateAt)}</td>
                        <td>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: 6,
                              background: c.bg,
                              color: c.color,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => void detayAc(row)}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              border: "1px solid #cbd5e1",
                              background: "#fff",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Detay
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {detay && (
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 16,
                border: "1.5px solid #bfdbfe",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>
                  {detay.institutionName} — {detay.mintikaName}
                </div>
                <button
                  type="button"
                  onClick={() => setDetay(null)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Kapat
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ color: "#64748b", textAlign: "left" }}>
                      <th style={{ padding: 8 }}>Öğrenci</th>
                      <th>Sınıf</th>
                      <th>Grup</th>
                      <th>Yoklama</th>
                      <th>Ödev</th>
                      <th>Son güncelleme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detay.students.map((s) => (
                      <tr key={s.studentId} style={{ borderTop: "1px solid #f1f5f9" }}>
                        <td style={{ padding: 8, fontWeight: 600 }}>{s.name}</td>
                        <td>{s.grade || "—"}</td>
                        <td>{s.group || "—"}</td>
                        <td>{s.attendanceStatus ?? "—"}</td>
                        <td>{s.homeworkStatus ?? "—"}</td>
                        <td>{formatTarih(s.lastUpdateAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminOkulTakipRaporlari;
