/** Nehari Platformu içi (wouter base=/davet) ana menü */
export const NEHARI_PLATFORM_HREF = "/";

/**
 * Platformun tek ana sayfası — Nehari Çalışma Paneli.
 * Tüm "Ana sayfaya dön" bağlantıları buraya yönlendirilir.
 */
export const HOME_ROUTE = "/davet";
export const APP_HOME_PATH = HOME_ROUTE;

export function goToAppHome() {
  window.location.assign(HOME_ROUTE);
}
