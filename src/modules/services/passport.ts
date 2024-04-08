import passport from "passport";
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
import dotenv from "dotenv";
dotenv.config();

passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_SECRET,
    callbackURL:process.env.GOOGLE_REDIRECT_URI,
    passReqToCallback   : true
  },
  function(request:any, accessToken:any, refreshToken:any, profile:any, done:any) {
    console.log("user profile == ", profile)
    done(null, profile)
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return done(err, user);
    // });
  }
));

passport.serializeUser((user, done)=>{
  done(null)
})

passport.deserializeUser((user, done)=>{
  done(null)
})