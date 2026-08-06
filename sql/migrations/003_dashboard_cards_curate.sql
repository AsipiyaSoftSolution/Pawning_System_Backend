-- Keep only dashboard cards that can be powered by current Pawning features.
-- Removes auction / external market / cashier-reconciliation / incomplete-KYC cards.
-- Also cleans trailing spaces in card names.
--
-- Run against the Pawning database (DB_NAME).

START TRANSACTION;

-- Drop visibility rows for cards we are removing
DELETE FROM user_card_visibility
WHERE card_id IN (5, 8, 23, 27, 41, 43, 50);

DELETE FROM dashboard_cards
WHERE card_id IN (5, 8, 23, 27, 41, 43, 50);

-- Normalize display names (trim spaces / clarify labels)
UPDATE dashboard_cards SET card_name = 'Articles Expiring' WHERE card_id = 1;
UPDATE dashboard_cards SET card_name = 'Overdue Articles' WHERE card_id = 2;
UPDATE dashboard_cards SET card_name = 'Full Transaction Log' WHERE card_id = 3;
UPDATE dashboard_cards SET card_name = 'High-Value Transactions' WHERE card_id = 4;
UPDATE dashboard_cards SET card_name = 'Full Active Article List' WHERE card_id = 6;
UPDATE dashboard_cards SET card_name = 'Vault Inventory Ledger' WHERE card_id = 7;
UPDATE dashboard_cards SET card_name = 'Customer List (CRM)' WHERE card_id = 9;
UPDATE dashboard_cards SET card_name = 'Last Month Settled Articles' WHERE card_id = 10;
UPDATE dashboard_cards SET card_name = 'New Loans' WHERE card_id = 11;
UPDATE dashboard_cards SET card_name = 'Redemptions' WHERE card_id = 12;
UPDATE dashboard_cards SET card_name = 'Interest & Fees Collected' WHERE card_id = 13;
UPDATE dashboard_cards SET card_name = 'Net Cash Flow' WHERE card_id = 14;
UPDATE dashboard_cards SET card_name = 'New Pledges' WHERE card_id = 15;
UPDATE dashboard_cards SET card_name = 'Week-to-Date (WTD) New Loans' WHERE card_id = 16;
UPDATE dashboard_cards SET card_name = 'Month-to-Date (MTD) Interest Income' WHERE card_id = 17;
UPDATE dashboard_cards SET card_name = 'Pledges Renewed this Month' WHERE card_id = 18;
UPDATE dashboard_cards SET card_name = 'Total Active Loan Capital' WHERE card_id = 19;
UPDATE dashboard_cards SET card_name = 'Total Articles in Vault' WHERE card_id = 20;
UPDATE dashboard_cards SET card_name = 'Loan vs Redemption Trend' WHERE card_id = 21;
UPDATE dashboard_cards SET card_name = 'Monthly Income Trend' WHERE card_id = 22;
UPDATE dashboard_cards SET card_name = 'Revenue Sources Breakdown' WHERE card_id = 24;
UPDATE dashboard_cards SET card_name = 'Busiest Hours of the Day' WHERE card_id = 25;
UPDATE dashboard_cards SET card_name = 'New vs Repeat Customers' WHERE card_id = 26;
UPDATE dashboard_cards SET card_name = 'Customer Acquisition Trend' WHERE card_id = 28;
UPDATE dashboard_cards SET card_name = 'Loan Value Distribution' WHERE card_id = 29;
UPDATE dashboard_cards SET card_name = 'Gold Karat Distribution' WHERE card_id = 30;
UPDATE dashboard_cards SET card_name = 'Total Gold Weight Held' WHERE card_id = 31;
UPDATE dashboard_cards SET card_name = 'Average Loan-to-Value (LTV) Ratio' WHERE card_id = 32;
UPDATE dashboard_cards SET card_name = 'Articles Expiring in 7 Days' WHERE card_id = 33;
UPDATE dashboard_cards SET card_name = 'Overdue Articles Count' WHERE card_id = 34;
UPDATE dashboard_cards SET card_name = 'New Customers' WHERE card_id = 39;
UPDATE dashboard_cards SET card_name = 'Last Month Renewals' WHERE card_id = 40;
UPDATE dashboard_cards SET card_name = 'User Activity Log' WHERE card_id = 42;
UPDATE dashboard_cards SET card_name = 'Top Customers by Loan Volume' WHERE card_id = 44;
UPDATE dashboard_cards SET card_name = 'Articles by Status' WHERE card_id = 45;
UPDATE dashboard_cards SET card_name = 'Loan-to-Value (LTV) Ratio Distribution' WHERE card_id = 46;
UPDATE dashboard_cards SET card_name = 'This Month vs Last Month Performance' WHERE card_id = 47;
UPDATE dashboard_cards SET card_name = 'Weekly Performance Snapshot' WHERE card_id = 48;
UPDATE dashboard_cards SET card_name = 'Upcoming Expiry Volume' WHERE card_id = 49;

COMMIT;
