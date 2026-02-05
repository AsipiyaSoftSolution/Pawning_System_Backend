import { errorHandler } from "../utils/errorHandler.js";
import { subsystemApi } from "../api/accountCenterApi.js";

// Get Cash and Bank Accounts for the branch (via Account Center subsystem API)
export const getCashAndBankAccounts = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken;
    if (!accessToken) {
      return next(errorHandler(401, "Unauthorized"));
    }

    const resData = await subsystemApi.cashAndBankAccounts(
      req.branchId,
      req.companyId,
      accessToken
    );

    res.status(200).json({
      success: true,
      message:
        resData.message || "Cash and Bank Accounts retrieved successfully",
      accounts: resData.accounts || [],
    });
  } catch (error) {
    console.error("Get Cash and Bank Accounts error:", error);
    if (error.status) {
      return next(
        errorHandler(error.status, error.message || "Account Center API error")
      );
    }
    return next(errorHandler(500, "Internal Server Error"));
  }
};
