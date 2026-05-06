import express from "express";
import { buyBoost } from "../controller/paidPlain.controller.js";
import {protect,authorizeRoles} from "../middleware/auth.middlewere.js";
import {upload} from "../config/multer.js";

const router = express.Router();

router.post("/buy-boost", protect, buyBoost);


export default router;