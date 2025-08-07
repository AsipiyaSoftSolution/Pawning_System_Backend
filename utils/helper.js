import jwt from "jsonwebtoken";
export const jwtToken = (userId, email, company_id, designation_id) => {
  const accessToken = jwt.sign(
    { id: userId, email, company_id, designation_id },
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
