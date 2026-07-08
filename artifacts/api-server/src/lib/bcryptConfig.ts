/** bcrypt maliyeti — BCRYPT_ROUNDS=10 yüksek eşzamanlı login için makul alternatif (güvenlik/konfor dengesi). */
export const BCRYPT_ROUNDS = Math.max(
  4,
  Math.min(15, Number(process.env.BCRYPT_ROUNDS || 10) || 10),
);
