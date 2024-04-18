import { Router } from "express";
const adminRouter = Router();

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
  productsLessThan,
} from "../admin/adminController";
import { resetPassword } from "../user/userController";

//middlewares
import upload from "../admin/multerMiddleware";
import verifyAdmin from "../admin/adminAuthentication";
import { toggleStatus } from "../notifications/notificationController";

//admin functionalities
adminRouter.post(
  "/notify",
  verifyAdmin,
  /* #swagger.tags = ['Admin - Notification Service'] */ notifyUser
);
adminRouter.post("/admin-login", /* #swagger.tags = ['Admin */ loginAdmin);
adminRouter.patch(
  "/resetPassword",
  verifyAdmin,
  /* #swagger.tags = ['Admin */ resetPassword
);
adminRouter.post(
  "/product",
  verifyAdmin,
  /* #swagger.tags = ['Admin - Product Management */ upload.array("images"),
  addProduct
);
adminRouter.get(
  "/productLessThan",
  /* #swagger.tags = ['User - Order'] */ verifyAdmin,
  productsLessThan
);
adminRouter.post(
  "/updateProduct",
  verifyAdmin /* #swagger.tags = ['Admin - Product Management */,
  upload.array("images"),
  updateProduct
);
adminRouter.get(
  "/",
  verifyAdmin,
  /* #swagger.tags = ['Admin - User Management'] */ getAllUsers
);
adminRouter.get(
  "/orders",
  verifyAdmin,
  /* #swagger.tags = ['Admin - Order Management'] */ getAllOrders
);
adminRouter.get(
  "/salesReport",
  verifyAdmin,
  /* #swagger.tags = ['Admin - Report'] */ salesReport
);
adminRouter.post(
  "/orderStatus",
  verifyAdmin,
  /* #swagger.tags = ['Admin - Order Management'] */ updateOrderStatus
);
adminRouter.patch(
  "/approveOrder",
  /* #swagger.tags = ['Admin - Order Management'] */ approveOrder
);
adminRouter.get(
  "/getUser/:id",
  verifyAdmin,
  /* #swagger.tags = ['Admin - User Management'] */ getUserById
);
adminRouter.patch(
  "/toggleStatus",
  verifyAdmin,
  /* #swagger.tags = ['Admin - User Management'] */ toggleUserAccess
);
adminRouter.patch(
  "/notification",
  /* #swagger.tags = ['Admin - User Management'] */ toggleStatus
);
adminRouter.post(
  "/notifyAll",
  /* #swagger.tags = ['Admin - Notification Service'] */ notifyAllUsers
);
adminRouter.post(
  "/notifySelected",
  /* #swagger.tags = ['Admin - Notification Service'] */ notifySelectedUsers
);
adminRouter.delete(
  "/:id",
  verifyAdmin,
  /* #swagger.tags = ['Admin - User Management'] */ deleteUser
);
adminRouter.get(
  "/repeatTask",
  verifyAdmin,
  /* #swagger.tags = ['Admin'] */ assignCronJob
);
adminRouter.get(
  "/testMailAutomation",
  verifyAdmin,
  /* #swagger.tags = ['Admin'] */ mailAutomation
);

export default adminRouter;
