import mongoose from "mongoose";

const goldenCargoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    pinId: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Pin",
        },
      ],
      validate: {
        validator: function (value) {
          return value.length <= 3;
        },
        message: "Maximum 3 pins are allowed in Golden Cargo",
      },
    },

    activatedAt: {
      type: Date,
      default: Date.now,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("GoldenCargo", goldenCargoSchema);