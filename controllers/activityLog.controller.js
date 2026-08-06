import { pool, pool2 } from "../utils/db.js";
import { errorHandler } from "../utils/errorHandler.js";
import { getPaginationData } from "../utils/helper.js";
import { formatActivityActionForDisplay } from "../utils/activityLogActions.js";

/**
 * GET /api/activity-logs
 * Account Center–compatible list of pawning activity logs.
 *
 * Query: companyId (optional; defaults to JWT company), page, limit,
 *        startDate, endDate, userId
 */
export const getActivityLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );
    const offset = (page - 1) * limit;
    const startDate =
      typeof req.query.startDate === "string" && req.query.startDate.trim()
        ? req.query.startDate.trim()
        : null;
    const endDate =
      typeof req.query.endDate === "string" && req.query.endDate.trim()
        ? req.query.endDate.trim()
        : null;
    const filterUserId = req.query.userId
      ? Number(req.query.userId)
      : null;
    const companyId = Number(req.query.companyId) || Number(req.companyId);

    if (!companyId) {
      return next(errorHandler(400, "Company ID is required"));
    }

    let userIds = [];
    if (filterUserId && Number.isFinite(filterUserId)) {
      const [owned] = await pool2.query(
        "SELECT idUser FROM user WHERE idUser = ? AND Company_idCompany = ?",
        [filterUserId, companyId],
      );
      userIds = owned.map((u) => u.idUser);
    } else {
      const [allUsers] = await pool2.query(
        "SELECT idUser FROM user WHERE Company_idCompany = ?",
        [companyId],
      );
      userIds = allUsers.map((u) => u.idUser);
    }

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Activity logs fetched successfully",
        activityLogs: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          currentPage: page,
          nextPage: null,
          prevPage: null,
          last_page: 0,
          total: 0,
          current_page: page,
          per_page: limit,
        },
      });
    }

    // Exclude noisy auth chatter (same idea as Account Center home filter)
    const baseWhere =
      "al.user_id IN (?) AND al.action NOT LIKE ? AND al.action NOT LIKE ?";
    const baseParams = [userIds.map(String), "%Log In%", "%Grant Access Token%"];

    const dateClauses = [];
    const dateParams = [];
    if (startDate && endDate) {
      dateClauses.push("DATE(al.created_at) >= ? AND DATE(al.created_at) <= ?");
      dateParams.push(startDate, endDate);
    } else if (startDate) {
      dateClauses.push("DATE(al.created_at) >= ?");
      dateParams.push(startDate);
    } else if (endDate) {
      dateClauses.push("DATE(al.created_at) <= ?");
      dateParams.push(endDate);
    }
    const dateSql = dateClauses.length
      ? ` AND ${dateClauses.join(" AND ")}`
      : "";

    const paginationData = await getPaginationData(
      `SELECT COUNT(*) AS total FROM activity_logs al WHERE ${baseWhere}${dateSql}`,
      [...baseParams, ...dateParams],
      page,
      limit,
    );

    const [rows] = await pool.query(
      `SELECT al.id, al.user_id, al.action, al.status, al.metadata, al.created_at
       FROM activity_logs al
       WHERE ${baseWhere}${dateSql}
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [...baseParams, ...dateParams, limit, offset],
    );

    // Resolve usernames from Account Center user table (pool2)
    const uniqueUserIds = [
      ...new Set(
        rows
          .map((r) => Number(r.user_id))
          .filter((id) => Number.isFinite(id)),
      ),
    ];
    let userMap = new Map();
    if (uniqueUserIds.length > 0) {
      const placeholders = uniqueUserIds.map(() => "?").join(",");
      const [users] = await pool2.query(
        `SELECT idUser, full_name FROM user WHERE idUser IN (${placeholders})`,
        uniqueUserIds,
      );
      userMap = new Map(users.map((u) => [Number(u.idUser), u.full_name]));
    }

    const activityLogs = rows.map((row) => ({
      id: row.id,
      action: formatActivityActionForDisplay(row.action),
      status: row.status,
      created_at: row.created_at,
      username: userMap.get(Number(row.user_id)) || null,
      metadata: row.metadata,
    }));

    return res.status(200).json({
      success: true,
      message: "Activity logs fetched successfully",
      activityLogs,
      pagination: {
        ...paginationData,
        total: paginationData.totalCount ?? 0,
        current_page: paginationData.currentPage ?? page,
        per_page: limit,
        last_page: paginationData.totalPages ?? paginationData.last_page ?? 0,
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return next(errorHandler(500, "Internal Server Error"));
  }
};
