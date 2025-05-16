import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadFile } from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  //! Get data from frontend
  const { fullname, email, username, password } = req.body;
  console.log(email);

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

  console.log(existedUser);

  if(existedUser){
    throw new ApiError(409, "Username or Email Already Exists")
  }else{
    console.log("now you can register")
  }

  //? validations for avatar(required) and coverImage(optional)

  //! first get them on your local server
  const avatarLocalFilePath = req.files?.avatar[0]?.path;
  const coverImageLocalFilePath = req.files?.coverImage[0]?.path;

  if(!avatarLocalFilePath){
    throw new ApiError(400, "Avatar is required");
  }

  //! upload them on cloudinary
  const avatar = await uploadFile(avatarLocalFilePath);
  const coverImage = await uploadFile(coverImageLocalFilePath);

  if(!avatar){
    throw new ApiError(400, "Could Not Upload Image")
  }

  //! create db entry
  const user = await User.create({
    username: username.toLowerCase(),
    fullname,
    avatar: avatar.url, 
    coverImage: coverImage?.url || "",
    password: password,
    email,
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new ApiError(500, "Something Went Wrong While Regitering The user")
  }

  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered Successfully")
  );

});
