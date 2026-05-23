const ADMIN_ROLES = new Set(["admin", "yonetici", "yönetici", "Yönetici", "Admin"]);

export function normalizeRole(role?: string | null, isAdmin?: boolean): "user" | "admin" {
  if (isAdmin) return "admin";
  if (!role) return "user";
  const r = role.toLowerCase().trim();
  if (r === "admin" || ADMIN_ROLES.has(role ?? "")) return "admin";
  return "user";
}

export function isAdminRole(role?: string | null, isAdmin?: boolean): boolean {
  return normalizeRole(role, isAdmin) === "admin";
}
