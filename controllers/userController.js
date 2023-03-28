const User = require("../models/userModel");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const { google } = require("googleapis");
const jwt = require("jsonwebtoken");
const sendMail = require("./sendMail");
const { default: mongoose } = require("mongoose");
const { CLIENT_URL } = process.env;
const { OAuth2 } = google.auth;
const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID);

const userController = {
  //Register User

  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password)
        return res.status(400).json({ message: "Please fill all fields" });
      if (!validateEmail(email))
        return res.status(400).json({ message: "Please enter valid email!" });
      const user = await User.findOne({ email });
      if (user)
        return res.status(400).json({ message: "Email Already Exist!" });
      if (password.length < 6)
        return res
          .status(400)
          .json({ message: "Password must be atleast 6 characters." });

      const passwordHash = await bcrypt.hash(password, 12);
      const newUser = {
        name,
        email,
        password: passwordHash,
      };
      const activation_token = createActivationToken(newUser);
      const url = `${CLIENT_URL}/user/activate/${activation_token}`;
      sendMail(email, url);
      res.send({
        message: activation_token,
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  //Activate Email

  activateEmail: async (req, res) => {
    try {
      const { activation_token } = req.body;
      const user = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET
      );

      const { name, email, password } = user;

      const check = await User.findOne({ email });
      if (check)
        return res.status(400).json({ message: "This email already exists." });

      const newUser = new User({
        name,
        email,
        password,
      });

      await newUser.save();

      res.json({ message: "Account has been activated!" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  //User Login

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user)
        return res.status(400).json({ message: "This email does not exist." });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Password is incorrect." });

      const refresh_token = createRefreshToken({ id: user._id });
      res.cookie("refreshtoken", refresh_token, {
        httpOnly: true,
        path: "/user/refresh_token",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ user: user, token: refresh_token });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  //Get Access Token

  getAccessToken: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token)
        return res.status(400).json({ message: "Please login now!" });

      jwt.verify(rf_token, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(400).json({ message: "Please login now!" });

        const access_token = createAccessToken({ id: user.id });
        res.json({ access_token });
      });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  //Forgot Password

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user)
        return res.status(400).json({ message: "This email does not exist." });

      const access_token = createAccessToken({ id: user._id });
      const url = `${CLIENT_URL}/user/reset/${access_token}`;

      sendMail(email, url, "Reset your password");
      res.json({ message: "Re-send the password, please check your email." });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  //Update Password

  resetPassword: async (req, res) => {
    try {
      const { password } = req.body;
      console.log(password);
      const passwordHash = await bcrypt.hash(password, 12);

      await User.findOneAndUpdate(
        { _id: req.user.id },
        {
          password: passwordHash,
        }
      );

      res.json({ message: "Password successfully changed!" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  getUserInfor: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");

      res.json(user);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  getUserInfoById: async (req, res) => {
    try {
      const user = await User.findById({ _id: ObjectId(req.params.id) })
        .select("-password")
        .exec();
      res.status(200).send({ message: user });
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  },

  getUsersAllInfor: async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.status(200).send({ users });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/user/refresh_token" });
      return res.json({ message: "Logged out." });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { name, avatar } = req.body;
      await User.findOneAndUpdate(
        { _id: req.user.id },
        {
          name,
          avatar,
        }
      );

      res.json({ message: "Update Success!" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  updateUsersRole: async (req, res) => {
    try {
      const { role } = req.body;

      await User.findOneAndUpdate(
        { _id: req.params.id },
        {
          role,
        }
      );

      res.json({ message: "Update Success!" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);

      res.json({ message: "Deleted Success!" });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  },
};

const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

const createActivationToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: "5m",
  });
};
const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: "15m",
  });
};
const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.ACTIVATION_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};
module.exports = userController;
