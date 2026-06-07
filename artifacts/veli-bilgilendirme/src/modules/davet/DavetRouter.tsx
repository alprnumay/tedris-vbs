import { Router, Route, Switch, Link } from "wouter";
import { Button } from "@/components/davet-ui/button";
import HomePage from "@/modules/davet/home/HomePage";
import InvitePage from "@/modules/davet/invite/InvitePage";
import BoardingProgramPage from "@/modules/davet/boarding/BoardingProgramPage";
import ShareShowcasePage from "@/modules/davet/showcase/ShareShowcasePage";
import PublishedShowcasePage from "@/modules/davet/showcase/PublishedShowcasePage";
import CalismaOnayPage from "@/modules/davet/admin/CalismaOnayPage";
import { RequireDavetAdmin } from "@/modules/davet/guards/RequireDavetAdmin";
import { DavetLayout } from "@/modules/davet/layout/DavetLayout";

function DavetNotFound() {
  return (
    <DavetLayout>
      <p className="text-muted-foreground">Sayfa bulunamadı.</p>
      <Link href="/">
        <Button variant="outline" className="mt-4">
          Nehari ana sayfa
        </Button>
      </Link>
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
        <Route path="/calisma-paylas" component={ShareShowcasePage} />
        <Route path="/yayindaki-calismalar" component={PublishedShowcasePage} />
        <Route path="/calisma-onay" component={CalismaOnayRoute} />
        <Route component={DavetNotFound} />
      </Switch>
    </Router>
  );
}
