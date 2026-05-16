// validation.controller.js

import Validation from "../model/validation.model.js";
import Pin from "../model/pin.model.js";
import User from "../model/user.model.js"; // assuming you have user model
import mongoose from "mongoose";
import { calculateDistanceInMeters } from "../helper/helper.js";
import { getLevelData } from "../helper/constants.js";
import States from "../model/states.model.js";
import Activity from "../model/activity.model.js";

/*
|--------------------------------------------------------------------------
| VALIDATE PIN API
|--------------------------------------------------------------------------
|
| FLOW:
|
| 1. First validator validates pin
|    -> Pin status = orange
|    -> Validation status = orange
|    -> validator becomes validatedBy
|
| 2. Within 24 hours another user can validate same pin
|    -> Second user becomes beneficiary
|    -> Both users get rewards
|    -> beneficiary gets 50%
|
| 3. If task solved later
|    -> status becomes green
|
*/

export const validatePin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { pinId } = req.params;
    const userId = req.user.id;

    // =========================================
    // CURRENT USER LIVE LOCATION (FRONTEND GPS)
    // =========================================

    const { currentLatitude, currentLongitude } = req.body;

    if (!currentLatitude || !currentLongitude) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Current location is required",
      });
    }

    console.log("line 58")

    // =========================================
    // FIND USER
    // =========================================

    const user = await User.findById(userId).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // =========================================
    // FIND PIN
    // =========================================

    const pin = await Pin.findById(pinId).session(session);

    if (!pin) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    console.log("line 90")

    // =========================================
    // PREVENT CREATOR VALIDATION
    // =========================================

    if (pin.createdBy.toString() === userId) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You cannot validate your own pin",
      });
    }

    // =========================================
    // PIN LOCATION
    // =========================================

    const pinLongitude = pin.location.coordinates[0];
    const pinLatitude = pin.location.coordinates[1];

    // =========================================
    // LIVE GPS → PIN DISTANCE
    // Used for 10 meter validation
    // =========================================

    const liveDistance = calculateDistanceInMeters(
      Number(currentLatitude),
      Number(currentLongitude),
      pinLatitude,
      pinLongitude,
    );


    console.log("line 125")
    // =========================================
    // CHECK 10 METER RADIUS
    // =========================================

    if (liveDistance > 10) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message: "You must be within 10 meters of the pin location",
        distance: `${liveDistance.toFixed(2)} meters`,
      });
    }

    // =========================================
    // USER SAVED LOCATION
    // Used for travel XP
    // =========================================

    const dbLatitude = user.latitude;
    const dbLongitude = user.longitude;

    if (!dbLatitude || !dbLongitude) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Saved user location not found",
      });
    }


    console.log("line 158")

    // =========================================
    // DB LOCATION → PIN DISTANCE
    // =========================================

    const travelDistance = calculateDistanceInMeters(
      Number(dbLatitude),
      Number(dbLongitude),
      pinLatitude,
      pinLongitude,
    );

    // =========================================
    // XP CALCULATION
    // 1 XP per 100 meters
    // =========================================

    const travelXP = Math.max(1, Math.floor(travelDistance / 100));

    // =========================================
    // FIND VALIDATION
    // =========================================

    let validation = await Validation.findOne({
      pinID: pinId,
    }).session(session);

    // =====================================================
    // FIRST VALIDATOR
    // =====================================================

    console.log("line 190")

    console.log(validation)

    if (!validation) {
      validation = new Validation({
        pinID: pinId,
        validatedBy: userId,
        status: "orange",
        beneficiaries: [],
      });

      await validation.save({ session });

      // =========================================
      // UPDATE PIN
      // =========================================

      console.log("line 206")

      pin.validatedBy = userId;
      pin.status = "orange";

      // increase score
      pin.pinScore += 10;

      // auto verify
      if (pin.pinScore >= 100) {
        pin.pinStatus = "verified";
        pin.status = "green";
      }

      console.log("hit 4")

      await pin.save({ session });

      // =========================================
      // REWARD VALIDATOR
      // =========================================

      user.xp += travelXP;
      user.credits += 5;

      // trust score increase
      user.trustScore = Math.min(
        99.9,
        Number((user.trustScore + 0.1).toFixed(1)),
      );

      console.log("hit 3")
      // =========================================
      // UPDATE LEVEL
      // =========================================

      const levelData = getLevelData(user.xp);

      user.level = levelData.level;
      user.levelName = levelData.name;

      console.log("hit 1");

      await user.save({ session });

      // =========================================
      // UPDATE USER STATS
      // =========================================

      // =========================================
      // FIND USER STATS
      // =========================================
      console.log("hit 2");
      let userStats = await States.findOne({
        user: userId,
      }).session(session);

      // =========================================
      // CREATE IF NOT EXISTS
      // =========================================

      console.log(userStats);

      if (!userStats) {
        userStats = new States({
          user: userId,
          pinsValidated: 1,
        });
      } else {
        userStats.pinsValidated += 1;
      }

      // =========================================
      // SAVE
      // =========================================

      await userStats.save({ session });

      // =========================================
      // COMMIT
      // =========================================

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Pin validated successfully",

        rewards: {
          xpEarned: travelXP,
          creditsEarned: 5,
          trustScoreEarned: 0.1,
        },

        pinData: {
          pinScore: pin.pinScore,
          pinStatus: pin.pinStatus,
          status: pin.status,
        },

        distanceInfo: {
          liveDistanceMeters: liveDistance.toFixed(2),

          travelDistanceMeters: travelDistance.toFixed(2),
        },
      });
    }

    // =========================================
// UPDATE USER STATS
// =========================================

let userStats = await States.findOne({
  user: userId,
}).session(session);

// create if not exists
if (!userStats) {

  userStats = new States({
    user: userId,
    pinsValidated: 1,
  });

} else {

  userStats.pinsValidated += 1;

}

await userStats.save({ session });

    // =====================================================
    // PREVENT SAME VALIDATOR
    // =====================================================

    if (
      validation.validatedBy &&
      validation.validatedBy.toString() === userId
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You already validated this pin",
      });
    }

    // =====================================================
    // CHECK 24 HOUR WINDOW
    // =====================================================

    const createdAt = new Date(validation.createdAt);

    const now = new Date();

    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Validation window expired",
      });
    }

    // =====================================================
    // ALREADY BENEFICIARY
    // =====================================================

    const alreadyBeneficiary = validation.beneficiaries.some(
      (id) => id.toString() === userId,
    );

    if (alreadyBeneficiary) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Already validated as beneficiary",
      });
    }

    // =====================================================
    // ADD BENEFICIARY
    // =====================================================

    validation.beneficiaries.push(userId);

    await validation.save({ session });

    // =========================================
    // UPDATE PIN
    // =========================================

    pin.beneficiaries.push(userId);

    // increase score
    pin.pinScore += 10;

    // auto verify
    if (pin.pinScore >= 100) {
      pin.pinStatus = "verified";
      pin.status = "green";
    }

    await pin.save({ session });

    // =========================================
    // REWARD BENEFICIARY
    // =========================================

    user.xp += travelXP;
    user.credits += 2;

    // ======================================
    // TRUST SCORE INCREASE
    // ======================================

    user.trustScore = Math.min(
      99.9,
      Number((user.trustScore + 0.1).toFixed(1)),
    );

    // =========================================
    // UPDATE LEVEL
    // =========================================

    const levelData = getLevelData(user.xp);

    user.level = levelData.level;
    user.levelName = levelData.name;

    await user.save({ session });

    // =========================================
    // FETCH VALIDATOR
    // =========================================

    const validatorUser = await User.findById(validation.validatedBy).select(
      "name email xp level levelName credits trustScore",
    );

    // =========================================
    // COMMIT
    // =========================================

    await session.commitTransaction();

    // =========================================
    // RESPONSE
    // =========================================

    return res.status(200).json({
      success: true,

      message: "You successfully joined this validation task.",

      validator: validatorUser,

      rewards: {
        xpEarned: travelXP,
        creditsEarned: 2,
      },

      pinData: {
        pinScore: pin.pinScore,
        pinStatus: pin.pinStatus,
        status: pin.status,
      },

      distanceInfo: {
        liveDistanceMeters: liveDistance.toFixed(2),

        travelDistanceMeters: travelDistance.toFixed(2),
      },
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// solve pin
// export const solvePin = async (req, res) => {
//   const session = await mongoose.startSession();

//   try {
//     session.startTransaction();

//     const { pinId } = req.params;
//     const { action } = req.body;
//     // action = "stop" | "solve"

//     const pin = await Pin.findById(pinId).session(session);

//     if (!pin) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "Pin not found",
//       });
//     }

//     const validation = await Validation.findOne({
//       pinID: pinId,
//     }).session(session);

//     if (!validation) {
//       await session.abortTransaction();

//       return res.status(404).json({
//         success: false,
//         message: "Validation not found",
//       });
//     }

//     // ============================================
//     // STOP TASK
//     // ============================================
//     if (action === "stop") {
//       pin.status = "orange";
//       validation.status = "orange";

//       await pin.save({ session });
//       await validation.save({ session });

//       await session.commitTransaction();

//       return res.status(200).json({
//         success: true,
//         message: "Task stopped. Status remains orange.",
//       });
//     }

//     // ============================================
//     // SOLVE TASK
//     // ============================================
//     if (action === "solve") {
//       pin.status = "green";
//       validation.status = "green";

//       await pin.save({ session });
//       await validation.save({ session });

//       await session.commitTransaction();

//       return res.status(200).json({
//         success: true,
//         message: "Task solved successfully",
//       });
//     }

//     await session.abortTransaction();

//     return res.status(400).json({
//       success: false,
//       message: "Invalid action",
//     });
//   } catch (error) {
//     await session.abortTransaction();

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   } finally {
//     session.endSession();
//   }
// };
export const solvePin = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    await session.startTransaction();

    const { pinId } = req.params;
    const { action } = req.body;

    const userId = req.user.id;

    // =====================================================
    // FIND PIN
    // =====================================================
    const pin = await Pin.findById(pinId).session(session);

    if (!pin) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // =====================================================
    // FIND VALIDATION
    // =====================================================
    const validation = await Validation.findOne({
      pinID: pinId,
    }).session(session);

    if (!validation) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Validation not found",
      });
    }

    // =====================================================
    // ONLY VALIDATOR CAN SOLVE
    // =====================================================
    if (validation.validatedBy.toString() !== userId) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message: "Only validator can complete this task",
      });
    }

    // =====================================================
    // STOP TASK
    // =====================================================
    if (action === "stop") {
      pin.status = "orange";

      validation.status = "orange";

      pin.stoppedAt = new Date();

      validation.stoppedAt = new Date();

      await pin.save({ session });

      await validation.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Task stopped. Status remains orange.",
      });
    }

    

    // =====================================================
    // SOLVE TASK
    // =====================================================
    if (action === "solve") {
      // =================================================
      // ALREADY SOLVED PROTECTION
      // =================================================
      if (pin.status === "green") {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "Task already solved",
        });
      }

      // =================================================
      // UPDATE STATUS
      // =================================================
      pin.status = "green";

      validation.status = "green";

      pin.solvedAt = new Date();

      validation.solvedAt = new Date();

      // =================================================
      // REWARD CALCULATION
      // =================================================
      const actualBounty = pin.bounty || 0;

      const actualXP = pin.xpScore || 0;

      // validator gets full reward
      const validatorBounty = actualBounty;

      const validatorXP = actualXP;

      // =================================================
      // GIVE VALIDATOR REWARD
      // =================================================
      await User.findByIdAndUpdate(
        validation.validatedBy,
        {
          $inc: {
            credits: validatorBounty,
            xp: validatorXP,
          },
        },
        { session },
      );

      // =================================================
      // UPDATE USER STATS
      // =================================================
      await States.findOneAndUpdate(
        {
          userId: validation.validatedBy,
        },
        {
          $inc: {
            totalSolvedPins: 1,
            totalXP: validatorXP,
            totalCredits: validatorBounty,
            totalEarnedBounty: validatorBounty,
            greenPinsSolved: 1,
          },
        },
        {
          upsert: true,
          new: true,
          session,
        },
      );

      // =================================================
      // SAVE REWARD INFO
      // =================================================
      validation.rewardDistributed = true;

      validation.validatorReward = {
        bounty: validatorBounty,
        xp: validatorXP,
      };

      // =================================================
      // SAVE DOCUMENTS
      // =================================================
      await pin.save({ session });

      await validation.save({ session });

      // =================================================
      // FETCH VALIDATOR USER
      // =================================================
      const validatorUser = await User.findById(
        validation.validatedBy,
      ).select("name email profileImage credits xp");

      // =================================================
      // COMMIT TRANSACTION
      // =================================================
      await session.commitTransaction();

      return res.status(200).json({
        success: true,

        message: "Task solved successfully and rewards distributed.",

        taskStatus: "green",

        validator: {
          user: validatorUser,

          reward: {
            bounty: validatorBounty,
            xp: validatorXP,
          },
        },
      });
    }

    // =====================================================
    // INVALID ACTION
    // =====================================================
    await session.abortTransaction();

    return res.status(400).json({
      success: false,
      message: "Invalid action. Use stop or solve",
    });
  } catch (error) {
    await session.abortTransaction();

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};
