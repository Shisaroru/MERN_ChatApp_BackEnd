import { Router } from "express";

import requestCtrl from "../controllers/requestCtrl.js";

import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/create", auth, requestCtrl.createRequest);

router.post("/reply", auth, requestCtrl.replyRequest);

router.delete("/cancel", auth, requestCtrl.cancelRequest);

export default router;
