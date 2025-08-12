import { errorHandler } from "../utils/errorHandler.js";
import { pool } from "../utils/db.js";
import { uploadImage } from "../utils/cloudinary.js";

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
