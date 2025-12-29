import { errorHandler } from "../utils/errorHandler.js";
import { pool, pool2 } from "../utils/db.js";
import { getPaginationData } from "../utils/helper.js";

// Get Cash and Bank Accounts for the branch
export const getCashAndBankAccounts = async (req, res, next) => {
  try {
    const [accounts] = await pool2.query(
      `SELECT idAccounting_Accounts, Account_Name, Account_Code, Account_Balance, Account_Type,Account_Number
             FROM accounting_accounts 
             WHERE Branch_idBranch = ? AND Status = '1' AND Group_Of_Type = 'Assets' AND Type = 'Cash and Bank'
             ORDER BY Account_Name ASC`,
      [req.branchId],
    );

    res.status(200).json({
      success: true,
      message: "Cash and Bank Accounts retrieved successfully",
      accounts,
    });
  } catch (error) {
    console.error("Get Cash and Bank Accounts error:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
