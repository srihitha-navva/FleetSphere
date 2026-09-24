import { asyncHandler } from '../utils/asyncHandler.js';
import { overview } from '../services/analyticsService.js';
export const getOverview = asyncHandler(async (req, res) => res.json({ success: true, data: await overview(req) }));
export const getMetric = getOverview;
