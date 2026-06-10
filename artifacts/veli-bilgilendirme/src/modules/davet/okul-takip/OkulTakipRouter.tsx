import { Route, Switch } from "wouter";
import OkulTakipHubPage from "@/modules/davet/okul-takip/OkulTakipHubPage";
import DailyTrackingPage from "@/modules/davet/okul-takip/DailyTrackingPage";
import ReportsPage from "@/modules/davet/okul-takip/ReportsPage";
import KarnelerPage from "@/modules/davet/okul-takip/KarnelerPage";
import KarneDetailPage from "@/modules/davet/okul-takip/KarneDetailPage";
import RiskStudentsPage from "@/modules/davet/okul-takip/RiskStudentsPage";
import StudentListPage from "@/modules/davet/okul-takip/StudentListPage";
import {
  OKUL_TAKIP_GUNLUK,
  OKUL_TAKIP_HOME,
  OKUL_TAKIP_KARNELER,
  OKUL_TAKIP_OGRENCILER,
  OKUL_TAKIP_RAPORLAR,
  OKUL_TAKIP_RISKLI,
} from "@/modules/davet/okul-takip/routes";

/** DavetRouter içinde düz route tanımları (iç içe Router yok). */
export function OkulTakipRoutes() {
  return (
    <Switch>
      <Route path={OKUL_TAKIP_HOME} component={OkulTakipHubPage} />
      <Route path={OKUL_TAKIP_GUNLUK} component={DailyTrackingPage} />
      <Route path={OKUL_TAKIP_RAPORLAR} component={ReportsPage} />
      <Route path={`${OKUL_TAKIP_KARNELER}/:studentId`} component={KarneDetailPage} />
      <Route path={OKUL_TAKIP_KARNELER} component={KarnelerPage} />
      <Route path={OKUL_TAKIP_RISKLI} component={RiskStudentsPage} />
      <Route path={OKUL_TAKIP_OGRENCILER} component={StudentListPage} />
    </Switch>
  );
}
