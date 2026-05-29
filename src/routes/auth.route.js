import express from "express";
import { loginWithOTP, verifyOTP } from "../controller/auth.controller.js";
import { updateProfile, getProfile, changeAccountType, activeUser, getAllStates,
  getStatesByUserID,
  getAllActivities,
  getActivitiesByUserID, } from "../controller/user.controller.js";
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

// GET ALL STATES
router.get("/states", getAllStates);

// GET STATES BY USER ID
router.get("/states/:userId", getStatesByUserID);
router.get("/activities", getAllActivities);

router.get("/activities/:userId", getActivitiesByUserID);

export default router;