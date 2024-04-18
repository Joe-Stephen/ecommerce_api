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
exports.getMyMoment = exports.updateUser = exports.getUserById = exports.resetPassword = exports.getAllProducts = exports.loginUser = exports.verifyOtp = exports.sendVerifyMail = exports.createUser = exports.serveGoogleSignPage = void 0;
const otpGenerator_1 = require("../services/otpGenerator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = __importDefault(require("../config/redis"));
const joi_1 = __importDefault(require("joi"));
//importing services
const sendMail_1 = require("../services/sendMail");
//importing DB queries
const dbQueries_1 = __importDefault(require("../services/dbQueries"));
const imageModel_1 = __importDefault(require("../product/imageModel"));
const dbQueries = new dbQueries_1.default();
//@desc google Auth with passport
//@route GET /
//@access Public
const serveGoogleSignPage = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.send('<a href="/auth/google">Authenticate with Google</a>');
    }
    catch (error) {
        res.send({
            success: false,
            message: "Error sending Google sign-in page!",
            error,
        });
    }
});
exports.serveGoogleSignPage = serveGoogleSignPage;
//@desc creating a new user
//@route POST /
//@access Public
const createUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { username, email, password, timeZone } = req.body;
        //validation using joi validator
        const schema = joi_1.default.object().keys({
            username: joi_1.default.string().alphanum().min(3).max(30).required(),
            email: joi_1.default.string()
                .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
                .required(),
            password: joi_1.default.string()
                .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
                .required(),
            timeZone: joi_1.default.string(),
        });
        if (schema.validate(req.body).error) {
            return res
                .status(400)
                .json({ message: (_a = schema.validate(req.body).error) === null || _a === void 0 ? void 0 : _a.details[0].message });
        }
        //checking for existing user
        const existingUser = yield dbQueries.findUserByEmail(email);
        if (existingUser) {
            console.log("This email is already registered.");
            return res
                .status(400)
                .json({ message: "This email is already registered." });
        }
        //hashing password
        yield bcrypt_1.default
            .genSalt(10)
            .then((salt) => __awaiter(void 0, void 0, void 0, function* () {
            return bcrypt_1.default.hash(password, salt);
        }))
            .then((hash) => __awaiter(void 0, void 0, void 0, function* () {
            //updating password and saving document
            const hashedPassword = hash;
            //user creation
            const user = yield dbQueries.createUser(username, email, hashedPassword, timeZone);
            if (!user) {
                console.log("Error in the create user function.");
                return res
                    .status(500)
                    .json({ message: "Error in the create user function." });
            }
            //setting user login details in redis
            yield redis_1.default.set(email, hashedPassword);
            return res
                .status(200)
                .json({ message: "User created successfully", data: user });
        }))
            .catch((err) => {
            console.log("Error in createUser's password hash section : ", err.message);
            return res
                .status(500)
                .json({ message: "Error happened in hashing the password." });
        });
    }
    catch (error) {
        console.error("Error in createUser function :", error);
        return res.status(500).json({
            message: "Unexpected error happened while creating your account.",
        });
    }
});
exports.createUser = createUser;
//@desc sending otp for email verification
//@route POST /sendOtp
//@access Public
const sendVerifyMail = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json("Please enter your email.");
        }
        console.log(`Received email= ${email}`);
        const existingUser = yield dbQueries.findUserByEmail(email);
        if (existingUser) {
            console.log("This email is already registered!");
            return res
                .status(400)
                .json({ message: "This email is already registered!" });
        }
        else {
            const otp = (0, otpGenerator_1.generateOtp)();
            const subject = "Register OTP Verification";
            const text = `Your OTP for verification is ${otp}`;
            //sending otp
            yield (0, sendMail_1.sendMail)(email, subject, text);
            const verificationDoc = yield dbQueries.createVerification(email, otp);
            console.log(`OTP has been saved to verifications : ${verificationDoc}`);
            console.log(`Otp has been sent to ${email}.`);
            return res.status(201).json("Otp has been sent to your email address.");
        }
    }
    catch (error) {
        console.error("Error in sendOtp function :", error);
        return res.status(500).json("Unexpected error happened while sending otp.");
    }
});
exports.sendVerifyMail = sendVerifyMail;
//@desc verifying otp
//@route POST /verify-otp
//@access Public
const verifyOtp = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { otpAttempt, email } = req.body;
        if (!otpAttempt || !email) {
            return res.status(400).json("Please enter your otp.");
        }
        console.log(`Received otp attempt= ${otpAttempt}`);
        console.log(`Received email= ${email}`);
        //checking for an existing user with the same email id
        const existingDoc = yield dbQueries.findVerificationByEmail(email);
        if (!existingDoc) {
            return res
                .status(400)
                .json({ message: "No document found with this email." });
        }
        if (otpAttempt === existingDoc.otp) {
            yield dbQueries.destroyVerificationByEmail(email);
            return res.status(200).json({ message: "Mail verified successfully." });
        }
        return res.status(400).json({ message: "Incorrect otp." });
    }
    catch (error) {
        console.error("Error in verifyOtp function :", error);
        return res
            .status(500)
            .json("Unexpected error happened while verifying otp.");
    }
});
exports.verifyOtp = verifyOtp;
//@desc logging in user
//@route POST /login
//@access Public
const loginUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            console.log("Please provide all the details.");
            return res
                .status(400)
                .json({ message: "Please provide all the details." });
        }
        // const user: User | null | undefined = await dbQueries.findUserByEmail(
        //   email
        // );
        let userPassword;
        //accessing user data from redis
        yield redis_1.default.get(email, (err, password) => {
            if (err) {
                console.error("Error happened while getting user data from redis :", err);
            }
            userPassword = password;
        });
        if (!userPassword) {
            console.log("No user found with this email!");
            return res
                .status(400)
                .json({ message: "No user found with this email!" });
        }
        if (userPassword && (yield bcrypt_1.default.compare(password, userPassword))) {
            const loggedInUser = {
                email: email,
                token: generateToken(email),
            };
            console.log("User logged in successfully");
            return res
                .status(201)
                .json({ message: "Login successfull", data: loggedInUser });
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
exports.loginUser = loginUser;
//@desc user getting all products
//@route GET /products
//@access Public
const getAllProducts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        var redisProducts = [];
        let allRedisProducts = [];
        const { page = 1, searchKey, sortType } = req.query;
        const count = 4;
        // const skip = (parseInt(page as string) - 1) * count;
        // const whereCondition: any = { isBlocked: false };
        // if (searchKey) whereCondition.name = { [Op.like]: `%${searchKey}%` };
        // const orderCondition: any = sortType
        //   ? [["selling_price", `${sortType}`]]
        //   : [];
        // const products: Product[] | [] | undefined =
        //   await dbQueries.findAllProductsWithFilter(
        //     count,
        //     skip,
        //     whereCondition,
        //     orderCondition
        //   );
        //getting product from redis
        let keys = [];
        function getAllKeys(cursor) {
            return __awaiter(this, void 0, void 0, function* () {
                const promises = [];
                yield redis_1.default.scan(cursor, "MATCH", "product_*", (err, reply) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        console.error("Error happened while getting user data from redis :", err);
                    }
                    const [newCursor, matchedKeys] = reply;
                    matchedKeys.forEach((key) => __awaiter(this, void 0, void 0, function* () {
                        const promise = new Promise((resolve, reject) => {
                            redis_1.default.get(key, (err, product) => {
                                if (err) {
                                    console.error("Error happened while getting user data from redis :", err);
                                }
                                else {
                                    redisProducts === null || redisProducts === void 0 ? void 0 : redisProducts.push(JSON.parse(product));
                                    resolve();
                                }
                            });
                        });
                        promises.push(promise);
                    }));
                    keys = keys.concat(matchedKeys);
                    if (newCursor !== "0") {
                        getAllKeys(newCursor);
                    }
                    else {
                        yield Promise.all(promises).then(() => __awaiter(this, void 0, void 0, function* () {
                            const promises = redisProducts.map((product) => __awaiter(this, void 0, void 0, function* () {
                                const images = yield imageModel_1.default.findAll({
                                    where: { productId: product.id },
                                    raw: true,
                                });
                                product.images = [...images];
                                allRedisProducts.push(product);
                                return product;
                            }));
                            yield Promise.all(promises);
                            //searching
                            if (searchKey) {
                                allRedisProducts = allRedisProducts.filter((product) => product.name.includes(searchKey));
                            }
                            //pagination
                            const paginated = allRedisProducts.slice(parseInt(page) * count, parseInt(page) * count + count);
                            //sorting
                            if (sortType && sortType === "DESC") {
                                paginated.sort((a, b) => b.selling_price - a.selling_price);
                            }
                            else if (sortType && sortType === "ASC") {
                                paginated.sort((a, b) => a.selling_price - b.selling_price);
                            }
                            return res.status(200).json({
                                message: "Products fetched successfully.",
                                data: paginated,
                            });
                        }));
                    }
                }));
            });
        }
        getAllKeys("0");
        // if (!products) {
        //   console.log("No products found.");
        //   return res.status(500).json({ message: "No products has been found." });
        // }
        // const allProducts = products.map((product: any) => {
        //   const imageUrls = product.Images.map((image: any) => image.image);
        //   return { ...product.toJSON(), Images: imageUrls };
        // });
        // return res.status(200).json({
        //   message: "Products fetched successfully.",
        //   data: products,
        // });
    }
    catch (error) {
        console.error("Error in finding all products function:", error);
        return res.status(400).json({ message: "Couldn't load all products." });
    }
});
exports.getAllProducts = getAllProducts;
//JWT generator function
const generateToken = (email) => {
    return jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "1d",
    });
};
//@desc user changing password
//@route PATCH /resetPassword
//@access Private
const resetPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body.user;
        const { password } = req.body;
        const user = yield dbQueries.findUserByEmail(email);
        if (!user) {
            console.log("No user found with this email!");
            return res
                .status(400)
                .json({ message: "No user found with this email!" });
        }
        //hashing password
        yield bcrypt_1.default
            .genSalt(10)
            .then((salt) => __awaiter(void 0, void 0, void 0, function* () {
            return bcrypt_1.default.hash(password, salt);
        }))
            .then((hash) => __awaiter(void 0, void 0, void 0, function* () {
            //updating password and saving document
            user.password = hash;
            yield user.save();
            return res
                .status(200)
                .json({ message: "Password changed successfully." });
        }))
            .catch((err) => console.error("Error in resetPassword : ", err.message));
    }
    catch (error) {
        console.error("Error changing password :", error);
        return res.status(400).json({ message: "Error changing password." });
    }
});
exports.resetPassword = resetPassword;
//get user by id
//@desc Getting user details by id
//@route GET /me
//@access Private
const getUserById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        if (!id) {
            console.log("No user id received in params.");
            return res.status(400).json({ message: "Please provide a user id." });
        }
        if (typeof id === "string") {
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
//@desc Updating user details
//@route PUT /:id
//@access Private
const updateUser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const { id } = req.params;
        const { username, email, password, timeZone } = req.body;
        //validation using joi-validator
        const schema = joi_1.default.object().keys({
            username: joi_1.default.string().alphanum().min(3).max(30).required(),
            email: joi_1.default.string()
                .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } })
                .required(),
            password: joi_1.default.string()
                .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
                .required(),
            timeZone: joi_1.default.string(),
        });
        if (schema.validate(req.body).error) {
            return res
                .status(400)
                .json({ message: (_b = schema.validate(req.body).error) === null || _b === void 0 ? void 0 : _b.details[0].message });
        }
        if (typeof id === "string") {
            const existingUser = yield dbQueries.checkForDuplicateUser(email, parseInt(id, 10));
            if (existingUser) {
                return res
                    .status(400)
                    .json({ message: "A product with this name already exists." });
            }
            //hashing password
            yield bcrypt_1.default
                .genSalt(10)
                .then((salt) => __awaiter(void 0, void 0, void 0, function* () {
                return bcrypt_1.default.hash(password, salt);
            }))
                .then((hash) => __awaiter(void 0, void 0, void 0, function* () {
                //updating password and saving document
                yield dbQueries.updateUserById(parseInt(id), username, email, hash, timeZone);
                const updatedUser = yield dbQueries.findUserById(parseInt(id, 10));
                return res
                    .status(200)
                    .json({ message: "User updated successfully.", data: updatedUser });
            }))
                .catch((err) => console.error("Error in updateUser : ", err.message));
        }
    }
    catch (error) {
        console.error("Error in updateUser function.", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
exports.updateUser = updateUser;
//user test functions
//@desc Test function for user
//@route GET /moment
//@access Private
const getMyMoment = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const test = yield dbQueries.test(username, password);
        console.log("test : ", test);
        return res
            .status(200)
            .json({ message: "Test created successfully.", data: test });
    }
    catch (error) {
        console.error("Error in getMyMoment function.", error);
        res.status(500).json({ message: "Internal server error." });
    }
});
exports.getMyMoment = getMyMoment;
