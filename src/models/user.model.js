import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define schema
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      indexedDB: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Please enter a valid email address",
      },
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      match: /^[a-zA-Z\s]+$/,
      message: "Please enter a valid name (letters and spaces only)",
      indexedDB: true,
    },
    avatar: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: [Schema.Types.ObjectId],
        ref: "Video",
      },
    ], // Array of video IDs
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Do not return this field in queries
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// password encryption
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.password.isModified("password")) return next();
  this.password = bcrypt.hash(this.password, 10);
});

//password validation
userSchema.methods.isValidPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

//generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

//generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  )
};

// Create model and export
const User = mongoose.model("User", userSchema);
