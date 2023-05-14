import { config } from "dotenv";
import { page } from "../utils/expressUtils.js";

config();
const validatePasswords = process.env.VALIDATE_PASSWORDS == "true" ? true : false;

const login = (req, res, next) => {
  res.sendFile(page('Login'));
};

const register = (req, res, next) => {
  res.render('Register.ejs', {
    validatePasswords
  });
};

export { login, register };