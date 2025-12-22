-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: pawning_system
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accounting_accounts`
--

DROP TABLE IF EXISTS `accounting_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounting_accounts` (
  `idAccounting_Accounts` int NOT NULL AUTO_INCREMENT,
  `Account_Type` varchar(45) DEFAULT NULL,
  `Account_Name` varchar(255) DEFAULT NULL,
  `Account_Code` varchar(45) DEFAULT NULL,
  `Group_Of_Type` varchar(45) DEFAULT NULL,
  `Type` varchar(45) DEFAULT NULL,
  `Cashflow_Type` varchar(45) DEFAULT NULL,
  `Account_Balance` varchar(45) DEFAULT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Parent_Account` varchar(45) DEFAULT NULL,
  `Branch_idBranch` int NOT NULL,
  `User_idUser` int NOT NULL,
  `Account_Number` varchar(200) DEFAULT NULL,
  `Note` longtext,
  `Created_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Cashier_idCashier` int DEFAULT NULL,
  `Description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idAccounting_Accounts`),
  KEY `fk_Accounting_Accounts_Branch1` (`Branch_idBranch`),
  KEY `fk_Accounting_Accounts_User1` (`User_idUser`),
  KEY `fk_user_with_cashier_account` (`Cashier_idCashier`),
  CONSTRAINT `fk_user_with_cashier_account` FOREIGN KEY (`Cashier_idCashier`) REFERENCES `user` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=167 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounting_accounts`
--

LOCK TABLES `accounting_accounts` WRITE;
/*!40000 ALTER TABLE `accounting_accounts` DISABLE KEYS */;
INSERT INTO `accounting_accounts` VALUES (35,'Cash Account','Cash acc ','001','Assets','Cash and Bank',NULL,'11000','1',NULL,1,10,'001',NULL,'2025-10-24 03:43:08',NULL,NULL),(36,'Charted Account','liability acc','002','Liabilities','Liability','Investing activities','76900','1',NULL,1,10,NULL,NULL,'2025-10-24 03:44:12',NULL,''),(37,'Cashier Account','Cashier Account - Malshi Himangana','737866','Assets','Cash and Bank',NULL,'1000','1',NULL,1,10,NULL,NULL,'2025-10-24 05:34:49',60,NULL),(69,'Cash Account','Cash Account - Matara','3-MAT-CASH','Assets','Cash and Bank',NULL,'501250','1',NULL,2,10,'001-3-MAT',NULL,'2025-10-28 03:40:55',NULL,NULL),(70,'Cash Account','Cash Account - Head Office','3-HO-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,3,10,'001-3-HO',NULL,'2025-10-28 03:40:55',NULL,NULL),(71,'Cash Account','Cash Account - Ambalangoda','3-B01-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,4,10,'001-3-B01',NULL,'2025-10-28 03:40:55',NULL,NULL),(72,'Cash Account','Cash Account - Batheeloa','3-B02-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,5,10,'001-3-B02',NULL,'2025-10-28 03:40:55',NULL,NULL),(73,'Cash Account','Cash Account - Chunnakam','3-B03-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,6,10,'001-3-B03',NULL,'2025-10-28 03:40:55',NULL,NULL),(74,'Cash Account','Cash Account - Divulapitiya','3-B04-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,7,10,'001-3-B04',NULL,'2025-10-28 03:40:55',NULL,NULL),(75,'Cash Account','Cash Account - Gampaha','3-B05-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,8,10,'001-3-B05',NULL,'2025-10-28 03:40:55',NULL,NULL),(76,'Cash Account','Cash Account - Jaffna','3-B06-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,9,10,'001-3-B06',NULL,'2025-10-28 03:40:55',NULL,NULL),(77,'Cash Account','Cash Account - Kaduwela','3-B07-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,10,10,'001-3-B07',NULL,'2025-10-28 03:40:55',NULL,NULL),(78,'Cash Account','Cash Account - Kalmunai','3-B08-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,11,10,'001-3-B08',NULL,'2025-10-28 03:40:55',NULL,NULL),(79,'Cash Account','Cash Account - Kekirawa','3-B09-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,12,10,'001-3-B09',NULL,'2025-10-28 03:40:55',NULL,NULL),(80,'Cash Account','Cash Account - Kiribathgoda','3-B10-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,13,10,'001-3-B10',NULL,'2025-10-28 03:40:55',NULL,NULL),(81,'Cash Account','Cash Account - Negombo','3-B11-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,14,10,'001-3-B11',NULL,'2025-10-28 03:40:55',NULL,NULL),(82,'Cash Account','Cash Account - Trincomalee','3-B12-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,15,10,'001-3-B12',NULL,'2025-10-28 03:40:55',NULL,NULL),(83,'Cash Account','Cash Account - Vavuniya','3-B13-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,16,10,'001-3-B13',NULL,'2025-10-28 03:40:55',NULL,NULL),(84,'Cash Account','Cash Account - Wattala','3-B14-CASH','Assets','Cash and Bank',NULL,'500000','1',NULL,17,10,'001-3-B14',NULL,'2025-10-28 03:40:55',NULL,NULL),(100,'Charted Account','test acc','1010','Expenses','Exchange Rate Loss','Operating activities','0','1',NULL,1,10,NULL,NULL,'2025-11-19 05:16:40',NULL,''),(101,'Cash Account','test cash account','1090','Assets','Cash and Bank',NULL,'700','1',NULL,1,10,'1090',NULL,'2025-11-19 05:37:48',NULL,NULL),(102,'Charted Account','addWD','dsd','Expenses','Provision for Loan Impairment','Financing activities','0','1',NULL,1,10,NULL,NULL,'2025-11-20 06:01:16',NULL,'DSAD'),(103,'Cash Account','Cash Head Office One','001','Assets','Cash and Bank',NULL,'57511000','1',NULL,18,10,'001',NULL,'2025-11-21 03:51:13',NULL,NULL),(104,'Cash Account','Cash Head Office Two','002','Assets','Cash and Bank',NULL,'9000','1',NULL,18,10,'002',NULL,'2025-11-21 03:51:26',NULL,NULL),(105,'Cash Account','Cash Head Office Three','003','Assets','Cash and Bank',NULL,'94000','1',NULL,18,10,'003',NULL,'2025-11-21 04:32:37',NULL,NULL),(106,'Cash Account','Test Cash','002','Assets','Cash and Bank',NULL,'2000','1',NULL,2,10,'002',NULL,'2025-11-21 04:32:55',NULL,NULL),(107,'Bank Account','test bank','1001','Assets','Cash and Bank',NULL,'1500','1',NULL,1,10,'4414141',NULL,'2025-11-21 06:02:33',NULL,NULL),(108,'Bank Account','D','ADSD','Assets','Cash and Bank',NULL,'2000','1',NULL,1,10,'123123',NULL,'2025-11-21 06:05:41',NULL,NULL),(109,'Cash Account','dsad','2123','Assets','Cash and Bank',NULL,'0','1',NULL,1,10,'2123',NULL,'2025-11-21 06:06:45',NULL,NULL),(110,'Cash Account','adsd','231','Assets','Cash and Bank',NULL,'44000','1',NULL,1,10,'231',NULL,'2025-11-21 06:07:55',NULL,NULL),(111,'Cash Account','test aa ','1091','Assets','Cash and Bank',NULL,'0','1',NULL,1,10,'1091',NULL,'2025-11-21 06:08:30',NULL,NULL),(112,'Cash Account','test acc','10000','Assets','Cash and Bank',NULL,'0','1',NULL,1,10,'10000',NULL,'2025-11-21 06:16:01',NULL,NULL),(113,'Cash Account','test cash acc','1000','Assets','Cash and Bank',NULL,'0','1',NULL,2,10,'1000',NULL,'2025-11-21 06:29:22',NULL,NULL),(145,'Charted Account','Head Office Transfer Account',NULL,'Liabilities','Current Liabilities',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(146,'Charted Account','Pawning Plot Account',NULL,'Assets','Cash and Bank',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(147,'System Default','Cash / Bank','1000','Assets','Assets',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(148,'System Default','Pawned Items Inventory (Gold Stock)','1100','Assets','Assets',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(149,'System Default','Pawn Loan Receivable','1200','Assets','Assets',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(150,'System Default','Pawning Interest Receivable','1300','Assets','Assets',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(151,'System Default','Auction Receivables','1400','Assets','Assets',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(152,'System Default','Penalty / Overdue Charges Receivable','1500','Assets','Assets',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(153,'System Default','Customer Payable - Excess Auction Proceeds','2000','Liabilities','Liabilities',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(154,'System Default','Other Payables','2100','Liabilities','Liabilities',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(155,'System Default','Deferred Service Charge','2200','Liabilities','Liabilities',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(156,'System Default','Stamp Duty Payable','2300','Liabilities','Liabilities',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(157,'System Default','Pawning Interest Revenue','4000','Revenue','Revenue',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(158,'System Default','Pawn Service Charge / Handling Fee Revenue','4100','Revenue','Revenue',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(159,'System Default','Pawn Auction Profit Revenue','4200','Revenue','Revenue',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(160,'System Default','Penalty / Overdue Charges Revenue','4300','Revenue','Revenue',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(161,'System Default','Early Settlement Charge Revenue','4400','Revenue','Revenue',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(162,'System Default','Auction Expense','5000','Expense','Expense',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(163,'System Default','Gold Testing / Valuation Expense','5100','Expense','Expense',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(164,'System Default','Cashier Excess & Shortage','5200','Expense','Expense',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(165,'System Default',' Stamp Duty Expense','5300','Expense','Expense',NULL,'0','1',NULL,1,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL),(166,'Charted Account','Galle_Branch Transfer Account',NULL,'Assets','Current Assets',NULL,'0','1',NULL,18,10,NULL,NULL,'2025-12-10 09:03:44',NULL,NULL);
/*!40000 ALTER TABLE `accounting_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accounting_accounts_log`
--

DROP TABLE IF EXISTS `accounting_accounts_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounting_accounts_log` (
  `idAccounting_Accounts_Log` int NOT NULL AUTO_INCREMENT,
  `Accounting_Accounts_idAccounting_Accounts` int NOT NULL,
  `Date_Time` varchar(45) DEFAULT NULL,
  `Type` longtext,
  `Description` varchar(545) DEFAULT NULL,
  `Debit` varchar(45) DEFAULT NULL,
  `Credit` varchar(45) DEFAULT NULL,
  `Balance` varchar(45) DEFAULT NULL,
  `Contra_Account` int DEFAULT NULL,
  `User_idUser` int NOT NULL,
  PRIMARY KEY (`idAccounting_Accounts_Log`),
  KEY `fk_Accounting_Accounts_Log_Accounting_Accounts1` (`Accounting_Accounts_idAccounting_Accounts`),
  KEY `fk_accounting_log_user` (`User_idUser`),
  KEY `fk_accounting_contra_account` (`Contra_Account`),
  CONSTRAINT `fk_accounting_contra_account` FOREIGN KEY (`Contra_Account`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`),
  CONSTRAINT `fk_accounting_log_user` FOREIGN KEY (`User_idUser`) REFERENCES `user` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=823 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accounting_accounts_log`
--

LOCK TABLES `accounting_accounts_log` WRITE;
/*!40000 ALTER TABLE `accounting_accounts_log` DISABLE KEYS */;
INSERT INTO `accounting_accounts_log` VALUES (793,35,'2025-12-10 11:24:39.871','Manual Journal Entry - test 01','Amount Credited via Manual Journal - test 01 | Amount: 1000 | Group of Type: Assets | Account Type: Cash and Bank','0','1000','12000',NULL,10),(794,107,'2025-12-10 11:24:39.875','Manual Journal Entry - test 01','Amount Debited via Manual Journal - test 01 | Amount: 1000 | Group of Type: Assets | Account Type: Cash and Bank','1000','0','1500',NULL,10),(795,110,'2025-12-10 11:26:56.179','Manual Journal Entry - test 02 (head to galle)','Amount Credited via Manual Journal - test 02 (head to galle) | Amount: 1000 | Group of Type: Assets | Account Type: Cash and Bank','0','1000','44000',NULL,10),(796,108,'2025-12-10 11:26:56.183','Manual Journal Entry - test 02 (head to galle)','Amount Debited via Manual Journal - test 02 (head to galle) | Amount: 1000 | Group of Type: Assets | Account Type: Cash and Bank','1000','0','1000',NULL,10),(797,104,'2025-12-10 11:28:01.540','Manual Journal Entry - test 03 (head to head)','Amount Credited via Manual Journal - test 03 (head to head) | Amount: 1000 | Group of Type: Assets | Account Type: Cash and Bank','0','1000','9000',NULL,10),(798,103,'2025-12-10 11:28:01.544','Manual Journal Entry - test 03 (head to head)','Amount Debited via Manual Journal - test 03 (head to head) | Amount: 1000 | Group of Type: Assets | Account Type: Cash and Bank','1000','0','57511000',NULL,10),(799,35,'2025-12-10 12:15:32.703','Manual Journal Entry - test 04','Amount Credited via Manual Journal - test 04 | Amount: 1000 | Group of Type: Assets | Account Type: Cash and Bank','0','1000','11000',NULL,10),(800,108,'2025-12-10 12:15:32.707','Manual Journal Entry - test 04','Amount Debited via Manual Journal - test 04 | Amount: 1000 | Group of Type: Assets | Account Type: Cash and Bank','1000','0','2000',NULL,10),(801,145,'2025-12-10 14:33:44.129','Charted Account Creation','Charted Account created. Group of Account: Liabilities, Account Name: Head Office Transfer Account, Cash Flow Type: null','0','0','0',NULL,10),(802,146,'2025-12-10 14:33:44.138','Charted Account Creation','Charted Account created. Group of Account: Assets, Account Name: Pawning Plot Account, Cash Flow Type: null','0','0','0',NULL,10),(803,147,'2025-12-10 14:33:44.146','Charted Account Creation','Charted Account created. Group of Account: Assets, Account Name: Cash / Bank, Cash Flow Type: null','0','0','0',NULL,10),(804,148,'2025-12-10 14:33:44.156','Charted Account Creation','Charted Account created. Group of Account: Assets, Account Name: Pawned Items Inventory (Gold Stock), Cash Flow Type: null','0','0','0',NULL,10),(805,149,'2025-12-10 14:33:44.165','Charted Account Creation','Charted Account created. Group of Account: Assets, Account Name: Pawn Loan Receivable, Cash Flow Type: null','0','0','0',NULL,10),(806,150,'2025-12-10 14:33:44.176','Charted Account Creation','Charted Account created. Group of Account: Assets, Account Name: Pawning Interest Receivable, Cash Flow Type: null','0','0','0',NULL,10),(807,151,'2025-12-10 14:33:44.185','Charted Account Creation','Charted Account created. Group of Account: Assets, Account Name: Auction Receivables, Cash Flow Type: null','0','0','0',NULL,10),(808,152,'2025-12-10 14:33:44.193','Charted Account Creation','Charted Account created. Group of Account: Assets, Account Name: Penalty / Overdue Charges Receivable, Cash Flow Type: null','0','0','0',NULL,10),(809,153,'2025-12-10 14:33:44.202','Charted Account Creation','Charted Account created. Group of Account: Liabilities, Account Name: Customer Payable - Excess Auction Proceeds, Cash Flow Type: null','0','0','0',NULL,10),(810,154,'2025-12-10 14:33:44.210','Charted Account Creation','Charted Account created. Group of Account: Liabilities, Account Name: Other Payables, Cash Flow Type: null','0','0','0',NULL,10),(811,155,'2025-12-10 14:33:44.219','Charted Account Creation','Charted Account created. Group of Account: Liabilities, Account Name: Deferred Service Charge, Cash Flow Type: null','0','0','0',NULL,10),(812,156,'2025-12-10 14:33:44.227','Charted Account Creation','Charted Account created. Group of Account: Liabilities, Account Name: Stamp Duty Payable, Cash Flow Type: null','0','0','0',NULL,10),(813,157,'2025-12-10 14:33:44.235','Charted Account Creation','Charted Account created. Group of Account: Income, Account Name: Pawning Interest Income, Cash Flow Type: null','0','0','0',NULL,10),(814,158,'2025-12-10 14:33:44.243','Charted Account Creation','Charted Account created. Group of Account: Income, Account Name: Pawn Service Charge / Handling Fee Income, Cash Flow Type: null','0','0','0',NULL,10),(815,159,'2025-12-10 14:33:44.250','Charted Account Creation','Charted Account created. Group of Account: Income, Account Name: Pawn Auction Profit Income, Cash Flow Type: null','0','0','0',NULL,10),(816,160,'2025-12-10 14:33:44.259','Charted Account Creation','Charted Account created. Group of Account: Income, Account Name: Penalty / Overdue Charges Income, Cash Flow Type: null','0','0','0',NULL,10),(817,161,'2025-12-10 14:33:44.273','Charted Account Creation','Charted Account created. Group of Account: Income, Account Name: Early Settlement Charge Income, Cash Flow Type: null','0','0','0',NULL,10),(818,162,'2025-12-10 14:33:44.282','Charted Account Creation','Charted Account created. Group of Account: Expense, Account Name: Auction Expense, Cash Flow Type: null','0','0','0',NULL,10),(819,163,'2025-12-10 14:33:44.291','Charted Account Creation','Charted Account created. Group of Account: Expense, Account Name: Gold Testing / Valuation Expense, Cash Flow Type: null','0','0','0',NULL,10),(820,164,'2025-12-10 14:33:44.298','Charted Account Creation','Charted Account created. Group of Account: Expense, Account Name: Cashier Excess & Shortage, Cash Flow Type: null','0','0','0',NULL,10),(821,165,'2025-12-10 14:33:44.306','Charted Account Creation','Charted Account created. Group of Account: Expense, Account Name:  Stamp Duty Expense, Cash Flow Type: null','0','0','0',NULL,10),(822,166,'2025-12-10 14:33:44.315','Charted Account Creation','Charted Account created. Group of Account: Assets, Account Name: Test01_Branch Transfer Account, Cash Flow Type: null','0','0','0',NULL,10);
/*!40000 ALTER TABLE `accounting_accounts_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `additional_charges`
--

DROP TABLE IF EXISTS `additional_charges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `additional_charges` (
  `idAdditional_Charges` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `Amount` varchar(45) DEFAULT NULL,
  `Pawning_Ticket_idPawning_Ticket` int NOT NULL,
  `Date_Time` varchar(45) DEFAULT NULL,
  `Note` text,
  `User_idUser` int NOT NULL,
  PRIMARY KEY (`idAdditional_Charges`),
  KEY `fk_Additional_Charges_Pawning_Ticket1` (`Pawning_Ticket_idPawning_Ticket`),
  KEY `fk_Additional_Charges_User1` (`User_idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `additional_charges`
--

LOCK TABLES `additional_charges` WRITE;
/*!40000 ALTER TABLE `additional_charges` DISABLE KEYS */;
INSERT INTO `additional_charges` VALUES (1,'none','1200',22,'2025-09-17 07:46:37','none',10),(2,'new','11',22,'2025-09-17 07:48:09','new',10),(3,'new','100',20,'2025-09-17 07:49:03','new',10),(4,'new test','300',20,'2025-09-17 07:51:03','new test',10),(5,'none','1200',20,'2025-09-17 07:56:20','',10),(6,'new','122',17,'2025-09-17 07:58:46','',10),(7,'new','11',18,'2025-09-17 08:01:35','',10),(8,'new one','18000',18,'2025-09-17 08:02:36','new one',10),(9,'charge','1200',31,'2025-09-17 08:12:42','',10),(10,'charge','1300',31,'2025-09-17 08:13:33','',10),(11,'new','1300',31,'2025-09-17 08:16:42','',10),(12,'dd','500',31,'2025-09-17 08:17:34','',10),(13,'ss','100',136,'2025-11-26 09:14:26','',10);
/*!40000 ALTER TABLE `additional_charges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `amount_approvals`
--

DROP TABLE IF EXISTS `amount_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `amount_approvals` (
  `idAmount_Approvals` int NOT NULL AUTO_INCREMENT,
  `Max_Approval_Amount` varchar(45) DEFAULT NULL,
  `Designation_idDesignation` int NOT NULL,
  PRIMARY KEY (`idAmount_Approvals`),
  KEY `fk_Amount_Approvals_Designation1` (`Designation_idDesignation`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amount_approvals`
--

LOCK TABLES `amount_approvals` WRITE;
/*!40000 ALTER TABLE `amount_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `amount_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `amount_for_caratage`
--

DROP TABLE IF EXISTS `amount_for_caratage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `amount_for_caratage` (
  `idAmount_For_Caratage` int NOT NULL AUTO_INCREMENT,
  `Caratage` varchar(45) DEFAULT NULL,
  `Amount` varchar(45) DEFAULT NULL,
  `Product_Plan_idProduct_Plan` int NOT NULL,
  PRIMARY KEY (`idAmount_For_Caratage`),
  KEY `fk_Amount_For_Caratage_Product_Plan1` (`Product_Plan_idProduct_Plan`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `amount_for_caratage`
--

LOCK TABLES `amount_for_caratage` WRITE;
/*!40000 ALTER TABLE `amount_for_caratage` DISABLE KEYS */;
/*!40000 ALTER TABLE `amount_for_caratage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `article_categories`
--

DROP TABLE IF EXISTS `article_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `article_categories` (
  `idArticle_Categories` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `Article_types_idArticle_types` int NOT NULL,
  PRIMARY KEY (`idArticle_Categories`),
  KEY `fk_artical_types` (`Article_types_idArticle_types`),
  CONSTRAINT `fk_artical_types` FOREIGN KEY (`Article_types_idArticle_types`) REFERENCES `article_types` (`idArticle_Types`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `article_categories`
--

LOCK TABLES `article_categories` WRITE;
/*!40000 ALTER TABLE `article_categories` DISABLE KEYS */;
INSERT INTO `article_categories` VALUES (1,'new test category updated','2024-08-13 19:41:29','2025-09-16 04:10:03',1),(2,'Ladies Ring ','2024-08-14 14:57:18','2024-08-14 14:57:18',1),(3,'Gents Ring','2024-08-15 13:54:45','2024-08-15 13:54:45',1),(4,'Baby Ring','2024-08-15 15:17:48','2024-08-15 15:17:48',1),(5,'Ring with Enamle','2024-08-16 14:04:02','2024-08-16 14:04:02',1),(6,'Wedding Ring','2024-08-16 16:53:01','2024-08-16 16:53:01',1),(7,'Engagement Ring ','2024-08-16 18:23:15','2024-08-16 18:23:15',1),(8,'Box chain ','2024-08-16 18:23:31','2024-08-16 18:23:31',1),(9,'Curb Chain ','2024-08-17 03:57:08','2024-08-17 03:57:08',1),(11,'Snake Chain','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(12,'Ball Chain','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(13,'Singapore Chain','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(14,'Diamond Chain ','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(15,'Bangles Bracelet ','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(16,'Cuffs Bracelet','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(17,'Chain Bracelet ','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(18,'Flat  Bracelet','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(19,'Cuffs Bangle ','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(20,'Chain Bnagle','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(21,'Studded Bangle','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(22,'Earings with stone','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(23,'Gypsies ','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(25,'Classic Round Studs','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(26,'Princess Cut Studs','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(27,'Heart-Shaped Studs','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(28,'Cluster Studs','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(29,'Diamond Studs','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(30,'Gemstone Studs','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(31,'Ball Studs','2024-08-17 03:58:23','2024-08-17 03:58:23',1),(54,'With Pendant','2024-08-29 21:32:24','2024-08-29 21:32:24',1),(55,'Normal','2024-08-29 21:33:34','2024-08-29 21:33:34',1),(56,'Machine Cut','2024-09-02 18:45:08','2024-09-02 18:45:08',1),(57,'Design','2024-09-02 18:45:28','2024-09-02 18:45:28',1),(59,'new test category','2025-07-24 06:25:58',NULL,1),(60,'new test category','2025-07-24 06:27:53',NULL,2),(61,'new test category','2025-07-25 04:35:34',NULL,18),(62,'new','2025-09-16 04:10:16',NULL,1),(64,'Men\'s ring','2025-09-24 16:02:23',NULL,19),(65,'Women necklace','2025-09-24 16:02:49',NULL,20);
/*!40000 ALTER TABLE `article_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `article_conditions`
--

DROP TABLE IF EXISTS `article_conditions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `article_conditions` (
  `idArticle_conditions` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `Company_idCompany` int NOT NULL,
  PRIMARY KEY (`idArticle_conditions`),
  KEY `fk_company` (`Company_idCompany`),
  CONSTRAINT `fk_company` FOREIGN KEY (`Company_idCompany`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `article_conditions`
--

LOCK TABLES `article_conditions` WRITE;
/*!40000 ALTER TABLE `article_conditions` DISABLE KEYS */;
INSERT INTO `article_conditions` VALUES (6,'New','2025-09-03 05:53:59','2025-09-27 03:42:21',1),(7,'Like New','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(8,'Very Good','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(9,'Good','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(10,'Fair','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(11,'Poor','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(12,'Damaged','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(13,'Refurbished','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(14,'Open Box','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(16,'Used - Good','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(17,'Used - Acceptable','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(18,'For Parts','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(19,'Brand New','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(20,'Scratched','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(21,'Minor Wear','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(22,'Heavily Used','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(23,'Display Model','2025-09-03 05:53:59','2025-09-03 05:53:59',1),(24,'Tested Working 2','2025-09-03 05:53:59','2025-11-20 10:50:12',1),(26,'New','2025-09-24 16:01:58',NULL,3),(27,'Used','2025-09-24 16:02:03',NULL,3);
/*!40000 ALTER TABLE `article_conditions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `article_types`
--

DROP TABLE IF EXISTS `article_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `article_types` (
  `idArticle_Types` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `Company_idCompany` int NOT NULL,
  PRIMARY KEY (`idArticle_Types`),
  KEY `fk_article_types_for_company` (`Company_idCompany`),
  CONSTRAINT `fk_article_types_for_company` FOREIGN KEY (`Company_idCompany`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `article_types`
--

LOCK TABLES `article_types` WRITE;
/*!40000 ALTER TABLE `article_types` DISABLE KEYS */;
INSERT INTO `article_types` VALUES (1,'Ring','2024-08-13 19:39:34','2024-08-13 19:39:34',1),(2,'Bracelet ','2024-08-13 19:40:18','2024-08-13 19:40:18',1),(3,'Chain','2024-08-14 14:56:33','2024-08-14 14:56:33',1),(4,'Studs','2024-08-15 13:53:42','2024-08-15 13:53:42',1),(5,'Bangle','2024-08-15 13:53:57','2024-08-15 13:53:57',1),(7,'Pendant','2024-08-15 15:17:18','2024-08-15 15:17:18',1),(8,'Panchayuda','2024-08-15 19:15:34','2024-08-15 19:15:34',1),(9,'Necklace','2024-08-15 19:20:42','2025-09-28 01:19:32',1),(12,'Thali Kodi ','2024-08-17 03:54:53','2024-08-17 03:54:53',1),(15,'Necklace','2024-08-28 21:12:43','2024-08-28 21:12:43',1),(17,'new test 2','2025-07-24 05:18:18',NULL,1),(18,'new test 3 updated','2025-07-25 04:30:15','2025-07-25 04:32:50',1),(19,'Rings','2025-09-24 16:02:08',NULL,3),(20,'Necklace','2025-09-24 16:02:30',NULL,3),(22,'test','2025-09-28 01:50:13',NULL,1);
/*!40000 ALTER TABLE `article_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `assessed_value`
--

DROP TABLE IF EXISTS `assessed_value`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assessed_value` (
  `idAssessed_Value` int NOT NULL AUTO_INCREMENT,
  `Carat` int DEFAULT NULL,
  `Amount` float DEFAULT NULL,
  `Company_idCompany` int NOT NULL,
  `Last_Updated_Time` varchar(255) DEFAULT NULL,
  `Last_Updated_User` int NOT NULL,
  PRIMARY KEY (`idAssessed_Value`,`Company_idCompany`),
  KEY `fk_company_assessed` (`Company_idCompany`),
  KEY `fk_last_updated_user` (`Last_Updated_User`),
  CONSTRAINT `fk_company_assessed` FOREIGN KEY (`Company_idCompany`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE,
  CONSTRAINT `fk_last_updated_user` FOREIGN KEY (`Last_Updated_User`) REFERENCES `user` (`idUser`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `assessed_value`
--

LOCK TABLES `assessed_value` WRITE;
/*!40000 ALTER TABLE `assessed_value` DISABLE KEYS */;
INSERT INTO `assessed_value` VALUES (2,18,22090.9,2,'2025-10-20 08:57:49',33),(3,20,24545.4,2,'2025-10-20 08:57:49',33),(4,22,27000,2,'2025-10-20 08:57:49',33),(5,24,29454.6,2,'2025-10-20 08:57:49',33),(6,17,20863.6,2,'2025-10-20 08:57:49',33),(7,19,23318.2,2,'2025-10-20 08:57:49',33),(8,21,25772.7,2,'2025-10-20 08:57:49',33),(9,23,28227.3,2,'2025-10-20 08:57:49',33),(10,16,19636.4,2,'2025-10-20 08:57:49',33),(11,16,8500,3,'2025-10-01 09:17:47',28),(12,17,9000,3,'2025-10-01 09:17:47',28),(13,18,9500,3,'2025-10-01 09:17:47',28),(14,19,10000,3,'2025-10-01 09:17:47',28),(15,20,10500,3,'2025-10-01 09:17:47',28),(16,21,11000,3,'2025-10-01 09:17:47',28),(17,22,11500,3,'2025-10-01 09:17:47',28),(18,23,12000,3,'2025-10-01 09:17:47',28),(19,24,12500,3,'2025-10-01 09:17:47',28),(25,16,17454.6,1,'2025-11-18 08:46:32',10),(26,17,18545.4,1,'2025-11-18 08:46:33',10),(27,18,19636.4,1,'2025-11-18 08:46:33',10),(28,19,20727.3,1,'2025-11-18 08:46:33',10),(29,20,21818.2,1,'2025-11-18 08:46:33',10),(30,21,22909.1,1,'2025-11-18 08:46:33',10),(31,22,24000,1,'2025-11-18 08:46:33',10),(32,23,25090.9,1,'2025-11-18 08:46:33',10),(33,24,26181.8,1,'2025-11-18 08:46:33',10);
/*!40000 ALTER TABLE `assessed_value` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branch`
--

DROP TABLE IF EXISTS `branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branch` (
  `idBranch` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(45) DEFAULT NULL,
  `Address` text,
  `Contact_No` varchar(45) DEFAULT NULL,
  `Company_idCompany` int NOT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Branch_Code` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idBranch`),
  KEY `fk_Branch_Company` (`Company_idCompany`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branch`
--

LOCK TABLES `branch` WRITE;
/*!40000 ALTER TABLE `branch` DISABLE KEYS */;
INSERT INTO `branch` VALUES (1,'Galle','Galle road 120','075024184',1,'1','1-B01'),(2,'Matara','Matara road 31/7','0771908671',1,'1','1-B02'),(3,'Head Office',NULL,NULL,3,'1','3-HO'),(4,'Ambalangoda',NULL,NULL,3,'1','3-B01'),(5,'Batticaloa',NULL,NULL,3,'1','3-B02'),(6,'Chunnakam',NULL,NULL,3,'1','3-B03'),(7,'Divulapitiya',NULL,NULL,3,'1','3-B04'),(8,'Gampaha',NULL,NULL,3,'1','3-B05'),(9,'Jaffna',NULL,NULL,3,'1','3-B06'),(10,'Kaduwela',NULL,NULL,3,'1','3-B07'),(11,'Kalmunai',NULL,NULL,3,'1','3-B08'),(12,'Kekirawa',NULL,NULL,3,'1','3-B09'),(13,'Kiribathgoda',NULL,NULL,3,'1','3-B10'),(14,'Negombo',NULL,NULL,3,'1','3-B11'),(15,'Trincomalee',NULL,NULL,3,'1','3-B12'),(16,'Vavuniya',NULL,NULL,3,'1','3-B13'),(17,'Wattala',NULL,NULL,3,'1','3-B14'),(18,'Head Office',NULL,NULL,1,'1','1-HO'),(21,'Colombo','Colombo','0771908675',1,'0','1-B03'),(22,'Kandy','Kandy','0722511762',1,'0','1-B04'),(23,'Ampara','Ampara','0771908743',1,'0','1-B05'),(24,'Test','Test','0764075268',1,'0','1-B06'),(25,'Test 01','test address','0771908864',1,'0','1-B07');
/*!40000 ALTER TABLE `branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `card_visibility`
--

DROP TABLE IF EXISTS `card_visibility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `card_visibility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `category` varchar(20) NOT NULL,
  `card_id` varchar(50) NOT NULL,
  `visible` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_card` (`user_id`,`category`,`card_id`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `card_visibility`
--

LOCK TABLES `card_visibility` WRITE;
/*!40000 ALTER TABLE `card_visibility` DISABLE KEYS */;
/*!40000 ALTER TABLE `card_visibility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_drawer_entries`
--

DROP TABLE IF EXISTS `cash_drawer_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_drawer_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `day_end_id` int NOT NULL,
  `denomination` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `total_amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_drawer_entries`
--

LOCK TABLES `cash_drawer_entries` WRITE;
/*!40000 ALTER TABLE `cash_drawer_entries` DISABLE KEYS */;
INSERT INTO `cash_drawer_entries` VALUES (1,1,'5000','25','125000','2025-02-03 10:30:25.000000'),(2,1,'1000','11','11000','2025-02-03 10:30:25.000000'),(3,1,'500','1','500','2025-02-03 10:30:25.000000'),(4,2,'1000','100','100000','2025-02-04 06:42:53.000000'),(5,2,'5000','4','20000','2025-02-04 06:42:53.000000'),(6,3,'5000','10','50000','2025-02-05 01:53:59.000000'),(7,3,'1000','51','51000','2025-02-05 01:53:59.000000');
/*!40000 ALTER TABLE `cash_drawer_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cash_request_to_head_branch`
--

DROP TABLE IF EXISTS `cash_request_to_head_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cash_request_to_head_branch` (
  `idCashRequest` int NOT NULL AUTO_INCREMENT,
  `Cash_Request_Type` varchar(100) DEFAULT NULL,
  `Branch_Level_Approval_Status` int DEFAULT '0',
  `Head_Branch_Level_Approval_Status` int DEFAULT '0',
  `Comment` varchar(256) DEFAULT NULL,
  `Amount` varchar(45) NOT NULL,
  `Branch_Approved_User` int DEFAULT NULL,
  `Head_Branch_Approved_User` int DEFAULT NULL,
  `Created_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Branch_Approved_Time` timestamp NULL DEFAULT NULL,
  `Head_Branch_Approved_Time` timestamp NULL DEFAULT NULL,
  `FromBranchId` int NOT NULL,
  `From_Account_Id` int DEFAULT NULL,
  `To_Account_Id` int NOT NULL,
  `Request_Status` int DEFAULT '0',
  `Company_IdCompany` int NOT NULL,
  `Created_UserId` int NOT NULL,
  PRIMARY KEY (`idCashRequest`),
  KEY `fk_branch_approved_user` (`Branch_Approved_User`),
  KEY `fk_head_branch_approved_user` (`Head_Branch_Approved_User`),
  KEY `fk_from_branch` (`FromBranchId`),
  KEY `fk_from_account` (`From_Account_Id`),
  KEY `fk_to_account` (`To_Account_Id`),
  KEY `fk_company_with_cash_request` (`Company_IdCompany`),
  KEY `fk_req_created_user` (`Created_UserId`),
  CONSTRAINT `fk_branch_approved_user` FOREIGN KEY (`Branch_Approved_User`) REFERENCES `user` (`idUser`) ON DELETE CASCADE,
  CONSTRAINT `fk_company_with_cash_request` FOREIGN KEY (`Company_IdCompany`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE,
  CONSTRAINT `fk_from_account` FOREIGN KEY (`From_Account_Id`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`) ON DELETE CASCADE,
  CONSTRAINT `fk_from_branch` FOREIGN KEY (`FromBranchId`) REFERENCES `branch` (`idBranch`) ON DELETE CASCADE,
  CONSTRAINT `fk_head_branch_approved_user` FOREIGN KEY (`Head_Branch_Approved_User`) REFERENCES `user` (`idUser`) ON DELETE CASCADE,
  CONSTRAINT `fk_req_created_user` FOREIGN KEY (`Created_UserId`) REFERENCES `user` (`idUser`),
  CONSTRAINT `fk_to_account` FOREIGN KEY (`To_Account_Id`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cash_request_to_head_branch`
--

LOCK TABLES `cash_request_to_head_branch` WRITE;
/*!40000 ALTER TABLE `cash_request_to_head_branch` DISABLE KEYS */;
INSERT INTO `cash_request_to_head_branch` VALUES (4,'Day-To-Day Transactions',1,1,'hh','1000',10,10,'2025-12-09 05:51:36','2025-12-09 06:05:46','2025-12-09 06:06:04',1,105,35,1,1,60),(5,'Day-To-Day Transactions',-1,0,'','100',10,NULL,'2025-12-09 06:08:20','2025-12-09 06:08:37',NULL,1,NULL,110,-1,1,60),(6,'Day-To-Day Transactions',1,-1,'no','100',10,10,'2025-12-09 06:09:08','2025-12-09 06:09:21','2025-12-09 06:10:33',1,NULL,110,-1,1,60);
/*!40000 ALTER TABLE `cash_request_to_head_branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company`
--

DROP TABLE IF EXISTS `company`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company` (
  `idCompany` int NOT NULL AUTO_INCREMENT,
  `Company_Name` varchar(45) DEFAULT NULL,
  `Contact_No` varchar(45) DEFAULT NULL,
  `Address01` varchar(45) DEFAULT NULL,
  `Address02` varchar(45) DEFAULT NULL,
  `Address03` varchar(45) DEFAULT NULL,
  `City` varchar(45) DEFAULT NULL,
  `SMS_Mask` varchar(45) DEFAULT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Customer_No_Format_Type` enum('customize','auto') DEFAULT 'auto',
  `Customer_No_Format` varchar(255) DEFAULT NULL,
  `Customer_No_Auto_Generate_Number_Start_From` varchar(255) DEFAULT NULL,
  `Logo` varchar(255) DEFAULT NULL,
  `is_Ticket_Approve_After_Create` int DEFAULT NULL,
  PRIMARY KEY (`idCompany`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company`
--

LOCK TABLES `company` WRITE;
/*!40000 ALTER TABLE `company` DISABLE KEYS */;
INSERT INTO `company` VALUES (1,'Golden Pawn Ltd edited','0771908671','123 Main Street','Colombo','Sri Lanka','Colombo','Finco Captl',NULL,'customize','Branch_No.Year',NULL,'https://res.cloudinary.com/dkmgnymjb/image/upload/v1762744629/pawning_system/company_logos/company_1/lsa4z5dn8gacq46e0z5f.jpg',1),(2,'Abyss',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'auto',NULL,NULL,NULL,NULL),(3,'Saranj',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'auto',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `company` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_bank_accounts`
--

DROP TABLE IF EXISTS `company_bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_bank_accounts` (
  `Idbank` int NOT NULL AUTO_INCREMENT,
  `Bank_Name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Account_Name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Account_No` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Bank_Branch` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Account_Balance` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `User` int NOT NULL,
  `status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '1',
  PRIMARY KEY (`Idbank`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_bank_accounts`
--

LOCK TABLES `company_bank_accounts` WRITE;
/*!40000 ALTER TABLE `company_bank_accounts` DISABLE KEYS */;
INSERT INTO `company_bank_accounts` VALUES (1,'Cash','Running Cash','Teller 1','Ampara','4350111.35',1,'1'),(2,'Petty Cash','Running Cash','Office expenses 001','Ampara','3198',1,'1'),(3,'BOC','Current Account','92170760','Navithanvely','24671105',1,'1'),(4,'Cashier','Cashier','1','Cashier','48500',1,'1');
/*!40000 ALTER TABLE `company_bank_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_bank_has_log`
--

DROP TABLE IF EXISTS `company_bank_has_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_bank_has_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Bank_Account_Id` int NOT NULL,
  `Date_Time` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Credit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Debit` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Balance` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `User` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=698 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_bank_has_log`
--

LOCK TABLES `company_bank_has_log` WRITE;
/*!40000 ALTER TABLE `company_bank_has_log` DISABLE KEYS */;
INSERT INTO `company_bank_has_log` VALUES (1,1,'2024-08-17 13:00:59','Account Creation','-','-','0','0.00','0',1),(2,2,'2024-08-17 13:02:48','Account Creation','-','-','0','0.00','0',1),(3,3,'2024-08-17 13:04:26','Account Creation','-','-','50000000.00','0.00','50000000.00',1),(4,3,'2024-08-17 13:14:40','Withdrawal','-','-','0.00','1000000','49000000',1),(5,1,'2024-08-17 13:14:40','Deposit(92170760-Current Account)','-','-','1000000','0.00','1000000',1),(6,1,'2024-08-17 13:16:54','Expenses(PAWNING-Ticket No-001)','-','-','0.00','10000','990000',1),(7,1,'2024-08-17 13:22:14','Expenses(PAWNING-Ticket No-004)','-','-','0.00','107000','883000',1),(8,1,'2024-08-17 13:24:51','Expenses(PAWNING-Ticket No-005)','-','-','0.00','177000','706000',1),(9,1,'2024-08-17 13:25:22','Expenses(PAWNING-Ticket No-006)','-','-','0.00','257000','449000',1),(10,1,'2024-08-17 13:25:51','Expenses(PAWNING-Ticket No-007)','-','-','0.00','122000','327000',1),(11,1,'2024-08-17 13:26:16','Expenses(PAWNING-Ticket No-008)','-','-','0.00','75000','252000',1),(12,3,'2024-08-17 13:27:03','Withdrawal','-','-','0.00','1000000','48000000',1),(13,1,'2024-08-17 13:27:03','Deposit(92170760-Current Account)','-','-','1000000','0.00','1252000',1),(14,1,'2024-08-17 13:28:21','Expenses(PAWNING-Ticket No-009)','-','-','0.00','453000','799000',1),(15,1,'2024-08-17 13:29:10','Expenses(PAWNING-Ticket No-010)','-','-','0.00','336000','463000',1),(16,1,'2024-08-17 13:29:41','Expenses(PAWNING-Ticket No-011)','-','-','0.00','350000','113000',1),(17,1,'2024-08-17 13:30:14','Expenses(PAWNING-Ticket No-012)','-','-','0.00','520000','-407000',1),(18,3,'2024-08-17 13:31:36','Withdrawal','-','-','0.00','2000000','46000000',1),(19,1,'2024-08-17 13:31:36','Deposit(92170760-Current Account)','-','-','2000000','0.00','1593000',1),(20,1,'2024-08-17 13:33:06','Expenses(PAWNING-Ticket No-013)','-','-','0.00','79500','1513500',1),(21,1,'2024-08-17 13:33:33','Expenses(PAWNING-Ticket No-014)','-','-','0.00','563000','950500',1),(22,1,'2024-08-17 13:35:23','Income(Redeemed Charge-Ticket No-005)','-','-','1000','0.00','951500',1),(23,1,'2024-08-17 13:35:48','Income(Redeemed Charge-Ticket No-009)','-','-','1000','0.00','952500',1),(24,1,'2024-08-17 13:36:23','Income(Redeemed Charge-Ticket No-010)','-','-','1000','0.00','953500',1),(25,1,'2024-08-17 13:36:44','Income(Redeemed Charge-Ticket No-011)','-','-','1000','0.00','954500',1),(26,1,'2024-08-17 13:37:04','Income(Redeemed Charge-Ticket No-012)','-','-','1000','0.00','955500',1),(27,1,'2024-08-17 13:37:25','Income(Redeemed Charge-Ticket No-013)','-','-','1000','0.00','956500',1),(28,1,'2024-08-17 13:37:45','Income(Redeemed Charge-Ticket No-014)','-','-','1000','0.00','957500',1),(29,1,'2024-08-20 09:21:05','Issued Pawning Ticket','Ticket ID(15)','-','0.00','75000','882500',1),(30,3,'2024-08-20 11:24:07','Withdrawal','-','-','0.00','1500000','44500000',1),(31,1,'2024-08-20 11:24:07','Deposit(92170760-Current Account)','-','-','1500000','0.00','2382500',1),(32,1,'2024-08-20 12:33:38','Issued Pawning Ticket','Ticket ID(16)','-','0.00','955000','1427500',1),(33,1,'2024-08-20 13:01:42','Income(Redeemed Charge-Ticket No-CG/AM/PW/000016)','-','-','1000','0.00','1428500',1),(34,1,'2024-08-20 13:36:03','Issued Pawning Ticket','Ticket ID(17)','-','0.00','739000','689500',1),(35,1,'2024-08-20 13:46:30','Income(Redeemed Charge-Ticket No-CG/AM/PW/000017)','-','-','1000','0.00','690500',1),(36,3,'2024-08-20 15:43:15','Withdrawal','-','-','0.00','1000000','43500000',1),(37,1,'2024-08-20 15:43:15','Deposit(92170760-Current Account)','-','-','1000000','0.00','1690500',1),(38,1,'2024-08-21 11:28:57','Issued Pawning Ticket','Ticket ID(18)','-','0.00','479000','1211500',1),(39,1,'2024-08-21 11:54:10','Issued Pawning Ticket','Ticket ID(19)','-','0.00','574000','637500',1),(40,1,'2024-08-21 11:59:08','Issued Pawning Ticket','Ticket ID(20)','-','0.00','150000','487500',1),(41,1,'2024-08-21 12:03:23','Issued Pawning Ticket','Ticket ID(21)','-','0.00','216000','271500',1),(42,1,'2024-08-21 12:18:31','Income(Redeemed Charge-Ticket No-CG/AM/PW/000019 , CG/AM/PW/000020 & CG/AM/PW/000021)','-','-','1000','0.00','272500',1),(43,3,'2024-08-21 12:41:25','Withdrawal','-','-','0.00','2000000','41500000',1),(44,1,'2024-08-21 12:41:25','Deposit(92170760-Current Account)','-','-','2000000','0.00','2272500',1),(45,1,'2024-08-21 13:25:38','Issued Pawning Ticket','Ticket ID(22)','-','0.00','334000','1938500',1),(46,1,'2024-08-21 14:23:24','Issued Pawning Ticket','Ticket ID(23)','-','0.00','126000','1812500',1),(47,1,'2024-08-21 15:17:07','Income(Redeemed Charge-Ticket No-CG/AM/PW/000022)','-','-','1000','0.00','1813500',1),(48,1,'2024-08-21 15:18:15','Income(Redeemed Charge-Ticket No-CG/AM/PW/000023)','-','-','1000','0.00','1814500',1),(49,1,'2024-08-22 10:05:01','Issued Pawning Ticket','Ticket ID(24)','-','0.00','120000','1694500',1),(50,1,'2024-08-22 13:53:06','Issued Pawning Ticket','Ticket ID(25)','-','0.00','230000','1464500',1),(51,1,'2024-08-22 15:54:53','Issued Pawning Ticket','Ticket ID(26)','-','0.00','150000','1314500',1),(52,1,'2024-08-22 16:17:33','Income(Redeemed Charge-Ticket No-CG/AM/PW/000025)','-','-','1000','0.00','1315500',1),(53,1,'2024-08-23 14:43:10','Issued Pawning Ticket','Ticket ID(27)','-','0.00','268000','1047500',1),(54,1,'2024-08-23 15:01:14','Customer Payment(Ticket No:26)','-','-','151675','0.00','1199175',1),(55,1,'2024-08-23 16:11:37','Income(Redeemed Charge-Ticket No-CG/AM/PW/000027)','-','-','1000','0.00','1200175',1),(56,1,'2024-08-26 12:09:05','Customer Payment(Ticket No:15)','-','-','75762.50','0.00','1275937.5',1),(57,1,'2024-08-26 14:14:16','Customer Payment(Ticket No:26)','-','-','151675','0.00','1427612.5',1),(58,1,'2024-08-26 17:11:53','Expenses(Gold Purchased)','-','-','0.00','144000','1283612.5',1),(59,1,'2024-08-26 17:12:36','Income(Gold Purchased Traveling Charge)','-','-','1000','0.00','1284612.5',1),(60,1,'2024-08-27 09:48:21','Expenses(Adjustment- Repeat Customer Payment(Ticket No:26))','-','-','0.00','151675.00','1132937.5',1),(61,1,'2024-08-28 09:31:56','Issued Pawning Ticket','Ticket ID(28)','-','0.00','60000','1072937.5',1),(62,1,'2024-08-28 12:50:21','Issued Pawning Ticket','Ticket ID(29)','-','0.00','240000','832937.5',1),(63,1,'2024-08-28 13:13:18','Issued Pawning Ticket','Ticket ID(30)','-','0.00','147000','685937.5',1),(64,1,'2024-08-28 13:26:15','Issued Pawning Ticket','Ticket ID(31)','-','0.00','150000','535937.5',1),(65,1,'2024-08-28 13:31:46','Income(Redeemed Charge-Ticket No-CG/AM/PW/000029)','-','-','1000','0.00','536937.5',1),(66,1,'2024-08-28 13:33:25','Income(Redeemed Charge-Ticket No-CG/AM/PW/000030)','-','-','1000','0.00','537937.5',1),(67,1,'2024-08-28 14:11:14','Customer Payment(Ticket No:4)','-','-','108536.14','0.00','646473.64',1),(68,3,'2024-08-28 14:41:02','Withdrawal','-','-','0.00','1500000','40000000',1),(69,1,'2024-08-28 14:41:02','Deposit(92170760-Current Account)','-','-','1500000','0.00','2146473.64',1),(70,1,'2024-08-28 14:51:38','Issued Pawning Ticket','Ticket ID(32)','-','0.00','196000','1950473.64',1),(71,1,'2024-08-28 15:02:15','Issued Pawning Ticket','Ticket ID(33)','-','0.00','138000','1812473.64',1),(72,1,'2024-08-28 15:09:08','Issued Pawning Ticket','Ticket ID(34)','-','0.00','161000','1651473.64',1),(73,1,'2024-08-28 15:48:29','Income(Redeemed Charge-Ticket No - CG/AM/PW/000032 , CG/AM/PW/000033 & CG/AM/PW/000034)','-','-','1000','0.00','1652473.64',1),(74,1,'2024-08-28 17:19:38','Issued Pawning Ticket','Ticket ID(35)','-','0.00','232000','1420473.64',1),(75,1,'2024-08-29 10:10:16','Issued Pawning Ticket','Ticket ID(36)','-','0.00','106000','1314473.64',1),(76,1,'2024-08-29 10:32:53','Issued Pawning Ticket','Ticket ID(37)','-','0.00','65000','1249473.64',1),(77,1,'2024-08-29 12:41:03','Issued Pawning Ticket','Ticket ID(38)','-','0.00','80000','1169473.64',1),(78,1,'2024-08-29 14:02:35','Issued Pawning Ticket','Ticket ID(39)','-','0.00','487000','682473.64',1),(79,3,'2024-08-29 15:47:50','Withdrawal','-','-','0.00','1500000','38500000',1),(80,1,'2024-08-29 15:47:51','Deposit(92170760-Current Account)','-','-','1500000','0.00','2182473.64',1),(81,1,'2024-08-29 15:48:40','Income(Redeemed Charge-Ticket No-CG/AM/PW/000039)','-','-','1000','0.00','2183473.64',1),(82,1,'2024-08-29 16:54:58','Issued Pawning Ticket','Ticket ID(40)','-','0.00','200000','1983473.64',1),(83,1,'2024-08-30 13:03:11','Issued Pawning Ticket','Ticket ID(41)','-','0.00','268000','1715473.64',1),(84,1,'2024-08-30 13:03:18','Issued Pawning Ticket','Ticket ID(42)','-','0.00','196000','1519473.64',1),(85,1,'2024-08-30 13:40:39','Issued Pawning Ticket','Ticket ID(43)','-','0.00','664000','855473.64',1),(86,1,'2024-08-30 13:54:24','Income(Redeemed Charge-Ticket No-CG/AM/PW/000041 & Ticket No-CG/AM/PW/000042)','-','-','1000','0.00','856473.64',1),(87,1,'2024-08-30 13:54:52','Income(Redeemed Charge-Ticket No-CG/AM/PW/000043)','-','-','1000','0.00','857473.64',1),(88,1,'2024-08-30 15:15:09','Issued Pawning Ticket','Ticket ID(44)','-','0.00','298000','559473.64',1),(89,1,'2024-08-30 16:33:19','Customer Payment(Ticket No:1)','-','-','10182.10','0.00','569655.74',1),(90,1,'2024-08-31 12:06:48','Issued Pawning Ticket','Ticket ID(45)','-','0.00','32000','537655.74',1),(91,3,'2024-09-02 10:12:03','Withdrawal','-','-','0.00','2000000','36500000',1),(92,1,'2024-09-02 10:12:03','Deposit(92170760-Current Account)','-','-','2000000','0.00','2537655.74',1),(93,1,'2024-09-02 11:37:38','Issued Pawning Ticket','Ticket ID(46)','-','0.00','208000','2329655.74',1),(94,1,'2024-09-02 11:37:46','Issued Pawning Ticket','Ticket ID(47)','-','0.00','168000','2161655.74',1),(95,1,'2024-09-02 11:37:52','Issued Pawning Ticket','Ticket ID(48)','-','0.00','94000','2067655.74',1),(96,1,'2024-09-02 11:53:19','Issued Pawning Ticket','Ticket ID(49)','-','0.00','90000','1977655.74',1),(97,1,'2024-09-02 12:05:44','Issued Pawning Ticket','Ticket ID(50)','-','0.00','120000','1857655.74',1),(98,1,'2024-09-02 12:08:49','Issued Pawning Ticket','Ticket ID(51)','-','0.00','80000','1777655.74',1),(99,1,'2024-09-02 12:16:24','Issued Pawning Ticket','Ticket ID(52)','-','0.00','130000','1647655.74',1),(100,1,'2024-09-02 12:25:12','Issued Pawning Ticket','Ticket ID(53)','-','0.00','330000','1317655.74',1),(101,1,'2024-09-02 12:33:53','Issued Pawning Ticket','Ticket ID(54)','-','0.00','195000','1122655.74',1),(102,1,'2024-09-02 12:40:20','Issued Pawning Ticket','Ticket ID(55)','-','0.00','187000','935655.74',1),(103,1,'2024-09-02 12:41:16','Income(Redeemed Charge-Ticket No-CG/AM/PW/000046 , Ticket No-CG/AM/PW/000047 & Ticket No-CG/AM/PW/000048)','-','-','1000','0.00','936655.74',1),(104,1,'2024-09-02 12:44:47','Income(Redeemed Charge-Ticket No-CG/AM/PW/000049 , Ticket No-CG/AM/PW/000050 , Ticket No-CG/AM/PW/000051)','-','-','1000','0.00','937655.74',1),(105,3,'2024-09-02 14:21:37','Withdrawal','-','-','0.00','2000000','34500000',1),(106,1,'2024-09-02 14:21:37','Deposit(92170760-Current Account)','-','-','2000000','0.00','2937655.74',1),(107,1,'2024-09-02 14:22:40','Issued Pawning Ticket','Ticket ID(57)','-','0.00','92000','2845655.74',1),(108,1,'2024-09-02 14:23:40','Issued Pawning Ticket','Ticket ID(56)','-','0.00','281000','2564655.74',1),(109,1,'2024-09-02 14:37:25','Income(Redeemed Charge-Ticket No-CG/AM/PW/000056 & Ticket No-CG/AM/PW/000057)','-','-','1000','0.00','2565655.74',1),(110,1,'2024-09-02 14:41:41','Issued Pawning Ticket','Ticket ID(58)','-','0.00','396000','2169655.74',1),(111,1,'2024-09-02 15:04:30','Customer Payment(Ticket No:38)','-','-','80810','0.00','2250465.74',1),(112,1,'2024-09-02 15:14:07','Issued Pawning Ticket','Ticket ID(59)','-','0.00','101000','2149465.74',1),(113,1,'2024-09-02 17:25:54','Income(Redeemed Charge-Ticket No-CG/AM/PW/000053 , Ticket No-CG/AM/PW/000054 & Ticket No-CG/AM/PW/000055)','-','-','1000','0.00','2150465.74',1),(114,1,'2024-09-02 17:26:40','Income(Redeemed Charge-Ticket No-CG/AM/PW/000058)','-','-','1000','0.00','2151465.74',1),(115,1,'2024-09-03 09:43:32','Issued Pawning Ticket','Ticket ID(60)','-','0.00','172000','1979465.74',1),(116,1,'2024-09-03 14:15:40','Issued Pawning Ticket','Ticket ID(61)','-','0.00','200000','1779465.74',1),(117,1,'2024-09-04 11:07:38','Issued Pawning Ticket','Ticket ID(62)','-','0.00','35000','1744465.74',1),(118,1,'2024-09-04 11:14:02','Issued Pawning Ticket','Ticket ID(63)','-','0.00','116000','1628465.74',1),(119,1,'2024-09-04 11:14:10','Issued Pawning Ticket','Ticket ID(64)','-','0.00','155000','1473465.74',1),(120,1,'2024-09-04 12:25:06','Income(Redeemed Charge-Ticket No-CG/AM/PW/000063 & Ticket No-CG/AM/PW/000064)','-','-','1000','0.00','1474465.74',1),(121,1,'2024-09-04 14:12:20','Customer Payment(Ticket No:18)','-','-','485071.46','0.00','1959537.2',1),(122,1,'2024-09-04 14:29:51','Issued Pawning Ticket','Ticket ID(65)','-','0.00','100000','1859537.2',1),(123,1,'2024-09-06 10:00:12','Issued Pawning Ticket','Ticket ID(66)','-','0.00','560000','1299537.2',1),(124,1,'2024-09-06 10:16:11','Income(Redeemed Charge-Ticket No-CG/AM/PW/000066)','-','-','1000','0.00','1300537.2',1),(125,1,'2024-09-06 10:17:25','Issued Pawning Ticket','Ticket ID(67)','-','0.00','180000','1120537.2',1),(126,3,'2024-09-06 12:55:23','Withdrawal','-','-','0.00','2000000','32500000',1),(127,1,'2024-09-06 12:55:23','Deposit(92170760-Current Account)','-','-','2000000','0.00','3120537.2',1),(128,1,'2024-09-06 13:03:49','Issued Pawning Ticket','Ticket ID(68)','-','0.00','180000','2940537.2',1),(129,1,'2024-09-06 13:11:05','Issued Pawning Ticket','Ticket ID(69)','-','0.00','240000','2700537.2',1),(130,3,'2024-09-06 13:39:27','Withdrawal','-','-','0.00','15000','32485000',1),(131,1,'2024-09-06 13:39:27','Deposit(92170760-Current Account)','-','-','15000','0.00','2715537.2',1),(133,2,'2024-09-06 13:41:57','Deposit','-','-','15000','0.00','15000',1),(134,1,'2024-09-06 13:41:57','Withdraw(Office expenses 001-Running Cash)','-','-','0.00','15000','2700537.2',1),(135,1,'2024-09-06 13:45:30','Issued Pawning Ticket','Ticket ID(70)','-','0.00','224000','2476537.2',1),(136,1,'2024-09-06 14:02:24','Customer Payment(Ticket No:65)','-','-','101000','0.00','2577537.2',1),(137,1,'2024-09-06 14:18:44','Issued Pawning Ticket','Ticket ID(72)','-','0.00','210000','2367537.2',1),(138,1,'2024-09-06 14:25:11','Income(Redeemed Charge-Ticket No-CG/AM/PW/000070)','-','-','1000','0.00','2368537.2',1),(140,1,'2024-09-06 15:08:10','Customer Payment(Ticket No:31)','-','-','151675','0.00','2520212.2',1),(141,1,'2024-09-06 16:29:03','Issued Pawning Ticket','Ticket ID(73)','-','0.00','250000','2270212.2',1),(142,1,'2024-09-06 16:37:40','Income(Redeemed Charge-Ticket No-CG/AM/PW/000073)','-','-','1000','0.00','2271212.2',1),(143,1,'2024-09-06 16:38:31','Issued Pawning Ticket','Ticket ID(74)','-','0.00','58000','2213212.2',1),(144,1,'2024-09-06 16:49:19','Income(Redeemed Charge-Ticket No-CG/AM/PW/000074)','-','-','1000','0.00','2214212.2',1),(145,1,'2024-09-07 12:21:26','Issued Pawning Ticket','Ticket ID(75)','-','0.00','302000','1912212.2',1),(146,1,'2024-09-07 12:31:41','Income(Redeemed Charge-Ticket No-CG/AM/PW/000075)','-','-','1000','0.00','1913212.2',1),(147,1,'2024-09-09 13:08:25','Issued Pawning Ticket','Ticket ID(76)','-','0.00','62000','1851212.2',1),(148,1,'2024-09-09 13:19:20','Issued Pawning Ticket','Ticket ID(77)','-','0.00','160000','1691212.2',1),(149,1,'2024-09-09 13:22:07','Issued Pawning Ticket','Ticket ID(78)','-','0.00','71000','1620212.2',1),(150,1,'2024-09-09 13:38:34','Issued Pawning Ticket','Ticket ID(79)','-','0.00','303000','1317212.2',1),(151,1,'2024-09-09 13:41:45','Issued Pawning Ticket','Ticket ID(80)','-','0.00','183000','1134212.2',1),(152,1,'2024-09-09 14:11:42','Income(Redeemed Charge-Ticket No-CG/AM/PW/000077 & Ticket No-CG/AM/PW/000078)','-','-','500','0.00','1134712.2',1),(153,1,'2024-09-09 14:11:54','Income(Redeemed Charge-Ticket No-CG/AM/PW/000076)','-','-','500','0.00','1135212.2',1),(154,1,'2024-09-09 14:12:12','Income(Redeemed Charge-Ticket No-CG/AM/PW/000079 & Ticket No-CG/AM/PW/000080)','-','-','1000','0.00','1136212.2',1),(155,1,'2024-09-09 15:00:21','Issued Pawning Ticket','Ticket ID(81)','-','0.00','145000','991212.2',1),(156,1,'2024-09-09 15:10:18','Income(Redeemed Charge-Ticket No-CG/AM/PW/000081)','-','-','1000','0.00','992212.2',1),(157,1,'2024-09-10 10:45:21','Issued Pawning Ticket','Ticket ID(82)','-','0.00','100000','892212.2',1),(158,1,'2024-09-10 10:59:53','Customer Payment(Ticket No:42)','-','-','198228.95','0.00','1090441.15',1),(159,1,'2024-09-10 11:02:20','Customer Payment(Ticket No:41)','-','-','270955.91','0.00','1361397.06',1),(160,1,'2024-09-10 11:12:11','Issued Pawning Ticket','Ticket ID(83)','-','0.00','309000','1052397.06',1),(161,1,'2024-09-10 11:14:17','Issued Pawning Ticket','Ticket ID(84)','-','0.00','209000','843397.06',1),(162,1,'2024-09-10 11:30:24','Issued Pawning Ticket','Ticket ID(85)','-','0.00','44000','799397.06',1),(163,3,'2024-09-10 12:29:19','Withdrawal','-','-','0.00','1200000','31285000',1),(164,1,'2024-09-10 12:29:19','Deposit(92170760-Current Account)','-','-','1200000','0.00','1999397.06',1),(165,1,'2024-09-11 08:45:38','Issued Pawning Ticket','Ticket ID(86)','-','0.00','70000','1929397.06',1),(166,1,'2024-09-11 12:56:16','Issued Pawning Ticket','Ticket ID(87)','-','0.00','579000','1350397.06',1),(167,1,'2024-09-11 13:01:15','Issued Pawning Ticket','Ticket ID(88)','-','0.00','183000','1167397.06',1),(168,1,'2024-09-11 13:14:55','Issued Pawning Ticket','Ticket ID(89)','-','0.00','927000','240397.06',1),(169,3,'2024-09-11 13:48:59','Withdrawal','-','-','0.00','2000000','29285000',1),(170,1,'2024-09-11 13:48:59','Deposit(92170760-Current Account)','-','-','2000000','0.00','2240397.06',1),(171,1,'2024-09-11 13:53:06','Income(Redeemed Charge-Ticket No-CG/AM/PW/000087 , Ticket No-CG/AM/PW/000088 & Ticket No-CG/AM/PW/000089)','-','-','1000','0.00','2241397.06',1),(172,1,'2024-09-11 16:15:51','Customer Payment(Ticket No:22)','-','-','339860.05','0.00','2581257.11',1),(173,1,'2024-09-12 11:55:12','Issued Pawning Ticket','Ticket ID(90)','-','0.00','195000','2386257.11',1),(174,1,'2024-09-12 12:17:04','Issued Pawning Ticket','Ticket ID(91)','-','0.00','150000','2236257.11',1),(175,1,'2024-09-12 12:55:25','Issued Pawning Ticket','Ticket ID(92)','-','0.00','195000','2041257.11',1),(176,1,'2024-09-12 13:04:03','Income(Redeemed Charge-Ticket No-CG/AM/PW/000090)','-','-','1000','0.00','2042257.11',1),(177,1,'2024-09-12 13:04:22','Income(Redeemed Charge-Ticket No-CG/AM/PW/000091)','-','-','1000','0.00','2043257.11',1),(178,1,'2024-09-12 13:04:34','Income(Redeemed Charge-Ticket No-CG/AM/PW/000092)','-','-','1000','0.00','2044257.11',1),(179,1,'2024-09-12 14:37:38','Customer Payment(Ticket No:59)','-','-','102209.50','0.00','2146466.61',1),(180,1,'2024-09-12 14:43:55','Issued Pawning Ticket','Ticket ID(93)','-','0.00','140000','2006466.61',1),(181,1,'2024-09-13 11:44:29','Issued Pawning Ticket','Ticket ID(94)','-','0.00','305000','1701466.61',1),(182,1,'2024-09-13 13:05:50','Issued Pawning Ticket','Ticket ID(95)','-','0.00','67000','1634466.61',1),(183,1,'2024-09-13 13:07:59','Issued Pawning Ticket','Ticket ID(96)','-','0.00','186000','1448466.61',1),(184,1,'2024-09-13 13:22:17','Income(Redeemed Charge-Ticket No-CG/AM/PW/000094)','-','-','1000','0.00','1449466.61',1),(185,1,'2024-09-13 13:22:37','Income(Redeemed Charge-Ticket No-CG/AM/PW/000095 & Ticket No-CG/AM/PW/000096)','-','-','1000','0.00','1450466.61',1),(186,1,'2024-09-13 15:15:33','Issued Pawning Ticket','Ticket ID(97)','-','0.00','35000','1415466.61',1),(187,1,'2024-09-14 10:21:31','Issued Pawning Ticket','Ticket ID(98)','-','0.00','102000','1313466.61',1),(188,1,'2024-09-14 11:23:30','Issued Pawning Ticket','Ticket ID(99)','-','0.00','50000','1263466.61',1),(189,1,'2024-09-18 10:28:09','Customer Payment(Ticket No:99)','-','-','50525','0.00','1313991.61',1),(190,1,'2024-09-18 10:33:07','Issued Pawning Ticket','Ticket ID(100)','-','0.00','88000','1225991.61',1),(191,1,'2024-09-18 10:44:12','Customer Payment(Ticket No:86)','-','-','70715','0.00','1296706.61',1),(192,1,'2024-09-18 10:51:45','Issued Pawning Ticket','Ticket ID(101)','-','0.00','101000','1195706.61',1),(193,1,'2024-09-18 11:14:07','Issued Pawning Ticket','Ticket ID(102)','-','0.00','35000','1160706.61',1),(194,1,'2024-09-18 12:18:30','Issued Pawning Ticket','Ticket ID(103)','-','0.00','479000','681706.61',1),(195,1,'2024-09-18 15:01:17','Issued Pawning Ticket','Ticket ID(104)','-','0.00','308000','373706.61',1),(196,1,'2024-09-18 15:33:00','Customer Payment(Ticket No:74)','-','-','58662.48','0.00','432369.09',1),(197,1,'2024-09-18 15:36:17','Issued Pawning Ticket','Ticket ID(105)','-','0.00','69000','363369.09',1),(198,3,'2024-09-18 16:03:23','Withdrawal','039967','For the Gold Loan','0.00','1000000','28285000',1),(199,1,'2024-09-18 16:03:23','Deposit(92170760-Current Account)','039967','For the Gold Loan','1000000','0.00','1363369.09',1),(200,1,'2024-09-18 16:04:10','Income(Redeemed Charge-Ticket No-CG/AM/PW/000104)','-','-','1000','0.00','1364369.09',1),(201,2,'2024-09-18 17:43:27','Expenses(Purchase for Janitor Items)','-','-','0.00','1425','13575',1),(202,1,'2024-09-19 09:05:04','Issued Pawning Ticket','Ticket ID(106)','-','0.00','318000','1046369.09',1),(203,1,'2024-09-19 11:26:18','Issued Pawning Ticket','Ticket ID(107)','-','0.00','106000','940369.09',1),(204,1,'2024-09-19 13:06:39','Customer Payment(Ticket No:98)','-','-','103219','0.00','1043588.09',1),(205,1,'2024-09-19 13:37:27','Income(Redeemed Charge-Ticket No-CG/AM/PW/000107)','-','-','1000','0.00','1044588.09',1),(206,1,'2024-09-19 13:59:08','Issued Pawning Ticket','Ticket ID(108)','-','0.00','370000','674588.09',1),(207,1,'2024-09-19 14:33:04','Income(Redeemed Charge-Ticket No-CG/AM/PW/000108)','-','-','1000','0.00','675588.09',1),(208,1,'2024-09-19 15:45:29','Issued Pawning Ticket','Ticket ID(109)','-','0.00','220000','455588.09',1),(209,1,'2024-09-19 15:56:33','Income(Redeemed Charge-Ticket No-CG/AM/PW/000109)','-','-','1000','0.00','456588.09',1),(210,3,'2024-09-20 13:55:10','Withdrawal','039968','For the Gold Loan','0.00','1200000','27085000',1),(211,1,'2024-09-20 13:55:10','Deposit(92170760-Current Account)','039968','For the Gold Loan','1200000','0.00','1656588.09',1),(212,1,'2024-09-20 15:13:03','Issued Pawning Ticket','Ticket ID(110)','-','0.00','210000','1446588.09',1),(213,1,'2024-09-20 15:23:03','Issued Pawning Ticket','Ticket ID(111)','-','0.00','160000','1286588.09',1),(214,1,'2024-09-20 15:28:56','Income(Redeemed Charge-Ticket No-CG/AM/PW/000111)','-','-','1000','0.00','1287588.09',1),(216,1,'2024-09-23 10:37:19','Issued Pawning Ticket','Ticket ID(113)','-','0.00','235000','1052588.09',1),(217,1,'2024-09-23 11:28:50','Customer Payment(Ticket No:63)','-','-','118044.55','0.00','1170632.64',1),(218,1,'2024-09-23 11:58:43','Customer Payment(Ticket No:61)','-','-','203210','0.00','1373842.64',1),(219,1,'2024-09-24 10:37:54','Customer Payment(Ticket No:87)','-','-','586152.71','0.00','1959995.35',1),(220,1,'2024-09-24 10:39:11','Customer Payment(Ticket No:88)','-','-','185352.67','0.00','2145348.02',1),(221,1,'2024-09-24 10:40:36','Customer Payment(Ticket No:89)','-','-','938151.23','0.00','3083499.25',1),(222,1,'2024-09-24 12:12:08','Issued Pawning Ticket','Ticket ID(114)','-','0.00','228000','2855499.25',1),(223,1,'2024-09-24 12:51:17','Customer Payment(Ticket No:24)','-','-','122852.80','0.00','2978352.05',1),(224,1,'2024-09-24 13:19:44','Customer Payment(Ticket No:101)','-','-','102209.50','0.00','3080561.55',1),(225,1,'2024-09-24 13:29:24','Issued Pawning Ticket','Ticket ID(115)','-','0.00','111000','2969561.55',1),(226,3,'2024-09-24 14:27:46','Deposit','21/PF221573/6/255','Gold Loan Cash','1500000','0.00','28585000',1),(227,1,'2024-09-24 14:27:46','Withdraw(92170760-Current Account)','21/PF221573/6/255','Gold Loan Cash','0.00','1500000','1469561.55',1),(228,1,'2024-09-25 09:58:33','Issued Pawning Ticket','Ticket ID(116)','-','0.00','100000','1369561.55',1),(229,1,'2024-09-25 11:03:56','Issued Pawning Ticket','Ticket ID(117)','-','0.00','50000','1319561.55',1),(230,1,'2024-09-25 11:36:04','Issued Pawning Ticket','Ticket ID(118)','-','0.00','147000','1172561.55',1),(231,1,'2024-09-26 10:55:44','Issued Pawning Ticket','Ticket ID(119)','-','0.00','233000','939561.55',1),(232,2,'2024-09-26 11:29:09','Expenses(To Buy the PAD Lock)','-','-','0.00','1120','12455',1),(233,1,'2024-09-26 11:51:23','Customer Payment(Ticket No:102)','-','-','35382.50','0.00','974944.05',1),(234,1,'2024-09-26 14:19:55','Issued Pawning Ticket','Ticket ID(120)','-','0.00','776000','198944.05',1),(235,1,'2024-09-26 14:43:45','Income(Redeemed Charge-Ticket No-CG/AM/PW/000120)','-','-','1000','0.00','199944.05',1),(236,3,'2024-09-26 15:36:58','Withdrawal','039969','For the Gold Loan','0.00','1500000','27085000',1),(237,1,'2024-09-26 15:36:58','Deposit(92170760-Current Account)','039969','For the Gold Loan','1500000','0.00','1699944.05',1),(238,1,'2024-09-27 13:38:13','Customer Payment(Ticket No:79)','-','-','10000','0.00','1709944.05',1),(239,1,'2024-09-27 15:37:17','Issued Pawning Ticket','Ticket ID(122)','-','0.00','291000','1418944.05',1),(240,1,'2024-09-27 15:44:35','Income(Redeemed Charge-Ticket No-CG/AM/PW/000122)','-','-','1000','0.00','1419944.05',1),(241,1,'2024-09-28 11:44:53','Customer Payment(Ticket No:13)','-','-','3000','0.00','1422944.05',1),(242,1,'2024-09-30 09:28:36','Issued Pawning Ticket','Ticket ID(124)','-','0.00','30000','1392944.05',1),(243,1,'2024-09-30 10:02:05','Customer Payment(Ticket No:117)','-','-','50525','0.00','1443469.05',1),(244,1,'2024-09-30 10:23:53','Issued Pawning Ticket','Ticket ID(125)','-','0.00','12000','1431469.05',1),(245,1,'2024-09-30 10:47:42','Issued Pawning Ticket','Ticket ID(126)','-','0.00','299000','1132469.05',1),(246,1,'2024-09-30 12:08:30','Issued Pawning Ticket','Ticket ID(127)','-','0.00','1085000','47469.05',1),(247,3,'2024-09-30 12:19:06','Withdrawal','039970','For the Gold Loan','0.00','1500000','25585000',1),(248,1,'2024-09-30 12:19:06','Deposit(92170760-Current Account)','039970','For the Gold Loan','1500000','0.00','1547469.05',1),(249,1,'2024-09-30 12:40:21','Customer Payment(Ticket No:116)','-','-','101000','0.00','1648469.05',1),(250,1,'2024-09-30 13:30:21','Customer Payment(Ticket No:72)','-','-','214097.20','0.00','1862566.25',1),(251,1,'2024-09-30 14:50:21','Issued Pawning Ticket','Ticket ID(128)','-','0.00','176000','1686566.25',1),(252,1,'2024-09-30 15:08:53','Customer Payment(Ticket No:9)','-','-','469480.14','0.00','2156046.39',1),(253,1,'2024-09-30 15:30:25','Income(Redeemed Charge-Ticket No-CG/AM/PW/000128)','-','-','1000','0.00','2157046.39',1),(254,1,'2024-10-01 10:13:06','Issued Pawning Ticket','Ticket ID(129)','-','0.00','100000','2057046.39',1),(255,1,'2024-10-01 10:17:11','Issued Pawning Ticket','Ticket ID(130)','-','0.00','70000','1987046.39',1),(256,1,'2024-10-01 11:33:25','Issued Pawning Ticket','Ticket ID(131)','-','0.00','72000','1915046.39',1),(257,1,'2024-10-01 11:36:31','Issued Pawning Ticket','Ticket ID(132)','-','0.00','36000','1879046.39',1),(258,1,'2024-10-01 12:00:06','Income(Redeemed Charge-Ticket No-CG/AM/PW/000129 , Ticket No-CG/AM/PW/000130 ,  Ticket No-CG/AM/PW/000131 & Ticket No-CG/AM/PW/000132)','-','-','1000','0.00','1880046.39',1),(259,1,'2024-10-01 16:38:51','Customer Payment(Ticket No:35)','-','-','238036.56','0.00','2118082.95',1),(260,1,'2024-10-02 09:54:40','Issued Pawning Ticket','Ticket ID(133)','-','0.00','38500','2079582.95',1),(261,1,'2024-10-02 10:30:30','Customer Payment(Ticket No:27)','-','-','8362','0.00','2087944.95',1),(262,1,'2024-10-02 14:52:10','Customer Payment(Ticket No:20)','-','-','154539','0.00','2242483.95',1),(263,1,'2024-10-02 14:53:16','Customer Payment(Ticket No:19)','-','-','590912.68','0.00','2833396.63',1),(264,1,'2024-10-02 15:04:49','Issued Pawning Ticket','Ticket ID(134)','-','0.00','614000','2219396.63',1),(265,1,'2024-10-02 15:08:39','Issued Pawning Ticket','Ticket ID(135)','-','0.00','162000','2057396.63',1),(266,1,'2024-10-03 11:45:12','Issued Pawning Ticket','Ticket ID(136)','-','0.00','35000','2022396.63',1),(267,1,'2024-10-03 15:13:12','Issued Pawning Ticket','Ticket ID(137)','-','0.00','26000','1996396.63',1),(268,1,'2024-10-03 16:06:26','Customer Payment(Ticket No:68)','-','-','183887.80','0.00','2180284.43',1),(269,1,'2024-10-03 16:17:10','Customer Payment(Ticket No:69)','-','-','244964.40','0.00','2425248.83',1),(270,1,'2024-10-03 16:22:44','Issued Pawning Ticket','Ticket ID(138)','-','0.00','100000','2325248.83',1),(271,1,'2024-10-04 08:31:07','Income(Redeemed Charge-Ticket No-CG/AM/PW/000136)','-','-','1000','0.00','2326248.83',1),(272,1,'2024-10-04 08:31:44','Income(Redeemed Charge-Ticket No-CG/AM/PW/000137)','-','-','1000','0.00','2327248.83',1),(273,1,'2024-10-04 09:58:30','Customer Payment(Ticket No:52)','-','-','133000.80','0.00','2460249.63',1),(274,1,'2024-10-04 10:43:54','Customer Payment(Ticket No:47)','-','-','172114.88','0.00','2632364.51',1),(275,1,'2024-10-04 10:44:31','Customer Payment(Ticket No:46)','-','-','213094.54','0.00','2845459.05',1),(276,1,'2024-10-04 10:44:59','Customer Payment(Ticket No:48)','-','-','96302.30','0.00','2941761.35',1),(277,1,'2024-10-04 11:44:18','Issued Pawning Ticket','Ticket ID(139)','-','0.00','28000','2913761.35',1),(278,1,'2024-10-04 14:05:49','Issued Pawning Ticket','Ticket ID(140)','-','0.00','50000','2863761.35',1),(279,1,'2024-10-04 15:16:39','Issued Pawning Ticket','Ticket ID(141)','-','0.00','361000','2502761.35',1),(280,1,'2024-10-04 17:43:33','Income(Redeemed Charge-Ticket No-CG/AM/PW/000141)','-','-','1000','0.00','2503761.35',1),(281,1,'2024-10-07 10:57:13','Issued Pawning Ticket','Ticket ID(142)','-','0.00','439000','2064761.35',1),(283,1,'2024-10-07 16:44:21','Income(Redeemed Charge-Ticket No-CG/AM/PW/000142)','-','-','1000','0.00','2065761.35',1),(284,1,'2024-10-08 14:51:50','Issued Pawning Ticket','Ticket ID(143)','-','0.00','60000','2005761.35',1),(285,1,'2024-10-08 15:54:46','Customer Payment(Ticket No:110)','-','-','213359.40','0.00','2219120.75',1),(286,2,'2024-10-09 10:14:34','Expenses(Payment for the Photo Frame of Ceylon Gold Pawning License)','-','-','0.00','1000','11455',1),(287,2,'2024-10-09 10:16:14','Expenses(To Buy the Air Fresh)','-','-','0.00','760','10695',1),(288,1,'2024-10-09 15:04:17','Customer Payment(Ticket No:94)','-','-','311384.62','0.00','2530505.37',1),(289,1,'2024-10-09 15:22:28','Issued Pawning Ticket','Ticket ID(144)','-','0.00','57000','2473505.37',1),(290,1,'2024-10-09 15:34:57','Customer Payment(Ticket No:40)','-','-','205436','0.00','2678941.37',1),(291,1,'2024-10-10 12:10:17','Customer Payment(Ticket No:90)','-','-','199430.80','0.00','2878372.17',1),(292,1,'2024-10-10 15:26:16','Customer Payment(Ticket No:144)','-','-','57591.50','0.00','2935963.67',1),(293,1,'2024-10-11 09:30:10','Customer Payment(Ticket No:106)','-','-','20000','0.00','2955963.67',1),(294,1,'2024-10-11 10:03:47','Issued Pawning Ticket','Ticket ID(145)','-','0.00','210000','2745963.67',1),(295,1,'2024-10-11 10:34:10','Issued Pawning Ticket','Ticket ID(146)','-','0.00','668000','2077963.67',1),(296,1,'2024-10-11 10:47:13','Issued Pawning Ticket','Ticket ID(147)','-','0.00','150000','1927963.67',1),(297,1,'2024-10-11 11:56:39','Issued Pawning Ticket','Ticket ID(148)','-','0.00','90000','1837963.67',1),(298,1,'2024-10-11 14:53:50','Issued Pawning Ticket','Ticket ID(149)','-','0.00','36000','1801963.67',1),(299,1,'2024-10-14 09:50:03','Issued Pawning Ticket','Ticket ID(150)','-','0.00','75000','1726963.67',1),(300,1,'2024-10-14 10:11:43','Issued Pawning Ticket','Ticket ID(151)','-','0.00','90000','1636963.67',1),(301,1,'2024-10-14 11:37:02','Customer Payment(Ticket No:21)','-','-','223972.72','0.00','1860936.39',1),(302,1,'2024-10-14 11:38:29','Customer Payment(Ticket No:134)','-','-','621106.64','0.00','2482043.03',1),(303,1,'2024-10-14 11:40:40','Issued Pawning Ticket','Ticket ID(152)','-','0.00','231000','2251043.03',1),(304,1,'2024-10-14 11:44:23','Issued Pawning Ticket','Ticket ID(153)','-','0.00','635000','1616043.03',1),(305,1,'2024-10-14 14:57:47','Customer Payment(Ticket No:150)','-','-','75762.50','0.00','1691805.53',1),(306,1,'2024-10-14 14:59:55','Issued Pawning Ticket','Ticket ID(154)','-','0.00','111000','1580805.53',1),(307,1,'2024-10-14 15:16:17','Customer Payment(Ticket No:145)','-','-','212245','0.00','1793050.53',1),(308,1,'2024-10-15 11:19:10','Issued Pawning Ticket','Ticket ID(155)','-','0.00','15000','1778050.53',1),(309,1,'2024-10-16 10:42:19','Issued Pawning Ticket','Ticket ID(156)','-','0.00','150000','1628050.53',1),(310,1,'2024-10-16 10:50:25','Issued Pawning Ticket','Ticket ID(157)','-','0.00','76000','1552050.53',1),(311,1,'2024-10-16 10:50:55','Issued Pawning Ticket','Ticket ID(158)','-','0.00','58000','1494050.53',1),(312,1,'2024-10-16 10:51:21','Issued Pawning Ticket','Ticket ID(159)','-','0.00','87000','1407050.53',1),(313,1,'2024-10-16 10:51:54','Issued Pawning Ticket','Ticket ID(160)','-','0.00','75000','1332050.53',1),(314,1,'2024-10-16 11:04:30','Income(Redeemed Charge-Ticket No-CG/AM/PW/000156 , Ticket No-CG/AM/PW/000157 , Ticket No-CG/AM/PW/000158 , Ticket No-CG/AM/PW/000159 &Ticket No-CG/AM/PW/000160)','-','-','1000','0.00','1333050.53',1),(315,1,'2024-10-16 11:09:23','Issued Pawning Ticket','Ticket ID(161)','-','0.00','31000','1302050.53',1),(316,1,'2024-10-16 12:38:09','Issued Pawning Ticket','Ticket ID(162)','-','0.00','40000','1262050.53',1),(317,1,'2024-10-16 14:01:31','Issued Pawning Ticket','Ticket ID(163)','-','0.00','176000','1086050.53',1),(318,1,'2024-10-16 16:23:45','Issued Pawning Ticket','Ticket ID(164)','-','0.00','300000','786050.53',1),(319,1,'2024-10-18 11:13:53','Issued Pawning Ticket','Ticket ID(165)','-','0.00','26000','760050.53',1),(320,1,'2024-10-18 15:23:57','Customer Payment(Ticket No:155)','-','-','15192.50','0.00','775243.03',1),(321,1,'2024-10-21 11:50:48','Customer Payment(Ticket No:56)','-','-','11070','0.00','786313.03',1),(322,1,'2024-10-21 12:59:28','Issued Pawning Ticket','Ticket ID(166)','-','0.00','139000','647313.03',1),(323,1,'2024-10-21 13:16:53','Issued Pawning Ticket','Ticket ID(167)','-','0.00','142500','504813.03',1),(324,1,'2024-10-21 14:42:53','Customer Payment(Ticket No:16)','-','-','995858.30','0.00','1500671.33',1),(325,1,'2024-10-21 15:09:16','Customer Payment(Ticket No:97)','-','-','1040','0.00','1501711.33',1),(326,1,'2024-10-21 15:12:58','Customer Payment(Ticket No:165)','-','-','26297','0.00','1528008.33',1),(327,1,'2024-10-21 15:45:54','Issued Pawning Ticket','Ticket ID(168)','-','0.00','310000','1218008.33',1),(328,1,'2024-10-22 11:20:08','Issued Pawning Ticket','Ticket ID(169)','-','0.00','150000','1068008.33',1),(329,1,'2024-10-23 15:44:32','Customer Payment(Ticket No:66)','-','-','21000','0.00','1089008.33',1),(330,1,'2024-10-24 11:18:48','Issued Pawning Ticket','Ticket ID(170)','-','0.00','234000','855008.33',1),(331,1,'2024-10-24 12:39:53','Customer Payment(Ticket No:43)','-','-','688636.55','0.00','1543644.88',1),(332,1,'2024-10-24 12:50:15','Issued Pawning Ticket','Ticket ID(171)','-','0.00','589000','954644.88',1),(333,1,'2024-10-24 16:00:31','Issued Pawning Ticket','Ticket ID(172)','-','0.00','114000','840644.88',1),(334,1,'2024-10-25 11:01:33','Issued Pawning Ticket','Ticket ID(173)','-','0.00','62000','778644.88',1),(335,1,'2024-10-25 11:10:57','Issued Pawning Ticket','Ticket ID(174)','-','0.00','40000','738644.88',1),(336,1,'2024-10-25 11:19:11','Customer Payment(Ticket No:120)','-','-','793652.25','0.00','1532297.13',1),(337,1,'2024-10-25 11:27:16','Customer Payment(Ticket No:105)','-','-','70692.89','0.00','1602990.02',1),(338,1,'2024-10-25 11:47:45','Issued Pawning Ticket','Ticket ID(175)','-','0.00','109000','1493990.02',1),(339,1,'2024-10-25 14:52:10','Customer Payment(Ticket No:112)','-','-','6000','0.00','1499990.02',1),(340,1,'2024-10-25 15:31:26','Customer Payment(Ticket No:124)','-','-','30573.50','0.00','1530563.52',1),(341,1,'2024-10-25 15:35:12','Issued Pawning Ticket','Ticket ID(176)','-','0.00','41000','1489563.52',1),(342,1,'2024-10-25 15:43:37','Customer Payment(Ticket No:146)','-','-','676618.44','0.00','2166181.96',1),(343,1,'2024-10-28 11:06:31','Customer Payment(Ticket No:82)','-','-','103014','0.00','2269195.96',1),(344,1,'2024-10-28 11:55:54','Customer Payment(Ticket No:148)','-','-','91322.90','0.00','2360518.86',1),(345,1,'2024-10-28 11:57:07','Customer Payment(Ticket No:27)','-','-','272872.02','0.00','2633390.88',1),(346,1,'2024-10-28 11:57:51','Customer Payment(Ticket No:67)','-','-','186722.80','0.00','2820113.68',1),(347,1,'2024-10-28 11:59:22','Customer Payment(Ticket No:11)','-','-','366731.29','0.00','3186844.97',1),(348,1,'2024-10-28 12:24:18','Issued Pawning Ticket','Ticket ID(177)','-','0.00','465000','2721844.97',1),(349,1,'2024-10-28 12:41:30','Income(Redeemed Charge-Ticket No-CG/AM/PW/000177)','-','-','1000','0.00','2722844.97',1),(350,1,'2024-10-29 11:00:34','Customer Payment(Ticket No:106)','-','-','306184.46','0.00','3029029.43',1),(351,1,'2024-10-29 12:37:23','Customer Payment(Ticket No:80)','-','-','7330','0.00','3036359.43',1),(352,1,'2024-10-29 12:38:25','Customer Payment(Ticket No:79)','-','-','6440','0.00','3042799.43',1),(353,1,'2024-10-29 14:05:59','Customer Payment(Ticket No:164)','-','-','303577','0.00','3346376.43',1),(354,1,'2024-10-29 14:23:33','Issued Pawning Ticket','Ticket ID(178)','-','0.00','150000','3196376.43',1),(355,3,'2024-10-29 17:36:30','Deposit','21/PF241612/10/199','Gold Loan Cash','700000','0.00','26285000',1),(356,1,'2024-10-29 17:36:30','Withdraw(92170760-Current Account)','21/PF241612/10/199','Gold Loan Cash','0.00','700000','2496376.43',1),(357,1,'2024-10-30 10:22:38','Customer Payment(Ticket No:95)','-','-','2510','0.00','2498886.43',1),(358,1,'2024-10-30 12:25:56','Customer Payment(Ticket No:83)','-','-','12371','0.00','2511257.43',1),(359,1,'2024-10-30 12:29:32','Customer Payment(Ticket No:84)','-','-','8368','0.00','2519625.43',1),(360,2,'2024-10-30 16:24:42','Expenses(To Buy the permanent Marker)','-','-','0.00','220','10475',1),(361,1,'2024-10-30 17:00:59','Issued Pawning Ticket','Ticket ID(179)','-','0.00','15000','2504625.43',1),(362,1,'2024-10-30 17:03:37','Issued Pawning Ticket','Ticket ID(180)','-','0.00','148000','2356625.43',1),(363,2,'2024-10-31 11:52:42','Expenses(Payment for the Legal Photo Copy ( Ledger Sheet ))','-','-','0.00','70','10405',1),(364,2,'2024-10-31 11:53:12','Expenses(Payment for the Canon Printer Toner)','-','-','0.00','5500','4905',1),(365,1,'2024-10-31 16:10:35','Issued Pawning Ticket','Ticket ID(181)','-','0.00','40000','2316625.43',1),(366,1,'2024-11-01 10:42:09','Issued Pawning Ticket','Ticket ID(182)','-','0.00','85000','2231625.43',1),(367,1,'2024-11-01 15:26:31','Customer Payment(Ticket No:172)','-','-','114000','0.00','2345625.43',1),(368,1,'2024-11-02 10:20:30','Customer Payment(Ticket No:56)','-','-','283479.78','0.00','2629105.21',1),(369,1,'2024-11-02 10:27:43','Issued Pawning Ticket','Ticket ID(183)','-','0.00','238000','2391105.21',1),(370,1,'2024-11-02 10:31:42','Customer Payment(Ticket No:57)','-','-','9521','0.00','2400626.21',1),(371,1,'2024-11-04 10:28:37','Issued Pawning Ticket','Ticket ID(184)','-','0.00','135000','2265626.21',1),(372,1,'2024-11-04 10:39:49','Income(Redeemed Charge-Ticket No-CG/AM/PW/000184)','-','-','1000','0.00','2266626.21',1),(373,1,'2024-11-04 12:58:55','Customer Payment(Ticket No:92)','-','-','201546.55','0.00','2468172.76',1),(374,1,'2024-11-05 11:02:51','Customer Payment(Ticket No:171)','-','-','35000','0.00','2503172.76',1),(375,1,'2024-11-05 11:22:06','Issued Pawning Ticket','Ticket ID(185)','-','0.00','100000','2403172.76',1),(376,1,'2024-11-06 09:50:28','Issued Pawning Ticket','Ticket ID(186)','-','0.00','100000','2303172.76',1),(377,1,'2024-11-06 10:31:17','Issued Pawning Ticket','Ticket ID(187)','-','0.00','75000','2228172.76',1),(378,1,'2024-11-06 11:23:47','Income(Redeemed Charge-Ticket No-CG/AM/PW/000187)','-','-','1000','0.00','2229172.76',1),(379,1,'2024-11-06 12:04:09','Issued Pawning Ticket','Ticket ID(188)','-','0.00','119500','2109672.76',1),(380,1,'2024-11-07 12:42:24','Customer Payment(Ticket No:153)','-','-','647429.58','0.00','2757102.34',1),(381,1,'2024-11-07 12:48:49','Issued Pawning Ticket','Ticket ID(189)','-','0.00','672000','2085102.34',1),(382,1,'2024-11-07 12:53:42','Customer Payment(Ticket No:115)','-','-','4000','0.00','2089102.34',1),(383,1,'2024-11-07 13:00:42','Issued Pawning Ticket','Ticket ID(190)','-','0.00','147000','1942102.34',1),(384,1,'2024-11-07 13:01:49','Customer Payment(Ticket No:184)','-','-','136532.50','0.00','2078634.84',1),(385,1,'2024-11-08 11:53:57','Customer Payment(Ticket No:95)','-','-','67448.54','0.00','2146083.38',1),(386,1,'2024-11-08 11:56:25','Issued Pawning Ticket','Ticket ID(191)','-','0.00','70000','2076083.38',1),(387,1,'2024-11-08 12:06:43','Issued Pawning Ticket','Ticket ID(192)','-','0.00','328000','1748083.38',1),(388,1,'2024-11-08 12:20:48','Income(Redeemed Charge-Ticket No-CG/AM/PW/000192)','-','-','1000','0.00','1749083.38',1),(389,1,'2024-11-08 13:11:55','Customer Payment(Ticket No:14)','-','-','601952.34','0.00','2351035.72',1),(390,1,'2024-11-08 13:21:23','Issued Pawning Ticket','Ticket ID(193)','-','0.00','596000','1755035.72',1),(391,3,'2024-11-08 13:53:44','Withdrawal','039980','For the Gold Loan','0.00','1400000','24885000',1),(392,1,'2024-11-08 13:53:44','Deposit(92170760-Current Account)','039980','For the Gold Loan','1400000','0.00','3155035.72',1),(393,1,'2024-11-08 14:52:30','Issued Pawning Ticket','Ticket ID(194)','-','0.00','30000','3125035.72',1),(394,1,'2024-11-08 14:57:14','Customer Payment(Ticket No:109)','-','-','228807.20','0.00','3353842.92',1),(395,1,'2024-11-08 16:09:45','Customer Payment(Ticket No:181)','-','-','40000','0.00','3393842.92',1),(396,1,'2024-11-08 16:13:34','Issued Pawning Ticket','Ticket ID(195)','-','0.00','48500','3345342.92',1),(397,1,'2024-11-08 16:42:40','Issued Pawning Ticket','Ticket ID(196)','-','0.00','203000','3142342.92',1),(398,1,'2024-11-08 16:55:44','Issued Pawning Ticket','Ticket ID(197)','-','0.00','330000','2812342.92',1),(399,1,'2024-11-08 18:17:45','Income(Redeemed Charge-Ticket No-CG/AM/PW/000196)','-','-','1000','0.00','2813342.92',1),(400,1,'2024-11-08 18:17:57','Income(Redeemed Charge-Ticket No-CG/AM/PW/000197)','-','-','1000','0.00','2814342.92',1),(401,1,'2024-11-09 09:10:55','Customer Payment(Ticket No:142)','-','-','449781.61','0.00','3264124.53',1),(402,1,'2024-11-09 09:18:11','Issued Pawning Ticket','Ticket ID(198)','-','0.00','465000','2799124.53',1),(403,1,'2024-11-09 11:43:01','Customer Payment(Ticket No:77)','-','-','166638.97','0.00','2965763.5',1),(404,1,'2024-11-11 09:19:07','Customer Payment(Ticket No:132)','-','-','37057.88','0.00','3002821.38',1),(405,1,'2024-11-11 09:23:26','Issued Pawning Ticket','Ticket ID(199)','-','0.00','55000','2947821.38',1),(406,1,'2024-11-11 09:28:32','Customer Payment(Ticket No:130)','-','-','72082.10','0.00','3019903.48',1),(407,1,'2024-11-11 09:35:23','Issued Pawning Ticket','Ticket ID(200)','-','0.00','74000','2945903.48',1),(408,1,'2024-11-11 10:24:53','Customer Payment(Ticket No:154)','-','-','113496.64','0.00','3059400.12',1),(409,1,'2024-11-11 10:46:17','Customer Payment(Ticket No:170)','-','-','237714.76','0.00','3297114.88',1),(410,1,'2024-11-11 11:20:11','Customer Payment(Ticket No:183)','-','-','3000','0.00','3300114.88',1),(411,1,'2024-11-11 12:57:41','Issued Pawning Ticket','Ticket ID(201)','-','0.00','147000','3153114.88',1),(412,1,'2024-11-11 13:36:08','Issued Pawning Ticket','Ticket ID(202)','-','0.00','165000','2988114.88',1),(413,1,'2024-11-11 13:44:43','Customer Payment(Ticket No:174)','-','-','40597.09','0.00','3028711.97',1),(414,1,'2024-11-11 14:33:45','Customer Payment(Ticket No:178)','-','-','151973.50','0.00','3180685.47',1),(415,3,'2024-11-11 16:27:40','Deposit','413/PF221177/1/287','Gold Loan Cash','1700000','0.00','26585000',1),(416,1,'2024-11-11 16:27:40','Withdraw(92170760-Current Account)','413/PF221177/1/287','Gold Loan Cash','0.00','1700000','1480685.47',1),(417,1,'2024-11-11 16:28:08','Income(Redeemed Charge-Ticket No-CG/AM/PW/000201)','-','-','1000','0.00','1481685.47',1),(418,1,'2024-11-11 16:28:28','Income(Redeemed Charge-Ticket No-CG/AM/PW/000202)','-','-','1000','0.00','1482685.47',1),(419,1,'2024-11-12 09:45:28','Issued Pawning Ticket','Ticket ID(203)','-','0.00','95000','1387685.47',1),(420,1,'2024-11-12 13:19:21','Issued Pawning Ticket','Ticket ID(204)','-','0.00','327000','1060685.47',1),(421,1,'2024-11-12 13:27:12','Issued Pawning Ticket','Ticket ID(205)','-','0.00','85000','975685.47',1),(422,1,'2024-11-12 13:49:38','Issued Pawning Ticket','Ticket ID(206)','-','0.00','331000','644685.47',1),(423,3,'2024-11-12 16:18:08','Withdrawal','039981','For the Gold Loan','0.00','1500000','25085000',1),(424,1,'2024-11-12 16:18:08','Deposit(92170760-Current Account)','039981','For the Gold Loan','1500000','0.00','2144685.47',1),(425,1,'2024-11-12 16:18:35','Income(Redeemed Charge-Ticket No-CG/AM/PW/000203)','-','-','1000','0.00','2145685.47',1),(426,1,'2024-11-12 16:19:04','Income(Redeemed Charge-Ticket No-CG/AM/PW/000204 , Ticket No-CG/AM/PW/000205 & Ticket No-CG/AM/PW/000206)','-','-','1000','0.00','2146685.47',1),(427,1,'2024-11-12 16:34:23','Issued Pawning Ticket','Ticket ID(207)','-','0.00','400000','1746685.47',1),(428,1,'2024-11-13 11:01:19','Customer Payment(Ticket No:169)','-','-','35000','0.00','1781685.47',1),(429,1,'2024-11-13 12:03:54','Customer Payment(Ticket No:201)','-','-','148646.50','0.00','1930331.97',1),(430,2,'2024-11-16 10:55:59','Expenses(Batticaloa Travelling Expenses for the Gold Selling)','-','-','0.00','3800','1105',1),(431,1,'2024-11-16 12:12:57','Issued Pawning Ticket','Ticket ID(208)','-','0.00','400000','1530331.97',1),(432,1,'2024-11-16 12:20:46','Issued Pawning Ticket','Ticket ID(209)','-','0.00','230000','1300331.97',1),(433,1,'2024-11-16 12:33:27','Income(Redeemed Charge-Ticket No-CG/AM/PW/000208 & Ticket No-CG/AM/PW/000209)','-','-','1000','0.00','1301331.97',1),(434,1,'2024-11-18 12:28:05','Issued Pawning Ticket','Ticket ID(210)','-','0.00','188000','1113331.97',1),(435,1,'2024-11-18 12:31:13','Issued Pawning Ticket','Ticket ID(211)','-','0.00','712000','401331.97',1),(436,1,'2024-11-18 13:57:43','Customer Payment(Ticket No:207)','-','-','404050','0.00','805381.97',1),(437,1,'2024-11-19 14:36:04','Customer Payment(Ticket No:128)','-','-','182357.20','0.00','987739.17',1),(438,1,'2024-11-20 10:14:47','Customer Payment(Ticket No:190)','-','-','148909.63','0.00','1136648.8',1),(439,1,'2024-11-20 10:49:59','Issued Pawning Ticket','Ticket ID(212)','-','0.00','82000','1054648.8',1),(440,1,'2024-11-20 13:47:54','Customer Payment(Ticket No:78)','-','-','74350.82','0.00','1128999.62',1),(441,1,'2024-11-20 15:21:11','Issued Pawning Ticket','Ticket ID(213)','-','0.00','25000','1103999.62',1),(442,1,'2024-11-20 17:18:01','Issued Pawning Ticket','Ticket ID(214)','-','0.00','238000','865999.62',1),(443,3,'2024-11-20 18:13:01','Withdrawal','039982','For the Gold Loan','0.00','1000000','24085000',1),(444,1,'2024-11-20 18:13:01','Deposit(92170760-Current Account)','039982','For the Gold Loan','1000000','0.00','1865999.62',1),(445,1,'2024-11-21 10:00:58','Customer Payment(Ticket No:73)','-','-','263020','0.00','2129019.62',1),(446,1,'2024-11-21 10:09:13','Issued Pawning Ticket','Ticket ID(215)','-','0.00','79000','2050019.62',1),(447,1,'2024-11-21 10:23:41','Income(Redeemed Charge-Ticket No-CG/AM/PW/000215)','-','-','500','0.00','2050519.62',1),(448,1,'2024-11-21 12:15:11','Issued Pawning Ticket','Ticket ID(217)','-','0.00','55000','1995519.62',1),(449,1,'2024-11-21 12:15:22','Issued Pawning Ticket','Ticket ID(216)','-','0.00','190000','1805519.62',1),(450,1,'2024-11-21 12:39:08','Income(Redeemed Charge-Ticket No-CG/AM/PW/000216 & Ticket No-CG/AM/PW/000217)','-','-','1000','0.00','1806519.62',1),(451,1,'2024-11-21 13:24:48','Issued Pawning Ticket','Ticket ID(218)','-','0.00','27000','1779519.62',1),(452,1,'2024-11-21 13:29:52','Customer Payment(Ticket No:213)','-','-','25287.50','0.00','1804807.12',1),(453,1,'2024-11-21 15:27:47','Customer Payment(Ticket No:104)','-','-','324053.14','0.00','2128860.26',1),(454,1,'2024-11-21 17:02:36','Customer Payment(Ticket No:214)','-','-','240511','0.00','2369371.26',1),(455,1,'2024-11-22 13:05:26','Customer Payment(Ticket No:208)','-','-','404050','0.00','2773421.26',1),(456,1,'2024-11-25 12:28:28','Customer Payment(Ticket No:17)','-','-','787264.09','0.00','3560685.35',1),(457,3,'2024-11-25 15:02:38','Deposit','21/PF222779/3/314','Gold Loan Cash','1000000','0.00','25085000',1),(458,1,'2024-11-25 15:02:38','Withdraw(92170760-Current Account)','21/PF222779/3/314','Gold Loan Cash','0.00','1000000','2560685.35',1),(459,1,'2024-11-27 10:15:44','Issued Pawning Ticket','Ticket ID(219)','-','0.00','108000','2452685.35',1),(460,1,'2024-11-27 11:38:20','Customer Payment(Ticket No:183)','-','-','239753.05','0.00','2692438.4',1),(461,1,'2024-11-27 11:43:48','Issued Pawning Ticket','Ticket ID(220)','-','0.00','154000','2538438.4',1),(462,1,'2024-11-27 12:51:19','Customer Payment(Ticket No:103)','-','-','506542.70','0.00','3044981.1',1),(463,1,'2024-11-27 13:06:01','Customer Payment(Ticket No:194)','-','-','30496.10','0.00','3075477.2',1),(464,3,'2024-11-27 13:53:27','Deposit','21/PF222779/3/235','Gold Loan Cash','700000','0.00','25785000',1),(465,1,'2024-11-27 13:53:27','Withdraw(92170760-Current Account)','21/PF222779/3/235','Gold Loan Cash','0.00','700000','2375477.2',1),(466,1,'2024-11-28 11:44:13','Issued Pawning Ticket','Ticket ID(221)','-','0.00','60000','2315477.2',1),(467,1,'2024-11-28 15:04:34','Customer Payment(Ticket No:137)','-','-','27050.48','0.00','2342527.68',1),(468,1,'2024-11-28 15:15:16','Issued Pawning Ticket','Ticket ID(222)','-','0.00','37000','2305527.68',1),(469,1,'2024-11-29 10:32:03','Customer Payment(Ticket No:76)','-','-','65265.29','0.00','2370792.97',1),(470,1,'2024-11-29 11:32:18','Issued Pawning Ticket','Ticket ID(223)','-','0.00','678000','1692792.97',1),(471,1,'2024-11-29 13:27:24','Customer Payment(Ticket No:80)','-','-','3800','0.00','1696592.97',1),(472,1,'2024-11-29 13:28:11','Customer Payment(Ticket No:79)','-','-','6200','0.00','1702792.97',1),(473,1,'2024-11-29 13:36:23','Issued Pawning Ticket','Ticket ID(224)','-','0.00','71000','1631792.97',1),(474,1,'2024-11-29 13:38:06','Customer Payment(Ticket No:118)','-','-','6800','0.00','1638592.97',1),(475,1,'2024-11-29 17:29:31','Income(Redeemed Charge-Ticket No-CG/AM/PW/000223)','-','-','1000','0.00','1639592.97',1),(476,1,'2024-11-30 09:51:48','Customer Payment(Ticket No:169)','-','-','3000','0.00','1642592.97',1),(477,1,'2024-12-02 10:34:04','Issued Pawning Ticket','Ticket ID(225)','-','0.00','120000','1522592.97',1),(478,1,'2024-12-02 13:56:52','Customer Payment(Ticket No:107)','-','-','111078.44','0.00','1633671.41',1),(479,1,'2024-12-02 14:11:14','Issued Pawning Ticket','Ticket ID(226)','-','0.00','30000','1603671.41',1),(480,1,'2024-12-03 12:48:59','Customer Payment(Ticket No:29)','-','-','9000','0.00','1612671.41',1),(481,1,'2024-12-03 13:34:42','Customer Payment(Ticket No:57)','-','-','88011.69','0.00','1700683.1',1),(482,1,'2024-12-03 13:35:32','Customer Payment(Ticket No:220)','-','-','155713.00','0.00','1856396.1',1),(483,1,'2024-12-03 13:36:05','Customer Payment(Ticket No:100)','-','-','92351.66','0.00','1948747.76',1),(484,1,'2024-12-03 14:24:14','Customer Payment(Ticket No:84)','-','-','213838.26','0.00','2162586.02',1),(485,1,'2024-12-04 10:25:41','Customer Payment(Ticket No:36)','-','-','7000','0.00','2169586.02',1),(486,1,'2024-12-04 14:03:05','Issued Pawning Ticket','Ticket ID(227)','-','0.00','69000','2100586.02',1),(487,1,'2024-12-05 15:44:08','Customer Payment(Ticket No:175)','-','-','112494.80','0.00','2213080.82',1),(488,1,'2024-12-05 15:54:16','Customer Payment(Ticket No:125)','-','-','11000','0.00','2224080.82',1),(489,1,'2024-12-06 09:23:32','Customer Payment(Ticket No:93)','-','-','5000','0.00','2229080.82',1),(490,1,'2024-12-06 10:19:40','Customer Payment(Ticket No:60)','-','-','182839.44','0.00','2411920.26',1),(491,1,'2024-12-06 11:42:26','Customer Payment(Ticket No:45)','-','-','34014.83','0.00','2445935.09',1),(492,1,'2024-12-09 11:48:28','Customer Payment(Ticket No:6)','-','-','277837.56','0.00','2723772.65',1),(493,1,'2024-12-09 11:52:41','Issued Pawning Ticket','Ticket ID(228)','-','0.00','199000','2524772.65',1),(494,1,'2024-12-09 11:56:02','Customer Payment(Ticket No:5)','-','-','17200','0.00','2541972.65',1),(495,1,'2024-12-09 13:36:14','Issued Pawning Ticket','Ticket ID(229)','-','0.00','480000','2061972.65',1),(496,1,'2024-12-09 15:00:52','Customer Payment(Ticket No:140)','-','-','50000','0.00','2111972.65',1),(497,1,'2024-12-10 12:42:45','Issued Pawning Ticket','Ticket ID(230)','-','0.00','400000','1711972.65',1),(498,1,'2024-12-11 12:47:56','Customer Payment(Ticket No:81)','-','-','154046.55','0.00','1866019.2',1),(499,1,'2024-12-12 11:01:53','Issued Pawning Ticket','Ticket ID(231)','-','0.00','20000','1846019.2',1),(500,1,'2024-12-13 12:50:27','Customer Payment(Ticket No:29)','-','-','6500','0.00','1852519.2',1),(501,1,'2024-12-13 13:11:35','Issued Pawning Ticket','Ticket ID(232)','-','0.00','257000','1595519.2',1),(502,1,'2024-12-13 13:53:03','Customer Payment(Ticket No:112)','-','-','8100','0.00','1603619.2',1),(503,1,'2024-12-13 14:01:19','Issued Pawning Ticket','Ticket ID(233)','-','0.00','200000','1403619.2',1),(504,1,'2024-12-16 13:45:16','Issued Pawning Ticket','Ticket ID(234)','-','0.00','150000','1253619.2',1),(505,1,'2024-12-17 10:47:32','Issued Pawning Ticket','Ticket ID(235)','-','0.00','40000','1213619.2',1),(506,1,'2024-12-17 11:33:55','Issued Pawning Ticket','Ticket ID(236)','-','0.00','60000','1153619.2',1),(507,1,'2024-12-17 11:53:38','Issued Pawning Ticket','Ticket ID(237)','-','0.00','13000','1140619.2',1),(508,1,'2024-12-17 12:05:31','Customer Payment(Ticket No:209)','-','-','235477.90','0.00','1376097.1',1),(509,1,'2024-12-17 13:14:51','Customer Payment(Ticket No:179)','-','-','15551.60','0.00','1391648.7',1),(510,1,'2024-12-17 13:29:35','Customer Payment(Ticket No:171)','-','-','577334.10','0.00','1968982.8',1),(511,1,'2024-12-17 13:37:11','Issued Pawning Ticket','Ticket ID(238)','-','0.00','577500','1391482.8',1),(512,1,'2024-12-17 13:50:57','Issued Pawning Ticket','Ticket ID(239)','-','0.00','46000','1345482.8',1),(513,1,'2024-12-17 14:04:45','Issued Pawning Ticket','Ticket ID(240)','-','0.00','350000','995482.8',1),(514,1,'2024-12-17 14:25:43','Issued Pawning Ticket','Ticket ID(241)','-','0.00','50000','945482.8',1),(515,1,'2024-12-17 14:48:28','Customer Payment(Ticket No:115)','-','-','114032.02','0.00','1059514.82',1),(516,1,'2024-12-17 14:49:12','Customer Payment(Ticket No:135)','-','-','170524.96','0.00','1230039.78',1),(517,1,'2024-12-17 14:49:43','Customer Payment(Ticket No:189)','-','-','690912.80','0.00','1920952.58',1),(518,1,'2024-12-17 14:50:11','Customer Payment(Ticket No:152)','-','-','242993.52','0.00','2163946.1',1),(519,1,'2024-12-18 10:43:52','Issued Pawning Ticket','Ticket ID(242)','-','0.00','30000','2133946.1',1),(520,1,'2024-12-18 13:07:16','Customer Payment(Ticket No:125)','-','-','1530.30','0.00','2135476.4',1),(521,1,'2024-12-18 13:32:49','Customer Payment(Ticket No:162)','-','-','40000','0.00','2175476.4',1),(522,1,'2024-12-19 13:34:00','Customer Payment(Ticket No:149)','-','-','36000','0.00','2211476.4',1),(523,1,'2024-12-19 13:35:48','Customer Payment(Ticket No:151)','-','-','90000','0.00','2301476.4',1),(524,1,'2024-12-19 13:42:50','Issued Pawning Ticket','Ticket ID(243)','-','0.00','136000','2165476.4',1),(525,1,'2024-12-20 10:06:10','Customer Payment(Ticket No:37)','-','-','5200','0.00','2170676.4',1),(526,1,'2024-12-20 11:41:22','Customer Payment(Ticket No:195)','-','-','48500','0.00','2219176.4',1),(527,1,'2024-12-20 14:17:35','Customer Payment(Ticket No:223)','-','-','689888.14','0.00','2909064.54',1),(528,1,'2024-12-20 14:39:47','Issued Pawning Ticket','Ticket ID(244)','-','0.00','700000','2209064.54',1),(529,1,'2024-12-21 10:37:31','Customer Payment(Ticket No:231)','-','-','20240','0.00','2229304.54',1),(530,1,'2024-12-23 13:58:54','Issued Pawning Ticket','Ticket ID(245)','-','0.00','246600','1982704.54',1),(531,1,'2024-12-23 14:01:54','Issued Pawning Ticket','Ticket ID(246)','-','0.00','164300','1818404.54',1),(532,1,'2024-12-23 14:03:32','Issued Pawning Ticket','Ticket ID(247)','-','0.00','164500','1653904.54',1),(533,1,'2024-12-23 14:17:43','Customer Payment(Ticket No:157)','-','-','79549.04','0.00','1733453.58',1),(534,1,'2024-12-23 14:20:07','Issued Pawning Ticket','Ticket ID(248)','-','0.00','81000','1652453.58',1),(535,1,'2024-12-23 14:22:18','Customer Payment(Ticket No:159)','-','-','91055.48','0.00','1743509.06',1),(536,1,'2024-12-23 14:24:15','Issued Pawning Ticket','Ticket ID(249)','-','0.00','92000','1651509.06',1),(537,1,'2024-12-23 14:26:00','Customer Payment(Ticket No:160)','-','-','78503','0.00','1730012.06',1),(538,1,'2024-12-23 14:29:30','Issued Pawning Ticket','Ticket ID(250)','-','0.00','80000','1650012.06',1),(539,1,'2024-12-23 14:34:02','Customer Payment(Ticket No:158)','-','-','60720.32','0.00','1710732.38',1),(540,1,'2024-12-23 14:36:01','Issued Pawning Ticket','Ticket ID(251)','-','0.00','62000','1648732.38',1),(541,1,'2024-12-23 14:37:42','Customer Payment(Ticket No:156)','-','-','157156','0.00','1805888.38',1),(542,1,'2024-12-23 14:39:11','Issued Pawning Ticket','Ticket ID(252)','-','0.00','160000','1645888.38',1),(543,3,'2024-12-24 10:22:24','Withdrawal','039988','Petty Cash','0.00','13895','25771105',1),(544,1,'2024-12-24 10:22:24','Deposit(92170760-Current Account)','039988','Petty Cash','13895','0.00','1659783.38',1),(545,2,'2024-12-24 10:26:32','Deposit','-','Petty Cash','13895','0.00','15000',1),(546,1,'2024-12-24 10:26:32','Withdraw(Office expenses 001-Running Cash)','-','Petty Cash','0.00','13895','1645888.38',1),(547,1,'2024-12-24 10:34:34','Income(Redeemed Charge-Ticket No-CG/AM/PW/000232 & Ticket No-CG/AM/PW/000233)','-','-','1000','0.00','1646888.38',1),(548,1,'2024-12-24 10:35:31','Income(Redeemed Charge-Ticket No-CG/AM/PW/000240)','-','-','1000','0.00','1647888.38',1),(549,1,'2024-12-24 10:36:15','Income(Redeemed Charge-Ticket No-CG/AM/PW/000245 , Ticket No-CG/AM/PW/000246 & Ticket No-CG/AM/PW/000247)','-','-','1000','0.00','1648888.38',1),(550,1,'2024-12-24 10:49:01','Customer Payment(Ticket No:221)','-','-','61256.80','0.00','1710145.18',1),(551,1,'2024-12-24 11:55:38','Customer Payment(Ticket No:29)','-','-','4400','0.00','1714545.18',1),(552,1,'2024-12-24 12:59:46','Issued Pawning Ticket','Ticket ID(253)','-','0.00','19800','1694745.18',1),(553,1,'2024-12-24 14:15:12','Customer Payment(Ticket No:122)','-','-','312196.44','0.00','2006941.62',1),(554,2,'2024-12-26 11:20:58','Expenses(To Buy The Air Fresh & Bio Clean)','-','-','0.00','1450','13550',1),(555,2,'2024-12-26 11:22:53','Expenses(Payment For The Rubber Seals)','-','-','0.00','2750','10800',1),(556,2,'2024-12-26 12:03:47','Expenses(Letter Charges Of The Reminder Letter Of Pawning)','-','-','0.00','700','10100',1),(557,1,'2024-12-27 09:22:52','Issued Pawning Ticket','Ticket ID(254)','-','0.00','90000','1916941.62',1),(558,1,'2024-12-27 09:47:57','Customer Payment(Ticket No:254)','-','-','90000','0.00','2006941.62',1),(559,1,'2024-12-27 11:57:47','Customer Payment(Ticket No:39)','-','-','49000','0.00','2055941.62',1),(560,1,'2024-12-27 13:44:24','Customer Payment(Ticket No:66)','-','-','587920.30','0.00','2643861.92',1),(561,1,'2024-12-27 13:49:42','Issued Pawning Ticket','Ticket ID(255)','-','0.00','576700','2067161.92',1),(562,1,'2024-12-27 16:31:10','Customer Payment(Ticket No:163)','-','-','10500','0.00','2077661.92',1),(563,2,'2024-12-27 17:43:39','Expenses(New Year Decoration ( Glitter Board ))','-','-','0.00','172','9928',1),(564,1,'2024-12-28 10:23:51','Issued Pawning Ticket','Ticket ID(256)','-','0.00','700000','1377661.92',1),(565,1,'2024-12-30 08:54:38','Issued Pawning Ticket','Ticket ID(257)','-','0.00','47000','1330661.92',1),(566,1,'2024-12-30 09:54:08','Issued Pawning Ticket','Ticket ID(258)','-','0.00','10000','1320661.92',1),(567,1,'2024-12-30 10:17:14','Customer Payment(Ticket No:93)','-','-','5600','0.00','1326261.92',1),(568,1,'2024-12-30 10:42:20','Customer Payment(Ticket No:168)','-','-','327700.80','0.00','1653962.72',1),(569,1,'2024-12-30 10:42:53','Customer Payment(Ticket No:126)','-','-','321553.84','0.00','1975516.56',1),(570,3,'2024-12-30 12:46:09','Withdrawal','039990','For the Gold Loan','0.00','1600000','24171105',1),(571,1,'2024-12-30 12:46:09','Deposit(92170760-Current Account)','039990','For the Gold Loan','1600000','0.00','3575516.56',1),(572,1,'2024-12-30 14:04:57','Customer Payment(Ticket No:83)','-','-','323356.47','0.00','3898873.03',1),(573,1,'2024-12-30 14:29:44','Issued Pawning Ticket','Ticket ID(259)','-','0.00','40000','3858873.03',1),(574,1,'2024-12-30 16:18:09','Issued Pawning Ticket','Ticket ID(260)','-','0.00','17000','3841873.03',1),(575,1,'2024-12-31 09:44:46','Customer Payment(Ticket No:258)','-','-','10145','0.00','3852018.03',1),(576,1,'2024-12-31 09:49:12','Issued Pawning Ticket','Ticket ID(261)','-','0.00','20200','3831818.03',1),(577,1,'2024-12-31 09:58:07','Customer Payment(Ticket No:53)','-','-','352624','0.00','4184442.03',1),(578,1,'2024-12-31 10:04:37','Issued Pawning Ticket','Ticket ID(262)','-','0.00','388000','3796442.03',1),(579,1,'2024-12-31 10:06:24','Customer Payment(Ticket No:55)','-','-','199928.60','0.00','3996370.63',1),(580,1,'2024-12-31 13:06:15','Customer Payment(Ticket No:39)','-','-','488468.86','0.00','4484839.49',1),(581,1,'2024-12-31 15:15:56','Customer Payment(Ticket No:230)','-','-','406968.63','0.00','4891808.12',1),(582,3,'2024-12-31 17:43:36','Deposit','21/PF222779/3/282','Gold Loan Cash','1500000','0.00','25671105',1),(583,1,'2024-12-31 17:43:36','Withdraw(92170760-Current Account)','21/PF222779/3/282','Gold Loan Cash','0.00','1500000','3391808.12',1),(584,1,'2025-01-01 10:27:51','Customer Payment(Ticket No:257)','-','-','47496.50','0.00','3439304.62',1),(585,1,'2025-01-01 11:18:33','Issued Pawning Ticket','Ticket ID(263)','-','0.00','13600','3425704.62',1),(586,1,'2025-01-01 11:23:18','Customer Payment(Ticket No:136)','-','-','37052.90','0.00','3462757.52',1),(587,1,'2025-01-01 11:26:24','Issued Pawning Ticket','Ticket ID(264)','-','0.00','38200','3424557.52',1),(588,1,'2025-01-01 13:06:41','Customer Payment(Ticket No:91)','-','-','11600','0.00','3436157.52',1),(589,2,'2025-01-02 13:01:16','Expenses(Vote Ledger Print Out)','-','-','0.00','120','9808',1),(590,2,'2025-01-02 13:02:43','Expenses(Poster Charges For The 2nd Reminder Letters Of Pawning)','-','-','0.00','450','9358',1),(591,3,'2025-01-02 14:33:29','Withdrawal','039991','Gold Loan Cash','0.00','1000000','24671105',1),(592,1,'2025-01-02 14:33:29','Deposit(92170760-Current Account)','039991','Gold Loan Cash','1000000','0.00','4436157.52',1),(593,1,'2025-01-03 09:50:03','Customer Payment(Ticket No:147)','-','-','9000','0.00','4445157.52',1),(594,1,'2025-01-03 15:32:52','Customer Payment(Ticket No:177)','-','-','200000','0.00','4645157.52',1),(595,1,'2025-01-03 15:33:37','Customer Payment(Ticket No:114)','-','-','20000','0.00','4665157.52',1),(596,2,'2025-01-03 16:26:50','Expenses(Poster Charges For The 1st Reminder Letter Of Pawning)','-','-','0.00','50','9308',1),(597,1,'2025-01-04 13:19:03','Issued Pawning Ticket','Ticket ID(265)','-','0.00','17000','4648157.52',1),(598,1,'2025-01-06 11:09:19','Issued Pawning Ticket','Ticket ID(266)','-','0.00','148500','4499657.52',1),(599,1,'2025-01-06 11:18:43','Customer Payment(Ticket No:62)','-','-','37497.20','0.00','4537154.72',1),(600,1,'2025-01-06 11:23:17','Issued Pawning Ticket','Ticket ID(267)','-','0.00','47500','4489654.72',1),(601,1,'2025-01-06 12:07:04','Issued Pawning Ticket','Ticket ID(268)','-','0.00','24600','4465054.72',1),(602,1,'2025-01-06 13:11:04','Issued Pawning Ticket','Ticket ID(269)','-','0.00','17800','4447254.72',1),(603,1,'2025-01-06 13:14:47','Customer Payment(Ticket No:242)','-','-','520','0.00','4447774.72',1),(604,1,'2025-01-06 16:38:00','Issued Pawning Ticket','Ticket ID(270)','-','0.00','79600','4368174.72',1),(605,1,'2025-01-06 16:39:56','Issued Pawning Ticket','Ticket ID(271)','-','0.00','105900','4262274.72',1),(606,1,'2025-01-06 17:49:22','Income(Redeemed Charge-Ticket No-CG/AM/PW/000270 & Ticket No-CG/AM/PW/000271)','-','-','500','0.00','4262774.72',1),(607,1,'2025-01-07 09:46:21','Customer Payment(Ticket No:34)','-','-','174498.82','0.00','4437273.54',1),(608,1,'2025-01-07 09:47:29','Customer Payment(Ticket No:33)','-','-','149606.48','0.00','4586880.02',1),(609,1,'2025-01-07 10:36:36','Issued Pawning Ticket','Ticket ID(272)','-','0.00','27000','4559880.02',1),(610,1,'2025-01-07 11:00:30','Income(Ticket No-CG/AM/PW/000272)','-','-','500','0.00','4560380.02',1),(611,1,'2025-01-07 12:00:53','Issued Pawning Ticket','Ticket ID(273)','-','0.00','17000','4543380.02',1),(612,1,'2025-01-07 13:02:50','Customer Payment(Ticket No:266)','-','-','150160.75','0.00','4693540.77',1),(613,1,'2025-01-07 16:00:13','Customer Payment(Ticket No:143)','-','-','3700','0.00','4697240.77',1),(614,1,'2025-01-08 13:06:49','Issued Pawning Ticket','Ticket ID(274)','-','0.00','93300','4603940.77',1),(615,1,'2025-01-08 13:10:35','Issued Pawning Ticket','Ticket ID(275)','-','0.00','161000','4442940.77',1),(616,1,'2025-01-08 13:43:11','Income(Ticket No-CG/AM/PW/000274 & Ticket No-CG/AM/PW/000275)','-','-','1000','0.00','4443940.77',1),(617,1,'2025-01-08 13:58:00','Issued Pawning Ticket','Ticket ID(276)','-','0.00','195100','4248840.77',1),(618,1,'2025-01-08 14:31:54','Income(Ticket No-CG/AM/PW/000276)','-','-','500','0.00','4249340.77',1),(619,2,'2025-01-08 14:42:21','Expenses(Ceylon Gold Calendars)','-','-','0.00','3900','5408',1),(620,1,'2025-01-09 09:35:50','Customer Payment(Ticket No:261)','-','-','20441.90','0.00','4269782.67',1),(621,1,'2025-01-09 09:37:45','Issued Pawning Ticket','Ticket ID(277)','-','0.00','25200','4244582.67',1),(622,1,'2025-01-09 15:00:42','Customer Payment(Ticket No:177)','-','-','291752.75','0.00','4536335.42',1),(623,2,'2025-01-09 15:36:42','Expenses(New Year Experiences)','-','-','0.00','1070','4338',1),(624,1,'2025-01-10 12:21:54','Customer Payment(Ticket No:277)','-','-','25489.40','0.00','4561824.82',1),(625,1,'2025-01-10 13:08:06','Issued Pawning Ticket','Ticket ID(278)','-','0.00','24500','4537324.82',1),(626,1,'2025-01-10 13:13:14','Customer Payment(Ticket No:111)','-','-','170419.60','0.00','4707744.42',1),(627,1,'2025-01-10 13:14:20','Customer Payment(Ticket No:141)','-','-','381516.54','0.00','5089260.96',1),(628,1,'2025-01-10 17:02:19','Income(Ticket No-CG/AM/PW/000278)','-','-','500','0.00','5089760.96',1),(629,1,'2025-01-11 11:55:05','Issued Pawning Ticket','Ticket ID(279)','-','0.00','15300','5074460.96',1),(630,1,'2025-01-15 09:26:53','Customer Payment(Ticket No:176)','-','-','43200.62','0.00','5117661.58',1),(631,1,'2025-01-15 09:29:05','Issued Pawning Ticket','Ticket ID(280)','-','0.00','44400','5073261.58',1),(632,1,'2025-01-15 10:14:36','Issued Pawning Ticket','Ticket ID(281)','-','0.00','30000','5043261.58',1),(633,1,'2025-01-15 14:10:45','Issued Pawning Ticket','Ticket ID(282)','-','0.00','45000','4998261.58',1),(634,1,'2025-01-15 14:19:57','Issued Pawning Ticket','Ticket ID(283)','-','0.00','351900','4646361.58',1),(635,1,'2025-01-15 15:20:09','Income(Ticket No-CG/AM/PW/000283)','-','-','500','0.00','4646861.58',1),(636,1,'2025-01-15 16:06:27','Customer Payment(Ticket No:5)','-','-','181527.13','0.00','4828388.71',1),(637,1,'2025-01-15 16:09:12','Issued Pawning Ticket','Ticket ID(284)','-','0.00','183200','4645188.71',1),(638,1,'2025-01-15 16:12:14','Customer Payment(Ticket No:228)','-','-','204525.49','0.00','4849714.2',1),(639,1,'2025-01-15 16:15:11','Issued Pawning Ticket','Ticket ID(285)','-','0.00','213000','4636714.2',1),(640,1,'2025-01-16 09:24:19','Issued Pawning Ticket','Ticket ID(286)','-','0.00','70000','4566714.2',1),(641,1,'2025-01-16 09:32:31','Customer Payment(Ticket No:96)','-','-','202507.50','0.00','4769221.7',1),(642,1,'2025-01-16 09:35:29','Issued Pawning Ticket','Ticket ID(287)','-','0.00','196300','4572921.7',1),(643,1,'2025-01-16 11:59:36','Customer Payment(Ticket No:236)','-','-','1500','0.00','4574421.7',1),(644,1,'2025-01-16 12:00:59','Customer Payment(Ticket No:203)','-','-','3900','0.00','4578321.7',1),(645,1,'2025-01-16 15:00:12','Customer Payment(Ticket No:173)','-','-','65490.38','0.00','4643812.08',1),(646,1,'2025-01-16 15:03:10','Issued Pawning Ticket','Ticket ID(288)','-','0.00','65500','4578312.08',1),(647,1,'2025-01-17 09:41:24','Issued Pawning Ticket','Ticket ID(289)','-','0.00','226000','4352312.08',1),(648,1,'2025-01-17 09:47:32','Customer Payment(Ticket No:169)','-','-','20000','0.00','4372312.08',1),(649,1,'2025-01-17 13:34:46','Issued Pawning Ticket','Ticket ID(290)','-','0.00','197800','4174512.08',1),(650,1,'2025-01-17 13:36:35','Issued Pawning Ticket','Ticket ID(291)','-','0.00','153100','4021412.08',1),(651,1,'2025-01-17 14:39:32','Income(Ticket No-CG/AM/PW/000289)','-','-','500','0.00','4021912.08',1),(652,1,'2025-01-17 14:41:07','Income(Ticket No-CG/AM/PW/000290 & Ticket No-CG/AM/PW/000291)','-','-','1000','0.00','4022912.08',1),(653,2,'2025-01-17 14:44:51','Expenses(Poster Charges For The 3rd Reminder Letters Of Pawning)','-','-','0.00','990','3348',1),(654,1,'2025-01-20 11:11:33','Customer Payment(Ticket No:44)','-','-','328840.02','0.00','4351752.1',1),(655,2,'2025-01-20 11:25:54','Expenses(Office Number Reload (074-3942593))','-','-','0.00','50','3298',1),(656,2,'2025-01-20 11:26:53','Expenses(Office Number Reload (074-3942599))','-','-','0.00','50','3248',1),(657,2,'2025-01-20 11:27:26','Expenses(Office Number Reload (074-3942597))','-','-','0.00','50','3198',1),(658,1,'2025-01-20 13:18:17','Customer Payment(Ticket No:279)','-','-','15495.35','0.00','4367247.45',1),(659,1,'2025-01-20 13:30:00','Issued Pawning Ticket','Ticket ID(292)','-','0.00','134400','4232847.45',1),(660,1,'2025-01-20 13:42:29','Issued Pawning Ticket','Ticket ID(293)','-','0.00','40000','4192847.45',1),(661,1,'2025-01-20 13:52:17','Issued Pawning Ticket','Ticket ID(294)','-','0.00','26600','4166247.45',1),(662,1,'2025-01-20 14:34:12','Income(Ticket No-CG/AM/PW/000292)','-','-','500','0.00','4166747.45',1),(663,1,'2025-01-20 14:34:56','Income(Ticket No-CG/AM/PW/000294)','-','-','500','0.00','4167247.45',1),(664,1,'2025-01-20 16:13:51','Customer Payment(Ticket No:284)','-','-','185190.40','0.00','4352437.85',1),(665,1,'2025-01-20 16:14:31','Customer Payment(Ticket No:285)','-','-','215273.50','0.00','4567711.35',1),(666,1,'2025-01-20 17:23:24','Customer Payment(Ticket No:167)','-','-','8900','0.00','4576611.35',1),(667,1,'2025-01-20 22:41:19','Issued Pawning Ticket','Ticket ID(295)','-','0.00','50000','4526611.35',1),(668,4,'2025-02-02 16:55:40','Deposit','dvf','dvf','100000','0.00','100000',1),(669,1,'2025-02-02 16:55:40','Withdraw(1-Cashier)','dvf','dvf','0.00','100000','4426611.35',1),(670,4,'2025-02-02 16:55:55','Issued Pawning Ticket','Ticket ID(296)','-','0.00','40000','60000',1),(671,4,'2025-02-02 17:01:33','Income(income)','-','-','5000','0.00','65000',1),(672,4,'2025-02-02 17:02:33','Expenses(janith)','-','-','0.00','1000','64000',1),(673,4,'2025-02-02 18:09:18','Customer Payment(Ticket No:58)','-','-','5000','0.00','69000',1),(674,4,'2025-02-02 21:24:56','Withdrawal','dvdv','dbdb','0.00','1000','68000',1),(675,1,'2025-02-02 21:24:56','Deposit(1-Cashier)','dvdv','dbdb','1000','0.00','4427611.35',1),(676,4,'2025-02-03 00:04:42','Customer Payment(Ticket No:232)','-','-','5000','0.00','73000',1),(677,4,'2025-02-03 14:45:35','Income(Deposit Payment)','-','-','10000','0.00','83000',1),(678,4,'2025-02-03 14:45:44','Expenses(Water Bill)','-','-','0.00','5000','78000',1),(679,4,'2025-02-03 15:45:28','Deposit','Opening Balance','Opening Balance','100000','0.00','178000',1),(680,1,'2025-02-03 15:45:28','Withdraw(1-Cashier)','Opening Balance','Opening Balance','0.00','100000','4327611.35',1),(681,4,'2025-02-03 15:49:57','Issued Pawning Ticket','Ticket ID(297)','-','0.00','50000','128000',1),(682,4,'2025-02-03 15:50:33','Customer Payment(Ticket No:297)','-','-','5000','0.00','133000',1),(683,4,'2025-02-03 15:52:00','Expenses(Bill Payment)','-','-','0.00','2000','131000',1),(684,4,'2025-02-04 12:12:27','Deposit','Morning Plot','Morning Plot','60000.00','0.00','191000',1),(685,4,'2025-02-04 12:12:53','Deposit','Day End','Day End','0.00','120000','71000',1),(686,4,'2025-02-05 07:23:14','Deposit','Morning Plot','Morning Plot','50500.00','0.00','121500',1),(687,1,'2025-02-05 07:23:14','Withdraw','Morning Plot','Morning Plot','0.00','50500.00','4277111.35',1),(688,4,'2025-02-05 07:23:59','Withdraw','Day End','Day End','0.00','101000','20500',1),(689,1,'2025-02-05 07:23:59','Deposit','Day End','Day End','101000','0.00','4378111.35',1),(690,4,'2025-02-06 10:38:24','Deposit','Morning Plot','Morning Plot','35000.00','0.00','55500',1),(691,1,'2025-02-06 10:38:24','Withdraw','Morning Plot','Morning Plot','0.00','35000.00','4343111.35',1),(692,4,'2025-02-06 10:38:45','Deposit','Update Morning Plot','Update Morning Plot','0.00','10000','45500',1),(693,1,'2025-02-06 10:38:45','Withdraw','Update Morning Plot','Update Morning Plot','10000','0.00','4353111.35',1),(694,4,'2025-02-06 10:40:22','Deposit','Morning Plot','Morning Plot','53000.00','0.00','98500',1),(695,1,'2025-02-06 10:40:22','Withdraw','Morning Plot','Morning Plot','0.00','53000.00','4300111.35',1),(696,4,'2025-02-06 10:40:39','Deposit','Update Morning Plot','Update Morning Plot','0.00','50000','48500',1),(697,1,'2025-02-06 10:40:39','Withdraw','Update Morning Plot','Update Morning Plot','50000','0.00','4350111.35',1);
/*!40000 ALTER TABLE `company_bank_has_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_documents`
--

DROP TABLE IF EXISTS `company_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_documents` (
  `idDocument` int NOT NULL AUTO_INCREMENT,
  `Document_Type` varchar(255) DEFAULT NULL,
  `Company_idCompany` int DEFAULT NULL,
  PRIMARY KEY (`idDocument`),
  KEY `Company_idCompany` (`Company_idCompany`),
  CONSTRAINT `company_documents_ibfk_1` FOREIGN KEY (`Company_idCompany`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_documents`
--

LOCK TABLES `company_documents` WRITE;
/*!40000 ALTER TABLE `company_documents` DISABLE KEYS */;
INSERT INTO `company_documents` VALUES (1,'NIC',1),(2,'Birth Certificate',1),(3,'NIC',3);
/*!40000 ALTER TABLE `company_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `idCustomer` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(45) DEFAULT NULL,
  `First_Name` varchar(255) DEFAULT NULL,
  `Full_name` varchar(255) DEFAULT NULL,
  `NIC` varchar(45) DEFAULT NULL,
  `DOB` varchar(45) DEFAULT NULL,
  `Address1` varchar(45) DEFAULT NULL,
  `Address2` varchar(45) DEFAULT NULL,
  `Address3` varchar(45) DEFAULT NULL,
  `Postal_Address01` varchar(45) DEFAULT NULL,
  `Postal_Address02` varchar(45) DEFAULT NULL,
  `Postal_Address03` varchar(45) DEFAULT NULL,
  `Mobile_No` varchar(45) DEFAULT NULL,
  `Occupation` varchar(45) DEFAULT NULL,
  `Work_Place` varchar(45) DEFAULT NULL,
  `Phone_No` varchar(45) DEFAULT NULL,
  `Phone_No2` varchar(45) DEFAULT NULL,
  `Status` int DEFAULT '1',
  `Behaviour_Status` varchar(45) DEFAULT 'Good',
  `Note` text,
  `emp_id` varchar(45) NOT NULL DEFAULT '0',
  `Branch_idBranch` int DEFAULT NULL,
  `Customer_Number` varchar(255) DEFAULT NULL,
  `Risk_Level` varchar(255) DEFAULT NULL,
  `Blacklist_Reason` varchar(255) DEFAULT NULL,
  `Blacklist_Date` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idCustomer`),
  KEY `fk_customer_branch` (`Branch_idBranch`),
  CONSTRAINT `fk_customer_branch` FOREIGN KEY (`Branch_idBranch`) REFERENCES `branch` (`idBranch`)
) ENGINE=InnoDB AUTO_INCREMENT=191 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (189,'Mr.','Kevin','Kevin De Silva','200106412020','2001-03-05','39 1/1 Queens Way Bldg Duplicaiton Road, 03','','','39 1/1 Queens Way Bldg Duplicaiton Road, 03','','','0752410783','Driver','Moto Port','','',1,'Good','','10',1,NULL,NULL,'ss','2025-11-26 09:11:39.330'),(190,'Mr.','Ben','Ben Marshal','200906412021','2009-03-05','39 1/1 Queens Way Bldg Duplicaiton Road, 04','','','39 1/1 Queens Way Bldg Duplicaiton Road, 04','','','0752410783','Driver','Cab\'s Mart','','',1,'Good','','10',2,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_documents`
--

DROP TABLE IF EXISTS `customer_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_documents` (
  `idCustomer_Documents` int NOT NULL AUTO_INCREMENT,
  `Document_Name` varchar(45) DEFAULT NULL,
  `Path` text,
  `Customer_idCustomer` int NOT NULL,
  PRIMARY KEY (`idCustomer_Documents`),
  KEY `fk_Customer_Documents_Customer1` (`Customer_idCustomer`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_documents`
--

LOCK TABLES `customer_documents` WRITE;
/*!40000 ALTER TABLE `customer_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_has_bank`
--

DROP TABLE IF EXISTS `customer_has_bank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_has_bank` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cus_id` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `bank_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `account_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `account_number` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `branch` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_has_bank`
--

LOCK TABLES `customer_has_bank` WRITE;
/*!40000 ALTER TABLE `customer_has_bank` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_has_bank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_has_customized_fields_customer`
--

DROP TABLE IF EXISTS `customer_has_customized_fields_customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_has_customized_fields_customer` (
  `Customer_idCustomer` int NOT NULL,
  `Customized_Fields_Customer_id` int NOT NULL,
  `Value` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`Customer_idCustomer`,`Customized_Fields_Customer_id`),
  KEY `fk_Customer_has_Customized_Fields_Customer_Customized_Fields_1` (`Customized_Fields_Customer_id`),
  KEY `fk_Customer_has_Customized_Fields_Customer_Customer1` (`Customer_idCustomer`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_has_customized_fields_customer`
--

LOCK TABLES `customer_has_customized_fields_customer` WRITE;
/*!40000 ALTER TABLE `customer_has_customized_fields_customer` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_has_customized_fields_customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_log`
--

DROP TABLE IF EXISTS `customer_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer_log` (
  `idCustomer_Log` int NOT NULL AUTO_INCREMENT,
  `Date_Time` varchar(45) DEFAULT NULL,
  `Type` varchar(45) DEFAULT NULL,
  `Description` text,
  `Customer_idCustomer` int NOT NULL,
  `User_idUser` int DEFAULT NULL,
  PRIMARY KEY (`idCustomer_Log`),
  KEY `fk_Customer_Log_Customer1` (`Customer_idCustomer`),
  KEY `fk_Customer_Log_User1` (`User_idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=665 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_log`
--

LOCK TABLES `customer_log` WRITE;
/*!40000 ALTER TABLE `customer_log` DISABLE KEYS */;
INSERT INTO `customer_log` VALUES (621,'2025-10-24 09:05:08.587','CREATE','Customer created',189,10),(622,'2025-10-24 09:08:27','CREATE TICKET','Created ticket No: 1-0001-093-0189-100',189,10),(623,'2025-10-25 10:17:20','CREATE TICKET','Created ticket No: 1-0001-099-0189-100',189,10),(624,'2025-10-25 10:34:22','CREATE TICKET','Created ticket No: 1-0001-101-0189-101',189,10),(625,'2025-10-26 06:18:34','CREATE TICKET','Created ticket No: 1-0001-102-0189-100',189,10),(626,'2025-10-28 12:46:09','CREATE TICKET','Created ticket No: 1-0001-102-0189-101',189,10),(627,'2025-10-28 12:48:10','CREATE TICKET','Created ticket No: 1-0001-102-0189-102',189,10),(628,'2025-10-30 08:30:38','CREATE TICKET','Created ticket No: 1-0001-102-0189-103',189,10),(629,'2025-10-30 08:32:23','CREATE TICKET','Created ticket No: 1-0001-102-0189-104',189,10),(630,'2025-10-30 08:48:01','CREATE TICKET','Created ticket No: 1-0001-102-0189-100',189,10),(631,'2025-10-30 10:51:11','CREATE TICKET','Created ticket No: 1-0001-102-0189-101',189,10),(632,'2025-11-10 08:45:02','CREATE TICKET','Created ticket No: 1-0001-102-0189-102',189,10),(633,'2025-11-10 10:25:54','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-103',189,33),(634,'2025-11-10 10:27:22.745','CREATE','Customer created',190,10),(635,'2025-11-10 10:29:37','CREATE TICKET','Created ticket No: 1-B02-0001-106-0190-104',190,10),(636,'2025-11-15 06:19:26','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-105',189,10),(637,'2025-11-15 07:57:16','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-100',189,10),(638,'2025-11-15 08:02:07','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-101',189,10),(639,'2025-11-16 06:40:07','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-102',189,33),(640,'2025-11-16 06:44:57','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-103',189,33),(641,'2025-11-16 07:40:12','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-104',189,33),(642,'2025-11-16 07:52:32','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-100',189,33),(643,'2025-11-16 07:54:55','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-100',189,10),(644,'2025-11-17 08:13:43','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-100',189,10),(645,'2025-11-17 08:14:16','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-101',189,10),(646,'2025-11-17 09:36:17','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-100',189,10),(647,'2025-11-17 09:37:29','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-100',189,10),(648,'2025-11-17 09:43:06','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-100',189,10),(649,'2025-11-17 09:47:28','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-101',189,10),(650,'2025-11-17 09:48:11','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-102',189,10),(651,'2025-11-17 09:49:01','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-103',189,10),(652,'2025-11-17 10:23:37','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-104',189,10),(653,'2025-11-17 10:26:25','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-100',189,10),(654,'2025-11-17 10:29:11','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-101',189,10),(655,'2025-11-18 08:57:55','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-100',189,10),(656,'2025-11-20 12:08:52','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-101',189,33),(657,'2025-11-20 15:29:26','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-102',189,10),(658,'2025-11-20 15:32:47','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-103',189,10),(659,'2025-11-20 15:41:33','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-104',189,10),(660,'2025-11-26 08:24:10','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-105',189,10),(661,'2025-11-26 09:09:16','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-106',189,10),(662,'2025-11-26 09:11:39.330','BLACKLIST','Customer blacklisted from Company. By Branch: Galle | Branch Code: 1-B01 | Reason: ss',189,10),(663,'2025-11-26 09:40:11','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-107',189,10),(664,'2025-11-26 09:42:33','CREATE TICKET','Created ticket No: 1-B01-0001-102-0189-108',189,10);
/*!40000 ALTER TABLE `customer_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customized_fields_customer`
--

DROP TABLE IF EXISTS `customized_fields_customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customized_fields_customer` (
  `idCustomized_Fields_Customer` int NOT NULL AUTO_INCREMENT,
  `Company_idCompany` int NOT NULL,
  `No` varchar(45) DEFAULT NULL,
  `Field_Name` varchar(45) DEFAULT NULL,
  `Field_Type` varchar(45) DEFAULT NULL,
  `Field_Values` text,
  `Status` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idCustomized_Fields_Customer`),
  KEY `fk_Customized_Fields_Customer_Company1` (`Company_idCompany`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customized_fields_customer`
--

LOCK TABLES `customized_fields_customer` WRITE;
/*!40000 ALTER TABLE `customized_fields_customer` DISABLE KEYS */;
/*!40000 ALTER TABLE `customized_fields_customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_registry`
--

DROP TABLE IF EXISTS `daily_registry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_registry` (
  `idDaily_Registry` int NOT NULL AUTO_INCREMENT,
  `Date` date DEFAULT (curdate()),
  `Time` time DEFAULT (curtime()),
  `Description` varchar(255) DEFAULT NULL,
  `Total_Amount` varchar(100) DEFAULT NULL,
  `User_idUser` int NOT NULL,
  `Created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `daily_registry_status` int DEFAULT NULL,
  `Cash_Request_Reason` varchar(255) DEFAULT NULL,
  `Approved_Status` int DEFAULT NULL,
  `Approved_UserId` int DEFAULT NULL,
  `Approved_Date_Time` timestamp NULL DEFAULT NULL,
  `Approved_Comment` varchar(500) DEFAULT NULL,
  `From_Account_ID` int DEFAULT NULL,
  `To_Account_ID` int DEFAULT NULL,
  `Branch_idBranch` int DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idDaily_Registry`),
  KEY `fk_user_create_registry` (`User_idUser`),
  KEY `Approved_UserId` (`Approved_UserId`),
  KEY `fk_daily_registry_from_account` (`From_Account_ID`),
  KEY `fk_daily_registry_to_account` (`To_Account_ID`),
  KEY `fk_branch_and_cashier_registry` (`Branch_idBranch`),
  CONSTRAINT `daily_registry_ibfk_1` FOREIGN KEY (`Approved_UserId`) REFERENCES `user` (`idUser`),
  CONSTRAINT `fk_branch_and_cashier_registry` FOREIGN KEY (`Branch_idBranch`) REFERENCES `branch` (`idBranch`),
  CONSTRAINT `fk_daily_registry_from_account` FOREIGN KEY (`From_Account_ID`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`),
  CONSTRAINT `fk_daily_registry_to_account` FOREIGN KEY (`To_Account_ID`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`),
  CONSTRAINT `fk_user_create_registry` FOREIGN KEY (`User_idUser`) REFERENCES `user` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_registry`
--

LOCK TABLES `daily_registry` WRITE;
/*!40000 ALTER TABLE `daily_registry` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_registry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `daily_registry_has_cash`
--

DROP TABLE IF EXISTS `daily_registry_has_cash`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `daily_registry_has_cash` (
  `idDaily_registry_has_cash` int NOT NULL AUTO_INCREMENT,
  `Daily_registry_idDaily_Registry` int NOT NULL,
  `Denomination` varchar(45) NOT NULL,
  `Quantity` varchar(45) NOT NULL,
  `Amount` varchar(100) NOT NULL,
  PRIMARY KEY (`idDaily_registry_has_cash`),
  KEY `fk_daily_registry` (`Daily_registry_idDaily_Registry`),
  CONSTRAINT `fk_daily_registry` FOREIGN KEY (`Daily_registry_idDaily_Registry`) REFERENCES `daily_registry` (`idDaily_Registry`)
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `daily_registry_has_cash`
--

LOCK TABLES `daily_registry_has_cash` WRITE;
/*!40000 ALTER TABLE `daily_registry_has_cash` DISABLE KEYS */;
/*!40000 ALTER TABLE `daily_registry_has_cash` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dashboard_cards`
--

DROP TABLE IF EXISTS `dashboard_cards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dashboard_cards` (
  `card_id` int NOT NULL AUTO_INCREMENT,
  `card_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `card_category` enum('table','summary','chart') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=MyISAM AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dashboard_cards`
--

LOCK TABLES `dashboard_cards` WRITE;
/*!40000 ALTER TABLE `dashboard_cards` DISABLE KEYS */;
INSERT INTO `dashboard_cards` VALUES (1,'Articles Expiring ','table'),(2,'Overdue Articles','table'),(3,' Full Transaction Log','table'),(4,'High-Value Transactions for Review','table'),(5,'Incomplete Customer Profiles','table'),(6,'Full Active Article List','table'),(7,'Vault Inventory Ledger','table'),(8,'Items Marked for Auction','table'),(9,'Customer List (CRM)','table'),(10,'Last Month\'s Settled Articles','table'),(11,'New Loans ','summary'),(12,'Redemptions ','summary'),(13,'Interest & Fees Collected ','summary'),(14,'Net Cash Flow ','summary'),(15,'New Pledges ','summary'),(16,'Week-to-Date (WTD) New Loans','summary'),(17,'Month-to-Date (MTD) Interest Income','summary'),(18,'Pledges Renewed this Month','summary'),(19,'Total Active Loan Capital','summary'),(20,' Total Articles in Vault','summary'),(21,'Loan vs. Redemption Trend','chart'),(22,'Monthly Income Trend','chart'),(23,'Cumulative Capital Growth','chart'),(24,'Revenue Sources Breakdown','chart'),(25,'Busiest Hours of the Day','chart'),(26,'New vs. Repeat Customers','chart'),(27,'Average Article Duration','chart'),(28,'Customer Acquisition Trend','chart'),(29,'Loan Value Distribution','chart'),(30,'Gold Karat Distribution','chart'),(31,'Total Gold Weight Held','summary'),(32,'Average Loan-to-Value (LTV) Ratio','summary'),(33,'Articles Expiring in 7 Days','summary'),(34,'Overdue Articles','summary'),(39,'New Customers ','summary'),(40,'Last Month\'s Renewals','table'),(41,'Auction History & Profitability','table'),(42,'User Activity Log','table'),(43,'Daily Cash Reconciliation','table'),(44,'Top Customers by Loan Volume','table'),(45,'Articles by Status','chart'),(46,'Loan-to-Value (LTV) Ratio Distribution','chart'),(47,'This Month vs. Last Month Performance','chart'),(48,'Weekly Performance Snapshot','chart'),(49,'Upcoming Expiry Volume','chart'),(50,'Global Gold Market Daily Chart','chart');
/*!40000 ALTER TABLE `dashboard_cards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `day_end_registry_account_data_after_approval`
--

DROP TABLE IF EXISTS `day_end_registry_account_data_after_approval`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `day_end_registry_account_data_after_approval` (
  `id_day_end_registry_account_data_after_approval` int NOT NULL AUTO_INCREMENT,
  `Day_end_registry_details_idDay_end_registry_details` int NOT NULL,
  `Account_IdAccount` int NOT NULL,
  `Balance_After_Approval` varchar(45) DEFAULT NULL,
  `ExessOrShortage` varchar(45) DEFAULT NULL,
  `Cash_From_Or_To_Account` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_day_end_registry_account_data_after_approval`),
  KEY `Day_end_registry_details_idDay_end_registry_details` (`Day_end_registry_details_idDay_end_registry_details`),
  KEY `Account_IdAccount` (`Account_IdAccount`),
  CONSTRAINT `day_end_registry_account_data_after_approval_ibfk_1` FOREIGN KEY (`Day_end_registry_details_idDay_end_registry_details`) REFERENCES `day_end_registry_details` (`idDayEndDetails`),
  CONSTRAINT `day_end_registry_account_data_after_approval_ibfk_2` FOREIGN KEY (`Account_IdAccount`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `day_end_registry_account_data_after_approval`
--

LOCK TABLES `day_end_registry_account_data_after_approval` WRITE;
/*!40000 ALTER TABLE `day_end_registry_account_data_after_approval` DISABLE KEYS */;
/*!40000 ALTER TABLE `day_end_registry_account_data_after_approval` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `day_end_registry_details`
--

DROP TABLE IF EXISTS `day_end_registry_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `day_end_registry_details` (
  `idDayEndDetails` int NOT NULL AUTO_INCREMENT,
  `Day_Start_Registry_Amount` varchar(45) DEFAULT NULL,
  `Ticket_Issued_Amount` varchar(45) DEFAULT NULL,
  `Payment_Received_Amount` varchar(45) DEFAULT NULL,
  `Daily_Expenses_Amount` varchar(45) DEFAULT NULL,
  `In_Account_Transfer_Amount` varchar(45) DEFAULT NULL,
  `Out_Account_Transfer_Amount` varchar(45) DEFAULT NULL,
  `Required_Amount` varchar(45) DEFAULT NULL,
  `Counted` varchar(45) DEFAULT NULL,
  `Daily_Registry_idDaily_Registry` int NOT NULL,
  `Difference` varchar(45) DEFAULT NULL,
  `DifferenceStatus` varchar(45) DEFAULT NULL,
  `Day_Cash_In_Amount` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idDayEndDetails`),
  KEY `fk_daily_registry_details` (`Daily_Registry_idDaily_Registry`),
  CONSTRAINT `fk_daily_registry_details` FOREIGN KEY (`Daily_Registry_idDaily_Registry`) REFERENCES `daily_registry` (`idDaily_Registry`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `day_end_registry_details`
--

LOCK TABLES `day_end_registry_details` WRITE;
/*!40000 ALTER TABLE `day_end_registry_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `day_end_registry_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `day_end_registry_transfer_accounts`
--

DROP TABLE IF EXISTS `day_end_registry_transfer_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `day_end_registry_transfer_accounts` (
  `idDaily_Registry_Daily_Registry` int NOT NULL,
  `idAccounting_Accounts_Accounting_Accounts` int NOT NULL,
  `Amount` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idDaily_Registry_Daily_Registry`,`idAccounting_Accounts_Accounting_Accounts`),
  KEY `fk_accounting_accounts_cashier_end_transfer_accounts` (`idAccounting_Accounts_Accounting_Accounts`),
  CONSTRAINT `fk_accounting_accounts_cashier_end_transfer_accounts` FOREIGN KEY (`idAccounting_Accounts_Accounting_Accounts`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`),
  CONSTRAINT `fk_daily_registry_end` FOREIGN KEY (`idDaily_Registry_Daily_Registry`) REFERENCES `daily_registry` (`idDaily_Registry`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `day_end_registry_transfer_accounts`
--

LOCK TABLES `day_end_registry_transfer_accounts` WRITE;
/*!40000 ALTER TABLE `day_end_registry_transfer_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `day_end_registry_transfer_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `day_end_summary`
--

DROP TABLE IF EXISTS `day_end_summary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `day_end_summary` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `starting_cash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `total_income` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `total_expense` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `balance_amount` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `cash_drawer_total` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `balance_difference` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `day_end_summary`
--

LOCK TABLES `day_end_summary` WRITE;
/*!40000 ALTER TABLE `day_end_summary` DISABLE KEYS */;
INSERT INTO `day_end_summary` VALUES (1,'2025-02-03','73500','120000','57000','136500','136500','0','2025-02-03 10:30:25.000000'),(2,'2025-02-04','60000','60000','0','120000','120000','0','2025-02-04 06:42:53.000000'),(3,'2025-02-05','50500','50500','0','101000','101000','0','2025-02-05 01:53:59.000000');
/*!40000 ALTER TABLE `day_end_summary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `idDepartment` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idDepartment`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designation`
--

DROP TABLE IF EXISTS `designation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designation` (
  `idDesignation` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `Company_idCompany` int NOT NULL,
  `pawning_ticket_max_approve_amount` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idDesignation`),
  KEY `fk_Designation_Company1` (`Company_idCompany`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designation`
--

LOCK TABLES `designation` WRITE;
/*!40000 ALTER TABLE `designation` DISABLE KEYS */;
INSERT INTO `designation` VALUES (1,'Administrator',1,NULL),(4,'Head of Gold Loan',3,NULL),(15,'Branch Manager',3,NULL),(16,'Chief Administration Officer',3,NULL),(17,'Chief Business Development Officer',3,NULL),(18,'Chief Operations Officer',3,NULL),(19,'Executive - Pawning',3,NULL),(20,'Cashier',1,'10000');
/*!40000 ALTER TABLE `designation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designation_has_user_privilages`
--

DROP TABLE IF EXISTS `designation_has_user_privilages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designation_has_user_privilages` (
  `Designation_idDesignation` int NOT NULL,
  `User_Privilages_idUser_Privilages` int NOT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Last_Updated_User` varchar(45) DEFAULT NULL,
  `Last_Updated_Time` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`Designation_idDesignation`,`User_Privilages_idUser_Privilages`),
  KEY `fk_Designation_has_User_Privilages_User_Privilages1` (`User_Privilages_idUser_Privilages`),
  KEY `fk_Designation_has_User_Privilages_Designation1` (`Designation_idDesignation`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designation_has_user_privilages`
--

LOCK TABLES `designation_has_user_privilages` WRITE;
/*!40000 ALTER TABLE `designation_has_user_privilages` DISABLE KEYS */;
INSERT INTO `designation_has_user_privilages` VALUES (1,1,'1','10','2025-10-23 07:03:47'),(1,9,'0','10','2025-10-23 06:49:16'),(1,10,'0','10','2025-10-23 06:49:16'),(1,11,'0','10','2025-10-23 06:49:16'),(1,12,'0','10','2025-10-23 07:03:47'),(1,39,'1','10','2025-11-20 16:02:30'),(1,42,'1','10',NULL),(4,1,'1','28','2025-10-23 13:37:28'),(16,1,'1','28','2025-10-23 14:44:47'),(20,12,'1','10','2025-10-23 14:37:38'),(20,14,'1','10','2025-10-26 06:28:29'),(20,17,'1','10','2025-10-23 14:37:38'),(20,26,'1','10','2025-10-23 07:19:59'),(20,27,'1','10','2025-10-23 07:19:59'),(20,28,'1','10','2025-10-23 07:19:59'),(20,29,'1','10','2025-10-28 12:47:38'),(20,31,'1','10','2025-10-28 12:47:38'),(20,41,'1','10',NULL);
/*!40000 ALTER TABLE `designation_has_user_privilages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designations`
--

DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designations` (
  `idDesgnation` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `Max_Aprove_Amount` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idDesgnation`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_types`
--

DROP TABLE IF EXISTS `document_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_types` (
  `idDocument` int NOT NULL AUTO_INCREMENT,
  `typeName` varchar(256) NOT NULL,
  `Company_idCompany` int DEFAULT NULL,
  PRIMARY KEY (`idDocument`),
  KEY `Company_idCompany` (`Company_idCompany`),
  CONSTRAINT `document_types_ibfk_1` FOREIGN KEY (`Company_idCompany`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_types`
--

LOCK TABLES `document_types` WRITE;
/*!40000 ALTER TABLE `document_types` DISABLE KEYS */;
INSERT INTO `document_types` VALUES (1,'NIC',1);
/*!40000 ALTER TABLE `document_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `early_settlement_charges`
--

DROP TABLE IF EXISTS `early_settlement_charges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `early_settlement_charges` (
  `idEarly_Settlement_Charges` int NOT NULL AUTO_INCREMENT,
  `From_Amount` varchar(45) DEFAULT NULL,
  `To_Amount` varchar(45) DEFAULT NULL,
  `Value_Type` varchar(45) DEFAULT NULL,
  `Amount` varchar(45) DEFAULT NULL,
  `Pawning_Product_idPawning_Product` int NOT NULL,
  PRIMARY KEY (`idEarly_Settlement_Charges`),
  KEY `fk_Early_Settlement_Charges_Pawning_Product1` (`Pawning_Product_idPawning_Product`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `early_settlement_charges`
--

LOCK TABLES `early_settlement_charges` WRITE;
/*!40000 ALTER TABLE `early_settlement_charges` DISABLE KEYS */;
/*!40000 ALTER TABLE `early_settlement_charges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employees` (
  `idEmployees` int NOT NULL AUTO_INCREMENT,
  `EPF_No` varchar(45) DEFAULT NULL,
  `First_Name` varchar(255) DEFAULT NULL,
  `Full_name` varchar(255) DEFAULT NULL,
  `Email` varchar(45) DEFAULT NULL,
  `Contact_No` varchar(45) DEFAULT NULL,
  `Photo` varchar(45) DEFAULT NULL,
  `Contact_No2` varchar(45) DEFAULT NULL,
  `Address1` varchar(45) DEFAULT NULL,
  `Address2` varchar(45) DEFAULT NULL,
  `Address3` varchar(45) DEFAULT NULL,
  `City` varchar(45) DEFAULT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Department_idDepartment` int NOT NULL,
  `Designation_idDesignation` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idEmployees`),
  KEY `fk_Employees_Department1` (`Department_idDepartment`),
  KEY `fk_Employees_Desgnation1` (`Designation_idDesignation`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expences`
--

DROP TABLE IF EXISTS `expences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `date` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `bank_id` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=128 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expences`
--

LOCK TABLES `expences` WRITE;
/*!40000 ALTER TABLE `expences` DISABLE KEYS */;
INSERT INTO `expences` VALUES (1,'Income','Testing','2024-08-15','5500','1'),(2,'Income','PAWNING','2024-08-16','1000000','1'),(3,'Expense','PAWNING-Ticket No-001','2024-08-13','10000','1'),(4,'Expense','PAWNING-Ticket No-004','2024-08-14','107000','1'),(5,'Expense','PAWNING-Ticket No-005','2024-08-15','177000','1'),(6,'Expense','PAWNING-Ticket No-006','2024-08-15','257000','1'),(7,'Expense','PAWNING-Ticket No-007','2024-08-15','122000','1'),(8,'Expense','PAWNING-Ticket No-008','2024-08-15','75000','1'),(9,'Expense','PAWNING-Ticket No-009','2024-08-15','453000','1'),(10,'Expense','PAWNING-Ticket No-010','2024-08-16','336000','1'),(11,'Expense','PAWNING-Ticket No-011','2024-08-16','350000','1'),(12,'Expense','PAWNING-Ticket No-012','2024-08-16','520000','1'),(13,'Expense','PAWNING-Ticket No-013','2024-08-16','79500','1'),(14,'Expense','PAWNING-Ticket No-014','2024-08-16','563000','1'),(15,'Income','Redeemed Charge-Ticket No-005','2024-08-15','1000','1'),(16,'Income','Redeemed Charge-Ticket No-009','2024-08-15','1000','1'),(17,'Income','Redeemed Charge-Ticket No-010','2024-08-16','1000','1'),(18,'Income','Redeemed Charge-Ticket No-011','2024-08-16','1000','1'),(19,'Income','Redeemed Charge-Ticket No-012','2024-08-16','1000','1'),(20,'Income','Redeemed Charge-Ticket No-013','2024-08-16','1000','1'),(21,'Income','Redeemed Charge-Ticket No-014','2024-08-16','1000','1'),(22,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000016','2024-08-20','1000','1'),(23,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000017','2024-08-20','1000','1'),(24,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000019 , CG/AM/PW/000020 & CG/AM/PW/000021','2024-08-21','1000','1'),(25,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000022','2024-08-21','1000','1'),(26,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000023','2024-08-21','1000','1'),(27,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000025','2024-08-22','1000','1'),(28,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000027','2024-08-23','1000','1'),(29,'Expense','Gold Purchased','2024-08-23','144000','1'),(30,'Income','Gold Purchased Traveling Charge','2024-08-23','1000','1'),(31,'Expense','Adjustment- Repeat Customer Payment(Ticket No:26)','2024-08-27','151675.00','1'),(32,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000029','2024-08-28','1000','1'),(33,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000030','2024-08-28','1000','1'),(34,'Income','Redeemed Charge-Ticket No - CG/AM/PW/000032 , CG/AM/PW/000033 & CG/AM/PW/000034','2024-08-28','1000','1'),(35,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000039','2024-08-29','1000','1'),(36,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000041 & Ticket No-CG/AM/PW/000042','2024-08-30','1000','1'),(37,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000043','2024-08-30','1000','1'),(38,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000046 , Ticket No-CG/AM/PW/000047 & Ticket No-CG/AM/PW/000048','2024-09-02','1000','1'),(39,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000049 , Ticket No-CG/AM/PW/000050 , Ticket No-CG/AM/PW/000051','2024-09-02','1000','1'),(40,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000056 & Ticket No-CG/AM/PW/000057','2024-09-02','1000','1'),(41,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000053 , Ticket No-CG/AM/PW/000054 & Ticket No-CG/AM/PW/000055','2024-09-02','1000','1'),(42,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000058','2024-09-02','1000','1'),(43,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000063 & Ticket No-CG/AM/PW/000064','2024-09-04','1000','1'),(44,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000066','2024-09-06','1000','1'),(46,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000070','2024-09-06','1000','1'),(48,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000073','2024-09-06','1000','1'),(49,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000074','2024-09-06','1000','1'),(50,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000075','2024-09-07','1000','1'),(51,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000077 & Ticket No-CG/AM/PW/000078','2024-09-09','500','1'),(52,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000076','2024-09-09','500','1'),(53,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000079 & Ticket No-CG/AM/PW/000080','2024-09-09','1000','1'),(54,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000081','2024-09-09','1000','1'),(55,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000087 , Ticket No-CG/AM/PW/000088 & Ticket No-CG/AM/PW/000089','2024-09-11','1000','1'),(56,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000090','2024-09-12','1000','1'),(57,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000091','2024-09-12','1000','1'),(58,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000092','2024-09-12','1000','1'),(59,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000094','2024-09-13','1000','1'),(60,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000095 & Ticket No-CG/AM/PW/000096','2024-09-13','1000','1'),(61,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000104','2024-09-18','1000','1'),(62,'Expense','Purchase for Janitor Items','2024-09-18','1425','2'),(63,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000107','2024-09-19','1000','1'),(64,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000108','2024-09-19','1000','1'),(65,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000109','2024-09-19','1000','1'),(66,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000111','2024-09-20','1000','1'),(67,'Expense','To Buy the PAD Lock','2024-09-26','1120','2'),(68,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000120','2024-09-26','1000','1'),(69,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000122','2024-09-27','1000','1'),(70,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000128','2024-09-30','1000','1'),(71,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000129 , Ticket No-CG/AM/PW/000130 ,  Ticket No-CG/AM/PW/000131 & Ticket No-CG/AM/PW/000132','2024-10-01','1000','1'),(72,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000136','2024-10-03','1000','1'),(73,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000137','2024-10-03','1000','1'),(74,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000141','2024-10-04','1000','1'),(75,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000142','2024-10-07','1000','1'),(76,'Expense','Payment for the Photo Frame of Ceylon Gold Pawning License','2024-10-09','1000','2'),(77,'Expense','To Buy the Air Fresh','2024-10-09','760','2'),(78,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000156 , Ticket No-CG/AM/PW/000157 , Ticket No-CG/AM/PW/000158 , Ticket No-CG/AM/PW/000159 &Ticket No-CG/AM/PW/000160','2024-10-16','1000','1'),(79,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000177','2024-10-28','1000','1'),(80,'Expense','To Buy the permanent Marker','2024-10-28','220','2'),(81,'Expense','Payment for the Legal Photo Copy ( Ledger Sheet )','2024-10-31','70','2'),(82,'Expense','Payment for the Canon Printer Toner','2024-10-31','5500','2'),(83,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000184','2024-11-04','1000','1'),(84,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000187','2024-11-06','1000','1'),(85,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000192','2024-11-08','1000','1'),(86,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000196','2024-11-08','1000','1'),(87,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000197','2024-11-08','1000','1'),(88,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000201','2024-11-11','1000','1'),(89,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000202','2024-11-11','1000','1'),(90,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000203','2024-11-12','1000','1'),(91,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000204 , Ticket No-CG/AM/PW/000205 & Ticket No-CG/AM/PW/000206','2024-11-12','1000','1'),(92,'Expense','Batticaloa Travelling Expenses for the Gold Selling','2024-09-14','3800','2'),(93,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000208 & Ticket No-CG/AM/PW/000209','2024-11-16','1000','1'),(94,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000215','2024-11-21','500','1'),(95,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000216 & Ticket No-CG/AM/PW/000217','2024-11-21','1000','1'),(96,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000223','2024-11-29','1000','1'),(97,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000232 & Ticket No-CG/AM/PW/000233','2024-12-13','1000','1'),(98,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000240','2024-12-17','1000','1'),(99,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000245 , Ticket No-CG/AM/PW/000246 & Ticket No-CG/AM/PW/000247','2024-12-23','1000','1'),(100,'Expense','To Buy The Air Fresh & Bio Clean','2024-12-24','1450','2'),(101,'Expense','Payment For The Rubber Seals','2024-12-24','2750','2'),(102,'Expense','Letter Charges Of The Reminder Letter Of Pawning','2024-12-26','700','2'),(103,'Expense','New Year Decoration ( Glitter Board )','2024-12-27','172','2'),(104,'Expense','Vote Ledger Print Out','2025-01-02','120','2'),(105,'Expense','Poster Charges For The 2nd Reminder Letters Of Pawning','2025-01-02','450','2'),(106,'Expense','Poster Charges For The 1st Reminder Letter Of Pawning','2025-01-03','50','2'),(107,'Income','Redeemed Charge-Ticket No-CG/AM/PW/000270 & Ticket No-CG/AM/PW/000271','2025-01-06','500','1'),(108,'Income','Ticket No-CG/AM/PW/000272','2025-01-07','500','1'),(109,'Income','Ticket No-CG/AM/PW/000274 & Ticket No-CG/AM/PW/000275','2025-01-08','1000','1'),(110,'Income','Ticket No-CG/AM/PW/000276','2025-01-08','500','1'),(111,'Expense','Ceylon Gold Calendars','2025-01-08','3900','2'),(112,'Expense','New Year Experiences','2025-01-09','1070','2'),(113,'Income','Ticket No-CG/AM/PW/000278','2025-01-10','500','1'),(114,'Income','Ticket No-CG/AM/PW/000283','2025-01-15','500','1'),(115,'Income','Ticket No-CG/AM/PW/000289','2025-01-17','500','1'),(116,'Income','Ticket No-CG/AM/PW/000290 & Ticket No-CG/AM/PW/000291','2025-01-17','1000','1'),(117,'Expense','Poster Charges For The 3rd Reminder Letters Of Pawning','2025-01-17','990','2'),(118,'Expense','Office Number Reload (074-3942593)','2025-01-20','50','2'),(119,'Expense','Office Number Reload (074-3942599)','2025-01-20','50','2'),(120,'Expense','Office Number Reload (074-3942597)','2025-01-20','50','2'),(121,'Income','Ticket No-CG/AM/PW/000292','2025-01-20','500','1'),(122,'Income','Ticket No-CG/AM/PW/000294','2025-01-20','500','1'),(123,'Income','income','2025-02-02','5000','4'),(124,'Expense','janith','2025-02-02','1000','4'),(125,'Income','Deposit Payment','2025-02-03','10000','4'),(126,'Expense','Water Bill','2025-02-03','5000','4'),(127,'Expense','Bill Payment','2025-02-03','2000','4');
/*!40000 ALTER TABLE `expences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fundstransferapproval`
--

DROP TABLE IF EXISTS `fundstransferapproval`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fundstransferapproval` (
  `idFundsTransferApproval` int NOT NULL AUTO_INCREMENT,
  `FromBranchId` int NOT NULL,
  `ToBranchId` int NOT NULL,
  `Branch_Level_Approval_Status` int DEFAULT '0',
  `Head_Office_Level_Approval_Status` int DEFAULT '0',
  `Branch_Approved_User` int DEFAULT NULL,
  `Head_Office_Approved_User` int DEFAULT NULL,
  `Created_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Updated_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `Comment` varchar(255) DEFAULT NULL,
  `Amount` decimal(15,2) DEFAULT NULL,
  `ProvidedTransferReason` varchar(255) DEFAULT NULL,
  `FromAccountId` int NOT NULL,
  `ToAccountId` int NOT NULL,
  PRIMARY KEY (`idFundsTransferApproval`),
  KEY `FK_FromBranch` (`FromBranchId`),
  KEY `FK_ToBranch` (`ToBranchId`),
  KEY `FK_BranchApprovedUser` (`Branch_Approved_User`),
  KEY `FK_HeadOfficeApprovedUser` (`Head_Office_Approved_User`),
  KEY `FK_FromAcc` (`FromAccountId`),
  KEY `FK_ToAcc` (`ToAccountId`),
  CONSTRAINT `FK_BranchApprovedUser` FOREIGN KEY (`Branch_Approved_User`) REFERENCES `user` (`idUser`) ON DELETE SET NULL,
  CONSTRAINT `FK_FromAcc` FOREIGN KEY (`FromAccountId`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`) ON DELETE RESTRICT,
  CONSTRAINT `FK_FromBranch` FOREIGN KEY (`FromBranchId`) REFERENCES `branch` (`idBranch`) ON DELETE RESTRICT,
  CONSTRAINT `FK_HeadOfficeApprovedUser` FOREIGN KEY (`Head_Office_Approved_User`) REFERENCES `user` (`idUser`) ON DELETE SET NULL,
  CONSTRAINT `FK_ToAcc` FOREIGN KEY (`ToAccountId`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`) ON DELETE RESTRICT,
  CONSTRAINT `FK_ToBranch` FOREIGN KEY (`ToBranchId`) REFERENCES `branch` (`idBranch`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fundstransferapproval`
--

LOCK TABLES `fundstransferapproval` WRITE;
/*!40000 ALTER TABLE `fundstransferapproval` DISABLE KEYS */;
INSERT INTO `fundstransferapproval` VALUES (9,1,18,1,1,10,10,'2025-11-28 13:51:40','2025-11-28 13:55:00','done',1000.00,'to head office',37,103),(10,1,18,1,1,10,10,'2025-11-28 13:56:28','2025-11-28 13:57:14','',10000.00,NULL,37,103),(11,18,1,1,1,10,10,'2025-11-28 13:58:01','2025-11-28 13:58:26','',10000.00,NULL,103,37),(12,18,1,1,1,10,10,'2025-11-28 14:52:46','2025-12-01 03:44:45','',5000.00,'to galle',103,37);
/*!40000 ALTER TABLE `fundstransferapproval` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `letter_history`
--

DROP TABLE IF EXISTS `letter_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `letter_history` (
  `idLetter_History` int NOT NULL,
  `Letter_Templates_idLetter_Templates` int NOT NULL,
  `Date_Time` varchar(45) DEFAULT NULL,
  `Letter` text,
  `Printed_Count` varchar(45) DEFAULT NULL,
  `Branch_idBranch` int NOT NULL,
  `Pawning_Ticket_idPawning_Ticket` int NOT NULL,
  `User_idUser` int NOT NULL,
  PRIMARY KEY (`idLetter_History`),
  KEY `fk_Letter_History_Letter_Templates1` (`Letter_Templates_idLetter_Templates`),
  KEY `fk_Letter_History_Branch1` (`Branch_idBranch`),
  KEY `fk_Letter_History_Pawning_Ticket1` (`Pawning_Ticket_idPawning_Ticket`),
  KEY `fk_Letter_History_User1` (`User_idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `letter_history`
--

LOCK TABLES `letter_history` WRITE;
/*!40000 ALTER TABLE `letter_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `letter_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `letter_templates`
--

DROP TABLE IF EXISTS `letter_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `letter_templates` (
  `idLetter_Templates` int NOT NULL,
  `Type` varchar(45) DEFAULT NULL,
  `Template` text,
  `Status` varchar(45) DEFAULT NULL,
  `Sending_Cost` varchar(45) DEFAULT NULL,
  `Company_idCompany` int NOT NULL,
  PRIMARY KEY (`idLetter_Templates`),
  KEY `fk_Letter_Templates_Company1` (`Company_idCompany`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `letter_templates`
--

LOCK TABLES `letter_templates` WRITE;
/*!40000 ALTER TABLE `letter_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `letter_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `machine_caratage`
--

DROP TABLE IF EXISTS `machine_caratage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `machine_caratage` (
  `idMachine_Caratage` int NOT NULL AUTO_INCREMENT,
  `amount` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idMachine_Caratage`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `machine_caratage`
--

LOCK TABLES `machine_caratage` WRITE;
/*!40000 ALTER TABLE `machine_caratage` DISABLE KEYS */;
/*!40000 ALTER TABLE `machine_caratage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manual_journal`
--

DROP TABLE IF EXISTS `manual_journal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manual_journal` (
  `idManual_Journal` int NOT NULL AUTO_INCREMENT,
  `Narration` varchar(45) DEFAULT NULL,
  `Date` varchar(45) DEFAULT NULL,
  `Description` varchar(255) DEFAULT NULL,
  `Amount` varchar(45) DEFAULT NULL,
  `Branch_idBranch` int NOT NULL,
  `User_idUser` int NOT NULL,
  `idAccounting_Accounts` int NOT NULL,
  `Branch_Level_Approval_Status` int DEFAULT '0',
  `Head_Branch_Level_Approval_Status` int DEFAULT '0',
  `Branch_Approved_User` int DEFAULT NULL,
  `Head_Branch_Approved_User` int DEFAULT NULL,
  `Created_At` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Branch_Approved_Time` timestamp NULL DEFAULT NULL,
  `Head_Branch_Approved_Time` timestamp NULL DEFAULT NULL,
  `Request_Status` int DEFAULT '0',
  `Company_IdCompany` int NOT NULL,
  `Created_UserId` int NOT NULL,
  `Transaction_Type` enum('debit','credit') NOT NULL,
  PRIMARY KEY (`idManual_Journal`),
  KEY `fk_Manual_Journal_Branch1` (`Branch_idBranch`),
  KEY `fk_Manual_Journal_User1` (`User_idUser`),
  KEY `fk_manual_journal_accounting_accounts` (`idAccounting_Accounts`),
  KEY `fk_manual_journal_branch_approved_user` (`Branch_Approved_User`),
  KEY `fk_manual_journal_head_branch_approved_user` (`Head_Branch_Approved_User`),
  KEY `fk_manual_journal_created_user` (`Created_UserId`),
  KEY `fk_manual_journal_companyId` (`Company_IdCompany`),
  CONSTRAINT `fk_manual_journal_accounting_accounts` FOREIGN KEY (`idAccounting_Accounts`) REFERENCES `accounting_accounts` (`idAccounting_Accounts`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_manual_journal_branch_approved_user` FOREIGN KEY (`Branch_Approved_User`) REFERENCES `user` (`idUser`),
  CONSTRAINT `fk_manual_journal_companyId` FOREIGN KEY (`Company_IdCompany`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE,
  CONSTRAINT `fk_manual_journal_created_user` FOREIGN KEY (`Created_UserId`) REFERENCES `user` (`idUser`),
  CONSTRAINT `fk_manual_journal_head_branch_approved_user` FOREIGN KEY (`Head_Branch_Approved_User`) REFERENCES `user` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manual_journal`
--

LOCK TABLES `manual_journal` WRITE;
/*!40000 ALTER TABLE `manual_journal` DISABLE KEYS */;
INSERT INTO `manual_journal` VALUES (120,'test 01','2025-12-10','from acc 1','1000',1,10,35,1,1,10,10,'2025-12-10 05:54:26','2025-12-10 05:54:31','2025-12-10 05:54:40',1,1,10,'credit'),(121,'test 01','2025-12-10','to acc 1','1000',1,10,107,1,1,10,10,'2025-12-10 05:54:26','2025-12-10 05:54:31','2025-12-10 05:54:40',1,1,10,'debit'),(122,'test 02 (head to galle)','2025-12-10','from acc 1','1000',1,10,110,1,1,NULL,10,'2025-12-10 05:56:41',NULL,'2025-12-10 05:56:56',1,1,10,'credit'),(123,'test 02 (head to galle)','2025-12-10','to acc 1','1000',1,10,108,1,1,NULL,10,'2025-12-10 05:56:41',NULL,'2025-12-10 05:56:56',1,1,10,'debit'),(124,'test 03 (head to head)','2025-12-10','from acc 1','1000',18,10,104,1,1,NULL,10,'2025-12-10 05:57:47',NULL,'2025-12-10 05:58:02',1,1,10,'credit'),(125,'test 03 (head to head)','2025-12-10','to acc 1','1000',18,10,103,1,1,NULL,10,'2025-12-10 05:57:47',NULL,'2025-12-10 05:58:02',1,1,10,'debit'),(128,'test 04','2025-12-10','from acc 1','1000',1,10,35,1,1,10,10,'2025-12-10 06:34:15','2025-12-10 06:34:21','2025-12-10 06:45:33',1,1,10,'credit'),(129,'test 04','2025-12-10','to acc 1','1000',1,10,108,1,1,10,10,'2025-12-10 06:34:15','2025-12-10 06:34:21','2025-12-10 06:45:33',1,1,10,'debit');
/*!40000 ALTER TABLE `manual_journal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manual_journal_logs`
--

DROP TABLE IF EXISTS `manual_journal_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manual_journal_logs` (
  `idManual_Journal_Logs` int NOT NULL AUTO_INCREMENT,
  `Manual_Journal_idManual_Journal` int NOT NULL,
  `Accounting_Accounts_idAccounting_Accounts` int NOT NULL,
  `Account_Name` varchar(45) DEFAULT NULL,
  `Debit_Amount` varchar(45) DEFAULT NULL,
  `Credit_Amount` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idManual_Journal_Logs`),
  KEY `fk_Manual_Journal_Logs_Manual_Journal1` (`Manual_Journal_idManual_Journal`),
  KEY `fk_Manual_Journal_Logs_Accounting_Accounts1` (`Accounting_Accounts_idAccounting_Accounts`)
) ENGINE=InnoDB AUTO_INCREMENT=135 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manual_journal_logs`
--

LOCK TABLES `manual_journal_logs` WRITE;
/*!40000 ALTER TABLE `manual_journal_logs` DISABLE KEYS */;
INSERT INTO `manual_journal_logs` VALUES (127,120,35,'Cash acc ','0','1000'),(128,121,107,'test bank','1000','0'),(129,122,110,'adsd','0','1000'),(130,123,108,'D','1000','0'),(131,124,104,'Cash Head Office Two','0','1000'),(132,125,103,'Cash Head Office One','1000','0'),(133,128,35,'Cash acc ','0','1000'),(134,129,108,'D','1000','0');
/*!40000 ALTER TABLE `manual_journal_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `idNotifications` int NOT NULL AUTO_INCREMENT,
  `Date_Time` varchar(45) DEFAULT NULL,
  `Type` varchar(45) DEFAULT NULL,
  `From` varchar(45) DEFAULT NULL,
  `User_idUser` int NOT NULL,
  `Description` varchar(45) DEFAULT NULL,
  `Read_Status` varchar(45) DEFAULT NULL,
  `Read_Date_Time` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idNotifications`),
  KEY `fk_Notifications_User1` (`User_idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `other_charges`
--

DROP TABLE IF EXISTS `other_charges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `other_charges` (
  `idOther_Charges` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `Amount_Type` varchar(45) DEFAULT NULL,
  `Amount` varchar(45) DEFAULT NULL,
  `Products_idProducts` int NOT NULL,
  PRIMARY KEY (`idOther_Charges`),
  KEY `fk_Other_Charges_Products1` (`Products_idProducts`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `other_charges`
--

LOCK TABLES `other_charges` WRITE;
/*!40000 ALTER TABLE `other_charges` DISABLE KEYS */;
/*!40000 ALTER TABLE `other_charges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_log`
--

DROP TABLE IF EXISTS `pawning_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `time` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `cus_id` int NOT NULL,
  `pawning_ticket_id` int NOT NULL,
  `ticket_no` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `service_charge_balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `advance_balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `interest_balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `panelty_balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `other_chargers_balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `tot_pending_amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `user` int NOT NULL,
  `log_date` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `early_charge` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23019 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_log`
--

LOCK TABLES `pawning_log` WRITE;
/*!40000 ALTER TABLE `pawning_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `pawning_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_product`
--

DROP TABLE IF EXISTS `pawning_product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_product` (
  `idPawning_Product` int NOT NULL AUTO_INCREMENT,
  `Branch_idBranch` int DEFAULT NULL,
  `Name` varchar(45) DEFAULT NULL,
  `Service_Charge` varchar(45) DEFAULT NULL,
  `Service_Charge_Create_As` varchar(45) DEFAULT NULL,
  `Service_Charge_Value_type` varchar(45) DEFAULT NULL,
  `Service_Charge_Value` varchar(45) DEFAULT NULL,
  `Early_Settlement_Charge` varchar(45) DEFAULT NULL,
  `Early_Settlement_Charge_Create_As` varchar(45) DEFAULT NULL,
  `Early_Settlement_Charge_Value_type` varchar(45) DEFAULT NULL,
  `Late_Charge_Status` varchar(45) DEFAULT NULL,
  `Early_Settlement_Charge_Value` varchar(45) DEFAULT NULL,
  `Late_Charge_Create_As` varchar(45) DEFAULT NULL,
  `Late_Charge` varchar(45) DEFAULT NULL,
  `Interest_Method` varchar(45) DEFAULT NULL,
  `Last_Updated_User` varchar(45) DEFAULT NULL,
  `Last_Updated_Time` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idPawning_Product`),
  KEY `fk_pawning_product_branch` (`Branch_idBranch`),
  CONSTRAINT `fk_pawning_product_branch` FOREIGN KEY (`Branch_idBranch`) REFERENCES `branch` (`idBranch`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_product`
--

LOCK TABLES `pawning_product` WRITE;
/*!40000 ALTER TABLE `pawning_product` DISABLE KEYS */;
INSERT INTO `pawning_product` VALUES (102,1,'Test Product 01','1','Charge For Product Item','N/A','N/A','0','inactive','inactive','1','0','Charge For Product','0.76','Interest For Pawning Amount','10','2025-10-25 11:08:00.716'),(103,3,'Test Product 01','1','Charge For Product Item','N/A','N/A','0','inactive','inactive','1','0','Charge For Product','0.8','Interest For Pawning Amount','28','2025-10-25 12:36:49.472'),(104,3,'Test Product 02','1','Charge For Product Item','N/A','N/A','0','inactive','inactive','1','0','Charge For Product','1','Interest For Pawning Amount','28','2025-10-25 12:48:38.655'),(105,3,'Test Product 03','1','Charge For Product Item','N/A','N/A','0','inactive','inactive','1','0','Charge For Product','4','Interest For Period','28','2025-10-25 12:51:58.842'),(106,2,'Test 01','1','Charge For Product Item','N/A','N/A','0','inactive','inactive','1','0','Charge For Product','2','Interest For Pawning Amount','10','2025-11-10 10:28:57.106');
/*!40000 ALTER TABLE `pawning_product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_ticket`
--

DROP TABLE IF EXISTS `pawning_ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_ticket` (
  `idPawning_Ticket` int NOT NULL AUTO_INCREMENT,
  `Ticket_No` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SEQ_No` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Date_Time` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Customer_idCustomer` int DEFAULT NULL,
  `Pawning_Product_idPawning_Product` int DEFAULT NULL,
  `Reason_For_Ticket_idReason_For_Ticket` int DEFAULT NULL,
  `Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `Period_Type` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Period` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Maturity_date` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Interest_Rate_Duration` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Interest_Rate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Service_Charge_Type` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Service_Charge_Rate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Late_charge_Precentage` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Gross_Weight` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Net_Weight` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `No_Of_Items` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Assessed_Value` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Payble_Value` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Pawning_Advance_Amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Service_charge_Amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Total_Amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Service_Charge_Balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Additiona_Charges_Balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Early_Settlement_Charge_Balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Late_Charge_Balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Interest_Amount_Balance` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Balance_Amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Approved_User` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Approved_Date_Time` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Approved_Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `User_idUser` int DEFAULT NULL,
  `Branch_idBranch` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `Interest_apply_on` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Late_charge_Presentage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage1StartDate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage1EndDate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage2StartDate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage2EndDate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage3StartDate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage3EndDate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage4StartDate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage4EndDate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage1Interest` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage2Interest` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage3Interest` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage4Interest` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Print_Status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '0',
  PRIMARY KEY (`idPawning_Ticket`),
  KEY `fk_customer` (`Customer_idCustomer`),
  KEY `fk_pawning_product` (`Pawning_Product_idPawning_Product`),
  KEY `fk_user` (`User_idUser`),
  KEY `fk_branch` (`Branch_idBranch`),
  KEY `fk_reason_for_ticket` (`Reason_For_Ticket_idReason_For_Ticket`),
  CONSTRAINT `fk_branch` FOREIGN KEY (`Branch_idBranch`) REFERENCES `branch` (`idBranch`),
  CONSTRAINT `fk_customer` FOREIGN KEY (`Customer_idCustomer`) REFERENCES `customer` (`idCustomer`),
  CONSTRAINT `fk_pawning_product` FOREIGN KEY (`Pawning_Product_idPawning_Product`) REFERENCES `pawning_product` (`idPawning_Product`),
  CONSTRAINT `fk_reason_for_ticket` FOREIGN KEY (`Reason_For_Ticket_idReason_For_Ticket`) REFERENCES `reason_for_ticket` (`idReason_For_Ticket`),
  CONSTRAINT `fk_user` FOREIGN KEY (`User_idUser`) REFERENCES `user` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=144 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_ticket`
--

LOCK TABLES `pawning_ticket` WRITE;
/*!40000 ALTER TABLE `pawning_ticket` DISABLE KEYS */;
INSERT INTO `pawning_ticket` VALUES (135,'1-B01-0001-102-0189-100','1','2025-11-18 08:57:23',189,102,NULL,NULL,'months','1','2025-12-18','perMonth','2.7','fixed','250',NULL,'2.00','1.00',NULL,'26181.80','2750.00','2000','250','2000','0','0','0','0','0','2000',NULL,NULL,NULL,NULL,10,1,'2025-11-18 03:27:55',NULL,'2025-11-18','0.76','0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','0'),(136,'1-B01-0001-102-0189-101','1','2025-11-20 12:08:32',189,102,NULL,NULL,'months','1','2025-12-20','perMonth','2.7','fixed','250',NULL,'2.00','1.00',NULL,'25090.90','2625.00','2500','250','2500','0','0','0','0','0','2500','2',NULL,NULL,NULL,33,1,'2025-11-20 06:38:52','2025-12-02 04:31:59','2025-11-20','0.76','0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','1'),(137,'1-B01-0001-102-0189-102','2','2025-11-20 15:27:27',189,102,NULL,NULL,'months','1','2025-12-20','perMonth','2.7','fixed','250',NULL,'2.00','1.00',NULL,'19636.40','2125.00','210','250','210','0','0','0','0','0','210',NULL,NULL,NULL,NULL,10,1,'2025-11-20 09:59:26',NULL,'2025-11-20','0.76','0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','0'),(138,'1-B01-0001-102-0189-103','3','2025-11-20 15:32:29',189,102,NULL,NULL,'months','1','2025-12-20','perMonth','2.7','fixed','250',NULL,'2.00','1.00',NULL,'26181.80','2750.00','2500','250','2500','0','0','0','0','0','2500',NULL,NULL,NULL,NULL,10,1,'2025-11-20 10:02:47',NULL,'2025-11-20','0.76','0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','0'),(139,'1-B01-0001-102-0189-104','4','2025-11-20 15:41:15',189,102,NULL,NULL,'months','1','2025-12-20','perMonth','2.7','fixed','250',NULL,'2.00','1.00',NULL,'21818.20','2375.00','2300','250','2300','0','0','0','0','0','2300',NULL,NULL,NULL,NULL,10,1,'2025-11-20 10:11:33',NULL,'2025-11-20','0.76','0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','0'),(140,'1-B01-0001-102-0189-105','1','2025-11-26 08:23:47',189,102,NULL,NULL,'months','1','2025-12-26','perMonth','2.7','fixed','250',NULL,'2.00','1.00',NULL,'20727.30','2250.00','2000','250','2000','0','0','0','0','0','2000','2',NULL,NULL,NULL,10,1,'2025-11-26 02:54:10','2025-11-26 02:55:23','2025-11-26','0.76','0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','0'),(141,'1-B01-0001-102-0189-106','2','2025-11-26 09:08:46',189,102,NULL,NULL,'months','1','2025-12-26','perMonth','2.7','fixed','250',NULL,'2.00','1.00',NULL,'24000.00','2500.00','2400','250','2400','0','0','0','0','0','2400','2',NULL,NULL,NULL,10,1,'2025-11-26 03:39:16','2025-11-26 03:40:37','2025-11-26','0.76','0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','0'),(142,'1-B01-0001-102-0189-107','3','2025-11-26 09:37:02',189,102,NULL,NULL,'months','1','2025-12-26','perMonth','2.7','fixed','250',NULL,'2.00','1.00',NULL,'20727.30','2250.00','2000','250','2000','0','0','0','0','0','2000','2',NULL,NULL,NULL,10,1,'2025-11-26 04:10:11','2025-12-03 07:40:28','2025-11-26','0.76','0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','0'),(143,'1-B01-0001-102-0189-108','4','2025-11-26 09:40:20',189,102,NULL,NULL,'months','1','2025-12-26','perMonth','2.7','fixed','250',NULL,'2.00','1.00',NULL,'19636.40','2125.00','2000','250','2000','0','0','0','0','0','2000','2',NULL,NULL,NULL,10,1,'2025-11-26 04:12:33','2025-12-03 07:40:04','2025-11-26','0.76','0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','0');
/*!40000 ALTER TABLE `pawning_ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_ticket_approval`
--

DROP TABLE IF EXISTS `pawning_ticket_approval`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_ticket_approval` (
  `idPawning_Ticket_Approval` int NOT NULL AUTO_INCREMENT,
  `Pawning_Ticket_idPawning_Ticket` int NOT NULL,
  `ApprovalRangeLevel_idApprovalRangeLevel` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `approval_status` int DEFAULT NULL,
  `approval_date` timestamp NULL DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`idPawning_Ticket_Approval`),
  KEY `fk_approval_ticket` (`Pawning_Ticket_idPawning_Ticket`),
  KEY `fk_approval_level` (`ApprovalRangeLevel_idApprovalRangeLevel`),
  KEY `fk_approved_by_user` (`approved_by`),
  CONSTRAINT `fk_approval_level` FOREIGN KEY (`ApprovalRangeLevel_idApprovalRangeLevel`) REFERENCES `pawning_ticket_approval_ranges_level` (`idApprovalRangeLevel`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_approval_ticket` FOREIGN KEY (`Pawning_Ticket_idPawning_Ticket`) REFERENCES `pawning_ticket` (`idPawning_Ticket`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_approved_by_user` FOREIGN KEY (`approved_by`) REFERENCES `user` (`idUser`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_ticket_approval`
--

LOCK TABLES `pawning_ticket_approval` WRITE;
/*!40000 ALTER TABLE `pawning_ticket_approval` DISABLE KEYS */;
INSERT INTO `pawning_ticket_approval` VALUES (30,135,44,10,1,'2025-11-18 03:28:44',NULL),(31,136,46,33,1,'2025-11-20 06:39:10',NULL),(32,136,47,10,1,'2025-11-20 06:42:59',NULL),(33,136,48,61,1,'2025-11-20 06:45:14',NULL),(34,138,46,10,1,'2025-11-20 10:05:57',NULL),(35,137,44,10,1,'2025-11-20 10:07:57',NULL),(36,139,46,10,1,'2025-11-20 10:11:38',NULL);
/*!40000 ALTER TABLE `pawning_ticket_approval` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_ticket_approval_levels_designations`
--

DROP TABLE IF EXISTS `pawning_ticket_approval_levels_designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_ticket_approval_levels_designations` (
  `idApproval_levels_designations` int NOT NULL AUTO_INCREMENT,
  `ApprovalRangeLevel_idApprovalRangeLevel` int NOT NULL,
  `Designation_idDesignation` int NOT NULL,
  PRIMARY KEY (`idApproval_levels_designations`),
  UNIQUE KEY `uq_level_designation` (`ApprovalRangeLevel_idApprovalRangeLevel`,`Designation_idDesignation`),
  KEY `fk_designation_ref` (`Designation_idDesignation`),
  CONSTRAINT `fk_designation_level` FOREIGN KEY (`ApprovalRangeLevel_idApprovalRangeLevel`) REFERENCES `pawning_ticket_approval_ranges_level` (`idApprovalRangeLevel`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_designation_ref` FOREIGN KEY (`Designation_idDesignation`) REFERENCES `designation` (`idDesignation`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_ticket_approval_levels_designations`
--

LOCK TABLES `pawning_ticket_approval_levels_designations` WRITE;
/*!40000 ALTER TABLE `pawning_ticket_approval_levels_designations` DISABLE KEYS */;
INSERT INTO `pawning_ticket_approval_levels_designations` VALUES (48,44,1),(47,44,20),(49,45,1),(50,46,1),(51,46,20),(52,47,1),(53,48,1);
/*!40000 ALTER TABLE `pawning_ticket_approval_levels_designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_ticket_approval_range`
--

DROP TABLE IF EXISTS `pawning_ticket_approval_range`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_ticket_approval_range` (
  `idApproval_Range` int NOT NULL AUTO_INCREMENT,
  `companyid` int NOT NULL,
  `start_amount` decimal(15,2) NOT NULL,
  `end_amount` decimal(15,2) NOT NULL,
  `last_updated_user` int NOT NULL,
  `last_updated_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`idApproval_Range`),
  KEY `fk_approval_range_company` (`companyid`),
  KEY `fk_approval_range_user` (`last_updated_user`),
  CONSTRAINT `fk_approval_range_company` FOREIGN KEY (`companyid`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_approval_range_user` FOREIGN KEY (`last_updated_user`) REFERENCES `user` (`idUser`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `chk_amount_range` CHECK ((`end_amount` > `start_amount`))
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_ticket_approval_range`
--

LOCK TABLES `pawning_ticket_approval_range` WRITE;
/*!40000 ALTER TABLE `pawning_ticket_approval_range` DISABLE KEYS */;
INSERT INTO `pawning_ticket_approval_range` VALUES (36,1,0.00,2000.00,10,'2025-11-18 03:26:40'),(38,1,2001.00,100000.00,10,'2025-11-20 06:38:07');
/*!40000 ALTER TABLE `pawning_ticket_approval_range` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_ticket_approval_ranges_level`
--

DROP TABLE IF EXISTS `pawning_ticket_approval_ranges_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_ticket_approval_ranges_level` (
  `idApprovalRangeLevel` int NOT NULL AUTO_INCREMENT,
  `Approval_Range_idApproval_Range` int NOT NULL,
  `level_name` varchar(100) NOT NULL,
  `is_head_office_level` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`idApprovalRangeLevel`),
  KEY `fk_level_approval_range` (`Approval_Range_idApproval_Range`),
  CONSTRAINT `fk_level_approval_range` FOREIGN KEY (`Approval_Range_idApproval_Range`) REFERENCES `pawning_ticket_approval_range` (`idApproval_Range`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_ticket_approval_ranges_level`
--

LOCK TABLES `pawning_ticket_approval_ranges_level` WRITE;
/*!40000 ALTER TABLE `pawning_ticket_approval_ranges_level` DISABLE KEYS */;
INSERT INTO `pawning_ticket_approval_ranges_level` VALUES (44,36,'1ST',0),(45,36,'2ND',1),(46,38,'Level One',0),(47,38,'Level Two',0),(48,38,'Level Three',1);
/*!40000 ALTER TABLE `pawning_ticket_approval_ranges_level` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_ticket_format`
--

DROP TABLE IF EXISTS `pawning_ticket_format`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_ticket_format` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `format_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `format` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auto_generate_start_from` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pawning_company` (`company_id`),
  CONSTRAINT `fk_pawning_company` FOREIGN KEY (`company_id`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_ticket_format`
--

LOCK TABLES `pawning_ticket_format` WRITE;
/*!40000 ALTER TABLE `pawning_ticket_format` DISABLE KEYS */;
INSERT INTO `pawning_ticket_format` VALUES (1,1,'Format','Branch Number-Branch\'s Customer Count-Product Code-Customer Number-Auto Create Number',100,'2025-09-22 06:58:14','2025-10-17 03:02:44'),(2,3,'Custom Format',NULL,NULL,'2025-10-23 09:39:04','2025-10-23 09:39:27');
/*!40000 ALTER TABLE `pawning_ticket_format` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_ticket_has_article`
--

DROP TABLE IF EXISTS `pawning_ticket_has_article`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_ticket_has_article` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pawning_id` int NOT NULL,
  `no` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `type_of_article` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `categories` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `conditions` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `caratage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `no_of_item` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `gross_weight` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `net_weight` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `assessed_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `declared_value` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=535 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_ticket_has_article`
--

LOCK TABLES `pawning_ticket_has_article` WRITE;
/*!40000 ALTER TABLE `pawning_ticket_has_article` DISABLE KEYS */;
INSERT INTO `pawning_ticket_has_article` VALUES (1,1,'1','Ring','Normal','Machine Cut','22','1','2.31','2.31','52408.13','38981.25','2024-08-13 20:20:06','2024-08-13 20:20:06'),(3,3,'1','Ring','Normal','Machine Cut','22','1','2.31','2.31','52408.13','38981.25','2024-08-13 21:24:52','2024-08-13 21:24:52'),(4,4,'1','chain','Normal','flat','21','1','6.00','6.00','131250.00','107386.38','2024-08-14 15:03:34','2024-08-14 15:03:34'),(5,5,'1','G/RING','Normal','Normal','22','1','5.14','5.14','117791.68','99587.50','2024-08-15 14:03:05','2024-08-15 14:03:05'),(6,5,'2','L/RING','Normal','Normal','22','1','4.04','4.04','92583.35','78275.00','2024-08-15 14:03:05','2024-08-15 14:03:05'),(7,6,'1','BRECELAT','Normal','Normal','22','1','2.52','2.52','57750.01','47250.00','2024-08-15 14:17:01','2024-08-15 14:17:01'),(8,6,'2','chain','Normal','Normal','22','1','2.32','2.32','53166.67','43500.00','2024-08-15 14:17:01','2024-08-15 14:17:01'),(9,6,'3','chain','Normal','Normal','22','1','5.80','5.80','132916.69','108750.00','2024-08-15 14:17:01','2024-08-15 14:17:01'),(10,6,'4','chain','Normal','Normal','22','1','3.08','3.08','70583.34','57750.00','2024-08-15 14:17:01','2024-08-15 14:17:01'),(11,7,'1','p/eartudes','Normal','stone','18','1','0.87','0.87','16312.50','13346.59','2024-08-15 15:21:43','2024-08-15 15:21:43'),(12,7,'2','L/RING','Normal','Normal','22','1','4.00','4.00','91666.68','75000.00','2024-08-15 15:21:43','2024-08-15 15:21:43'),(13,7,'3','chain','Normal','Normal','22','1','1.83','1.83','41937.51','34312.50','2024-08-15 15:21:43','2024-08-15 15:21:43'),(14,8,'1','chain','Normal','flat','22','1','4.03','4.03','92354.18','75562.50','2024-08-15 16:05:17','2024-08-15 16:05:17'),(15,9,'1','BANGLE','Normal','Normal','22','1','6.29','6.29','144145.85','121868.75','2024-08-15 19:28:49','2024-08-15 19:28:49'),(16,9,'2','G/RING','Normal','Normal','22','1','4.90','4.90','112291.68','94937.50','2024-08-15 19:28:49','2024-08-15 19:28:49'),(17,9,'3','chain','Normal','Normal','22','1','3.40','3.40','77916.68','65875.00','2024-08-15 19:28:49','2024-08-15 19:28:49'),(18,9,'4','chain','Normal','Normal','22','1','8.32','8.28','189750.03','160425.00','2024-08-15 19:28:49','2024-08-15 19:28:49'),(19,9,'5','PENDENT','Normal','Normal','20','1','0.40','0.30','6250.00','5284.09','2024-08-15 19:28:49','2024-08-15 19:28:49'),(20,9,'6','Panchayuda','Normal','Normal','21','1','0.80','0.80','17500.00','14795.46','2024-08-15 19:28:49','2024-08-15 19:28:49'),(21,10,'1','chain','Normal','BOX','22','1','8.08','8.08','185166.69','151500.00','2024-08-16 14:07:06','2024-08-16 14:07:06'),(22,10,'2','chain','Normal','flat','22','1','9.89','9.89','226645.87','185437.50','2024-08-16 14:07:06','2024-08-16 14:07:06'),(23,11,'1','chain','Normal','BOX','22','1','15.65','15.65','358645.89','283656.25','2024-08-16 15:05:54','2024-08-16 15:05:54'),(24,11,'2','chain','Normal','BOX','22','1','3.85','3.85','88229.18','69781.25','2024-08-16 15:05:54','2024-08-16 15:05:54'),(25,12,'1','chain','Normal','D/C','20','1','24.51','24.51','510624.92','403857.89','2024-08-16 16:55:38','2024-08-16 16:55:38'),(26,12,'2','Ring','Normal','Normal','22','1','8.12','8.12','186083.36','147175.00','2024-08-16 16:55:38','2024-08-16 16:55:38'),(27,13,'1','L/RING','Normal','Normal','22','1','2.02','2.00','45833.34','38750.00','2024-08-16 17:14:00','2024-08-16 17:14:00'),(28,13,'2','Ring','Normal','Normal','22','1','2.11','2.11','48354.17','40881.25','2024-08-16 17:14:00','2024-08-16 17:14:00'),(29,14,'1','chain','Normal','S/P','22','1','9.21','9.21','211062.53','178443.75','2024-08-16 18:27:23','2024-08-16 18:27:23'),(30,14,'2','BANGLE','Normal','M/C','22','1','12.59','12.59','288520.88','243931.25','2024-08-16 18:27:23','2024-08-16 18:27:23'),(31,14,'3','L/RING','Normal','Normal','22','1','6.03','6.03','138187.52','116831.25','2024-08-16 18:27:23','2024-08-16 18:27:23'),(32,14,'4','L/RING','Normal','Normal','22','1','1.23','1.23','28187.50','23831.25','2024-08-16 18:27:23','2024-08-16 18:27:23'),(33,15,'1','PENDENT','Normal','Machine Cut','20','1','4.52','4.52','93931.25','77045.43','2024-08-20 13:20:01','2024-08-20 13:20:01'),(34,16,'1','chain','Normal','D/C','22','1','40.98','40.98','936777.39','768375.00','2024-08-20 16:33:03','2024-08-20 16:33:03'),(35,16,'2','G/RING','Normal','stone','22','1','10.44','10.00','228593.80','187500.00','2024-08-20 16:33:03','2024-08-20 16:33:03'),(36,17,'1','Ring','Normal','Normal','22','1','8.00','8.00','182875.04','150000.00','2024-08-20 17:35:36','2024-08-20 17:35:36'),(37,17,'2','chain','Normal','BOX','22','1','20.05','20.05','458330.57','375937.50','2024-08-20 17:35:36','2024-08-20 17:35:36'),(38,17,'3','chain','Normal','BOX','21','1','11.95','11.95','260752.70','213877.87','2024-08-20 17:35:36','2024-08-20 17:35:36'),(39,18,'1','BRECELAT','Normal','Normal','22','1','24.77','24.77','566226.84','479918.75','2024-08-21 15:27:38','2024-08-21 15:27:38'),(40,19,'1','BANGLE','Normal','Machine Cut','22','1','8.70','8.70','198876.61','157687.50','2024-08-21 15:53:29','2024-08-21 15:53:29'),(41,19,'2','chain','Normal','flat','22','1','12.17','12.17','278198.65','220581.25','2024-08-21 15:53:29','2024-08-21 15:53:29'),(42,19,'3','chain','Normal','D/C','20','1','11.90','11.90','247296.88','196079.51','2024-08-21 15:53:29','2024-08-21 15:53:29'),(43,20,'1','BANGLE','Normal','Machine Cut','22','1','8.69','8.69','198648.01','157506.25','2024-08-21 15:58:54','2024-08-21 15:58:54'),(44,21,'1','chain','Normal','BOX','22','1','11.94','11.94','272941.00','216412.50','2024-08-21 16:03:10','2024-08-21 16:03:10'),(45,22,'1','chain','Normal','D/C','21','1','7.83','7.83','170853.03','144810.53','2024-08-21 17:25:26','2024-08-21 17:25:26'),(46,22,'2','chain','Normal','D/C','21','1','7.64','7.64','166707.17','141296.60','2024-08-21 17:25:26','2024-08-21 17:25:26'),(47,22,'3','PENDENT','Normal','Machine Cut','21','1','2.64','2.64','57605.62','48825.00','2024-08-21 17:25:26','2024-08-21 17:25:26'),(48,23,'2','Ring','Normal','Normal','22','1','1.71','1.71','39089.54','29925.00','2024-08-21 18:23:03','2024-08-21 18:23:03'),(49,23,'3','PENDENT','Normal','Normal','21','1','1.11','0.91','19856.48','15201.14','2024-08-21 18:23:03','2024-08-21 18:23:03'),(50,23,'3','chain','Normal','BOX','22','1','4.84','4.84','110639.40','84700.00','2024-08-21 18:23:03','2024-08-21 18:23:03'),(51,24,'1','Chain','Broken','Diamond Chain','21','1','7.51','7.51','163870.53','120970.70','2024-08-22 14:04:43','2024-08-22 14:04:43'),(52,25,'1','Ring','Normal','Gents Ring','22','1','2.04','2.04','46633.14','35700.00','2024-08-22 17:52:49','2024-08-22 17:52:49'),(53,25,'2','Ring','Out of Shape','Gents Ring','22','1','4.10','4.10','93723.46','71750.00','2024-08-22 17:52:49','2024-08-22 17:52:49'),(54,25,'3','Necklace','Normal','Ball Chain','21','1','7.64','7.64','166707.17','127622.76','2024-08-22 17:52:49','2024-08-22 17:52:49'),(55,26,'1','Chain','Normal','Diamond Chain','22','1','7.96','7.96','181960.66','154225.00','2024-08-22 19:54:22','2024-08-22 19:54:22'),(56,27,'1','Ring','Normal','Ladies Ring','21','1','3.98','3.98','86844.83','73607.39','2024-08-23 18:42:57','2024-08-23 18:42:57'),(57,27,'2','Ring','Normal','Gents Ring','22','1','4.51','4.51','103095.80','87381.25','2024-08-23 18:42:57','2024-08-23 18:42:57'),(58,27,'3','Bracelet','Part Missing','Flat Bracelet','22','1','5.60','5.60','128012.53','108500.00','2024-08-23 18:42:57','2024-08-23 18:42:57'),(59,28,'1','Bracelet','Normal','Cuffs Bracelet','22','1','3.27','3.27','74750.17','61312.50','2024-08-28 13:31:27','2024-08-28 13:31:27'),(60,29,'1','Ring','Out of Shape','Gents Ring','22','1','7.00','6.98','159558.47','130875.00','2024-08-28 16:50:02','2024-08-28 16:50:02'),(61,29,'2','Chain','Normal','Box chain','22','1','3.93','3.93','89837.36','73687.50','2024-08-28 16:50:02','2024-08-28 16:50:02'),(62,29,'3','Panchayuda','Normal','Ball Studs','21','1','1.74','1.72','37530.93','30784.10','2024-08-28 16:50:02','2024-08-28 16:50:02'),(63,29,'4','Pendant','Normal','Ball Studs','18','1','0.54','0.40','7481.25','6136.36','2024-08-28 16:50:02','2024-08-28 16:50:02'),(64,30,'1','Chain','Normal','Box chain','22','1','4.03','4.03','92123.30','78081.25','2024-08-28 17:13:01','2024-08-28 17:13:01'),(65,30,'2','Pendant','Normal','Ball Studs','16','1','3.12','3.07','70178.30','59481.25','2024-08-28 17:13:01','2024-08-28 17:13:01'),(66,30,'3','Panchayuda','Broken','Classic Round Studs','21','1','0.80','0.80','17456.25','14795.46','2024-08-28 17:13:01','2024-08-28 17:13:01'),(67,31,'1','Chain','Normal','Curb Chain','19','1','8.99','8.99','177482.29','150429.22','2024-08-28 17:25:56','2024-08-28 17:25:56'),(68,32,'1','Chain','Normal','Diamond Chain','20','1','8.45','8.45','175601.56','139232.93','2024-08-28 18:51:15','2024-08-28 18:51:15'),(69,32,'2','Chain','Normal','Diamond Chain','20','1','3.60','3.60','74812.50','59318.17','2024-08-28 18:51:15','2024-08-28 18:51:15'),(70,33,'1','Chain','Normal','Flat Chain','21','1','7.78','7.78','169762.01','134602.87','2024-08-28 19:01:56','2024-08-28 19:01:56'),(71,33,'2','Pendant','Normal','Ring with stone','18','1','0.69','0.69','12905.16','10232.39','2024-08-28 19:01:56','2024-08-28 19:01:56'),(72,34,'1','Chain','Normal','Diamond Chain','20','1','7.76','7.76','161262.50','127863.62','2024-08-28 19:08:52','2024-08-28 19:08:52'),(73,34,'2','Pendant','Normal','Ring with stone','20','1','2.17','2.07','43017.19','34107.95','2024-08-28 19:08:52','2024-08-28 19:08:52'),(74,35,'1','Chain','Normal','Box chain','22','1','12.00','12.00','274312.56','232500.00','2024-08-28 21:19:22','2024-08-28 21:19:22'),(75,36,'1','Ring','Normal','Gents Ring','22','1','5.67','5.67','129612.68','106312.50','2024-08-29 14:09:59','2024-08-29 14:09:59'),(76,37,'1','Ring','Normal','Ladies Ring','22','1','8.27','3.12','71321.27','58500.00','2024-08-29 14:32:38','2024-08-29 14:32:38'),(77,37,'2','Panchayuda','Normal','Ball Studs','21','1','0.44','0.44','9600.94','7875.00','2024-08-29 14:32:38','2024-08-29 14:32:38'),(78,38,'1','Chain','Normal','Diamond Chain','19','1','7.88','7.88','155568.46','114842.02','2024-08-29 16:40:46','2024-08-29 16:40:46'),(79,39,'1','Ring','Normal','Gents Ring','22','1','10.04','10.04','229508.18','194525.00','2024-08-29 18:02:09','2024-08-29 18:02:09'),(80,39,'2','Chain','Broken','Box chain','22','1','7.98','7.98','182417.85','154612.50','2024-08-29 18:02:09','2024-08-29 18:02:09'),(81,39,'3','Chain','Normal','Diamond Chain','22','1','7.26','7.16','163673.16','138725.00','2024-08-29 18:02:09','2024-08-29 18:02:09'),(82,40,'1','Ring','Normal','Gents Ring','22','1','10.13','10.13','231565.52','170943.75','2024-08-29 20:54:40','2024-08-29 20:54:40'),(83,40,'2','Chain','Normal','Flat Chain','20','1','2.60','2.60','54031.25','39886.37','2024-08-29 20:54:40','2024-08-29 20:54:40'),(84,41,'1','Chain','Normal','Box chain','22','1','15.98','15.98','365292.89','289637.50','2024-08-30 17:01:20','2024-08-30 17:01:20'),(85,42,'1','Necklace','Normal','Normal','22','1','11.34','10.84','247795.68','196475.00','2024-08-30 17:02:55','2024-08-30 17:02:55'),(86,43,'1','Chain','Normal','Normal','22','1','19.96','19.96','456273.22','361775.00','2024-08-30 17:40:26','2024-08-30 17:40:26'),(87,43,'2','Chain','Normal','Normal','16','1','4.80','4.80','109725.02','87000.00','2024-08-30 17:40:26','2024-08-30 17:40:26'),(88,43,'3','Chain','Normal','Diamond Chain','22','1','10.03','10.03','229279.58','181793.75','2024-08-30 17:40:26','2024-08-30 17:40:26'),(89,43,'4','Pendant','Normal','Normal','22','1','1.88','1.88','42975.63','34075.00','2024-08-30 17:40:26','2024-08-30 17:40:26'),(90,44,'1','Ring','Normal','Gents Ring','22','1','15.91','15.91','363692.74','298312.50','2024-08-30 19:14:53','2024-08-30 19:14:53'),(91,45,'1','Chain','Normal','Box chain','20','1','1.96','1.96','40731.25','32295.45','2024-08-31 16:06:33','2024-08-31 16:06:33'),(92,46,'1','Chain','Normal','With Pendant','22','1','10.74','10.74','245509.74','208087.50','2024-09-02 15:27:54','2024-09-02 15:27:54'),(93,47,'1','Bracelet','Normal','Normal','21','1','3.14','3.14','68515.77','58072.16','2024-09-02 15:33:06','2024-09-02 15:33:06'),(94,47,'2','Chain','Normal','With Pendant','21','1','4.20','4.20','91645.30','77676.14','2024-09-02 15:33:06','2024-09-02 15:33:06'),(95,47,'3','Ring','Normal','Ladies Ring','21','1','2.04','2.04','44513.43','37728.41','2024-09-02 15:33:06','2024-09-02 15:33:06'),(96,48,'1','Ring','Normal','Ladies Ring','21','1','1.64','1.64','35785.31','30330.68','2024-09-02 15:37:24','2024-09-02 15:37:24'),(97,48,'2','Ring','Normal','Gents Ring','21','1','2.00','2.00','43640.62','36988.64','2024-09-02 15:37:24','2024-09-02 15:37:24'),(98,48,'3','Ring','Normal','Normal','18','1','2.00','1.90','35535.95','30119.31','2024-09-02 15:37:24','2024-09-02 15:37:24'),(99,49,'1','Bangle','Normal','Normal','19','1','5.76','5.76','113715.01','90163.64','2024-09-02 15:53:07','2024-09-02 15:53:07'),(100,50,'1','Ring','Normal','Ladies Ring','22','1','4.30','4.30','98295.33','77937.50','2024-09-02 16:05:01','2024-09-02 16:05:01'),(101,50,'2','Ring','Normal','Ladies Ring','20','1','1.96','1.96','40731.25','32295.45','2024-09-02 16:05:01','2024-09-02 16:05:01'),(102,50,'3','Panchayuda','Normal','Normal','16','1','0.64','0.64','13300.00','10545.45','2024-09-02 16:05:02','2024-09-02 16:05:02'),(103,50,'4','Ring','Normal','Ladies Ring','16','1','0.77','0.75','15585.94','12357.95','2024-09-02 16:05:02','2024-09-02 16:05:02'),(104,51,'1','Bracelet','Normal','Normal','21','1','6.87','6.87','149905.53','110661.62','2024-09-02 16:08:37','2024-09-02 16:08:37'),(105,52,'1','Ring','Normal','Gents Ring','22','1','7.89','7.89','180360.51','133143.75','2024-09-02 16:16:14','2024-09-02 16:16:14'),(106,53,'1','Necklace','Normal','Normal','22','1','20.03','20.03','457873.38','338006.25','2024-09-02 16:25:00','2024-09-02 16:25:00'),(107,54,'1','Bangle','Out of Shape','Normal','22','1','11.78','11.78','269283.50','198787.50','2024-09-02 16:33:40','2024-09-02 16:33:40'),(108,55,'1','Bangle','Out of Shape','Normal','22','1','11.95','11.95','273169.59','201656.25','2024-09-02 16:40:09','2024-09-02 16:40:09'),(109,56,'1','Chain','Normal','Box chain','22','1','4.03','4.03','92123.30','78081.25','2024-09-02 18:18:04','2024-09-02 18:18:04'),(110,56,'2','Chain','Normal','Box chain','22','1','3.96','3.96','90523.14','76725.00','2024-09-02 18:18:04','2024-09-02 18:18:04'),(111,56,'3','Ring','Normal','With Stone','21','1','1.74','1.64','35785.31','30330.68','2024-09-02 18:18:04','2024-09-02 18:18:04'),(112,56,'4','Ring','Normal','With Stone','21','1','1.28','1.18','25747.97','21823.30','2024-09-02 18:18:04','2024-09-02 18:18:04'),(113,56,'5','Chain','Normal','With Pendant','18','1','2.56','2.40','44887.51','38045.45','2024-09-02 18:18:04','2024-09-02 18:18:04'),(114,56,'6','Chain','Normal','With Pendant','18','1','2.41','2.30','43017.20','36460.22','2024-09-02 18:18:04','2024-09-02 18:18:04'),(115,57,'1','Bracelet','Normal','Normal','22','1','4.14','4.14','94637.83','80212.50','2024-09-02 18:22:22','2024-09-02 18:22:22'),(116,57,'2','Pendant','Normal','Normal','19','1','0.75','0.75','14806.64','12144.89','2024-09-02 18:22:22','2024-09-02 18:22:22'),(117,58,'1','Ring','Out of Shape','Gents Ring','22','1','2.51','2.51','57377.04','47062.50','2024-09-02 18:41:22','2024-09-02 18:41:22'),(118,58,'2','Bracelet','Normal','Normal','21','1','6.33','6.33','138122.56','113292.63','2024-09-02 18:41:22','2024-09-02 18:41:22'),(119,58,'3','Ring','Normal','Ladies Ring','21','1','1.30','1.10','24002.34','19687.50','2024-09-02 18:41:22','2024-09-02 18:41:22'),(120,58,'4','Ring','Normal','Ladies Ring','20','1','1.20','1.10','22859.38','18750.00','2024-09-02 18:41:22','2024-09-02 18:41:22'),(121,58,'5','Chain','Normal','Gemstone Studs','21','1','11.05','11.05','241114.43','197769.92','2024-09-02 18:41:22','2024-09-02 18:41:22'),(122,59,'1','Chain','Normal','Normal','19','1','7.88','7.88','155568.46','131855.65','2024-09-02 19:13:52','2024-09-02 19:13:52'),(123,60,'1','Chain','Normal','With Pendant','21','1','9.93','9.93','216675.68','177724.46','2024-09-03 13:43:14','2024-09-03 13:43:14'),(124,61,'1','Chain','Normal','With Pendant','20','1','17.70','17.50','363671.88','268465.92','2024-09-03 18:15:22','2024-09-03 18:15:22'),(125,62,'1','Chain','Normal','Normal','21','1','0.84','0.84','18329.06','13530.68','2024-09-04 15:07:24','2024-09-04 15:07:24'),(126,62,'2','Pendant','Normal','Design','21','1','2.14','2.14','46695.46','34471.01','2024-09-04 15:07:24','2024-09-04 15:07:24'),(127,63,'1','Bangle','Normal','Design','22','1','6.00','6.00','137156.28','116250.00','2024-09-04 15:12:19','2024-09-04 15:12:19'),(128,64,'1','Pendant','Normal','Design','22','1','8.08','8.08','184703.79','156550.00','2024-09-04 15:13:49','2024-09-04 15:13:49'),(129,65,'1','Chain','Normal','Diamond Chain','18','1','11.22','11.22','209849.12','154912.52','2024-09-04 18:29:40','2024-09-04 18:29:40'),(130,66,'1','Chain','Normal','Diamond Chain','22','1','7.96','7.96','181960.66','154225.00','2024-09-06 13:59:57','2024-09-06 13:59:57'),(131,66,'2','Chain','Normal','Box chain','22','1','7.99','7.99','182646.45','154806.25','2024-09-06 13:59:57','2024-09-06 13:59:57'),(132,66,'3','Ring','Normal','Gents Ring','22','1','5.48','5.48','125269.40','106175.00','2024-09-06 13:59:57','2024-09-06 13:59:57'),(133,66,'4','Bangle','Normal','Machine Cut','22','1','7.96','7.96','181960.66','154225.00','2024-09-06 13:59:57','2024-09-06 13:59:57'),(134,67,'1','Chain','Normal','Box chain','22','1','9.68','9.68','221278.80','181500.00','2024-09-06 14:17:00','2024-09-06 14:17:00'),(135,68,'1','Chain','Normal','Flat Chain','20','1','11.24','11.24','233581.25','191590.86','2024-09-06 17:03:29','2024-09-06 17:03:29'),(136,69,'1','Chain','Normal','Box chain','22','1','4.05','4.05','92580.49','73406.25','2024-09-06 17:10:38','2024-09-06 17:10:38'),(137,69,'2','Chain','Normal','Box chain','22','1','8.05','8.05','184018.01','145906.25','2024-09-06 17:10:38','2024-09-06 17:10:38'),(138,69,'3','Ring','Normal','Normal','18','1','0.84','0.84','15710.63','12456.82','2024-09-06 17:10:38','2024-09-06 17:10:38'),(139,69,'4','Earings','Normal','Normal','18','1','0.60','0.60','11221.88','8897.73','2024-09-06 17:10:38','2024-09-06 17:10:38'),(140,69,'5','Pendant','Normal','With Stone','18','1','0.39','0.29','5423.91','4300.57','2024-09-06 17:10:38','2024-09-06 17:10:38'),(141,70,'1','Chain','Normal','Machine Cut','22','1','5.91','5.91','135098.94','110812.50','2024-09-06 17:45:03','2024-09-06 17:45:03'),(142,70,'2','Chain','Normal','Normal','22','1','3.97','3.97','90751.74','74437.50','2024-09-06 17:45:03','2024-09-06 17:45:03'),(143,70,'3','Ring','Normal','Ladies Ring','22','1','2.10','2.10','48004.70','39375.00','2024-09-06 17:45:03','2024-09-06 17:45:03'),(144,71,'1','Chain','Normal','Diamond Studs','22','1','11.22','11.22','256482.24','210375.00','2024-09-06 18:15:54','2024-09-06 18:15:54'),(145,72,'1','Chain','Normal','Diamond Chain','22','1','11.22','11.22','256482.24','210375.00','2024-09-06 18:18:25','2024-09-06 18:18:25'),(146,73,'1','Bangle','Normal','Machine Cut','22','1','13.67','13.67','312487.72','256312.50','2024-09-06 20:28:43','2024-09-06 20:28:43'),(147,74,'1','Chain','Normal','With Pendant','20','1','5.73','5.73','119076.56','87903.41','2024-09-06 20:38:10','2024-09-06 20:38:10'),(148,75,'1','Chain','Normal','Normal','22','1','16.11','16.11','368264.61','302062.50','2024-09-07 16:21:07','2024-09-07 16:21:07'),(149,76,'1','Chain','Normal','Singapore Chain','21','1','2.38','2.38','51932.34','41176.71','2024-09-09 17:08:14','2024-09-09 17:08:14'),(150,76,'2','Bracelet','Normal','Design','19','1','0.87','0.87','17175.71','13618.47','2024-09-09 17:08:14','2024-09-09 17:08:14'),(151,76,'3','Ring','Normal','With Stone','19','1','0.66','0.50','9871.09','7826.70','2024-09-09 17:08:14','2024-09-09 17:08:14'),(152,77,'1','Chain','Normal','With Pendant','22','1','7.07','7.07','161615.82','128143.75','2024-09-09 17:19:07','2024-09-09 17:19:07'),(153,77,'2','Ring','Normal','Ladies Ring','19','1','1.05','1.05','20729.30','16436.08','2024-09-09 17:19:07','2024-09-09 17:19:07'),(154,77,'3','Ring','Normal','Normal','19','1','1.04','1.04','20531.88','16279.55','2024-09-09 17:19:07','2024-09-09 17:19:07'),(155,78,'1','Chain','Normal','With Pendant','22','1','3.97','3.97','90751.74','71956.25','2024-09-09 17:21:55','2024-09-09 17:21:55'),(156,79,'1','Bracelet','Normal','Design','21','1','2.48','2.48','54114.37','45865.91','2024-09-09 17:38:20','2024-09-09 17:38:20'),(157,79,'2','Chain','Normal','Normal','21','1','80.06','8.06','175871.70','149064.22','2024-09-09 17:38:20','2024-09-09 17:38:20'),(158,79,'3','Chain','Normal','Normal','21','1','4.01','4.01','87499.44','74162.22','2024-09-09 17:38:20','2024-09-09 17:38:20'),(159,79,'4','Pendant','Normal','Design','21','1','0.98','0.98','21383.90','18124.43','2024-09-09 17:38:20','2024-09-09 17:38:20'),(160,79,'5','Ring','Normal','Ladies Ring','21','1','0.92','0.92','20074.69','17014.77','2024-09-09 17:38:20','2024-09-09 17:38:20'),(161,80,'1','Chain','Normal','With Pendant','22','1','3.42','3.42','78179.08','66262.50','2024-09-09 17:41:24','2024-09-09 17:41:24'),(162,80,'2','Chain','Normal','Normal','22','1','2.87','2.87','65606.42','55606.25','2024-09-09 17:41:24','2024-09-09 17:41:24'),(163,80,'3','Panchayuda','Out of Shape','With Stone','20','1','1.81','1.71','35535.94','30119.32','2024-09-09 17:41:24','2024-09-09 17:41:24'),(164,80,'4','Ring','Out of Shape','Ladies Ring','18','1','1.35','1.00','18703.13','15852.27','2024-09-09 17:41:24','2024-09-09 17:41:24'),(165,80,'5','Pendant','Normal','Normal','18','1','1.00','1.00','18703.13','15852.27','2024-09-09 17:41:24','2024-09-09 17:41:24'),(166,81,'1','Bracelet','Normal','Normal','22','1','4.09','4.09','93494.86','74131.25','2024-09-09 18:59:58','2024-09-09 18:59:58'),(167,81,'2','Ring','Normal','Normal','22','1','4.12','4.12','94180.65','74675.00','2024-09-09 18:59:58','2024-09-09 18:59:58'),(168,82,'1','Pendant','Normal','Normal','22','1','7.20','7.20','164587.54','121500.00','2024-09-10 14:45:00','2024-09-10 14:45:00'),(169,83,'1','Chain','Normal','Box chain','22','1','15.98','15.98','365292.89','309612.50','2024-09-10 15:11:54','2024-09-10 15:11:54'),(170,84,'1','Necklace','Normal','With Stone','22','1','11.34','10.84','247795.68','210025.00','2024-09-10 15:13:55','2024-09-10 15:13:55'),(171,85,'1','Pendant','Normal','Design','20','1','1.76','1.76','36575.00','29000.00','2024-09-10 15:30:07','2024-09-10 15:30:07'),(172,85,'2','Pendant','Normal','With Stone','20','1','1.03','0.95','19742.19','15653.41','2024-09-10 15:30:07','2024-09-10 15:30:07'),(173,86,'1','Bracelet','Normal','Normal','20','1','5.74','5.74','119284.38','101102.29','2024-09-11 12:45:03','2024-09-11 12:45:03'),(174,87,'1','Chain','Normal','Box chain','22','1','8.03','8.03','183560.82','155581.25','2024-09-11 16:56:01','2024-09-11 16:56:01'),(175,87,'2','Ring','Normal','Normal','22','1','5.86','5.86','133955.97','113537.50','2024-09-11 16:56:01','2024-09-11 16:56:01'),(176,87,'3','Chain','Normal','Box chain','22','1','16.02','16.02','366207.27','310387.50','2024-09-11 16:56:01','2024-09-11 16:56:01'),(177,88,'1','Necklace','Normal','With Stone','22','1','9.67','9.47','216478.33','183481.25','2024-09-11 17:01:01','2024-09-11 17:01:01'),(178,89,'1','Ring','Normal','Gents Ring','22','1','8.02','8.02','183332.23','155387.50','2024-09-11 17:14:22','2024-09-11 17:14:22'),(179,89,'2','Bangle','Out of Shape','Design','22','1','9.57','9.57','218764.27','185418.75','2024-09-11 17:14:22','2024-09-11 17:14:22'),(180,89,'3','Bracelet','Normal','Machine Cut','22','1','6.22','6.22','142185.34','120512.50','2024-09-11 17:14:22','2024-09-11 17:14:22'),(181,89,'4','Chain','Normal','Diamond Chain','22','1','16.01','16.01','365978.67','310193.75','2024-09-11 17:14:22','2024-09-11 17:14:22'),(182,89,'5','Chain','Normal','With Pendant','22','1','8.10','8.10','185160.98','156937.50','2024-09-11 17:14:22','2024-09-11 17:14:22'),(183,90,'1','Chain','Normal','Design','22','1','10.07','10.07','230193.96','195106.25','2024-09-12 15:54:57','2024-09-12 15:54:57'),(184,91,'1','Chain','Normal','Diamond Chain','22','1','8.07','8.07','184475.20','151312.50','2024-09-12 16:16:53','2024-09-12 16:16:53'),(185,92,'1','Bangle','Out of Shape','Design','22','1','5.75','5.75','131441.43','97031.25','2024-09-12 16:55:11','2024-09-12 16:55:11'),(186,92,'2','Bangle','Out of Shape','Design','22','1','5.85','5.85','133727.37','98718.75','2024-09-12 16:55:11','2024-09-12 16:55:11'),(187,93,'1','Chain','Normal','Diamond Chain','22','1','7.88','7.88','180131.91','147750.00','2024-09-12 18:43:40','2024-09-12 18:43:40'),(188,94,'1','Chain','Normal','With Pendant','22','1','4.23','4.03','92123.30','78081.25','2024-09-13 15:44:06','2024-09-13 15:44:06'),(189,94,'3','Ring','Out of Shape','Normal','20','1','0.68','0.68','14131.25','11977.28','2024-09-13 15:44:06','2024-09-13 15:44:06'),(190,94,'3','Pendant','Normal','With Stone','20','1','0.40','0.30','6234.38','5284.09','2024-09-13 15:44:06','2024-09-13 15:44:06'),(191,94,'4','Bracelet','Normal','Normal','22','1','8.00','8.00','182875.04','155000.00','2024-09-13 15:44:06','2024-09-13 15:44:06'),(192,94,'5','Chain','Normal','Design','22','1','2.97','2.97','67892.36','57543.75','2024-09-13 15:44:06','2024-09-13 15:44:06'),(193,95,'1','Bracelet','Normal','Flat Bracelet','22','1','3.60','3.60','82293.77','69750.00','2024-09-13 17:05:25','2024-09-13 17:05:25'),(194,96,'1','Chain','Normal','Box chain','22','1','3.99','3.99','91208.93','74812.50','2024-09-13 17:06:01','2024-09-13 17:06:01'),(195,96,'2','Chain','Normal','Box chain','22','1','5.96','5.96','136241.90','111750.00','2024-09-13 17:06:01','2024-09-13 17:06:01'),(196,97,'1','Earings','Normal','Normal','20','1','2.02','2.02','41978.13','35579.55','2024-09-13 19:15:13','2024-09-13 19:15:13'),(197,98,'1','Chain','Normal','Box chain','22','1','4.51','4.51','103095.80','84562.50','2024-09-14 14:17:28','2024-09-14 14:17:28'),(198,98,'2','Ring','Part Missing','With Stone','18','1','1.21','1.21','22630.79','18562.50','2024-09-14 14:17:28','2024-09-14 14:17:28'),(199,99,'1','Chain','Normal','Box chain','22','1','4.03','4.03','92123.30','68006.25','2024-09-14 15:23:15','2024-09-14 15:23:15'),(200,100,'1','Chain','Normal','Box chain','22','1','4.03','4.03','92123.30','73043.75','2024-09-18 14:32:54','2024-09-18 14:32:54'),(201,100,'2','Pendant','Normal','With Stone','20','1','1.13','0.93','19326.56','15323.86','2024-09-18 14:32:54','2024-09-18 14:32:54'),(202,101,'1','Bracelet','Normal','Normal','22','1','5.73','5.73','130984.25','103856.25','2024-09-18 14:51:33','2024-09-18 14:51:33'),(203,102,'1','Ring','Out of Shape','Ladies Ring','16','1','1.32','1.20','19950.00','14727.28','2024-09-18 15:13:57','2024-09-18 15:13:57'),(204,102,'2','Pendant','Out of Shape','With Stone','16','1','1.08','1.00','16625.00','12272.73','2024-09-18 15:13:57','2024-09-18 15:13:57'),(205,102,'3','Earings','Normal','Normal','16','1','1.13','1.13','18786.25','13868.18','2024-09-18 15:13:57','2024-09-18 15:13:57'),(206,103,'1','Bracelet','Normal','Normal','22','1','24.75','24.75','565769.66','479531.25','2024-09-18 16:18:12','2024-09-18 16:18:12'),(207,104,'1','Chain','Normal','Normal','21','1','16.69','16.69','364180.97','308670.20','2024-09-18 19:00:35','2024-09-18 19:00:35'),(208,105,'1','Chain','Normal','With Pendant','20','1','5.83','5.73','119076.56','87903.41','2024-09-18 19:36:04','2024-09-18 19:36:04'),(209,106,'1','Chain','Normal','Box chain','22','1','8.40','8.40','192018.79','141750.00','2024-09-19 13:04:40','2024-09-19 13:04:40'),(210,106,'2','Chain','Normal','Machine Cut','22','1','6.10','6.10','139442.22','102937.50','2024-09-19 13:04:40','2024-09-19 13:04:40'),(211,106,'3','Ring','Normal','With Stone','22','1','2.00','2.00','45718.76','33750.00','2024-09-19 13:04:40','2024-09-19 13:04:40'),(212,106,'4','Ring','Out of Shape','With Stone','19','1','0.81','0.81','15991.17','11804.83','2024-09-19 13:04:40','2024-09-19 13:04:40'),(213,106,'5','Pendant','Normal','Normal','19','1','0.63','0.60','11845.31','8744.32','2024-09-19 13:04:40','2024-09-19 13:04:40'),(214,106,'6','Panchayuda','Normal','Normal','20','1','1.30','1.30','27015.63','19943.18','2024-09-19 13:04:40','2024-09-19 13:04:40'),(215,107,'1','Chain','Normal','Flat Chain','22','1','6.07','6.07','138756.44','106225.00','2024-09-19 15:25:48','2024-09-19 15:25:48'),(216,108,'1','Chain','Normal','Design','22','1','17.08','17.08','390438.21','288225.00','2024-09-19 17:58:41','2024-09-19 17:58:41'),(217,108,'2','Ring','Normal','Normal','22','1','3.55','3.55','81150.80','59906.25','2024-09-19 17:58:41','2024-09-19 17:58:41'),(218,108,'3','Ring','Normal','Ladies Ring','21','1','2.07','2.07','45168.04','33343.46','2024-09-19 17:58:41','2024-09-19 17:58:41'),(219,109,'1','Ring','Normal','With Stone','22','1','6.28','6.26','143099.72','121287.50','2024-09-19 19:44:59','2024-09-19 19:44:59'),(220,109,'2','Chain','Normal','Diamond Chain','22','1','5.20','5.20','118868.78','100750.00','2024-09-19 19:44:59','2024-09-19 19:44:59'),(221,110,'1','Chain','Normal','Normal','22','1','8.07','8.07','184475.20','156356.25','2024-09-20 19:12:46','2024-09-20 19:12:46'),(222,110,'2','Ring','Normal','Normal','22','1','2.30','2.30','52576.57','44562.50','2024-09-20 19:12:46','2024-09-20 19:12:46'),(223,110,'3','Pendant','Normal','With Stone','18','1','0.69','0.65','12157.03','10303.98','2024-09-20 19:12:46','2024-09-20 19:12:46'),(224,111,'1','Ring','Normal','Gents Ring','22','1','8.40','8.40','192018.79','141750.00','2024-09-20 19:22:50','2024-09-20 19:22:50'),(225,111,'2','Ring','Normal','Ladies Ring','22','1','1.09','1.09','24916.72','18393.75','2024-09-20 19:22:50','2024-09-20 19:22:50'),(226,112,'1','Chain','Normal','Box chain','22','1','4.13','4.13','94409.24','77437.50','2024-10-23 06:47:54','2024-09-23 14:37:04'),(227,112,'2','Chain','Normal','Box chain','22','1','3.63','3.63','82979.55','68062.50','2024-10-23 06:47:59','2024-09-23 14:37:04'),(228,112,'3','Ring','Normal','Ladies Ring','22','1','4.11','4.00','91437.52','75000.00','2024-10-23 06:48:04','2024-09-23 14:37:04'),(229,112,'4','Pendant','Normal','With Stone','22','1','0.85','0.80','18287.50','15000.00','2024-10-23 06:48:07','2024-09-23 14:37:04'),(230,114,'1','Bracelet','Normal','Machine Cut','22','1','11.78','11.78','269283.50','228237.50','2024-09-24 16:11:54','2024-09-24 16:11:54'),(231,115,'1','Bracelet','Normal','Machine Cut','22','1','5.73','5.73','130984.25','111018.75','2024-09-25 08:55:57','2024-09-24 17:29:12'),(232,116,'1','Ring','Normal','Normal','20','1','4.36','4.36','90606.25','66886.37','2024-09-25 13:58:21','2024-09-25 13:58:21'),(233,116,'2','Chain','Out of Shape','With Pendant','20','1','4.47','4.37','90814.06','67039.78','2024-09-25 13:58:21','2024-09-25 13:58:21'),(234,117,'1','Ring','Normal','Normal','22','1','4.04','4.04','92351.90','68175.00','2024-09-25 15:03:39','2024-09-25 15:03:39'),(235,118,'1','Panchayuda','Normal','Normal','21','1','3.94','3.94','85972.02','70517.06','2024-09-25 15:35:50','2024-09-25 15:35:50'),(236,118,'2','Panchayuda','Out of Shape','Normal','20','1','2.03','2.03','42185.94','34602.26','2024-09-25 15:35:50','2024-09-25 15:35:50'),(237,118,'3','Ring','Normal','Normal','20','1','1.55','1.55','32210.94','26420.45','2024-09-25 15:35:50','2024-09-25 15:35:50'),(238,118,'4','Pendant','Normal','With Stone','20','1','0.54','0.53','11014.06','9034.09','2024-09-25 15:35:50','2024-09-25 15:35:50'),(239,118,'5','Pendant','Normal','With Stone','20','1','0.56','0.55','11429.69','9375.00','2024-09-25 15:35:50','2024-09-25 15:35:50'),(240,119,'1','Chain','Normal','Box chain','22','1','12.07','12.07','275912.72','233856.25','2024-09-26 14:55:31','2024-09-26 14:55:31'),(241,120,'1','Chain','Normal','Flat Chain','22','1','40.14','40.14','917575.51','777712.50','2024-09-26 18:19:09','2024-09-26 18:19:09'),(242,122,'1','Chain','Normal','With Pendant','22','1','15.33','15.32','350205.70','296825.00','2024-09-27 19:36:48','2024-09-27 19:36:48'),(243,124,'1','Chain','Normal','Normal','20','1','2.50','2.50','51953.13','38352.28','2024-09-30 13:28:19','2024-09-30 13:28:19'),(244,125,'1','Ring','Normal','Gents Ring','18','1','0.97','0.97','18142.04','13392.62','2024-09-30 14:23:38','2024-09-30 14:23:38'),(245,126,'1','Bangle','Normal','Normal','22','1','15.44','15.44','352948.83','299150.00','2024-09-30 14:47:26','2024-09-30 14:47:26'),(246,127,'1','Coins','Normal','Normal','22','1','48.00','48.00','1097250.24','1089000.00','2024-09-30 16:08:13','2024-09-30 16:08:13'),(247,128,'1','Chain','Part Missing','Diamond Chain','22','1','9.39','9.39','214649.58','176062.50','2024-09-30 18:50:05','2024-09-30 18:50:05'),(248,129,'1','Chain','Normal','Flat Chain','21','1','5.67','5.67','123721.16','101480.13','2024-10-01 14:12:52','2024-10-01 14:12:52'),(249,130,'1','Chain','Normal','Diamond Chain','21','1','3.96','3.96','86408.43','70875.01','2024-10-01 14:16:59','2024-10-01 14:16:59'),(250,131,'1','Ring','Normal','Gents Ring','22','1','3.87','3.87','88465.80','72562.50','2024-10-01 15:33:02','2024-10-01 15:33:02'),(251,132,'1','Chain','Part Missing','Flat Chain','18','1','3.51','3.51','65647.99','52051.72','2024-10-01 15:36:06','2024-10-01 15:36:06'),(252,133,'1','Bracelet','Normal','Machine Cut','22','1','2.00','2.00','45718.76','38750.00','2024-10-02 13:54:26','2024-10-02 13:54:26'),(253,134,'1','Bangle','Normal','Machine Cut','22','1','8.70','8.70','198876.61','163125.00','2024-10-02 19:04:14','2024-10-02 19:04:14'),(254,134,'2','Chain','Normal','Diamond Chain','22','1','11.90','11.90','272026.62','223125.00','2024-10-02 19:04:14','2024-10-02 19:04:14'),(255,134,'3','Chain','Normal','Flat Chain','22','1','12.18','12.18','278427.25','228375.00','2024-10-02 19:04:14','2024-10-02 19:04:14'),(256,135,'1','Bangle','Normal','Machine Cut','22','1','8.69','8.69','198648.01','162937.50','2024-10-02 19:08:01','2024-10-02 19:08:01'),(257,136,'1','Bracelet','Normal','Normal','22','1','1.97','1.97','45032.98','35706.25','2024-10-03 15:45:00','2024-10-03 15:45:00'),(258,137,'1','Ring','Out of Shape','Ladies Ring','21','1','1.47','1.47','32075.86','26309.66','2024-10-03 19:12:58','2024-10-03 19:12:58'),(259,138,'1','Chain','Normal','Box chain','22','1','4.05','4.05','92580.49','75937.50','2024-10-03 20:22:30','2024-10-03 20:22:30'),(260,138,'2','Ring','Normal','Normal','18','1','0.84','0.84','15710.63','12886.36','2024-10-03 20:22:30','2024-10-03 20:22:30'),(261,138,'3','Earings','Normal','Normal','18','1','0.60','0.60','11221.88','9204.55','2024-10-03 20:22:30','2024-10-03 20:22:30'),(262,138,'4','Pendant','Normal','With Stone','18','1','0.39','0.29','5423.91','4448.86','2024-10-03 20:22:30','2024-10-03 20:22:30'),(263,139,'1','Pendant','Normal','Normal','19','1','1.08','1.08','21321.57','15739.77','2024-10-04 15:44:08','2024-10-04 15:44:08'),(264,139,'2','Ring','Out of Shape','Normal','18','1','0.91','0.91','17019.85','12564.21','2024-10-04 15:44:08','2024-10-04 15:44:08'),(265,140,'1','Chain','Out of Shape','Flat Chain','22','1','5.42','5.00','114296.90','90625.00','2024-10-04 18:05:26','2024-10-04 18:05:26'),(266,141,'1','Chain','Normal','Diamond Chain','20','1','23.70','23.70','492515.63','363579.57','2024-10-04 19:16:19','2024-10-04 19:16:19'),(267,142,'1','Ring','Normal','Normal','22','1','2.01','2.01','45947.35','37687.50','2024-10-07 14:56:50','2024-10-07 14:56:50'),(268,142,'2','Ring','Normal','Gents Ring','22','1','4.12','4.12','94180.65','77250.00','2024-10-07 14:56:50','2024-10-07 14:56:50'),(269,142,'3','Ring','Normal','Gents Ring','22','1','3.73','3.73','85265.49','69937.50','2024-10-07 14:56:50','2024-10-07 14:56:50'),(270,142,'4','Ring','Normal','Gents Ring','22','1','1.91','1.91','43661.42','35812.50','2024-10-07 14:56:50','2024-10-07 14:56:50'),(271,142,'5','Chain','Normal','Flat Chain','22','1','11.68','11.68','266997.56','219000.00','2024-10-07 14:56:50','2024-10-07 14:56:50'),(272,143,'1','Ring','Normal','Gents Ring','22','1','3.21','3.21','73378.61','60187.50','2024-10-08 18:51:36','2024-10-08 18:51:36'),(273,144,'1','Chain','Normal','Normal','22','1','2.97','2.97','67892.36','57543.75','2024-10-09 19:21:28','2024-10-09 19:21:28'),(274,145,'1','Chain','Normal','Box chain','22','1','8.05','8.05','184018.01','150937.50','2024-10-11 14:03:37','2024-10-11 14:03:37'),(275,145,'2','Chain','Broken','Box chain','22','1','2.13','2.13','48690.48','39937.50','2024-10-11 14:03:37','2024-10-11 14:03:37'),(276,145,'3','Pendant','Normal','With Stone','22','1','1.07','1.05','24002.35','19687.50','2024-10-11 14:03:37','2024-10-11 14:03:37'),(277,146,'1','Chain','Normal','Machine Cut','22','1','24.45','24.45','558911.84','473718.75','2024-10-11 14:33:56','2024-10-11 14:33:56'),(278,146,'2','Ring','Normal','Normal','22','1','2.44','2.44','55776.89','47275.00','2024-10-11 14:33:56','2024-10-11 14:33:56'),(279,146,'3','Chain','Broken','Box chain','22','1','2.47','2.47','56462.67','47856.25','2024-10-11 14:33:56','2024-10-11 14:33:56'),(280,146,'4','Ring','Normal','Ladies Ring','22','1','2.22','2.22','50747.82','43012.50','2024-10-11 14:33:56','2024-10-11 14:33:56'),(281,146,'5','Pendant','Normal','With Stone','21','1','2.27','2.17','47350.07','40132.67','2024-10-11 14:33:56','2024-10-11 14:33:56'),(282,146,'6','Panchayuda','Out of Shape','Normal','18','1','1.06','1.06','19825.32','16803.41','2024-10-11 14:33:56','2024-10-11 14:33:56'),(283,147,'1','Chain','Normal','Flat Chain','22','1','7.56','7.56','172816.91','141750.00','2024-10-11 14:46:57','2024-10-11 14:46:57'),(284,147,'2','Pendant','Normal','With Stone','22','1','0.51','0.50','11429.69','9375.00','2024-10-11 14:46:57','2024-10-11 14:46:57'),(285,148,'1','Pendant','Normal','With Stone','21','1','0.82','0.72','15710.62','13315.91','2024-10-11 15:56:26','2024-10-11 15:56:26'),(286,148,'2','Panchayuda','Out of Shape','Normal','21','1','1.58','1.58','34476.09','29221.03','2024-10-11 15:56:26','2024-10-11 15:56:26'),(287,148,'3','Ring','Normal','Ladies Ring','21','1','0.65','0.63','13746.80','11651.42','2024-10-11 15:56:26','2024-10-11 15:56:26'),(288,148,'4','Ring','Normal','Ladies Ring','21','1','0.79','0.76','16583.44','14055.68','2024-10-11 15:56:26','2024-10-11 15:56:26'),(289,148,'5','Ring','Normal','With Stone','21','1','1.22','1.20','26184.37','22193.18','2024-10-11 15:56:26','2024-10-11 15:56:26'),(290,149,'1','Ring','Normal','Ladies Ring','22','1','2.06','2.06','47090.32','37337.50','2024-10-11 18:53:33','2024-10-11 18:53:33'),(291,150,'1','Chain','Normal','Snake Chain','22','1','7.94','7.94','181503.48','133987.50','2024-10-14 13:49:53','2024-10-14 13:49:53'),(292,151,'1','Ring','Out of Shape','Gents Ring','22','1','4.97','4.97','113611.12','90081.25','2024-10-14 14:11:32','2024-10-14 14:11:32'),(293,152,'1','Chain','Normal','Box chain','22','1','11.94','11.94','272941.00','231337.50','2024-10-14 15:40:24','2024-10-14 15:40:24'),(294,153,'1','Bangle','Normal','Normal','22','1','8.70','8.70','198876.61','168562.50','2024-10-14 15:44:09','2024-10-14 15:44:09'),(295,153,'2','Chain','Normal','Diamond Chain','22','1','11.90','11.90','272026.62','230562.50','2024-10-14 15:44:09','2024-10-14 15:44:09'),(296,153,'3','Chain','Normal','Flat Chain','22','1','12.18','12.18','278427.25','235987.50','2024-10-14 15:44:09','2024-10-14 15:44:09'),(297,154,'1','Chain','Normal','Flat Chain','22','1','7.94','7.94','181503.48','143912.50','2024-10-14 18:59:43','2024-10-14 18:59:43'),(298,155,'1','Ring','Normal','With Stone','18','1','0.71','0.68','12718.13','9388.64','2024-10-15 15:18:45','2024-10-15 15:18:45'),(299,155,'2','Studs','Normal','With Stone','18','1','1.10','1.00','18703.13','13806.82','2024-10-15 15:18:45','2024-10-15 15:18:45'),(300,156,'1','Chain','Normal','Box chain','22','1','8.00','8.00','182875.04','150000.00','2024-10-16 14:42:05','2024-10-16 14:42:05'),(301,157,'1','Ring','Normal','Normal','22','1','4.06','4.06','92809.08','76125.00','2024-10-16 14:45:11','2024-10-16 14:45:11'),(302,158,'1','Bracelet','Normal','Normal','22','1','3.10','3.10','70864.08','58125.00','2024-10-16 14:46:29','2024-10-16 14:46:29'),(303,159,'1','Pendant','Normal','With Stone','22','1','4.95','4.65','106296.12','87187.50','2024-10-16 14:47:47','2024-10-16 14:47:47'),(304,160,'1','Ring','Normal','Ladies Ring','22','1','1.68','1.68','38403.76','31500.00','2024-10-16 14:50:02','2024-10-16 14:50:02'),(305,160,'2','Panchayuda','Normal','With Stone','22','1','2.34','2.32','53033.76','43500.00','2024-10-16 14:50:02','2024-10-16 14:50:02'),(306,161,'1','Ring','Normal','Normal','19','1','1.34','1.34','26454.53','20975.57','2024-10-16 15:09:08','2024-10-16 15:09:08'),(307,161,'2','Pendant','Normal','Normal','19','1','0.70','0.70','13819.53','10957.39','2024-10-16 15:09:08','2024-10-16 15:09:08'),(308,162,'1','Chain','Out of Shape','Normal','22','1','2.33','2.33','53262.36','42231.25','2024-10-16 16:37:58','2024-10-16 16:37:58'),(309,163,'1','Bangle','Out of Shape','Normal','21','1','9.59','9.59','209256.77','177360.53','2024-10-16 18:01:20','2024-10-16 18:01:20'),(310,164,'1','Chain','Normal','Normal','22','1','24.00','24.00','548625.12','405000.00','2024-10-16 20:23:32','2024-10-16 20:23:32'),(311,165,'1','Ring','Normal','Normal','20','1','1.59','1.59','33042.19','26198.86','2024-10-18 15:13:40','2024-10-18 15:13:40'),(312,166,'1','Chain','Normal','Diamond Chain','21','1','8.05','8.05','175653.50','139274.18','2024-10-21 16:59:13','2024-10-21 16:59:13'),(313,167,'1','Bracelet','Normal','Normal','22','1','3.60','3.60','82293.77','67500.00','2024-10-21 17:16:40','2024-10-21 17:16:40'),(314,167,'2','Ring','Normal','Machine Cut','22','1','1.87','1.87','42747.04','35062.50','2024-10-21 17:16:40','2024-10-21 17:16:40'),(315,167,'3','Earings','Normal','With Stone','19','1','1.66','1.62','31982.35','26232.95','2024-10-21 17:16:40','2024-10-21 17:16:40'),(316,167,'4','Earings','Normal','With Stone','19','1','0.90','0.86','16978.28','13926.13','2024-10-21 17:16:40','2024-10-21 17:16:40'),(317,168,'1','Bangle','Out of Shape','Normal','22','1','8.19','8.19','187218.32','158681.25','2024-10-21 19:45:42','2024-10-21 19:45:42'),(318,168,'2','Bangle','Normal','Normal','22','1','7.90','7.90','180589.10','153062.50','2024-10-21 19:45:42','2024-10-21 19:45:42'),(319,169,'1','Chain','Normal','Diamond Chain','20','1','11.90','11.90','247296.88','182556.83','2024-10-22 15:19:51','2024-10-22 15:19:51'),(320,170,'1','Chain','Normal','Box chain','22','1','6.04','6.04','138070.66','117025.00','2024-10-24 15:18:34','2024-10-24 15:18:34'),(321,170,'2','Chain','Normal','Box chain','22','1','6.06','6.06','138527.84','117412.50','2024-10-24 15:18:34','2024-10-24 15:18:34'),(322,171,'1','Chain','Normal','Design','21','1','19.96','19.96','435533.39','369146.63','2024-10-24 16:49:58','2024-10-24 16:49:58'),(323,171,'2','Pendant','Normal','Normal','21','1','1.88','1.88','41022.18','34769.32','2024-10-24 16:49:58','2024-10-24 16:49:58'),(324,171,'3','Chain','Normal','Diamond Chain','22','1','10.03','10.03','229279.58','194331.25','2024-10-24 16:49:58','2024-10-24 16:49:58'),(325,172,'1','Chain','Normal','Design','22','1','4.00','4.00','91437.52','72500.00','2024-10-24 20:00:04','2024-10-24 20:00:04'),(326,172,'2','Bracelet','Normal','Design','22','1','2.30','2.30','52576.57','41687.50','2024-10-24 20:00:04','2024-10-24 20:00:04'),(327,173,'1','Ring','Normal','Design','21','1','3.52','3.52','76807.49','63000.01','2024-10-25 15:01:17','2024-10-25 15:01:17'),(328,174,'1','Chain','Normal','Box chain','20','1','7.86','7.86','163340.63','129511.34','2024-10-25 15:10:25','2024-10-25 15:10:25'),(329,175,'1','Chain','Normal','Flat Chain','22','1','5.83','5.73','130984.25','111018.75','2024-10-25 15:47:06','2024-10-25 15:47:06'),(330,176,'1','Chain','Normal','Normal','20','1','2.50','2.50','51953.13','41193.18','2024-10-25 19:34:46','2024-10-25 19:34:46'),(331,177,'1','Chain','Normal','Box chain','22','1','24.05','24.05','549768.09','465968.75','2024-10-28 16:24:07','2024-10-28 16:24:07'),(332,178,'1','Ring','Normal','Ladies Ring','21','1','4.35','4.35','94918.35','80450.29','2024-10-29 18:23:17','2024-10-29 18:23:17'),(333,178,'2','Chain','Normal','With Pendant','20','1','4.45','4.35','90398.44','76619.33','2024-10-29 18:23:17','2024-10-29 18:23:17'),(334,179,'1','Chain','Out of Shape','Design','18','1','1.34','1.34','25062.19','20556.82','2024-10-30 21:00:40','2024-10-30 21:00:40'),(335,180,'1','Chain','Normal','Box chain','22','1','7.97','7.97','182189.26','149437.50','2024-10-30 21:03:23','2024-10-30 21:03:23'),(336,181,'1','Ring','Out of Shape','Ladies Ring','21','1','2.70','2.70','58914.84','46713.08','2024-10-31 20:10:22','2024-10-31 20:10:22'),(337,182,'1','Chain','Normal','Box chain','22','1','5.07','5.07','115897.06','85556.25','2024-11-01 14:41:55','2024-11-01 14:41:55'),(338,183,'1','Chain','Normal','Normal','22','1','4.03','4.03','92123.30','75562.50','2024-11-02 14:27:28','2024-11-02 14:27:28'),(339,183,'2','Chain','Normal','Box chain','22','1','3.96','3.96','90523.14','74250.00','2024-11-02 14:27:28','2024-11-02 14:27:28'),(340,183,'3','Ring','Normal','With Stone','21','1','1.74','1.64','35785.31','29352.28','2024-11-02 14:27:28','2024-11-02 14:27:28'),(341,183,'4','Ring','Normal','Ladies Ring','21','1','1.28','1.18','25747.97','21119.32','2024-11-02 14:27:28','2024-11-02 14:27:28'),(342,183,'5','Bracelet','Normal','Design','18','1','2.54','2.50','46757.83','38352.28','2024-11-02 14:27:28','2024-11-02 14:27:28'),(343,184,'1','Chain','Normal','Diamond Chain','21','1','7.85','7.85','171289.43','140497.18','2024-11-04 15:28:26','2024-11-04 15:28:26'),(344,185,'1','Chain','Normal','Diamond Chain','20','1','5.89','5.89','122401.56','100397.70','2024-11-05 16:21:55','2024-11-05 16:21:55'),(345,186,'1','Chain','Part Missing','Box chain','21','1','2.46','2.46','53677.96','45496.03','2024-11-06 14:50:14','2024-11-06 14:50:14'),(346,186,'2','Bracelet','Out of Shape','Normal','20','1','3.33','3.33','69201.56','58653.42','2024-11-06 14:50:14','2024-11-06 14:50:14'),(347,187,'1','Bracelet','Normal','Design','21','1','3.82','3.82','83353.58','75206.25','2024-11-06 15:31:00','2024-11-06 15:31:00'),(348,188,'1','Ring','Normal','Ladies Ring','22','1','2.00','1.90','43432.82','39187.50','2024-11-06 17:03:57','2024-11-06 17:03:57'),(349,188,'2','Ring','Normal','Ladies Ring','20','1','1.34','1.20','24937.50','22500.00','2024-11-06 17:03:57','2024-11-06 17:03:57'),(350,188,'3','Ring','Normal','Ladies Ring','22','1','1.35','1.30','29717.19','26812.50','2024-11-06 17:03:57','2024-11-06 17:03:57'),(351,188,'4','Ring','Normal','With Stone','20','1','1.34','1.24','25768.75','23250.00','2024-11-06 17:03:57','2024-11-06 17:03:57'),(352,188,'5','Ring','Normal','With Stone','21','1','0.44','0.40','8728.12','7875.00','2024-11-06 17:03:57','2024-11-06 17:03:57'),(353,189,'1','Bangle','Normal','Normal','22','1','8.70','8.70','198876.61','179437.50','2024-11-07 17:48:35','2024-11-07 17:48:35'),(354,189,'2','Chain','Normal','Flat Chain','22','1','12.18','12.18','278427.25','251212.50','2024-11-07 17:48:35','2024-11-07 17:48:35'),(355,189,'3','Chain','Normal','Diamond Chain','22','1','11.90','11.90','272026.62','245437.50','2024-11-07 17:48:35','2024-11-07 17:48:35'),(356,190,'1','Chain','Normal','Diamond Chain','20','1','7.85','7.85','163132.81','147187.50','2024-11-07 18:00:23','2024-11-07 18:00:23'),(357,191,'1','Bracelet','Normal','Flat Chain','21','1','3.60','3.60','78553.12','70875.00','2024-11-08 16:56:11','2024-11-08 16:56:11'),(358,192,'1','Chain','Normal','Box chain','22','1','7.97','7.97','182189.26','164381.25','2024-11-08 17:06:31','2024-11-08 17:06:31'),(359,192,'2','Chain','Normal','Box chain','22','1','7.97','7.97','182189.26','164381.25','2024-11-08 17:06:31','2024-11-08 17:06:31'),(360,193,'1','Chain','Normal','Snake Chain','22','1','9.21','9.21','210534.89','189956.25','2024-11-08 18:20:23','2024-11-08 18:20:23'),(361,193,'2','Bangle','Normal','Machine Cut','22','1','12.59','12.59','287799.59','259668.75','2024-11-08 18:20:23','2024-11-08 18:20:23'),(362,193,'3','Ring','Normal','Ladies Ring','22','1','6.03','6.03','137842.06','124368.75','2024-11-08 18:20:23','2024-11-08 18:20:23'),(363,193,'4','Ring','Normal','Ladies Ring','22','1','1.23','1.23','28117.04','25368.75','2024-11-08 18:20:23','2024-11-08 18:20:23'),(364,194,'1','Ring','Normal','Ladies Ring','21','1','1.59','1.59','34694.29','31303.13','2024-11-08 19:52:15','2024-11-08 19:52:15'),(365,195,'1','Ring','Normal','Ladies Ring','22','1','2.70','2.70','61720.33','48937.50','2024-11-08 21:13:23','2024-11-08 21:13:23'),(366,196,'1','Bracelet','Normal','Flat Chain','22','1','8.00','8.00','182875.04','165000.00','2024-11-08 21:42:27','2024-11-08 21:42:27'),(367,196,'2','Panchayuda','Out of Shape','Normal','21','1','0.43','0.43','9382.73','8465.63','2024-11-08 21:42:27','2024-11-08 21:42:27'),(368,196,'3','Ring','Normal','Normal','21','1','0.68','0.68','14837.81','13387.50','2024-11-08 21:42:27','2024-11-08 21:42:27'),(369,196,'4','Pendant','Normal','With Stone','21','1','0.84','0.84','18329.06','16537.50','2024-11-08 21:42:27','2024-11-08 21:42:27'),(370,197,'1','Chain','Normal','Box chain','22','1','16.14','16.14','368950.39','332887.50','2024-11-08 21:55:32','2024-11-08 21:55:32'),(371,198,'1','Ring','Normal','Normal','21','1','2.01','2.01','43858.82','40771.02','2024-11-09 14:17:58','2024-11-09 14:17:58'),(372,198,'2','Ring','Normal','Normal','21','1','4.12','4.12','89899.68','83570.45','2024-11-09 14:17:58','2024-11-09 14:17:58'),(373,198,'3','Ring','Normal','Gents Ring','21','1','3.73','3.73','81389.76','75659.66','2024-11-09 14:17:58','2024-11-09 14:17:58'),(374,198,'4','Ring','Normal','Normal','21','1','1.91','1.91','41676.79','38742.61','2024-11-09 14:17:58','2024-11-09 14:17:58'),(375,198,'5','Chain','Normal','Flat Chain','21','1','11.68','11.68','254861.22','236918.17','2024-11-09 14:17:58','2024-11-09 14:17:58'),(376,199,'1','Chain','Part Missing','Machine Cut','18','1','3.52','3.52','65835.02','55799.99','2024-11-11 14:23:08','2024-11-11 14:23:08'),(377,200,'1','Chain','Normal','Diamond Chain','20','1','3.97','3.97','82501.56','74437.50','2024-11-11 14:34:44','2024-11-11 14:34:44'),(378,201,'1','Bracelet','Normal','Normal','21','1','3.44','3.44','75061.87','65672.73','2024-11-11 17:57:07','2024-11-11 17:57:07'),(379,201,'2','Chain','Broken','With Pendant','21','1','4.35','4.30','93827.33','82090.91','2024-11-11 17:57:07','2024-11-11 17:57:07'),(380,202,'1','Chain','Normal','Box chain','22','1','8.00','8.00','182875.04','165000.00','2024-11-11 18:35:37','2024-11-11 18:35:37'),(381,203,'1','Ring','Out of Shape','Normal','22','1','3.90','3.90','89151.58','78000.00','2024-11-12 14:45:14','2024-11-12 14:45:14'),(382,203,'2','Ring','Out of Shape','With Stone','22','1','1.02','0.96','21945.00','19200.00','2024-11-12 14:45:14','2024-11-12 14:45:14'),(383,204,'1','Chain','Normal','Flat Chain','22','1','15.88','15.88','363006.95','327525.00','2024-11-12 18:18:59','2024-11-12 18:18:59'),(384,205,'1','Bracelet','Normal','Design','22','1','1.31','1.31','29945.79','27018.75','2024-11-12 18:26:27','2024-11-12 18:26:27'),(385,205,'2','Chain','Normal','With Stone','22','1','2.87','2.84','64920.64','58575.00','2024-11-13 09:11:23','2024-11-12 18:26:27'),(386,206,'1','Chain','Broken','Flat Chain','22','1','5.80','5.80','132584.40','119625.00','2024-11-12 18:45:53','2024-11-12 18:45:53'),(387,206,'2','Chain','Broken','Singapore Chain','22','1','2.00','2.00','45718.76','41250.00','2024-11-12 18:45:53','2024-11-12 18:45:53'),(388,206,'3','Chain','Broken','Singapore Chain','22','1','1.50','1.50','34289.07','30937.50','2024-11-12 18:45:53','2024-11-12 18:45:53'),(389,206,'4','Earings','Normal','Normal','18','1','0.54','0.54','10099.69','9112.50','2024-11-12 18:45:53','2024-11-12 18:45:53'),(390,206,'5','Chain','Normal','Box chain','22','1','6.03','6.03','137842.06','124368.75','2024-11-12 18:45:53','2024-11-12 18:45:53'),(391,206,'6','Pendant','Normal','With Stone','18','1','0.80','0.70','13092.19','11812.50','2024-11-12 18:45:53','2024-11-12 18:45:53'),(392,207,'1','Chain','Normal','Curb Chain','22','1','19.81','19.81','452844.32','408581.25','2024-11-12 21:34:09','2024-11-12 21:34:09'),(393,208,'1','Chain','Normal','Design','22','1','19.39','19.39','443243.38','412037.50','2024-11-16 17:12:31','2024-11-16 17:12:31'),(394,209,'1','Chain','Normal','Flat Chain','22','1','5.04','5.04','115211.28','107100.00','2024-11-16 17:20:20','2024-11-16 17:20:20'),(395,209,'2','Ring','Normal','Gents Ring','22','1','4.06','4.06','92809.08','86275.00','2024-11-16 17:20:20','2024-11-16 17:20:20'),(396,209,'3','Pendant','Normal','Design','22','1','2.02','2.02','46175.95','42925.00','2024-11-16 17:20:20','2024-11-16 17:20:20'),(397,210,'1','Bangle','Normal','Design','22','1','10.40','10.40','237737.55','188500.00','2024-11-18 17:27:36','2024-11-18 17:27:36'),(398,211,'1','Chain','Normal','With Pendant','22','1','41.97','41.97','959408.18','760706.25','2024-11-18 17:31:03','2024-11-18 17:31:03'),(399,212,'1','Chain','Normal','Flat Chain','22','1','4.54','4.54','103781.59','82287.50','2024-11-20 15:49:38','2024-11-20 15:49:38'),(400,213,'1','Chain','Normal','Design','21','1','1.42','1.42','30984.84','25414.78','2024-11-20 20:20:49','2024-11-20 20:20:49'),(401,214,'1','Chain','Normal','With Pendant','22','1','9.54','9.54','218078.49','184837.50','2024-11-20 22:17:43','2024-11-20 22:17:43'),(402,214,'2','Bracelet','Normal','Normal','22','1','2.81','2.81','64234.86','54443.75','2024-11-20 22:17:43','2024-11-20 22:17:43'),(403,215,'1','Chain','Normal','Box chain','22','1','4.08','4.08','93266.27','79050.00','2024-11-21 15:09:02','2024-11-21 15:09:02'),(404,216,'1','Chain','Normal','Singapore Chain','22','1','7.49','7.49','171216.76','135756.25','2024-11-21 17:13:33','2024-11-21 17:13:33'),(405,216,'2','Pendant','Normal','Normal','20','1','3.87','3.87','80423.44','63767.03','2024-11-21 17:13:33','2024-11-21 17:13:33'),(406,217,'1','Chain','Normal','Box chain','21','1','3.55','3.55','77462.10','61419.05','2024-11-21 17:14:55','2024-11-21 17:14:55'),(407,218,'1','Ring','Normal','Ladies Ring','22','1','1.44','1.44','32917.51','27000.00','2024-11-21 18:24:35','2024-11-21 18:24:35'),(408,219,'1','Chain','Out of Shape','Flat Chain','21','1','5.87','5.87','128085.22','108561.66','2024-11-27 15:15:26','2024-11-27 15:15:26'),(409,220,'1','Chain','Normal','Box chain','22','1','4.03','4.03','92123.30','78081.25','2024-11-27 16:43:23','2024-11-27 16:43:23'),(410,220,'2','Chain','Broken','Box chain','22','1','3.96','3.96','90523.14','76725.00','2024-11-27 16:43:23','2024-11-27 16:43:23'),(411,221,'1','Chain','Normal','Design','22','1','3.50','3.50','80007.83','67812.50','2024-11-28 16:42:55','2024-11-28 16:42:55'),(412,222,'1','Ring','Out of Shape','Design','21','1','1.47','1.47','32075.86','27186.65','2024-11-28 20:14:49','2024-11-28 20:14:49'),(413,222,'2','Ring','Normal','Design','18','1','0.70','0.66','12344.07','10462.50','2024-11-28 20:14:49','2024-11-28 20:14:49'),(414,223,'1','Chain','Normal','Box chain','22','1','7.77','7.77','177617.38','169968.75','2024-11-29 16:31:35','2024-11-29 16:31:35'),(415,223,'2','Chain','Normal','Flat Chain','22','1','15.35','15.35','350891.48','335781.25','2024-11-29 16:31:35','2024-11-29 16:31:35'),(416,223,'3','Chain','Normal','Singapore Chain','22','1','3.54','3.54','80922.21','77437.50','2024-11-29 16:31:35','2024-11-29 16:31:35'),(417,223,'4','Ring','Out of Shape','Design','22','1','2.55','2.50','57148.45','54687.50','2024-11-29 16:31:35','2024-11-29 16:31:35'),(418,223,'5','Pendant','Normal','Design','22','1','5.72','5.40','123440.65','118125.00','2024-11-29 16:31:35','2024-11-29 16:31:35'),(419,224,'1','Bracelet','Normal','Design','21','1','2.59','2.59','56514.60','46355.12','2024-11-29 18:36:05','2024-11-29 18:36:05'),(420,224,'2','Earings','Normal','Normal','18','1','1.67','1.67','31234.23','25619.32','2024-11-29 18:36:05','2024-11-29 18:36:05'),(421,225,'1','Chain','Normal','Diamond Chain','20','1','11.80','11.80','245218.75','194431.79','2024-12-02 15:33:48','2024-12-02 15:33:48'),(422,226,'1','Ring','Normal','Ring with Enamle','20','1','1.74','1.74','36159.38','30647.73','2024-12-02 19:10:56','2024-12-02 19:10:56'),(423,227,'1','Pendant','Normal','Design','22','1','3.60','3.60','82293.77','69750.00','2024-12-04 19:02:52','2024-12-04 19:02:52'),(424,228,'1','Bracelet','Normal','Normal','22','1','2.52','2.52','57605.64','47250.00','2024-12-09 16:51:56','2024-12-09 16:51:56'),(425,228,'2','Chain','Normal','Box chain','22','1','5.80','5.80','132584.40','108750.00','2024-12-09 16:51:56','2024-12-09 16:51:56'),(426,228,'3','Chain','Normal','Box chain','22','1','2.33','2.33','53262.36','43687.50','2024-12-09 16:51:56','2024-12-09 16:51:56'),(427,229,'1','Chain','Normal','Diamond Chain','22','1','23.65','23.65','540624.34','517343.75','2024-12-09 18:35:58','2024-12-09 18:35:58'),(428,230,'1','Chain','Normal','Curb Chain','22','1','19.80','19.80','452615.72','433125.00','2024-12-10 17:42:32','2024-12-10 17:42:32'),(429,231,'1','Chain','Normal','With Pendant','18','1','1.38','1.36','25436.26','20863.64','2024-12-12 16:01:26','2024-12-12 16:01:26'),(430,232,'1','Necklace','Broken','Normal','21','1','14.45','14.45','315303.48','267242.92','2024-12-13 18:11:15','2024-12-13 18:11:15'),(431,233,'1','Chain','Normal','With Pendant','22','1','10.81','10.71','244823.96','200812.50','2024-12-13 19:00:53','2024-12-13 19:00:53'),(432,234,'1','Bracelet','Normal','Normal','20','1','7.93','7.93','164795.31','121653.42','2024-12-16 18:44:50','2024-12-16 18:44:50'),(433,234,'2','Bracelet','Normal','Design','20','1','3.36','3.36','69825.00','51545.46','2024-12-16 18:44:50','2024-12-16 18:44:50'),(434,235,'1','Pendant','Normal','With Stone','18','1','1.70','1.50','28054.69','23011.36','2024-12-17 15:47:14','2024-12-17 15:47:14'),(435,235,'2','Chain','Normal','Ladies Ring','16','1','0.71','0.61','11408.91','9357.96','2024-12-17 15:47:14','2024-12-17 15:47:14'),(436,235,'3','Earings','Out of Shape','With Stone','16','1','1.10','0.80','14962.50','12272.73','2024-12-17 15:47:14','2024-12-17 15:47:14'),(437,236,'1','Ring','Normal','Gents Ring','22','1','4.10','4.10','93723.46','69187.50','2024-12-17 16:33:41','2024-12-17 16:33:41'),(438,237,'1','Ring','Normal','Normal','16','1','1.01','1.01','16791.25','13772.72','2024-12-17 16:53:10','2024-12-17 16:53:10'),(439,238,'1','Chain','Normal','Design','22','1','19.96','19.96','456273.22','374250.00','2024-12-17 18:36:47','2024-12-17 18:36:47'),(440,238,'2','Pendant','Normal','Design','22','1','1.88','1.88','42975.63','35250.00','2024-12-17 18:36:47','2024-12-17 18:36:47'),(441,238,'3','Chain','Normal','Design','22','1','10.03','10.03','229279.58','188062.50','2024-12-17 18:36:47','2024-12-17 18:36:47'),(442,239,'1','Ring','Normal','Design','20','1','2.70','2.70','56109.38','46022.72','2024-12-17 18:50:41','2024-12-17 18:50:41'),(443,240,'1','Chain','Normal','With Pendant','22','1','9.44','9.44','215792.55','177000.00','2024-12-17 19:04:27','2024-12-17 19:04:27'),(444,240,'2','Chain','Normal','Flat Chain','22','1','9.94','9.93','226993.64','186187.50','2024-12-17 19:04:27','2024-12-17 19:04:27'),(445,241,'1','Ring','Normal','Ladies Ring','22','1','4.04','4.04','92351.90','68175.00','2024-12-17 19:25:29','2024-12-17 19:25:29'),(446,242,'1','Panchayuda','Out of Shape','Normal','16','1','1.49','1.49','24771.25','20318.18','2024-12-18 15:43:34','2024-12-18 15:43:34'),(447,242,'2','Gypsies','Out of Shape','Normal','16','1','1.06','1.00','16625.00','13636.36','2024-12-18 15:43:34','2024-12-18 15:43:34'),(448,243,'1','Ring','Normal','Normal','22','1','4.97','4.97','113611.12','96293.75','2024-12-19 18:42:14','2024-12-19 18:42:14'),(449,243,'2','Ring','Normal','Normal','22','1','2.06','2.06','47090.32','39912.50','2024-12-19 18:42:14','2024-12-19 18:42:14'),(450,244,'1','Chain','Normal','Normal','22','1','7.78','7.78','177845.98','165325.00','2024-12-20 19:39:11','2024-12-20 19:39:11'),(451,244,'2','Chain','Normal','Normal','22','1','15.35','15.35','350891.48','326187.50','2024-12-20 19:39:11','2024-12-20 19:39:11'),(452,244,'3','Pendant','Out of Shape','With Stone','22','4','5.73','5.40','0.00','114750.00','2024-12-20 19:39:11','2024-12-20 19:39:11'),(453,244,'4','Chain','Normal','Normal','22','1','3.52','3.52','80465.02','74800.00','2024-12-20 19:39:11','2024-12-20 19:39:11'),(454,244,'5','Ring','Normal','With Stone','22','1','2.56','2.50','57148.45','53125.00','2024-12-20 19:39:11','2024-12-20 19:39:11'),(455,245,'1','Chain','Normal','Box chain','22','1','11.96','11.96','273398.18','254150.00','2024-12-23 18:58:15','2024-12-23 18:58:15'),(456,246,'1','Bracelet','Normal','Design','22','1','7.97','7.97','182189.26','169362.50','2024-12-23 19:01:40','2024-12-23 19:01:40'),(457,247,'1','Ring','Normal','Normal','22','1','7.98','7.98','182417.85','169575.00','2024-12-23 19:03:22','2024-12-23 19:03:22'),(458,248,'1','Ring','Normal','With Stone','22','1','4.06','4.04','92351.90','85850.00','2024-12-23 19:19:53','2024-12-23 19:19:53'),(459,249,'1','Pendant','Normal','With Stone','22','1','4.95','4.65','106296.12','98812.50','2024-12-23 19:24:03','2024-12-23 19:24:03'),(460,250,'1','Ring','Normal','Normal','22','1','1.68','1.68','38403.76','35700.00','2024-12-23 19:29:10','2024-12-23 19:29:10'),(461,250,'2','Panchayuda','Normal','With Stone','22','1','2.34','2.32','53033.76','49300.00','2024-12-23 19:29:10','2024-12-23 19:29:10'),(462,251,'1','Bracelet','Normal','Design','22','1','3.10','3.10','70864.08','65875.00','2024-12-23 19:35:47','2024-12-23 19:35:47'),(463,252,'1','Chain','Normal','Box chain','22','1','8.00','8.00','182875.04','170000.00','2024-12-23 19:38:59','2024-12-23 19:38:59'),(464,253,'1','Earings','Out of Shape','With Stone','18','1','1.33','1.24','23191.88','21559.09','2024-12-24 17:59:27','2024-12-24 17:59:27'),(465,254,'1','Chain','Out of Shape','Normal','21','1','5.42','5.36','116956.86','92734.11','2024-12-27 14:22:31','2024-12-27 14:22:31'),(466,255,'1','Chain','Out of Shape','Diamond Chain','22','1','7.96','7.96','181960.66','169150.00','2024-12-27 18:49:20','2024-12-27 18:49:20'),(467,255,'2','Chain','Normal','Box chain','22','1','7.99','7.99','182646.45','169787.50','2024-12-27 18:49:20','2024-12-27 18:49:20'),(468,255,'3','Ring','Normal','Gents Ring','22','1','5.48','5.48','125269.40','116450.00','2024-12-27 18:49:20','2024-12-27 18:49:20'),(469,255,'4','Bangle','Out of Shape','Normal','22','1','7.96','7.96','181960.66','169150.00','2024-12-27 18:49:20','2024-12-27 18:49:20'),(470,256,'1','Chain','Normal','Flat Chain','21','1','10.04','10.04','219075.91','203652.26','2024-12-28 15:23:19','2024-12-28 15:23:19'),(471,256,'2','Bracelet','Normal','Flat Bracelet','18','1','6.06','6.06','113340.97','105361.34','2024-12-28 15:23:19','2024-12-28 15:23:19'),(472,256,'3','Ring','Normal','Normal','21','1','6.03','6.03','131576.47','122313.06','2024-12-28 15:23:19','2024-12-28 15:23:19'),(473,256,'4','Ring','Out of Shape','Design','21','1','3.26','3.26','71134.21','66126.13','2024-12-28 15:23:19','2024-12-28 15:23:19'),(474,256,'5','Chain','Normal','With Stone','20','1','12.19','12.19','253323.44','235488.61','2024-12-28 15:23:19','2024-12-28 15:23:19'),(475,256,'6','Ring','Normal','Design','19','1','1.99','1.99','39286.96','36521.02','2024-12-28 15:23:19','2024-12-28 15:23:19'),(476,256,'7','Ring','Out of Shape','With Stone','18','1','1.79','1.79','33478.60','31121.58','2024-12-28 15:23:19','2024-12-28 15:23:19'),(477,257,'1','Chain','Normal','Box chain','21','1','2.53','2.53','55205.38','51318.75','2024-12-30 13:54:20','2024-12-30 13:54:20'),(478,258,'1','Chain','Normal','Box chain','20','1','15.82','15.45','321070.31','263352.20','2024-12-30 14:53:19','2024-12-30 14:53:19'),(479,259,'1','Chain','Out of Shape','Singapore Chain','21','1','2.34','2.32','50623.12','40138.64','2024-12-30 19:29:25','2024-12-30 19:29:25'),(480,260,'1','Ring','Out of Shape','With Stone','17','1','0.70','0.64','11305.00','9272.73','2024-12-30 21:17:49','2024-12-30 21:17:49'),(481,260,'2','Ring','Out of Shape','With Stone','17','1','0.61','0.57','10068.51','8258.52','2024-12-30 21:17:49','2024-12-30 21:17:49'),(482,261,'1','Chain','Normal','Box chain','20','1','15.82','15.79','328135.94','269147.66','2024-12-31 14:48:55','2024-12-31 14:48:55'),(483,262,'1','Necklace','Normal','Design','22','1','20.03','20.03','457873.38','388081.25','2024-12-31 15:04:21','2024-12-31 15:04:21'),(484,263,'1','Earings','Out of Shape','Normal','16','1','1.11','1.00','16625.00','13636.36','2025-01-01 16:18:19','2025-01-01 16:18:19'),(485,264,'1','Bracelet','Normal','Normal','22','1','1.96','1.96','44804.38','40425.00','2025-01-01 16:26:06','2025-01-01 16:26:06'),(486,265,'1','Ring','Out of Shape','Normal','16','1','1.48','1.45','24106.25','17795.46','2025-01-04 18:18:47','2025-01-04 18:18:47'),(487,266,'1','Bracelet','Out of Shape','Design','19','1','6.19','6.19','122204.16','100235.78','2025-01-06 16:08:54','2025-01-06 16:08:54'),(488,266,'2','Chain','Out of Shape','With Pendant','18','1','3.16','3.16','59101.89','48477.28','2025-01-06 16:08:54','2025-01-06 16:08:54'),(489,267,'2','Pendant','Normal','Design','20','1','2.14','2.14','44471.88','36477.26','2025-01-06 16:22:25','2025-01-06 16:22:25'),(490,267,'2','Chain','Normal','Singapore Chain','19','1','0.84','0.82','16188.60','13278.41','2025-01-06 16:22:25','2025-01-06 16:22:25'),(491,268,'2','Ring','Out of Shape','With Stone','16','1','0.37','0.32','5985.00','4909.09','2025-01-06 17:06:42','2025-01-06 17:06:42'),(492,268,'2','Chain','Out of Shape','Normal','17','1','1.38','1.36','24023.12','19704.55','2025-01-06 17:06:42','2025-01-06 17:06:42'),(493,269,'2','Ring','Broken','Normal','16','1','0.45','0.45','7948.83','6519.89','2025-01-06 18:10:39','2025-01-06 18:10:39'),(494,269,'2','Panchayuda','Out of Shape','Normal','16','1','0.82','0.82','14484.53','11880.68','2025-01-06 18:10:39','2025-01-06 18:10:39'),(495,270,'1','Ring','Normal','With Stone','22','1','4.00','3.98','90980.33','82087.50','2025-01-06 21:37:38','2025-01-06 21:37:38'),(496,271,'1','Chain','Out of Shape','Diamond Chain','21','1','5.48','5.48','119575.30','107887.50','2025-01-06 21:39:39','2025-01-06 21:39:39'),(497,272,'1','Studs','Out of Shape','Normal','17','1','1.77','1.77','31265.39','28209.38','2025-01-07 15:36:18','2025-01-07 15:36:18'),(498,273,'1','Ring','Out of Shape','Normal','18','1','1.07','1.07','20012.35','18603.41','2025-01-07 17:00:31','2025-01-07 17:00:31'),(499,274,'1','Chain','Out of Shape','Flat Chain','21','1','4.89','4.89','106701.32','96271.88','2025-01-08 18:06:30','2025-01-08 18:06:30'),(500,275,'1','Pendant','Normal','Design','21','1','6.38','6.38','139213.58','125606.25','2025-01-08 18:10:09','2025-01-08 18:10:09'),(501,275,'2','Bracelet','Out of Shape','Flat Bracelet','21','1','2.06','2.06','44949.84','40556.25','2025-01-08 18:10:09','2025-01-08 18:10:09'),(502,276,'1','Chain','Broken','Diamond Chain','22','1','9.82','9.82','224479.11','208675.00','2025-01-08 18:57:37','2025-01-08 18:57:37'),(503,277,'1','Chain','Normal','Box chain','20','1','15.82','15.79','328135.94','269147.66','2025-01-09 14:37:29','2025-01-09 14:37:29'),(504,278,'1','Ring','Out of Shape','With Stone','18','1','0.80','0.78','14588.44','13561.36','2025-01-10 18:07:40','2025-01-10 18:07:40'),(505,278,'2','Pendant','Out of Shape','With Stone','18','1','0.78','0.75','14027.35','13039.77','2025-01-10 18:07:40','2025-01-10 18:07:40'),(506,279,'1','Ring','Out of Shape','With Stone','17','1','0.43','0.41','7242.26','6732.38','2025-01-11 16:54:47','2025-01-11 16:54:47'),(507,279,'2','Earings','Out of Shape','With Stone','16','1','0.72','0.66','11658.28','10837.50','2025-01-11 16:54:47','2025-01-11 16:54:47'),(508,280,'1','Chain','Normal','Flat Chain','20','1','2.51','2.51','52160.94','47062.50','2025-01-15 14:28:42','2025-01-15 14:28:42'),(509,281,'1','Ring','Normal','Normal','21','1','1.59','1.59','34694.29','32251.70','2025-01-15 15:13:51','2025-01-15 15:13:51'),(510,282,'1','Earings','Out of Shape','Normal','16','1','1.83','1.77','29426.25','27354.55','2025-01-15 19:10:23','2025-01-15 19:10:23'),(511,282,'2','Earings','Out of Shape','With Stone','16','1','0.76','0.72','11970.00','11127.28','2025-01-15 19:10:23','2025-01-15 19:10:23'),(512,282,'3','Earings','Out of Shape','Normal','16','1','0.51','0.38','6317.50','5872.73','2025-01-15 19:10:23','2025-01-15 19:10:23'),(513,282,'4','Earings','Out of Shape','Normal','16','1','0.42','0.36','5985.00','5563.64','2025-01-15 19:10:23','2025-01-15 19:10:23'),(514,283,'1','Bracelet','Out of Shape','Normal','21','1','18.21','18.21','397347.85','358509.38','2025-01-15 19:19:30','2025-01-15 19:19:30'),(515,284,'1','Ring','Normal','Normal','22','1','5.14','5.14','117497.21','109225.00','2025-01-15 21:08:37','2025-01-15 21:08:37'),(516,284,'2','Ring','Normal','Normal','22','1','4.04','4.04','92351.90','85850.00','2025-01-15 21:08:37','2025-01-15 21:08:37'),(517,285,'1','Chain','Normal','Box chain','22','1','5.80','5.80','132584.40','123250.00','2025-01-15 21:14:37','2025-01-15 21:14:37'),(518,285,'2','Chain','Normal','Box chain','22','1','2.33','2.33','53262.36','49512.50','2025-01-15 21:14:37','2025-01-15 21:14:37'),(519,285,'3','Bracelet','Normal','Flat Chain','22','1','2.52','2.52','57605.64','53550.00','2025-01-15 21:14:37','2025-01-15 21:14:37'),(520,286,'1','Chain','Normal','Flat Chain','22','1','3.56','3.56','81379.39','73425.00','2025-01-16 14:24:05','2025-01-16 14:24:05'),(521,287,'1','Chain','Normal','Box chain','22','1','5.89','5.89','134641.75','121481.25','2025-01-16 14:34:59','2025-01-16 14:34:59'),(522,287,'2','Chain','Normal','Box chain','22','1','3.99','3.99','91208.93','82293.75','2025-01-16 14:34:59','2025-01-16 14:34:59'),(523,288,'1','Ring','Normal','Design','21','1','3.52','3.52','76807.49','69300.00','2025-01-16 20:02:52','2025-01-16 20:02:52'),(524,289,'1','Chain','Normal','Diamond Chain','22','1','11.31','11.31','258539.59','233268.75','2025-01-17 14:41:07','2025-01-17 14:41:07'),(525,290,'1','Ring','Out of Shape','Design','20','1','5.13','5.13','106607.81','93272.74','2025-01-17 18:34:17','2025-01-17 18:34:17'),(526,290,'2','Bangle','Out of Shape','Design','19','1','6.06','6.06','119637.67','104672.74','2025-01-17 18:34:17','2025-01-17 18:34:17'),(527,291,'1','Chain','Normal','Flat Chain','21','1','8.02','8.02','174998.89','153109.10','2025-01-17 18:36:20','2025-01-17 18:36:20'),(528,292,'1','Chain','Out of Shape','With Pendant','22','1','6.55','6.52','149043.16','134475.00','2025-01-20 18:29:15','2025-01-20 18:29:15'),(529,293,'1','Chain','Normal','Box chain','21','1','11.92','11.92','260098.10','234675.00','2025-01-20 18:42:09','2025-01-20 18:42:09'),(530,294,'1','Earings','Out of Shape','Normal','16','1','1.85','1.83','30423.75','27450.00','2025-01-20 18:51:55','2025-01-20 18:51:55'),(531,295,'1','Chain','Out of Shape','Ladies Ring','16','1','5.00','4.00','66500.00','52727.28','2025-01-20 17:10:42','2025-01-20 17:10:42'),(532,296,'1','Ring','Out of Shape','With Stone','16','1','4.00','3.00','49875.00','42272.73','2025-02-02 11:16:31','2025-02-02 11:16:31'),(533,297,'1','Bracelet','Normal','Ladies Ring','16','1','4.00','4.00','66500.00','56363.64','2025-02-03 10:18:55','2025-02-03 10:18:55'),(534,298,'1','Bracelet','Normal','Ladies Ring','19','1','5.00','4.00','78968.76','66931.80','2025-02-11 08:07:20','2025-02-11 08:07:20');
/*!40000 ALTER TABLE `pawning_ticket_has_article` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pawning_ticket_has_images`
--

DROP TABLE IF EXISTS `pawning_ticket_has_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pawning_ticket_has_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pawning_id` int NOT NULL,
  `image` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pawning_ticket_has_images`
--

LOCK TABLES `pawning_ticket_has_images` WRITE;
/*!40000 ALTER TABLE `pawning_ticket_has_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `pawning_ticket_has_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Date_time` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Ticket_no` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Bank_id` int DEFAULT NULL,
  `Note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `Slip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `User` int NOT NULL,
  `Status` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Comment` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Ticket_Date` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '-',
  `Maturity_Date` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '-',
  `Service_Charge_Date` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '-',
  `Day_Count` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '0',
  `Advance_Payment` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '0',
  `Service_Charge_Payment` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '0',
  `Interest_Payment` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '0',
  `Other_Charges_Payment` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '0',
  `Late_Charges_Payment` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '0',
  `Early_Charge_Payment` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT '0',
  `Type` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '-',
  PRIMARY KEY (`id`),
  KEY `fk_user_` (`User`),
  CONSTRAINT `fk_user_` FOREIGN KEY (`User`) REFERENCES `user` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=251 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
INSERT INTO `payment` VALUES (241,'2025-10-28 12:49:43','Customer Settlement Payment(Ticket No:1-0001-102-0189-102)','1-0001-102-0189-102','2250',NULL,NULL,NULL,60,NULL,NULL,'2025-10-28 12:47:52','2025-11-28','-','1','2000','250','0','0','0','0','SETTLEMENT PAYMENT'),(242,'2025-10-30 08:53:22','Customer Settlement Payment(Ticket No:1-0001-102-0189-100)','1-0001-102-0189-100','4250',NULL,NULL,NULL,10,NULL,NULL,'2025-10-30 08:47:30','2025-11-30','-','1','4000','250','0','0','0','0','SETTLEMENT PAYMENT'),(243,'2025-11-10 15:33:37','Customer Settlement Payment(Ticket No:1-B02-0001-106-0190-104)','1-B02-0001-106-0190-104','2050',NULL,NULL,NULL,10,NULL,NULL,'2025-11-10 10:29:02','2026-01-10','-','1','1800','250','0','0','0','0','SETTLEMENT PAYMENT'),(244,'2025-11-26 08:25:15','Customer Payment(Ticket No:1-B01-0001-102-0189-105)','1-B01-0001-102-0189-105','1000',NULL,NULL,NULL,10,NULL,NULL,'2025-11-26 08:23:47','2025-12-26','-','1','750','250','0','0','0','0','PART PAYMENT'),(245,'2025-11-26 08:25:23','Customer Settlement Payment(Ticket No:1-B01-0001-102-0189-105)','1-B01-0001-102-0189-105','1250',NULL,NULL,NULL,10,NULL,NULL,'2025-11-26 08:23:47','2025-12-26','-','1','1250','0','0','0','0','0','SETTLEMENT PAYMENT'),(246,'2025-11-26 09:10:18','Customer Payment(Ticket No:1-B01-0001-102-0189-106)','1-B01-0001-102-0189-106','1000',NULL,NULL,NULL,10,NULL,NULL,'2025-11-26 09:08:46','2025-12-26','-','1','750','250','0','0','0','0','PART PAYMENT'),(247,'2025-11-26 09:10:37','Customer Settlement Payment(Ticket No:1-B01-0001-102-0189-106)','1-B01-0001-102-0189-106','1650',NULL,NULL,NULL,10,NULL,NULL,'2025-11-26 09:08:46','2025-12-26','-','1','1650','0','0','0','0','0','SETTLEMENT PAYMENT'),(248,'2025-12-02 10:01:59','Customer Settlement Payment(Ticket No:1-B01-0001-102-0189-101)','1-B01-0001-102-0189-101','2850',NULL,NULL,NULL,60,NULL,NULL,'2025-11-20 12:08:32','2025-12-20','-','12','2500','250','0','100','0','0','SETTLEMENT PAYMENT'),(249,'2025-12-03 13:10:04','Customer Settlement Payment(Ticket No:1-B01-0001-102-0189-108)','1-B01-0001-102-0189-108','2250',NULL,NULL,NULL,60,NULL,NULL,'2025-11-26 09:40:20','2025-12-26','-','8','2000','250','0','0','0','0','SETTLEMENT PAYMENT'),(250,'2025-12-03 13:10:28','Customer Settlement Payment(Ticket No:1-B01-0001-102-0189-107)','1-B01-0001-102-0189-107','2250',NULL,NULL,NULL,10,NULL,NULL,'2025-11-26 09:37:02','2025-12-26','-','8','2000','250','0','0','0','0','SETTLEMENT PAYMENT');
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plot`
--

DROP TABLE IF EXISTS `plot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plot` (
  `id_plot` int NOT NULL AUTO_INCREMENT,
  `total_amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Date_Time` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `user` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `last_updated_time` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `last_updated_user` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id_plot`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plot`
--

LOCK TABLES `plot` WRITE;
/*!40000 ALTER TABLE `plot` DISABLE KEYS */;
INSERT INTO `plot` VALUES (1,'3000.00','2025-02-06 10:40:22','1','2025-02-06 10:40:39','1');
/*!40000 ALTER TABLE `plot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plot_has_money`
--

DROP TABLE IF EXISTS `plot_has_money`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plot_has_money` (
  `id` int NOT NULL AUTO_INCREMENT,
  `plot_id` int NOT NULL,
  `money` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `qty` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plot_has_money`
--

LOCK TABLES `plot_has_money` WRITE;
/*!40000 ALTER TABLE `plot_has_money` DISABLE KEYS */;
INSERT INTO `plot_has_money` VALUES (3,1,'1000','3','3000.00');
/*!40000 ALTER TABLE `plot_has_money` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_has_caratage`
--

DROP TABLE IF EXISTS `product_has_caratage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_has_caratage` (
  `id_product_has_caratage` int NOT NULL AUTO_INCREMENT,
  `product_period_id` int NOT NULL,
  `caratage` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id_product_has_caratage`)
) ENGINE=InnoDB AUTO_INCREMENT=325 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_has_caratage`
--

LOCK TABLES `product_has_caratage` WRITE;
/*!40000 ALTER TABLE `product_has_caratage` DISABLE KEYS */;
INSERT INTO `product_has_caratage` VALUES (1,1,'16','14090.91'),(2,1,'17','14971.59'),(3,1,'18','15852.27'),(4,1,'19','16732.95'),(5,1,'20','17613.64'),(6,1,'21','18494.32'),(7,1,'22','19375.00'),(8,1,'23','20255.68'),(9,1,'24','21136.36'),(10,2,'16','13636.36'),(11,2,'17','14488.64'),(12,2,'18','15340.91'),(13,2,'19','16193.18'),(14,2,'20','17045.45'),(15,2,'21','17897.73'),(16,2,'22','18750.00'),(17,2,'23','19602.27'),(18,2,'24','20454.55'),(19,3,'16','13181.82'),(20,3,'17','14005.68'),(21,3,'18','14829.55'),(22,3,'19','15653.41'),(23,3,'20','16477.27'),(24,3,'21','17301.14'),(25,3,'22','18125.00'),(26,3,'23','18948.86'),(27,3,'24','19772.73'),(28,4,'16','12727.27'),(29,4,'17','13522.73'),(30,4,'18','14318.18'),(31,4,'19','15113.64'),(32,4,'20','15909.09'),(33,4,'21','16704.55'),(34,4,'22','17500.00'),(35,4,'23','18295.45'),(36,4,'24','19090.91'),(37,5,'16','12272.73'),(38,5,'17','13039.77'),(39,5,'18','13806.82'),(40,5,'19','14573.86'),(41,5,'20','15340.91'),(42,5,'21','16107.95'),(43,5,'22','16875.00'),(44,5,'23','17642.05'),(45,5,'24','18409.09'),(46,6,'16','13181.82'),(47,6,'17','14005.68'),(48,6,'18','14829.55'),(49,6,'19','15653.41'),(50,6,'20','16477.27'),(51,6,'21','17301.14'),(52,6,'22','18125.00'),(53,6,'23','18948.86'),(54,6,'24','19772.73'),(55,7,'16','16500.00'),(56,7,'17','17531.25'),(57,7,'18','18562.50'),(58,7,'19','19593.75'),(59,7,'20','20625.00'),(60,7,'21','22073.86'),(61,7,'22','23125'),(62,7,'23','24176.13'),(63,7,'24','25227.27'),(64,8,'16','16500.00'),(65,8,'17','17531.25'),(66,8,'18','18562.50'),(67,8,'19','19593.75'),(68,8,'20','20625.00'),(69,8,'21','21656.25'),(70,8,'22','22687.50'),(71,8,'23','23718.75'),(72,8,'24','24750.00'),(73,9,'16','16500.00'),(74,9,'17','17531.25'),(75,9,'18','18562.50'),(76,9,'19','19593.75'),(77,9,'20','20625.00'),(78,9,'21','21656.25'),(79,9,'22','22687.50'),(80,9,'23','23718.75'),(81,9,'24','24750.00'),(82,10,'16','16500.00'),(83,10,'17','17531.25'),(84,10,'18','18562.50'),(85,10,'19','19593.75'),(86,10,'20','20625.00'),(87,10,'21','21656.25'),(88,10,'22','22687.50'),(89,10,'23','23718.75'),(90,10,'24','24750.00'),(91,11,'16','16500.00'),(92,11,'17','17531.25'),(93,11,'18','18562.50'),(94,11,'19','19593.75'),(95,11,'20','20625.00'),(96,11,'21','21656.25'),(97,11,'22','22687.50'),(98,11,'23','23718.75'),(99,11,'24','24750.00'),(100,12,'16','14090.91'),(101,12,'17','14971.59'),(102,12,'18','15852.27'),(103,12,'19','16732.95'),(104,12,'20','17613.64'),(105,12,'21','18494.32'),(106,12,'22','19375.00'),(107,12,'23','20255.68'),(108,12,'24','21136.36'),(109,13,'16','13636.36'),(110,13,'17','14488.64'),(111,13,'18','15340.91'),(112,13,'19','16193.18'),(113,13,'20','17045.45'),(114,13,'21','17897.73'),(115,13,'22','18750.00'),(116,13,'23','19602.27'),(117,13,'24','20454.55'),(118,14,'16','13181.82'),(119,14,'17','14005.68'),(120,14,'18','14829.55'),(121,14,'19','15653.41'),(122,14,'20','16477.27'),(123,14,'21','17301.14'),(124,14,'22','18125.00'),(125,14,'23','18948.86'),(126,14,'24','19772.73'),(127,15,'16','12727.27'),(128,15,'17','13522.73'),(129,15,'18','14318.18'),(130,15,'19','15113.64'),(131,15,'20','15909.09'),(132,15,'21','16704.55'),(133,15,'22','17500.00'),(134,15,'23','18295.45'),(135,15,'24','19090.91'),(136,16,'16','12272.73'),(137,16,'17','13039.77'),(138,16,'18','13806.82'),(139,16,'19','14573.86'),(140,16,'20','15340.91'),(141,16,'21','16107.95'),(142,16,'22','16875.00'),(143,16,'23','17642.05'),(144,16,'24','18409.09'),(145,17,'16','127272.73'),(146,17,'17','135227.27'),(147,17,'18','143181.82'),(148,17,'19','151136.36'),(149,17,'20','159090.91'),(150,17,'21','167045.45'),(151,17,'22','175000.00'),(152,17,'23','182954.55'),(153,17,'24','190909.09'),(154,18,'16','123636.36'),(155,18,'17','131363.64'),(156,18,'18','139090.91'),(157,18,'19','146818.18'),(158,18,'20','154545.45'),(159,18,'21','162272.73'),(160,18,'22','170000.00'),(161,18,'23','177727.27'),(162,18,'24','185454.55'),(163,19,'16','120000.00'),(164,19,'17','127500.00'),(165,19,'18','135000.00'),(166,19,'19','142500.00'),(167,19,'20','150000.00'),(168,19,'21','157500.00'),(169,19,'22','165000.00'),(170,19,'23','172500.00'),(171,19,'24','180000.00'),(172,20,'16','116363.64'),(173,20,'17','123636.36'),(174,20,'18','130909.09'),(175,20,'19','138181.82'),(176,20,'20','145454.55'),(177,20,'21','152727.27'),(178,20,'22','160000.00'),(179,20,'23','167272.73'),(180,20,'24','174545.45'),(181,21,'16','112727.27'),(182,21,'17','119772.73'),(183,21,'18','126818.18'),(184,21,'19','133863.64'),(185,21,'20','140909.09'),(186,21,'21','147954.55'),(187,21,'22','155000.00'),(188,21,'23','162045.45'),(189,21,'24','169090.91'),(190,22,'16','127272.73'),(191,22,'17','135227.27'),(192,22,'18','143181.82'),(193,22,'19','151136.36'),(194,22,'20','159090.91'),(195,22,'21','167045.45'),(196,22,'22','175000.00'),(197,22,'23','182954.55'),(198,22,'24','190909.09'),(199,23,'16','123636.36'),(200,23,'17','131363.64'),(201,23,'18','139090.91'),(202,23,'19','146818.18'),(203,23,'20','154545.45'),(204,23,'21','162272.73'),(205,23,'22','170000.00'),(206,23,'23','177727.27'),(207,23,'24','185454.55'),(208,24,'16','120000.00'),(209,24,'17','127500.00'),(210,24,'18','135000.00'),(211,24,'19','142500.00'),(212,24,'20','150000.00'),(213,24,'21','157500.00'),(214,24,'22','165000.00'),(215,24,'23','172500.00'),(216,24,'24','180000.00'),(217,25,'16','116363.64'),(218,25,'17','123636.36'),(219,25,'18','130909.09'),(220,25,'19','138181.82'),(221,25,'20','145454.55'),(222,25,'21','152727.27'),(223,25,'22','160000.00'),(224,25,'23','167272.73'),(225,25,'24','174545.45'),(226,26,'16','112727.27'),(227,26,'17','119772.73'),(228,26,'18','126818.18'),(229,26,'19','133863.64'),(230,26,'20','140909.09'),(231,26,'21','147954.55'),(232,26,'22','155000.00'),(233,26,'23','162045.45'),(234,26,'24','169090.91'),(235,27,'16','127272.73'),(236,27,'17','135227.27'),(237,27,'18','143181.82'),(238,27,'19','151136.36'),(239,27,'20','159090.91'),(240,27,'21','167045.45'),(241,27,'22','175000.00'),(242,27,'23','182954.55'),(243,27,'24','190909.09'),(244,28,'16','123636.36'),(245,28,'17','131363.64'),(246,28,'18','139090.91'),(247,28,'19','146818.18'),(248,28,'20','154545.45'),(249,28,'21','162272.73'),(250,28,'22','170000.00'),(251,28,'23','177727.27'),(252,28,'24','185454.55'),(253,29,'16','120000.00'),(254,29,'17','127500.00'),(255,29,'18','135000.00'),(256,29,'19','142500.00'),(257,29,'20','150000.00'),(258,29,'21','157500.00'),(259,29,'22','165000.00'),(260,29,'23','172500.00'),(261,29,'24','180000.00'),(262,30,'16','116363.64'),(263,30,'17','123636.36'),(264,30,'18','130909.09'),(265,30,'19','138181.82'),(266,30,'20','145454.55'),(267,30,'21','152727.27'),(268,30,'22','160000.00'),(269,30,'23','167272.73'),(270,30,'24','174545.45'),(271,31,'16','112727.27'),(272,31,'17','119772.73'),(273,31,'18','126818.18'),(274,31,'19','133863.64'),(275,31,'20','140909.09'),(276,31,'21','147954.55'),(277,31,'22','155000.00'),(278,31,'23','162045.45'),(279,31,'24','169090.91'),(280,32,'16','15909.09'),(281,32,'17','16903.41'),(282,32,'18','17897.73'),(283,32,'19','18892.05'),(284,32,'20','19886.36'),(285,32,'21','20880.68'),(286,32,'22','21875.00'),(287,32,'23','22869.32'),(288,32,'24','23863.64'),(289,33,'16','15454.55'),(290,33,'17','16420.45'),(291,33,'18','17386.36'),(292,33,'19','18352.27'),(293,33,'20','19318.18'),(294,33,'21','20284.09'),(295,33,'22','21250.00'),(296,33,'23','22215.91'),(297,33,'24','23181.82'),(298,34,'16','15000.00'),(299,34,'17','15937.50'),(300,34,'18','16875.00'),(301,34,'19','17812.50'),(302,34,'20','18750.00'),(303,34,'21','19687.50'),(304,34,'22','20625.00'),(305,34,'23','21562.50'),(306,34,'24','22500.00'),(307,35,'16','14545.45'),(308,35,'17','15454.55'),(309,35,'18','16363.64'),(310,35,'19','17272.73'),(311,35,'20','18181.82'),(312,35,'21','19090.91'),(313,35,'22','20000.00'),(314,35,'23','20909.09'),(315,35,'24','21818.18'),(316,36,'16','14090.91'),(317,36,'17','14971.59'),(318,36,'18','15852.27'),(319,36,'19','16732.95'),(320,36,'20','17613.64'),(321,36,'21','18494.32'),(322,36,'22','19375.00'),(323,36,'23','20255.68'),(324,36,'24','21136.36');
/*!40000 ALTER TABLE `product_has_caratage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_has_early_chargers`
--

DROP TABLE IF EXISTS `product_has_early_chargers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_has_early_chargers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `start_amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `end_amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `type` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_has_early_chargers`
--

LOCK TABLES `product_has_early_chargers` WRITE;
/*!40000 ALTER TABLE `product_has_early_chargers` DISABLE KEYS */;
INSERT INTO `product_has_early_chargers` VALUES (1,1,'0','100000','Amount','50'),(2,1,'100001','500000','Amount','250'),(3,1,'500001','1000000','Amount','500'),(4,1,'1000001','1000000000','Amount','600'),(5,5,'0','100000','Amount','50'),(6,5,'100001','500000','Amount','250'),(7,5,'500001','1000000','Amount','500'),(8,5,'1000001','10000000000','Amount','600'),(9,4,'0','100000','Amount','50'),(10,4,'100001','500000','Amount','250'),(11,4,'500001','1000000','Amount','500'),(12,4,'1000001','100000000','Amount','600'),(14,3,'0','500000','Amount','0'),(19,9,'0','100000','Amount','50'),(20,9,'100001','500000','Amount','250'),(21,9,'500001','1000000','Amount','500'),(22,9,'1000001','100000000','Amount','600');
/*!40000 ALTER TABLE `product_has_early_chargers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_has_period`
--

DROP TABLE IF EXISTS `product_has_period`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_has_period` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `Period` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Interest_Rate` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `Advance_Amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Service_Charge_Type` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Service_Charge_Amount` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Late_Charge_per_day` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `Service_Charge_Start_Date` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_has_period`
--

LOCK TABLES `product_has_period` WRITE;
/*!40000 ALTER TABLE `product_has_period` DISABLE KEYS */;
INSERT INTO `product_has_period` VALUES (1,1,'1','1.99',NULL,'Percentage','0.95','0.6','10'),(2,1,'3','1.89',NULL,'Percentage','0.95','0.6','10'),(3,1,'6','1.79',NULL,'Percentage','0.95','0.6','10'),(4,1,'9','1.69',NULL,'Percentage','0.95','0.6','10'),(5,1,'12','1.59',NULL,'Percentage','0.95','0.6','10'),(6,3,'3','0',NULL,'Percentage','0','0.6','10'),(7,4,'1','2.99',NULL,'Percentage','0.95','0.6','10'),(8,4,'3','2.89',NULL,'Percentage','0.95','0.6','10'),(9,4,'6','2.79',NULL,'Percentage','0.95','0.6','10'),(10,4,'9','2.69',NULL,'Percentage','0.95','0.6','10'),(11,4,'12','2.59',NULL,'Percentage','0.95','0.6','10'),(12,5,'1','1.99',NULL,'Percentage','0.95','0.6','10'),(13,5,'3','1.89',NULL,'Percentage','0.95','0.6','10'),(14,5,'6','1.79',NULL,'Percentage','0.95','0.6','10'),(15,5,'9','1.69',NULL,'Percentage','0.95','0.6','10'),(16,5,'12','1.59',NULL,'Percentage','0.95','0.6','10'),(32,9,'1','1.99',NULL,'Percentage','0.95','0.6','10'),(33,9,'3','1.89',NULL,'Percentage','0.95','0.6','10'),(34,9,'6','1.79',NULL,'Percentage','0.95','0.6','10'),(35,9,'9','1.69',NULL,'Percentage','0.95','0.6','10'),(36,9,'12','1.59',NULL,'Percentage','0.95','0.6','10');
/*!40000 ALTER TABLE `product_has_period` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_plan`
--

DROP TABLE IF EXISTS `product_plan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_plan` (
  `idProduct_Plan` int NOT NULL AUTO_INCREMENT,
  `Period_Type` varchar(45) DEFAULT NULL COMMENT 'Weeks\nMonths\nDays',
  `Minimum_Period` varchar(45) DEFAULT NULL,
  `Maximum_Period` varchar(45) DEFAULT NULL,
  `Minimum_Amount` varchar(45) DEFAULT NULL,
  `Maximum_Amount` varchar(45) DEFAULT NULL,
  `Interest_type` varchar(45) DEFAULT NULL,
  `Interest` varchar(45) DEFAULT NULL,
  `Interest_Calculate_After` varchar(45) DEFAULT NULL,
  `Service_Charge_Value_type` varchar(45) DEFAULT NULL,
  `Service_Charge_Value` varchar(45) DEFAULT NULL,
  `Early_Settlement_Charge_Value_type` varchar(45) DEFAULT NULL,
  `Early_Settlement_Charge_Value` varchar(45) DEFAULT NULL,
  `Late_Charge` varchar(45) DEFAULT NULL,
  `Amount_For_22_Caratage` varchar(45) DEFAULT NULL,
  `Last_Updated_User` varchar(45) DEFAULT NULL,
  `Last_Updated_Time` varchar(45) DEFAULT NULL,
  `Pawning_Product_idPawning_Product` int NOT NULL,
  `stage1StartDate` varchar(45) DEFAULT NULL,
  `stage1EndDate` varchar(45) DEFAULT NULL,
  `stage2StartDate` varchar(45) DEFAULT NULL,
  `stage2EndDate` varchar(45) DEFAULT NULL,
  `stage3StartDate` varchar(45) DEFAULT NULL,
  `stage3EndDate` varchar(45) DEFAULT NULL,
  `stage4StartDate` varchar(45) DEFAULT NULL,
  `stage4EndDate` varchar(45) DEFAULT NULL,
  `stage1Interest` varchar(45) DEFAULT NULL,
  `stage2Interest` varchar(45) DEFAULT NULL,
  `stage3Interest` varchar(45) DEFAULT NULL,
  `stage4Interest` varchar(45) DEFAULT NULL,
  `interestApplicableMethod` varchar(100) DEFAULT NULL,
  `Week_Precentage_Amount_22_Caratage` varchar(45) DEFAULT NULL,
  `Month1_Precentage_Amount_22_Caratage` varchar(45) DEFAULT NULL,
  `Month3_Precentage_Amount_22_Caratage` varchar(45) DEFAULT NULL,
  `Month6_Precentage_Amount_22_Caratage` varchar(45) DEFAULT NULL,
  `Month9_Precentage_Amount_22_Caratage` varchar(45) DEFAULT NULL,
  `Month12_Precentage_Amount_22_Caratage` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idProduct_Plan`),
  KEY `fk_Product_Plan_Pawning_Product1` (`Pawning_Product_idPawning_Product`),
  CONSTRAINT `fk_product_plan_pawning_product` FOREIGN KEY (`Pawning_Product_idPawning_Product`) REFERENCES `pawning_product` (`idPawning_Product`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=165 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_plan`
--

LOCK TABLES `product_plan` WRITE;
/*!40000 ALTER TABLE `product_plan` DISABLE KEYS */;
INSERT INTO `product_plan` VALUES (146,NULL,'0','0','0','100000','perMonth','0','0','fixed','250','inactive','0','0.76','25000','10','2025-10-25 11:08:00.728',102,'0','7','8','14','15','30','31','To maturity date','1','1','0.7','2.7','calculate for stages ','85','80','77','74','70','68'),(153,NULL,'0','0','0','10000','perMonth','0','0','fixed','200','inactive','0','0.8','22000','28','2025-10-25 12:36:49.481',103,'0','7','8','14','15','30','31','To maturity date','1','1','0.5','2.5','calculate for stages ','85','80','77','74','70','68'),(154,NULL,'0','0','10001','20000','perMonth','0','0','fixed','250',NULL,'0','0','26000','28','2025-10-25 12:36:49.485',103,'0','7','8','14','15','30','31','To maturity date','1','1','1','3','calculate for stages ','40','50','60','70','80','90'),(157,'months','0','0','0','10000','perMonth','2','7','fixed','260','inactive','0','1','22000','28','2025-10-25 12:48:38.665',104,'0',NULL,NULL,NULL,NULL,NULL,NULL,'To maturity date','0','0','0','0','default','85','80','77','74','70','68'),(158,'months','0','0','10001','20000','perMonth','5','7','fixed','230',NULL,'0','0','25000','28','2025-10-25 12:48:38.668',104,'0',NULL,NULL,NULL,NULL,NULL,NULL,'To maturity date','0','0','0','0','default','100','100','100','100','100','100'),(162,'months','1','5','0','0','perMonth','0','0','fixed','260','inactive','0','5','25000','28','2025-10-25 12:51:58.852',105,'0','7','8','14','15','30','31','To maturity date','1','1','1','3','calculate for stages ','85','80','77','74','70','100'),(163,NULL,'6','10','0','0','perMonth','0','0','fixed','300',NULL,'0','0','26000','28','2025-10-25 12:51:58.856',105,'0','7','8','14','15','30','31','To maturity date','1','2','3','6','calculate for stages ','100','100','100','100','100','100'),(164,'',NULL,NULL,'0','100000','perMonth','0','0','fixed','250','inactive','0','2','25000','10','2025-11-10 10:28:57.110',106,'0','7','8','14','15','30','31','To maturity date','1','1','0.5','2.5','calculate for stages ','85','80','77','74','70','68');
/*!40000 ALTER TABLE `product_plan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `idProducts` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idProducts`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reason_for_ticket`
--

DROP TABLE IF EXISTS `reason_for_ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reason_for_ticket` (
  `idReason_For_Ticket` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `Company_idCompany` int NOT NULL,
  PRIMARY KEY (`idReason_For_Ticket`),
  KEY `fk_Reason_For_Ticket_Company1` (`Company_idCompany`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reason_for_ticket`
--

LOCK TABLES `reason_for_ticket` WRITE;
/*!40000 ALTER TABLE `reason_for_ticket` DISABLE KEYS */;
/*!40000 ALTER TABLE `reason_for_ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reasons`
--

DROP TABLE IF EXISTS `reasons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reasons` (
  `idReasons` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`idReasons`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reasons`
--

LOCK TABLES `reasons` WRITE;
/*!40000 ALTER TABLE `reasons` DISABLE KEYS */;
INSERT INTO `reasons` VALUES (1,'Others','2024-08-13 20:17:46','2024-08-13 20:17:46'),(2,'Business Need','2024-08-15 13:58:14','2024-08-15 13:58:14'),(3,'Housing Loan','2024-08-24 13:26:26','2024-08-24 13:26:26'),(4,'Agriculture','2024-08-28 14:05:37','2024-08-28 14:05:37'),(5,'Emergency Expenses','2024-08-28 14:06:19','2024-08-28 14:06:19'),(6,'Medical Expenses','2024-08-28 14:07:30','2024-08-28 14:07:30'),(7,'Vehicle Expenses','2024-08-28 14:07:55','2024-08-28 14:07:55'),(8,'Education Expenses','2024-08-28 14:09:25','2024-08-28 14:09:25'),(9,'Special Occasions','2024-08-28 14:09:44','2024-08-28 14:09:44'),(10,'Startup Business Cost','2024-08-28 14:10:52','2024-08-28 14:10:52'),(11,'Personal Reason','2024-08-28 14:13:29','2024-08-28 14:13:29'),(12,'Loan Settlement','2024-09-02 15:42:35','2024-09-02 15:42:35');
/*!40000 ALTER TABLE `reasons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('xSj5C7ZLsd4EoUIegUkgfWZaqAIwWhbwJVJqv1ND',1,'127.0.0.1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36','YTo4OntzOjY6Il90b2tlbiI7czo0MDoiN3NQVlNtVHBra0M0aTQxaXkwQ0pIaXJ3azR5NFhsT3RXOWpHR1ZzeiI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6NDE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9wYXltZW50L2ludm9pY2UvMTI0Ijt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTtzOjY6InVzZXJpZCI7aToxO3M6ODoiZnVsbG5hbWUiO3M6NToiQWRtaW4iO3M6ODoidXNlcm5hbWUiO3M6MTU6ImFkbWluQGdtYWlsLmNvbSI7czo3OiJjYXNoaWVyIjtpOjA7fQ==',1740406367);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_history`
--

DROP TABLE IF EXISTS `sms_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_history` (
  `idSMS_History` int NOT NULL AUTO_INCREMENT,
  `Date_Time` varchar(45) DEFAULT NULL,
  `SMS` text,
  `sms_Template_idsms_Template` int NOT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Customer_idCustomer` int NOT NULL,
  `Branch_idBranch` int NOT NULL,
  PRIMARY KEY (`idSMS_History`),
  KEY `fk_SMS_History_sms_Template1` (`sms_Template_idsms_Template`),
  KEY `fk_SMS_History_Customer1` (`Customer_idCustomer`),
  KEY `fk_SMS_History_Branch1` (`Branch_idBranch`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_history`
--

LOCK TABLES `sms_history` WRITE;
/*!40000 ALTER TABLE `sms_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_template`
--

DROP TABLE IF EXISTS `sms_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_template` (
  `idsms_Template` int NOT NULL AUTO_INCREMENT,
  `Period` varchar(45) DEFAULT NULL,
  `SMS_Type` varchar(45) DEFAULT NULL,
  `Template` text,
  `Status` int DEFAULT NULL,
  `Company_idCompany` int NOT NULL,
  PRIMARY KEY (`idsms_Template`),
  KEY `fk_sms_Template_Company1` (`Company_idCompany`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_template`
--

LOCK TABLES `sms_template` WRITE;
/*!40000 ALTER TABLE `sms_template` DISABLE KEYS */;
INSERT INTO `sms_template` VALUES (1,NULL,'Birthday Greeting','Happy Birth Day  @Member_Name@',1,1),(2,NULL,'Ticket Disbursement','test  @Member_No@',0,1),(3,'5','Auction Reminder 01','test 1 @Member_No@',1,1);
/*!40000 ALTER TABLE `sms_template` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_artical_images`
--

DROP TABLE IF EXISTS `ticket_artical_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_artical_images` (
  `idTicket_Artical_Images` int NOT NULL AUTO_INCREMENT,
  `File_Path` longtext,
  `Pawning_Ticket_idPawning_Ticket` int NOT NULL,
  PRIMARY KEY (`idTicket_Artical_Images`),
  KEY `fk_Ticket_Artical_Images_Pawning_Ticket1` (`Pawning_Ticket_idPawning_Ticket`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_artical_images`
--

LOCK TABLES `ticket_artical_images` WRITE;
/*!40000 ALTER TABLE `ticket_artical_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_artical_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_articles`
--

DROP TABLE IF EXISTS `ticket_articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_articles` (
  `idTicket_Articles` int NOT NULL AUTO_INCREMENT,
  `Article_type` int NOT NULL,
  `Article_category` varchar(45) DEFAULT NULL,
  `Article_Condition` varchar(45) DEFAULT NULL,
  `Caratage` varchar(45) DEFAULT NULL,
  `No_Of_Items` varchar(45) DEFAULT NULL,
  `Gross_Weight` varchar(45) DEFAULT NULL,
  `Acid_Test_Status` varchar(45) DEFAULT NULL,
  `DM_Reading` varchar(45) DEFAULT NULL,
  `Net_Weight` varchar(45) DEFAULT NULL,
  `Assessed_Value` varchar(45) DEFAULT NULL,
  `Declared_Value` varchar(45) DEFAULT NULL,
  `Advanced_Value` varchar(45) DEFAULT NULL,
  `Remark` text,
  `Image_Path` text,
  `Status` varchar(45) DEFAULT NULL,
  `Pawning_Ticket_idPawning_Ticket` int NOT NULL,
  `Redeemed_Date_Time` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idTicket_Articles`),
  KEY `fk_Ticket_Articles_Pawning_Ticket1` (`Pawning_Ticket_idPawning_Ticket`),
  KEY `fk_article_type` (`Article_type`),
  CONSTRAINT `fk_article_type` FOREIGN KEY (`Article_type`) REFERENCES `article_types` (`idArticle_Types`)
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_articles`
--

LOCK TABLES `ticket_articles` WRITE;
/*!40000 ALTER TABLE `ticket_articles` DISABLE KEYS */;
INSERT INTO `ticket_articles` VALUES (117,1,'5','Good','18','1','2','Yes','1','1','18000.00','2125.00','1837.84',NULL,NULL,NULL,111,NULL),(118,1,'18','Used - Acceptable','21','1','2','Yes','1','1','21000.00','2500.00','2162.16',NULL,NULL,NULL,111,NULL),(119,1,'3','Fair','20','1','2','Yes','1','1','20000.00','2375.00','2000',NULL,NULL,NULL,112,NULL),(120,1,'8','Poor','22','1','2','Yes','1','1','22000.00','2500.00','2400',NULL,NULL,NULL,113,NULL),(121,1,'4','Good','21','1','2','No','1','1','21000.00','2500.00','2000',NULL,NULL,NULL,114,NULL),(122,1,'4','Good','17','1','2','No','1','1','17000.00','1875.00','1800',NULL,NULL,NULL,115,NULL),(123,1,'4','Good','18','1','2','Yes','1','1','18000.00','2125.00','2000',NULL,NULL,NULL,116,NULL),(124,1,'4','Like New','20','1','2','Yes','1','1','20000.00','2250.00','2000',NULL,NULL,NULL,117,NULL),(125,1,'6','Good','24','1','2','Yes','1','1','24000.00','2750.00','2500',NULL,NULL,NULL,118,NULL),(126,1,'5','Very Good','20','1','2','Yes','1','1','20000.00','2250.00','2200',NULL,NULL,NULL,119,NULL),(127,1,'4','Very Good','23','1','2','Yes','1','1','23000.00','2625.00','2500',NULL,NULL,NULL,120,NULL),(128,1,'8','Poor','22','1','3','Yes','2','2','44000.00','4750.00','4000',NULL,NULL,NULL,121,NULL),(129,1,'6','Damaged','23','1','2','Yes','1','1','23000.00','2625.00','2500',NULL,NULL,NULL,122,NULL),(130,1,'6','Good','21','1','2','Yes','1','1','21000.00','2500.00','2000',NULL,NULL,NULL,123,NULL),(131,1,'4','Very Good','21','1','2','Yes','1','1','21000.00','2500.00','1600',NULL,NULL,NULL,124,NULL),(132,1,'5','Very Good','22','1','2','Yes','1','1','22000.00','2375.00','2200',NULL,NULL,NULL,125,NULL),(133,1,'5','Poor','23','1','2','Yes','1','1','23000.00','2625.00','2500',NULL,NULL,NULL,126,NULL),(134,1,'5','Poor','23','1','2','Yes','1','1','23000.00','2625.00','2500',NULL,NULL,NULL,127,NULL),(135,1,'2','Good','20','1','2','Yes','1','1','20000.00','2375.00','2000',NULL,NULL,NULL,128,NULL),(136,1,'4','Fair','20','1','2','Yes','1','1','20000.00','2375.00','2000',NULL,NULL,NULL,129,NULL),(137,1,'3','Fair','20','1','2','Yes','1','1','20000.00','2375.00','2200',NULL,NULL,NULL,130,NULL),(138,1,'3','Like New','18','1','2','Yes','1','1','18000.00','2125.00','2100',NULL,NULL,NULL,131,NULL),(139,1,'3','Very Good','18','1','2','Yes','1','1','18000.00','2125.00','2000',NULL,NULL,NULL,132,NULL),(140,1,'6','Fair','19','1','2','Yes','1','1','19000.00','2250.00','2200',NULL,NULL,NULL,133,NULL),(141,1,'3','Like New','20','1','2','Yes','1','1','20000.00','2375.00','2200',NULL,NULL,NULL,134,NULL),(142,1,'4','Good','24','1','2','Yes','1','1','26181.80','2750.00','2000',NULL,NULL,NULL,135,NULL),(143,1,'6','Fair','23','1','2','Yes','1','1','25090.90','2625.00','2500',NULL,NULL,NULL,136,NULL),(144,1,'2','Good','18','1','2','No','1','1','19636.40','2125.00','210',NULL,NULL,NULL,137,NULL),(145,1,'6','Fair','24','1','2','Yes','1','1','26181.80','2750.00','2500',NULL,NULL,NULL,138,NULL),(146,1,'4','Poor','20','1','2','Yes','1','1','21818.20','2375.00','2300',NULL,NULL,NULL,139,NULL),(147,1,'2','Very Good','19','1','2','Yes','1','1','20727.30','2250.00','2000',NULL,NULL,NULL,140,NULL),(148,1,'6','Poor','22','1','2','Yes','1','1','24000.00','2500.00','2400',NULL,NULL,NULL,141,NULL),(149,1,'4','Very Good','19','1','2','Yes','1','1','20727.30','2250.00','2000',NULL,NULL,NULL,142,NULL),(150,1,'3','Very Good','18','1','2','Yes','1','1','19636.40','2125.00','2000',NULL,NULL,NULL,143,NULL);
/*!40000 ALTER TABLE `ticket_articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_comment`
--

DROP TABLE IF EXISTS `ticket_comment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_comment` (
  `idTicket_Comment` int NOT NULL AUTO_INCREMENT,
  `Date_Time` varchar(45) DEFAULT NULL,
  `Pawning_Ticket_idPawning_Ticket` int NOT NULL,
  `User_idUser` int NOT NULL,
  `Comment` text,
  PRIMARY KEY (`idTicket_Comment`),
  KEY `fk_Ticket_Comment_Pawning_Ticket1` (`Pawning_Ticket_idPawning_Ticket`),
  KEY `fk_userId` (`User_idUser`),
  CONSTRAINT `fk_userId` FOREIGN KEY (`User_idUser`) REFERENCES `user` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_comment`
--

LOCK TABLES `ticket_comment` WRITE;
/*!40000 ALTER TABLE `ticket_comment` DISABLE KEYS */;
INSERT INTO `ticket_comment` VALUES (1,'2025-09-10 06:08:50',15,10,'Initial assessment completed. Item appears to be in good condition.'),(2,'2025-09-10 06:08:50',15,10,'Follow-up: Customer agreed to the terms. Ready for final approval.'),(3,'2025-09-10 07:17:06',15,10,'new'),(4,'2025-09-10 07:17:39',15,10,'test ticket comment'),(5,'2025-09-10 07:18:07',15,10,'test'),(6,'2025-09-10 07:34:09',15,10,'ss'),(7,'2025-09-10 07:48:52',16,10,'test'),(8,'2025-09-11 04:04:16',22,10,'test'),(9,'2025-09-11 08:26:38',17,10,'s'),(10,'2025-09-11 09:07:39',24,10,'test'),(11,'2025-09-11 09:10:01',18,10,'new'),(12,'2025-09-11 09:34:15',23,10,'test'),(13,'2025-09-11 11:48:37',9,10,'add new'),(14,'2025-10-02 17:53:01',46,33,'aa'),(15,'2025-10-02 17:55:04',20,33,'rejected'),(16,'2025-10-17 11:15:52',99,33,'1st comment'),(17,'2025-10-17 11:15:58',99,33,'2nd comment');
/*!40000 ALTER TABLE `ticket_comment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_has_approval`
--

DROP TABLE IF EXISTS `ticket_has_approval`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_has_approval` (
  `idTicket_has_approval` int NOT NULL AUTO_INCREMENT,
  `Date_Time` varchar(45) DEFAULT NULL,
  `User` int NOT NULL,
  `Pawning_Ticket_idPawning_Ticket` int NOT NULL,
  `Note` longtext,
  `Type` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idTicket_has_approval`),
  KEY `fk_user_approved` (`User`),
  KEY `fk_pawning_ticket` (`Pawning_Ticket_idPawning_Ticket`),
  CONSTRAINT `fk_pawning_ticket` FOREIGN KEY (`Pawning_Ticket_idPawning_Ticket`) REFERENCES `pawning_ticket` (`idPawning_Ticket`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_approved` FOREIGN KEY (`User`) REFERENCES `user` (`idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_has_approval`
--

LOCK TABLES `ticket_has_approval` WRITE;
/*!40000 ALTER TABLE `ticket_has_approval` DISABLE KEYS */;
INSERT INTO `ticket_has_approval` VALUES (87,'2025-11-20 12:15:14',61,136,NULL,'APPROVE');
/*!40000 ALTER TABLE `ticket_has_approval` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_log`
--

DROP TABLE IF EXISTS `ticket_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_log` (
  `idTicket_Log` int NOT NULL AUTO_INCREMENT,
  `Pawning_Ticket_idPawning_Ticket` int NOT NULL,
  `Date_Time` varchar(45) DEFAULT NULL,
  `Type` varchar(45) DEFAULT NULL,
  `Type_Id` varchar(45) DEFAULT NULL,
  `Description` text,
  `Amount` varchar(45) DEFAULT NULL,
  `Advance_Balance` varchar(45) DEFAULT NULL,
  `Service_Charge_Balance` varchar(45) DEFAULT NULL,
  `Aditional_Charge_Balance` varchar(45) DEFAULT NULL,
  `Interest_Balance` varchar(45) DEFAULT NULL,
  `Late_Charges_Balance` varchar(45) DEFAULT NULL,
  `Total_Balance` varchar(45) DEFAULT NULL,
  `User_idUser` int DEFAULT NULL,
  PRIMARY KEY (`idTicket_Log`),
  KEY `fk_Ticket_Log_Pawning_Ticket1` (`Pawning_Ticket_idPawning_Ticket`),
  KEY `fk_Ticket_Log_User1` (`User_idUser`)
) ENGINE=InnoDB AUTO_INCREMENT=1548 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_log`
--

LOCK TABLES `ticket_log` WRITE;
/*!40000 ALTER TABLE `ticket_log` DISABLE KEYS */;
INSERT INTO `ticket_log` VALUES (1508,133,'2025-11-17 10:26:25','CREATE','133',NULL,'2200','2200','0','0','0','0','2200',10),(1509,133,'2025-11-17 10:26:25','SERVICE CHARGE',NULL,NULL,'250','2200','250','0','0','0','2450',10),(1510,134,'2025-11-17 10:29:11','CREATE','134',NULL,'2200','2200','0','0','0','0','2200',10),(1511,134,'2025-11-17 10:29:11','SERVICE CHARGE',NULL,NULL,'250','2200','250','0','0','0','2450',10),(1512,135,'2025-11-18 08:57:55','CREATE','135',NULL,'2000','2000','0','0','0','0','2000',10),(1513,135,'2025-11-18 08:57:55','SERVICE CHARGE',NULL,NULL,'250','2000','250','0','0','0','2250',10),(1514,136,'2025-11-20 12:08:52','CREATE','136',NULL,'2500','2500','0','0','0','0','2500',33),(1515,136,'2025-11-20 12:08:52','SERVICE CHARGE',NULL,NULL,'250','2500','250','0','0','0','2750',33),(1516,136,'2025-11-20 12:15:14','APPROVE-TICKET','87','Ticket fully approved','250','2500','250','0','0','0','2750',61),(1517,137,'2025-11-20 15:29:26','CREATE','137',NULL,'210','210','0','0','0','0','210',10),(1518,137,'2025-11-20 15:29:26','SERVICE CHARGE',NULL,NULL,'250','210','250','0','0','0','460',10),(1519,138,'2025-11-20 15:32:47','CREATE','138',NULL,'2500','2500','0','0','0','0','2500',10),(1520,138,'2025-11-20 15:32:47','SERVICE CHARGE',NULL,NULL,'250','2500','250','0','0','0','2750',10),(1521,139,'2025-11-20 15:41:33','CREATE','139',NULL,'2300','2300','0','0','0','0','2300',10),(1522,139,'2025-11-20 15:41:33','SERVICE CHARGE',NULL,NULL,'250','2300','250','0','0','0','2550',10),(1523,140,'2025-11-26 08:24:10','CREATE','140',NULL,'2000','2000','0','0','0','0','2000',10),(1524,140,'2025-11-26 08:24:10','SERVICE CHARGE',NULL,NULL,'250','2000','250','0','0','0','2250',10),(1525,140,'2025-11-26 08:24:10','APPROVE-TICKET','140','Ticket approved, according to company settings it is approved after creation.','250','2000','250','0','0','0','2250',10),(1526,140,'2025-11-26 08:24:35','LOAN-DISBURSEMENT',NULL,'Ticket activated and loan disbursed','250','2000','250','0','0','0','2250',10),(1527,140,'2025-11-26 08:25:15.062','PAYMENT','244','Part payment received. Payment ID: 244','1000','1250','0','0','0','0','1250',10),(1528,140,'2025-11-26 08:25:23.526','SETTLEMENT','245','Settlement payment received. Payment ID: 245','1250','0','0','0','0','0','0',10),(1529,141,'2025-11-26 09:09:16','CREATE','141',NULL,'2400','2400','0','0','0','0','2400',10),(1530,141,'2025-11-26 09:09:16','SERVICE CHARGE',NULL,NULL,'250','2400','250','0','0','0','2650',10),(1531,141,'2025-11-26 09:09:16','APPROVE-TICKET','141','Ticket approved, according to company settings it is approved after creation.','250','2400','250','0','0','0','2650',10),(1532,141,'2025-11-26 09:09:29','LOAN-DISBURSEMENT',NULL,'Ticket activated and loan disbursed','250','2400','250','0','0','0','2650',10),(1533,141,'2025-11-26 09:10:18.243','PAYMENT','246','Part payment received. Payment ID: 246','1000','1650','0','0','0','0','1650',10),(1534,141,'2025-11-26 09:10:37.972','SETTLEMENT','247','Settlement payment received. Payment ID: 247','1650','0','0','0','0','0','0',10),(1535,136,'2025-11-26 09:13:03','LOAN-DISBURSEMENT',NULL,'Ticket activated and loan disbursed','250','2500','250','0','0','0','2750',10),(1536,136,'2025-11-26 09:14:26','ADDITIONAL CHARGE',NULL,NULL,'100','2500','250','100','0','0','2850',10),(1537,142,'2025-11-26 09:40:11','CREATE','142',NULL,'2000','2000','0','0','0','0','2000',10),(1538,142,'2025-11-26 09:40:11','SERVICE CHARGE',NULL,NULL,'250','2000','250','0','0','0','2250',10),(1539,142,'2025-11-26 09:40:11','APPROVE-TICKET','142','Ticket approved, according to company settings it is approved after creation.','250','2000','250','0','0','0','2250',10),(1540,143,'2025-11-26 09:42:33','CREATE','143',NULL,'2000','2000','0','0','0','0','2000',10),(1541,143,'2025-11-26 09:42:33','SERVICE CHARGE',NULL,NULL,'250','2000','250','0','0','0','2250',10),(1542,143,'2025-11-26 09:42:33','APPROVE-TICKET','143','Ticket approved, according to company settings it is approved after creation.','250','2000','250','0','0','0','2250',10),(1543,143,'2025-12-02 10:00:05','LOAN-DISBURSEMENT',NULL,'Ticket activated and loan disbursed','250','2000','250','0','0','0','2250',60),(1544,136,'2025-12-02 10:01:59.955','SETTLEMENT','248','Settlement payment received. Payment ID: 248','2850','0','0','0','0','0','0',60),(1545,142,'2025-12-03 13:09:16','LOAN-DISBURSEMENT',NULL,'Ticket activated and loan disbursed','250','2000','250','0','0','0','2250',10),(1546,143,'2025-12-03 13:10:04.586','SETTLEMENT','249','Settlement payment received. Payment ID: 249','2250','0','0','0','0','0','0',10),(1547,142,'2025-12-03 13:10:28.801','SETTLEMENT','250','Settlement payment received. Payment ID: 250','2250','0','0','0','0','0','0',10);
/*!40000 ALTER TABLE `ticket_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_payment`
--

DROP TABLE IF EXISTS `ticket_payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_payment` (
  `idTicket_payment` int NOT NULL,
  `Pawning_Ticket_idPawning_Ticket` int NOT NULL,
  `Date_Time` varchar(45) DEFAULT NULL,
  `Payment_Type` varchar(45) DEFAULT NULL COMMENT 'Ticket Part Payment\nRenewal\nRedeem (Redemption / Settlement)\npartial redemption\nAdvance Top-up',
  `Paid_Amount` varchar(45) DEFAULT NULL,
  `Description` varchar(45) DEFAULT NULL COMMENT 'for parrt redeem details\n',
  `Previous_Advance_Balance` varchar(45) DEFAULT NULL,
  `Previous_Service_Charge_Balance` varchar(45) DEFAULT NULL,
  `Previous_Additional_Charge_Balance` varchar(45) DEFAULT NULL,
  `Previous_Interest_Balance` varchar(45) DEFAULT NULL,
  `Previous_Late_Charge_Balance` varchar(45) DEFAULT NULL,
  `Previous_Total_Balance` varchar(45) DEFAULT NULL,
  `Paid_Advance` varchar(45) DEFAULT NULL,
  `Paid_Service_charge` varchar(45) DEFAULT NULL,
  `Paid_Additional` varchar(45) DEFAULT NULL,
  `Paid_interest` varchar(45) DEFAULT NULL,
  `Paid_Late_Charge` varchar(45) DEFAULT NULL,
  `Advance_Balance` varchar(45) DEFAULT NULL,
  `Service_Charge_balance` varchar(45) DEFAULT NULL,
  `Additional_Charge_Balance` varchar(45) DEFAULT NULL,
  `Interest_Balance` varchar(45) DEFAULT NULL,
  `Late_Charge_Balance` varchar(45) DEFAULT NULL,
  `Total_Balance` varchar(45) DEFAULT NULL,
  `Status` varchar(45) DEFAULT NULL,
  `Note` varchar(45) DEFAULT NULL,
  `Undone_Comment` varchar(45) DEFAULT NULL,
  `User_idUser` int NOT NULL,
  `Branch_idBranch` int NOT NULL,
  PRIMARY KEY (`idTicket_payment`),
  KEY `fk_Ticket_payment_Pawning_Ticket1` (`Pawning_Ticket_idPawning_Ticket`),
  KEY `fk_Ticket_payment_User1` (`User_idUser`),
  KEY `fk_Ticket_payment_Branch1` (`Branch_idBranch`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_payment`
--

LOCK TABLES `ticket_payment` WRITE;
/*!40000 ALTER TABLE `ticket_payment` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `idUser` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `Contact_no` varchar(45) DEFAULT NULL,
  `Status` varchar(45) DEFAULT '1',
  `Company_idCompany` int NOT NULL,
  `Designation_idDesignation` int NOT NULL,
  `Reset_Password_Token` longtext,
  `Reset_Password_Token_Expires_At` varchar(45) DEFAULT NULL,
  `calling_name` varchar(100) DEFAULT NULL,
  `Reset_Password_Mobile_Otp` int DEFAULT NULL,
  `Reset_Password_Mobile_Otp_Expires_At` varchar(45) DEFAULT NULL,
  `Profile_Image` longtext,
  PRIMARY KEY (`idUser`),
  UNIQUE KEY `Reset_Password_Mobile_Otp` (`Reset_Password_Mobile_Otp`),
  KEY `fk_User_Company` (`Company_idCompany`),
  KEY `fk_User_Designation` (`Designation_idDesignation`),
  CONSTRAINT `fk_User_Company` FOREIGN KEY (`Company_idCompany`) REFERENCES `company` (`idCompany`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_User_Designation` FOREIGN KEY (`Designation_idDesignation`) REFERENCES `designation` (`idDesignation`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (10,'Sachinthana Jayathunga ','$2b$10$Q.uvH5P.EoZUG5RLhlTa3e6R1QKnQoiFByi88v6lgRBlC2Jj3EyqC','spiyumal41@gmail.com','0722511761','1',1,1,NULL,NULL,NULL,724227,'2025-10-23 14:26:19.614',NULL),(26,'Test user 2','$2b$10$WFgDCvpZxLxzzTdrYhkzOuEfDmY0GvQj4e36XFypLKkWq6E0DJ7iq','tharangaj@fincocapital.lk',NULL,'1',3,4,NULL,NULL,NULL,NULL,NULL,NULL),(28,'Y.Saranraj','$2b$10$LOGRLfCDQhzIodW/csvpleEkHNBpE1sp42yGxAM1vnMmI3FfyHAqS','saranraj.y@fincocapital.lk','0702215639','1',3,4,NULL,NULL,NULL,NULL,NULL,NULL),(33,'Sachintha Piyumal Jayathunga','$2b$10$jbxQRJ4gLOrs4nDMntYPzeJV9xCdldqJZtZ8uVh8fFKY.hYy7QB/O','spiyumal488@gmail.com','0722511761','1',1,20,NULL,NULL,NULL,833254,'2025-10-23 14:02:28.601',NULL),(36,'K.T.Sandaruwan','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','tharindu_001','0704771870','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(37,'K.Aathavan','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','aathavan_002','0704765259','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(38,'S.Jathirsan','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','suresh_003','0704771891','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(39,'M.W.A.Dhanushka','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','dhanushka_004','0704771897','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(40,'W.H.Madusanka Silasinghe','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','madusanka_005','0704765238','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(41,'R.Rajeepan','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','rajeepan_006','0704771859','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(42,'T.M.N.D.Thenakoon','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','nadeeshani_007','0704765266','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(43,'K.Krishnakanthan','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','krishnakanthan_008','0704765280','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(44,'P.A.Gunathilaka','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','asanka_009','0704765250','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(45,'D.V.W.Pushpakumara','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','wasantha_010','0704765234','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(46,'W.D.Weerasooriya','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','dinesh_011','0704765245','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(47,'A.M.W.Warith','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','warith_012','0704765260','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(48,'V.Dinesh','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','v.dinesh_013','0704765283','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(49,'A.N.M.Perera','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','nimesh_014','0704765273','1',3,15,NULL,NULL,NULL,NULL,NULL,NULL),(50,'W.T.M.Tissera','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','thilantha_015','0763020058','1',3,16,NULL,NULL,NULL,NULL,NULL,NULL),(51,'M.J.M.R.T.Jayawardana','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','tharanga_016','0767781935','1',3,17,NULL,NULL,NULL,NULL,NULL,NULL),(52,'A.S.I.C.R.Bandara','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','ivon_017','0705692202','1',3,18,NULL,NULL,NULL,NULL,NULL,NULL),(53,'P.Dilujan','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','dilujan_018','0704765296','1',3,19,NULL,NULL,NULL,NULL,NULL,NULL),(54,'H.D.H.Kanchana','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','kanchana_019','0704765228','1',3,19,NULL,NULL,NULL,NULL,NULL,NULL),(55,'D.D.T.Edirisinghe','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','dhamith_020','0704771835','1',3,19,NULL,NULL,NULL,NULL,NULL,NULL),(56,'A.H.K. Dilhari','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','dilhari_021','0704771865','1',3,19,NULL,NULL,NULL,NULL,NULL,NULL),(57,'V.Sayooran','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','sayooran_022','0704765310','1',3,19,NULL,NULL,NULL,NULL,NULL,NULL),(58,'J.S.A.C.Imalsha','$2a$12$SQ9.GoCivNQxLWxA0fPWPuRmqRuUNpfHnFidT2HHcgR9V.Vt4BDay','chathuni_023','0704771861','1',3,19,NULL,NULL,NULL,NULL,NULL,NULL),(59,'Asipiya Super Admin','$2b$10$QBqxdLdt5YiqXrwao9QOuuyiLZKIB/yC1Wdn/e/XQN.6QTac2dvri','admin@asipiya.lk','0770201521','1',3,4,NULL,NULL,NULL,NULL,NULL,NULL),(60,'Malshi Himangana','$2b$10$1Nx/2GLPqghIwHHK5C1tceQPqliw32iGZ3fu2vR0H8.HEMh4UH0Py','malshituf@gmail.com','0764615680','1',1,20,NULL,NULL,NULL,NULL,NULL,NULL),(61,'Soap','$2b$10$4EEUUQiegc451JRTi2CIzu//SRegSA6cr7WqRaR6oxT/6azuG5NN.','sachinthana620@gmail.com','0771908671','1',1,1,NULL,NULL,NULL,NULL,NULL,NULL),(62,'Deshan Kasun','$2b$10$DX5WFf/YAJmPJJ2nsHTm7OviDCejOsyqn8Je2xiYM8bVpYKhRfx32','deshankasun2000@gmail.com','0769494776','1',1,20,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_card_visibility`
--

DROP TABLE IF EXISTS `user_card_visibility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_card_visibility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `branch_id` int NOT NULL,
  `company_id` int NOT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `bg_color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '#ffffff',
  `font_color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '#000000',
  `card_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_branch_company_card` (`branch_id`,`company_id`,`card_id`),
  KEY `company_id` (`company_id`),
  KEY `card_id` (`card_id`)
) ENGINE=MyISAM AUTO_INCREMENT=613 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_card_visibility`
--

LOCK TABLES `user_card_visibility` WRITE;
/*!40000 ALTER TABLE `user_card_visibility` DISABLE KEYS */;
INSERT INTO `user_card_visibility` VALUES (572,1,1,0,'2025-08-21 13:18:42','2025-09-30 13:17:26','#ffffff','#000000',1),(573,1,1,0,'2025-08-21 13:41:54','2025-09-30 13:17:27','#eb4034','#f2f2f2',2),(574,1,1,0,'2025-08-21 13:44:27','2025-09-25 15:11:48','#eb4034','#ffffff',5),(575,1,1,0,'2025-08-21 13:47:39','2025-09-30 13:17:31','#ffffff','#000000',10),(576,1,1,0,'2025-08-22 03:45:25','2025-09-30 13:17:21','#94a3b8','#ffffff',20),(577,1,1,0,'2025-08-22 08:49:28','2025-08-25 03:01:11','#ffffff','#000000',21),(578,1,1,0,'2025-08-22 08:50:20','2025-10-23 04:31:38','#94a3b8','#ef4444',11),(579,1,1,0,'2025-08-22 08:50:23','2025-10-23 04:31:39','#ffffff','#000000',12),(580,1,1,0,'2025-08-22 08:52:44','2025-09-30 13:17:28','#ffffff','#000000',4),(581,1,1,0,'2025-08-22 08:52:49','2025-10-23 04:31:39','#ffffff','#000000',13),(582,1,1,0,'2025-08-22 08:53:38','2025-10-23 04:31:40','#ffffff','#000000',14),(583,1,1,0,'2025-08-22 08:53:40','2025-08-25 03:01:10','#ffffff','#000000',22),(584,1,1,0,'2025-08-22 08:54:20','2025-10-23 04:31:41','#ffffff','#000000',15),(585,1,1,0,'2025-08-22 09:01:03','2025-09-30 13:17:40','#ffffff','#000000',30),(586,1,1,0,'2025-08-22 09:05:04','2025-09-30 13:17:27','#ffffff','#000000',3),(587,1,1,0,'2025-08-22 09:05:06','2025-09-30 13:17:29','#ffffff','#000000',6),(588,1,1,0,'2025-08-22 09:05:06','2025-09-30 13:17:29','#ffffff','#000000',7),(589,1,1,0,'2025-08-22 09:05:06','2025-10-22 04:28:35','#ffffff','#000000',8),(590,1,1,0,'2025-08-22 09:05:07','2025-09-25 15:12:11','#ffffff','#000000',9),(591,1,1,0,'2025-08-22 09:05:14','2025-09-30 13:17:36','#ffffff','#000000',25),(592,1,1,0,'2025-08-22 09:20:48','2025-10-23 04:31:42','#ffffff','#000000',18),(593,1,1,0,'2025-08-22 09:30:44','2025-10-23 04:31:41','#ffffff','#000000',16),(594,1,1,0,'2025-08-22 09:30:49','2025-10-23 04:31:42','#ffffff','#000000',17),(595,1,1,0,'2025-08-25 03:33:42','2025-09-30 13:17:37','#ffffff','#000000',27),(596,1,1,0,'2025-08-25 03:33:58','2025-09-30 13:17:23','#ffffff','#000000',19),(597,1,1,0,'2025-08-26 08:46:57','2025-09-30 13:17:39','#ffffff','#000000',28),(598,2,1,1,'2025-08-27 04:42:34','2025-08-27 04:42:34','#ffffff','#000000',11),(599,2,1,1,'2025-08-27 04:42:34','2025-08-27 04:42:34','#ffffff','#000000',12),(600,2,1,1,'2025-08-27 04:50:09','2025-08-27 04:50:09','#ffffff','#000000',13),(601,2,1,1,'2025-08-27 04:50:10','2025-08-27 04:50:10','#ffffff','#000000',14),(602,1,1,0,'2025-08-27 05:56:08','2025-09-30 13:17:35','#ffffff','#000000',26),(603,18,1,1,'2025-11-23 09:11:37','2025-11-23 09:11:37','#ffffff','#000000',11),(604,18,1,1,'2025-11-23 09:11:37','2025-11-23 09:11:37','#ffffff','#000000',12),(605,18,1,1,'2025-11-23 09:11:39','2025-11-23 09:11:39','#ffffff','#000000',13),(606,18,1,1,'2025-11-23 09:11:43','2025-11-23 09:11:43','#ffffff','#000000',14),(607,18,1,1,'2025-11-23 09:11:44','2025-11-23 09:11:44','#ffffff','#000000',15),(608,18,1,1,'2025-11-23 09:11:45','2025-11-23 09:11:45','#ffffff','#000000',16),(609,18,1,1,'2025-11-23 09:11:46','2025-11-23 09:11:46','#ffffff','#000000',17),(610,18,1,1,'2025-11-23 09:11:47','2025-11-23 09:11:47','#ffffff','#000000',18),(611,18,1,1,'2025-11-23 09:11:49','2025-11-23 09:11:49','#ffffff','#000000',32),(612,18,1,1,'2025-11-23 09:11:51','2025-11-23 09:11:51','#ffffff','#000000',1);
/*!40000 ALTER TABLE `user_card_visibility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_has_branch`
--

DROP TABLE IF EXISTS `user_has_branch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_has_branch` (
  `User_idUser` int NOT NULL,
  `Branch_idBranch` int NOT NULL,
  PRIMARY KEY (`User_idUser`,`Branch_idBranch`),
  KEY `fk_User_has_Branch_Branch1` (`Branch_idBranch`),
  KEY `fk_User_has_Branch_User1` (`User_idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_has_branch`
--

LOCK TABLES `user_has_branch` WRITE;
/*!40000 ALTER TABLE `user_has_branch` DISABLE KEYS */;
INSERT INTO `user_has_branch` VALUES (10,1),(15,1),(16,1),(18,1),(19,1),(20,1),(21,1),(22,1),(29,1),(30,1),(31,1),(32,1),(33,1),(34,1),(35,1),(60,1),(61,1),(10,2),(17,2),(22,2),(62,2),(24,3),(25,3),(26,3),(27,3),(28,3),(50,3),(51,3),(52,3),(59,3),(28,4),(36,4),(59,4),(28,5),(37,5),(53,5),(59,5),(28,6),(38,6),(59,6),(28,7),(39,7),(59,7),(28,8),(40,8),(59,8),(28,9),(41,9),(59,9),(28,10),(42,10),(59,10),(28,11),(43,11),(59,11),(28,12),(44,12),(59,12),(28,13),(45,13),(54,13),(28,14),(46,14),(55,14),(28,15),(47,15),(56,15),(28,16),(48,16),(57,16),(28,17),(49,17),(58,17),(10,18),(61,18);
/*!40000 ALTER TABLE `user_has_branch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_has_user_privilages`
--

DROP TABLE IF EXISTS `user_has_user_privilages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_has_user_privilages` (
  `User_idUser` int NOT NULL,
  `User_privilages_idUser_privilages` int NOT NULL,
  PRIMARY KEY (`User_idUser`,`User_privilages_idUser_privilages`),
  KEY `fk_User_has_User_privilages_User_privilages1` (`User_privilages_idUser_privilages`),
  KEY `fk_User_has_User_privilages_User1` (`User_idUser`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_has_user_privilages`
--

LOCK TABLES `user_has_user_privilages` WRITE;
/*!40000 ALTER TABLE `user_has_user_privilages` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_has_user_privilages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_privilages`
--

DROP TABLE IF EXISTS `user_privilages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_privilages` (
  `idUser_privilages` int NOT NULL AUTO_INCREMENT,
  `Description` varchar(45) DEFAULT NULL,
  `Link` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`idUser_privilages`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_privilages`
--

LOCK TABLES `user_privilages` WRITE;
/*!40000 ALTER TABLE `user_privilages` DISABLE KEYS */;
INSERT INTO `user_privilages` VALUES (1,'ADMIN',NULL),(2,'CUSTOMER UPDATE',NULL),(3,'CUSTOMER CREATE',NULL),(4,'CUSTOMER VIEW',NULL),(5,'KYC ACCESS (KNOW YOUR CUSTOMER)',NULL),(6,'PAWNING PRODUCT CREATE',NULL),(7,'PAWNING PRODUCT UPDATE',NULL),(8,'PAWNING PRODUCT VIEW',NULL),(9,'USER CREATE',NULL),(10,'USER UPDATE',NULL),(11,'USER VIEW',NULL),(12,'PAWNING TICKET CREATE',NULL),(13,'PAWNING TICKET VIEW',NULL),(14,'PAWNING TICKET PRINT',NULL),(15,'PAWNING TICKET DOWNLOAD',NULL),(16,'PAWNING TICKET LOG VIEW',NULL),(17,'PAWNING TICKET PAYMENT',NULL),(18,'PAWNING TICKET PAYMENT HISTORY VIEW',NULL),(19,'PAWNING TICKET PAYMENT PRINT',NULL),(20,'PAYMENTS HISTORY VIEW',NULL),(21,'PAYMENT HISTORY PRINT',NULL),(22,'INTERNAL ACCOUNT CREATE',NULL),(23,'INTERNAL ACCOUNT VIEW',NULL),(24,'INTERNAL ACCOUNT TRANSFERS',NULL),(25,'INTERNAL ACCOUNT TRANSFERS VIEW',NULL),(26,'CASHIER DASHBOARD',NULL),(27,'CASHIER DAY START',NULL),(28,'CASHIER DAY END',NULL),(29,'PAWNING TICKET APPROVE',NULL),(30,'PAWNING TICKET REJECT',NULL),(31,'PAWNING TICKET DISBURSE',NULL),(32,'TICKET PAYMENT UNDONE',NULL),(33,'REPORTS',NULL),(34,'PAWNING TICKET MAX APPROVE AMOUNT',NULL),(35,'CHART OF ACCOUNT CREATE',NULL),(36,'MANUAL JOURNAL CREATE',NULL),(37,'MANUAL JOURNAL VIEW',NULL),(38,'CHART OF ACCOUNT VIEW',NULL),(39,'PAWNING TICKET DUPLICATE PRINT',NULL),(40,'VIEW CASHIER ACCOUNTS',NULL),(41,'CASH REQUEST ACCESS',NULL),(42,'CASH REQUEST APPROVAL',NULL),(43,'DAY START APPROVAL',NULL),(44,'DAY END APPROVAL',NULL);
/*!40000 ALTER TABLE `user_privilages` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-10 15:29:45
