import { Router } from "express";

import userCtrl from "../controllers/userCtrl.js";

import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/refresh_token", userCtrl.refresh_token);

router.post("/register", userCtrl.register);

router.post("/login", userCtrl.login);

router.post("/logout", userCtrl.logout);

router.post("/search", auth, userCtrl.getUsers);

router.post("/getOneUser", auth, userCtrl.getOneUser);

router.patch("/unfriend", auth, userCtrl.unfriend);

router.patch("/clearNotifications", auth, userCtrl.clearNotifications);

export default router;
