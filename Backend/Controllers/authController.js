import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import generateToken from "../config/tokenGenerate.js";

// ✅ GUEST ONLY REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      address: address.trim(),
      role: "guest",
      isActive: true,
    });

    // ✅ remove password from response
    const userSafe = await User.findById(newUser._id).select("-password");

    return res.status(201).json({
      message: "User registered successfully",
      user: userSafe,
      role: userSafe.role,
    });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// ✅ ALL ROLES LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(401).json({ message: "User not available" });
    if (!user.isActive) return res.status(403).json({ message: "Account deactivated" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    const userSafe = await User.findById(user._id).select("-password");

    return res.json({
      token,
      role: userSafe.role,
      user: userSafe,
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// ✅ ADMIN ONLY CREATE STAFF
export const createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, address, department, role } = req.body;

    if (!name || !email || !password || !phone || !address || !department || !role) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    // Defense-in-depth (route already protects)
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Only admin can create staff" });
    }

    const allowedRoles = ["admin", "manager", "receptionist", "housekeeping", "maintenance"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: phone.trim(),
      address: address.trim(),
      department: department.trim(),
      role,
      isActive: true,
    });

    const staffSafe = await User.findById(newStaff._id).select("-password");

    return res.status(201).json({
      message: "Staff created successfully",
      staff: staffSafe,
    });
  } catch (err) {
    return res.status(500).json({ message: "Staff creation failed", error: err.message });
  }
};