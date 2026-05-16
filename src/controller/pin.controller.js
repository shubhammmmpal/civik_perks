import mongoose from "mongoose";
import Pin from "../model/pin.model.js";
import States from "../model/states.model.js";
import User from "../model/user.model.js";
import { getLevelData, XP_CONFIG } from "../helper/constants.js";

// export const createPin = async (req, res) => {
//   try {
//     console.log("BODY:", req.body);
//     console.log("FILES:", req.files);

//     const {
//       description,
//       bounty,
//       xpScore,
//       latitude,
//       longitude
//     } = req.body || {};

//     const userId = req.user?.id;
   

//     // parse questions
//     let questions = [];
//     if (req.body.questions) {
//       questions = JSON.parse(req.body.questions);
//     }

//     if (!questions.length) {
//       return res.status(400).json({
//         success: false,
//         message: "Questions are required"
//       });
//     }

//     const imageUrls =
//       req.files?.map(file => file.path || file.filename) || [];

//     const newPin = await Pin.create({
//       questions,
//       description,
//       images: imageUrls,
//       bounty: bounty || 0,
//       xpScore: xpScore || 0,
//       createdBy: userId,
//       location: {
//         // type: "Point",
//         latitude,
//         longitude,
//         // coordinates: [Number(longitude), Number(latitude)]
//       }
      
//     });

//     res.status(201).json({
//       success: true,
//       message: "Pin created successfully",
//       data: newPin
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

export const createPin = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILES:", req.files);

    const {
      description,
      bounty,
      latitude,
      longitude,
    } = req.body || {};

    const userId = req.user?.id;

    // =========================================
    // VALIDATION
    // =========================================

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // =========================================
    // GET USER
    // =========================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =========================================
    // CHECK USER CREDITS
    // =========================================

    const pinBounty = Number(bounty) || 0;

    if (user.credits < pinBounty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits to create pin",
      });
    }

    // =========================================
    // PARSE QUESTIONS
    // =========================================

    let questions = [];

    if (req.body.questions) {
      questions = JSON.parse(req.body.questions);
    }

    if (!questions.length) {
      return res.status(400).json({
        success: false,
        message: "Questions are required",
      });
    }

    // =========================================
    // CALCULATE XP
    // =========================================

    let totalXP = 0;

    questions.forEach(() => {
      totalXP += 10;
    });

    // =========================================
    // IMAGE URLS
    // =========================================

    const imageUrls =
      req.files?.map(
        (file) => file.path || file.filename
      ) || [];

    // =========================================
    // CREATE PIN
    // =========================================

    const newPin = await Pin.create({
      questions,

      description,

      images: imageUrls,

      bounty: pinBounty,

      xpScore: totalXP,

      createdBy: userId,

      location: {
        type: "Point",

        coordinates: [
          Number(longitude),
          Number(latitude),
        ],
      },
    });

    // =========================================
    // UPDATE USER REWARDS
    // =========================================

    user.credits = user.credits - pinBounty + 5;

    user.xp += 10;

    // max trust score should not exceed 99.9
    user.trustScore = Math.min(
      99.9,
      Number((user.trustScore + 0.1).toFixed(1))
    );

    // =========================================
    // LEVEL SYSTEM (OPTIONAL)
    // =========================================

    const levelData = getLevelData(user.xp);

    user.level = levelData.level;
    user.levelName = levelData.name;

    await user.save();

    // =========================================
    // UPDATE STATES
    // =========================================

    await States.findOneAndUpdate(
      { user: userId },

      {
        $inc: {
          pinsDropped: 1,
        },
      },

      {
        new: true,
        upsert: true,
      }
    );

    return res.status(201).json({
      success: true,
      message: "Pin created successfully",
      data: newPin,

      rewards: {
        gainedXP: 10,
        gainedCredits: 5,
        gainedTrustScore: 0.1,
      },

      remainingCredits: user.credits,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
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

    // =========================================
    // VALIDATE OBJECT ID
    // =========================================
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pin ID",
      });
    }

    // =========================================
    // GET PIN
    // =========================================
    const pin = await Pin.findById(id)
      .populate(
        "createdBy",
        "name email profileImage"
      )
      .populate(
        "validatedBy",
        "name email profileImage xp wallet"
      )
      .populate(
        "beneficiaries",
        "name email profileImage"
      );

    if (!pin) {
      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // =========================================
    // BASE RESPONSE
    // =========================================
    const responseData = {
      success: true,
      data: pin,
    };

    // =========================================
    // IF PIN IS UNDER VALIDATION
    // =========================================
    if (
      pin.validatedBy &&
      pin.status === "orange"
    ) {
      responseData.validationInfo = {
        validator: pin.validatedBy,

        message:
          "This task is currently under validation. You can still join as a beneficiary within 24 hours. Rewards will be credited after successful task completion.",

        rewardInfo: {
          beneficiaryReward: {
            bounty: pin.bounty * 0.5,
            xp: pin.xpScore * 0.5,
          },

          note:
            "Beneficiary rewards are distributed only after the validator successfully completes the task.",
        },

        taskStatus: pin.status,
      };
    }

    // =========================================
    // IF TASK COMPLETED
    // =========================================
    if (pin.status === "green") {
      responseData.completionInfo = {
        message:
          "This task has already been completed successfully.",

        completedBy: pin.validatedBy,

        taskStatus: pin.status,
      };
    }

    // =========================================
    // SEND RESPONSE
    // =========================================
    return res.status(200).json(responseData);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};