import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadFile } from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import fs from "fs";

const generateAccessAndRefreshToken = async (userId) =>{
  try {
    const user = await User.findById(userId)
    const refreshToken = user.generateRefreshToken();
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
  }else{
    console.log("now you can register")
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
    coverImage: coverImage?.url || "",
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


export const loginUser = asyncHandler(async (req, res)=>{
  // get data from body
  // username or email based login
  // find the user 
  // password check
  // cookie(refresh  and access token)

  const {username, email, password } = req.body;


  //? check username or email
  if(!username && !email){
    throw new ApiError(400, "atleast one is required(username or email)")
  }

  //! find the username or emaill in the database
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

  const {accessToken, refreshToken} = generateAccessAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  //? create cookie
  const options = {
    httpOnly: true,
    secure : true
  }

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


})

//! to create a logout user funcrion you need to create a new middleware
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
