import { listUsers, updateUser, deleteUser } from "../services/user.service.js";

export const listUsersController = async (req, res, next) => {
  try {
    const { role, branchId } = req.query;
    const data = await listUsers({ role, branchId });
    res.json({ success: true, message: "Users fetched", data });
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

export const deleteUserController = async (req, res, next) => {
  try {
    await deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (e) {
    next(e);
  }
};