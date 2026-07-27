import { pool2 } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";

/**
 * Load active privilege Description strings for a designation.
 * Privileges live in the Account Center DB (pool2).
 */
export async function getUserPrivilegeDescriptions(designationId) {
  if (!designationId) return [];

  const [designationPrivileges] = await pool2.query(
    "SELECT User_Privilages_idUser_Privilages FROM designation_has_user_privilages WHERE Designation_idDesignation = ? AND Status = '1'",
    [designationId],
  );

  const descriptions = [];
  for (const privilege of designationPrivileges) {
    const [privilegeRows] = await pool2.query(
      "SELECT Description FROM user_privilages WHERE idUser_privilages = ?",
      [privilege.User_Privilages_idUser_Privilages],
    );
    if (privilegeRows[0]?.Description) {
      descriptions.push(privilegeRows[0].Description);
    }
  }
  return descriptions;
}

export async function designationHasPrivilege(
  designationId,
  requiredPrivileges = [],
) {
  if (!designationId || !requiredPrivileges.length) return false;
  const descriptions = await getUserPrivilegeDescriptions(designationId);
  return requiredPrivileges.some((privilege) =>
    descriptions.includes(privilege),
  );
}

/**
 * Middleware factory: user must have AT LEAST ONE of the listed privileges
 * (OR match). Pass exact Description strings from PAWNING_PRIVILEGES.
 *
 * Usage: checkUserHasPrivileges([PAWNING_PRIVILEGES.CUSTOMER_CREATE])
 */
export const checkUserHasPrivileges = (requiredPrivileges) => {
  return async (req, res, next) => {
    try {
      const list = Array.isArray(requiredPrivileges)
        ? requiredPrivileges
        : [requiredPrivileges];

      const hasPrivilege = await designationHasPrivilege(
        req.designationId,
        list,
      );

      if (!hasPrivilege) {
        return next(
          errorHandler(
            403,
            "Your designation doesn't have permission to perform this action",
          ),
        );
      }

      next();
    } catch (error) {
      console.error("Error in privilagesMiddleware: ", error);
      return next(errorHandler(400, "Error in privilagesMiddleware"));
    }
  };
};
