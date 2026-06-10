import { Router, Route, Switch } from "wouter";
import OkulTakipHubPage from "@/modules/davet/okul-takip/OkulTakipHubPage";
import DailyTrackingPage from "@/modules/davet/okul-takip/DailyTrackingPage";
import ReportsPage from "@/modules/davet/okul-takip/ReportsPage";
import KarnelerPage from "@/modules/davet/okul-takip/KarnelerPage";
import KarneDetailPage from "@/modules/davet/okul-takip/KarneDetailPage";
import RiskStudentsPage from "@/modules/davet/okul-takip/RiskStudentsPage";
import StudentListPage from "@/modules/davet/okul-takip/StudentListPage";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";
import { BackButton } from "@/modules/davet/layout/ModulePageHeader";

function OkulTakipNotFound() {
  return (
    <DavetLayout>
      <BackButton label="Modül ana ekranı" href="/okul-takip" />
      <p className="text-muted-foreground">Sayfa bulunamadı.</p>
    </DavetLayout>
  );
}

export function OkulTakipRouter() {
  return (
    <Router base="/okul-takip">
      <Switch>
        <Route path="/" component={OkulTakipHubPage} />
        <Route path="/gunluk" component={DailyTrackingPage} />
        <Route path="/raporlar" component={ReportsPage} />
        <Route path="/karneler" component={KarnelerPage} />
        <Route path="/karneler/:studentId" component={KarneDetailPage} />
        <Route path="/riskli" component={RiskStudentsPage} />
        <Route path="/ogrenciler" component={StudentListPage} />
        <Route component={OkulTakipNotFound} />
      </Switch>
    </Router>
  );
}
