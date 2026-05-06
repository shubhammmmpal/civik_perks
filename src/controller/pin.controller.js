import mongoose from "mongoose";
import Pin from "../model/pin.model.js";

export const createPin = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const {
      description,
      bounty,
      xpScore,
      latitude,
      longitude
    } = req.body || {};

    const userId = req.user?.id;
   

    // parse questions
    let questions = [];
    if (req.body.questions) {
      questions = JSON.parse(req.body.questions);
    }

    if (!questions.length) {
      return res.status(400).json({
        success: false,
        message: "Questions are required"
      });
    }

    const imageUrls =
      req.files?.map(file => file.path || file.filename) || [];

    const newPin = await Pin.create({
      questions,
      description,
      images: imageUrls,
      bounty: bounty || 0,
      xpScore: xpScore || 0,
      createdBy: userId,
      location: {
        // type: "Point",
        latitude,
        longitude,
        // coordinates: [Number(longitude), Number(latitude)]
      }
      
    });

    res.status(201).json({
      success: true,
      message: "Pin created successfully",
      data: newPin
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const getAllPins = async (req, res) => {
  try {
    const pins = await Pin.find({})
      .populate("createdBy", "name email") // optional
      .populate("validatedBy", "name email") // optional
      .sort({ createdAt: -1 }) // latest first
      .lean();

    res.status(200).json({
      success: true,
      count: pins.length,
      data: pins
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

export const getPinById = async (req, res) => {
  try {
    const { id } = req.params;

    // validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pin ID"
      });
    }

    const pin = await Pin.findById(id)
      .populate("createdBy", "name email")
      .populate("validatedBy", "name email");

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: "Pin not found"
      });
    }

    res.status(200).json({
      success: true,
      data: pin
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};