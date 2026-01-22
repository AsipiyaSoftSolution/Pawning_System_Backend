import jwt from "jsonwebtoken";
import { pool, pool2 } from "../utils/db.js";
import crypto from "crypto";
export const jwtToken = (
  userId,
  email,
  company_id,
  designation_id,
  branches,
  company_documents,
) => {
  const accessToken = jwt.sign(
    {
      id: userId,
      email,
      company_id,
      designation_id,
      branches: branches || [],
      company_documents: company_documents || [],
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: "24h",
    },
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );

  return { accessToken, refreshToken };
};

// This function retrieves pagination data based on the provided query and parameters.
// It returns an object containing total count, total pages, and pagination flags.
export const getPaginationData = async (
  query,
  queryParams = [],
  page = 1,
  limit = 10,
  isPool1 = true,
) => {
  try {
    const [countResult] = await (isPool1 ? pool : pool2).query(
      query,
      queryParams,
    );

    const totalCount =
      countResult[0]?.count ||
      countResult[0]?.total ||
      countResult[0]?.["COUNT(*)"] ||
      countResult[0]?.["count(*)"] ||
      0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const offset = (page - 1) * limit;

    return {
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      currentPage: page,
      //limit,
      // offset,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPreviousPage ? page - 1 : null,
    };
  } catch (error) {
    console.error("Error in getPaginationData:", error);
    throw new Error("Failed to get pagination data");
  }
};

export function formatSearchPattern(search) {
  // Escape % and _ if needed, then wrap with %
  if (typeof search !== "string") return "%%";
  return `%${search.replace(/[%_]/g, "\\$&")}%`;
}

// Generate a random token for password reset
export const generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  return token;
};

// Generic pagination utility for reports
export const getReportPaginationData = async (
  countQuery,
  queryParams = [],
  page = 1,
  limit = 10,
) => {
  try {
    const [countResult] = await pool.query(countQuery, queryParams);

    // Handle different count query formats
    const totalCount =
      countResult[0]?.count ||
      countResult[0]?.total ||
      countResult[0]?.["COUNT(*)"] ||
      countResult[0]?.["count(*)"] ||
      0;

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    const offset = (page - 1) * limit;

    return {
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      currentPage: page,
      limit,
      offset,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPreviousPage ? page - 1 : null,
    };
  } catch (error) {
    console.error("Error in getReportPaginationData:", error);
    throw new Error("Failed to get pagination data");
  }
};

// get company branch id's
export const getCompanyBranches = async (companyId) => {
  try {
    const [branches] = await pool2.query(
      "SELECT idBranch FROM branch WHERE Company_idCompany = ?",
      [companyId],
    );
    return branches.map((branch) => branch.idBranch);
  } catch (error) {
    console.error("Error in getCompanyBranches:", error);
    throw new Error("Failed to get company branches");
  }
};
