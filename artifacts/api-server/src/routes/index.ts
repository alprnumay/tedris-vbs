import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import localAuthRouter from "./localAuth";
import postersRouter from "./posters";
import supportRouter from "./support";
import adminRouter from "./admin";
import adminReportsRouter from "./adminReports";
import activityRouter from "./activity";
import vpsRepairRouter from "./vpsRepair";
import davetShowcaseRouter from "./davetShowcase";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(localAuthRouter);
router.use(activityRouter);
router.use(postersRouter);
router.use(supportRouter);
router.use(vpsRepairRouter);
router.use(adminRouter);
router.use(adminReportsRouter);
router.use(davetShowcaseRouter);

export default router;
