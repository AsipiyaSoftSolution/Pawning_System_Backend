import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import bcrypt from "bcrypt";

// Get COmpany Details
export const getCompanyDetails = async (req, res, next) => {
  try {
    const [companyData] = await pool.query(
      "SELECT * FROM company WHERE idCompany = ?",
      [req.companyId]
    );
    if (!companyData[0]) {
      return next(errorHandler(404, "Company not found"));
    }

    console.log("Company details fetched successfully:", companyData[0]);
    res.status(200).json({
      message: "Company details fetched successfully",
      company: companyData[0],
    });
  } catch (error) {
    console.error("Error fetching company details:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Create new Designation
export const creteDesignation = async (req, res, next) => {
  try {
    const { designation } = req.body;
    if (!designation) {
      return next(errorHandler(400, "Designation name is required"));
    }

    const [result] = await pool.query(
      "INSERT INTO designation (Description,Company_idCompany) VALUES (?,?)",
      [designation, req.companyId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create designation"));
    }

    const [designationData] = await pool.query(
      "SELECT * FROM designation WHERE idDesignation = ?",
      [result.insertId]
    );

    if (!designationData[0]) {
      return next(errorHandler(404, "Created Designation not found"));
    }

    res.status(201).json({
      message: "Designation created successfully",
      designation: designationData[0],
    });
  } catch (error) {
    console.error("Error creating designation:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get Designations of the company
export const getDesignations = async (req, res, next) => {
  try {
    let designations;
    let designationPrivilages;
    let privilages;
    [designations] = await pool.query(
      "SELECT * FROM designation WHERE Company_idCompany = ?",
      [req.companyId]
    );

    if (designations.length === 0) {
      return next(errorHandler(404, "No designations found for this company"));
    }

    for (let designation of designations) {
      [designationPrivilages] = await pool.query(
        "SELECT * FROM designation_has_user_privilages WHERE Designation_idDesignation = ?",
        [designation.idDesignation]
      );

      for (let privilage of designationPrivilages) {
        [privilages] = await pool.query(
          "SELECT * FROM user_privilages WHERE idUser_Privilages = ?",
          [privilage.User_Privilages_idUser_Privilages]
        );
        designation.Privilages = [
          ...(designation.Privilages || []),
          privilages[0],
        ];
      }
    }

    res.status(200).json({
      message: "Designations fetched successfully",
      designations,
    });
  } catch (error) {
    console.error("Error fetching designations:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get Designation Privileges
export const getDesignationPrivileges = async (req, res, next) => {
  try {
    const [privileges] = await pool.query("SELECT * FROM user_privilages ");

    if (privileges.length === 0) {
      return next(errorHandler(404, "No privileges found !"));
    }

    res.status(200).json({
      message: "Privileges fetched successfully",
      privileges,
    });
  } catch (error) {
    console.error("Error fetching designation privileges:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Assign privileges to Designation
export const assignPrivileges = async (req, res, next) => {
  try {
    const { idDesignation, idUser_privilages } = req.body;
    if (!idDesignation || !idUser_privilages) {
      return next(
        errorHandler(400, "Designation ID and Privilege ID are required")
      );
    }

    const [result] = await pool.query(
      "INSERT INTO designation_has_user_privilages (Designation_idDesignation, User_Privilages_idUser_Privilages,Last_Updated_User,Last_Updated_Time) VALUES (?, ?,?, NOW())",
      [idDesignation, idUser_privilages, req.userId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to assign privileges"));
    }

    res.status(201).json({
      message: "Privileges assigned successfully",
    });
  } catch (error) {
    console.error("Error assigning privileges:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// create new article types
export const createArticleType = async (req, res, next) => {
  try {
    const { articleName } = req.body;
    if (!articleName) {
      return next(errorHandler(400, "Article type name is required"));
    }

    const [existingArticle] = await pool.query(
      "SELECT * FROM article_types WHERE Description LIKE ? AND Company_idCompany = ?",
      [articleName, req.companyId]
    );

    if (existingArticle.length > 0) {
      return next(errorHandler(400, "Article type already exists"));
    }

    const [result] = await pool.query(
      "INSERT INTO article_types (Description, Company_idCompany,created_at) VALUES (?, ?, now())",
      [articleName, req.companyId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create article type"));
    }

    const [articleTypeData] = await pool.query(
      "SELECT * FROM article_types WHERE idArticle_Types = ?",
      [result.insertId]
    );

    if (!articleTypeData[0]) {
      return next(errorHandler(404, "Created article type not found"));
    }

    res.status(201).json({
      message: "Article type created successfully",
      articleType: articleTypeData[0],
    });
  } catch (error) {
    console.error("Error creating article type:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get all article types
export const getArticleTypes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    // Get total count for pagination
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM article_types WHERE Description LIKE ? AND Company_idCompany = ?",
      [`%${search}%`, req.companyId]
    );
    const totalRecords = countResult[0].total;

    // Get paginated data
    const [articleTypes] = await pool.query(
      "SELECT * FROM article_types WHERE Description LIKE ? AND Company_idCompany = ? LIMIT ? OFFSET ?",
      [`%${search}%`, req.companyId, limit, offset]
    );

    if (articleTypes.length === 0) {
      return next(errorHandler(404, "No article types found"));
    }

    // Pagination metadata
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      message: "Article types fetched successfully",
      articleTypes,
      pagination: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    });
  } catch (error) {
    console.error("Error fetching article types:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Update article type by ID
export const updateArticleType = async (req, res, next) => {
  try {
    const idArticleType = req.params.id;
    const { articleName } = req.body;

    if (!idArticleType) {
      return next(errorHandler(400, "Article type ID is required"));
    }
    if (!articleName) {
      return next(errorHandler(400, "Article type name is required"));
    }

    const [existingArticle] = await pool.query(
      "SELECT * FROM article_types WHERE idArticle_Types = ? AND Company_idCompany = ? ",
      [idArticleType, req.companyId]
    );

    if (existingArticle.length === 0) {
      return next(errorHandler(404, "Article is not found to update"));
    }

    const [result] = await pool.query(
      "UPDATE article_types SET Description = ?, updated_at = NOW() WHERE idArticle_Types = ? ",
      [articleName, existingArticle[0].idArticle_Types]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update article type"));
    }

    const [updatedArticleType] = await pool.query(
      "SELECT * FROM article_types WHERE idArticle_Types = ?",
      [existingArticle[0].idArticle_Types]
    );

    if (!updatedArticleType[0]) {
      return next(errorHandler(404, "Updated article type not found"));
    }

    res.status(200).json({
      message: "Article type updated successfully",
      articleType: updatedArticleType[0],
    });
  } catch (error) {
    console.error("Error updating article type:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Delete article type by ID
export const deleteArticleType = async (req, res, next) => {
  try {
    const idArticleType = req.params.id;
    if (!idArticleType) {
      return next(errorHandler(400, "Article type ID is required"));
    }

    const [existingArticle] = await pool.query(
      "SELECT * FROM article_types WHERE idArticle_Types = ? AND Company_idCompany = ?",
      [idArticleType, req.companyId]
    );

    if (existingArticle.length === 0) {
      return next(errorHandler(404, "Article type not found to delete"));
    }

    const [result] = await pool.query(
      "DELETE FROM article_types WHERE idArticle_Types = ?",
      [existingArticle[0].idArticle_Types]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to delete article type"));
    }

    res.status(200).json({
      message: "Article type deleted successfully",
      articleType: existingArticle[0],
    });
  } catch (error) {
    console.error("Error deleting article type:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// create a article category
export const createArticleCategory = async (req, res, next) => {
  try {
    const { categoryName, articleTypeId } = req.body;
    if (!categoryName || !articleTypeId) {
      return next(
        errorHandler(400, "Category name and Article type ID are required")
      );
    }

    const [existingCategory] = await pool.query(
      "SELECT * FROM article_categories WHERE Description Like ? AND Article_types_idArticle_types = ?",
      [categoryName, articleTypeId]
    );

    if (existingCategory.length > 0) {
      return next(errorHandler(400, "Article category already exists"));
    }

    const [result] = await pool.query(
      "INSERT INTO article_categories (Description, Article_types_idArticle_types,created_at) VALUES (?, ?, NOW())",
      [categoryName, articleTypeId]
    );

    const [newCategory] = await pool.query(
      "SELECT * FROM article_categories WHERE idArticle_Categories = ?",
      [result.insertId]
    );

    if (!newCategory[0]) {
      return next(errorHandler(404, "Created article category not found"));
    }

    res.status(201).json({
      message: "Article category created successfully",
      articleCategory: newCategory[0],
    });
  } catch (error) {
    console.error("Error creating article category:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// update article category by ID
export const updateArticleCategory = async (req, res, next) => {
  try {
    const idCategory = req.params.id;
    const { categoryName, articleTypeId } = req.body;

    if (!idCategory) {
      return next(errorHandler(400, "Article category ID is required"));
    }

    if (!categoryName || !articleTypeId) {
      return next(
        errorHandler(400, "Category name and Article type ID are required")
      );
    }

    const [existingCategory] = await pool.query(
      "SELECT * FROM article_categories WHERE idArticle_Categories = ? AND Article_types_idArticle_types = ?",
      [idCategory, articleTypeId]
    );

    if (existingCategory.length === 0) {
      return next(errorHandler(404, "Article category not found to update"));
    }

    const [result] = await pool.query(
      "UPDATE article_categories SET Description = ?, updated_at = NOW(), Article_types_idArticle_types = ?  WHERE idArticle_Categories = ?",
      [categoryName, articleTypeId, existingCategory[0].idArticle_Categories]
    );

    const [updatedCategory] = await pool.query(
      "SELECT * FROM article_categories WHERE idArticle_Categories = ?",
      [existingCategory[0].idArticle_Categories]
    );

    if (!updatedCategory[0]) {
      return next(errorHandler(404, "Updated article category not found"));
    }

    res.status(200).json({
      message: "Article category updated successfully",
      articleCategory: updatedCategory[0],
    });
  } catch (error) {
    console.error("Error updating article category:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// delete article category by ID
export const deleteArticleCategory = async (req, res, next) => {
  try {
    const idCategory = req.params.id;
    if (!idCategory) {
      return next(
        errorHandler(400, "Article category ID is required to delete")
      );
    }

    const [existingCategory] = await pool.query(
      "SELECT * FROM article_categories WHERE idArticle_Categories = ?",
      [idCategory]
    );

    if (existingCategory.length === 0) {
      return next(errorHandler(404, "Article category not found to delete"));
    }

    const [result] = await pool.query(
      "DELETE FROM article_categories WHERE idArticle_Categories = ?",
      [existingCategory[0].idArticle_Categories]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to delete article category"));
    }

    res.status(200).json({
      message: "Article category deleted successfully",
      articleCategory: existingCategory[0],
    });
  } catch (error) {
    console.error("Error deleting article category:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get all article categories based on article type id
export const getArticleCategories = async (req, res, next) => {
  try {
    const articleTypeId = req.params.id;
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM article_categories WHERE Article_types_idArticle_types = ? AND Description LIKE ?",
      [articleTypeId, `%${search}%`]
    );

    const totalRecords = countResult[0].total;

    // Get paginated data
    const [articleCategories] = await pool.query(
      "SELECT * FROM article_categories WHERE Article_types_idArticle_types = ? AND Description LIKE ? LIMIT ? OFFSET ?",
      [articleTypeId, `%${search}%`, limit, offset]
    );

    if (articleCategories.length === 0) {
      return next(errorHandler(404, "No article categories found"));
    }

    // Create New User
export const createUser = async (req, res, next) => {
  try {
    const { username, email, password, designationId } = req.body;

    // Validate required fields
    if (!username || !email || !password || !designationId) {
      return next(errorHandler(400, "Username, email, password, and designation ID are required"));
    }

    // Check if user already exists
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND Company_idCompany = ?",
      [email, req.companyId]
    );

    if (existingUser.length > 0) {
      return next(errorHandler(400, "User with this email already exists"));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, Designation_idDesignation, Company_idCompany, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [username, email, hashedPassword, designationId, req.companyId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create user"));
    }

    // Fetch new user details (excluding password)
    const [newUser] = await pool.query(
      "SELECT idUser, username, email, Designation_idDesignation, Company_idCompany, created_at FROM users WHERE idUser = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "User created successfully",
      user: newUser[0],
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

    // Pagination metadata
    const totalPages = Math.ceil(totalRecords / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    res.status(200).json({
      message: "Article categories fetched successfully",
      articleCategories,
      pagination: {
        currentPage: page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    });
  } catch (error) {
    console.error("Error fetching article categories:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Create a new user for the company and assign to a branch
// This function creates a new user with a temporary password and hashes it before storing it in the database.
export const createUser = async (req, res, next) => {
  try {
    const { email, full_name, designationId, contact_no, branch_id } = req.body;
    if (!email || !full_name || !designationId || !contact_no) {
      return next(errorHandler(400, "All fields are required"));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(errorHandler(400, "Please provide a valid email address"));
    }

    const [existingUser] = await pool.query(
      "SELECT idUser FROM user WHERE email = ?",
      [email]
    );
    if (existingUser.length > 0) {
      return next(errorHandler(400, "User with this email already exists"));
    }

    // Verify designation exists for this company
    const [designationExists] = await pool.query(
      "SELECT idDesignation FROM designation WHERE idDesignation = ? AND Company_idCompany = ?",
      [designationId, req.companyId]
    );
    if (designationExists.length === 0) {
      return next(errorHandler(404, "Designation not found for this company"));
    }

    // If branch_id is provided, verify it exists before creating user
    if (branch_id) {
      const [existingBranch] = await pool.query(
        "SELECT idBranch FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
        [branch_id, req.companyId]
      );
      if (existingBranch.length === 0) {
        return next(errorHandler(404, "Branch not found for this company"));
      }
    }

    const tempPassword = Math.random().toString(36).slice(-8); // Generate a temporary password
    console.log("Temporary password generated:", tempPassword);

    const hashedPassword = await bcrypt.hash(tempPassword, 10); // Hash the temporary password

    const [result] = await pool.query(
      "INSERT INTO user (email,password, full_name, Designation_idDesignation, Company_idCompany,Contact_no) VALUES (?, ?, ?, ?, ?,?)",
      [
        email,
        hashedPassword,
        full_name,
        designationId,
        req.companyId,
        contact_no,
      ]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create user"));
    }

    let branchAssignmentMessage = "";

    // assign a branch to the user if branch_id is provided
    if (branch_id) {
      try {
        const [branchResult] = await pool.query(
          "INSERT INTO user_has_branch (User_idUser, Branch_idBranch) VALUES (?, ?)",
          [result.insertId, branch_id]
        );

        if (branchResult.affectedRows === 0) {
          branchAssignmentMessage =
            " However, failed to assign user to the specified branch.";
        } else {
          branchAssignmentMessage =
            " User has been successfully assigned to the branch.";
        }
      } catch (branchError) {
        console.error("Error assigning user to branch:", branchError);
        branchAssignmentMessage =
          " However, failed to assign user to the specified branch due to a database error.";
      }
    }

    res.status(201).json({
      message: `User created successfully.${branchAssignmentMessage}`,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Create a new branch for the company
export const createBranch = async (req, res, next) => {
  try {
    const { branchName, address, contact_no } = req.body;
    if (!branchName || !address || !contact_no) {
      return next(errorHandler(400, "All fields are required"));
    }

    const [existingBranch] = await pool.query(
      "SELECT * FROM branch WHERE Name = ? OR address = ? AND Company_idCompany = ?",
      [branchName, address, req.companyId]
    );

    if (existingBranch.length > 0) {
      return next(
        errorHandler(400, "Branch with this name or address already exists")
      );
    }

    const [result] = await pool.query(
      "INSERT INTO branch (Name, Address, Contact_No, Company_idCompany,Status) VALUES (?, ?, ?, ?, ?)",
      [branchName, address, contact_no, req.companyId, "active"]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create branch"));
    }
    const [newBranch] = await pool.query(
      "SELECT * FROM branch WHERE idBranch = ?",
      [result.insertId]
    );

    if (!newBranch[0]) {
      return next(errorHandler(404, "Created branch not found"));
    }

    res.status(201).json({
      message: "Branch created successfully",
      branch: newBranch[0],
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Assign users to branches (one user can be assigned to multiple branches)
export const assignUserToBranch = async (req, res, next) => {
  try {
    const { userId, branchId } = req.body;
    if (!userId || !branchId) {
      return next(errorHandler(400, "User ID and Branch ID are required"));
    }

    // Check if the user exists
    const [userExists] = await pool.query(
      "SELECT idUser FROM user WHERE idUser = ? AND Company_idCompany = ?",
      [userId, req.companyId]
    );
    if (userExists.length === 0) {
      return next(errorHandler(404, "User not found for this company"));
    }

    // Check if the branch exists
    const [branchExists] = await pool.query(
      "SELECT idBranch FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
      [branchId, req.companyId]
    );

    if (branchExists.length === 0) {
      return next(errorHandler(404, "Branch not found for this company"));
    }

    // Check if the user is already assigned to the branch
    const [assignmentExists] = await pool.query(
      "SELECT * FROM user_has_branch WHERE User_idUser = ? AND Branch_idBranch = ?",
      [userId, branchId]
    );

    if (assignmentExists.length > 0) {
      return next(errorHandler(400, "User is already assigned to this branch"));
    }

    // Assign the user to the branch
    const [result] = await pool.query(
      "INSERT INTO user_has_branch (User_idUser, Branch_idBranch) VALUES (?, ?)",
      [userId, branchId]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to assign user to branch"));
    }

    res.status(201).json({
      message: "User assigned to branch successfully",
    });
  } catch (error) {
    console.error("Error assigning user to branch:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Get branch data for a specific user (if user has the specified branches assigned)
export const getBranchData = async (req, res, next) => {
  try {
    const { id: branchId } = req.params;
    if (!branchId) {
      return next(errorHandler(400, "Branch ID is required"));
    }

    // Check if the branch id matches with req.branches
    if (!req.branches.includes(parseInt(branchId))) {
      return next(errorHandler(403, "You do not have access to this branch"));
    }

    const [branchData] = await pool.query(
      "SELECT * FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
      [branchId, req.companyId]
    );

    res.status(200).json({
      message: "Branch data fetched successfully",
      branch: branchData[0] || {},
    });
  } catch (error) {
    console.error("Error fetching branch data:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
