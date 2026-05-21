import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const GONE_BODY = {
  error: "poster_storage_disabled",
  message: "Afiş kaydetme özelliği devre dışı bırakıldı.",
};

function posterStorageDisabled(_req: Request, res: Response) {
  res.status(410).json(GONE_BODY);
}

router.all("/posters", posterStorageDisabled);
router.all("/posters/:id", posterStorageDisabled);

export default router;
