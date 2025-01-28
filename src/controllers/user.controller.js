import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
//register user
const registerUser = asyncHandler(async (req, res) => {
  //get user data from frontend
  const { fullname, email, password, username } = req.body;
  console.log("email: " + email, "password: " + password);
  //validation
  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //check if user is already registered
  const existedUser = User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(400, "Email or username already exists");
  }
  //check for images and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload an avatar");
  }
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  //upload images to cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Failed to upload avatar");
  }
  //create user object
  const user = await User.create({
    fullname,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
  });
  //remove password and refresh token from user fields
  const userCreated = User.findById(user._id).select("-password -refreshToken");
  // check for user creation
  if (!userCreated) {
    throw new ApiError(500, "Failed to create user");
  }
  // return reponse
  res.status(201).json(new ApiResponse(200, userCreated, "Uer Created successfully"));
});

export { registerUser };
