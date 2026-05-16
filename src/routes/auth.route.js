import express from "express";
import { loginWithOTP, verifyOTP } from "../controller/auth.controller.js";
import { updateProfile, getProfile, changeAccountType, activeUser } from "../controller/user.controller.js";
import {protect,authorizeRoles} from "../middleware/auth.middlewere.js";
import {upload} from "../config/multer.js";

const router = express.Router();

router.post("/login", loginWithOTP);
router.post("/verify-otp", verifyOTP);
router.patch("/change-account-type", protect, changeAccountType);  
router.put(
  "/update-profile",
  protect,
  upload.single("image"),
  updateProfile
);
router.get("/profile", protect, getProfile);
router.put("/active-user",protect, activeUser);

export default router;