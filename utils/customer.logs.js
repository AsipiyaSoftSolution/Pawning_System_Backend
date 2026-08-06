import { pool, pool2 } from "../utils/db.js";

/**
 * Resolve Account Center company_customer id (+ branch) from a pawning customer id.
 */
async function resolveAccountCenterCustomer(pawningCustomerId) {
  if (!pawningCustomerId) return { accountCenterCusId: null, branchId: null };
  const [rows] = await pool.query(
    `SELECT accountCenterCusId, Branch_idBranch
     FROM customer
     WHERE idCustomer = ?
     LIMIT 1`,
    [pawningCustomerId],
  );
  return {
    accountCenterCusId: rows[0]?.accountCenterCusId ?? null,
    branchId: rows[0]?.Branch_idBranch ?? null,
  };
}

/**
 * Insert into Account Center company_customer_log (pool2).
 */
export const insertCompanyCustomerLog = async ({
  accountCenterCustomerId,
  userId = null,
  branchId = null,
  asipiyaSoftware = "pawning",
  logType,
  typeId = null,
  description,
}) => {
  if (!accountCenterCustomerId || !logType || !description) {
    throw new Error(
      "accountCenterCustomerId, logType and description are required",
    );
  }

  const [result] = await pool2.query(
    `INSERT INTO company_customer_log (
       Company_Customer_idCompany_Customer,
       Company_User_idCompany_User,
       branch_idbranch,
       Asipiya_Software,
       Log_Type,
       Type_Id,
       Long_Description,
       Log_Timestamp
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      accountCenterCustomerId,
      userId || null,
      branchId || null,
      asipiyaSoftware,
      logType,
      typeId,
      description,
      new Date(),
    ],
  );

  if (result.affectedRows === 0) {
    throw new Error("Failed to create company customer log");
  }
  return result;
};

/**
 * Create customer log when a ticket is created (direct DB write to Account Center).
 * Prefer subsystemApi.createCustomerLogOnCreateTicket when an access token is available.
 */
export const createCustomerLogOnCreateTicket = async (
  type,
  description,
  customerId,
  userId,
  { ticketId = null, branchId = null } = {},
) => {
  try {
    const resolved = await resolveAccountCenterCustomer(customerId);
    const accountCenterCustomerId = resolved.accountCenterCusId || customerId;
    await insertCompanyCustomerLog({
      accountCenterCustomerId,
      userId,
      branchId: branchId || resolved.branchId,
      logType: type,
      typeId: ticketId,
      description,
    });
  } catch (error) {
    console.error("Error creating customer log:", error);
    throw new Error("Error creating customer log");
  }
};

/**
 * Create a customer log when a ticket penalty is applied (Account Center).
 * Does not throw — penalty processing must continue even if logging fails.
 */
export const createCustomerLogOnTicketPenality = async (
  type,
  description,
  customerId,
  userId,
  { ticketId = null, branchId = null } = {},
) => {
  try {
    const resolved = await resolveAccountCenterCustomer(customerId);
    const accountCenterCustomerId = resolved.accountCenterCusId;
    if (!accountCenterCustomerId) {
      console.warn(
        `[customer.logs] Skip penalty log — no accountCenterCusId for pawning customer ${customerId}`,
      );
      return;
    }

    await insertCompanyCustomerLog({
      accountCenterCustomerId,
      userId,
      branchId: branchId || resolved.branchId,
      logType: type || "TICKET PENALTY",
      typeId: ticketId,
      description,
    });
  } catch (error) {
    console.error("Error creating customer log for ticket penality:", error);
    // Soft-fail: do not abort daily penalty / ticket-log processing
  }
};
