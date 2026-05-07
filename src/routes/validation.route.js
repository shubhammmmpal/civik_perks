import express from "express";
import {
  validatePin,
  solvePin,
} from "../controller/validation.controller.js";
import { protect } from "../middleware/auth.middlewere.js";

const router = express.Router();

router.post("/validate/:pinId",protect, validatePin);

router.post("/solve/:pinId",protect, solvePin);

export default router;