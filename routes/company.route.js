import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import {
  getCompanyDetails,
  creteDesignation,
  assignPrivileges,
  getDesignationPrivileges,
  getDesignations,
  createArticleType,
  getArticleTypes,
  updateArticleType,
  deleteArticleType,
  createArticleCategory,
  updateArticleCategory,
  deleteArticleCategory,
  getArticleCategories,
  createUser,
  getAllUsers,
  createBranch,
  getAllBranches,
  assignUserToBranch,
  getBranchData,
  updateCustomerNumberFormat,
  updatePawningTicketNumberFormat,
  createArticleCondition,
  getArticlesConditions,
  updateArticleCondition,
  deleteArticleCondition,
} from "../controllers/company.controller.js";
const route = express.Router();

route.get("/", protectedRoute, getCompanyDetails); // Get company details
route.post("/designation", protectedRoute, creteDesignation); // create new designation
route.get("/designations", protectedRoute, getDesignations); // Get all designations of the company
route.get("/designation/privileges", protectedRoute, getDesignationPrivileges); // Get privileges that can be assigned to designations
route.post("/designation", protectedRoute, creteDesignation); // Create new designation
route.post("/designation/privileges", protectedRoute, assignPrivileges); // Assign privileges to a designation
route.post("/article-type", protectedRoute, createArticleType); // Create article type
route.get("/article-types", protectedRoute, getArticleTypes); // Get all article types
route.patch("/article-type/:id", protectedRoute, updateArticleType); // Update article type by ID
route.delete("/article-type/:id", protectedRoute, deleteArticleType); // Delete article type by ID
route.post("/article-category", protectedRoute, createArticleCategory); // Create article category
route.patch("/article-category/:id", protectedRoute, updateArticleCategory); // Update article category by ID
route.delete("/article-category/:id", protectedRoute, deleteArticleCategory); // Delete article category by ID
route.get("/article-categories/:id", protectedRoute, getArticleCategories); // Get all article categories
route.get("/users", protectedRoute, getAllUsers); // Get all users of the company
route.post("/user", protectedRoute, createUser); // Create a new user
route.post("/branch", protectedRoute, createBranch); // Create a new branch
route.get("/branches", protectedRoute, getAllBranches); // Get all branches of the company
route.post("/user/assign-to-branch", protectedRoute, assignUserToBranch); // Assign users to branches
route.get("/branch/:id", protectedRoute, getBranchData); // Get branch data by ID (for users that have assigned to specific branch)
route.patch(
  "/update-customer-no-format",
  protectedRoute,
  updateCustomerNumberFormat
); // Update customer and pawning ticket number formats for the company
route.patch(
  "/update-pawning-ticket-no-format",
  protectedRoute,
  updatePawningTicketNumberFormat
); // Update pawning ticket number format for the company
route.post("/article-condition", protectedRoute, createArticleCondition); // Create article condition
route.get("/article-conditions", protectedRoute, getArticlesConditions); // Get all article conditions
route.patch("/article-condition/:id", protectedRoute, updateArticleCondition); // Update article condition by ID
route.delete("/article-condition/:id", protectedRoute, deleteArticleCondition); // Delete article condition by ID

export default route;
