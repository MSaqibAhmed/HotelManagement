import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import generateToken from "../config/tokenGenerate.js";

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

export const createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, address, department, role } = req.body;

    if (!name || !email || !password || !phone || !address || !department || !role) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

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


export const getStaff = async (req, res) => {
  try {
    // guest ko chhor kar baaki sab staff
    const staff = await User.find({ role: { $ne: "guest" } })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ count: staff.length, staff });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch staff",
      error: err.message,
    });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, department, role } = req.body;

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    staff.name = name || staff.name;
    staff.phone = phone || staff.phone;
    staff.department = department || staff.department;
    staff.role = role || staff.role;

    await staff.save();

    res.json({
      message: "Staff updated successfully",
      staff,
    });

  } catch (error) {
    res.status(500).json({
      message: "Update failed",
      error: error.message,
    });
  }
};


export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    await staff.deleteOne();

    res.json({ message: "Staff deleted successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Delete failed",
      error: error.message,
    });
  }
};

//Active or Deactive staff by admin
export const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const staff = await User.findById(id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    staff.isActive = isActive;
    await staff.save();

    res.json({
      message: "Staff status updated",
      staff,
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to update status",
      error: error.message,
    });
  }
};