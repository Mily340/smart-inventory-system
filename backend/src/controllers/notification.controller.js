import { listNotifications, markAsRead } from "../services/notification.service.js";

export const getNotifications = async (req, res, next) => {
  try {
    const data = await listNotifications(req.user);
    res.json({ success: true, message: "Notifications fetched", data });
  } catch (e) {
    next(e);
  }
};

export const markReadController = async (req, res, next) => {
  try {
    const data = await markAsRead(req.params.id, req.user);
    res.json({ success: true, message: "Notification marked as read", data });
  } catch (e) {
    next(e);
  }
};