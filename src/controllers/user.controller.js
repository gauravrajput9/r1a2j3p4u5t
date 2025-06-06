import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { deleteOldImage, uploadFile } from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config();

const generateAccessAndRefreshToken = async (userId) =>{
  try {
    const user = await User.findById(userId)
    const refreshToken = user.generateRefreshToken();
    console.log(refreshToken);
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave : false});

    return {accessToken, refreshToken}
  } catch (error) {
    throw new ApiError(500, "Something went Wrong while generating Access and Refresh Token");
  }
}

export const registerUser = asyncHandler(async (req, res) => {
//   //! Get data from frontend
  const { fullname, email, username, password } = req.body;


  //? Validations
  if (
    [username, email, fullname, password].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //? Check if user already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });



  if(existedUser){
    throw new ApiError(409, "Username or Email Already Exists")
  }

  //? validations for avatar(required) and coverImage(optional)
  if (!req.files || !req.files.avatar || !req.files.avatar[0]) {
    throw new ApiError(400, "Avatar file is required");
  }

  //! first get them on your local server
  const avatarLocalFilePath = req.files.avatar[0].path;
  const coverImageLocalFilePath = req.files.coverImage?.[0]?.path;

  //! upload them on cloudinary
  const avatar = await uploadFile(avatarLocalFilePath);
  const coverImage = coverImageLocalFilePath ? await uploadFile(coverImageLocalFilePath) : null;


  if(!avatar || !avatar.url){
    throw new ApiError(400, "Could Not Upload Avatar Image")
  }



 try {
  if (fs.existsSync(avatarLocalFilePath)) {
    fs.unlinkSync(avatarLocalFilePath);
  }

  if (coverImageLocalFilePath && fs.existsSync(coverImageLocalFilePath)) {
    fs.unlinkSync(coverImageLocalFilePath);
  }
} catch (err) {
  console.error("Error deleting files:", err.message);
}



  //! create db entry
  const user = await User.create({
    username: username.toLowerCase(),
    fullname,
    avatar: avatar.url, 
    avatarPublicId: avatar.public_id,
    coverImage: coverImage?.url || "",
    coverImagePublicId: coverImage?.public_id || "",
    password: password,
    email,
    refreshToken: "", // Initialize with empty string, will be updated when user logs in
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500, "Something Went Wrong While Registering The User")
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered Successfully")
  );
});


export const loginUser = async (req, res)=>{
  // get data from body
  // username or email based login
  // find the user 
  // password check
  // cookie(refresh  and access token)
  const {username, email, password } = req.body;
try {
  
    //? check username or email
    if(!username && !email){
      throw new ApiError(400, "at least one is required(username or email");
    }
  
    //! find the username or email in the database
    const user = await User.findOne({
      $or : [{email}, {username}]
    })
  
    //! check whether the user is registered or not
    if(!user){
      throw new ApiError(404, "you are not registered")
    }
  
    //! check for password
    const isPasswordValid = await user.isPasswordCorrect(password)
  
    if(!isPasswordValid){
      throw new ApiError(401, "invalid user credentials");
    }
  
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
  
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
  
    //? create cookie
   const options = {
    httpOnly: true,
    secure: true, // ✅ set false if you're testing on localhost (no HTTPS)
    // sameSite: "Lax", // Default, works well on localhost
  };

  
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
} catch (error) {
   console.log(error)
}


}

//! to create a logout user function you need to create a new middleware(auth.middleware.js)
export const logoutUser = asyncHandler(async (req, res) =>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set : {refreshToken : undefined}
    },
    {
      new : true,
    }
  )
  const options = {
    httpOnly: true,
    secure : true,
  }
  return res
  .status(200)
  .clearCookie("refreshToken", options)
  .clearCookie("accessToken", options)
  .json(
    new ApiResponse(200, {}, "User Logged Out")
  )
})

export const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    // Get token from cookies or body
    const token = req.cookies.refreshToken || req.body.refreshToken;

    if (!token) {
      throw new ApiError(401, "Invalid Token");
    }

    // Verify refresh token using REFRESH_TOKEN_SECRET
    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Fetch user
    const user = await User.findById(decodedToken?._id);

    if (!user || user.refreshToken !== token) {
      throw new ApiError(401, "Unauthorized Access");
    }

    // Generate new tokens
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    // Send tokens via cookies and JSON
    res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    console.error(error?.message || "Cannot refresh token");
    res.status(401).json(new ApiError(401, "Token refresh failed"));
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) =>{
  //? get the user from the res.user
  const {oldPassword, newPassword} = req.body;
  const user = await User.findById(req.user?._id);

  if(!user){
    throw new ApiError(400, "User not Found")
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if(!isPasswordValid){
    throw new ApiError(400, "Invalid Old Password")
  }

  user.password = newPassword;
  await user.save({
    validateBeforeSave : false
  })

  return res.status(200)
  .json(
    new ApiResponse(200,{}, "Password Updated Successfully")
  )

})

export const getCurrentUser = asyncHandler(async (req, res) =>{
  console.log(req.user)
  return res.status(200)
  .json(
    req.user
  )
})

export const updateUserProfile = asyncHandler(async(req, res) =>{
  //? get data from the user(body)
  const {username, fullname, email} = req.body;

  //! check for updating fields
  if(!username || !email || !fullname){
    throw new ApiError(400, "All Fields Are Required")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        username, fullname, email
      }
    },
    {
      new : true
    }
  ).select("-password");

  return res.status(200)
  .json(
    new ApiResponse(200,user,"Profile Updated SuccessFully")
  )

})


export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file not found");
  }

  // Get current user's avatarPublicId
  const userBeforeUpdate = await User.findById(req.user._id).select("avatarPublicId");

  if (userBeforeUpdate?.avatarPublicId) {
    const deleted = await deleteOldImage(userBeforeUpdate.avatarPublicId);
  }

  // Upload new avatar
  const avatar = await uploadFile(avatarLocalPath);

  if (!avatar?.secure_url || !avatar?.public_id) {
    throw new ApiError(400, "Cloudinary upload failed (update Avatar)");
  }

  // Delete local temp file
  try {
    if (fs.existsSync(avatarLocalPath)) {
      fs.unlinkSync(avatarLocalPath);
    }
  } catch (err) {
    console.error("Error deleting local avatar file:", err.message);
  }

  // Update user document
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: avatar.secure_url,
        avatarPublicId: avatar.public_id,
      },
    },
    { new: true }
  ).select("-password");

  return res.status(200).json(
    new ApiResponse(200, updatedUser, "Avatar updated successfully")
  );
});


export const updateCoverImage = asyncHandler(async(req, res) =>{

  const coverImageLocalPath = req.file?.path;

  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover Image file not found")
  }

  //! delete previous cover image
  const coverImageBeforeUpdate = await User.findById(req.user?._id).select("coverImagePublicId")

  if (coverImageBeforeUpdate?.coverImagePublicId) {
    const deleted = await deleteOldImage(coverImageBeforeUpdate?.coverImagePublicId);
  }

  //! update the new coverImage
  const coverImage = await uploadFile(coverImageLocalPath);

  if(!coverImage.url){
    throw new ApiError(400, "cover image not found(update coverImage)")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set : {
        coverImage : coverImage.url,
        coverImagePublicId: coverImage.public_id
      }
    },
    {
      new : true
    }
  ).select("-password")

  return res.status(200)
  .json(
    new ApiResponse(200, user, "Cover Image updated SuccessFully")
  )
})

export const getChannelDetails = asyncHandler(async (req, res) =>{
  const {username} = req.params;

  if(!username?.trim()){
    throw new ApiError(400, "Username not Found")
  }

  const channelDetails = await User.aggregate([
    {
      $match : {
        username : username?.toLowerCase()
      }
    },
    {
      $lookup : {
        from : "subscriptions",
        localField : "_id",
        foreignField: "channel",
        as : "subscribers"
      }
    },
    {
      $lookup : {
        from : "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as : "channelSubscribedTo"
      }
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        channelsSubscribedToCount: { $size: "$channelSubscribedTo" },
        isSubscribed: {
          $in: [
            mongoose.Types.ObjectId(req.user._id),
            {
              $map: {
                input: "$subscribers",
                as: "s",
                in: "$$s.subscriber"
              }
            }
          ]
        }
      }
    },
    {
      $project: {
        username : 1,
        fullname : 1,
        email: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1
      }
    }
  ])

  if (!channelDetails?.length) {
    throw new ApiError(400, "Channel does not Exists")
  }

  return res.status(200)
  .json(
    new ApiResponse(200, channelDetails[0], "Channel Details Fetched Successfully")
  )
})

export const watchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",  // Assuming this field exists in the User schema
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    fullname: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: { $first: "$owner" }
            }
          }
        ]
      }
    }
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      user[0]?.watchHistory || [],
      "Watch History Fetched Successfully"
    )
  );
});
