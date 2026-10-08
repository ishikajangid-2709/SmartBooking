const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

// ==========================================
// Register User (POST /api/auth/register)
// ==========================================
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Test Case 1: Check if email already registered -> 409 Conflict
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Determine role (default to USER, allow ADMIN if requested)
    let assignedRole = "USER";
    if (role && (role.toUpperCase() === "ADMIN" || role.toUpperCase() === "USER")) {
      assignedRole = role.toUpperCase();
    }

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: assignedRole,
      status: "ACTIVE",
    });

    // Record audit log
    await AuditLog.create({
      userId: newUser._id,
      action: "USER_REGISTERED",
      description: `New user registered: ${newUser.name} (${newUser.email}) with role ${assignedRole}`,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Login User (POST /api/auth/login)
// ==========================================
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Test Case 2: Invalid Login -> 401 Unauthorized
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.status === "BLOCKED") {
      return res.status(403).json({
        success: false,
        message: "Account has been suspended. Please contact support.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const role = (user.role || "USER").toUpperCase();

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        role,
        name: user.name,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Record audit log
    await AuditLog.create({
      userId: user._id,
      action: "USER_LOGIN",
      description: `User login: ${user.name} (${user.email})`,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// Get Current User Profile (GET /api/auth/me)
// ==========================================
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: (user.role || "USER").toUpperCase(),
        status: user.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};