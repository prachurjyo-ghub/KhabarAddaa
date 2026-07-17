const jwt = require("jsonwebtoken");
const env = require("../config/env");

function signToken({ sub, kind, role }) {
  return jwt.sign({ sub, kind, role: role || null }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: undefined,
  };
}

function setAuthCookie(res, kind, token) {
  const name = kind === "staff" ? env.cookies.staff : env.cookies.customer;
  res.cookie(name, token, cookieOptions());
}

function clearAuthCookie(res, kind) {
  const name = kind === "staff" ? env.cookies.staff : env.cookies.customer;
  res.clearCookie(name, cookieOptions());
}

function extractToken(req, kind) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  const cookieName = kind === "staff" ? env.cookies.staff : env.cookies.customer;
  if (req.cookies?.[cookieName]) {
    return req.cookies[cookieName];
  }
  // Fallback: try either cookie if kind not forced
  if (!kind) {
    return (
      req.cookies?.[env.cookies.staff] ||
      req.cookies?.[env.cookies.customer] ||
      null
    );
  }
  return null;
}

module.exports = {
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
  extractToken,
};
