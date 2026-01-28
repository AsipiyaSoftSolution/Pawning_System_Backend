# ACC Center API Utility

This utility provides reusable functions for making API calls to the ACC Center.

## Functions

### `accCenterPost(endpoint, data, accessToken)`
Make a POST request to ACC Center API.

**Parameters:**
- `endpoint` (string): The API endpoint (e.g., '/customer/create-customer')
- `data` (object): The request payload
- `accessToken` (string): The JWT access token from req.cookies.accessToken

**Returns:** Promise<any> - The response data

**Example:**
```javascript
import { accCenterPost } from "../utils/accCenterApi.js";

const response = await accCenterPost(
  "/customer/create-customer",
  { data: customerData },
  req.cookies.accessToken
);
```

---

### `accCenterGet(endpoint, accessToken)`
Make a GET request to ACC Center API.

**Parameters:**
- `endpoint` (string): The API endpoint (e.g., '/customer/123')
- `accessToken` (string): The JWT access token from req.cookies.accessToken

**Returns:** Promise<any> - The response data

**Example:**
```javascript
import { accCenterGet } from "../utils/accCenterApi.js";

const customer = await accCenterGet(
  "/customer/123",
  req.cookies.accessToken
);
```

---

### `accCenterPut(endpoint, data, accessToken)`
Make a PUT request to ACC Center API.

**Parameters:**
- `endpoint` (string): The API endpoint (e.g., '/customer/123')
- `data` (object): The request payload
- `accessToken` (string): The JWT access token from req.cookies.accessToken

**Returns:** Promise<any> - The response data

**Example:**
```javascript
import { accCenterPut } from "../utils/accCenterApi.js";

const response = await accCenterPut(
  "/customer/123",
  { data: updatedCustomerData },
  req.cookies.accessToken
);
```

---

### `accCenterDelete(endpoint, accessToken)`
Make a DELETE request to ACC Center API.

**Parameters:**
- `endpoint` (string): The API endpoint (e.g., '/customer/123')
- `accessToken` (string): The JWT access token from req.cookies.accessToken

**Returns:** Promise<any> - The response data

**Example:**
```javascript
import { accCenterDelete } from "../utils/accCenterApi.js";

const response = await accCenterDelete(
  "/customer/123",
  req.cookies.accessToken
);
```

---

## Error Handling

All functions automatically handle errors and throw with additional context:

- **API Error Response**: Throws error with `error.status` and `error.response` properties
- **Network Error**: Throws error with status 503 and message "ACC Center API is not reachable"
- **Other Errors**: Re-throws the original error

**Example Error Handling:**
```javascript
try {
  const response = await accCenterPost(
    "/customer/create-customer",
    { data: customerData },
    req.cookies.accessToken
  );
} catch (error) {
  // error.status contains HTTP status code
  // error.message contains error message
  // error.response contains full API response (if available)
  return next(errorHandler(error.status || 500, error.message));
}
```

## Configuration

The utility automatically reads `ACCOUNT_CENTER_API_URL` from environment variables.

Make sure it's configured in your `.env` file:
```
ACCOUNT_CENTER_API_URL = http://localhost:8000/api
```
