import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

//importing db queries
import DBQueries from "../services/dbQueries";
const dbQueries = new DBQueries();

const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    //get token from the header
    const token = req.headers.authorization!.split(" ")[1];
    //verify token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    //get user from the token
    const user = await dbQueries.findUserByEmail(decoded.email);
    //setting user timezone in req.body.user
    decoded.timeZone = user?.timeZone;
    req.body.user = decoded;
    if (!user) {
      console.log("No user found with this email address!");
      return res
        .status(500)
        .json({ message: "No user found with this email address!" });
    }
    if (user?.isBlocked) {
      console.log("No access, user is currently blocked!");
      return res
        .status(401)
        .json({ message: "Access denied, your account is currently blocked!" });
    }
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime > decoded.exp) {
      console.log("Token has been expired!");
      return res
        .status(401)
        .json({ message: "Your token has been expired, please login again." });
    } else {
      next();
    }
  } catch (error) {
    console.log("Not authorized! :", error);
    return res.status(401).json({ message: "Not authorized!" });
  }
};

export default verifyUser;
