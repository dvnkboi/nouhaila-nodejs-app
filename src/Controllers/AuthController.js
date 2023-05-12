import { page } from "../utils/expressUtils.js";

const login = (req, res, next) => {
  res.sendFile(page('Login'));
};

const register = (req, res, next) => {
  res.sendFile(page('Register'));
};

export { login, register };