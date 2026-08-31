/* Sistema de roles y permisos (RBAC) — refleja la matriz de la especificación
   y controla qué módulos del portal puede abrir cada rol. */

export type Role = "employee" | "section" | "manager" | "admin";

export const ROLE_ORDER: Role[] = ["employee", "section", "manager", "admin"];

const ALL: Role[] = ["employee", "section", "manager", "admin"];
const TEAM: Role[] = ["section", "manager", "admin"];
const MGMT: Role[] = ["manager", "admin"];
const ADM: Role[] = ["admin"];

export interface PermRow {
  key: string;
  group: string;
  roles: Role[];
}

export const PERM_GROUPS = ["rb.g.personal", "rb.g.team", "rb.g.mgmt", "rb.g.platform"] as const;

export const PERMS: PermRow[] = [
  { key: "rb.p1", group: "rb.g.personal", roles: ALL },
  { key: "rb.p2", group: "rb.g.personal", roles: ALL },
  { key: "rb.p3", group: "rb.g.personal", roles: ALL },
  { key: "rb.p4", group: "rb.g.personal", roles: ALL },
  { key: "rb.p5", group: "rb.g.personal", roles: ALL },
  { key: "rb.p6", group: "rb.g.personal", roles: ALL },
  { key: "rb.p7", group: "rb.g.personal", roles: ALL },
  { key: "rb.p8", group: "rb.g.personal", roles: ALL },
  { key: "rb.p9", group: "rb.g.personal", roles: ALL },
  { key: "rb.p10", group: "rb.g.team", roles: TEAM },
  { key: "rb.p11", group: "rb.g.team", roles: TEAM },
  { key: "rb.p12", group: "rb.g.team", roles: TEAM },
  { key: "rb.p13", group: "rb.g.team", roles: TEAM },
  { key: "rb.p14", group: "rb.g.team", roles: TEAM },
  { key: "rb.p15", group: "rb.g.mgmt", roles: MGMT },
  { key: "rb.p16", group: "rb.g.mgmt", roles: MGMT },
  { key: "rb.p17", group: "rb.g.platform", roles: ADM },
  { key: "rb.p18", group: "rb.g.platform", roles: ADM },
  { key: "rb.p19", group: "rb.g.platform", roles: ADM },
  { key: "rb.p20", group: "rb.g.platform", roles: ADM },
];

export const permCount = (r: Role) => PERMS.filter((p) => p.roles.includes(r)).length;

export const ROLE_COLOR: Record<Role, string> = {
  employee: "#54688c",
  section: "#e89f2e",
  manager: "#2e7d8c",
  admin: "#1b5a43",
};

/* Módulos del portal visibles por rol (derivado de la matriz) */
const EMPLOYEE_VIEWS = [
  "dashboard",
  "attendance",
  "chat",
  "training",
  "documents",
  "incidents",
  "mobile",
  "ecosystem",
];

export const ROLE_VIEWS: Record<Role, string[]> = {
  employee: EMPLOYEE_VIEWS,
  section: [...EMPLOYEE_VIEWS, "schedule", "tasks", "expenses"],
  manager: [...EMPLOYEE_VIEWS, "schedule", "tasks", "expenses", "payroll"],
  admin: [
    "dashboard",
    "employees",
    "schedule",
    "attendance",
    "payroll",
    "expenses",
    "tasks",
    "chat",
    "training",
    "documents",
    "incidents",
    "reports",
    "mobile",
    "ecosystem",
    "dataModel",
    "blueprint",
  ],
};

export const canAccess = (r: Role, view: string) => ROLE_VIEWS[r].includes(view);
