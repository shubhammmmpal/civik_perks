import express from "express";
import { 
    // buyBoost, 
    
    purchaseBoost,useInventory, getAllInventories,getInventoryById,getInventoryByUserId, deleteInventory,getMyInventory } from "../controller/paidPlain.controller.js";
import {protect,authorizeRoles} from "../middleware/auth.middlewere.js";
import {upload} from "../config/multer.js";

const router = express.Router();

// router.post("/buy-boost", protect, buyBoost);
router.post("/purchase-boost", protect, purchaseBoost);
router.post("/use-inventory", protect, useInventory);
router.get("/inventories",  getAllInventories);
router.get(
  "/inventories/user",
  protect,
  getMyInventory
);
router.get(
  "/inventories/:inventoryId",
  
  getInventoryById
);



router.delete(
  "/inventories/:inventoryId",
  deleteInventory
);

export default router;