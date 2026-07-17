const mongoose = require("mongoose");
const { PERMISSION_KEYS, mergePermissions } = require("../utils/permissions");

const permissionsSchema = {};
for (const key of PERMISSION_KEYS) {
  permissionsSchema[key] = { type: Boolean, default: false };
}

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: "", trim: true },
    role: {
      type: String,
      enum: ["super_admin", "manager", "waiter", "chef"],
      required: true,
    },
    permissions: permissionsSchema,
    isActive: { type: Boolean, default: true },
    shift: {
      type: String,
      enum: ["ON SHIFT", "OFF DUTY"],
      default: "OFF DUTY",
    },
  },
  { timestamps: true }
);

staffSchema.pre("validate", function applyPermissionDefaults() {
  const current =
    typeof this.permissions?.toObject === "function"
      ? this.permissions.toObject()
      : this.permissions || {};
  this.permissions = mergePermissions(this.role, current);
});

staffSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    permissions: this.permissions,
    isActive: this.isActive,
    shift: this.shift,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Staff", staffSchema);
