import PaidPlan from "../model/paidPlans.model.js";
import User from "../model/user.model.js";
import Inventory from "../model/inventory.model.js";
import { BOOSTS } from "../helper/constants.js";

// const BOOST_COST = {
//   "X-Ray Filter": 40,
//   "Golden Cargo": 80,
//   "Radar Flare": 150,
//   "Megaphone": 500
// };

// export const buyBoost = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { boostType, quantity = 1 } = req.body;

//     // ✅ Validate boost
//     if (!BOOST_COST[boostType]) {
//       return res.status(400).json({ message: "Invalid boost type" });
//     }

//     const totalCredits = BOOST_COST[boostType] * quantity;

//     const user = await User.findById(userId);

//     // ❌ Not enough credits
//     if (user.credits < totalCredits) {
//       return res.status(400).json({ message: "Insufficient credits" });
//     }

//     // 💸 Deduct credits
//     user.credits -= totalCredits;
//     await user.save();

//     // ⏳ Expiry calculate
//     const expiryDate = new Date();
//     expiryDate.setHours(expiryDate.getHours() + 24 * quantity);

//     // 📦 Create plan
//     const plan = await PaidPlan.create({
//       userID: userId,
//       planType: "boost",
//       boostType,
//       expiryDate
//     });

//     // 🔗 link to user
//     user.plans.push(plan._id);
//     await user.save();

//     return res.status(201).json({
//       message: "Boost activated",
//       plan
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const purchaseBoost = async (req, res) => {
  try {

    const userId = req.user.id;
    const { boostType } = req.body;

    // Validate boost
    if (!BOOSTS[boostType]) {
      return res.status(400).json({
        success: false,
        message: "Invalid boost type"
      });
    }

    const boost = BOOSTS[boostType];

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Check credits
    if (user.credits < boost.price) {
      return res.status(400).json({
        success: false,
        message: "Insufficient credits"
      });
    }

    // Deduct credits
    user.credits -= boost.price;
    await user.save();

    // Find/Create inventory
    // Purchase boost

    let inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      inventory = new Inventory({ userId });
    }

    inventory.boosts[boostType].quantity += 1;

    await inventory.save();

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() + boost.durationHours * 60 * 60 * 1000
    );

    // Activate boost
    inventory[boostType] = {
      activatedAt: now,
      expiresAt,
    };

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: `${boostType} activated successfully`,
      data: {
        boostType,
        activatedAt: now,
        expiresAt,
        remainingCredits: user.credits
      }
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};



export const useInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boostType } = req.body;

    if (!BOOSTS[boostType]) {
      return res.status(400).json({
        success: false,
        message: "Invalid boost type",
      });
    }

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    const boostItem = inventory.boosts[boostType];

    if (boostItem.quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "No boost available",
      });
    }

    // Check if already active
    if (
      boostItem.active?.expiresAt &&
      boostItem.active.expiresAt > new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Boost already active",
      });
    }

    const now = new Date();

    const expiresAt = new Date(
      now.getTime() +
      BOOSTS[boostType].durationHours * 60 * 60 * 1000
    );

    boostItem.quantity -= 1;

    boostItem.active = {
      activatedAt: now,
      expiresAt,
    };

    await inventory.save();

    return res.status(200).json({
      success: true,
      message: `${boostType} activated`,
      data: {
        activatedAt: now,
        expiresAt,
        remainingQuantity: boostItem.quantity,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getAllInventories = async (req, res) => {
  try {
    const inventories = await Inventory.find()
      .populate("userId", "name email");

    return res.status(200).json({
      success: true,
      count: inventories.length,
      data: inventories,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getInventoryById = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const inventory = await Inventory.findById(inventoryId)
      .populate("userId", "name email");

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getInventoryByUserId = async (req, res) => {
  try {
    const { userId } = req.user._id;

    const inventory = await Inventory.findOne({ userId })
      .populate("userId", "name email");

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const getMyInventory = async (req, res) => {
  try {
    const userId = req.user.id;

    const inventory = await Inventory.findOne({ userId });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const deleteInventory = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    const inventory = await Inventory.findById(inventoryId);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    await Inventory.findByIdAndDelete(inventoryId);

    return res.status(200).json({
      success: true,
      message: "Inventory deleted successfully",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


