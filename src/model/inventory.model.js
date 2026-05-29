import mongoose from "mongoose";

const activeBoostSchema = {
  activatedAt: Date,
  expiresAt: Date,
};

const inventorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    boosts: {
      radarFlare: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },

      megaphone: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },

      XrayFilter: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },

      goldenCargo: {
        quantity: {
          type: Number,
          default: 0,
        },
        active: activeBoostSchema,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Inventory", inventorySchema);