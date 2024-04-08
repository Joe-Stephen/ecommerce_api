import { Router } from "express";
const adminRouter = Router();
import { io } from "../../index";

//admin functions
import {
  loginAdmin,
  addProduct,
  deleteUser,
  getAllUsers,
  getUserById,
  toggleUserAccess,
  getAllOrders,
  approveOrder,
  updateProduct,
  notifyAllUsers,
  notifySelectedUsers,
  notifyUser,
  updateOrderStatus,
  salesReport,
  assignCronJob,
  mailAutomation,
} from "../admin/adminController";
import { resetPassword } from "../user/userController";

//middlewares
import upload from "../admin/multerMiddleware";
import verifyAdmin from "../admin/adminAuthentication";
import { toggleStatus } from "../notifications/notificationController";

//admin functionalities
adminRouter.post("/notify", verifyAdmin, notifyUser);
adminRouter.post("/login", loginAdmin);
adminRouter.patch("/resetPassword", verifyAdmin, resetPassword);
adminRouter.post("/product", verifyAdmin, upload.array("images"), addProduct);
adminRouter.post(
  "/updateProduct",
  verifyAdmin,
  upload.array("images"),
  updateProduct
);
adminRouter.get("/", verifyAdmin, getAllUsers);
adminRouter.get("/orders", verifyAdmin, getAllOrders);
adminRouter.get("/salesReport", verifyAdmin, salesReport);
adminRouter.post("/orderStatus", verifyAdmin, updateOrderStatus);
adminRouter.patch("/approveOrder", approveOrder);
adminRouter.get("/getUser/:id", verifyAdmin, getUserById);
adminRouter.patch("/toggleStatus", verifyAdmin, toggleUserAccess);
adminRouter.patch("/notification", toggleStatus);
adminRouter.post("/notifyAll", notifyAllUsers);
adminRouter.post("/notifySelected", notifySelectedUsers);
adminRouter.delete("/:id", verifyAdmin, deleteUser);
adminRouter.get("/repeatTask", verifyAdmin, assignCronJob);
adminRouter.get("/testMailAutomation", verifyAdmin, mailAutomation);

export default adminRouter;
