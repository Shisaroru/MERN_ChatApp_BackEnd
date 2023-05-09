import { Router } from "express";

import messageCtrl from "../controllers/messageCtrl.js";

import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/", auth, messageCtrl.getMessages);

router.post("/send", auth, messageCtrl.sendMessage);

export default router;
