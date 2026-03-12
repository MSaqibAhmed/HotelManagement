export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  RECEPTIONIST: "receptionist",
  HOUSEKEEPING: "housekeeping",
  MAINTENANCE: "maintenance",
  GUEST: "guest",
};

// Map each frontend dashboard path to allowed roles based on Backend Authorizations
export const routePermissions = {
  // User Management
  "/dashboard/user-management/add-staff": [ROLES.ADMIN],
  "/dashboard/user-management/staff": [ROLES.ADMIN],

  // Room Management
  "/dashboard/room-management/rooms": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  "/dashboard/room-management/add-room": [ROLES.ADMIN],
  "/dashboard/room-management/edit-room": [ROLES.ADMIN],
  "/dashboard/room-management/pricing-control": [ROLES.ADMIN],
  "/dashboard/room-management/status-overview": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],

  // Reservations
  "/dashboard/reservations": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  "/dashboard/reservations/create": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  "/dashboard/reservations/modify": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  "/dashboard/reservations/check-in": [ROLES.ADMIN, ROLES.RECEPTIONIST],
  "/dashboard/reservations/check-out": [ROLES.ADMIN, ROLES.RECEPTIONIST],

  // Billing
  "/dashboard/billing": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  "/dashboard/billing/invoices": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  "/dashboard/billing/payments": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],

  // Housekeeping
  "/dashboard/housekeeping/room-status": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING],
  "/dashboard/housekeeping/assigned-tasks": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST], // only admin/managers assign
  "/dashboard/housekeeping/cleaning-report": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING],
  "/dashboard/housekeeping/checklist": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING],

  // Maintenance
  "/dashboard/maintenance/requests": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.MAINTENANCE],
  "/dashboard/maintenance/update-status": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.MAINTENANCE],
  "/dashboard/maintenance/history": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.MAINTENANCE],

  // System
  "/dashboard/system/reports-analytics": [ROLES.ADMIN, ROLES.MANAGER],
  "/dashboard/system/notifications": [ROLES.ADMIN, ROLES.MANAGER],
  "/dashboard/system/settings": [ROLES.ADMIN],
};

// Sidebar menus allowed roles mapping (matches titles from DashboardSideBar.jsx)
export const sidebarPermissions = {
  "Dashboard": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING, ROLES.MAINTENANCE],
  "User Management": [ROLES.ADMIN],
  "Room Management": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  "Reservations": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  "Billing & Invoicing": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST],
  "Housekeeping": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.HOUSEKEEPING],
  "Maintenance": [ROLES.ADMIN, ROLES.MANAGER, ROLES.RECEPTIONIST, ROLES.MAINTENANCE],
  "Guest": [ROLES.ADMIN], // Guest section is hidden for typical staff
  "System": [ROLES.ADMIN, ROLES.MANAGER],
};

// Check access helper
export const checkAccess = (userRole, requiredRoles) => {
  if (!userRole) return false;
  const role = userRole.toLowerCase();
  
  // Admin fallback - can access anything
  if (role === ROLES.ADMIN) return true;
  return requiredRoles.includes(role);
};
