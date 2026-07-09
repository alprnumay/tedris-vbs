import type { ReactNode } from "react";
import { forwardRef } from "react";
import {
  buildKarneAnalysis,
  buildTeacherCommentSuggestion,
  computeWeeklyStats,
  formatWeekRange,
  getWeekRange,
} from "@/modules/davet/okul-takip/calculations";
import {
  attendanceDisplay,
  buildStrengthTags,
  buildSubjectAreaText,
  computeDailyPerformanceScores,
  homeworkDisplay,
  hasWeeklyTrackingData,
  KARNE_CANVAS,
  KARNE_STATUS_LABELS,
  scoreOutOfTen,
} from "@/modules/davet/okul-takip/karneContent";
import type { DailyRecord, Student, WeeklyStats } from "@/modules/davet/okul-takip/types";

type Props = {
  student: Student;
  stats: WeeklyStats;
  weekStart: string;
  weekEnd: string;
  records: DailyRecord[];
  teacherComment?: string;
  parentNote?: string;
  periodName?: string;
  teacherName?: string;
};

const DAY_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum"];

export const KarnePoster = forwardRef<HTMLDivElement, Props>(function KarnePoster(
  {
    student,
    stats,
    weekStart,
    weekEnd,
    records,
    teacherComment,
    parentNote,
    periodName,
    teacherName,
  },
  ref,
) {
  const weekDates = stats.dailyCells.map((cell) => cell.date);
  const weekNote = records
    .filter((record) => record.studentId === student.id && record.note?.trim())
    .map((record) => record.note)
    .join(" ");

  const suggestedComment = buildTeacherCommentSuggestion(student, stats, weekNote);
  const resolvedTeacherComment = teacherComment?.trim() || suggestedComment;
  const analysis = buildKarneAnalysis(student, stats, resolvedTeacherComment);
  const resolvedParentNote = parentNote?.trim() || analysis.parentSuggestion;

  const institutionName = student.institutionName || student.institution || "";
  const groupLine = [student.grade, student.group].filter(Boolean).join(" · ");
  const range = periodName || formatWeekRange(weekStart, weekEnd);
  const teacher = teacherName?.trim() || "";
  const dailyScores = computeDailyPerformanceScores(stats);
  const hasData = hasWeeklyTrackingData(stats);
  const tags = buildStrengthTags(stats);
  const subjectText = buildSubjectAreaText(
    student.id,
    records,
    weekDates,
    analysis.generalEvaluation,
  );

  const attendedCount = stats.presentCount + stats.lateCount;
  const homeworkDone = stats.completedCount;
  const homeworkPending = stats.incompleteCount + stats.notDoneCount;

  return (
    <div
      ref={ref}
      style={{
        width: KARNE_CANVAS.width,
        height: KARNE_CANVAS.height,
        boxSizing: "border-box",
        fontFamily: "Inter, system-ui, sans-serif",
        background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)",
        color: "#0f172a",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d4a7a 55%, #1e40af 100%)",
          color: "#ffffff",
          padding: "36px 40px 32px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            {institutionName ? (
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#bfdbfe",
                }}
              >
                {institutionName}
              </p>
            ) : null}
            <h1 style={{ margin: "10px 0 0", fontSize: 34, fontWeight: 900, lineHeight: 1.1 }}>
              Öğrenci Gelişim Karnesi
            </h1>
            {teacher ? (
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "#dbeafe" }}>{teacher}</p>
            ) : null}
          </div>
          <div
            style={{
              flexShrink: 0,
              borderRadius: 16,
              background: "rgba(255,255,255,0.12)",
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: "#eff6ff",
              textAlign: "right",
              maxWidth: 220,
            }}
          >
            {range}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: "28px 32px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Student identity */}
        <div
          style={{
            borderRadius: 24,
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
            padding: "24px 28px",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", color: "#64748b" }}>
            ÖĞRENCİ
          </p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 42,
              fontWeight: 900,
              lineHeight: 1.05,
              color: "#0f172a",
              wordBreak: "break-word",
            }}
          >
            {student.name}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 18 }}>
            <InfoChip label="Sınıf / Grup" value={groupLine || "—"} />
            <InfoChip label="Kurum / Yurt" value={institutionName || "—"} />
            <InfoChip label="Mentor / Hoca" value={teacher || "—"} />
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "#475569", fontStyle: "italic" }}>
            Her öğrenci için özenle hazırlanan haftalık gelişim özeti
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <MetricCard
            title="Haftalık Yoklama"
            value={`%${stats.attendanceRate}`}
            detail={
              hasData
                ? `${attendedCount} geldi · ${stats.absentCount} yok`
                : "Bu hafta yoklama verisi yok"
            }
            accent="#2563eb"
          />
          <MetricCard
            title="Ödev Tamamlama"
            value={`%${stats.homeworkRate}`}
            detail={
              hasData
                ? `${homeworkDone} tamam · ${homeworkPending} eksik`
                : "Bu hafta ödev verisi yok"
            }
            accent="#7c3aed"
          />
          <MetricCard
            title="Genel Durum"
            value={KARNE_STATUS_LABELS[stats.generalStatus]}
            detail={hasData ? "Yoklama + ödev ortalaması" : "Yeterli veri yok"}
            accent="#059669"
            smallValue
          />
          <MetricCard
            title="Katılım Puanı"
            value={scoreOutOfTen(stats.generalScore)}
            detail="10 üzerinden"
            accent="#0f766e"
          />
        </div>

        {/* Weekly table + chart */}
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 14 }}>
          <SectionBox title="Haftalık Takip">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thStyle} />
                  {DAY_SHORT.map((day) => (
                    <th key={day} style={thStyle}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={rowLabelStyle}>Yoklama</td>
                  {stats.dailyCells.map((cell) => {
                    const display = attendanceDisplay(cell.attendanceStatus);
                    return (
                      <td key={`att-${cell.date}`} style={cellStyle}>
                        <span style={{ color: display.color, fontWeight: 900, fontSize: 18 }}>
                          {display.symbol}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={rowLabelStyle}>Ödev</td>
                  {stats.dailyCells.map((cell) => {
                    const display = homeworkDisplay(cell.homeworkStatus);
                    return (
                      <td key={`hw-${cell.date}`} style={cellStyle}>
                        <span style={{ color: display.color, fontWeight: 900, fontSize: 18 }}>
                          {display.symbol}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </SectionBox>

          <SectionBox title="Haftalık Performans">
            {hasData ? (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120, paddingTop: 8 }}>
                {dailyScores.map((score, index) => {
                  const height = score == null ? 8 : Math.max(12, Math.round((score / 100) * 96));
                  return (
                    <div key={DAY_SHORT[index]} style={{ flex: 1, textAlign: "center" }}>
                      <div
                        style={{
                          height,
                          borderRadius: "10px 10px 4px 4px",
                          background:
                            score == null
                              ? "#e2e8f0"
                              : score >= 80
                                ? "#059669"
                                : score >= 50
                                  ? "#d97706"
                                  : "#dc2626",
                          margin: "0 auto",
                          width: "100%",
                          maxWidth: 42,
                        }}
                      />
                      <p style={{ margin: "6px 0 0", fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                        {DAY_SHORT[index]}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, fontWeight: 800, color: "#334155" }}>
                        {score == null ? "—" : `%${score}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#64748b" }}>
                Bu hafta için yeterli takip verisi bulunmamaktadır.
              </p>
            )}
          </SectionBox>
        </div>

        {/* Analysis blocks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <SectionBox title="Ders / Alan Bilgisi" compact>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#334155" }}>{subjectText}</p>
          </SectionBox>
          <SectionBox title="Gelişim Notu" compact>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#334155" }}>
              {hasData ? analysis.developmentArea : "Bu hafta için gelişim notu oluşturulacak yeterli veri girilmemiştir."}
            </p>
          </SectionBox>
        </div>

        <SectionBox title="Hoca Görüşü">
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#1e293b" }}>{resolvedTeacherComment}</p>
        </SectionBox>

        <SectionBox title="Veliye Not" compact>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "#334155" }}>{resolvedParentNote}</p>
        </SectionBox>

        {/* Tags + footer */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                borderRadius: 999,
                background: "#eff6ff",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 12px",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            borderRadius: 18,
            background: "#0f172a",
            color: "#ffffff",
            padding: "18px 22px",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-end",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1" }}>
              Gayret ve devamlılıkla daha güzel neticeler temenni ederiz.
            </p>
            <p style={{ margin: "8px 0 0", fontSize: 15, fontWeight: 800 }}>
              {teacher || institutionName || "Nehari Takip"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
              {teacher ? "Öğretmen / Hoca" : "Kurum"}
            </p>
          </div>
          {institutionName ? (
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 700,
                color: "#93c5fd",
                textAlign: "right",
                maxWidth: "48%",
                wordBreak: "break-word",
              }}
            >
              {institutionName}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
});

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: 14, background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 12px" }}>
      <p style={{ margin: 0, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", color: "#64748b" }}>{label}</p>
      <p style={{ margin: "4px 0 0", fontSize: 13, fontWeight: 700, color: "#0f172a", wordBreak: "break-word" }}>
        {value}
      </p>
    </div>
  );
}

function MetricCard({
  title,
  value,
  detail,
  accent,
  smallValue = false,
}: {
  title: string;
  value: string;
  detail: string;
  accent: string;
  smallValue?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        padding: "16px 14px",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
      }}
    >
      <p style={{ margin: 0, fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", color: "#64748b" }}>{title}</p>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: smallValue ? 22 : 30,
          fontWeight: 900,
          color: accent,
          lineHeight: 1.1,
        }}
      >
        {value}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 11, lineHeight: 1.35, color: "#64748b" }}>{detail}</p>
    </div>
  );
}

function SectionBox({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        padding: compact ? "14px 16px" : "16px 18px",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.04)",
      }}
    >
      <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", color: "#475569" }}>
        {title.toUpperCase()}
      </p>
      {children}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "8px 4px",
  fontSize: 11,
  fontWeight: 800,
  color: "#64748b",
  textAlign: "center",
};

const rowLabelStyle: React.CSSProperties = {
  padding: "10px 8px 10px 0",
  fontSize: 12,
  fontWeight: 800,
  color: "#334155",
  textAlign: "left",
};

const cellStyle: React.CSSProperties = {
  padding: "8px 4px",
  textAlign: "center",
  borderTop: "1px solid #f1f5f9",
};

export function getKarneData(
  student: Student,
  records: DailyRecord[],
  refDate: string,
) {
  const { start, end, dates } = getWeekRange(refDate);
  const stats = computeWeeklyStats(student.id, records, dates);
  return { start, end, dates, stats };
}
