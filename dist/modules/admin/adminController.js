"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailAutomation = exports.assignCronJob = exports.salesReport = exports.notifySelectedUsers = exports.notifyAllUsers = exports.notifyUser = exports.getUserById = exports.updateOrderStatus = exports.approveOrder = exports.getAllOrders = exports.getAllUsers = exports.deleteUser = exports.toggleUserAccess = exports.updateProduct = exports.addProduct = exports.loginAdmin = void 0;
const index_1 = require("../../index");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sequelize_1 = require("sequelize");
const redis_1 = __importDefault(require("../config/redis"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const async_1 = __importDefault(require("async"));
//importing services
const sendMail_1 = require("../services/sendMail");
const notify_1 = require("../services/notify");
const excelGenerator_1 = require("../services/excelGenerator");
const excelToPDFConverter_1 = require("../services/excelToPDFConverter");
const cronService_1 = require("../services/cronService");
const imageModel_1 = __importDefault(require("../product/imageModel"));
const orderProductsModel_1 = __importDefault(require("../order/orderProductsModel"));
//importing DB queries
const dbQueries_1 = __importDefault(require("../services/dbQueries"));
const dbQueries = new dbQueries_1.default();
//admin login
const loginAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            console.log("Please provide all the details.");
            return res
                .status(400)
                .json({ message: "Please provide all the details." });
        }
        const user = yield dbQueries.findUserByEmail(email);
        if (!user) {
            console.log("No admin found with this email!");
            return res
                .status(400)
                .json({ message: "No admin found with this email!" });
        }
        if (user && (yield bcrypt_1.default.compare(password, user.password))) {
            const loggedInUser = {
                id: user.id,
                name: user.username,
                email: user.email,
                token: generateToken(user.email),
            };
            console.log("Logged in as admin.");
            return res
                .status(201)
                .json({ message: "Logged in as admin.", data: loggedInUser });
        }
        else {
            console.log("Incorrect password.");
            return res.status(201).json({ message: "Incorrect password" });
        }
    }
    catch (error) {
        console.error("Error in login function :", error);
        return res.status(400).json({ message: "Login unsuccessfull." });
    }
});
exports.loginAdmin = loginAdmin;
//JWT generator function
const generateToken = (email) => {
    return jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
};
//creating new product
const addProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, brand, description, category, regular_price, selling_price } = req.body;
        if (!name ||
            !brand ||
            !description ||
            !category ||
            !regular_price ||
            !selling_price) {
            console.log("Please provide all the details.");
            return res
                .status(400)
                .json({ message: "Please provide all the details." });
        }
        const formData = {
            name: name.trim(),
            brand: brand.trim(),
            description: description.trim(),
            category: category.trim(),
            regular_price: parseInt(regular_price),
            selling_price: parseInt(selling_price),
        };
        //name validation rules
        const nameRegex = /^[A-Za-z0-9\s]+$/;
        if (!nameRegex.test(formData.name)) {
            return res.status(400).json({ message: "Invalid name." });
        }
        const existingProduct = yield dbQueries.findProductByName(name);
        if (existingProduct) {
            return res
                .status(400)
                .json({ message: "A product with this name already exists." });
        }
        //price validations
        if (formData.selling_price > formData.regular_price) {
            return res.status(400).json({
                message: "Selling price shouldn't be greater than regular price.",
            });
        }
        //creating new product
        const newProduct = yield dbQueries.createProduct(formData);
        if (!newProduct) {
            console.log("An error happened while creating new product.");
            return res.status(500).json({
                message: "An error happened while creating new product.",
            });
        }
        //setting in redis
        yield redis_1.default.set(`product_${newProduct.id}`, JSON.stringify(newProduct));
        const images = [];
        //uploading image files
        const promises = (_a = req.files) === null || _a === void 0 ? void 0 : _a.map((file) => __awaiter(void 0, void 0, void 0, function* () {
            const productImage = yield imageModel_1.default.create({
                productId: newProduct.id,
                image: file.originalname,
            });
            images.push(file.originalname);
        }));
        const finalProduct = Object.assign(Object.assign({}, newProduct.toJSON()), { images });
        //setting in redis
        yield redis_1.default.set(`product_${newProduct.id}`, JSON.stringify(finalProduct));
        if (promises) {
            yield Promise.all(promises);
            res
                .status(200)
                .json({ message: "Product added successfully", data: finalProduct });
        }
        else {
            console.log("An error happened while creating the product: promises is null");
            res.status(500).send("An error happened while creating the product.");
        }
    }
    catch (error) {
        console.error("Error creating product:", error);
        res.status(500).send("Error creating product");
    }
});
exports.addProduct = addProduct;
//updating a product
const updateProduct = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { productId } = req.query;
        if (!productId) {
            console.log("Please provide the productId.");
            return res.status(400).json({ message: "Please provide the productId." });
        }
        const { name, brand, description, category, regular_price, selling_price } = req.body;
        if (!name ||
            !brand ||
            !description ||
            !category ||
            !regular_price ||
            !selling_price) {
            console.log("Please provide all the details.");
            return res
                .status(400)
                .json({ message: "Please provide all the details." });
        }
        const formData = {
            name: name.trim(),
            brand: brand.trim(),
            description: description.trim(),
            category: category.trim(),
            regular_price: parseInt(regular_price),
            selling_price: parseInt(selling_price),
        };
        //name validation rules
        const nameRegex = /^[A-Za-z0-9\s]+$/;
        if (!nameRegex.test(formData.name)) {
            return res.status(400).json({ message: "Invalid name." });
        }
        if (typeof productId === "string") {
            const existingProduct = yield dbQueries.checkForDuplicateProduct(formData.name, parseInt(productId, 10));
            if (existingProduct) {
                return res
                    .status(400)
                    .json({ message: "A product with this name already exists." });
            }
            //price validations
            if (formData.selling_price > formData.regular_price) {
                return res.status(400).json({
                    message: "Selling price shouldn't be greater than regular price.",
                });
            }
            let newProduct;
            //updating the product
            const creatingNewProduct = () => __awaiter(void 0, void 0, void 0, function* () {
                newProduct = yield dbQueries.updateProduct(formData, parseInt(productId, 10));
            });
            //clearing existing images
            const clearOldImages = () => __awaiter(void 0, void 0, void 0, function* () {
                const result = yield dbQueries.clearExistingImages(parseInt(productId, 10));
                if (!result) {
                    console.log("An error happened while clearing old product images.");
                    return res.status(400).json({
                        message: "An error happened while clearing old product images.",
                    });
                }
            });
            async_1.default.parallel([creatingNewProduct, clearOldImages]);
            //uploading image files
            const promises = (_b = req.files) === null || _b === void 0 ? void 0 : _b.map((file) => __awaiter(void 0, void 0, void 0, function* () {
                yield dbQueries.saveProductImages(parseInt(productId, 10), file);
            }));
            if (promises) {
                yield Promise.all(promises);
            }
            res
                .status(200)
                .json({ message: "Product updated successfully", data: newProduct });
        }
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).send("Error updating product");
    }
});
exports.updateProduct = updateProduct;
//toggling the user access status (block/unblock)
const toggleUserAccess = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.query;
        if (userId) {
            if (typeof userId === "string") {
                const user = yield dbQueries.findUserById(parseInt(userId, 10));
                if (user) {
                    user.isBlocked = !user.isBlocked;
                    yield (user === null || user === void 0 ? void 0 : user.save());
                    console.log("User status has been changed successfully.");
                    return res
                        .status(200)
                        .json({ message: "User status has been changed successfully." });
                }
                else {
                    console.error("No user found.");
                    return res.status(400).send("No user found.");
                }
            }
        }
        else {
            console.error("Please provide a user id.");
            return res.status(400).send("Please provide a user id.");
        }
    }
    catch (error) {
        console.error("Error toggling user status:", error);
        return res.status(500).send("Error toggling user status.");
    }
});
exports.toggleUserAccess = toggleUserAccess;
//delete an existing user
const deleteUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            console.log("No user id received in params.");
            return res.status(400).json({ message: "Please provide a user id." });
        }
        if (typeof id === "string") {
            const userToDelete = yield dbQueries.findUserById(parseInt(id, 10));
            if (!userToDelete) {
                console.error("No user found with this id.");
                return res.status(400).send("No user found with this id.");
            }
            const result = yield dbQueries.deleteUserById(parseInt(id, 10));
            if (!result) {
                console.log("An error happened while deleting the user.");
                return res
                    .status(500)
                    .json({ message: "An error happened while deleting the user." });
            }
            console.log("User deleted successfully.");
            return res
                .status(200)
                .json({ message: "User deleted successfully.", data: exports.deleteUser });
        }
    }
    catch (error) {
        console.error("Error deleting user :", error);
        return res.status(500).send("Error deleting user.");
    }
});
exports.deleteUser = deleteUser;
//get all users
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const allUsers = yield dbQueries.findAllUsers();
        if (!allUsers || allUsers.length === 0) {
            console.log("No users found.");
            return res.status(500).json({ message: "No users found." });
        }
        return res
            .status(200)
            .json({ message: "Fetched all users.", data: allUsers });
    }
    catch (error) {
        console.error("Error fetching all users :", error);
        return res.status(500).send("Error fetching all users.");
    }
});
exports.getAllUsers = getAllUsers;
//get all orders
const getAllOrders = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let queryOptions = {
            include: [
                {
                    model: orderProductsModel_1.default,
                    as: "orderProducts",
                },
            ],
            order: [["orderDate", "ASC"]],
        };
        let { startDate, endDate, today } = req.query;
        if (today) {
            const currDate = new Date();
            const start = currDate.setDate(currDate.getDate() - 1);
            const end = currDate.setDate(currDate.getDate() + 1);
            queryOptions.where = {
                orderDate: {
                    [sequelize_1.Op.between]: [start, end],
                },
            };
        }
        if (startDate && endDate) {
            queryOptions.where = {
                orderDate: {
                    [sequelize_1.Op.between]: [startDate, endDate],
                },
            };
        }
        else if (startDate && !endDate) {
            queryOptions.where = {
                orderDate: {
                    [sequelize_1.Op.gte]: startDate,
                },
            };
        }
        else if (!startDate && endDate) {
            queryOptions.where = {
                orderDate: {
                    [sequelize_1.Op.lte]: endDate,
                },
            };
        }
        const allOrders = yield dbQueries.findAllOrdersWithOptions(queryOptions);
        if (!allOrders || allOrders.length === 0) {
            console.log("No orders found.");
            return res.status(400).json({ message: "No orders found." });
        }
        const formattedOrders = allOrders.map((order) => {
            return Object.assign({}, order.toJSON());
        });
        const promises = formattedOrders.map((order) => {
            order.orderDate = (0, moment_timezone_1.default)(order.orderDate).format("YYYY-MM-DD");
            order.createdAt = (0, moment_timezone_1.default)(order.createdAt).format("YYYY-MM-DD");
            order.updatedAt = (0, moment_timezone_1.default)(order.updatedAt).format("YYYY-MM-DD");
            order.orderProducts.forEach((product) => {
                product.createdAt = (0, moment_timezone_1.default)(product.createdAt).format("YYYY-MM-DD");
                product.updatedAt = (0, moment_timezone_1.default)(product.updatedAt).format("YYYY-MM-DD");
            });
        });
        if (promises) {
            yield Promise.all(promises);
            return res
                .status(200)
                .json({ message: "Fetched all orders.", data: formattedOrders });
        }
        else {
            return res
                .status(500)
                .json({
                message: "Unexpected error occurred while formatting order dates.",
            });
        }
    }
    catch (error) {
        console.error("Error fetching all orders. :", error);
        res.status(500).send("Error fetching all orders. ");
    }
});
exports.getAllOrders = getAllOrders;
//approving an order
const approveOrder = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //getting user id from request query
        const { orderId } = req.query;
        if (orderId) {
            if (typeof orderId === "string") {
                const order = yield dbQueries.findOrderById(parseInt(orderId, 10));
                if (!order) {
                    console.log("No order found with this order id.");
                    return res
                        .status(400)
                        .json({ message: "No order found with this order id." });
                }
                //getting user from user model
                const user = yield dbQueries.findUserById(order.userId);
                if (!user) {
                    console.log("No user found. User is not logged in.");
                    return res
                        .status(400)
                        .json({ message: "No user found. User is not logged in." });
                }
                //checking if the order is not null and order status is not approved already
                if (order && order.orderStatus === "To be approved") {
                    //if yes, changing the status to "Approved"
                    order.orderStatus = "Approved";
                    const currDate = new Date();
                    const today = (0, moment_timezone_1.default)();
                    const targetDate = (0, moment_timezone_1.default)(today.add(3, "days"));
                    order.expectedDeliveryDate = new Date(currDate);
                    let duration = 3;
                    if (targetDate.format("dddd") === "Saturday" ||
                        targetDate.format("dddd") === "Sunday") {
                        order.expectedDeliveryDate.setDate(currDate.getDate() + 5);
                        duration = 5;
                    }
                    else {
                        order.expectedDeliveryDate.setDate(currDate.getDate() + 3);
                    }
                    yield (order === null || order === void 0 ? void 0 : order.save());
                    //creating notification info
                    const userId = order.userId;
                    const label = "Order approved!";
                    const content = `Your order with id:${order.id} has been approved by admin.`;
                    //calling notify service
                    yield (0, notify_1.notify)(userId, label, content);
                    //sending notification to user via socket.io connection
                    index_1.io.emit("notifyClient", label + " " + content);
                    //using mail service to notify the user about the status change
                    let productInfo = "";
                    order === null || order === void 0 ? void 0 : order.dataValues.orderProducts.forEach((item) => {
                        productInfo += `<li class="product">${item.Product.name} Price: ₹${item.Product.selling_price}</li>`;
                    });
                    //creating parameters for send mail service
                    const email = user.email;
                    const subject = "Order approval notification.";
                    const text = `Your order has been approved by admin.`;
                    //generating dynamic html
                    let html = ``;
                    let html_header = `<!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>Order Details</title>
              <!-- <link rel="stylesheet" href="demo.css" /> -->
              <style>
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1;
                  background-image: url(./public/images/plant.jpg);
                  background-size: cover;
                  background-repeat: no-repeat;
                  overflow: hidden;
                }
          
                .parent-container {
                  display: grid;
                  justify-content: center;
                  align-items: center;
                }
          
                .container {
                  max-width: 600px;
                  margin: 20 auto;
                  padding: 20px;
                  background-color: #ffffffac;
                  border-radius: 5px;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
          
                .heading-1 {
                  color: #000000;
                  font-size: 4rem;
                }
          
                h1 {
                  color: #00765c;
                  text-align: center;
                }
          
                .order-details {
                  margin-bottom: 20px;
                }
          
                .products {
                  margin-left: 20px;
                }
          
                .product {
                  margin-bottom: 10px;
                }
          
                /* table styles */
          
                table {
                  border: 2px black solid;
                  border-collapse: collapse;
                }
          
                thead {
                  background-color: #08a953;
                }
          
                td,
                th {
                  padding: 8px;
                  text-align: left;
                  border-bottom: 1px black solid;
                  padding: 8px 10px;
                }
                tr {
                  background-color: rgba(245, 245, 220, 0.641);
                }
                tr:hover {
                  background-color: aqua;
                }
                td:last-of-type {
                  text-align: center;
                }
              </style>
            </head>
            <body>
              <div><h1 class="heading-1">Ecommerce</h1></div>
              <div class="parent-container">`;
                    let html_body = `<p><strong>Order id:</strong> ${order.id}</p>
                <p>
                  <strong>Order date:</strong> ${(0, moment_timezone_1.default)(order.orderDate)
                        .tz(`${user.timeZone}`)
                        .format("DD-MM-YYYY")}
                </p>
                <p>
                  <strong>Expected delivery date:</strong> ${(0, moment_timezone_1.default)(order.expectedDeliveryDate)
                        .tz(`${user.timeZone}`)
                        .format("DD-MM-YYYY")}
                </p>
                <p><strong>Expected delivery duration:</strong> ${duration} days</p>
                <table>
                  <caption>
                    <strong>Your order has been approved by admin.</strong>
                  </caption>
                  <thead>
                    <tr>
                      <th scope="row">No.</th>
                      <th scope="row">Name</th>
                      <th scope="row">Price</th>
                      <th scope="row">Quantity(Nos)</th>
                      <th scope="row">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                  `;
                    let html_content = ``;
                    let html_footer = `</tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" colspan="4">Order Total</th>
                      <td>₹${order.totalAmount}/-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </body>
          </html>
          `;
                    //dynamically feeding order products table in html
                    order === null || order === void 0 ? void 0 : order.dataValues.orderProducts.forEach((product) => {
                        html_content += `<tr>
            <td>${(order === null || order === void 0 ? void 0 : order.dataValues.orderProducts.indexOf(product)) + 1}</td>
            <td>${product.Product.dataValues.name}</td>
            <td>₹${product.price}/-</td>
            <td>${product.quantity}</td>
            <td>₹${product.price * product.quantity}/-</td>
          </tr>`;
                    });
                    html += html_header + html_body + html_content + html_footer;
                    yield (0, sendMail_1.sendMail)(email, subject, text, html);
                    console.log("Order has been approved successfully.");
                    return res
                        .status(200)
                        .json({ message: "Order has been approved successfully." });
                }
                else if (order && order.orderStatus !== "To be approved") {
                    console.log("This order is already approved.");
                    res.status(400).send("This order is already approved.");
                }
                else {
                    console.log("No order found.");
                    res.status(400).send("No order found.");
                }
            }
        }
        else {
            console.error("Please provide an order id.");
            res.status(400).send("Please provide an order id.");
        }
    }
    catch (error) {
        console.error("Error approving the order :", error);
        res.status(500).send("Error approving the order");
    }
});
exports.approveOrder = approveOrder;
//approving an order
const updateOrderStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //getting user id from request query
        const { orderId, newStatus } = req.query;
        if (!orderId || !newStatus) {
            console.error("Please provide all the details.");
            return res.status(400).send("Please provide all the details.");
        }
        if (orderId) {
            if (typeof orderId === "string" && typeof newStatus === "string") {
                const order = yield dbQueries.findOrderById(parseInt(orderId, 10));
                if (!order) {
                    console.error("No order found with this id!");
                    return res.status(400).send("No order found with this id!");
                }
                const orderHistory = yield dbQueries.findOrderHistory(order.id);
                yield dbQueries.createOrderStatus(order.id, newStatus);
                return res.status(200).json({ message: "Updated order status." });
            }
            console.error("Unexpected error in updateOrderStatus function!");
            return res
                .status(500)
                .send("Unexpected error in updateOrderStatus function!");
        }
        else {
            console.error("Please provide an order id.");
            return res.status(400).send("Please provide an order id.");
        }
    }
    catch (error) {
        console.error("Error approving the order :", error);
        return res.status(500).send("Error approving the order");
    }
});
exports.updateOrderStatus = updateOrderStatus;
//get user by id
const getUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            console.log("No user id received in params.");
            return res.status(400).json({ message: "Please provide a user id." });
        }
        if (typeof id === "string") {
            const userToDelete = yield dbQueries.findUserById(parseInt(id, 10));
            const user = yield dbQueries.findUserById(parseInt(id, 10));
            return res
                .status(200)
                .json({ message: "User fetched successfully.", data: user });
        }
    }
    catch (error) {
        console.error("Error in getUserById function.", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
exports.getUserById = getUserById;
const notifyUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { label, content } = req.body;
        if (!label || !content) {
            console.log("No label or content found in the request body.");
            return res
                .status(400)
                .json({ message: "Please provide all the fields." });
        }
        yield dbQueries.createNotificationForOne(2, label, content);
        index_1.io.emit("notifyClient", label + " " + content);
        console.log("The user has been notified.");
        return res.status(200).json({ message: "The user has been notified." });
    }
    catch (error) {
        console.error("Error in notifyUser function:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});
exports.notifyUser = notifyUser;
const notifyAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { label, content } = req.body;
        if (!label || !content) {
            console.log("No label or content found in the request body.");
            res.status(400).json({ message: "Please provide all the fields." });
        }
        yield (0, notify_1.notifyAll)(label, content);
        console.log("All users have been notified.");
        res.status(200).json({ message: "All users have been notified." });
    }
    catch (error) {
        console.error("Error in notifyAllUsers function.", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
exports.notifyAllUsers = notifyAllUsers;
const notifySelectedUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ids, label, content } = req.body;
        if (!ids || !label || !content) {
            console.log("No label or content or ids found in the request body.");
            return res.status(400).json({ message: "Please fill all the fields." });
        }
        yield (0, notify_1.notifySelected)(ids, label, content);
        console.log("Selected users have been notified.");
        return res
            .status(200)
            .json({ message: "Selected users have been notified." });
    }
    catch (error) {
        console.error("Error in notifySelectedUsers function.", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});
exports.notifySelectedUsers = notifySelectedUsers;
const salesReport = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { start, end } = req.query;
        console.log(start);
        let report;
        if (start !== undefined && end !== undefined && start === end) {
            const newDate = new Date(start);
            report = yield dbQueries.salesReportOnDate(newDate);
        }
        else {
            report = yield dbQueries.salesReportWithRange(start, end);
        }
        //excel generation
        if (report) {
            const result = yield (0, excelGenerator_1.generateExcel)(report);
            if (result) {
                // excel to pdf conversion
                const excelFilePath = "./Sales Report.xlsx";
                const pdfFilePath = "./Sales Report.pdf";
                yield (0, excelToPDFConverter_1.convertExcelToPDF)(excelFilePath, pdfFilePath)
                    .then(() => console.log("Excel converted to PDF successfully"))
                    .catch((error) => console.error("Error converting Excel to PDF:", error));
                return res
                    .status(200)
                    .json({ message: "report generated.", data: report });
            }
            else {
                console.log("Error in salesReport function.");
                return res.status(500).json({ message: "Internal server error." });
            }
        }
        else {
            console.log("Error in salesReport function.");
            return res.status(500).json({ message: "Internal server error." });
        }
    }
    catch (error) {
        console.error("Error in salesReport function.", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});
exports.salesReport = salesReport;
const assignCronJob = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const task = () => console.log("Date : ", new Date().toLocaleString());
        (0, cronService_1.cronJob)(task);
        return res
            .status(200)
            .json({ message: "The repeating task has been started." });
    }
    catch (error) {
        console.error("Error in cronJob function.", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});
exports.assignCronJob = assignCronJob;
const mailAutomation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //creating parameters for send mail service
        const email = "joestephenk10@gmail.com";
        const subject = "Mail automation test.";
        const text = `This is just a test mail from admin.`;
        //generating dynamic html
        let html = ``;
        let html_header = `<!DOCTYPE html>
     <html lang="en">
       <head>
         <meta charset="UTF-8" />
         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
         <title>Order Details</title>
         <!-- <link rel="stylesheet" href="demo.css" /> -->
         <style>
           body {
             font-family: Arial, sans-serif;
             line-height: 1;
             background-image: url(./public/images/plant.jpg);
             background-size: cover;
             background-repeat: no-repeat;
             overflow: hidden;
           }
     
           .parent-container {
             display: grid;
             justify-content: center;
             align-items: center;
           }
     
           .container {
             max-width: 600px;
             margin: 20 auto;
             padding: 20px;
             background-color: #ffffffac;
             border-radius: 5px;
             box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
           }
     
           .heading-1 {
             color: #000000;
             font-size: 4rem;
           }
     
           h1 {
             color: #00765c;
             text-align: center;
           }
     
           .order-details {
             margin-bottom: 20px;
           }
     
           .products {
             margin-left: 20px;
           }
     
           .product {
             margin-bottom: 10px;
           }
     
           /* table styles */
     
           table {
             border: 2px black solid;
             border-collapse: collapse;
           }
     
           thead {
             background-color: #08a953;
           }
     
           td,
           th {
             padding: 8px;
             text-align: left;
             border-bottom: 1px black solid;
             padding: 8px 10px;
           }
           tr {
             background-color: rgba(245, 245, 220, 0.641);
           }
           tr:hover {
             background-color: aqua;
           }
           td:last-of-type {
             text-align: center;
           }
         </style>
       </head>
       <body>
         <div><h1 class="heading-1">Ecommerce</h1></div>
         <div class="parent-container">`;
        let html_body = `<table>
             <caption>
               <strong>Your order has been approved by admin.</strong>
             </caption>
             <thead>
               <tr>
                 <th scope="row">No.</th>
                 <th scope="row">Name</th>
                 <th scope="row">Price</th>
                 <th scope="row">Quantity(Nos)</th>
                 <th scope="row">Total</th>
               </tr>
             </thead>
             <tbody>
             `;
        let html_content = `<h1>Mail automation</h1>`;
        let html_footer = `</tbody>
             <tfoot>
               <tr>
                 <th scope="row" colspan="4">Order Total</th>
                 <td>₹ Test Amount/-</td>
               </tr>
             </tfoot>
           </table>
         </div>
       </body>
     </html>
     `;
        html += html_header + html_body + html_content + html_footer;
        const task = () => __awaiter(void 0, void 0, void 0, function* () { return yield (0, sendMail_1.sendMail)(email, subject, text, html); });
        (0, cronService_1.cronJob)(task);
        return res
            .status(200)
            .json({ message: "Mail automation cron job has been started." });
    }
    catch (error) {
        console.error("Error in mail automation function.", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});
exports.mailAutomation = mailAutomation;
