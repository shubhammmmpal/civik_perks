import PaidPlan from "../model/paidPlans.model.js";
import User from "../model/user.model.js";

const BOOST_COST = {
  "X-Ray Filter": 40,
  "Golden Cargo": 80,
  "Radar Flare": 150,
  "Megaphone": 500
};

export const buyBoost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { boostType, quantity = 1 } = req.body;

    // ✅ Validate boost
    if (!BOOST_COST[boostType]) {
      return res.status(400).json({ message: "Invalid boost type" });
    }

    const totalCredits = BOOST_COST[boostType] * quantity;

    const user = await User.findById(userId);

    // ❌ Not enough credits
    if (user.credits < totalCredits) {
      return res.status(400).json({ message: "Insufficient credits" });
    }

    // 💸 Deduct credits
    user.credits -= totalCredits;
    await user.save();

    // ⏳ Expiry calculate
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24 * quantity);

    // 📦 Create plan
    const plan = await PaidPlan.create({
      userID: userId,
      planType: "boost",
      boostType,
      expiryDate
    });

    // 🔗 link to user
    user.plans.push(plan._id);
    await user.save();

    return res.status(201).json({
      message: "Boost activated",
      plan
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};