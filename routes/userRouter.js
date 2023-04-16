import { Router } from "express";

import userCtrl from "../controllers/userCtrl.js";

const router = Router();

router.post('/register', userCtrl.register);

router.post('/login', userCtrl.login);

router.post('/logout', userCtrl.logout);

export default router;