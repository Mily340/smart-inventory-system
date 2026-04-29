import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword, // ✅ ADD
} from "../services/user.service.js";

export const listUsersController = async (req, res, next) => {
  try {
    const { role, branchId } = req.query;
    const data = await listUsers({ role, branchId });
    res.json({ success: true, message: "Users fetched", data });
  } catch (e) {
    next(e);
  }
};

export const createUserController = async (req, res, next) => {
  try {
    const data = await createUser(req.body);
    res.status(201).json({ success: true, message: "User created", data });
  } catch (e) {
    next(e);
  }
};

export const updateUserController = async (req, res, next) => {
  try {
    const data = await updateUser(req.params.id, req.body);
    res.json({ success: true, message: "User updated", data });
  } catch (e) {
    next(e);
  }
};

// ✅ NEW
export const resetUserPasswordController = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const data = await resetUserPassword(req.params.id, { newPassword }, req.user);
    res.json({ success: true, message: "Password reset", data });
  } catch (e) {
    next(e);
  }
};

export const deleteUserController = async (req, res, next) => {
  try {
    await deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (e) {
    next(e);
  }
};