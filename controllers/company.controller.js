import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import bcrypt from "bcrypt";
import { getPaginationData, formatSearchPattern } from "../utils/helper.js";
import { addAccountCreateLog } from "../utils/accounting.account.logs.js";
import { sendWelcomeEmail } from "../utils/mailConfig.js";

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
    let paginationData;
    let articleTypes;

    if (search && typeof search === "string") {
      const searchPattern = formatSearchPattern(search); // helper function to format the search pattern

      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM article_types WHERE Description LIKE ? AND Company_idCompany = ?",
        [searchPattern, req.companyId],
        page,
        limit
      );

      // Get paginated data
      [articleTypes] = await pool.query(
        "SELECT * FROM article_types WHERE Description LIKE ? AND Company_idCompany = ? LIMIT ? OFFSET ?",
        [`%${searchPattern}%`, req.companyId, limit, offset]
      );
    } else {
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM article_types WHERE Company_idCompany = ?",
        [req.companyId],
        page,
        limit
      );
      [articleTypes] = await pool.query(
        "SELECT * FROM article_types WHERE Company_idCompany = ? LIMIT ? OFFSET ?",
        [req.companyId, limit, offset]
      );
    }

    // Fetch categories for each article type
    for (let i = 0; i < articleTypes.length; i++) {
      const [categories] = await pool.query(
        "SELECT * FROM article_categories WHERE Article_types_idArticle_types = ?",
        [articleTypes[i].idArticle_Types]
      );

      // Add categories as an array of description strings to each article type
      articleTypes[i].categories = categories.map((cat) => cat.Description);
    }

    res.status(200).json({
      message: "Article types fetched successfully",
      articleTypes,
      pagination: paginationData,
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

    // First delete all associated article categories to avoid foreign key constraint violations
    await pool.query(
      "DELETE FROM article_categories WHERE Article_types_idArticle_types = ?",
      [existingArticle[0].idArticle_Types]
    );

    // Then delete the article type
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
    let articleCategories;
    let paginationData;

    if (!articleTypeId) {
      return next(errorHandler(400, "Article type ID is required"));
    }

    if (search && typeof search === "string") {
      const searchPattern = formatSearchPattern(search);
      // Get pagination data
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM article_categories WHERE Article_types_idArticle_types = ? AND Description LIKE ?",
        [articleTypeId, `%${searchPattern}%`],
        page,
        limit
      );

      // Get data
      [articleCategories] = await pool.query(
        "SELECT * FROM article_categories WHERE Article_types_idArticle_types = ? AND Description LIKE ? LIMIT ? OFFSET ?",
        [articleTypeId, `%${searchPattern}%`, limit, offset]
      );
    } else {
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM article_categories WHERE Article_types_idArticle_types = ?",
        [articleTypeId],
        page,
        limit
      );

      [articleCategories] = await pool.query(
        "SELECT * FROM article_categories WHERE Article_types_idArticle_types = ? LIMIT ? OFFSET ?",
        [articleTypeId, limit, offset]
      );
    }

    res.status(200).json({
      message: "Article categories fetched successfully",
      articleCategories,
      pagination: paginationData,
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
    const {
      Contact_no,
      Designation_idDesignation,
      Email,
      Status,
      full_name,
      accountType,
      branchData,
    } = req.body;
    if (!Email || !full_name || !Designation_idDesignation || !Contact_no) {
      return next(errorHandler(400, "All fields are required"));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return next(errorHandler(400, "Please provide a valid email address"));
    }

    const [existingUser] = await pool.query(
      "SELECT idUser FROM user WHERE email = ?",
      [Email]
    );
    if (existingUser.length > 0) {
      return next(errorHandler(400, "User with this email already exists"));
    }

    // Verify designation exists for this company
    const [designationExists] = await pool.query(
      "SELECT idDesignation FROM designation WHERE idDesignation = ? AND Company_idCompany = ?",
      [Designation_idDesignation, req.companyId]
    );
    if (designationExists.length === 0) {
      return next(errorHandler(404, "Designation not found for this company"));
    }

    // Validate cashier account type restrictions
    if (accountType === "cashier") {
      if (
        !branchData ||
        !Array.isArray(branchData) ||
        branchData.length === 0
      ) {
        return next(
          errorHandler(400, "Cashier account type requires exactly one branch")
        );
      }
      if (branchData.length > 1) {
        return next(
          errorHandler(
            400,
            "Cashier account type can only be assigned to one branch"
          )
        );
      }
    }

    const tempPassword = Math.random().toString(36).slice(-8); // Generate a temporary password
    console.log("Temporary password generated:", tempPassword);
    // have to send this temp password to the user via email
    // For now, we will just log it to the console (In production, use a proper email service)
    console.log(`Temporary password for ${Email}: ${tempPassword}`);

    const hashedPassword = await bcrypt.hash(tempPassword, 10); // Hash the temporary password

    const [result] = await pool.query(
      "INSERT INTO user (Email,Password, full_name, Designation_idDesignation, Company_idCompany,Contact_no) VALUES (?, ?, ?, ?, ?,?)",
      [
        Email,
        hashedPassword,
        full_name,
        Designation_idDesignation,
        req.companyId,
        Contact_no,
      ]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create user"));
    }

    // If branchData is provided, verify those branches exist for this company
    if (branchData && Array.isArray(branchData) && branchData.length > 0) {
      for (const branch of branchData) {
        const [branchExists] = await pool.query(
          "SELECT 1 FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
          [branch.idBranch, req.companyId]
        );
        // If any branch does not exist, return an error
        if (branchExists.length === 0) {
          return next(
            errorHandler(
              404,
              `Branch with ID ${branch.Name} not found for this company`
            )
          );
        }

        // if it exits we have to intert into user_has_branch table
        const [branchAssignment] = await pool.query(
          "INSERT INTO user_has_branch (User_idUser, Branch_idBranch) VALUES (?, ?)",
          [result.insertId, branch.idBranch]
        );

        if (branchAssignment.affectedRows === 0) {
          return next(
            errorHandler(
              500,
              "Failed to assign user to branch, Please try again"
            )
          );
        }
      }
    }

    if (accountType && accountType === "cashier") {
      const accountCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString(); // generate a random 6 digit account code
      // create a cashier account for the user - cashiers can only have one branch
      const [cashierAccount] = await pool.query(
        "INSERT INTO accounting_accounts (Account_Name, Account_Type, Created_At,Type,Group_Of_Type,User_idUser,Cashier_idCashier,Branch_idBranch,Account_Balance,Status,Account_Code) VALUES (?,?,NOW(),?,?,?,?,?,?,?,?)",
        [
          "Cashier Account - " + full_name,
          "Cashier Account",
          "Cashier",
          "Cashier",
          req.userId, // created userId
          result.insertId,
          branchData[0].idBranch, // cashier must have exactly one branch
          0,
          1,
          accountCode,
        ]
      );
      // create create account log...
      await addAccountCreateLog(
        cashierAccount.insertId,
        "Account Creation - Cashier Account",
        `Account Cashier Account-${full_name} with code ${accountCode} `,
        0,
        0,
        0,
        null,
        req.userId
      );

      if (cashierAccount.affectedRows === 0) {
        return next(errorHandler(500, "Failed to create cashier account"));
      }
    }

    // Send welcome email with temporary password
    const emailSent = await sendWelcomeEmail(Email, full_name);
    if (!emailSent) {
      console.error("Failed to send welcome email to the user");
    }

    res.status(201).json({
      success: true,
      userId: result.insertId,
      message: `User created successfully`,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get all users of the branch
export const getAllUsersForTheBranch = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    let searchTerm = req.query.search || "";
    let status = req.query.status || "1";
    const offset = (page - 1) * limit;

    console.log(status, "this is the status in the get all users function");
    console.log(
      req.branchId,
      "this is the branch id in the get all users function"
    );
    console.log(
      req.companyId,
      "this is the company id in the get all users function"
    );

    // format search term
    if (searchTerm && typeof searchTerm === "string") {
      searchTerm = formatSearchPattern(searchTerm);
    }

    let paginationData;
    let users;

    // Build status condition and parameters properly
    let statusCondition = "";
    let baseParams = [];

    if (searchTerm) {
      // Parameters for search query - users who belong to the specific branch
      baseParams = [req.branchId, `%${searchTerm}%`, `%${searchTerm}%`];

      // Add status condition and parameter
      if (status) {
        statusCondition = "AND u.Status = ?";
        baseParams.push(status);
      }

      // Add company ID and logged user ID
      baseParams.push(req.companyId, req.userId);

      // Get pagination data - count users who belong to this branch and match search
      paginationData = await getPaginationData(
        `SELECT COUNT(DISTINCT u.idUser) as total
         FROM user u
         JOIN user_has_branch ub ON u.idUser = ub.User_idUser
         WHERE ub.Branch_idBranch = ? AND (u.full_name LIKE ? OR u.email LIKE ?) ${statusCondition} AND u.Company_idCompany = ? AND u.idUser != ?`,
        baseParams,
        page,
        limit
      );

      // Get users who belong to this branch, but show ALL their branches
      [users] = await pool.query(
        `SELECT u.*, d.Description as designationDescription,
                GROUP_CONCAT(DISTINCT CONCAT(b.idBranch, ':', b.Name)) as branchData
         FROM user u
         JOIN user_has_branch ub_filter ON u.idUser = ub_filter.User_idUser
         JOIN user_has_branch ub ON u.idUser = ub.User_idUser
         LEFT JOIN designation d ON u.Designation_idDesignation = d.idDesignation
         LEFT JOIN branch b ON ub.Branch_idBranch = b.idBranch
         WHERE ub_filter.Branch_idBranch = ? AND (u.full_name LIKE ? OR u.email LIKE ?) ${statusCondition} AND u.Company_idCompany = ? AND u.idUser != ?
         GROUP BY u.idUser
         LIMIT ? OFFSET ?`,
        [...baseParams, limit, offset]
      );
    } else {
      // Parameters for non-search query - users who belong to the specific branch
      baseParams = [req.branchId];

      // Add status condition and parameter
      if (status) {
        statusCondition = "AND u.Status = ?";
        baseParams.push(status);
      }

      // Add company ID and logged user ID
      baseParams.push(req.companyId, req.userId);

      console.log(baseParams, "these are the params");

      // Get pagination data - count users who belong to this branch
      paginationData = await getPaginationData(
        `SELECT COUNT(DISTINCT u.idUser) as total
         FROM user u
         JOIN user_has_branch ub ON u.idUser = ub.User_idUser
         WHERE ub.Branch_idBranch = ? ${statusCondition} AND u.Company_idCompany = ? AND u.idUser != ?`,
        baseParams,
        page,
        limit
      );
      console.log(paginationData, "this is the pagination data");

      // Get users who belong to this branch, but show ALL their branches
      [users] = await pool.query(
        `SELECT u.*, d.Description as designationDescription,
                GROUP_CONCAT(DISTINCT CONCAT(b.idBranch, ':', b.Name)) as branchData
         FROM user u
         JOIN user_has_branch ub_filter ON u.idUser = ub_filter.User_idUser
         JOIN user_has_branch ub ON u.idUser = ub.User_idUser
         LEFT JOIN designation d ON u.Designation_idDesignation = d.idDesignation
         LEFT JOIN branch b ON ub.Branch_idBranch = b.idBranch
         WHERE ub_filter.Branch_idBranch = ? ${statusCondition} AND u.Company_idCompany = ? AND u.idUser != ?
         GROUP BY u.idUser
         LIMIT ? OFFSET ?`,
        [...baseParams, limit, offset]
      );

      console.log(users, "this is the users data");
    }

    // Parse branchData into array of objects {idBranch, Name}
    if (users && Array.isArray(users)) {
      users = users.map((user) => {
        if (user.branchData) {
          user.branchData = user.branchData.split(",").map((pair) => {
            const [id, ...nameParts] = pair.split(":");
            return {
              idBranch: parseInt(id, 10),
              Name: nameParts.join(":"),
            };
          });
        } else {
          user.branchData = [];
        }
        // Remove unnecessary fields
        delete user.branchIds;
        delete user.branchNames;
        delete user.Password;
        return user;
      });
    }

    res.status(200).json({
      success: true,
      users,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching users for the branch:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Update user by ID (assign/revoke branch, designation, status)
export const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const {
      Contact_no,
      Designation_idDesignation,
      Email,
      Status,
      full_name,
      branchData,
    } = req.body;
    if (!userId) {
      return next(errorHandler(400, "User ID is required"));
    }

    console.log(
      branchData,
      "this is the branch data in the update user function"
    );

    const [existingUser] = await pool.query(
      "SELECT * FROM user WHERE idUser = ? AND Company_idCompany = ?",
      [userId, req.companyId]
    );

    if (existingUser.length === 0) {
      return next(errorHandler(404, "User not found for this company"));
    }

    // Verify designation exists for this company
    const [designationExists] = await pool.query(
      "SELECT 1 FROM designation WHERE idDesignation = ? AND Company_idCompany = ?",
      [Designation_idDesignation, req.companyId]
    );
    if (designationExists.length === 0) {
      return next(errorHandler(404, "Designation not found for this company"));
    }

    const [result] = await pool.query(
      "UPDATE user SET Contact_no = ?, Designation_idDesignation = ?, Email = ?, Status = ?, full_name = ? WHERE idUser = ? AND Company_idCompany = ?",
      [
        Contact_no,
        Designation_idDesignation,
        Email,
        Status,
        full_name,
        userId,
        req.companyId,
      ]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update user"));
    }

    // update user has branch table based on branchData array
    if (branchData && Array.isArray(branchData)) {
      // Handle branch removals

      // Get all current branch assignments for the user
      const [currentAssignments] = await pool.query(
        "SELECT Branch_idBranch FROM user_has_branch WHERE User_idUser = ?",
        [userId]
      );
      const currentBranchIds = currentAssignments.map(
        (row) => row.Branch_idBranch
      );

      // Get the new branch IDs from the request
      const newBranchIds = branchData.map((branch) => branch.idBranch);

      // Find branches to delete (in DB but not in new data)
      const branchesToDelete = currentBranchIds.filter(
        (id) => !newBranchIds.includes(id)
      );

      // Delete removed branches
      if (branchesToDelete.length > 0) {
        const [deleteResult] = await pool.query(
          "DELETE FROM user_has_branch WHERE User_idUser = ? AND Branch_idBranch IN (?)",
          [userId, branchesToDelete]
        );

        if (deleteResult.affectedRows === 0) {
          return next(
            errorHandler(500, "Failed to remove user from some branches")
          );
        }
      }

      // Handle branch assignments
      for (const branch of branchData) {
        // Check if the branch exists
        const [branchExists] = await pool.query(
          "SELECT idBranch FROM branch WHERE idBranch = ? AND Company_idCompany = ?",
          [branch.idBranch, req.companyId]
        );

        // If branch does not exist
        if (branchExists.length === 0) {
          return next(
            errorHandler(
              404,
              `Branch ID ${branch.Name} not found for this company`
            )
          );
        }

        // now check if the user is already assigned to the branch
        const [assignmentExists] = await pool.query(
          "SELECT * FROM user_has_branch WHERE User_idUser = ? AND Branch_idBranch = ?",
          [userId, branch.idBranch]
        );

        // If not assigned, then assign
        if (assignmentExists.length === 0) {
          // Assign the user to the branch
          const [branchResult] = await pool.query(
            "INSERT INTO user_has_branch (User_idUser, Branch_idBranch) VALUES (?, ?)",
            [userId, branch.idBranch]
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user for the branch:", error);
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

// Get all branches for the company
export const getAllBranches = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const paginationData = await getPaginationData(
      "SELECT COUNT(*) as total FROM branch WHERE Company_idCompany = ?",
      [req.companyId],
      page,
      limit
    );
    const [branches] = await pool.query(
      "SELECT * FROM branch WHERE Company_idCompany = ? LIMIT ? OFFSET ?",
      [req.companyId, limit, offset]
    );

    res.status(200).json({
      message: "Branches fetched successfully",
      branches,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
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

// Format type for customer number and pawning ticket number
const availableFormatTypes = ["Custom Format", "Format"];

// Create or update company customer number fomats and pawning ticket number formats in the company
export const updateCustomerNumberFormat = async (req, res, next) => {
  try {
    const {
      customerNumberFormat,
      customerNumberFormatType,
      customerNumberAutoGenerateStartFrom,
    } = req.body;

    if (!customerNumberFormatType && !pawningTicketNumberFormatType) {
      return next(errorHandler(400, "Format type must be provided"));
    }

    if (
      customerNumberFormatType &&
      !availableFormatTypes.includes(customerNumberFormatType)
    ) {
      return next(errorHandler(400, "Invalid Customer Number Format Type"));
    }

    const [result] = await pool.query(
      "UPDATE company SET Customer_No_Format_Type = ? , Customer_No_Format = ?,Customer_No_Auto_Generate_Number_Start_From = ? WHERE idCompany = ?",
      [
        customerNumberFormatType,
        customerNumberFormat,
        customerNumberAutoGenerateStartFrom,
        req.companyId,
      ]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update number formats"));
    }

    res.status(200).json({
      message: "Customer number format updated successfully.",
      success: true,
    });
  } catch (error) {
    console.error(
      "Error updating customer and pawning ticket number formats:",
      error
    );
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const getPawningTicketFormat = async (req, res, next) => {
  try {
    const [formatData] = await pool.query(
      "SELECT format_type, format, auto_generate_start_from FROM pawning_ticket_format WHERE company_id = ?",
      [req.companyId]
    );

    if (formatData.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No pawning ticket format found",
        format: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Pawning ticket format fetched successfully",
      format: {
        pawningTicketNumberFormatType: formatData[0].format_type,
        pawningTicketNumberFormat: formatData[0].format,
        pawningTicketNumberAutoGenerateStartFrom:
          formatData[0].auto_generate_start_from,
      },
    });
  } catch (error) {
    console.error("Error fetching pawning ticket format:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const updatePawningTicketNumberFormat = async (req, res, next) => {
  try {
    const {
      pawningTicketNumberFormat,
      pawningTicketNumberFormatType,
      pawningTicketNumberAutoGenerateStartFrom,
      selectedOption,
    } = req.body;

    if (!pawningTicketNumberFormatType) {
      return next(
        errorHandler(400, "Pawning Ticket Number Format Type must be provided")
      );
    }

    if (
      pawningTicketNumberFormatType &&
      !availableFormatTypes.includes(pawningTicketNumberFormatType)
    ) {
      return next(
        errorHandler(400, "Invalid Pawning Ticket Number Format Type")
      );
    }

    // Check if a record already exists for this company
    const [existingFormat] = await pool.query(
      "SELECT id FROM pawning_ticket_format WHERE company_id = ?",
      [req.companyId]
    );

    let result;
    if (existingFormat.length > 0) {
      // Update existing record
      if (pawningTicketNumberFormatType === "Custom Format") {
        [result] = await pool.query(
          "UPDATE pawning_ticket_format SET format_type = ?, format = ?, auto_generate_start_from = ? WHERE company_id = ?",
          [pawningTicketNumberFormatType, null, null, req.companyId]
        );
      } else {
        [result] = await pool.query(
          "UPDATE pawning_ticket_format SET format_type = ?, format = ?, auto_generate_start_from = ? WHERE company_id = ?",
          [
            pawningTicketNumberFormatType,
            pawningTicketNumberFormat,
            pawningTicketNumberAutoGenerateStartFrom || 1,
            req.companyId,
          ]
        );
      }
    } else {
      // Insert new record
      [result] = await pool.query(
        "INSERT INTO pawning_ticket_format (company_id, format_type, format, auto_generate_start_from) VALUES (?, ?, ?, ?)",
        [
          req.companyId,
          pawningTicketNumberFormatType,
          pawningTicketNumberFormat,
          pawningTicketNumberAutoGenerateStartFrom || 1,
        ]
      );
    }

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update pawning ticket format"));
    }

    if (selectedOption === "updateAll") {
      // Update all existing pawning tickets to match the new format
      try {
        // Get all existing pawning tickets for this company
        const [existingTickets] = await pool.query(
          `SELECT pt.idPawning_Ticket, pt.Customer_idCustomer, pt.Pawning_Product_idPawning_Product, pt.Branch_idBranch
           FROM pawning_ticket pt
           JOIN branch b ON pt.Branch_idBranch = b.idBranch
           WHERE b.Company_idCompany = ?
           ORDER BY pt.idPawning_Ticket ASC`,
          [req.companyId]
        );

        if (existingTickets.length > 0) {
          let autoNumberCounter = pawningTicketNumberAutoGenerateStartFrom || 1;

          for (const ticket of existingTickets) {
            let newTicketNo = "";

            if (pawningTicketNumberFormatType === "Format") {
              const formatPartsWithSeparators =
                pawningTicketNumberFormat.split(/([-.\/])/);

              for (let i = 0; i < formatPartsWithSeparators.length; i++) {
                const part = formatPartsWithSeparators[i].trim();

                // If it's a separator, add it to newTicketNo
                if (["-", ".", "/"].includes(part)) {
                  newTicketNo += part;
                  continue;
                }

                // Process format components
                if (part === "Branch Number") {
                  const [branch] = await pool.query(
                    "SELECT Branch_Code FROM branch WHERE idBranch = ?",
                    [ticket.Branch_idBranch]
                  );
                  newTicketNo += branch[0]?.Branch_Code || "00";
                }

                if (part === "Branch's Customer Count") {
                  const [customerCount] = await pool.query(
                    "SELECT COUNT(*) AS count FROM customer WHERE Branch_idBranch = ?",
                    [ticket.Branch_idBranch]
                  );
                  newTicketNo += customerCount[0].count
                    .toString()
                    .padStart(4, "0");
                }

                if (part === "Product Code") {
                  const productId = ticket.Pawning_Product_idPawning_Product;
                  if (productId) {
                    newTicketNo += productId.toString().padStart(3, "0");
                  } else {
                    newTicketNo += "000";
                  }
                }

                if (part === "Customer Number") {
                  const customerId = ticket.Customer_idCustomer;
                  if (customerId) {
                    newTicketNo += customerId.toString().padStart(4, "0");
                  } else {
                    newTicketNo += "0000";
                  }
                }

                if (part === "Auto Create Number") {
                  newTicketNo += autoNumberCounter.toString();
                  autoNumberCounter++;
                }
              }
            } else {
              // For "Custom Format" type, use simple auto-increment
              newTicketNo = autoNumberCounter.toString();
              autoNumberCounter++;
            }

            // Update the ticket with the new ticket number
            await pool.query(
              "UPDATE pawning_ticket SET Ticket_No = ? WHERE idPawning_Ticket = ?",
              [newTicketNo, ticket.idPawning_Ticket]
            );
          }

          console.log(
            `Updated ${existingTickets.length} existing tickets with new format`
          );
        }
      } catch (updateError) {
        console.error("Error updating existing tickets:", updateError);
      }
    }

    res.status(200).json({
      message: "Pawning ticket number format updated successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error updating pawning ticket number format:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const createArticleCondition = async (req, res, next) => {
  try {
    const { articleCondition } = req.body;
    if (!articleCondition) {
      return next(errorHandler(400, "Article condition is required"));
    }

    const [existingCondition] = await pool.query(
      "SELECT * FROM article_conditions WHERE Description Like ? AND Company_idCompany = ?",
      [articleCondition, req.companyId]
    );
    if (existingCondition.length > 0) {
      return next(errorHandler(400, "Article condition already exists"));
    }

    const [result] = await pool.query(
      "INSERT INTO article_conditions (Description, Company_idCompany,created_at) VALUES (?, ?, NOW())",
      [articleCondition, req.companyId]
    );

    res.status(201).json({
      message: "Article condition created successfully",
      aritcleConditionId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating article condition:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const getArticlesConditions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    let paginationData;
    let conditions;

    if (search && typeof search !== "string") {
      const searchPattern = formatSearchPattern(search);
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM article_conditions WHERE Company_idCompany = ? AND Description LIKE ?",
        [req.companyId, searchPattern],
        page,
        limit
      );

      [conditions] = await pool.query(
        "SELECT * FROM article_conditions WHERE Company_idCompany = ? AND Description LIKE ? LIMIT ? OFFSET ?",
        [req.companyId, `%${searchPattern}%`, limit, offset]
      );
    }

    paginationData = await getPaginationData(
      "SELECT COUNT(*) as total FROM article_conditions WHERE Company_idCompany = ?",
      [req.companyId],
      page,
      limit
    );

    [conditions] = await pool.query(
      "SELECT * FROM article_conditions WHERE Company_idCompany = ? LIMIT ? OFFSET ?",
      [req.companyId, limit, offset]
    );

    res.status(200).json({
      message: "Article conditions fetched successfully",
      conditions,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching article conditions:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const updateArticleCondition = async (req, res, next) => {
  try {
    console.log("Updating article condition with body:", req.body);
    const articleId = req.params.id || req.params.articleId;
    const { articleCondition } = req.body;

    if (!articleId) {
      return next(errorHandler(400, "Article condition ID is required"));
    }

    const [existingCondition] = await pool.query(
      "SELECT * FROM article_conditions WHERE idArticle_conditions = ? AND Company_idCompany =?",
      [articleId, req.companyId]
    );

    if (existingCondition.length === 0) {
      return next(errorHandler(404, "Article condition not found"));
    }

    const [result] = await pool.query(
      "UPDATE article_conditions SET Description = ?, updated_at = NOW() WHERE idArticle_conditions = ?",
      [articleCondition, existingCondition[0].idArticle_conditions]
    );
    console.log("Update result:", result);
    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update article condition"));
    }

    res.status(200).json({
      message: "Article condition updated successfully",
      articleConditionId: existingCondition[0].idArticle_conditions,
    });
  } catch (error) {
    console.error("Error updating article condition:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const deleteArticleCondition = async (req, res, next) => {
  try {
    const articleId = req.params.id || req.params.articleId;
    if (!articleId) {
      return next(errorHandler(400, "Article condition ID is required"));
    }

    const [existingCondition] = await pool.query(
      "SELECT * FROM article_conditions WHERE idArticle_conditions = ? AND Company_idCompany =?",
      [articleId, req.companyId]
    );

    if (existingCondition.length === 0) {
      return next(errorHandler(404, "Article condition not found"));
    }

    const [result] = await pool.query(
      "DELETE FROM article_conditions WHERE idArticle_conditions = ?",
      [existingCondition[0].idArticle_conditions]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to delete article condition"));
    }

    res.status(200).json({
      message: "Article condition deleted successfully",
      articleConditionId: existingCondition[0].idArticle_conditions,
    });
  } catch (error) {
    console.error("Error deleting article condition:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get all privilages
export const getAllPrivilages = async (req, res, next) => {
  try {
    const [privilages] = await pool.query(
      "SELECT idUser_privilages,Description FROM user_privilages"
    );

    if (privilages.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No privilages found for this company",
        privilages: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Privilages fetched successfully",
      privilages,
    });
  } catch (error) {
    console.error("Error fetching privilages:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// Create a new user for the TEST company (company ID 3) and assign to a branch
export const createTESTUser = async (req, res, next) => {
  try {
    const {
      Contact_no,
      Designation_idDesignation,
      Email,
      Status,
      full_name,
      branchId,
    } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    /*if (!emailRegex.test(Email)) {
      return next(errorHandler(400, "Please provide a valid email address"));
    } */

    const [existingUser] = await pool.query(
      "SELECT idUser FROM user WHERE email = ?",
      [Email]
    );
    if (existingUser.length > 0) {
      return next(errorHandler(400, "User with this email already exists"));
    }

    // Verify designation exists for this company
    const [designationExists] = await pool.query(
      "SELECT idDesignation FROM designation WHERE idDesignation = ? AND Company_idCompany = ?",
      [Designation_idDesignation, 3]
    );
    if (designationExists.length === 0) {
      return next(errorHandler(404, "Designation not found for this company"));
    }

    const tempPassword = Math.random().toString(36).slice(-8); // Generate a temporary password
    console.log("Temporary password generated:", tempPassword);
    // have to send this temp password to the user via email
    // For now, we will just log it to the console (In production, use a proper email service)
    // console.log(`Temporary password for ${email}: ${tempPassword}`);

    const hashedPassword = await bcrypt.hash(tempPassword, 10); // Hash the temporary password

    const [result] = await pool.query(
      "INSERT INTO user (Email,Password, full_name, Designation_idDesignation, Company_idCompany,Contact_no) VALUES (?, ?, ?, ?, ?,?)",
      [
        Email,
        hashedPassword,
        full_name,
        Designation_idDesignation,
        3,
        Contact_no,
      ]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create user"));
    }

    const [userAssignToBranch] = await pool.query(
      "INSERT INTO user_has_branch (User_idUser, Branch_idBranch) VALUES (?, ?)",
      [result.insertId, branchId]
    );

    res.status(201).json({
      success: true,
      userId: result.insertId,
      message: `User created successfully`,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// create designation with privilages
export const creteDesignationWithPrivilages = async (req, res, next) => {
  try {
    const { description, privilageIds, maxTicketApproveAmount } = req.body;
    console.log(privilageIds, "this is the privilage ids");
    if (!description) {
      return next(errorHandler(400, "Designation description is required"));
    }

    if (
      !privilageIds ||
      !Array.isArray(privilageIds) ||
      privilageIds.length === 0
    ) {
      return next(
        errorHandler(
          400,
          "At least one privilage must be assigned to the designation"
        )
      );
    }

    if (privilageIds.includes(29)) {
      if (
        !maxTicketApproveAmount ||
        isNaN(maxTicketApproveAmount) ||
        maxTicketApproveAmount <= 0
      ) {
        return next(
          errorHandler(
            400,
            "Max Ticket Approve Amount must be a positive number when 'Approve Ticket' privilage is assigned"
          )
        );
      }
    }

    // Check if designation already exists for this company
    const [existingDesignation] = await pool.query(
      "SELECT * FROM designation WHERE Description Like ? AND Company_idCompany = ?",
      [description, req.companyId]
    );

    if (existingDesignation.length > 0) {
      return next(
        errorHandler(400, "Designation with this description already exists")
      );
    }

    // check if privlages are valid
    const [validPrivilages] = await pool.query(
      `SELECT idUser_privilages FROM user_privilages WHERE idUser_privilages IN (?)`,
      [privilageIds]
    );

    if (validPrivilages.length !== privilageIds.length) {
      return next(errorHandler(400, "One or more privilages are invalid"));
    }

    // create the designation
    const [createdDesignation] = await pool.query(
      "INSERT INTO designation (Description, Company_idCompany,pawning_ticket_max_approve_amount) VALUES (?, ?,?)",
      [description, req.companyId, maxTicketApproveAmount || null]
    );

    if (createdDesignation.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create designation"));
    }

    for (const privilageId of privilageIds) {
      const [assignPrivilage] = await pool.query(
        "INSERT INTO designation_has_user_privilages (Designation_idDesignation,User_Privilages_idUser_Privilages,Status,Last_Updated_User,Last_Updated_Time) VALUES(?, ?, ?, ?, NOW())",
        [createdDesignation.insertId, privilageId, 1, req.userId]
      );
      if (assignPrivilage.affectedRows === 0) {
        return next(
          errorHandler(
            500,
            "Failed to assign one or more privilages to the designation, please try again"
          )
        );
      }
    }

    // Fetch the complete designation data
    const [designationDetails] = await pool.query(
      "SELECT idDesignation, Description, pawning_ticket_max_approve_amount FROM designation WHERE idDesignation = ?",
      [createdDesignation.insertId]
    );

    // Fetch privileges for the designation (same pattern as getDesignationsWithPrivilages)
    const [privilages] = await pool.query(
      `SELECT dp.User_Privilages_idUser_Privilages as idUser_privilages
       FROM designation_has_user_privilages dp
       JOIN user_privilages up ON dp.User_Privilages_idUser_Privilages = up.idUser_privilages
       WHERE dp.Designation_idDesignation = ? AND dp.Status = 1`,
      [createdDesignation.insertId]
    );

    const designationData = {
      idDesignation: designationDetails[0].idDesignation,
      Description: designationDetails[0].Description,
      pawning_ticket_max_approve_amount:
        designationDetails[0].pawning_ticket_max_approve_amount,
      privilages: privilages,
    };

    res.status(201).json({
      success: true,
      designation: designationData,
      message: "Designation created successfully",
    });
  } catch (error) {
    console.error("Error creating designation:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// get all desgination with privilages
export const getDesignationsWithPrivilages = async (req, res, next) => {
  try {
    // get all designations for the company
    const [designations] = await pool.query(
      "SELECT idDesignation, Description,pawning_ticket_max_approve_amount FROM designation WHERE Company_idCompany = ?",
      [req.companyId]
    );

    // get privilages for each designation
    for (const designation of designations) {
      const [privilages] = await pool.query(
        `SELECT dp.User_Privilages_idUser_Privilages as idUser_privilages
         FROM designation_has_user_privilages dp
         JOIN user_privilages up ON dp.User_Privilages_idUser_Privilages = up.idUser_privilages
         WHERE dp.Designation_idDesignation = ? AND dp.Status = 1`,
        [designation.idDesignation]
      );
      designation.privilages = privilages;
    }

    res.status(200).json({
      success: true,
      designations,
    });
  } catch (error) {
    console.error("Error fetching designations with privilages:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// update desgination description and privilages
export const updateDesignationWithPrivilages = async (req, res, next) => {
  try {
    const desginationId = req.params.id || req.params.designationId;
    const { description, privilageIds, maxTicketApproveAmount } = req.body;

    if (!desginationId) {
      return next(errorHandler(400, "Designation ID is required"));
    }

    if (!description) {
      return next(errorHandler(400, "Designation description is required"));
    }

    if (
      !privilageIds ||
      !Array.isArray(privilageIds) ||
      privilageIds.length === 0
    ) {
      return next(
        errorHandler(
          400,
          "At least one privilage must be assigned to the designation"
        )
      );
    }

    if (privilageIds.includes(29)) {
      if (
        !maxTicketApproveAmount ||
        isNaN(maxTicketApproveAmount) ||
        maxTicketApproveAmount <= 0
      ) {
        return next(
          errorHandler(
            400,
            "Max Ticket Approve Amount must be a positive number when 'Approve Ticket' privilage is assigned"
          )
        );
      }
    }

    // Check if designation exists for this company
    const [existingDesignation] = await pool.query(
      "SELECT * FROM designation WHERE idDesignation = ? AND Company_idCompany = ?",
      [desginationId, req.companyId]
    );

    if (existingDesignation.length === 0) {
      return next(errorHandler(404, "Designation not found"));
    }

    // check if privlages are valid
    const [validPrivilages] = await pool.query(
      `SELECT idUser_privilages FROM user_privilages WHERE idUser_privilages IN (?)`,
      [privilageIds]
    );

    if (validPrivilages.length !== privilageIds.length) {
      return next(errorHandler(400, "One or more privilages are invalid"));
    }

    // update the designation description
    const [updatedDesignation] = await pool.query(
      "UPDATE designation SET Description = ?, pawning_ticket_max_approve_amount = ? WHERE idDesignation = ?",
      [description, maxTicketApproveAmount || null, desginationId]
    );

    if (updatedDesignation.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update designation"));
    }

    // check and update privilages if there are any changes
    const [currentPrivilages] = await pool.query(
      "SELECT User_Privilages_idUser_Privilages FROM designation_has_user_privilages WHERE Designation_idDesignation = ? AND Status = 1",
      [desginationId]
    );
    const currentPrivilageIds = currentPrivilages.map(
      (row) => row.User_Privilages_idUser_Privilages
    );

    // Find privilages to remove (in DB but not in new data)
    const privilagesToRemove = currentPrivilageIds.filter(
      (id) => !privilageIds.includes(id)
    );

    // Remove privilages (Make status 0)
    if (privilagesToRemove.length > 0) {
      const [removeResult] = await pool.query(
        `UPDATE designation_has_user_privilages 
         SET Status = 0, Last_Updated_User = ?, Last_Updated_Time = NOW() 
         WHERE Designation_idDesignation = ? AND User_Privilages_idUser_Privilages IN (?)`,
        [req.userId, desginationId, privilagesToRemove]
      );

      if (removeResult.affectedRows === 0) {
        return next(
          errorHandler(500, "Failed to remove some privilages from designation")
        );
      }
    }
    // Find privilages to add (in new data but not in DB)
    const privilagesToAdd = privilageIds.filter(
      (id) => !currentPrivilageIds.includes(id)
    );

    // Add new privilages or reactivate existing ones
    for (const privilageId of privilagesToAdd) {
      // First check if a record exists (even if inactive)
      const [existingRecord] = await pool.query(
        "SELECT * FROM designation_has_user_privilages WHERE Designation_idDesignation = ? AND User_Privilages_idUser_Privilages = ?",
        [desginationId, privilageId]
      );

      if (existingRecord.length > 0) {
        // Record exists, update it to active
        const [updateResult] = await pool.query(
          "UPDATE designation_has_user_privilages SET Status = 1, Last_Updated_User = ?, Last_Updated_Time = NOW() WHERE Designation_idDesignation = ? AND User_Privilages_idUser_Privilages = ?",
          [req.userId, desginationId, privilageId]
        );
        if (updateResult.affectedRows === 0) {
          return next(
            errorHandler(
              500,
              "Failed to reactivate privilege for the designation, please try again"
            )
          );
        }
      } else {
        // Record doesn't exist, insert new one
        const [addResult] = await pool.query(
          "INSERT INTO designation_has_user_privilages (Designation_idDesignation,User_Privilages_idUser_Privilages,Status,Last_Updated_User,Last_Updated_Time) VALUES(?, ?, ?, ?, NOW())",
          [desginationId, privilageId, 1, req.userId]
        );
        if (addResult.affectedRows === 0) {
          return next(
            errorHandler(
              500,
              "Failed to assign privilege to the designation, please try again"
            )
          );
        }
      }
    }

    // Fetch the updated designation data
    const [designationDetails] = await pool.query(
      "SELECT idDesignation, Description, pawning_ticket_max_approve_amount FROM designation WHERE idDesignation = ?",
      [desginationId]
    );

    // Fetch privileges for the designation (same pattern as getDesignationsWithPrivilages)
    const [privilages] = await pool.query(
      `SELECT dp.User_Privilages_idUser_Privilages as idUser_privilages
       FROM designation_has_user_privilages dp
       JOIN user_privilages up ON dp.User_Privilages_idUser_Privilages = up.idUser_privilages
       WHERE dp.Designation_idDesignation = ? AND dp.Status = 1`,
      [desginationId]
    );

    const designationData = {
      idDesignation: designationDetails[0].idDesignation,
      Description: designationDetails[0].Description,
      pawning_ticket_max_approve_amount:
        designationDetails[0].pawning_ticket_max_approve_amount,
      privilages: privilages,
    };

    res.status(200).json({
      success: true,
      designation: designationData,
      message: "Designation updated successfully",
    });
  } catch (error) {
    console.error("Error updating designation with privilages:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

// delete designation with privilages
export const deleteDesignationWithPrivilages = async (req, res, next) => {
  try {
    const desginationId = req.params.id || req.params.designationId;
    if (!desginationId) {
      return next(errorHandler(400, "Designation ID is required"));
    }

    // Check if designation exists for this company
    const [existingDesignation] = await pool.query(
      "SELECT * FROM designation WHERE idDesignation = ? AND Company_idCompany = ?",
      [desginationId, req.companyId]
    );

    if (existingDesignation.length === 0) {
      return next(errorHandler(404, "Designation not found"));
    }

    // Check if any users are assigned to this designation
    const [assignedUsers] = await pool.query(
      "SELECT idUser FROM user WHERE Designation_idDesignation = ? AND Company_idCompany = ?",
      [desginationId, req.companyId]
    );
    if (assignedUsers.length > 0) {
      return next(
        errorHandler(
          400,
          "Cannot delete designation assigned to one or more users"
        )
      );
    }

    // Delete designation privilages
    const [deletePrivilages] = await pool.query(
      "DELETE FROM designation_has_user_privilages WHERE Designation_idDesignation = ?",
      [desginationId]
    );

    // Delete the designation
    const [deleteDesignation] = await pool.query(
      "DELETE FROM designation WHERE idDesignation = ?",
      [desginationId]
    );

    if (deleteDesignation.affectedRows === 0) {
      return next(errorHandler(500, "Failed to delete designation"));
    }

    res.status(200).json({
      success: true,
      designationId: desginationId,
      message: "Designation deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting designation with privilages:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
