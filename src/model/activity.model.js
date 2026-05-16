import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema({
  

}, { timestamps: true });

export default mongoose.model("Activity", ActivitySchema);