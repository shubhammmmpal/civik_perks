import mongoose from "mongoose";

const FineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      trim: true,
    },

   
  },
  { timestamps: true }
);

export default mongoose.model("Fine", FineSchema);