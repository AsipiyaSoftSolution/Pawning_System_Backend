import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { uploadImage } from "../utils/cloudinary.js";
import { getPaginationData } from "../utils/helper.js";

const customerLog = async (idCustomer, date, type, Description, userId) => {
  try {
    const [result] = await pool.query(
      "INSERT INTO customer_log (Customer_idCustomer, Date_Time, Type, Description, User_idUser) VALUES (?, ?, ?, ?, ?)",
      [idCustomer, date, type, Description, userId]
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to log customer action");
    }

    return;
  } catch (error) {
    console.error("Error in customerLog:", error);
    throw new Error("Failed to log customer action");
  }
};
export const createCustomer = async (req, res, next) => {
  try {
    const {
      Title,
      First_Name,
      Full_Name,
      NIC,
      DOB,
      Address1,
      Address2,
      Address3,
      Postal_Address01,
      Postal_Address02,
      Postal_Address03,
      Mobile_No,
      Occupation,
      Work_Place,
      Phone_No,
      Phone_No2,
      Status,
      Behaviour_Status,
      Note,
      nicImage,
      customerImage,
    } = req.body;

    const Branch_idBranch = req.branchId; // get the branchId from the middleware
    if (!First_Name || !NIC || !Address1 || !Mobile_No || !Work_Place) {
      return next(
        errorHandler(
          400,
          "First name, NIC, address, mobile number, and workplace are required"
        )
      );
    }

    if (!Branch_idBranch) {
      return next(
        errorHandler(400, "Branch ID is required to create a customer")
      );
    }

    const [existingCustomer] = await pool.query(
      "SELECT idCustomer FROM customer WHERE NIC = ? AND Branch_idBranch = ?",
      [NIC, Branch_idBranch]
    );
    if (existingCustomer.length > 0) {
      return next(
        errorHandler(
          400,
          "Customer with this NIC already exists in this branch"
        )
      );
    }

    const [result] = await pool.query("INSERT INTO customer SET ?", {
      Title,
      First_Name,
      Full_Name,
      NIC,
      DOB,
      Address1,
      Address2,
      Address3,
      Postal_Address01,
      Postal_Address02,
      Postal_Address03,
      Mobile_No,
      Occupation,
      Work_Place,
      Phone_No,
      Phone_No2,
      Status,
      Behaviour_Status,
      Note,
      Branch_idBranch,
      emp_id: req.userId, // userId from middleware
    });

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to create customer"));
    }

    let fileUploadMessage;
    if (nicImage || customerImage) {
      try {
        if (nicImage) {
          const nicImageUrl = await uploadImage(nicImage);
          const [result] = await pool.query(
            "INSERT INTO customer_documents (Document_Name,Path,Customer_idCustomer) VALUES (?,?,?)",
            ["NIC", nicImageUrl, result.insertId]
          );

          fileUploadMessage = "NIC image and";
        }

        if (customerImage) {
          const customerImageUrl = await uploadImage(customerImage);
          const [result] = await pool.query(
            "INSERT INTO customer_documents (Document_Name,Path,Customer_idCustomer) VALUES (?,?,?)",
            ["Customer Image", customerImageUrl, result.insertId]
          );

          fileUploadMessage = fileUploadMessage
            ? `${fileUploadMessage} Customer image uploaded Successfully`
            : "Customer image uploaded Successfully";
        }
      } catch (error) {
        fileUploadMessage = error.message || "File upload failed";
        console.error("Error uploading images:", error);
        throw new Error(fileUploadMessage);
      }
    }

    customerLog(
      result.insertId,
      new Date(),
      "Create",
      "Customer created",
      req.userId
    ); // Log the customer creation action to db

    res.status(201).json({
      message: `Customer created successfully with ID ${result.insertId} and ${
        fileUploadMessage || "no images uploaded"
      }`,
      customerId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const getCustomersForTheBranch = async (req, res, next) => {
  try {
    const branchId = req.branchId; // extract branchId from the request
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    let paginationData;
    let customers;

    // If search query is provided, filter customers based on search criteria and get pagination data
    if (search) {
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM customer WHERE Branch_idBranch = ? AND (First_Name LIKE ? OR NIC LIKE ? OR Mobile_No LIKE ? OR idCustomer LIKE ?)",
        [branchId, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`],
        page,
        limit
      );

      // get customers for the branch with search - Fixed parameter order and MySQL LIMIT syntax
      [customers] = await pool.query(
        "SELECT idCustomer,First_Name,NIC,Address1,Mobile_No,Work_Place FROM customer WHERE Branch_idBranch = ? AND (First_Name LIKE ? OR NIC LIKE ? OR Mobile_No LIKE ? OR idCustomer LIKE ?) LIMIT ?, ?",
        [
          branchId,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          `%${search}%`,
          offset,
          limit,
        ]
      );
    }
    // If no search query is provided, get all customers for the branch and get pagination data
    else {
      // get pagination data
      paginationData = await getPaginationData(
        "SELECT COUNT(*) as total FROM customer WHERE Branch_idBranch = ?",
        [branchId],
        page,
        limit
      );

      // get customers for the branch - Fixed MySQL LIMIT syntax
      [customers] = await pool.query(
        "SELECT idCustomer,First_Name,NIC,Address1,Mobile_No,Work_Place FROM customer WHERE Branch_idBranch = ? LIMIT ?, ?",
        [branchId, offset, limit]
      );
    }

    res.status(200).json({
      message: "Customers fetched successfully",
      data: customers,
      pagination: paginationData,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId; // extract customerId from the request
    const branchId = req.branchId; // extract branchId from the request
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    if (!customerId) {
      return next(errorHandler(400, "Customer ID is required"));
    }

    let customer;

    // Fetch customer all data by the customer Id and the branch Id
    const [customerResult] = await pool.query(
      "SELECT * FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?",
      [customerId, branchId]
    );

    if (customerResult.length === 0) {
      return next(errorHandler(404, "Customer not found"));
    }

    customer = customerResult[0] || {};

    // Then Fetch customer documents
    const [documents] = await pool.query(
      "SELECT * FROM customer_documents WHERE Customer_idCustomer = ?",
      [customerId]
    );

    customer.documents = documents || [];

    res.status(200).json({
      message: "Customer fetched successfully",
      customer,
    });
  } catch (error) {
    console.error("Error fetching customer by ID:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};

export const editCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id || req.params.customerId;
    const {
      Title,
      First_Name,
      Full_Name,
      NIC,
      DOB,
      Address1,
      Address2,
      Address3,
      Postal_Address01,
      Postal_Address02,
      Postal_Address03,
      Mobile_No,
      Occupation,
      Work_Place,
      Phone_No,
      Phone_No2,
      Status,
      Behaviour_Status,
      Note,
      nicImage,
      customerImage,
    } = req.body;

    const [existingCustomer] = await pool.query(
      "SELECT idCustomer FROM customer WHERE idCustomer = ? AND Branch_idBranch = ?",
      [customerId, req.branchId]
    );

    if (existingCustomer.length === 0) {
      return next(errorHandler(404, "Customer not found to update"));
    }

    const [result] = await pool.query(
      "UPDATE customer SET Title = ?, First_Name = ?, Full_Name = ?, NIC = ?, DOB = ?, Address1 = ?, Address2 = ?, Address3 = ?, Postal_Address01 = ?, Postal_Address02 = ?, Postal_Address03 = ?, Mobile_No = ?, Occupation = ?, Work_Place = ?, Phone_No = ?, Phone_No2 = ?, Status = ?, Behaviour_Status = ?, Note = ? WHERE idCustomer = ? AND Branch_idBranch = ?",
      [
        Title,
        First_Name,
        Full_Name,
        NIC,
        DOB,
        Address1,
        Address2,
        Address3,
        Postal_Address01,
        Postal_Address02,
        Postal_Address03,
        Mobile_No,
        Occupation,
        Work_Place,
        Phone_No,
        Phone_No2,
        Status,
        Behaviour_Status,
        Note,
        customerId,
        req.branchId,
      ]
    );

    if (result.affectedRows === 0) {
      return next(errorHandler(500, "Failed to update customer"));
    }

    if (nicImage || customerImage) {
      // to be discussed with the team
    }

    customerLog(
      customerId,
      new Date(),
      "Update",
      "Customer updated",
      req.userId
    ); // Log the customer update action to db
    res.status(200).json({
      message: "Customer updated successfully",
      customerId,
    });
  } catch (error) {
    console.error("Error editing customer:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
