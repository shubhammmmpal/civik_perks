import Activity from "../model/activity.model.js";


export const createDirectionActivity = async (req, res) => {
  try {
    const {
      userId,
      pinId,
      activityType,
      distance,
      startLocation,
      endLocation,
    } = req.body;

    // Required validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const activity = await Activity.create({
      userId,
      pinId,
      activityType,
      distance,
      startLocation,
      endLocation,
    });

    return res.status(201).json({
      success: true,
      message: "Direction activity created successfully",
      data: activity,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};