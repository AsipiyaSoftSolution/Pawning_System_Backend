# Pawning ↔ Account Center – Customer Create & Approval

This document describes how **Pawning** integrates with **Account Center** for customer creation and the approval flow.

> **Full documentation:** See `Account_Center_Backend/SUBSYSTEM_CUSTOMER_APPROVAL.md` for the complete API reference shared by Pawning and Microfinance.

---

## Pawning quick reference

| Item                                    | Value                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `asipiyaSoftware`                       | `"pawning"`                                                                                                                |
| Local ID field                          | `isPawningUserId`                                                                                                          |
| Approval name                           | `"CUSTOMER CREATE"` or `"CREATE CUSTOMER"`                                                                                 |
| Check endpoint                          | `GET {{ACCOUNT_CENTER}}/approval/check-approval-process?companyId=&approvalName=CUSTOMER%20CREATE&asipiyaSoftware=pawning` |
| Create endpoint                         | `POST {{ACCOUNT_CENTER}}/customer/create-customer`                                                                         |
| List approvals                          | `GET {{ACCOUNT_CENTER}}/approval/get-approval-requests-with-approvals?asipiyaSoftware=pawning&source=subSystem&...`        |
| Approve/Reject                          | `POST {{ACCOUNT_CENTER}}/approval/approve-or-reject-approval`                                                              |
| Create-from-approval (Pawning receives) | `POST {{PAWNING_API}}/api/customer/:branchId/create-from-approval`                                                         |

---

## Pawning implementation

### Customer create flow (Pawning backend)

1. **Check approval**: Call Account Center `check-approval-process` with `asipiyaSoftware: "pawning"`.
2. **If approval required**: Call `create-customer` without `isPawningUserId`. No local customer created yet.
3. **If no approval**: Create local customer first, then call `create-customer` with `isPawningUserId = localId`.

### Create-from-approval endpoint (Pawning backend)

- **Route**: `POST /api/customer/:branchId/create-from-approval`
- **Body**: `{ accountCenterCusId, data }`
- **Required in data**: `cus_number` or `Customer_Number`
- **Response**: `{ success: true, customerId: <localId>, message: "..." }`

Account Center calls this when CUSTOMER CREATE is fully approved. Pawning creates the local customer and links it via `accountCenterCusId`.

---

## Account Center configuration

- `PAWNING_SYSTEM_API_URL`: URL of the Pawning API (default: `http://localhost:5000`)
