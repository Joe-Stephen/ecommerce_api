import otpGenerator from "otp-generator";

export const generateOtp = () => {
  try {
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      specialChars: false,
    });
    return otp;
  } catch (error) {
    console.error("Error while generating otp : ", error);
  }
};
