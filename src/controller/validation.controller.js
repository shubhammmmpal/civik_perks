// validation.controller.js

import Validation from "../model/validation.model.js";
import Pin from "../model/pin.model.js";
import User from "../model/user.model.js"; // assuming you have user model
import mongoose from "mongoose";
import { calculateDistanceInMeters } from "../helper/helper.js";    
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
    
    session.startTransaction();
    console.log('snsdldlslk')
    const { pinId } = req.params;
    const userId = req.user.id;

    console.log(userId)

    // -----------------------------
    // CHECK PIN
    // -----------------------------
    const pin = await Pin.findById(pinId).session(session);

    if (!pin) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Pin not found",
      });
    }

    // ===============================
    // APPLY LOCATION VALIDATION HERE
    // ===============================

    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
    return res.status(400).json({
        success: false,
        message: "Current location required",
    });
    }

    // pin coordinates
    const pinLongitude = pin.location.coordinates[0];
    const pinLatitude = pin.location.coordinates[1];

    // distance calculation
    const distance = calculateDistanceInMeters(
    latitude,
    longitude,
    pinLatitude,
    pinLongitude,
    );

    // check 10 meters
    if (distance > 10) {
    return res.status(403).json({
        success: false,
        message:
        "You must be within 10 meters of the pin location",
        distance: `${distance.toFixed(2)} meters`,
    });
    }

    // ===============================
    // AFTER THAT CONTINUE VALIDATION
    // ===============================

    // Prevent creator validating own pin
    if (pin.createdBy.toString() === userId) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "You cannot validate your own pin",
      });
    }

    // -----------------------------
    // FIND VALIDATION
    // -----------------------------
    let validation = await Validation.findOne({
      pinID: pinId,
    }).session(session);

    // =========================================================
    // FIRST VALIDATION
    // =========================================================
    if (!validation) {
      const validation = new Validation({
        pinID: pinId,
        validatedBy: userId,
        status: "orange",
        });

        await validation.save({ session });

      // update pin
      pin.validatedBy = userId;
      pin.status = "orange";

      await pin.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Pin validated successfully",
        data: validation,
      });
    }

    // =========================================================
    // CHECK SAME USER
    // =========================================================
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

    // =========================================================
    // CHECK 24 HOURS WINDOW
    // =========================================================
    const createdAt = new Date(validation.createdAt);
    const now = new Date();

    const diffHours =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (diffHours > 24) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Validation window expired",
      });
    }

    // =========================================================
    // CHECK BENEFICIARY ALREADY EXISTS
    // =========================================================
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

    // =========================================================
    // ADD BENEFICIARY
    // =========================================================
    validation.beneficiaries.push(userId);

    // keep orange until solved
    validation.status = "orange";

    await validation.save({ session });

    pin.beneficiaries.push(userId);

    await pin.save({ session });

    // =========================================================
    // REWARD DISTRIBUTION
    // =========================================================

    const actualBounty = pin.bounty || 0;
    const actualXP = pin.xpScore || 0;

    // first validator -> 100%
    const firstValidatorReward = actualBounty;
    const firstValidatorXP = actualXP;

    // beneficiary -> 50%
    // const beneficiaryReward = actualBounty * 0.5;
    // const beneficiaryXP = actualXP * 0.5;

    // first validator
    await User.findByIdAndUpdate(
      validation.validatedBy,
      {
        $inc: {
          wallet: firstValidatorReward,
          xp: firstValidatorXP,
        },
      },
      { session },
    );

    // beneficiary
    // await User.findByIdAndUpdate(
    //   userId,
    //   {
    //     $inc: {
    //       wallet: beneficiaryReward,
    //       xp: beneficiaryXP,
    //     },
    //   },
    //   { session },
    // );

    // ==========================================
// FETCH VALIDATOR INFO
// ==========================================

    const validatorUser = await User.findById(
    validation.validatedBy
    ).select(
    "name email profileImage xp wallet"
    );

    // ==========================================
    // COMMIT TRANSACTION
    // ==========================================

    await session.commitTransaction();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
    success: true,

    message:
        "You have successfully joined this validation task. Once the validator completes the task, your XP and bounty rewards will be credited to your account.",

    validator: validatorUser,

    taskStatus: validation.status,

    rewardInfo: {
        beneficiaryReward: {
        bounty: actualBounty * 0.5,
        xp: actualXP * 0.5,
        },

        note:
        "Rewards will be credited after successful task completion.",
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
    session.startTransaction();

    const { pinId } = req.params;
    const { action } = req.body;

    const userId = req.user.id;

    // =====================================================
    // FIND PIN
    // =====================================================
    const pin = await Pin.findById(pinId).session(
      session,
    );

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
    const validation =
      await Validation.findOne({
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
    if (
      validation.validatedBy.toString() !==
      userId
    ) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message:
          "Only validator can complete this task",
      });
    }

    // =====================================================
    // STOP TASK
    // =====================================================
    if (action === "stop") {
      pin.status = "orange";

      validation.status = "orange";

      validation.stoppedAt = new Date();

      pin.stoppedAt = new Date();

      await pin.save({ session });

      await validation.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message:
          "Task stopped. Status remains orange.",
      });
    }

    // =====================================================
    // SOLVE TASK
    // =====================================================
    if (action === "solve") {

      // already solved protection
      if (pin.status === "green") {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "Task already solved",
        });
      }

      // ==============================================
      // UPDATE STATUS
      // ==============================================
      pin.status = "green";

      validation.status = "green";

      pin.solvedAt = new Date();

      validation.solvedAt = new Date();

      // ==============================================
      // REWARD CALCULATION
      // ==============================================
      const actualBounty = pin.bounty || 0;

      const actualXP = pin.xpScore || 0;

      // validator gets 100%
      const validatorBounty = actualBounty;

      const validatorXP = actualXP;

      // beneficiaries get 50%
      const beneficiaryBounty =
        actualBounty * 0.5;

      const beneficiaryXP = actualXP * 0.5;

      // ==============================================
      // GIVE VALIDATOR REWARD
      // ==============================================
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

      // ==============================================
      // GIVE BENEFICIARY REWARDS
      // ==============================================
      if (
        validation.beneficiaries.length > 0
      ) {
        await User.updateMany(
          {
            _id: {
              $in: validation.beneficiaries,
            },
          },
          {
            $inc: {
              credits: beneficiaryBounty,
              xp: beneficiaryXP,
            },
          },
          { session },
        );
      }

      // ==============================================
      // SAVE REWARD INFO
      // ==============================================
      validation.rewardDistributed = true;

      validation.validatorReward = {
        bounty: validatorBounty,
        xp: validatorXP,
      };

      validation.beneficiaryReward = {
        bounty: beneficiaryBounty,
        xp: beneficiaryXP,
      };

      // ==============================================
      // SAVE
      // ==============================================
      await pin.save({ session });

      await validation.save({ session });

      // ==============================================
      // FETCH USERS FOR RESPONSE
      // ==============================================
      const validatorUser =
        await User.findById(
          validation.validatedBy,
        ).select(
          "name email profileImage credits xp",
        );

      const beneficiaryUsers =
        await User.find({
          _id: {
            $in: validation.beneficiaries,
          },
        }).select(
          "name email profileImage credits xp",
        );

      // ==============================================
      // COMMIT
      // ==============================================
      await session.commitTransaction();

      return res.status(200).json({
        success: true,

        message:
          "Task solved successfully and rewards distributed.",

        taskStatus: "green",

        validator: {
          user: validatorUser,

          reward: {
            bounty: validatorBounty,
            xp: validatorXP,
          },
        },

        beneficiaries: {
          users: beneficiaryUsers,

          rewardPerUser: {
            bounty: beneficiaryBounty,
            xp: beneficiaryXP,
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
      message:
        "Invalid action. Use stop or solve",
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