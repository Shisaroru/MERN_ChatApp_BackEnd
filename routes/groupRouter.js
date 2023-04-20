import { Router } from "express";

import groupCtrl from "../controllers/groupCtrl.js";

const router = Router();

router.post('/', groupCtrl.getOneGroup);

router.post('/all', groupCtrl.getAllGroups);

export default router;