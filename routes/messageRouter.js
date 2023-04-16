import { Router } from "express";

import messageCtrl from "../controllers/messageCtrl.js";

const router = Router();

router.post('/', messageCtrl.getMessages);

router.post('/send', messageCtrl.sendMessage);

export default router;