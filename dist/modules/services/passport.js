"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
passport_1.default.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: process.env.GOOGLE_REDIRECT_URI,
    passReqToCallback: true
}, function (request, accessToken, refreshToken, profile, done) {
    console.log("user profile == ", profile);
    done(null, profile);
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return done(err, user);
    // });
}));
passport_1.default.serializeUser((user, done) => {
    done(null);
});
passport_1.default.deserializeUser((user, done) => {
    done(null);
});
