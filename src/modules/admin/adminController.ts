import { io } from "../../index";
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import redis from "../config/redis";
import moment from "moment-timezone";
import async from "async";

//importing services
import { sendMail } from "../services/sendMail";
import { notify, notifyAll, notifySelected } from "../services/notify";
import { generateExcel } from "../services/excelGenerator";
import { convertExcelToPDF } from "../services/excelToPDFConverter";
import { cronJob } from "../services/cronService";

//importing models
import User from "../user/userModel";
import Product from "../product/productModel";
import Image from "../product/imageModel";
import Order from "../order/orderModel";
import OrderProducts from "../order/orderProductsModel";

//importing DB queries
import DBQueries from "../services/dbQueries";
import OrderHistory from "../order/orderHistoryModel";
const dbQueries = new DBQueries();

//@desc Logging in admin
//@route POST /admin-login
//@access Public
export const loginAdmin: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      console.log("Please provide all the details.");
      return res
        .status(400)
        .json({ message: "Please provide all the details." });
    }
    const user: User | null | undefined = await dbQueries.findUserByEmail(
      email
    );
    if (!user) {
      console.log("No admin found with this email!");
      return res
        .status(400)
        .json({ message: "No admin found with this email!" });
    }
    if (user && (await bcrypt.compare(password, user.password))) {
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
    } else {
      console.log("Incorrect password.");
      return res.status(201).json({ message: "Incorrect password" });
    }
  } catch (error) {
    console.error("Error in login function :", error);
    return res.status(400).json({ message: "Login unsuccessfull." });
  }
};

//JWT generator function
const generateToken = (email: string) => {
  return jwt.sign({ email }, process.env.JWT_SECRET as string, {
    expiresIn: "1d",
  });
};

//@desc Creating new product
//@route POST /product
//@access Private
export const addProduct: RequestHandler = async (req, res, next) => {
  try {
    const { name, brand, description, category, regular_price, selling_price } =
      req.body;
    if (
      !name ||
      !brand ||
      !description ||
      !category ||
      !regular_price ||
      !selling_price
    ) {
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
    const existingProduct: Product | null | undefined =
      await dbQueries.findProductByName(name);
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
    const newProduct: Product | null | undefined =
      await dbQueries.createProduct(formData);
    if (!newProduct) {
      console.log("An error happened while creating new product.");
      return res.status(500).json({
        message: "An error happened while creating new product.",
      });
    }
    //setting in redis
    await redis.set(`product_${newProduct.id}`, JSON.stringify(newProduct));
    const images: string[] = [];
    //uploading image files
    const promises = (req.files as File[] | undefined)?.map(
      async (file: any) => {
        const productImage = await Image.create({
          productId: newProduct.id,
          image: file.originalname,
        });
        images.push(file.originalname);
      }
    );
    const finalProduct = { ...newProduct.toJSON(), images };
    //setting in redis
    await redis.set(`product_${newProduct.id}`, JSON.stringify(finalProduct));
    if (promises) {
      await Promise.all(promises);
      res
        .status(200)
        .json({ message: "Product added successfully", data: finalProduct });
    } else {
      console.log(
        "An error happened while creating the product: promises is null"
      );
      res.status(500).send("An error happened while creating the product.");
    }
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).send("Error creating product");
  }
};

//updating a product
//@desc Editing product details
//@route POST /updateProduct
//@access Private
export const updateProduct: RequestHandler = async (req, res, next) => {
  try {
    const { productId } = req.query;
    if (!productId) {
      console.log("Please provide the productId.");
      return res.status(400).json({ message: "Please provide the productId." });
    }
    const { name, brand, description, category, regular_price, selling_price } =
      req.body;
    if (
      !name ||
      !brand ||
      !description ||
      !category ||
      !regular_price ||
      !selling_price
    ) {
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
      const existingProduct: Product | null | undefined =
        await dbQueries.checkForDuplicateProduct(
          formData.name,
          parseInt(productId, 10)
        );
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
      let newProduct!: any;
      //updating the product
      const creatingNewProduct = async () => {
        newProduct = await dbQueries.updateProduct(
          formData,
          parseInt(productId, 10)
        );
      };

      //clearing existing images
      const clearOldImages = async () => {
        const result: boolean = await dbQueries.clearExistingImages(
          parseInt(productId, 10)
        );
        if (!result) {
          console.log("An error happened while clearing old product images.");
          return res.status(400).json({
            message: "An error happened while clearing old product images.",
          });
        }
      };

      async.parallel([creatingNewProduct, clearOldImages], (err, results) => {
        if (err) {
          console.error(
            "An error in update product's (async.parallel) block :",
            err
          );
        }
        console.log("All functions were excecuted parallelly.");
        console.log("The results are : ", results);
      });
      //uploading image files
      const promises = (req.files as File[] | undefined)?.map(
        async (file: any) => {
          await dbQueries.saveProductImages(parseInt(productId, 10), file);
        }
      );
      if (promises) {
        await Promise.all(promises);
      }
      return res
        .status(200)
        .json({ message: "Product updated successfully", data: newProduct });
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product");
  }
};

//@desc Toggling user access status (block/unblock)
//@route PATCH /toggleStatus
//@access Private
export const toggleUserAccess: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (userId) {
      if (typeof userId === "string") {
        const user: User | null | undefined = await dbQueries.findUserById(
          parseInt(userId, 10)
        );
        if (user) {
          user.isBlocked = !user.isBlocked;
          await user?.save();
          console.log("User status has been changed successfully.");
          return res
            .status(200)
            .json({ message: "User status has been changed successfully." });
        } else {
          console.error("No user found.");
          return res.status(400).send("No user found.");
        }
      }
    } else {
      console.error("Please provide a user id.");
      return res.status(400).send("Please provide a user id.");
    }
  } catch (error) {
    console.error("Error toggling user status:", error);
    return res.status(500).send("Error toggling user status.");
  }
};

//@desc Deleting a user
//@route DELETE /:id
//@access Private
export const deleteUser: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      console.log("No user id received in params.");
      return res.status(400).json({ message: "Please provide a user id." });
    }
    if (typeof id === "string") {
      const userToDelete: User | null | undefined =
        await dbQueries.findUserById(parseInt(id, 10));
      if (!userToDelete) {
        console.error("No user found with this id.");
        return res.status(400).send("No user found with this id.");
      }
      const result: boolean = await dbQueries.deleteUserById(parseInt(id, 10));
      if (!result) {
        console.log("An error happened while deleting the user.");
        return res
          .status(500)
          .json({ message: "An error happened while deleting the user." });
      }
      console.log("User deleted successfully.");
      return res
        .status(200)
        .json({ message: "User deleted successfully.", data: deleteUser });
    }
  } catch (error) {
    console.error("Error deleting user :", error);
    return res.status(500).send("Error deleting user.");
  }
};

//@desc Getting all users
//@route GET /
//@access Private
export const getAllUsers: RequestHandler = async (req, res, next) => {
  try {
    const allUsers: User[] | [] | undefined = await dbQueries.findAllUsers();
    if (!allUsers || allUsers.length === 0) {
      console.log("No users found.");
      return res.status(500).json({ message: "No users found." });
    }
    return res
      .status(200)
      .json({ message: "Fetched all users.", data: allUsers });
  } catch (error) {
    console.error("Error fetching all users :", error);
    return res.status(500).send("Error fetching all users.");
  }
};

//@desc Get all orders
//@route GET /orders
//@access Private
export const getAllOrders: RequestHandler = async (req, res, next) => {
  try {
    let queryOptions: any = {
      include: [
        {
          model: OrderProducts,
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
          [Op.between]: [start, end],
        },
      };
    }
    if (startDate && endDate) {
      queryOptions.where = {
        orderDate: {
          [Op.between]: [startDate, endDate],
        },
      };
    } else if (startDate && !endDate) {
      queryOptions.where = {
        orderDate: {
          [Op.gte]: startDate,
        },
      };
    } else if (!startDate && endDate) {
      queryOptions.where = {
        orderDate: {
          [Op.lte]: endDate,
        },
      };
    }
    const allOrders: Order[] | [] | undefined =
      await dbQueries.findAllOrdersWithOptions(queryOptions);
    if (!allOrders || allOrders.length === 0) {
      console.log("No orders found.");
      return res.status(400).json({ message: "No orders found." });
    }
    const formattedOrders: Object[] = allOrders.map((order: any) => {
      return { ...order.toJSON() };
    });
    const promises: any = formattedOrders.map((order: any) => {
      order.orderDate = moment(order.orderDate).format("YYYY-MM-DD");
      order.createdAt = moment(order.createdAt).format("YYYY-MM-DD");
      order.updatedAt = moment(order.updatedAt).format("YYYY-MM-DD");
      order.orderProducts.forEach((product: any) => {
        product.createdAt = moment(product.createdAt).format("YYYY-MM-DD");
        product.updatedAt = moment(product.updatedAt).format("YYYY-MM-DD");
      });
    });
    if (promises) {
      await Promise.all(promises);
      return res
        .status(200)
        .json({ message: "Fetched all orders.", data: formattedOrders });
    } else {
      return res.status(500).json({
        message: "Unexpected error occurred while formatting order dates.",
      });
    }
  } catch (error) {
    console.error("Error fetching all orders. :", error);
    res.status(500).send("Error fetching all orders. ");
  }
};

//@desc Approving an order
//@route PATCH /approveOrder
//@access Private
export const approveOrder: RequestHandler = async (req, res, next) => {
  try {
    //getting user id from request query
    const { orderId } = req.query;
    if (orderId) {
      if (typeof orderId === "string") {
        const order = await dbQueries.findOrderById(parseInt(orderId, 10));
        if (!order) {
          console.log("No order found with this order id.");
          return res
            .status(400)
            .json({ message: "No order found with this order id." });
        }
        //getting user from user model
        const user = await dbQueries.findUserById(order.userId);
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
          const today = moment();
          const targetDate = moment(today.add(3, "days"));
          order.expectedDeliveryDate = new Date(currDate);
          let duration: number = 3;
          if (
            targetDate.format("dddd") === "Saturday" ||
            targetDate.format("dddd") === "Sunday"
          ) {
            order.expectedDeliveryDate.setDate(currDate.getDate() + 5);
            duration = 5;
          } else {
            order.expectedDeliveryDate.setDate(currDate.getDate() + 3);
          }
          await order?.save();
          //creating notification info
          const userId: number = order.userId;
          const label: string = "Order approved!";
          const content: string = `Your order with id:${order.id} has been approved by admin.`;
          //calling notify service
          await notify(userId, label, content);
          //sending notification to user via socket.io connection
          io.emit("notifyClient", label + " " + content);
          //using mail service to notify the user about the status change
          let productInfo: string = "";
          order?.dataValues.orderProducts.forEach((item: any) => {
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
                  <strong>Order date:</strong> ${moment(order.orderDate)
                    .tz(`${user.timeZone}`)
                    .format("DD-MM-YYYY")}
                </p>
                <p>
                  <strong>Expected delivery date:</strong> ${moment(
                    order.expectedDeliveryDate
                  )
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
          order?.dataValues.orderProducts.forEach((product: any) => {
            html_content += `<tr>
            <td>${order?.dataValues.orderProducts.indexOf(product) + 1}</td>
            <td>${product.Product.dataValues.name}</td>
            <td>₹${product.price}/-</td>
            <td>${product.quantity}</td>
            <td>₹${product.price * product.quantity}/-</td>
          </tr>`;
          });

          html += html_header + html_body + html_content + html_footer;

          await sendMail(email, subject, text, html);
          console.log("Order has been approved successfully.");
          return res
            .status(200)
            .json({ message: "Order has been approved successfully." });
        } else if (order && order.orderStatus !== "To be approved") {
          console.log("This order is already approved.");
          res.status(400).send("This order is already approved.");
        } else {
          console.log("No order found.");
          res.status(400).send("No order found.");
        }
      }
    } else {
      console.error("Please provide an order id.");
      res.status(400).send("Please provide an order id.");
    }
  } catch (error) {
    console.error("Error approving the order :", error);
    res.status(500).send("Error approving the order");
  }
};

//@desc Update order status
//@route POST /orderStatus
//@access Private
export const updateOrderStatus: RequestHandler = async (req, res, next) => {
  try {
    //getting user id from request query
    const { orderId, newStatus } = req.query;
    if (!orderId || !newStatus) {
      console.error("Please provide all the details.");
      return res.status(400).send("Please provide all the details.");
    }
    if (orderId) {
      if (typeof orderId === "string" && typeof newStatus === "string") {
        const order = await dbQueries.findOrderById(parseInt(orderId, 10));
        if (!order) {
          console.error("No order found with this id!");
          return res.status(400).send("No order found with this id!");
        }
        const orderHistory: OrderHistory[] | [] | undefined =
          await dbQueries.findOrderHistory(order.id);
        await dbQueries.createOrderStatus(order.id, newStatus);
        return res.status(200).json({ message: "Updated order status." });
      }
      console.error("Unexpected error in updateOrderStatus function!");
      return res
        .status(500)
        .send("Unexpected error in updateOrderStatus function!");
    } else {
      console.error("Please provide an order id.");
      return res.status(400).send("Please provide an order id.");
    }
  } catch (error) {
    console.error("Error approving the order :", error);
    return res.status(500).send("Error approving the order");
  }
};

//@desc Get user by id
//@route GET /getUser/:id
//@access Private
export const getUserById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      console.log("No user id received in params.");
      return res.status(400).json({ message: "Please provide a user id." });
    }
    if (typeof id === "string") {
      const userToDelete: User | null | undefined =
        await dbQueries.findUserById(parseInt(id, 10));
      const user: User | null | undefined = await dbQueries.findUserById(
        parseInt(id, 10)
      );
      return res
        .status(200)
        .json({ message: "User fetched successfully.", data: user });
    }
  } catch (error) {
    console.error("Error in getUserById function.", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

//@desc Notifying a user
//@route POST /notify
//@access Private
export const notifyUser: RequestHandler = async (req, res, next) => {
  try {
    const { label, content } = req.body;
    if (!label || !content) {
      console.log("No label or content found in the request body.");
      return res
        .status(400)
        .json({ message: "Please provide all the fields." });
    }
    const createNotification = async () => {
      await dbQueries.createNotificationForOne(2, label, content);
    };
    const createSocketMessage = () => {
      io.emit("notifyClient", label + " " + content);
    };
    async.parallel(
      [createNotification, createSocketMessage],
      (err, results) => {
        if (err) {
          console.error(
            "An error in notifyUser's (async.parallel) block :",
            err
          );
        }
        console.log("All functions were excecuted parallelly.");
        console.log("The results are : ", results);
      }
    );
    console.log("The user has been notified.");
    return res.status(200).json({ message: "The user has been notified." });
  } catch (error) {
    console.error("Error in notifyUser function:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

//@desc Notifying all users
//@route POST /notifyAll
//@access Private
export const notifyAllUsers: RequestHandler = async (req, res, next) => {
  try {
    const { label, content } = req.body;
    if (!label || !content) {
      console.log("No label or content found in the request body.");
      return res
        .status(400)
        .json({ message: "Please provide all the fields." });
    }
    await notifyAll(label, content);
    console.log("All users have been notified.");
    return res.status(200).json({ message: "All users have been notified." });
  } catch (error) {
    console.error("Error in notifyAllUsers function.", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

//@desc Notifying selected users
//@route POST /notifySelected
//@access Private
export const notifySelectedUsers: RequestHandler = async (req, res, next) => {
  try {
    const { ids, label, content } = req.body;
    if (!ids || !label || !content) {
      console.log("No label or content or ids found in the request body.");
      return res.status(400).json({ message: "Please fill all the fields." });
    }
    await notifySelected(ids, label, content);
    console.log("Selected users have been notified.");
    return res
      .status(200)
      .json({ message: "Selected users have been notified." });
  } catch (error) {
    console.error("Error in notifySelectedUsers function.", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

//@desc Getting sales report
//@route GET /salesReport
//@access Private
export const salesReport: RequestHandler = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    let report!: OrderProducts[] | [] | undefined;
    if (start !== undefined && end !== undefined && start === end) {
      const newDate = new Date(start as string);
      report = await dbQueries.salesReportOnDate(newDate);
    } else {
      report = await dbQueries.salesReportWithRange(start, end);
    }
    //excel generation
    if (report) {
      const result = await generateExcel(report);
      if (result) {
        // excel to pdf conversion
        const excelFilePath = "./Sales Report.xlsx";
        const pdfFilePath = "./Sales Report.pdf";
        await convertExcelToPDF(excelFilePath, pdfFilePath)
          .then(() => console.log("Excel converted to PDF successfully"))
          .catch((error) =>
            console.error("Error converting Excel to PDF:", error)
          );
        return res
          .status(200)
          .json({ message: "report generated.", data: report });
      } else {
        console.log("Error in salesReport function.");
        return res.status(500).json({ message: "Internal server error." });
      }
    } else {
      console.log("Error in salesReport function.");
      return res.status(500).json({ message: "Internal server error." });
    }
  } catch (error) {
    console.error("Error in salesReport function.", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

//@desc Job automation (cron-job)
//@route GET /repeatTask
//@access Private
export const assignCronJob: RequestHandler = async (req, res, next) => {
  try {
    const task = () => cronJob(task);
    return res
      .status(200)
      .json({ message: "The repeating task has been started." });
  } catch (error) {
    console.error("Error in cronJob function.", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

//@desc Mail automation test function
//@route GET /testMailAutomation
//@access Private
export const mailAutomation: RequestHandler = async (req, res, next) => {
  try {
    const { email } = req.query;
    //creating parameters for send mail service
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

    const task = async () =>
      await sendMail(email as string, subject, text, html);
    cronJob(task);
    return res
      .status(200)
      .json({ message: "Mail automation cron job has been started." });
  } catch (error) {
    console.error("Error in mail automation function.", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
