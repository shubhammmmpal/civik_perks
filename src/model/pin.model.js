import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String,
    // required: true
  }
}, { _id: false });

const PinSchema = new mongoose.Schema({

  // User answers (dropdown selections)
  questions: [AnswerSchema],

  description: {
    type: String,
    trim: true
  },

  images: [
    {
      type: String // store image URLs (Cloudinary / S3)
    }
  ],

  bounty: {
    type: Number,
    default: 0
  },

  xpScore: {
    type: Number,
    default: 0
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  location: {
    // type: String,
    latitude: {
      type: String,
      required: true
    },
    longitude: {
      type: String,
      required: true
    }
  },

  validatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  validationType: {
    type: String,
    enum: ["auto", "manual", "community"],
    default: "auto"
  },

  beneficiaries: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ]

}, {
  timestamps: true
});

export default mongoose.model("Pin", PinSchema);
