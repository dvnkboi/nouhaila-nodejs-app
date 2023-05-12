import { User } from "../Database/models/user.js";

export const manage = async (req, res, next) => {
  if (res.locals.user.privilege != 'admin') {
    res.redirect('/');
    return;
  }
  const users = (await User.getAll()).filter(user => user.email != res.locals.user.email);
  res.render('Admin.ejs', {
    users,
    user: res.locals.user,
  });
};

export const deleteUser = async (req, res, next) => {
  if (res.locals.user.privilege != 'admin') {
    res.redirect('/');
    return;
  }
  const email = req.body.email;
  await User.remove(email);
  res.redirect('/admin/manage');
};