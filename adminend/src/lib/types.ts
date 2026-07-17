export type StaffPermissions = {
  dashboard: boolean;
  menu: boolean;
  orders: boolean;
  inventory: boolean;
  financials: boolean;
  tables: boolean;
  bookings: boolean;
  staff: boolean;
};

export type StaffUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "super_admin" | "manager" | "waiter" | "chef";
  permissions: StaffPermissions;
  isActive: boolean;
  shift: "ON SHIFT" | "OFF DUTY";
};
