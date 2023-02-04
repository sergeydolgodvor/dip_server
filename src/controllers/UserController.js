const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const client = new OAuth2(process.env.MAILING_SERVICE_CLIENT_ID);

const UserModel = require('../models/UserModel');
const sendMail = require('./SendMail');

const validateEmail = require('../utils/validations/register');
const {
  createActivationToken,
  createRefreshToken,
  createAccessToken,
} = require('../utils/token');
const generateHashPassword = require('../utils/generateHashPassword');

const { CLIENT_URL } = process.env;

const UserController = {
  // Register
  register: async (req, res) => {
    try {
      const { name, email, password, phone, faculty, position } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          message: 'Please fill in all fields.',
        });
      }

      if (!validateEmail(req.body)) {
        return res.status(400).json({
          msg: 'Invalid email.',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          message: 'Password must be at least 6 characters.',
        });
      }

      // if (password !== passwordVerify) {
      //   return res.status(400).json({
      //     errorMessage: 'Please enter the same password twice.',
      //   });
      // }

      const user = await UserModel.findOne({ email });
      if (user) {
        return res.status(400).json({
          msg: 'This email already exists.',
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = {
        name,
        email,
        password: passwordHash,
        phone,
        faculty,
        position,
      };

      const activation_token = createActivationToken(newUser);

      const url = `${CLIENT_URL}/user/activate/${activation_token}`;
      sendMail(email, url, 'Подтвердите свой Email');

      res.json({
        msg: 'Регистрация прошла успешно. Проверьте свой Email.',
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message,
      });
    }
  },

  // Activate account
  activateEmail: async (req, res) => {
    try {
      const { activation_token } = req.body;
      const user = jwt.verify(
        activation_token,
        process.env.ACTIVATION_TOKEN_SECRET
      );

      const { name, email, password, phone, faculty, position } = user;

      const check = await UserModel.findOne({ email });
      if (check) {
        return res.status(400).json({ msg: 'Этот email уже существует.' });
      }

      const newUser = new UserModel({
        name,
        email,
        password,
        phone,
        faculty,
        position,
      });

      await newUser.save();

      res.json({
        msg: 'Аккаунт был активирован!',
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // Login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Email не найден.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Неверный пароль.' });
      }

      const refresh_token = createRefreshToken({ id: user._id });
      res.cookie('refreshtoken', refresh_token, {
        httpOnly: true,
        path: '/user/refresh_token',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        msg: 'Авторизирован!',
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // Get access token
  getAccessToken: (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken;
      if (!rf_token) {
        return res.status(400).json({ msg: 'Войдите, пожалуйста!' });
      }

      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET,
        (err, user) => {
          if (err) {
            return res.status(400).json({ msg: 'Войдите, пожалуйста!' });
          }

          const access_token = createAccessToken({
            id: user.id,
          });
          res.json({
            access_token,
          });
        }
      );
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // Forgot password
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res.status(400).json({ msg: 'Email не существует.' });
      }

      const access_token = createAccessToken({ id: user._id });
      const url = `${CLIENT_URL}/user/reset/${access_token}`;

      sendMail(email, url, 'Восстановить пароль');
      res.json({
        msg: 'Пароль отправлен, проверьте email.',
      });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { password } = req.body;
      const passwordHash = await bcrypt.hash(password, 12);

      await UserModel.findOneAndUpdate(
        { _id: req.user.id },
        {
          password: passwordHash,
        }
      );

      res.json({ msg: 'Пароль успешно изменен!' });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get user info
  getUserInfo: async (req, res) => {
    try {
      const user = await UserModel.findById(req.user.id).select(
        '-password'
      );

      res.json(user);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Get all user info with Admin
  getUsersAllInfo: async (req, res) => {
    try {
      const user = await UserModel.find().select('-password');

      res.json(user);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Logout
  logout: async (req, res) => {
    try {
      res.clearCookie('refreshtoken', { path: '/user/refresh_token' });
      return res.json({ msg: 'Logged out.' });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // User update
  updateUser: async (req, res) => {
    try {
      const { name, avatar, faculty, position } = req.body;
      await UserModel.findOneAndUpdate(
        { _id: req.user.id },
        {
          name,
          avatar,
          faculty,
          position,
        }
      );

      res.json({ msg: 'Обновлено!' });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // Update user role
  updateUserRole: async (req, res) => {
    try {
      const { role } = req.body;

      await UserModel.findOneAndUpdate(
        { _id: req.params.id },
        {
          role,
        }
      );

      res.json({ msg: 'Обновлено!' });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // Update user editDB
  updateUserEditDB: async (req, res) => {
    try {
      const { editDB } = req.body;

      await UserModel.findOneAndUpdate(
        { _id: req.params.id },
        {
          editDB,
        }
      );

      res.json({ msg: 'Обновлено!' });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // Update user readDB
  updateUserReadDB: async (req, res) => {
    try {
      const { readDB } = req.body;

      await UserModel.findOneAndUpdate(
        { _id: req.params.id },
        {
          readDB,
        }
      );

      res.json({ msg: 'Обновлено!' });
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const user = await UserModel.findByIdAndDelete(req.params.id);

      if (!user) {
        res.status(500).json({ msg: 'User not found!' });
      } else {
        res.json({ msg: 'Deleted Success!' });
      }
    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  },

  // Google login
  googleLogin: async (req, res) => {
    try {
      const { tokenId } = req.body;

      const verify = await client.verifyIdToken({
        idToken: tokenId,
        audience: process.env.MAILING_SERVICE_CLIENT_ID,
      });

      const { email_verified, email, name, picture } = verify.payload;

      const password = email + process.env.GOOGLE_SECRET;

      const passwordHash = await bcrypt.hash(password, 12);

      if (!email_verified) {
        return res.status(400).json({ msg: 'Email verification failed.' });
      }

      const user = await UserModel.findOne({ email });

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ msg: 'Password is incorrect.' });
        }

        const refresh_token = createRefreshToken({ id: user._id });
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: 'Авторизирован!' });
      } else {
        const newUser = new UserModel({
          name,
          email,
          password: passwordHash,
          avatar: picture,
        });

        await newUser.save();

        const refresh_token = createRefreshToken({ id: newUser._id });
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: 'Авторизирован!' });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  // Facebook login
  facebookLogin: async (req, res) => {
    try {
      const { accessToken, userID } = req.body;

      const URL = `https://graph.facebook.com/v2.9/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`;

      const data = await fetch(URL)
        .then((res) => res.json())
        .then((res) => {
          return res;
        });

      const { email, name, picture } = data;

      const password = email + process.env.FACEBOOK_SECRET;

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await UserModel.findOne({ email });

      if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ msg: 'Password is incorrect.' });
        }

        const refresh_token = createRefreshToken({ id: user._id });
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: 'Авторизирован!' });
      } else {
        const newUser = new UserModel({
          name,
          email,
          password: passwordHash,
          avatar: picture.data.url,
        });

        await newUser.save();

        const refresh_token = createRefreshToken({ id: newUser._id });
        res.cookie('refreshtoken', refresh_token, {
          httpOnly: true,
          path: '/user/refresh_token',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ msg: 'Авторизирован!' });
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = UserController;
