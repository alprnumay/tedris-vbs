import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import localAuthRouter from "./localAuth";
import postersRouter from "./posters";
import supportRouter from "./support";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(localAuthRouter);
router.use(postersRouter);
router.use(supportRouter);

export default router;
