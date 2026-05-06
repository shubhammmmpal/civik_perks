import mongoose from "mongoose";
import Question from "../model/question.model.js"

// @desc   Create new question
// @route  POST /api/questions
// @access Admin (ya protected)
export const createQuestion = async (req, res) => {
  try {
    const { questionIndex, question, categories } = req.body;

    // basic validation
    if (!questionIndex || !question || !categories) {
      return res.status(400).json({
        success: false,
        message: "questionIndex, question and categories are required"
      });
    }

    // check duplicate questionIndex
    const exists = await Question.findOne({ questionIndex });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "QuestionIndex already exists"
      });
    }

    const newQuestion = await Question.create({
      questionIndex,
      question,
      categories
    });

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: newQuestion
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const getQuestion = async (req, res) => {
  try {
    const { identifier } = req.params;

    let query = {};

    // check if identifier is Mongo ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query._id = identifier;
    } else if (!isNaN(identifier)) {
      query.questionIndex = Number(identifier);
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid identifier. Must be _id or numeric questionIndex"
      });
    }

    const question = await Question.findOne(query);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: question
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({})
      .sort({ questionIndex: 1 }); // ordered response

    return res.status(200).json({
      success: true,
      count: questions.length,
      data: questions
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};