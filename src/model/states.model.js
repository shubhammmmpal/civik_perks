import mongoose from "mongoose";

const statesSchema = new mongoose.Schema({
userId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    // required: true,
    index: true
  },
  pinsDropped: { type: Number, default: 0 },
  pinsValidated: { type: Number, default: 0 },
  pinsSolved: { type: Number, default: 0 },
  hoursServed: { type: Number, default: 0 },
  friends: { type: Number, default: 0 },
  earnedByFriends: { type: Number, default: 0 },
}  ,
{ timestamps: true });

export default mongoose.model("States", statesSchema);