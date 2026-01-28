import axios from "axios";

/**
 * Create a configured axios instance for ACC Center API calls
 * @param {string} accessToken - The JWT access token from cookies
 * @returns {axios.AxiosInstance} Configured axios instance
 */
export const createAccCenterApiClient = (accessToken) => {
  const baseURL = process.env.ACCOUNT_CENTER_API_URL;

  if (!baseURL) {
    throw new Error("ACCOUNT_CENTER_API_URL is not configured in environment variables");
  }

  return axios.create({
    baseURL,
    timeout: 30000, // 30 seconds
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 * Make a POST request to ACC Center API
 * @param {string} endpoint - The API endpoint (e.g., '/customer/create-customer')
 * @param {object} data - The request payload
 * @param {string} accessToken - The JWT access token from cookies
 * @returns {Promise<any>} The response data
 * @throws {Error} If the request fails
 */
export const accCenterPost = async (endpoint, data, accessToken) => {
  try {
    const apiClient = createAccCenterApiClient(accessToken);
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    // Re-throw with more context for better error handling
    if (error.response) {
      // ACC Center API returned an error response
      const apiError = new Error(
        error.response.data?.message || "ACC Center API request failed"
      );
      apiError.status = error.response.status;
      apiError.response = error.response.data;
      throw apiError;
    } else if (error.request) {
      // Request was made but no response received
      const networkError = new Error("ACC Center API is not reachable");
      networkError.status = 503;
      throw networkError;
    } else {
      // Other errors (configuration, etc.)
      throw error;
    }
  }
};

/**
 * Make a GET request to ACC Center API
 * @param {string} endpoint - The API endpoint
 * @param {string} accessToken - The JWT access token from cookies
 * @returns {Promise<any>} The response data
 * @throws {Error} If the request fails
 */
export const accCenterGet = async (endpoint, accessToken) => {
  try {
    const apiClient = createAccCenterApiClient(accessToken);
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    if (error.response) {
      const apiError = new Error(
        error.response.data?.message || "ACC Center API request failed"
      );
      apiError.status = error.response.status;
      apiError.response = error.response.data;
      throw apiError;
    } else if (error.request) {
      const networkError = new Error("ACC Center API is not reachable");
      networkError.status = 503;
      throw networkError;
    } else {
      throw error;
    }
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
export const accCenterPut = async (endpoint, data, accessToken) => {
  try {
    const apiClient = createAccCenterApiClient(accessToken);
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    if (error.response) {
      const apiError = new Error(
        error.response.data?.message || "ACC Center API request failed"
      );
      apiError.status = error.response.status;
      apiError.response = error.response.data;
      throw apiError;
    } else if (error.request) {
      const networkError = new Error("ACC Center API is not reachable");
      networkError.status = 503;
      throw networkError;
    } else {
      throw error;
    }
  }
};

/**
 * Make a DELETE request to ACC Center API
 * @param {string} endpoint - The API endpoint
 * @param {string} accessToken - The JWT access token from cookies
 * @returns {Promise<any>} The response data
 * @throws {Error} If the request fails
 */
export const accCenterDelete = async (endpoint, accessToken) => {
  try {
    const apiClient = createAccCenterApiClient(accessToken);
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    if (error.response) {
      const apiError = new Error(
        error.response.data?.message || "ACC Center API request failed"
      );
      apiError.status = error.response.status;
      apiError.response = error.response.data;
      throw apiError;
    } else if (error.request) {
      const networkError = new Error("ACC Center API is not reachable");
      networkError.status = 503;
      throw networkError;
    } else {
      throw error;
    }
  }
};
