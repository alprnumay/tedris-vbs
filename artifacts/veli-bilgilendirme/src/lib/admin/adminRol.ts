export type AdminRol = "user" | "admin";

const ADMIN_ROLES = new Set(["admin", "yonetici", "yönetici", "Yönetici", "Admin"]);

export function normalizeRole(role?: string | null, isAdmin?: boolean): AdminRol {
  if (isAdmin) return "admin";
  if (!role) return "user";
  const r = role.toLowerCase().trim();
  if (r === "admin" || ADMIN_ROLES.has(role)) return "admin";
  return "user";
}

export const ROL_LABEL: Record<AdminRol, string> = {
  user: "Kullanıcı",
  admin: "Admin",
};

export function rolAciklama(rol: AdminRol): string {
  if (rol === "admin") {
    return "Yönetim paneli, raporlar, kullanıcı ve destek yönetimi.";
  }
  return "Uygulama modülleri; yönetim paneline erişemez.";
}
