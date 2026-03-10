/**
 * Account Center API - Centralized service for all Account Center backend calls.
 * Wraps accCenterGet/Post/Put from utils/accCenterApi.js with domain-specific methods.
 * All methods accept accessToken as the last parameter.
 */
import {
  accCenterGet,
  accCenterPost,
  accCenterPut,
} from "../utils/accCenterApi.js";

// ─── Approval (check-approval-process lives under /approval, not /customer) ──
export const approvalApi = {
  checkApprovalProcess: (params, accessToken) => {
    const qs = new URLSearchParams(params).toString();
    return accCenterGet(`/approval/check-approval-process?${qs}`, accessToken);
  },
  submitApprovalRequest: (data, accessToken) => {
    return accCenterPost(
      "/approval/submit-approval-request",
      data,
      accessToken,
    );
  },
};

// ─── Customer ──────────────────────────────────────────────────────────────
export const customerApi = {
  createCustomer: (data, accessToken) =>
    accCenterPost("/customer/create-customer", data, accessToken),

  checkNicExists: (params, accessToken) => {
    const qs = new URLSearchParams(params).toString();
    return accCenterGet(`/customer/check-nic-exists?${qs}`, accessToken);
  },

  checkExistsForCreation: (params, accessToken) => {
    const qs = new URLSearchParams(params).toString();
    return accCenterGet(
      `/customer/check-exists-for-creation?${qs}`,
      accessToken,
    );
  },

  findCustomerByNic: (nic, params, accessToken) =>
    accCenterGet(
      `/customer/find-customer-by-nic/${encodeURIComponent(
        nic,
      )}?${new URLSearchParams(params).toString()}`,
      accessToken,
    ),

  getCustomer: (id, params, accessToken) => {
    const qs = new URLSearchParams(params).toString();
    return accCenterGet(`/customer/get-customer/${id}?${qs}`, accessToken);
  },

  getAllCustomers: (params, accessToken) => {
    const qs = new URLSearchParams(params).toString();
    return accCenterGet(`/customer/get-all-customers?${qs}`, accessToken);
  },

  updateCustomer: (id, params, data, accessToken) => {
    const qs = new URLSearchParams(params).toString();
    return accCenterPut(
      `/customer/update-customer/${id}?${qs}`,
      data,
      accessToken,
    );
  },

  searchByNic: (nic, params, accessToken) =>
    accCenterGet(
      `/customer/search-by-nic/${encodeURIComponent(nic)}?${new URLSearchParams(
        params,
      ).toString()}`,
      accessToken,
    ),
};

// ─── Subsystem (Pawning-specific helpers) ──────────────────────────────────
export const subsystemApi = {
  customersByPawningIds: (ids, companyId, accessToken) =>
    accCenterGet(
      `/subsystem/customers-by-pawning-ids?ids=${ids.join(
        ",",
      )}&companyId=${companyId}`,
      accessToken,
    ),

  branchesForTicketFilters: (companyId, accessToken) =>
    accCenterGet(
      `/subsystem/branches-for-ticket-filters?companyId=${companyId}`,
      accessToken,
    ),

  branches: (companyId, accessToken) =>
    accCenterGet(`/subsystem/branches?companyId=${companyId}`, accessToken),

  branchNames: (ids, accessToken) =>
    accCenterGet(`/subsystem/branch-names?ids=${ids.join(",")}`, accessToken),

  findPawningIdsByNic: (nic, companyId, branchId, accessToken) => {
    let url = `/subsystem/find-pawning-ids-by-nic?nic=${encodeURIComponent(
      nic,
    )}&companyId=${companyId}`;
    if (branchId != null) url += `&branchId=${branchId}`;
    return accCenterGet(url, accessToken);
  },

  customerStatus: (companyCustomerId, accessToken) =>
    accCenterGet(
      `/subsystem/customer-status/${companyCustomerId}`,
      accessToken,
    ),

  companySettings: (companyId, accessToken) =>
    accCenterGet(`/subsystem/company-settings/${companyId}`, accessToken),

  assessedValue: (companyId, carat, accessToken) =>
    accCenterGet(
      `/subsystem/assessed-value?companyId=${companyId}&carat=${encodeURIComponent(
        carat,
      )}`,
      accessToken,
    ),

  userNames: (ids, accessToken) =>
    accCenterGet(`/subsystem/user-names?ids=${ids.join(",")}`, accessToken),

  articleType: (id, accessToken) =>
    accCenterGet(`/subsystem/article-type/${id}`, accessToken),

  articleCategory: (id, accessToken) =>
    accCenterGet(`/subsystem/article-category/${id}`, accessToken),

  ticketFormat: (companyId, accessToken) =>
    accCenterGet(`/subsystem/ticket-format/${companyId}`, accessToken),

  customersByCompanyCustomerIds: (ids, companyId, accessToken) =>
    accCenterGet(
      `/subsystem/customers-by-company-customer-ids?ids=${ids.join(
        ",",
      )}&companyId=${companyId}`,
      accessToken,
    ),

  branch: (branchId, companyId, accessToken) =>
    accCenterGet(
      `/subsystem/branch/${branchId}?companyId=${companyId}`,
      accessToken,
    ),

  customerCountByBranch: (branchId, companyId, accessToken) =>
    accCenterGet(
      `/subsystem/customer-count-by-branch?branchId=${branchId}&companyId=${companyId}`,
      accessToken,
    ),

  cashAndBankAccounts: (branchId, companyId, accessToken) =>
    accCenterGet(`/subsystem/${branchId}/cash-and-bank-accounts`, accessToken),

  pawningArticleTypeAndDescription: (
    articleTypeId,
    articleCategoryId,
    accessToken,
  ) =>
    accCenterGet(
      `/subsystem/article-type-and-description?articleTypeId=${articleTypeId}&articleCategoryId=${articleCategoryId}`,
      accessToken,
    ),

  customerDataForPawningTicketView: (customerId, accessToken) =>
    accCenterGet(
      `/subsystem/customer-data-for-pawning-ticket-view?customerId=${customerId}`,
      accessToken,
    ),

  customerDataForPawningSideTicketPages: (customerId, accessToken) =>
    accCenterGet(
      `/subsystem/customer-data-for-pawning-side-ticket-pages?customerId=${customerId}`,
      accessToken,
    ),

  searchCustomerByTerm: (searchTerm, companyId, branchId, accessToken) =>
    accCenterGet(
      `/subsystem/search-customer?searchTerm=${encodeURIComponent(
        searchTerm,
      )}&companyId=${companyId}&branchId=${branchId}`,
      accessToken,
    ),

  getSMSTemplate: (branchId, templateName, accessToken) =>
    accCenterGet(
      `/subsystem/${branchId}/sms-templates?subSystem=pawning&templateName=${templateName}`,
      accessToken,
    ),

  sendSMS: (
    branchId,
    templateName,
    accessToken,
    customerId,
    smsText,
    smsType,
  ) =>
    accCenterPost(
      `/subsystem/${branchId}/send-sms`,
      {
        customerId,
        smsText,
        smsType,
        templateName,
        asipiyaSoftware: "pawning",
        templateName,
      },
      accessToken,
    ),

  createCustomerLogOnCreateTicket: (branchId, data, accessToken) =>
    accCenterPost(`/subsystem/${branchId}/customer-log`, data, accessToken),
};

// Pawning Payments
export const pawningPaymentsApi = {
  ticketPaymentsDoubleEntries: (data, accessToken) => {
    return accCenterPost(
      "/double-entries/pawning-ticket-payments-double-entries",
      data,
      accessToken,
    );
  },

  ticketInterestDoubleEntries: (data, accessToken) => {
    return accCenterPost(
      "/double-entries/pawning-ticket-interest-double-entries",
      data,
      accessToken,
    );
  },

  ticketPenaltyDoubleEntries: (data, accessToken) => {
    return accCenterPost(
      "/double-entries/pawning-ticket-penalty-double-entries",
      data,
      accessToken,
    );
  },
};
