import type { ComponentType } from "react";
import { Router, Route, Switch } from "wouter";
import HomePage from "@/modules/davet/home/HomePage";
import InvitePage from "@/modules/davet/invite/InvitePage";
import BoardingProgramPage from "@/modules/davet/boarding/BoardingProgramPage";
import ShareShowcasePage from "@/modules/davet/showcase/ShareShowcasePage";
import PublishedShowcasePage from "@/modules/davet/showcase/PublishedShowcasePage";
import CalismaOnayPage from "@/modules/davet/admin/CalismaOnayPage";
import OkulTakipHubPage from "@/modules/davet/okul-takip/OkulTakipHubPage";
import DailyTrackingPage from "@/modules/davet/okul-takip/DailyTrackingPage";
import ReportsPage from "@/modules/davet/okul-takip/ReportsPage";
import KarnelerPage from "@/modules/davet/okul-takip/KarnelerPage";
import KarneDetailPage from "@/modules/davet/okul-takip/KarneDetailPage";
import RiskStudentsPage from "@/modules/davet/okul-takip/RiskStudentsPage";
import StudentListPage from "@/modules/davet/okul-takip/StudentListPage";
import NotificationSettingsPage from "@/modules/davet/notifications/NotificationSettingsPage";
import {
  NOTIFICATION_SETTINGS,
  OKUL_TAKIP_GUNLUK,
  OKUL_TAKIP_HOME,
  OKUL_TAKIP_KARNELER,
  OKUL_TAKIP_OGRENCILER,
  OKUL_TAKIP_RAPORLAR,
  OKUL_TAKIP_RISKLI,
} from "@/modules/davet/okul-takip/routes";
import { RequireDavetAdmin } from "@/modules/davet/guards/RequireDavetAdmin";
import { RequireDavetAuth } from "@/modules/davet/guards/RequireDavetAuth";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";

function DavetNotFound() {
  return (
    <DavetLayout>
      <div className="space-y-4">
        <BackButton label="Nehari Platformu" href="/" />
        <p className="text-muted-foreground">Sayfa bulunamadı.</p>
      </div>
    </DavetLayout>
  );
}

function CalismaOnayRoute() {
  return (
    <RequireDavetAdmin>
      <CalismaOnayPage />
    </RequireDavetAdmin>
  );
}

function OkulTakipAuthRoute({ component: Component }: { component: ComponentType }) {
  return (
    <RequireDavetAuth>
      <Component />
    </RequireDavetAuth>
  );
}

export function DavetRouter() {
  return (
    <Router base="/davet">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/veli" component={InvitePage} />
        <Route path="/yatili-program" component={BoardingProgramPage} />
        <Route path={OKUL_TAKIP_HOME} component={() => <OkulTakipAuthRoute component={OkulTakipHubPage} />} />
        <Route path={OKUL_TAKIP_GUNLUK} component={() => <OkulTakipAuthRoute component={DailyTrackingPage} />} />
        <Route path={OKUL_TAKIP_RAPORLAR} component={() => <OkulTakipAuthRoute component={ReportsPage} />} />
        <Route path={`${OKUL_TAKIP_KARNELER}/:studentId`} component={() => <OkulTakipAuthRoute component={KarneDetailPage} />} />
        <Route path={OKUL_TAKIP_KARNELER} component={() => <OkulTakipAuthRoute component={KarnelerPage} />} />
        <Route path={OKUL_TAKIP_RISKLI} component={() => <OkulTakipAuthRoute component={RiskStudentsPage} />} />
        <Route path={OKUL_TAKIP_OGRENCILER} component={() => <OkulTakipAuthRoute component={StudentListPage} />} />
        <Route path={NOTIFICATION_SETTINGS} component={NotificationSettingsPage} />
        <Route path="/calisma-paylas" component={ShareShowcasePage} />
        <Route path="/yayindaki-calismalar" component={PublishedShowcasePage} />
        <Route path="/calisma-onay" component={CalismaOnayRoute} />
        <Route component={DavetNotFound} />
      </Switch>
    </Router>
  );
}
