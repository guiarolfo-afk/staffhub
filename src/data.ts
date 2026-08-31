import { v4 as uuid } from "uuid";

/* ================= types ================= */

export type Dept = "kitchen" | "hall" | "reception" | "bar" | "floors";
export type EmpStatus = "active" | "vacation" | "leave";
export type ShiftType = "morning" | "afternoon" | "night";
export type AttStatus = "onTime" | "late" | "absent" | "onShift" | "break" | "off";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  dept: Dept;
  status: EmpStatus;
  hired: string;
  langs: string[];
  rate: number;
  score: number;
}

export interface Shift {
  id: string;
  empId: string;
  day: number; // 0 = Monday
  start: string; // "09:00"
  end: string; // "17:00"
  type: ShiftType;
}

export interface AttRecord {
  id: string;
  empId: string;
  clockIn: string;
  clockOut: string | null;
  status: AttStatus;
}

export interface LiveEvent {
  id: string;
  empId: string;
  kind: "in" | "out" | "breakStart" | "breakEnd";
  time: string;
  ts: number;
}

export interface ChatMsg {
  id: string;
  author: string;
  role: string;
  text: string;
  time: string;
  me?: boolean;
}

/* ================= palettes ================= */

export const DEPT_META: Record<Dept, { fg: string; bg: string; solid: string }> = {
  kitchen: { fg: "#9a5b16", bg: "#f9ecdb", solid: "#d98324" },
  hall: { fg: "#1b5a43", bg: "#e2efe7", solid: "#256b52" },
  reception: { fg: "#1f5d6a", bg: "#dfeef1", solid: "#2e7d8c" },
  bar: { fg: "#9d6212", bg: "#f8eed6", solid: "#e89f2e" },
  floors: { fg: "#42536f", bg: "#e5eaf3", solid: "#54688c" },
};

export const SHIFT_META: Record<ShiftType, { fg: string; bg: string; solid: string }> = {
  morning: { fg: "#144935", bg: "#e2efe7", solid: "#256b52" },
  afternoon: { fg: "#9d6212", bg: "#f8eed6", solid: "#e89f2e" },
  night: { fg: "#3a4a66", bg: "#e5eaf3", solid: "#54688c" },
};

export const AVATAR_COLORS = ["#1b5a43", "#c77f1b", "#2e7d8c", "#54688c", "#7b5ea7", "#b04327", "#3d8567", "#9d6212"];

export function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/* ================= seed data ================= */

export const EMPLOYEES: Employee[] = [
  { id: "e1", name: "Valentina Ríos", email: "valentina@labrasa.co", phone: "+52 55 1034 2280", role: "Gerente General", dept: "hall", status: "active", hired: "2019-03-11", langs: ["ES", "EN"], rate: 32, score: 96 },
  { id: "e2", name: "Mateo Herrera", email: "mateo@labrasa.co", phone: "+52 55 8811 7342", role: "Subgerente", dept: "hall", status: "active", hired: "2020-08-24", langs: ["ES", "EN"], rate: 26, score: 91 },
  { id: "e3", name: "Carla Mendes", email: "carla@labrasa.co", phone: "+55 11 98822 4471", role: "Líder de Recepción", dept: "reception", status: "active", hired: "2021-01-18", langs: ["PT", "ES", "EN"], rate: 19, score: 94 },
  { id: "e4", name: "João Silva", email: "joao@labrasa.co", phone: "+55 21 97711 0238", role: "Chef de Cocina", dept: "kitchen", status: "active", hired: "2018-06-02", langs: ["PT", "ES"], rate: 24, score: 97 },
  { id: "e5", name: "Lucía Fernández", email: "lucia@labrasa.co", phone: "+34 612 44 88 10", role: "Camarera", dept: "hall", status: "active", hired: "2022-04-05", langs: ["ES", "EN"], rate: 14, score: 88 },
  { id: "e6", name: "Andrés Quispe", email: "andres@labrasa.co", phone: "+51 987 220 145", role: "Cocinero de Línea", dept: "kitchen", status: "active", hired: "2022-09-12", langs: ["ES"], rate: 15, score: 85 },
  { id: "e7", name: "Fernanda Costa", email: "fernanda@labrasa.co", phone: "+55 31 99655 8012", role: "Bartender Principal", dept: "bar", status: "active", hired: "2021-11-30", langs: ["PT", "EN"], rate: 16, score: 92 },
  { id: "e8", name: "Diego Morales", email: "diego@labrasa.co", phone: "+52 55 3390 6617", role: "Pisos y Limpieza", dept: "floors", status: "active", hired: "2023-02-14", langs: ["ES"], rate: 12, score: 82 },
  { id: "e9", name: "Sofía Almeida", email: "sofia@labrasa.co", phone: "+351 912 448 207", role: "Agente de Recepción", dept: "reception", status: "vacation", hired: "2022-07-01", langs: ["PT", "ES"], rate: 15, score: 90 },
  { id: "e10", name: "Ricardo Paz", email: "ricardo@labrasa.co", phone: "+54 9 11 5524 8830", role: "Camarero", dept: "hall", status: "active", hired: "2023-05-22", langs: ["ES", "EN"], rate: 14, score: 78 },
  { id: "e11", name: "Elena Vargas", email: "elena@labrasa.co", phone: "+52 55 7745 0921", role: "Chef Pastelera", dept: "kitchen", status: "active", hired: "2020-10-09", langs: ["ES", "PT"], rate: 18, score: 93 },
  { id: "e12", name: "Tomás Ribeiro", email: "tomas@labrasa.co", phone: "+351 936 118 554", role: "Bartender", dept: "bar", status: "leave", hired: "2023-08-16", langs: ["PT", "ES"], rate: 14, score: 80 },
  { id: "e13", name: "Isabel Duarte", email: "isabel@labrasa.co", phone: "+55 11 97480 3396", role: "Pisos y Limpieza", dept: "floors", status: "active", hired: "2021-04-27", langs: ["PT", "ES"], rate: 12, score: 86 },
  { id: "e14", name: "Martín López", email: "martin@labrasa.co", phone: "+52 55 2210 9978", role: "Runner / Ayudante", dept: "hall", status: "active", hired: "2024-01-08", langs: ["ES"], rate: 11, score: 74 },
];

export const SHIFTS: Shift[] = [
  { id: "s1", empId: "e4", day: 0, start: "10:00", end: "18:00", type: "morning" },
  { id: "s2", empId: "e6", day: 0, start: "12:00", end: "20:00", type: "afternoon" },
  { id: "s3", empId: "e5", day: 0, start: "13:00", end: "21:00", type: "afternoon" },
  { id: "s4", empId: "e7", day: 0, start: "16:00", end: "00:00", type: "night" },
  { id: "s5", empId: "e3", day: 0, start: "07:00", end: "15:00", type: "morning" },
  { id: "s6", empId: "e4", day: 1, start: "10:00", end: "18:00", type: "morning" },
  { id: "s7", empId: "e11", day: 1, start: "08:00", end: "16:00", type: "morning" },
  { id: "s8", empId: "e10", day: 1, start: "13:00", end: "21:00", type: "afternoon" },
  { id: "s9", empId: "e8", day: 1, start: "06:00", end: "14:00", type: "morning" },
  { id: "s10", empId: "e4", day: 2, start: "10:00", end: "18:00", type: "morning" },
  { id: "s11", empId: "e4", day: 2, start: "16:00", end: "22:00", type: "night" }, // intentional conflict
  { id: "s12", empId: "e6", day: 2, start: "12:00", end: "20:00", type: "afternoon" },
  { id: "s13", empId: "e7", day: 2, start: "16:00", end: "00:00", type: "night" },
  { id: "s14", empId: "e5", day: 2, start: "13:00", end: "21:00", type: "afternoon" },
  { id: "s15", empId: "e3", day: 2, start: "07:00", end: "15:00", type: "morning" },
  { id: "s16", empId: "e11", day: 3, start: "08:00", end: "16:00", type: "morning" },
  { id: "s17", empId: "e10", day: 3, start: "13:00", end: "21:00", type: "afternoon" },
  { id: "s18", empId: "e14", day: 3, start: "17:00", end: "23:00", type: "night" },
  { id: "s19", empId: "e13", day: 3, start: "06:00", end: "14:00", type: "morning" },
  { id: "s20", empId: "e4", day: 3, start: "10:00", end: "18:00", type: "morning" },
  { id: "s21", empId: "e6", day: 4, start: "12:00", end: "20:00", type: "afternoon" },
  { id: "s22", empId: "e5", day: 4, start: "13:00", end: "21:00", type: "afternoon" },
  { id: "s23", empId: "e7", day: 4, start: "16:00", end: "00:00", type: "night" },
  { id: "s24", empId: "e3", day: 4, start: "15:00", end: "23:00", type: "afternoon" },
  { id: "s25", empId: "e14", day: 4, start: "17:00", end: "23:00", type: "night" },
  { id: "s26", empId: "e4", day: 5, start: "11:00", end: "19:00", type: "morning" },
  { id: "s27", empId: "e11", day: 5, start: "09:00", end: "17:00", type: "morning" },
  { id: "s28", empId: "e10", day: 5, start: "13:00", end: "21:00", type: "afternoon" },
  { id: "s29", empId: "e7", day: 5, start: "17:00", end: "01:00", type: "night" },
  { id: "s30", empId: "e8", day: 5, start: "06:00", end: "14:00", type: "morning" },
  { id: "s31", empId: "e6", day: 6, start: "12:00", end: "20:00", type: "afternoon" },
  { id: "s32", empId: "e13", day: 6, start: "06:00", end: "14:00", type: "morning" },
  { id: "s33", empId: "e14", day: 6, start: "12:00", end: "18:00", type: "afternoon" },
  { id: "s34", empId: "e5", day: 6, start: "13:00", end: "21:00", type: "afternoon" },
];

export const ATTENDANCE: AttRecord[] = [
  { id: "a1", empId: "e3", clockIn: "06:58", clockOut: null, status: "onShift" },
  { id: "a2", empId: "e8", clockIn: "05:59", clockOut: null, status: "onShift" },
  { id: "a3", empId: "e4", clockIn: "09:47", clockOut: null, status: "onShift" },
  { id: "a4", empId: "e11", clockIn: "07:58", clockOut: null, status: "onShift" },
  { id: "a5", empId: "e6", clockIn: "12:14", clockOut: null, status: "late" },
  { id: "a6", empId: "e5", clockIn: "12:55", clockOut: null, status: "onTime" },
  { id: "a7", empId: "e7", clockIn: "15:52", clockOut: null, status: "break" },
  { id: "a8", empId: "e10", clockIn: "13:02", clockOut: null, status: "onTime" },
  { id: "a9", empId: "e13", clockIn: "06:05", clockOut: "14:01", status: "off" },
  { id: "a10", empId: "e14", clockIn: "17:12", clockOut: null, status: "late" },
  { id: "a11", empId: "e2", clockIn: "09:00", clockOut: null, status: "onShift" },
  { id: "a12", empId: "e12", clockIn: "", clockOut: null, status: "absent" },
];

/* ================= charts ================= */

export const COVERS_WEEK = [
  { d: "day.0", covers: 142, hours: 96 },
  { d: "day.1", covers: 118, hours: 88 },
  { d: "day.2", covers: 151, hours: 102 },
  { d: "day.3", covers: 137, hours: 94 },
  { d: "day.4", covers: 204, hours: 118 },
  { d: "day.5", covers: 268, hours: 131 },
  { d: "day.6", covers: 236, hours: 122 },
];

export const LABOR_WEEKS = [
  { w: "S1", actual: 18.2, budget: 18.5 },
  { w: "S2", actual: 17.6, budget: 18.5 },
  { w: "S3", actual: 19.4, budget: 18.8 },
  { w: "S4", actual: 18.1, budget: 18.8 },
  { w: "S5", actual: 20.2, budget: 19.0 },
  { w: "S6", actual: 19.0, budget: 19.0 },
  { w: "S7", actual: 21.3, budget: 19.5 },
  { w: "S8", actual: 19.7, budget: 19.5 },
];

export const ATT_TREND = [
  { w: "S1", pct: 91.2 },
  { w: "S2", pct: 92.8 },
  { w: "S3", pct: 90.4 },
  { w: "S4", pct: 93.6 },
  { w: "S5", pct: 94.1 },
  { w: "S6", pct: 92.2 },
  { w: "S7", pct: 95.0 },
  { w: "S8", pct: 94.1 },
];

export const DEPT_COST = [
  { dept: "kitchen" as Dept, staff: 4, avgRate: 18.1, weekHours: 356, monthCost: 24600 },
  { dept: "hall" as Dept, staff: 5, avgRate: 15.4, weekHours: 388, monthCost: 22900 },
  { dept: "reception" as Dept, staff: 2, avgRate: 17.0, weekHours: 128, monthCost: 8400 },
  { dept: "bar" as Dept, staff: 2, avgRate: 15.0, weekHours: 142, monthCost: 8200 },
  { dept: "floors" as Dept, staff: 2, avgRate: 12.0, weekHours: 118, monthCost: 5600 },
];

/* ================= chat seeds ================= */

export function seedMessages(): Record<string, ChatMsg[]> {
  return {
    general: [
      { id: uuid(), author: "Mateo Herrera", role: "Subgerente", text: "Equipo, hoy esperamos casa llena: hay reservación de 24 personas a las 20:30.", time: "09:12" },
      { id: uuid(), author: "Carla Mendes", role: "Recepción", text: "Confirmado, ya está cargada en el sistema con mesa 12–14.", time: "09:15" },
      { id: uuid(), author: "Valentina Ríos", role: "Gerente General", text: "Perfecto. Refuerzo de sala: Lucía y Ricardo, turno extendido hasta las 23:00.", time: "09:21", me: true },
      { id: uuid(), author: "João Silva", role: "Chef", text: "Cocina lista. Vamos a sugerir el menú de brasas para el grupo grande.", time: "09:30" },
    ],
    kitchen: [
      { id: uuid(), author: "João Silva", role: "Chef", text: "Andrés, revisa el inventario de cortes antes de las 16:00 por favor.", time: "10:02" },
      { id: uuid(), author: "Andrés Quispe", role: "Cocinero", text: "Va, en cuanto salga del pase lo levanto completo.", time: "10:05" },
      { id: uuid(), author: "Elena Vargas", role: "Pastelería", text: "Salieron 12 tartas de la cámara, quedan 8 para la noche.", time: "11:40" },
    ],
    reception: [
      { id: uuid(), author: "Carla Mendes", role: "Recepción", text: "El huésped de la 304 pide late checkout a las 14:00, ¿aprobamos?", time: "08:47" },
      { id: uuid(), author: "Valentina Ríos", role: "Gerente General", text: "Sí, sin cargo. Está en el programa de lealtad.", time: "08:52", me: true },
    ],
  };
}

export const CHANNELS: { id: string; icon: "hash" | "flame" | "desk"; members: number }[] = [
  { id: "general", icon: "hash", members: 14 },
  { id: "kitchen", icon: "flame", members: 4 },
  { id: "reception", icon: "desk", members: 3 },
];

/* ================= helpers ================= */

export function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function todayIndex() {
  return (new Date().getDay() + 6) % 7; // 0 = Monday
}

export function minutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function shiftHours(s: Shift) {
  let end = minutes(s.end);
  if (end <= minutes(s.start)) end += 24 * 60;
  return (end - minutes(s.start)) / 60;
}

export function overlaps(a: Shift, b: Shift) {
  if (a.empId !== b.empId || a.day !== b.day || a.id === b.id) return false;
  const a0 = minutes(a.start);
  const a1 = a0 + shiftHours(a) * 60;
  const b0 = minutes(b.start);
  const b1 = b0 + shiftHours(b) * 60;
  return a0 < b1 && b0 < a1;
}

export function findConflicts(shifts: Shift[]) {
  const ids = new Set<string>();
  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      if (overlaps(shifts[i], shifts[j])) {
        ids.add(shifts[i].id);
        ids.add(shifts[j].id);
      }
    }
  }
  return ids;
}

export function weekDates(offset: number) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function fmtDate(d: Date, lang: string) {
  return d.toLocaleDateString(lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : "es-MX", {
    day: "numeric",
    month: "short",
  });
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ================= organizations ================= */

export interface Venue {
  id: string;
  name: string;
  type: string;
  city: string;
  staff: number;
}

export const VENUES: Venue[] = [
  { id: "v1", name: "La Brasa · Centro", type: "Restaurante", city: "CDMX", staff: 34 },
  { id: "v2", name: "Hotel Mirador", type: "Hotel", city: "Cartagena", staff: 58 },
  { id: "v3", name: "Brasa Market", type: "Retail", city: "Lisboa", staff: 21 },
];

/* ================= payroll ================= */

export type PayStatus = "paid" | "processing" | "pending";

export interface Payslip {
  id: string;
  empId: string;
  base: number;
  extras: number;
  deductions: number;
  net: number;
  status: PayStatus;
}

export function makePayslips(emps: Employee[]): Payslip[] {
  return emps.map((e, i) => {
    const base = Math.round(e.rate * 160);
    const extras = i % 3 === 0 ? Math.round(base * 0.06) : i % 4 === 0 ? Math.round(base * 0.11) : 0;
    const deductions = Math.round(base * 0.13);
    return {
      id: "p" + e.id,
      empId: e.id,
      base,
      extras,
      deductions,
      net: base + extras - deductions,
      status: i % 5 === 4 ? "processing" : i % 7 === 6 ? "pending" : "paid",
    } as Payslip;
  });
}

/* ================= expenses (AI) ================= */

export type ExpStatus = "pending" | "approved" | "rejected";

export interface Expense {
  id: string;
  empId: string;
  date: string;
  amount: number;
  concept: string;
  category: string; // i18n key suffix: exp.cat.*
  confidence: number; // AI %
  source: "ocr" | "manual";
  status: ExpStatus;
}

export const EXPENSES: Expense[] = [
  { id: "x1", empId: "e2", date: "2025-01-22", amount: 48.6, concept: "Mercado proveedores — hierbas frescas", category: "food", confidence: 97, source: "ocr", status: "pending" },
  { id: "x2", empId: "e5", date: "2025-01-22", amount: 126.0, concept: "Uber aeropuerto — traslado huésped VIP", category: "transport", confidence: 93, source: "ocr", status: "pending" },
  { id: "x3", empId: "e8", date: "2025-01-21", amount: 89.9, concept: "Cristalería rota — reposición", category: "supplies", confidence: 88, source: "ocr", status: "approved" },
  { id: "x4", empId: "e11", date: "2025-01-21", amount: 34.5, concept: "Insumos limpieza pisos 3–5", category: "supplies", confidence: 91, source: "manual", status: "approved" },
  { id: "x5", empId: "e14", date: "2025-01-20", amount: 210.0, concept: "Reparación máquina espresso", category: "maintenance", confidence: 96, source: "ocr", status: "pending" },
  { id: "x6", empId: "e3", date: "2025-01-19", amount: 57.2, concept: "Vinos cata proveedor — 6 botellas", category: "food", confidence: 74, source: "ocr", status: "rejected" },
  { id: "x7", empId: "e9", date: "2025-01-18", amount: 19.9, concept: "Impresión menús temporada", category: "marketing", confidence: 95, source: "manual", status: "approved" },
];

export const EXP_CATS = ["food", "transport", "supplies", "maintenance", "marketing"] as const;

export const EXP_CAT_COLOR: Record<string, string> = {
  food: "#256b52",
  transport: "#54688c",
  supplies: "#e89f2e",
  maintenance: "#ce5638",
  marketing: "#7b5ea7",
};

/* ================= tasks & checklists ================= */

export interface CheckItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  area: Dept;
  assignee: string;
  due: string;
  items: CheckItem[];
}

export const CHECKLISTS: Checklist[] = [
  {
    id: "c1",
    title: "tsk.opening",
    area: "hall",
    assignee: "Lucía Fernández",
    due: "11:00",
    items: [
      { id: "c1a", label: "tsk.open1", done: true },
      { id: "c1b", label: "tsk.open2", done: true },
      { id: "c1c", label: "tsk.open3", done: true },
      { id: "c1d", label: "tsk.open4", done: false },
      { id: "c1e", label: "tsk.open5", done: false },
    ],
  },
  {
    id: "c2",
    title: "tsk.closing",
    area: "kitchen",
    assignee: "João Silva",
    due: "23:30",
    items: [
      { id: "c2a", label: "tsk.close1", done: true },
      { id: "c2b", label: "tsk.close2", done: false },
      { id: "c2c", label: "tsk.close3", done: false },
      { id: "c2d", label: "tsk.close4", done: false },
    ],
  },
  {
    id: "c3",
    title: "tsk.bar",
    area: "bar",
    assignee: "Fernanda Costa",
    due: "18:00",
    items: [
      { id: "c3a", label: "tsk.bar1", done: true },
      { id: "c3b", label: "tsk.bar2", done: true },
      { id: "c3c", label: "tsk.bar3", done: false },
    ],
  },
];

export interface Task {
  id: string;
  title: string;
  assignee: string;
  dept: Dept;
  priority: "high" | "medium" | "low";
  status: "todo" | "doing" | "done";
}

export const TASKS: Task[] = [
  { id: "t1", title: "tsk.job1", assignee: "Valentina Ríos", dept: "reception", priority: "high", status: "doing" },
  { id: "t2", title: "tsk.job2", assignee: "Mateo Herrera", dept: "hall", priority: "medium", status: "todo" },
  { id: "t3", title: "tsk.job3", assignee: "João Silva", dept: "kitchen", priority: "high", status: "doing" },
  { id: "t4", title: "tsk.job4", assignee: "Carla Mendes", dept: "reception", priority: "low", status: "done" },
  { id: "t5", title: "tsk.job5", assignee: "Diego Torres", dept: "floors", priority: "medium", status: "todo" },
  { id: "t6", title: "tsk.job6", assignee: "Fernanda Costa", dept: "bar", priority: "medium", status: "done" },
];

/* ================= training (TikTok feed) ================= */

export interface Lesson {
  id: string;
  title: string;
  desc: string;
  duration: string;
  views: string;
  likes: number;
  category: string; // trn.cat.*
  cover: string;
}

const IMG_BARISTA = "https://image.qwenlm.ai/generated-images/6be8b017-85f6-466a-8756-5f08b7c43dba/_result.png";
const IMG_SAFETY = "https://image.qwenlm.ai/generated-images/1e65f1b2-b8f2-49b0-b0aa-2060fefc14e8/_result.png";
const IMG_LOBBY = "https://image.qwenlm.ai/generated-images/bd042e0f-6b78-4570-a82b-592783269124/_result.png";
const IMG_WINE = "https://image.qwenlm.ai/generated-images/cea5937b-c7e0-4be7-a3d0-d69f589729a7/_result.png";

export const LESSONS: Lesson[] = [
  { id: "l1", title: "trn.t1", desc: "trn.d1", duration: "0:42", views: "2.3k", likes: 184, category: "service", cover: IMG_BARISTA },
  { id: "l2", title: "trn.t2", desc: "trn.d2", duration: "0:58", views: "4.1k", likes: 312, category: "safety", cover: IMG_SAFETY },
  { id: "l3", title: "trn.t3", desc: "trn.d3", duration: "1:05", views: "1.8k", likes: 97, category: "service", cover: IMG_LOBBY },
  { id: "l4", title: "trn.t4", desc: "trn.d4", duration: "0:37", views: "3.4k", likes: 251, category: "service", cover: IMG_WINE },
  { id: "l5", title: "trn.t5", desc: "trn.d5", duration: "1:12", views: "986", likes: 64, category: "safety", cover: IMG_SAFETY },
  { id: "l6", title: "trn.t6", desc: "trn.d6", duration: "0:51", views: "2.9k", likes: 203, category: "ops", cover: IMG_LOBBY },
  { id: "l7", title: "trn.t7", desc: "trn.d7", duration: "0:45", views: "1.2k", likes: 88, category: "ops", cover: IMG_BARISTA },
  { id: "l8", title: "trn.t8", desc: "trn.d8", duration: "1:20", views: "5.6k", likes: 429, category: "service", cover: IMG_WINE },
];

export const TRN_CATS = ["all", "service", "safety", "ops"] as const;

/* ================= documents & e-signature ================= */

export type SignStatus = "signed" | "pending" | "draft";

export interface Doc {
  id: string;
  name: string;
  kind: string; // doc.kind.*
  empId: string;
  version: string;
  updated: string;
  expires: string | null;
  sign: SignStatus;
  size: string;
}

export const DOCS: Doc[] = [
  { id: "d1", name: "Contrato laboral — Andrés Quispe", kind: "contract", empId: "e7", version: "v2.1", updated: "2025-01-10", expires: null, sign: "pending", size: "412 KB" },
  { id: "d2", name: "Certificado manipulación de alimentos", kind: "certificate", empId: "e7", version: "v1.0", updated: "2024-02-01", expires: "2025-02-01", sign: "signed", size: "198 KB" },
  { id: "d3", name: "Reglamento interno 2025", kind: "policy", empId: "", version: "v3.0", updated: "2025-01-02", expires: null, sign: "pending", size: "1.2 MB" },
  { id: "d4", name: "Acuerdo confidencialidad — Carla Mendes", kind: "nda", empId: "e5", version: "v1.2", updated: "2024-11-18", expires: null, sign: "signed", size: "264 KB" },
  { id: "d5", name: "Alta fiscal — Fernanda Costa", kind: "fiscal", empId: "e3", version: "v1.0", updated: "2025-01-15", expires: null, sign: "draft", size: "340 KB" },
  { id: "d6", name: "Evaluación desempeño Q4 — João Silva", kind: "review", empId: "e2", version: "v1.1", updated: "2024-12-28", expires: null, sign: "signed", size: "520 KB" },
];

/* ================= incidents (anonymous) ================= */

export type IncStatus = "received" | "review" | "resolved";

export interface Incident {
  id: string;
  code: string;
  category: string; // inc.cat.*
  date: string;
  status: IncStatus;
  summary: string;
}

export const INCIDENTS: Incident[] = [
  { id: "i1", code: "CASO-7F3K", category: "inc.cat.safety", date: "2025-01-19", status: "review", summary: "inc.sum1" },
  { id: "i2", code: "CASO-2Q9M", category: "inc.cat.conduct", date: "2025-01-12", status: "received", summary: "inc.sum2" },
  { id: "i3", code: "CASO-8T4B", category: "inc.cat.equipment", date: "2024-12-30", status: "resolved", summary: "inc.sum3" },
];

export function caseCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "CASO-" + s;
}
