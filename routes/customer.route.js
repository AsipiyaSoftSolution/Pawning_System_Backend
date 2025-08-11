import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { createCustomer } from "../controllers/customer.controller.js";

const router = express.Router();

router.post("/customer", protectedRoute, createCustomer); // Create a new customer

export default router;
