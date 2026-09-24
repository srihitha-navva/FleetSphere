export function pagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

export function listResponse(res, data, total, page, limit, message = 'Records retrieved') {
  res.json({ success: true, message, data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
}

export function dateFilter(query, field = 'date') {
  if (!query.startDate && !query.endDate) return {};
  const filter = {};
  if (query.startDate) filter.$gte = new Date(query.startDate);
  if (query.endDate) filter.$lte = new Date(query.endDate);
  return { [field]: filter };
}
