import { config } from 'dotenv';
import jwt from 'jsonwebtoken';

import { User } from '../Database/models/user.js';

config();
const TOKEN_SECRET = process.env.TOKEN_SECRET;


//middleware
export const authenticateToken = (req, res, next) => {
  const token = req.body.token ||
    req.query.token ||
    req.headers['x-access-token'] ||
    req.cookies.token;

  if (token == null) res.redirect('/auth/login');

  jwt.verify(token, TOKEN_SECRET, async (err, payload) => {
    if (err) {
      if (!res.headersSent) res.redirect('/auth/login');
      return;
    }
    res.locals.user = await User.get(payload.email);
    next();
  });
};

export const login = async (req, res, next) => {
  let { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.get(email);
  } catch {
    const error = new Error("Error! Something went wrong.");
    return next(error);
  }

  if (!existingUser) {
    const error = Error("Wrong details please check again");
    return next(error);
  }

  const passwordValid = await existingUser.checkPassword(password, existingUser.password);
  if (!passwordValid) {
    const error = Error("Wrong details please check again");
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      { email },
      TOKEN_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    console.log(err);
    const error = new Error("Error! Something went wrong.");
    return next(error);
  }

  res.cookie('token', token, { expires: new Date(Date.now() + 1000 * 60 * 60), httpOnly: true });

  if (existingUser.privilege == 'admin')
    res.redirect('/admin/manage');
  else
    res.redirect('/user/profile');
};

//register
export const register = async (req, res, next) => {
  let { email, password, name, age, phone } = req.body;

  let existingUser;
  try {
    existingUser = await User.exists(email);
  } catch {
    const error = new Error("Error! Something went wrong.");
    return next(error);
  }
  if (existingUser) {
    const error = new Error("User already exists");
    return next(error);
  }

  const createdUser = new User(email, password, name, age, phone);

  try {
    await createdUser.save();
  }
  catch (err) {
    console.log(err);
    const error = new Error("Error! Something went wrong.");
    return next(error);
  }

  let token;
  try {
    //Creating jwt token
    token = jwt.sign(
      { email },
      TOKEN_SECRET,
      { expiresIn: "1h" }
    );
  }
  catch (err) {
    console.log(err);
    const error = new Error("Error! Something went wrong.");
    return next(error);
  }

  //Setting cookie that will expire in 1 hour
  res.cookie('token', token, { expires: new Date(Date.now() + 1000 * 60 * 60), httpOnly: true });

  if (createdUser.privilege == 'admin')
    res.redirect('/admin/manage');
  else
    res.redirect('/user/profile');
};


export const logout = (req, res, next) => {
  res.cookie('token', '', { expires: new Date(), httpOnly: true });
  res.redirect('/');
};