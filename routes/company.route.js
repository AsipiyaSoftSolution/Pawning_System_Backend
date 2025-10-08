import express from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { checkUserBranchAccess } from "../middlewares/branch.middlware.js";
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
  createBranch,
  getAllBranches,
  assignUserToBranch,
  getBranchData,
  updateCustomerNumberFormat,
  updatePawningTicketNumberFormat,
  getPawningTicketFormat,
  createArticleCondition,
  getArticlesConditions,
  updateArticleCondition,
  deleteArticleCondition,
  getAllUsersForTheBranch,
  updateUser,
  createTESTUser,
  getAllPrivilages,
  creteDesignationWithPrivilages,
  getDesignationsWithPrivilages,
  updateDesignationWithPrivilages,
  deleteDesignationWithPrivilages,
} from "../controllers/company.controller.js";
const route = express.Router();

route.get("/", protectedRoute, getCompanyDetails); // Get company details
route.get("/privileges", protectedRoute, getAllPrivilages); // Get all privileges that can be assigned to designations
route.post(
  "/designation-with-privileges",
  protectedRoute,
  creteDesignationWithPrivilages
); // create designation with privileges
route.get("/designations", protectedRoute, getDesignationsWithPrivilages); // Get all designations of the company with privileges
route.patch(
  "/designation/:designationId",
  protectedRoute,
  updateDesignationWithPrivilages
); // Update designation and its privileges by ID
route.delete(
  "/designation/:designationId",
  protectedRoute,
  deleteDesignationWithPrivilages
); // Delete designation and its privileges by ID
route.post("/article-type", protectedRoute, createArticleType); // Create article type
route.get("/article-types", protectedRoute, getArticleTypes); // Get all article types
route.patch("/article-type/:id", protectedRoute, updateArticleType); // Update article type by ID
route.delete("/article-type/:id", protectedRoute, deleteArticleType); // Delete article type by ID
route.post("/article-category", protectedRoute, createArticleCategory); // Create article category
route.patch("/article-category/:id", protectedRoute, updateArticleCategory); // Update article category by ID
route.delete("/article-category/:id", protectedRoute, deleteArticleCategory); // Delete article category by ID
route.get("/article-categories/:id", protectedRoute, getArticleCategories); // Get all article categories
route.post("/user", protectedRoute, createUser); // Create a new user
route.get(
  "/:branchId/users",
  protectedRoute,
  checkUserBranchAccess,
  getAllUsersForTheBranch
); // Get all users assigned to the branch of the logged-in user
route.patch("/user/:id", protectedRoute, updateUser); // Update user by ID (assign/revoke branch, designation, status)
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
route.get("/pawning-ticket-format", protectedRoute, getPawningTicketFormat);
route.post("/article-condition", protectedRoute, createArticleCondition); // Create article condition
route.get("/article-conditions", protectedRoute, getArticlesConditions); // Get all article conditions
route.patch("/article-condition/:id", protectedRoute, updateArticleCondition); // Update article condition by ID
route.delete("/article-condition/:id", protectedRoute, deleteArticleCondition); // Delete article condition by ID

// TEST USER - to be removed in production
route.post("/create-test-user", createTESTUser); // Create a test user

export default route;
