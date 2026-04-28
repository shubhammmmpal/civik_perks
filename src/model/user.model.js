import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  location: { type: String },

  otp: String,
  otpExpiry: Date,
  role: {
  type: String,
  enum: ["USER", "ADMIN"],
  default: "USER"
}
}, { timestamps: true });

export default mongoose.model("User", userSchema);