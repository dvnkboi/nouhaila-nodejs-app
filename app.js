import Express from "express";
import { urlencoded, static as staticRoute } from "express";
import { adminRouter, authRouter, userRouter } from "./src/Router/index.js";
import cookieParser from "cookie-parser";
import { authenticateToken } from "./src/Auth/index.js";
import { getPublicPath } from "./src/utils/expressUtils.js";
import { renderFile } from "ejs";
import { error as errorMiddleware } from "./src/Controllers/ErrorController.js";


export const app = Express();

app.use(urlencoded({
  extended: true,
}));
app.use(cookieParser());

app.set('view engine', 'html');
app.engine('html', renderFile);
app.set('views', getPublicPath());
app.use(staticRoute(getPublicPath()));

app.get("/", (req, res) => {
  res.redirect("/user/profile");
});

app.use((req, res, next) => {
  console.log(Date.now(), req.url);
  next();
});

app.use("/auth", authRouter);

app.use(authenticateToken);

app.use('/user', userRouter);

app.use('/admin', adminRouter);

app.use(errorMiddleware);
