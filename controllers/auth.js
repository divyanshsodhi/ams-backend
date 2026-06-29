const bcrypt = require("bcrypt");
const User = require("../models/user");
const ApiResponse = require("../utilities/apiResponse");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../services/authService");

const registerUser = async (req, res) => {
  try {
    const {
      username, fullName, email, password, country,
      countryCode, phoneNumber, age, role, subjects,
    } = req.body;

    if (!username || !fullName || !email || !password ||
        !country || !countryCode || !phoneNumber || !role) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields.",
      });
    }

    // Validate role
    const allowedRoles = ["admin", "teacher", "student"];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected.",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userData = {
      username: username.toLowerCase(),
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      country,
      countryCode,
      phoneNumber,
      age,
      role,
    };

    // Only teachers and students can have subjects
    if (role !== "admin") {
      userData.subjects = subjects || [];
    }

    const user = await User.create(userData);

    const createdUser = await User.findById(user._id).select("-password -refreshTokens");

    res.status(201).json(
      new ApiResponse("success", "User created successfully", createdUser)
);    

  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email/username and password.",
      });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const device = req.headers["user-agent"] || "unknown";

    user.refreshTokens.push({ token: refreshToken, device });
    await user.save();

    const userData = await User.findById(user._id).select("-password -refreshTokens");

    res.status(200).json(
      new ApiResponse("success", "Login successful", {
        user: userData,
        accessToken,
        refreshToken,
      })
    );

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required.",
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    const storedToken = user.refreshTokens.find((rt) => rt.token === token);

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not recognized. Please login again.",
      });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);
    user.refreshTokens.push({
      token: newRefreshToken,
      device: storedToken.device,
    });
    await user.save();

    res.status(200).json(
      new ApiResponse("success", "Tokens refreshed successfully", {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      })
    );

  } catch (error) {
    console.error("Refresh Token Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required.",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== token);
    await user.save();

    res.status(200).json(
      new ApiResponse("success", "Logged out successfully")
    );

  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password -refreshTokens");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json(
      new ApiResponse("success", "User fetched successfully", user)
    );

  } catch (error) {
    console.error("Get Me Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getMe,
};