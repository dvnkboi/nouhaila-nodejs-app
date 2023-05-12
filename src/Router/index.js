import { Router } from 'express';
import { login, logout, register } from '../Auth/index.js';
import { login as loginView, register as registerView } from '../Controllers/AuthController.js';
import { profile, update } from '../Controllers/UserController.js';
import { deleteUser, manage } from '../Controllers/AdminController.js';

export const authRouter = Router();

authRouter
  .route('/login')
  .get(loginView)
  .post(login);

authRouter
  .route('/register')
  .get(registerView)
  .post(register);

authRouter.
  route('/logout')
  .get(logout)
  .post(logout);


export const userRouter = Router();

userRouter
  .route('/profile')
  .get(profile);

userRouter
  .route('/update')
  .post(update);


export const adminRouter = Router();

adminRouter
  .route('/manage')
  .get(manage);

adminRouter
  .route('/delete')
  .post(deleteUser);