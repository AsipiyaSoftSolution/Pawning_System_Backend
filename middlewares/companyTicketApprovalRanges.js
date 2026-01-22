import { pool, pool2 } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

export const checkCompanyTicketApprovalRanges = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    // Get the approval ranges for the company
    let [approvalRanges] = await pool2.query(
      "SELECT * FROM pawning_ticket_approval_range WHERE companyid = ?",
      [companyId],
    );

    if (approvalRanges.length === 0) {
      req.approvalRanges = [];
      return next(); // No approval ranges found, proceed
    }

    // Get the levels of each range
    for (let range of approvalRanges) {
      let [levels] = await pool2.query(
        "SELECT * FROM pawning_ticket_approval_ranges_level WHERE Approval_Range_idApproval_Range = ?",
        [range.idApproval_Range],
      );

      // Attach levels to the range
      range.levels = levels;

      // Get the designation id's for each level
      for (let level of levels) {
        let [designations] = await pool2.query(
          "SELECT Designation_idDesignation FROM pawning_ticket_approval_levels_designations WHERE ApprovalRangeLevel_idApprovalRangeLevel = ?",
          [level.idApprovalRangeLevel],
        );

        // Attach designation ids to the level
        level.designations = designations.map(
          (d) => d.Designation_idDesignation,
        );
      }
    }

    console.log("Approval ranges:", approvalRanges);

    req.approvalRanges = approvalRanges;
    next(); // Proceed to the next middleware
  } catch (error) {
    console.error(
      "Error in checkCompanyTicketApprovalRanges middleware:",
      error,
    );
    return next(errorHandler(500, "Internal server error"));
  }
};
