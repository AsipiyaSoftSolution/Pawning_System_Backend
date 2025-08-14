import jwt from "jsonwebtoken";
import { pool } from "../utils/db.js";
export const jwtToken = (
  userId,
  email,
  company_id,
  designation_id,
  branches,
  company_documents
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
    }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return { accessToken, refreshToken };
};

// This function retrieves pagination data based on the provided query and parameters.
// It returns an object containing total count, total pages, and pagination flags.
export const getPaginationData = async (
  query,
  queryParams = [],
  page = 1,
  limit = 10
) => {
  try {
    const [countResult] = await pool.query(query, queryParams);

    const totalCount =
      countResult[0]?.total || countResult[0]?.["COUNT(*)"] || 0;
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
