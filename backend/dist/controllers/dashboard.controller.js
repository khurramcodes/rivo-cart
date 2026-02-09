import { asyncHandler } from "../utils/asyncHandler.js";
import * as dashboardService from "../services/dashboard.service.js";
export const getStats = asyncHandler(async (_req, res) => {
    const stats = await dashboardService.getDashboardStats();
    res.json(stats);
});
