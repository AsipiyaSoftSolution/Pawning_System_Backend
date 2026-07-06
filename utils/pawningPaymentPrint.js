import { pool, pool2 } from "./db.js";
import { customerApi } from "../api/accountCenterApi.js";

/**
 * Build a payment row shaped like payment-history results for receipt printing.
 */
export async function buildPawningPaymentPrintRow({
  paymentId,
  paymentAmount,
  paidInterest = 0,
  paidServiceCharge = 0,
  paidLateCharges = 0,
  paidAdditionalCharges = 0,
  paidAdvance = 0,
  paidEarlySettlement = 0,
  paymentType,
  description,
  ticketNo,
  netWeight,
  seqNo,
  customerId,
  userId,
  companyId,
  accessToken,
  dateTime = new Date(),
}) {
  let customerName = "Unknown";

  if (customerId) {
    const [pawningCustomer] = await pool.query(
      "SELECT accountCenterCusId FROM customer WHERE idCustomer = ?",
      [customerId],
    );

    const accountCenterCusId = pawningCustomer[0]?.accountCenterCusId;
    if (accountCenterCusId) {
      try {
        const response = await customerApi.getCustomersByIds(
          String(accountCenterCusId),
          { asipiyaSoftware: "pawning", companyId },
          accessToken,
        );
        const customer = response.customers?.[0];
        if (customer) {
          const firstName = customer.First_Name || "";
          const lastName = customer.Last_Name || "";
          customerName =
            firstName && lastName
              ? `${firstName} ${lastName}`
              : firstName || lastName || "Unknown";
        }
      } catch {
        /* best-effort */
      }
    }
  }

  let officerName = null;
  if (userId) {
    const [userData] = await pool2.query(
      "SELECT full_name FROM user WHERE idUser = ?",
      [userId],
    );
    officerName = userData[0]?.full_name || null;
  }

  const interestPaid =
    (parseFloat(paidInterest) || 0) +
    (parseFloat(paidServiceCharge) || 0) +
    (parseFloat(paidLateCharges) || 0) +
    (parseFloat(paidAdditionalCharges) || 0);

  return {
    id: paymentId,
    Ticket_no: ticketNo,
    Date_time: dateTime,
    Amount: paymentAmount,
    Advance_Payment: paidAdvance || 0,
    Interest_Payment: paidInterest || 0,
    Service_Charge_Payment: paidServiceCharge || 0,
    Late_Charges_Payment: paidLateCharges || 0,
    Other_Charges_Payment: paidAdditionalCharges || 0,
    Early_Charge_Payment: paidEarlySettlement || 0,
    Type: paymentType,
    Description: description,
    customerName,
    Net_Weight: netWeight,
    SEQ_No: seqNo,
    officerName,
    capitalPaid: paidAdvance || 0,
    interestPaid,
  };
}
