import mongoose from "mongoose";

const megaphoneSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  pinId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
    }
  ],

  startAt: Date,
  expiresAt: Date,
}, { timestamps: true });

export default mongoose.model("Megaphone", megaphoneSchema);