import User from "../model/user.model.js";
import { sendEmail } from "../config/nodemailer.js";
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role  },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};


const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

export const loginWithOTP = async (req, res) => {
  try {
    const { email, location } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const otp = generateOTP();

    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({ email, location });
    }

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendEmail(email, otp);

    res.json({
      success: true,
      data:[{
        email,
        "otp":otp
      }
      ],
      message: "OTP sent to email"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // OTP clear
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // ✅ Generate JWT Token
    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        location: user.location
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};