import dotenv from "dotenv";
dotenv.config();

// SMS provider configuration (Hutch)
export const hutchConfig = {
  baseUrl: process.env.HUTCH_BASE_URL,
  username: process.env.HUTCH_USERNAME,
  password: process.env.HUTCH_PASSWORD,
  defaultMask: process.env.HUTCH_DEFAULT_MASK,
};

// In-memory cache for tokens
export const smsCache = {
  hutchAccessToken: null,
  hutchRefreshToken: null,
  tokenExpiresAt: null,
};

export default { hutchConfig, smsCache };
