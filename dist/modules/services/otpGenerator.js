"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
const otp_generator_1 = __importDefault(require("otp-generator"));
const generateOtp = () => {
    try {
        const otp = otp_generator_1.default.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
        });
        return otp;
    }
    catch (error) {
        console.error("Error while generating otp : ", error);
    }
};
exports.generateOtp = generateOtp;
