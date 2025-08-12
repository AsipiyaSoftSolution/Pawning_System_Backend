import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";

const router = express.Router();

router.post("/", protectedRoute, createCustomer);         // POST /api/customer/
router.put("/:id", protectedRoute, updateCustomer);       // PUT /api/customer/:id
router.delete("/:id", protectedRoute, deleteCustomer);    // DELETE /api/customer/:id

export default router;
