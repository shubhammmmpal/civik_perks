import express from "express";
import { createDirectionActivity } from "../controller/activity.controller.js";

const router = express.Router();

router.post("/create-direction", createDirectionActivity);

export default router;