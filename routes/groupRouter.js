import { Router } from "express";

import groupCtrl from "../controllers/groupCtrl.js";

import { auth } from "../middleware/auth.js";

const router = Router();

router.post("/", auth, groupCtrl.getOneGroup);

router.post("/all", auth, groupCtrl.getAllGroups);

export default router;
