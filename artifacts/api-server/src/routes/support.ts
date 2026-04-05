import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { supportRequestsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import nodemailer from "nodemailer";

const router: IRouter = Router();

const DESTEK_EMAIL = "alprn0604@gmail.com";

async function emailGonder(userName: string | undefined, userEmail: string | undefined, message: string) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) return;

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"Tedris VBS Destek" <${smtpUser}>`,
      to: DESTEK_EMAIL,
      subject: "Tedris VBS — Yeni Destek Talebi",
      text: [
        `Kullanıcı: ${userName || "Bilinmiyor"}`,
        `E-posta: ${userEmail || "—"}`,
        "",
        "Mesaj:",
        message,
      ].join("\n"),
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#f8fafc;border-radius:12px;padding:24px;">
          <h2 style="color:#1e3a5f;margin:0 0 16px;">Yeni Destek Talebi</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:90px;font-weight:700;">Kullanıcı</td><td style="padding:6px 0;color:#1e293b;font-size:13px;">${userName || "Bilinmiyor"}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-size:13px;font-weight:700;">E-posta</td><td style="padding:6px 0;color:#1e293b;font-size:13px;">${userEmail || "—"}</td></tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px;border:1px solid #e2e8f0;">
            <p style="font-size:13px;color:#64748b;font-weight:700;margin:0 0 8px;">Mesaj</p>
            <p style="font-size:14px;color:#1e293b;line-height:1.6;margin:0;">${message.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("[destek] Email gönderilemedi:", err);
  }
}

function getUserId(req: Request): string | null {
  if (req.localUser?.id) return req.localUser.id;
  if (req.isAuthenticated()) return req.user.id;
  return null;
}

router.post("/support", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { message, imageBase64 } = req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({ error: "Mesaj boş olamaz" });
    return;
  }

  let userEmail: string | undefined;
  let userName: string | undefined;

  if (req.localUser) {
    userEmail = req.localUser.email;
    userName = req.localUser.name;
  }

  await db.insert(supportRequestsTable).values({
    userId: userId ?? undefined,
    userEmail,
    userName,
    message: message.trim(),
    imageBase64: imageBase64 || null,
  });

  emailGonder(userName, userEmail, message.trim()).catch(() => {});

  res.json({ ok: true });
});

router.get("/support/admin", async (req: Request, res: Response) => {
  const requests = await db
    .select({
      id: supportRequestsTable.id,
      userId: supportRequestsTable.userId,
      userEmail: supportRequestsTable.userEmail,
      userName: supportRequestsTable.userName,
      message: supportRequestsTable.message,
      createdAt: supportRequestsTable.createdAt,
    })
    .from(supportRequestsTable)
    .orderBy(supportRequestsTable.createdAt);
  res.json({ requests });
});

router.get("/support/stats", async (_req: Request, res: Response) => {
  try {
    const [userCount, posterCount, supportCount, dailyUsers, dailyPosters, recentUsers] = await Promise.all([
      db.execute(sql`SELECT COUNT(*)::int AS count FROM local_users`),
      db.execute(sql`SELECT COUNT(*)::int AS count FROM posters`),
      db.execute(sql`SELECT COUNT(*)::int AS count FROM support_requests`),
      db.execute(sql`
        SELECT TO_CHAR(DATE(created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count
        FROM local_users
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY day
      `),
      db.execute(sql`
        SELECT TO_CHAR(DATE(created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS count
        FROM posters
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY day
      `),
      db.execute(sql`
        SELECT id, name, email,
               TO_CHAR(created_at AT TIME ZONE 'UTC', 'DD.MM.YYYY HH24:MI') AS created_at
        FROM local_users
        ORDER BY created_at DESC
        LIMIT 10
      `),
    ]);
    res.json({
      totalUsers: (userCount.rows[0] as { count: number }).count,
      totalPosters: (posterCount.rows[0] as { count: number }).count,
      totalSupport: (supportCount.rows[0] as { count: number }).count,
      dailyUsers: dailyUsers.rows as { day: string; count: number }[],
      dailyPosters: dailyPosters.rows as { day: string; count: number }[],
      recentUsers: recentUsers.rows as { id: string; name: string; email: string; created_at: string }[],
    });
  } catch (err) {
    console.error("[admin stats]", err);
    res.status(500).json({ error: "İstatistikler yüklenemedi" });
  }
});

export default router;
