import sequelize from "../config/db";

//importing models
import User from "../user/userModel";
import Image from "../product/imageModel";
import Product from "../product/productModel";
import Cart from "../cart/cartModel";
import CartProducts from "../cart/cartProductsModel";
import Order from "../order/orderModel";
import OrderProducts from "../order/orderProductsModel";
import adminRouter from "../router/adminRouter";
import Cancel from "../order/cancelOrderModel";
import Notification from "../notifications/notificationModel";
import OrderHistory from "../order/orderHistoryModel";

export const syncAndConnectDB = async () => {
  // associations
  //image associations
  Image.belongsTo(Product, { foreignKey: "productId" });
  Product.hasMany(Image, { foreignKey: "productId" });
  //cart associations
  Cart.belongsTo(User, { foreignKey: "userId" });
  Cart.belongsToMany(Product, { through: CartProducts });
  Product.belongsToMany(Cart, { through: CartProducts });
  User.hasOne(Cart, { foreignKey: "userId" });
  //order associations
  Order.belongsTo(User, { foreignKey: "userId" });
  Order.belongsToMany(Product, { through: OrderProducts });
  Product.belongsToMany(Order, { through: OrderProducts });
  User.hasMany(Order, { foreignKey: "userId" });
  Order.hasMany(OrderProducts, { foreignKey: "orderId", as: "orderProducts" });
  //product with orderProducts
  Product.hasMany(OrderProducts, { foreignKey: "productId" });
  OrderProducts.belongsTo(Product, { foreignKey: "productId" });
  //cancel order associations
  Cancel.belongsTo(Order, { foreignKey: "orderId" });
  Order.hasOne(Cancel, { foreignKey: "orderId" });
  //notifications associations
  Notification.belongsTo(User, { foreignKey: "userId" });
  User.hasMany(Notification, { foreignKey: "userId" });
  //orderHistory associations
  Order.hasMany(OrderHistory, { foreignKey: "orderId" });
  OrderHistory.belongsTo(Order, { foreignKey: "orderId" });
  // syncing models and starting server
  sequelize
    .sync({ force: false })
    // .sync({ force: false, alter:true })
    .then(() => {
      console.log("Models synchronized successfully.");
    })
    .catch((error) => {
      console.error("Error synchronizing models:", error);
    });
};
