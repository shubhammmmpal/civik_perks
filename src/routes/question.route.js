
import express from "express";
const router = express.Router();
import { createQuestion,getQuestion,getAllQuestions } from "../controller/question.controller.js";



// Create Question
router.post("/questions", createQuestion);
router.get("/questions", getAllQuestions);
router.get("/questions/:identifier", getQuestion);


export default router;