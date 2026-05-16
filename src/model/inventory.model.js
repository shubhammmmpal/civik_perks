import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  radarFlare: {type: Number, default: 0},
  megaphone: {type: Number, default: 0},
  XrayFilter: {type: Number, default: 0},
  goldenCargo  : {type: Number, default: 0},

}, { timestamps: true });

export default mongoose.model("Inventory", inventorySchema);