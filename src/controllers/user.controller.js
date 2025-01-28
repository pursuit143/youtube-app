import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";

//function for access and refresh tokens
const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId).select("-password");
    const refreshToken = user.accessTokenAndRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refreshToken = refreshToken;
    await user.save({ validationBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "Failed to generate access and refresh tokens");
  }
};
//register user
const registerUser = asyncHandler(async (req, res) => {
  //get user data from frontend
  const { fullname, email, password, username } = req.body;
  //validation
  if (
    [fullname, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //check if user is already registered
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    const avatarLocalPath = req.files?.avatar[0]?.path;
    if (avatarLocalPath) {
      //delete the temporary avatar file
      await fs.promises.unlink(avatarLocalPath);
    }
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if (coverImageLocalPath) {
      //delete the temporary cover image file
      await fs.promises.unlink(coverImageLocalPath);
    }
    throw new ApiError(400, "Email or username already exists");
  } else {
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
    //upload cover image to cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
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
    const userCreated = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    // check for user creation
    if (!userCreated) {
      throw new ApiError(500, "Failed to create user");
    }
    // return reponse
    res
      .status(201)
      .json(new ApiResponse(200, userCreated, "Uer Created successfully"));
  }
});

//login user
const loginUser = asyncHandler(async (req, res) => {
  //get user data from frontend
  const { email, password, username } = req.body;
  //validation
  if (!email || !password || !username) {
    throw new ApiError(400, "All fields are required");
  }
  //find the user using username or email
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }
  //password check
  const isPasswordValid = await user.isValidPassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }
  //access and refresh tokens
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  //remove password and refresh token from user fields
  const userLogged = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //send cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  //send response
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: userLogged, accessToken, refreshToken },
        "Logged in successfully"
      )
    )
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options);
});

//logout user
const logoutUser = asyncHandler(async (req, res) => {
  //remove refresh token from user
  const userId = req.user._id;
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        refreshToken: null,
      },
    },
    {
      new: true,
    }
  );

  //set options
  const options = {
    httpOnly: true,
    secure: true,
    expires: new Date(0), //delete cookie
  }
  //remove cookies
  res.clearCookie("refreshToken", options);
  res.clearCookie("accessToken", options);
  //send response
  res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
