const ApiError = require("../utils/ApiError");
const { extractToken, verifyToken } = require("../utils/tokens");
const Staff = require("../models/Staff");
const Customer = require("../models/Customer");

async function authenticate(req, _res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new ApiError(401, "Authentication required");
    }
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw new ApiError(401, "Invalid or expired token");
    }

    if (payload.kind === "staff") {
      const staff = await Staff.findById(payload.sub);
      if (!staff || !staff.isActive) {
        throw new ApiError(401, "Staff account inactive or not found");
      }
      req.auth = {
        kind: "staff",
        user: staff,
        role: staff.role,
        permissions: staff.permissions,
      };
    } else if (payload.kind === "customer") {
      const customer = await Customer.findById(payload.sub);
      if (!customer) {
        throw new ApiError(401, "Customer not found");
      }
      req.auth = { kind: "customer", user: customer };
    } else {
      throw new ApiError(401, "Invalid token kind");
    }
    next();
  } catch (err) {
    next(err);
  }
}

function requireStaff(req, _res, next) {
  if (req.auth?.kind !== "staff") {
    return next(new ApiError(403, "Staff access required"));
  }
  next();
}

function requireCustomer(req, _res, next) {
  if (req.auth?.kind !== "customer") {
    return next(new ApiError(403, "Customer access required"));
  }
  next();
}

function requirePermission(...keys) {
  return (req, _res, next) => {
    if (req.auth?.kind !== "staff") {
      return next(new ApiError(403, "Staff access required"));
    }
    if (req.auth.role === "super_admin") {
      return next();
    }
    const perms = req.auth.permissions || {};
    const ok = keys.every((k) => perms[k] === true);
    if (!ok) {
      return next(new ApiError(403, "Missing required permission"));
    }
    next();
  };
}

function requireSuperAdmin(req, _res, next) {
  if (req.auth?.kind !== "staff" || req.auth.role !== "super_admin") {
    return next(new ApiError(403, "Super admin access required"));
  }
  next();
}

module.exports = {
  authenticate,
  requireStaff,
  requireCustomer,
  requirePermission,
  requireSuperAdmin,
};
