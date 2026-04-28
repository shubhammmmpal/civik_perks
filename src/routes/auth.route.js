import express from "express";
import { loginWithOTP, verifyOTP } from "../controller/auth.controller.js";

const router = express.Router();

router.post("/login", loginWithOTP);
router.post("/verify-otp", verifyOTP);

export default router;