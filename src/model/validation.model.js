

import mongoose from "mongoose";

const ValidationSchema = new mongoose.Schema(
  {
    // =========================================
    // PIN REFERENCE
    // =========================================
    pinID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
      required: true,
      index: true,
    },

    // =========================================
    // MAIN VALIDATOR
    // =========================================
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // =========================================
    // BENEFICIARIES
    // =========================================
    beneficiaries: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // =========================================
    // VALIDATION STATUS
    // =========================================
    status: {
      type: String,
      enum: ["red", "orange", "green"],
      default: "orange",
    },

    // =========================================
    // VALIDATION WINDOW
    // =========================================
    expiresAt: {
      type: Date,
    },

    // =========================================
    // TASK EVENTS
    // =========================================
    solvedAt: {
      type: Date,
      default: null,
    },

    stoppedAt: {
      type: Date,
      default: null,
    },

    // =========================================
    // REWARD DISTRIBUTION
    // =========================================
    rewardDistributed: {
      type: Boolean,
      default: false,
    },

    validatorReward: {
      bounty: {
        type: Number,
        default: 0,
      },

      xp: {
        type: Number,
        default: 0,
      },
    },

    beneficiaryReward: {
      bounty: {
        type: Number,
        default: 0,
      },

      xp: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

// =========================================
// AUTO SET 24H EXPIRY
// =========================================
// ValidationSchema.pre("save", function (next) {
//   if (!this.expiresAt) {
//     this.expiresAt = new Date(
//       Date.now() + 24 * 60 * 60 * 1000,
//     );
//   }

//   next();
// });

ValidationSchema.pre("save", function () {
  if (!this.expiresAt) {
    this.expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );
  }
});

export default mongoose.model(
  "Validation",
  ValidationSchema,
);