import { loginUser, registerUser } from "../services/auth.service.js";

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.status(200).json({ success: true, message: "Login successful", data: result });
  } catch (e) {
    next(e);
  }
};

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ success: true, message: "User created", data: user });
  } catch (e) {
    next(e);
  }
};