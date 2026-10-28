import axios from "axios";

/**
 * Create a configured axios instance for ACC Center API calls
 * @param {string} accessToken - The JWT access token from cookies
 * @returns {axios.AxiosInstance} Configured axios instance
 */
export const createAccCenterApiClient = (accessToken, options = {}) => {
  const baseURL = process.env.ACCOUNT_CENTER_API_URL;

  if (!baseURL) {
    throw new Error(
      "ACCOUNT_CENTER_API_URL is not configured in environment variables",
    );
  }

  const headers = {
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (process.env.PAWNING_DAILY_JOB_API_KEY) {
    // Daily interest/penalty cron — dedicated key (must match Account Center)
    headers["x-api-key"] = process.env.PAWNING_DAILY_JOB_API_KEY;
  } else {
    console.warn(
      "[createAccCenterApiClient] No accessToken and PAWNING_DAILY_JOB_API_KEY is empty — Account Center will reject the call",
    );
  }

  const timeout =
    Number(options.timeout) > 0
      ? Number(options.timeout)
      : Number(process.env.ACCOUNT_CENTER_API_TIMEOUT_MS) || 30000;

  return axios.create({
    baseURL,
    timeout,
    headers,
  });
};

function mapAccCenterRequestError(error) {
  if (error.response) {
    const apiError = new Error(
      error.response.data?.message || "ACC Center API request failed",
    );
    apiError.status = error.response.status;
    apiError.response = error.response.data;
    return apiError;
  }

  if (error.request) {
    const timedOut =
      error.code === "ECONNABORTED" ||
      /timeout/i.test(String(error.message || ""));
    const networkError = new Error(
      timedOut
        ? "Account Center request timed out. Please retry the payment."
        : "ACC Center API is not reachable",
    );
    networkError.status = 503;
    networkError.code = error.code;
    return networkError;
  }

  return error;
}

/**
 * Make a POST request to ACC Center API
 * @param {string} endpoint - The API endpoint (e.g., '/customer/create-customer')
 * @param {object} data - The request payload
 * @param {string} accessToken - The JWT access token from cookies
 * @returns {Promise<any>} The response data
 * @throws {Error} If the request fails
 */
export const accCenterPost = async (endpoint, data, accessToken, options = {}) => {
  try {
    const apiClient = createAccCenterApiClient(accessToken, options);
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    if (error.request && !error.response) {
      console.log(
        "ACC Center API request made but no response received:",
        error,
      );
    }
    throw mapAccCenterRequestError(error);
  }
};

/**
 * Make a GET request to ACC Center API
 * @param {string} endpoint - The API endpoint
 * @param {string} accessToken - The JWT access token from cookies
 * @returns {Promise<any>} The response data
 * @throws {Error} If the request fails
 */
export const accCenterGet = async (endpoint, accessToken, options = {}) => {
  try {
    const apiClient = createAccCenterApiClient(accessToken, options);
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    throw mapAccCenterRequestError(error);
  }
};

/**
 * Make a PUT request to ACC Center API
 * @param {string} endpoint - The API endpoint
 * @param {object} data - The request payload
 * @param {string} accessToken - The JWT access token from cookies
 * @returns {Promise<any>} The response data
 * @throws {Error} If the request fails
 */
export const accCenterPut = async (endpoint, data, accessToken, options = {}) => {
  try {
    const apiClient = createAccCenterApiClient(accessToken, options);
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    throw mapAccCenterRequestError(error);
  }
};

/**
 * Make a DELETE request to ACC Center API
 * @param {string} endpoint - The API endpoint
 * @param {string} accessToken - The JWT access token from cookies
 * @returns {Promise<any>} The response data
 * @throws {Error} If the request fails
 */
export const accCenterDelete = async (endpoint, accessToken, options = {}) => {
  try {
    const apiClient = createAccCenterApiClient(accessToken, options);
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    throw mapAccCenterRequestError(error);
  }
};
