import User from '../model/user.model.js';
import PaidPlan from '../model/paidPlans.model.js';


export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // auth middleware se aayega

    const { name, email, nickname } = req.body;

    // 👇 find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 Email uniqueness check
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }
      user.email = email;
    }

    // 🔒 nickname uniqueness check
    if (nickname && nickname !== user.nickname) {
      const nicknamezExists = await User.findOne({ nickname });
      if (nicknameExists) {
        return res.status(400).json({ message: "Nickname Already Taken" });
      }
      user.nickname = nickname;
    }

    // ✏️ Update optional fields
    if (name) user.name = name;

    // 🖼️ Image update (if using multer)
    if (req.file) {
      user.image = req.file.path; // ya cloud URL
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // 👤 Get user
    const user = await User.findById(userId)
    //   .populate("perks")
      .populate("plans"); // optional (all plans)

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ⚡ Active Boost
    const activeBoost = await PaidPlan.findOne({
      userID: userId,
      planType: "boost",
      expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: -1 });

    // 💎 Active Subscription
    const activeSubscription = await PaidPlan.findOne({
      userID: userId,
      planType: "subscription",
      expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: -1 });

    // 🧼 Sensitive fields remove
    const userObj = user.toObject();
    delete userObj.otp;
    delete userObj.otpExpiry;

    return res.status(200).json({
      message: "Profile fetched successfully",

      user: userObj,

      activeBoost: activeBoost
        ? {
            type: activeBoost.boostType,
            expiryDate: activeBoost.expiryDate
          }
        : null,

      activeSubscription: activeSubscription
        ? {
            type: activeSubscription.subscriptionType,
            expiryDate: activeSubscription.expiryDate
          }
        : null
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const changeAccountType = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountType } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { accountType },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Account type updated",
      data: updatedUser
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const activeUser = async (req, res) => {
  try {
    const userId = req.user.id; 
    // OR req.params.id
    // depending on your auth middleware

    const { latitude, longitude } = req.body;

    // Validation
    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        latitude,
        longitude,
        activeAt: new Date(),
      },
      {
        new: true,
      }
    ).select("-otp -otpExpiry");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User activity updated",
      data: updatedUser,
    });

  } catch (error) {
    console.log("activeUser error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};