import { Router } from "express";
const userRouter = Router();

//user functions
import {
  createUser,
  loginUser,
  resetPassword,
  getAllProducts,
  updateUser,
  sendVerifyMail,
  verifyOtp,
  getMyMoment,
} from "../user/userController";

//cart functions
import {
  addToCart,
  getUserCart,
  decreaseCartQuantity,
  increaseCartQuantity,
  removeCartItem,
} from "../cart/cartController";

//order functions
import {
  cancelOrder,
  checkOut,
  editOrder,
  orderStatus,
} from "../order/orderController";

//middlewares
import verifyUser from "../user/userAuthentication";
import { getAllNotifications } from "../notifications/notificationController";

//user functionalities
userRouter.post("/login", /* #swagger.tags = ['User'] */ loginUser);
userRouter.post("/sendOtp", /* #swagger.tags = ['User'] */ sendVerifyMail);
userRouter.post("/verifyEmail", /* #swagger.tags = ['User'] */ verifyOtp);
userRouter.post("/", /* #swagger.tags = ['User'] */ createUser);

userRouter.patch(
  "/resetPassword",
  /* #swagger.tags = ['User'] */ verifyUser,
  resetPassword
);
userRouter.get("/products", /* #swagger.tags = ['User'] */ getAllProducts);
userRouter.get(
  "/notifications",
  /* #swagger.tags = ['User - Notifications'] */ verifyUser,
  getAllNotifications
);
userRouter.put("/:id", /* #swagger.tags = ['User'] */ verifyUser, updateUser);

//cart functionalities
userRouter.get(
  "/cart",
  /* #swagger.tags = ['User - Cart'] */ verifyUser,
  getUserCart
);
userRouter.post(
  "/cart",
  /* #swagger.tags = ['User - Cart'] */ verifyUser,
  addToCart
);
userRouter.patch(
  "/decreaseCartQuantity",
  /* #swagger.tags = ['User - Cart'] */ verifyUser,
  decreaseCartQuantity
);
userRouter.patch(
  "/increaseCartQuantity",
  /* #swagger.tags = ['User - Cart'] */ verifyUser,
  increaseCartQuantity
);
userRouter.delete(
  "/removeCartItem",
  /* #swagger.tags = ['User - Cart'] */ removeCartItem
);

//order functionalities
userRouter.post(
  "/checkOut",
  /* #swagger.tags = ['User - Order'] */ verifyUser,
  checkOut
);
userRouter.post(
  "/cancelOrder",
  /* #swagger.tags = ['User - Order'] */ cancelOrder
);
userRouter.patch(
  "/editOrder",
  /* #swagger.tags = ['User - Order'] */ editOrder
);
userRouter.get(
  "/order",
  /* #swagger.tags = ['User - Order'] */ verifyUser,
  orderStatus
);

//test routes
userRouter.get(
  "/moment",
  /* #swagger.tags = ['User - Test Routes'] */ verifyUser,
  getMyMoment
);

export default userRouter;
