// Importing necessary modules
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");


    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token not provided",
      });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({
      success: false,
      message: error.message || "Unauthorized",
    });
  }
});
