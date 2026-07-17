const PERMISSION_KEYS = [
  "dashboard",
  "menu",
  "orders",
  "inventory",
  "financials",
  "tables",
  "bookings",
  "staff",
];

const ROLE_DEFAULTS = {
  super_admin: Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true])),
  manager: {
    dashboard: true,
    menu: true,
    orders: true,
    inventory: true,
    financials: true,
    tables: true,
    bookings: true,
    staff: false,
  },
  waiter: {
    dashboard: true,
    menu: false,
    orders: true,
    inventory: false,
    financials: false,
    tables: true,
    bookings: true,
    staff: false,
  },
  chef: {
    dashboard: true,
    menu: false,
    orders: true,
    inventory: true,
    financials: false,
    tables: false,
    bookings: false,
    staff: false,
  },
};

function defaultPermissionsForRole(role) {
  const base = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.waiter;
  return { ...base };
}

function mergePermissions(role, overrides = {}) {
  if (role === "super_admin") {
    return defaultPermissionsForRole("super_admin");
  }
  const defaults = defaultPermissionsForRole(role);
  const merged = { ...defaults };
  for (const key of PERMISSION_KEYS) {
    if (typeof overrides[key] === "boolean") {
      merged[key] = overrides[key];
    }
  }
  return merged;
}

module.exports = {
  PERMISSION_KEYS,
  ROLE_DEFAULTS,
  defaultPermissionsForRole,
  mergePermissions,
};
