import { pool } from "./db.js";
import { subsystemApi } from "../api/accountCenterApi.js";

/**
 * Sends a Pawning system SMS asynchronously, catching any errors internally
 * to prevent failing the main request flow.
 */
export const sendPawningSmsSafely = async ({
  branchId,
  templateName,
  accessToken,
  placeholders,
  customerId,
  smsDescription = "pawning system sms",
}) => {
  try {
    const smsTemplateData = await subsystemApi.getSMSTemplate(
      branchId,
      templateName,
      accessToken,
    );

    if (smsTemplateData?.template && smsTemplateData.template.length > 0) {
      let smsText = smsTemplateData.template[0].Template;

      for (const [key, value] of Object.entries(placeholders)) {
        const regex = new RegExp(`@${key}@`, "g");
        smsText = smsText.replace(regex, value);
      }

      const [accCenterCustomer] = await pool.query(
        "SELECT accountCenterCusId FROM customer WHERE idCustomer = ?",
        [customerId],
      );

      if (
        accCenterCustomer.length > 0 &&
        accCenterCustomer[0].accountCenterCusId
      ) {
        await subsystemApi.sendSMS(
          branchId,
          smsTemplateData.template[0].SMS_Type,
          accessToken,
          accCenterCustomer[0].accountCenterCusId,
          smsText,
          smsDescription,
        );
      } else {
        console.warn(
          `[SMS Helper] Customer ${customerId} has no accountCenterCusId. SMS not sent.`,
        );
      }
    } else {
      console.warn(
        `[SMS Helper] SMS Template '${templateName}' not found or inactive.`,
      );
    }
  } catch (error) {
    console.error(
      `[SMS Helper] Failed to send SMS template '${templateName}' safely:`,
      error.message || error,
    );
  }
};
