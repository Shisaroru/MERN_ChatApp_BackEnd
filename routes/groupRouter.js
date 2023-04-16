import { Router } from "express";

import groupCtrl from "../controllers/groupCtrl.js";

const router = Router();

router.post('/', groupCtrl.getOneGroup);

export default router;