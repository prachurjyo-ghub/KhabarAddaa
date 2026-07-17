const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");
const sendSuccess = require("../utils/sendSuccess");
const { signToken, setAuthCookie, clearAuthCookie } = require("../utils/tokens");
const { mergePermissions } = require("../utils/permissions");
const Customer = require("../models/Customer");
const Staff = require("../models/Staff");
const StaffOtp = require("../models/StaffOtp");
const CustomerOtp = require("../models/CustomerOtp");

function makeOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function registerCustomer(req, res) {
  const { name, email, password, phone } = req.body || {};
  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }
  if (String(password).length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
  const exists = await Customer.findOne({ email: String(email).toLowerCase() });
  if (exists) {
    throw new ApiError(409, "Email already registered");
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const customer = await Customer.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    phone: phone ? String(phone).trim() : "",
  });
  const token = signToken({ sub: customer._id.toString(), kind: "customer" });
  setAuthCookie(res, "customer", token);
  return sendSuccess(
    res,
    { token, user: customer.toSafeJSON() },
    "Registered",
    201
  );
}

async function loginCustomer(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  const customer = await Customer.findOne({ email: String(email).toLowerCase() });
  if (!customer) {
    throw new ApiError(401, "Invalid credentials");
  }
  const ok = await bcrypt.compare(String(password), customer.passwordHash);
  if (!ok) {
    throw new ApiError(401, "Invalid credentials");
  }
  const token = signToken({ sub: customer._id.toString(), kind: "customer" });
  setAuthCookie(res, "customer", token);
  return sendSuccess(res, { token, user: customer.toSafeJSON() }, "Logged in");
}

async function getCustomerMe(req, res) {
  return sendSuccess(res, { user: req.auth.user.toSafeJSON() });
}

async function updateCustomerMe(req, res) {
  const customer = req.auth.user;
  const { name, phone, addresses } = req.body || {};
  if (name !== undefined) customer.name = String(name).trim();
  if (phone !== undefined) customer.phone = String(phone).trim();
  if (addresses !== undefined) {
    if (!Array.isArray(addresses)) {
      throw new ApiError(400, "Addresses must be an array");
    }
    customer.addresses = addresses;
  }
  await customer.save();
  return sendSuccess(res, { user: customer.toSafeJSON() }, "Profile updated");
}

async function logoutCustomer(_req, res) {
  clearAuthCookie(res, "customer");
  return sendSuccess(res, null, "Logged out");
}

async function loginStaff(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  const staff = await Staff.findOne({ email: String(email).toLowerCase() });
  if (!staff || !staff.isActive) {
    throw new ApiError(401, "Invalid credentials or inactive account");
  }
  const ok = await bcrypt.compare(String(password), staff.passwordHash);
  if (!ok) {
    throw new ApiError(401, "Invalid credentials or inactive account");
  }
  const token = signToken({
    sub: staff._id.toString(),
    kind: "staff",
    role: staff.role,
  });
  setAuthCookie(res, "staff", token);
  return sendSuccess(res, { token, user: staff.toSafeJSON() }, "Logged in");
}

async function getStaffMe(req, res) {
  return sendSuccess(res, { user: req.auth.user.toSafeJSON() });
}

async function updateStaffMe(req, res) {
  const staff = req.auth.user;
  const { name, phone, shift } = req.body || {};
  if (name !== undefined) staff.name = String(name).trim();
  if (phone !== undefined) staff.phone = String(phone).trim();
  if (shift !== undefined) {
    if (!["ON SHIFT", "OFF DUTY"].includes(shift)) {
      throw new ApiError(400, "Invalid shift value");
    }
    staff.shift = shift;
  }
  await staff.save();
  return sendSuccess(res, { user: staff.toSafeJSON() }, "Profile updated");
}

async function changeStaffPassword(req, res) {
  const staff = req.auth.user;
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }
  if (String(newPassword).length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
  const ok = await bcrypt.compare(String(currentPassword), staff.passwordHash);
  if (!ok) {
    throw new ApiError(401, "Current password is incorrect");
  }
  staff.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await staff.save();
  return sendSuccess(res, null, "Password updated");
}

async function logoutStaff(_req, res) {
  clearAuthCookie(res, "staff");
  return sendSuccess(res, null, "Logged out");
}

async function listStaff(_req, res) {
  const staff = await Staff.find().sort({ createdAt: -1 });
  return sendSuccess(res, { staff: staff.map((s) => s.toSafeJSON()) });
}

async function createStaff(req, res) {
  const { name, email, password, phone, role, permissions, shift } = req.body || {};
  if (!name || !email || !password || !role) {
    throw new ApiError(400, "Name, email, password, and role are required");
  }
  if (!["manager", "waiter", "chef", "super_admin"].includes(role)) {
    throw new ApiError(400, "Invalid role");
  }
  if (String(password).length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
  const exists = await Staff.findOne({ email: String(email).toLowerCase() });
  if (exists) {
    throw new ApiError(409, "Staff email already exists");
  }
  const passwordHash = await bcrypt.hash(String(password), 10);
  const staff = await Staff.create({
    name: String(name).trim(),
    email: String(email).toLowerCase().trim(),
    passwordHash,
    phone: phone ? String(phone).trim() : "",
    role,
    permissions: mergePermissions(role, permissions || {}),
    shift: shift || "OFF DUTY",
    isActive: true,
  });
  return sendSuccess(res, { user: staff.toSafeJSON() }, "Staff created", 201);
}

async function updateStaff(req, res) {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    throw new ApiError(404, "Staff not found");
  }
  const { name, phone, role, permissions, isActive, shift, password } = req.body || {};

  if (staff.role === "super_admin") {
    if (isActive === false) {
      throw new ApiError(400, "Super admin cannot be deactivated");
    }
  }

  if (name !== undefined) staff.name = String(name).trim();
  if (phone !== undefined) staff.phone = String(phone).trim();
  if (role !== undefined) {
    if (!["manager", "waiter", "chef", "super_admin"].includes(role)) {
      throw new ApiError(400, "Invalid role");
    }
    staff.role = role;
  }
  if (permissions !== undefined || role !== undefined) {
    staff.permissions = mergePermissions(staff.role, permissions || staff.permissions);
  }
  if (isActive !== undefined) staff.isActive = Boolean(isActive);
  if (shift !== undefined) {
    if (!["ON SHIFT", "OFF DUTY"].includes(shift)) {
      throw new ApiError(400, "Invalid shift value");
    }
    staff.shift = shift;
  }
  if (password) {
    if (String(password).length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }
    staff.passwordHash = await bcrypt.hash(String(password), 10);
  }
  await staff.save();
  return sendSuccess(res, { user: staff.toSafeJSON() }, "Staff updated");
}

async function deleteStaff(req, res) {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    throw new ApiError(404, "Staff not found");
  }
  if (staff.role === "super_admin") {
    throw new ApiError(400, "Super admin cannot be deleted");
  }
  await staff.deleteOne();
  return sendSuccess(res, null, "Staff deleted");
}

async function requestEmailChangeOtp(req, res) {
  const staff = req.auth.user;
  if (staff.role !== "super_admin") {
    throw new ApiError(403, "Only super admin can change email");
  }
  const { newEmail } = req.body || {};
  if (!newEmail) {
    throw new ApiError(400, "New email is required");
  }
  const code = makeOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await StaffOtp.deleteMany({ staffId: staff._id, purpose: "email_change" });
  await StaffOtp.create({
    staffId: staff._id,
    purpose: "email_change",
    code,
    verified: false,
    expiresAt,
    meta: { newEmail: String(newEmail).toLowerCase().trim() },
  });
  return sendSuccess(res, { devOtp: code, expiresAt }, "OTP sent (dev)");
}

async function verifyEmailChangeOtp(req, res) {
  const staff = req.auth.user;
  const { code } = req.body || {};
  const otp = await StaffOtp.findOne({
    staffId: staff._id,
    purpose: "email_change",
    code: String(code || ""),
  });
  if (!otp || otp.expiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  otp.verified = true;
  await otp.save();
  return sendSuccess(res, { verified: true }, "OTP verified");
}

async function confirmEmailChange(req, res) {
  const staff = req.auth.user;
  if (staff.role !== "super_admin") {
    throw new ApiError(403, "Only super admin can change email");
  }
  const otp = await StaffOtp.findOne({
    staffId: staff._id,
    purpose: "email_change",
    verified: true,
  }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt < new Date()) {
    throw new ApiError(400, "Verified OTP required");
  }
  const newEmail = otp.meta?.newEmail;
  if (!newEmail) {
    throw new ApiError(400, "Missing new email on OTP");
  }
  const clash = await Staff.findOne({ email: newEmail, _id: { $ne: staff._id } });
  if (clash) {
    throw new ApiError(409, "Email already in use");
  }
  staff.email = newEmail;
  await staff.save();
  await StaffOtp.deleteMany({ staffId: staff._id, purpose: "email_change" });
  return sendSuccess(res, { user: staff.toSafeJSON() }, "Email updated");
}

async function requestPasswordResetOtp(req, res) {
  const { email } = req.body || {};
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const staff = await Staff.findOne({ email: String(email).toLowerCase() });
  if (!staff || !staff.isActive) {
    // Avoid account enumeration
    return sendSuccess(res, { sent: true }, "If the account exists, OTP was sent");
  }
  const code = makeOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await StaffOtp.deleteMany({ staffId: staff._id, purpose: "password_reset" });
  await StaffOtp.create({
    staffId: staff._id,
    purpose: "password_reset",
    code,
    verified: false,
    expiresAt,
  });
  return sendSuccess(
    res,
    { sent: true, devOtp: code, expiresAt },
    "If the account exists, OTP was sent"
  );
}

async function verifyPasswordResetOtp(req, res) {
  const { email, code } = req.body || {};
  const staff = await Staff.findOne({ email: String(email || "").toLowerCase() });
  if (!staff) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  const otp = await StaffOtp.findOne({
    staffId: staff._id,
    purpose: "password_reset",
    code: String(code || ""),
  });
  if (!otp || otp.expiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  otp.verified = true;
  await otp.save();
  return sendSuccess(res, { verified: true }, "OTP verified");
}

async function confirmPasswordReset(req, res) {
  const { email, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
  const staff = await Staff.findOne({ email: String(email || "").toLowerCase() });
  if (!staff) {
    throw new ApiError(400, "Verified OTP required");
  }
  const otp = await StaffOtp.findOne({
    staffId: staff._id,
    purpose: "password_reset",
    verified: true,
  }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt < new Date()) {
    throw new ApiError(400, "Verified OTP required");
  }
  staff.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await staff.save();
  await StaffOtp.deleteMany({ staffId: staff._id, purpose: "password_reset" });
  return sendSuccess(res, null, "Password reset successful");
}

async function requestCustomerPasswordResetOtp(req, res) {
  const { email } = req.body || {};
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const customer = await Customer.findOne({
    email: String(email).toLowerCase(),
  });
  if (!customer) {
    return sendSuccess(res, { sent: true }, "If the account exists, OTP was sent");
  }
  const code = makeOtpCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await CustomerOtp.deleteMany({
    customerId: customer._id,
    purpose: "password_reset",
  });
  await CustomerOtp.create({
    customerId: customer._id,
    purpose: "password_reset",
    code,
    verified: false,
    expiresAt,
  });
  return sendSuccess(
    res,
    { sent: true, devOtp: code, expiresAt },
    "If the account exists, OTP was sent"
  );
}

async function verifyCustomerPasswordResetOtp(req, res) {
  const { email, code } = req.body || {};
  const customer = await Customer.findOne({
    email: String(email || "").toLowerCase(),
  });
  if (!customer) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  const otp = await CustomerOtp.findOne({
    customerId: customer._id,
    purpose: "password_reset",
    code: String(code || ""),
  });
  if (!otp || otp.expiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  otp.verified = true;
  await otp.save();
  return sendSuccess(res, { verified: true }, "OTP verified");
}

async function confirmCustomerPasswordReset(req, res) {
  const { email, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }
  const customer = await Customer.findOne({
    email: String(email || "").toLowerCase(),
  });
  if (!customer) {
    throw new ApiError(400, "Verified OTP required");
  }
  const otp = await CustomerOtp.findOne({
    customerId: customer._id,
    purpose: "password_reset",
    verified: true,
  }).sort({ createdAt: -1 });
  if (!otp || otp.expiresAt < new Date()) {
    throw new ApiError(400, "Verified OTP required");
  }
  customer.passwordHash = await bcrypt.hash(String(newPassword), 10);
  await customer.save();
  await CustomerOtp.deleteMany({
    customerId: customer._id,
    purpose: "password_reset",
  });
  return sendSuccess(res, null, "Password reset successful");
}

module.exports = {
  registerCustomer,
  loginCustomer,
  getCustomerMe,
  updateCustomerMe,
  logoutCustomer,
  loginStaff,
  getStaffMe,
  updateStaffMe,
  changeStaffPassword,
  logoutStaff,
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  requestEmailChangeOtp,
  verifyEmailChangeOtp,
  confirmEmailChange,
  requestPasswordResetOtp,
  verifyPasswordResetOtp,
  confirmPasswordReset,
  requestCustomerPasswordResetOtp,
  verifyCustomerPasswordResetOtp,
  confirmCustomerPasswordReset,
};
