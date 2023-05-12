import { User } from "../Database/models/user.js";

export const profile = (req, res, next) => {
  const user = res.locals.user;
  res.render('User.ejs', {
    name: user.name,
    email: user.email,
    age: user.age,
    phone: user.phone,
    password: user.password,
    user: res.locals.user,
  });
};

export const update = async (req, res, next) => {
  const user = res.locals.user;
  const { name, email, age, phone } = req.body;
  const updatedUser = new User(email, user.password);
  updatedUser.name = name;
  updatedUser.age = age;
  updatedUser.phone = phone;
  updatedUser.privilege = user.privilege;
  if (updatedUser.password.trim() != '') {
    updatedUser.password = user.password;
  }
  await updatedUser.save();
  res.render('User.ejs', {
    name: user.name,
    email: user.email,
    age: user.age,
    phone: user.phone,
    password: user.password,
    user: updatedUser,
  });
};