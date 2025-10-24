import { hutchConfig, smsCache } from "./smsConfig.js";

let externalLogSMS = null;
export const setLogSMSCallback = (fn) => {
  externalLogSMS = fn;
};

export async function sendViaHutch(
  company = {},
  customer_id,
  customer = {},
  message = "",
  type = "",
  normalized = []
) {
  try {
    // Step 1: Login and get token

    const loginUrl = `${hutchConfig.baseUrl}/login`;

    const loginPayload = {
      username: hutchConfig.username,
      password: hutchConfig.password,
    };

    // silent: don't log login payload or requests (contains sensitive info)

    const loginRes = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "X-API-VERSION": "v1",
      },
      body: JSON.stringify(loginPayload),
    });

    // console.log("Login response status:", loginRes.status);
    const loginText = await loginRes.text();
    // console.log("Login response body:", loginText);

    if (!loginRes.ok) {
      console.error("Hutch login failed with status:", loginRes.status);
      return {
        success: false,
        reason: "login_failed",
        status: loginRes.status,
        response: loginText,
      };
    }

    let loginData;
    try {
      loginData = JSON.parse(loginText);
    } catch (e) {
      console.error("Failed to parse login response:", e.message);
      return {
        success: false,
        reason: "login_parse_error",
        rawResponse: loginText,
      };
    }

    if (!loginData.accessToken) {
      console.error("No access token in response:", loginData);
      return {
        success: false,
        reason: "no_token",
        response: loginData,
      };
    }

    const accessToken = loginData.accessToken;
    // login successful; token cached (do not log token)

    // Step 2: Prepare SMS data

    // Use absolute simplest mask

    // Validate and normalize phone number
    // Accept either a single value or an array. Ensure we handle undefined/null entries.
    const numbersArray = Array.isArray(normalized) ? normalized : [normalized];
    let validNumber = null;

    for (const num of numbersArray) {
      if (num == null) continue; // skip undefined/null entries
      const cleanNum = String(num)
        .trim()
        .replace(/[^0-9]/g, "");
      if (cleanNum.startsWith("07") && cleanNum.length === 10) {
        validNumber = "94" + cleanNum.substring(1);
        break;
      } else if (cleanNum.startsWith("947") && cleanNum.length === 11) {
        validNumber = cleanNum;
        break;
      }
    }

    if (!validNumber) {
      console.error("No valid phone number found for sending SMS:", normalized);
      return {
        success: false,
        reason: "invalid_number",
        numbers: normalized,
      };
    }
    // Create minimal payload
    const payload = {
      campaignName: `otp_${Date.now()}`,
      mask: company.mask,
      numbers: validNumber,
      content: message,
    };

    // Step 3: Send SMS
    const smsUrl = `${hutchConfig.baseUrl}/sendsms`;

    const smsRes = await fetch(smsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "X-API-VERSION": "v1",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const responseText = await smsRes.text();

    // Try to parse response
    let result = {};
    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse SMS response as JSON:", e.message);
        result = { raw: responseText };
      }
    }

    // Analyze the response
    if (smsRes.ok && result.serverRef) {
      // SMS sent successfully
      if (typeof externalLogSMS === "function") {
        try {
          await externalLogSMS(customer_id, customer, message, type);
        } catch (logErr) {
          console.error("External log error:", logErr);
        }
      }

      return {
        success: true,
        serverRef: result.serverRef,
      };
    } else {
      let reason = "send_failed";
      if (smsRes.status === 400) reason = "bad_request";
      if (smsRes.status === 401) reason = "unauthorized";
      if (smsRes.status === 403) reason = "forbidden";

      return {
        success: false,
        reason: reason,
        status: smsRes.status,
        response: result,
        rawResponse: responseText,
      };
    }
  } catch (error) {
    console.error("✗ Exception in sendViaHutch:", error);
    return {
      success: false,
      reason: "exception",
      error: error.message,
    };
  }
}

export default { sendViaHutch, setLogSMSCallback };
