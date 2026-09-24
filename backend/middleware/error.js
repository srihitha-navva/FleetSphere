export function notFound(req, res) { res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` }); }

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(err);
  if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'Invalid resource identifier' });
  if (err.code === 11000) return res.status(409).json({ success: false, message: `Duplicate value for ${Object.keys(err.keyValue).join(', ')}` });
  if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: Object.values(err.errors).map((e) => e.message).join(', ') });
  return res.status(err.statusCode || 500).json({ success: false, message: err.isOperational ? err.message : 'Internal server error' });
}
