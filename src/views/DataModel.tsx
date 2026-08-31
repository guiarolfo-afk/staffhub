import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { IArrowR, ICopy, IDatabase, IDownload, ISearch } from "../icons";
import { Pill } from "../ui";

/* ================= schema source of truth ================= */

type Domain = "core" | "people" | "ops" | "money" | "content" | "comms" | "compliance";
type RawField = [name: string, type: string, attrs?: string, rel?: string, comment?: string];

interface Field {
  name: string;
  type: string;
  attrs: string[];
  rel?: string;
  comment?: string;
}
interface Model {
  name: string;
  domain: Domain;
  note: string;
  fields: Field[];
}
interface EnumDef {
  name: string;
  values: string[];
}

const F = (r: RawField): Field => ({ name: r[0], type: r[1], attrs: r[2] ? r[2].split(" ") : [], rel: r[3], comment: r[4] });

const MODELS: Model[] = [
  {
    name: "Organization", domain: "core", note: "Empresa cliente (grupo)",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["name", "String"]),
      F(["slug", "String", "@unique"]),
      F(["plan", "Plan", "@default(STARTER)"]),
      F(["users", "User[]", undefined, "User"]),
      F(["venues", "Venue[]", undefined, "Venue"]),
      F(["courses", "TrainingCourse[]", undefined, "TrainingCourse"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "User", domain: "core", note: "Credenciales y roles (JWT + refresh)",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["email", "String", "@unique"]),
      F(["passwordHash", "String"]),
      F(["fullName", "String"]),
      F(["role", "UserRole", "@default(EMPLOYEE)"]),
      F(["orgId", "String"]),
      F(["org", "Organization", "@relation(fields: [orgId], references: [id])", "Organization"]),
      F(["refreshTokens", "RefreshToken[]", undefined, "RefreshToken"]),
      F(["employee", "Employee?", undefined, "Employee"]),
      F(["notifications", "Notification[]", undefined, "Notification"]),
      F(["@@index([orgId, role])", ""]),
    ],
  },
  {
    name: "RefreshToken", domain: "core", note: "Sesiones revocables por dispositivo",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["token", "String", "@unique"]),
      F(["userId", "String"]),
      F(["user", "User", "@relation(fields: [userId], references: [id], onDelete: Cascade)", "User"]),
      F(["device", "String?"]),
      F(["expiresAt", "DateTime"]),
      F(["revokedAt", "DateTime?"]),
    ],
  },
  {
    name: "Venue", domain: "core", note: "Sucursal: restaurante, hotel, retail…",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["orgId", "String"]),
      F(["org", "Organization", "@relation(fields: [orgId], references: [id])", "Organization"]),
      F(["name", "String"]),
      F(["type", "VenueType"]),
      F(["city", "String"]),
      F(["timezone", "String", '@default("America/Mexico_City")']),
      F(["kiosks", "Kiosk[]", undefined, "Kiosk"]),
      F(["employees", "Employee[]", undefined, "Employee"]),
      F(["shifts", "Shift[]", undefined, "Shift"]),
      F(["tasks", "Task[]", undefined, "Task"]),
      F(["payrollRuns", "PayrollRun[]", undefined, "PayrollRun"]),
      F(["channels", "ChatChannel[]", undefined, "ChatChannel"]),
      F(["@@index([orgId])", ""]),
    ],
  },
  {
    name: "Kiosk", domain: "core", note: "Tablet de fichaje (Lock Task Mode)",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["venueId", "String"]),
      F(["venue", "Venue", "@relation(fields: [venueId], references: [id])", "Venue"]),
      F(["name", "String"]),
      F(["deviceToken", "String", "@unique"]),
      F(["online", "Boolean", "@default(true)"]),
      F(["lastSeen", "DateTime"]),
    ],
  },
  {
    name: "Employee", domain: "people", note: "Perfil operativo del colaborador",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["userId", "String?", "@unique"]),
      F(["user", "User?", "@relation(fields: [userId], references: [id])", "User"]),
      F(["venueId", "String"]),
      F(["venue", "Venue", "@relation(fields: [venueId], references: [id])", "Venue"]),
      F(["firstName", "String"]),
      F(["lastName", "String"]),
      F(["email", "String"]),
      F(["phone", "String?"]),
      F(["jobTitle", "String"]),
      F(["dept", "Dept"]),
      F(["status", "EmployeeStatus", "@default(ACTIVE)"]),
      F(["hourlyRate", "Decimal", "@db.Decimal(10,2)"]),
      F(["languages", "Language[]"]),
      F(["hiredAt", "DateTime"]),
      F(["performance", "Int", "@default(70)"]),
      F(["shifts", "Shift[]", undefined, "Shift"]),
      F(["timeEntries", "TimeEntry[]", undefined, "TimeEntry"]),
      F(["expenses", "Expense[]", undefined, "Expense"]),
      F(["tasksAssigned", "Task[]", undefined, "Task"]),
      F(["courseProgress", "TrainingProgress[]", undefined, "TrainingProgress"]),
      F(["messages", "ChatMessage[]", undefined, "ChatMessage"]),
      F(["channels", "ChatChannel[]", undefined, "ChatChannel"]),
      F(["signatures", "DocumentSignature[]", undefined, "DocumentSignature"]),
      F(["@@index([venueId, dept])", ""]),
    ],
  },
  {
    name: "Shift", domain: "ops", note: "Turnos y horarios semanales",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["venueId", "String"]),
      F(["venue", "Venue", "@relation(fields: [venueId], references: [id])", "Venue"]),
      F(["employeeId", "String"]),
      F(["employee", "Employee", "@relation(fields: [employeeId], references: [id])", "Employee"]),
      F(["date", "DateTime", "@db.Date"]),
      F(["start", "String", undefined, undefined, '"09:00"']),
      F(["end", "String", undefined, undefined, '"17:00"']),
      F(["type", "ShiftType"]),
      F(["status", "ShiftStatus", "@default(SCHEDULED)"]),
      F(["timeEntries", "TimeEntry[]", undefined, "TimeEntry"]),
      F(["@@index([venueId, date])", ""]),
    ],
  },
  {
    name: "TimeEntry", domain: "ops", note: "Fichaje: entrada/salida con origen",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["employeeId", "String"]),
      F(["employee", "Employee", "@relation(fields: [employeeId], references: [id])", "Employee"]),
      F(["shiftId", "String?"]),
      F(["shift", "Shift?", "@relation(fields: [shiftId], references: [id])", "Shift"]),
      F(["clockIn", "DateTime"]),
      F(["clockOut", "DateTime?"]),
      F(["source", "ClockSource", "@default(APP)"]),
      F(["biometricVerified", "Boolean", "@default(false)"]),
      F(["status", "AttendanceStatus", "@default(ON_TIME)"]),
      F(["@@index([employeeId, clockIn])", ""]),
    ],
  },
  {
    name: "Task", domain: "ops", note: "Tareas asignadas al equipo",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["venueId", "String"]),
      F(["venue", "Venue", "@relation(fields: [venueId], references: [id])", "Venue"]),
      F(["title", "String"]),
      F(["description", "String?"]),
      F(["priority", "Priority", "@default(MEDIUM)"]),
      F(["status", "TaskStatus", "@default(TODO)"]),
      F(["assigneeId", "String?"]),
      F(["assignee", "Employee?", "@relation(fields: [assigneeId], references: [id])", "Employee"]),
      F(["dueAt", "DateTime?"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "Checklist", domain: "ops", note: "Checklists de apertura y cierre",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["venueId", "String"]),
      F(["title", "String"]),
      F(["area", "Dept"]),
      F(["items", "ChecklistItem[]", undefined, "ChecklistItem"]),
    ],
  },
  {
    name: "ChecklistItem", domain: "ops", note: "Pasos verificables del checklist",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["checklistId", "String"]),
      F(["checklist", "Checklist", "@relation(fields: [checklistId], references: [id], onDelete: Cascade)", "Checklist"]),
      F(["label", "String"]),
      F(["order", "Int"]),
      F(["done", "Boolean", "@default(false)"]),
      F(["completedById", "String?"]),
      F(["completedAt", "DateTime?"]),
    ],
  },
  {
    name: "PayrollRun", domain: "money", note: "Ejecución de nómina por periodo",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["venueId", "String"]),
      F(["venue", "Venue", "@relation(fields: [venueId], references: [id])", "Venue"]),
      F(["periodStart", "DateTime"]),
      F(["periodEnd", "DateTime"]),
      F(["status", "PayRunStatus", "@default(DRAFT)"]),
      F(["total", "Decimal", "@db.Decimal(12,2) @default(0)"]),
      F(["payslips", "Payslip[]", undefined, "Payslip"]),
      F(["processedAt", "DateTime?"]),
    ],
  },
  {
    name: "Payslip", domain: "money", note: "Recibo individual de pago",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["runId", "String"]),
      F(["run", "PayrollRun", "@relation(fields: [runId], references: [id])", "PayrollRun"]),
      F(["employeeId", "String"]),
      F(["employee", "Employee", "@relation(fields: [employeeId], references: [id])", "Employee"]),
      F(["base", "Decimal"]),
      F(["extras", "Decimal", "@default(0)"]),
      F(["deductions", "Decimal", "@default(0)"]),
      F(["net", "Decimal"]),
      F(["status", "PayStatus", "@default(PENDING)"]),
      F(["pdfUrl", "String?", undefined, undefined, "S3 / Cloudinary"]),
      F(["@@unique([runId, employeeId])", ""]),
    ],
  },
  {
    name: "Expense", domain: "money", note: "Gastos con lectura OCR + IA",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["employeeId", "String"]),
      F(["employee", "Employee", "@relation(fields: [employeeId], references: [id])", "Employee"]),
      F(["venueId", "String"]),
      F(["amount", "Decimal", "@db.Decimal(10,2)"]),
      F(["category", "ExpenseCategory"]),
      F(["note", "String?"]),
      F(["receiptUrl", "String?"]),
      F(["source", "ExpenseSource", "@default(MANUAL)"]),
      F(["aiConfidence", "Float?", undefined, undefined, "confianza del OCR"]),
      F(["status", "ExpenseStatus", "@default(PENDING)"]),
      F(["createdAt", "DateTime", "@default(now())"]),
      F(["@@index([venueId, status])", ""]),
    ],
  },
  {
    name: "TrainingCourse", domain: "content", note: "Micro-cursos del feed vertical",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["orgId", "String"]),
      F(["org", "Organization", "@relation(fields: [orgId], references: [id])", "Organization"]),
      F(["title", "String"]),
      F(["description", "String"]),
      F(["category", "TrainingCategory"]),
      F(["durationSec", "Int"]),
      F(["videoUrl", "String"]),
      F(["coverUrl", "String"]),
      F(["required", "Boolean", "@default(false)"]),
      F(["progress", "TrainingProgress[]", undefined, "TrainingProgress"]),
    ],
  },
  {
    name: "TrainingProgress", domain: "content", note: "Avance y likes por colaborador",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["courseId", "String"]),
      F(["course", "TrainingCourse", "@relation(fields: [courseId], references: [id])", "TrainingCourse"]),
      F(["employeeId", "String"]),
      F(["employee", "Employee", "@relation(fields: [employeeId], references: [id])", "Employee"]),
      F(["secondsWatched", "Int", "@default(0)"]),
      F(["liked", "Boolean", "@default(false)"]),
      F(["completedAt", "DateTime?"]),
      F(["@@unique([courseId, employeeId])", ""]),
    ],
  },
  {
    name: "ChatChannel", domain: "comms", note: "Canales de mensajería del equipo",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["venueId", "String"]),
      F(["venue", "Venue", "@relation(fields: [venueId], references: [id])", "Venue"]),
      F(["name", "String"]),
      F(["members", "Employee[]", undefined, "Employee"]),
      F(["messages", "ChatMessage[]", undefined, "ChatMessage"]),
    ],
  },
  {
    name: "ChatMessage", domain: "comms", note: "Mensajes en tiempo real (Socket.io)",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["channelId", "String"]),
      F(["channel", "ChatChannel", "@relation(fields: [channelId], references: [id])", "ChatChannel"]),
      F(["authorId", "String"]),
      F(["author", "Employee", "@relation(fields: [authorId], references: [id])", "Employee"]),
      F(["body", "String"]),
      F(["sentAt", "DateTime", "@default(now())"]),
      F(["@@index([channelId, sentAt])", ""]),
    ],
  },
  {
    name: "Notification", domain: "comms", note: "Push, email y SMS (BullMQ)",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["userId", "String"]),
      F(["user", "User", "@relation(fields: [userId], references: [id])", "User"]),
      F(["channel", "NotifChannel", "@default(PUSH)"]),
      F(["title", "String"]),
      F(["body", "String"]),
      F(["read", "Boolean", "@default(false)"]),
      F(["sentAt", "DateTime", "@default(now())"]),
      F(["@@index([userId, read])", ""]),
    ],
  },
  {
    name: "Document", domain: "compliance", note: "Contratos y políticas con versión",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["orgId", "String"]),
      F(["name", "String"]),
      F(["kind", "DocKind"]),
      F(["version", "String", '@default("v1.0")']),
      F(["fileUrl", "String"]),
      F(["expiresAt", "DateTime?"]),
      F(["status", "DocStatus", "@default(DRAFT)"]),
      F(["signatures", "DocumentSignature[]", undefined, "DocumentSignature"]),
      F(["@@index([orgId, kind])", ""]),
    ],
  },
  {
    name: "DocumentSignature", domain: "compliance", note: "Firma digital con evidencia",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["documentId", "String"]),
      F(["document", "Document", "@relation(fields: [documentId], references: [id])", "Document"]),
      F(["signerId", "String"]),
      F(["signer", "Employee", "@relation(fields: [signerId], references: [id])", "Employee"]),
      F(["signatureUrl", "String"]),
      F(["ip", "String?"]),
      F(["signedAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "Incident", domain: "compliance", note: "Denuncias anónimas del canal ético",
    fields: [
      F(["id", "String", "@id @default(uuid())"]),
      F(["orgId", "String"]),
      F(["caseCode", "String", "@unique", undefined, "CASO-XXXX"]),
      F(["category", "IncidentCategory"]),
      F(["summary", "String"]),
      F(["reporterId", "String?", undefined, undefined, "null = anónimo"]),
      F(["status", "IncidentStatus", "@default(RECEIVED)"]),
      F(["createdAt", "DateTime", "@default(now())"]),
      F(["resolvedAt", "DateTime?"]),
    ],
  },
];

const ENUMS: EnumDef[] = [
  { name: "Plan", values: ["STARTER", "PRO", "ENTERPRISE"] },
  { name: "UserRole", values: ["OWNER", "ADMIN", "MANAGER", "EMPLOYEE"] },
  { name: "VenueType", values: ["RESTAURANT", "HOTEL", "RETAIL", "TOURISM"] },
  { name: "Language", values: ["ES", "PT", "EN"] },
  { name: "Dept", values: ["KITCHEN", "HALL", "RECEPTION", "BAR", "FLOORS"] },
  { name: "EmployeeStatus", values: ["ACTIVE", "VACATION", "ON_LEAVE", "TERMINATED"] },
  { name: "ShiftType", values: ["MORNING", "AFTERNOON", "NIGHT"] },
  { name: "ShiftStatus", values: ["SCHEDULED", "CONFIRMED", "SWAPPED", "CANCELLED"] },
  { name: "ClockSource", values: ["KIOSK", "APP", "WEB", "MANAGER"] },
  { name: "AttendanceStatus", values: ["ON_TIME", "LATE", "ABSENT", "ON_SHIFT", "ON_BREAK"] },
  { name: "PayRunStatus", values: ["DRAFT", "PROCESSING", "PAID"] },
  { name: "PayStatus", values: ["PENDING", "PROCESSING", "PAID"] },
  { name: "ExpenseCategory", values: ["TRANSPORT", "FOOD", "SUPPLIES", "UNIFORM", "OTHER"] },
  { name: "ExpenseSource", values: ["OCR", "MANUAL"] },
  { name: "ExpenseStatus", values: ["PENDING", "APPROVED", "REJECTED"] },
  { name: "Priority", values: ["LOW", "MEDIUM", "HIGH"] },
  { name: "TaskStatus", values: ["TODO", "DOING", "DONE"] },
  { name: "TrainingCategory", values: ["SERVICE", "SAFETY", "HYGIENE", "LANGUAGES"] },
  { name: "DocKind", values: ["CONTRACT", "POLICY", "CERTIFICATE", "NDA"] },
  { name: "DocStatus", values: ["DRAFT", "PENDING_SIGNING", "SIGNED", "ARCHIVED"] },
  { name: "IncidentCategory", values: ["SAFETY", "CONDUCT", "EQUIPMENT"] },
  { name: "IncidentStatus", values: ["RECEIVED", "IN_REVIEW", "RESOLVED"] },
  { name: "NotifChannel", values: ["PUSH", "EMAIL", "SMS"] },
];

const DOMAINS: Domain[] = ["core", "people", "ops", "money", "content", "comms", "compliance"];
const DOMAIN_COLOR: Record<Domain, string> = {
  core: "#256b52",
  people: "#54688c",
  ops: "#e89f2e",
  money: "#2e7d8c",
  content: "#7b5ea7",
  comms: "#ce5638",
  compliance: "#1b5a43",
};

/* ================= code generation ================= */

interface Part {
  text: string;
  cls: string;
}
interface CodeLine {
  parts: Part[];
  plain: string;
  model?: string;
}

const modelNames = new Set(MODELS.map((m) => m.name));
const enumNames = new Set(ENUMS.map((e) => e.name));

function typeCls(type: string): string {
  const base = type.replace(/[\[\]?]/g, "");
  if (modelNames.has(base)) return "tok-tm";
  if (enumNames.has(base)) return "tok-te";
  return "tok-t";
}

function buildLines(): { lines: CodeLine[]; ranges: Record<string, [number, number]> } {
  const lines: CodeLine[] = [];
  const ranges: Record<string, [number, number]> = {};
  const push = (parts: Part[], model?: string) => {
    lines.push({ parts, plain: parts.map((p) => p.text).join(" "), model });
  };

  push([{ text: "// StaffHub 360 — schema principal", cls: "tok-c" }]);
  push([{ text: "// PostgreSQL (relacional) · Redis (caché y sesiones)", cls: "tok-c" }]);
  push([{ text: "", cls: "" }]);
  push([{ text: "generator", cls: "tok-k" }, { text: " client {", cls: "tok-b" }]);
  push([{ text: "  provider", cls: "tok-f" }, { text: " =", cls: "tok-b" }, { text: ' "prisma-client-js"', cls: "tok-s" }]);
  push([{ text: "}", cls: "tok-b" }]);
  push([{ text: "", cls: "" }]);
  push([{ text: "datasource", cls: "tok-k" }, { text: " db {", cls: "tok-b" }]);
  push([{ text: "  provider", cls: "tok-f" }, { text: " =", cls: "tok-b" }, { text: ' "postgresql"', cls: "tok-s" }]);
  push([{ text: "  url", cls: "tok-f" }, { text: "     =", cls: "tok-b" }, { text: ' env("DATABASE_URL")', cls: "tok-s" }]);
  push([{ text: "}", cls: "tok-b" }]);

  for (const m of MODELS) {
    push([{ text: "", cls: "" }]);
    const start = lines.length;
    push([{ text: "model", cls: "tok-k" }, { text: " " + m.name, cls: "tok-n" }, { text: " {", cls: "tok-b" }], m.name);
    for (const f of m.fields) {
      const parts: Part[] = [];
      if (f.name.startsWith("@@")) {
        parts.push({ text: "  " + f.name, cls: "tok-a" });
      } else {
        parts.push({ text: "  " + f.name, cls: "tok-f" });
        parts.push({ text: " " + f.type, cls: typeCls(f.type) });
        for (const a of f.attrs) parts.push({ text: " " + a, cls: "tok-a" });
        if (f.rel) parts.push({ text: "  → " + f.rel, cls: "tok-rel" });
      }
      if (f.comment) parts.push({ text: "  // " + f.comment, cls: "tok-c" });
      push(parts, m.name);
    }
    push([{ text: "}", cls: "tok-b" }], m.name);
    ranges[m.name] = [start, lines.length - 1];
  }

  push([{ text: "", cls: "" }]);
  push([{ text: "// ── enumeradores ──────────────────────────────", cls: "tok-c" }]);
  for (const e of ENUMS) {
    push([{ text: "", cls: "" }]);
    push([{ text: "enum", cls: "tok-k" }, { text: " " + e.name, cls: "tok-n" }, { text: " {", cls: "tok-b" }]);
    push([{ text: "  " + e.values.join(" "), cls: "tok-te" }]);
    push([{ text: "}", cls: "tok-b" }]);
  }

  return { lines, ranges };
}

const DOMAINS_I18N: Record<Domain, string> = {
  core: "dm.dom.core", people: "dm.dom.people", ops: "dm.dom.ops", money: "dm.dom.money",
  content: "dm.dom.content", comms: "dm.dom.comms", compliance: "dm.dom.compliance",
};

export default function DataModel({ notify }: { notify: (m: string) => void }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>("Employee");
  const [domainFilter, setDomainFilter] = useState<Domain | "all">("all");
  const [search, setSearch] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { lines, ranges } = useMemo(buildLines, []);
  const relationCount = useMemo(
    () => MODELS.reduce((s, m) => s + m.fields.filter((f) => f.rel).length, 0),
    [],
  );

  const related = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected]);
    const me = MODELS.find((m) => m.name === selected);
    me?.fields.forEach((f) => f.rel && set.add(f.rel));
    MODELS.forEach((m) => m.fields.some((f) => f.rel === selected) && set.add(m.name));
    return set;
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const el = lineRefs.current[selected];
    if (el && editorRef.current) {
      const top = el.offsetTop - editorRef.current.clientHeight / 3;
      editorRef.current.scrollTo({ top, behavior: "smooth" });
    }
  }, [selected]);

  const visible = MODELS.filter(
    (m) =>
      (domainFilter === "all" || m.domain === domainFilter) &&
      (search.trim() === "" || m.name.toLowerCase().includes(search.toLowerCase())),
  );

  const plainSchema = useMemo(() => lines.map((l) => l.plain).join("\n"), [lines]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(plainSchema);
      notify(t("dm.copied"));
    } catch {
      notify(t("dm.copied"));
    }
  };

  const download = () => {
    const blob = new Blob([plainSchema], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "schema.prisma";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify(t("dm.downloaded"));
  };

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-end justify-between gap-3 anim-fade-up">
        <div>
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none flex items-center gap-3">
            Prisma Schema
            <Pill tone="pine"><IDatabase size={11} /> PostgreSQL 16</Pill>
          </h1>
          <p className="text-[13.5px] text-mute mt-1.5">{t("dm.sub")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost !py-2" onClick={copy}>
            <ICopy size={15} /> {t("dm.copy")}
          </button>
          <button className="btn-primary !py-2" onClick={download}>
            <IDownload size={15} /> {t("dm.download")}
          </button>
        </div>
      </div>

      {/* stats strip */}
      <div className="card p-4 grid grid-cols-2 md:grid-cols-4 gap-4 anim-fade-up" style={{ animationDelay: "0.05s" }}>
        {[
          { v: MODELS.length, l: t("dm.models"), c: "#256b52" },
          { v: ENUMS.length, l: t("dm.enums"), c: "#2e7d8c" },
          { v: relationCount, l: t("dm.relations"), c: "#e89f2e" },
          { v: 23, l: t("dm.migrations"), c: "#7b5ea7" },
        ].map((s) => (
          <div key={s.l} className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-extrabold text-[19px] text-white" style={{ background: s.c }}>
              {s.v}
            </span>
            <span className="text-[12.5px] font-semibold text-inksoft">{s.l}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-4 items-start">
        {/* left: explorer */}
        <div className="space-y-3">
          <div className="card p-3 space-y-2.5 anim-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="relative">
              <ISearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
              <input className="input-base !pl-8 !py-2" placeholder={t("dm.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setDomainFilter("all")}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  domainFilter === "all" ? "bg-pine-600 text-white" : "bg-pine-50 text-inksoft hover:bg-pine-100"
                }`}
              >
                {t("dm.all")}
              </button>
              {DOMAINS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDomainFilter(domainFilter === d ? "all" : d)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    domainFilter === d ? "text-white" : "bg-pine-50 text-inksoft hover:bg-pine-100"
                  }`}
                  style={domainFilter === d ? { background: DOMAIN_COLOR[d] } : undefined}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: domainFilter === d ? "#fff" : DOMAIN_COLOR[d] }} />
                  {t(DOMAINS_I18N[d])}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 stagger">
            {visible.map((m) => {
              const isSel = selected === m.name;
              const dim = related && !related.has(m.name);
              const rels = m.fields.filter((f) => f.rel).map((f) => f.rel as string);
              return (
                <button
                  key={m.name}
                  onClick={() => setSelected(isSel ? null : m.name)}
                  className={`w-full text-left card p-3.5 transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${
                    isSel ? "!border-marigold-500 ring-2 ring-marigold-500/25" : ""
                  } ${dim ? "opacity-50" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-[4px] shrink-0" style={{ background: DOMAIN_COLOR[m.domain] }} />
                    <span className="font-mono font-bold text-[13.5px] text-ink">{m.name}</span>
                    <span className="ml-auto text-[10.5px] font-semibold text-mute font-mono">{m.fields.length} {t("dm.fields")}</span>
                  </div>
                  <div className="text-[11.5px] text-mute mt-1">{m.note}</div>
                  {rels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {rels.slice(0, 4).map((r, i) => (
                        <span
                          key={r + i}
                          role="link"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(r);
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-pine-50 border border-pine-200/70 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-pine-700 hover:bg-marigold-200/60 hover:border-marigold-400 transition-colors"
                        >
                          <IArrowR size={9} sw={2.4} /> {r}
                        </span>
                      ))}
                      {rels.length > 4 && (
                        <span className="text-[10px] font-mono text-mute px-1 py-0.5">+{rels.length - 4}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
            {visible.length === 0 && (
              <div className="card p-6 text-center text-[13px] text-mute">{t("dm.noModels")}</div>
            )}
          </div>

          {/* enums */}
          <div className="card anim-fade-up" style={{ animationDelay: "0.16s" }}>
            <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
              <h3 className="font-display font-bold text-[14.5px] text-ink">{t("dm.enumsTitle")}</h3>
              <span className="font-mono text-[11px] text-mute">{ENUMS.length}</span>
            </div>
            <div className="px-4 pb-4 flex flex-wrap gap-1.5">
              {ENUMS.map((e) => (
                <span
                  key={e.name}
                  title={e.values.join(" · ")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-canvas border border-line px-2 py-1 text-[10.5px] font-mono font-semibold text-inksoft hover:border-sea-500 hover:text-sea-700 transition-colors cursor-help"
                >
                  {e.name}
                  <span className="text-mute font-sans">{e.values.length}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* right: editor */}
        <div className="xl:sticky xl:top-4 anim-fade-up" style={{ animationDelay: "0.12s" }}>
          <div className="rounded-[14px] border border-pine-800 overflow-hidden shadow-xl">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0e1a14] border-b border-pine-800">
              <span className="w-2.5 h-2.5 rounded-full bg-clay-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-marigold-400/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-pine-400/80" />
              <span className="ml-2 font-mono text-[11.5px] text-pine-200/70">prisma/schema.prisma</span>
              {selected && (
                <span className="ml-auto font-mono text-[10.5px] text-marigold-300 bg-marigold-400/10 border border-marigold-400/30 rounded-md px-2 py-0.5">
                  {selected}
                </span>
              )}
            </div>
            <div
              ref={editorRef}
              className="overflow-y-auto bg-[#0a120e] py-3"
              style={{ maxHeight: "min(740px, calc(100vh - 230px))", minHeight: 420 }}
            >
              {lines.map((line, i) => {
                const inSel = line.model && selected === line.model;
                const isHeader = line.model && ranges[line.model]?.[0] === i;
                return (
                  <div
                    key={i}
                    ref={(el) => {
                      if (line.model && ranges[line.model]?.[0] === i) lineRefs.current[line.model] = el;
                    }}
                    onClick={() => line.model && setSelected(line.model)}
                    className={`flex text-[12px] leading-[21px] font-mono pr-4 transition-colors ${
                      line.model ? "cursor-pointer" : ""
                    } ${inSel ? "bg-marigold-400/[0.07]" : ""} ${line.model && !inSel ? "hover:bg-white/[0.03]" : ""}`}
                    style={inSel ? { boxShadow: "inset 2.5px 0 0 #e89f2e" } : undefined}
                  >
                    <span className={`w-[52px] shrink-0 text-right pr-4 select-none ${inSel ? "text-marigold-300/80" : "text-[#3d5247]"}`}>
                      {i + 1}
                    </span>
                    <span className="whitespace-pre flex-1 min-w-0">
                      {line.parts.map((p, j) => (
                        <span key={j} className={`${p.cls} ${isHeader && p.cls === "tok-n" ? "underline decoration-marigold-400/60 decoration-2 underline-offset-4" : ""}`}>
                          {p.text}
                        </span>
                      ))}
                      {line.parts.length === 0 && "\u00A0"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2 bg-[#0e1a14] border-t border-pine-800 flex items-center justify-between">
              <span className="text-[10.5px] text-pine-200/50">{t("dm.hint")}</span>
              <span className="font-mono text-[10.5px] text-pine-200/50">{lines.length} lines · utf-8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
