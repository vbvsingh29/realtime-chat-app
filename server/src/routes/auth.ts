import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "config";
import { UserModel } from "../models/user.model";

const router = Router();
const jwtSecret = config.get<string>("jwtSecret");

// Register Endpoint
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username or Email already registered" });
    }

    const user = new UserModel({ username, email, password });
    await user.save();

    const token = jwt.sign({ _id: user._id, username: user.username }, jwtSecret, {
      expiresIn: "7d",
    });

    return res.status(201).json({ token, username: user.username });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

// Login Endpoint
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ _id: user._id, username: user.username }, jwtSecret, {
      expiresIn: "7d",
    });

    return res.json({ token, username: user.username });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
});

export default router;
