import { Router, Route, Switch } from "wouter";
import HomePage from "@/modules/davet/home/HomePage";
import InvitePage from "@/modules/davet/invite/InvitePage";
import BoardingProgramPage from "@/modules/davet/boarding/BoardingProgramPage";
import ShareShowcasePage from "@/modules/davet/showcase/ShareShowcasePage";
import PublishedShowcasePage from "@/modules/davet/showcase/PublishedShowcasePage";
import CalismaOnayPage from "@/modules/davet/admin/CalismaOnayPage";
import { OkulTakipRouter } from "@/modules/davet/okul-takip/OkulTakipRouter";
import { RequireDavetAdmin } from "@/modules/davet/guards/RequireDavetAdmin";
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

export function DavetRouter() {
  return (
    <Router base="/davet">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/veli" component={InvitePage} />
        <Route path="/yatili-program" component={BoardingProgramPage} />
        <Route path="/okul-takip">
          <OkulTakipRouter />
        </Route>
        <Route path="/calisma-paylas" component={ShareShowcasePage} />
        <Route path="/yayindaki-calismalar" component={PublishedShowcasePage} />
        <Route path="/calisma-onay" component={CalismaOnayRoute} />
        <Route component={DavetNotFound} />
      </Switch>
    </Router>
  );
}
