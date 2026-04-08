const jwt = require("jsonwebtoken");

// 🔐 Load from .env
const JWT_SECRET = process.env.JWT_SECRET;

// =======================
// ✅ PROTECT MIDDLEWARE
// =======================
exports.protect = (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // No token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user (id + role)
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid token",
    });
  }
};

// =======================
// ✅ ROLE AUTHORIZATION (NEW)
// =======================
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }
    next();
  };
};
