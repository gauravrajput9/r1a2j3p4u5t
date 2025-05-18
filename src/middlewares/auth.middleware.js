// Importing necessary modules
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Middleware to verify JWT and attach user to req object
export const verifyJWT = asyncHandler(async (req, res, next) => {
  // Try getting token from cookies or Authorization header
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized Access");
  }

  // Verify token
  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  // Fetch user by ID from decoded token, exclude sensitive fields
  const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "Access token is Not Valid");
  }

  // Attach user to request object
  req.user = user;
  next();
});
