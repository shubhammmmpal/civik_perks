import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    activityType: {
      type: String,
      enum: [
        "pin_dropped",
        "pin_validated",
        "pin_solved",
        "hour_served",
        "friend_added",
        "earned_by_friend",
      ],
      default: null,
    },

    pinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pin",
      default: null,
    },

    distance: {
      type: Number,
      default: null,
    },

    pinTitle: {
  type: String,
  default: null,
},

images: [
  {
    type: String,
  },
],

xpEarned: {
  type: Number,
  default: 0,
},

creditsSpent: {
  type: Number,
  default: 0,
},

activityLocation: {
  latitude: Number,
  longitude: Number,
},

    startLocation: {
      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },
    },

    endLocation: {
      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Activity", ActivitySchema);