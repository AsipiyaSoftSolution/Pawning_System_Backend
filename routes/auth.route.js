import express from "express";
import {
  login,
  logout,
  checkAuth,
  forgetPassword,
} from "../controllers/auth.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";
const route = express.Router();

route.post("/login", login);
route.post("/logout", logout);
route.get("/check-auth", protectedRoute, checkAuth); // Protected route to check authentication and return user info if local storage is cleared
route.post("/forget-password", forgetPassword);
export default route;
