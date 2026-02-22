import User from "../Models/userModel.js";
import bcrypt from "bcryptjs";
import generateToken from "../config/tokenGenerate.js";
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address} = req.body;
    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role:"guest",
      isActive: true
    });

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
      role: newUser.role
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "User Not Avaliable" });
    if (!user.isActive) return res.status(403).json({ message: "Account deactivated" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
      token,
      role: user.role,
      user
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};


export const createStaff = async (req,res)=>{
  try{
    const { name, email, password, phone, address, department, role }= req.body;
    if(!name || !email || !password || !phone || !address || !department || !role){
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const allowedRoles = ["admin", "manager", "receptionist", "housekeeping", "maintenance"];
    if(!allowedRoles.includes(role)){
      return res.status(400).json({ message: "Invalid role specified" });
    }
    const existingUser = await User.findOne({ email });
    if(existingUser){
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStaff = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      department,
      role,
      isActive: true
    });
    res.status(201).json({
      message: "Staff created successfully",
      staff: newStaff
    });

  }catch(err){
    res.status(500).json({ message: "Staff creation failed", error: err.message });
  }
}