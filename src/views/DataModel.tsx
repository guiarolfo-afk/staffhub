import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../i18n";
import { IArrowR, ICopy, IDatabase, IDownload, ISearch } from "../icons";
import { Pill } from "../ui";

/* ================= schema source of truth ================= */

type Domain =
  | "core"
  | "scheduling"
  | "timetracking"
  | "tasks"
  | "expenses"
  | "training"
  | "chat"
  | "documents"
  | "incidents";

type RawField = [name: string, type: string, attrs?: string, rel?: string, comment?: string];

interface Field {
  name: string;
  type: string;
  attrs: string;
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

const F = (r: RawField): Field => ({ name: r[0], type: r[1], attrs: r[2] ?? "", rel: r[3], comment: r[4] });

const SECT_LABEL: Record<Domain, string> = {
  core: "Organizaciones y usuarios",
  scheduling: "Scheduling",
  timetracking: "Time Tracking",
  tasks: "Tasks",
  expenses: "Expenses",
  training: "Training (TikTok style)",
  chat: "Chat",
  documents: "Documents & Digital Signature",
  incidents: "Incidents (Anonymous reporting)",
};

const MODELS: Model[] = [
  {
    name: "Organization", domain: "core", note: "Empresa cliente: plan, locale y zona horaria",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["name", "String"]),
      F(["slug", "String", "@unique"]),
      F(["logo", "String?"]),
      F(["timezone", "String", '@default("America/Mexico_City")']),
      F(["defaultLocale", "String", '@default("es")']),
      F(["plan", "PlanType", "@default(BASIC)"]),
      F(["users", "User[]", undefined, "User"]),
      F(["branches", "Branch[]", undefined, "Branch"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "Branch", domain: "core", note: "Sucursal con geolocalización",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["name", "String"]),
      F(["address", "String?"]),
      F(["latitude", "Float?"]),
      F(["longitude", "Float?"]),
      F(["organizationId", "String"]),
      F(["organization", "Organization", "@relation(fields: [organizationId], references: [id])", "Organization"]),
      F(["employees", "User[]", undefined, "User"]),
      F(["tasks", "Task[]", undefined, "Task"]),
      F(["timeRecords", "TimeRecord[]", undefined, "TimeRecord"]),
    ],
  },
  {
    name: "User", domain: "core", note: "Usuarios y roles · del empleado al admin",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["email", "String", "@unique"]),
      F(["password", "String"]),
      F(["firstName", "String"]),
      F(["lastName", "String"]),
      F(["phone", "String?"]),
      F(["avatar", "String?"]),
      F(["role", "UserRole", "@default(EMPLOYEE)"]),
      F(["isActive", "Boolean", "@default(true)"]),
      F(["preferredLang", "Language", "@default(ES)"]),
      F(["organizationId", "String"]),
      F(["organization", "Organization", "@relation(fields: [organizationId], references: [id])", "Organization"]),
      F(["branchId", "String?"]),
      F(["branch", "Branch?", "@relation(fields: [branchId], references: [id])", "Branch"]),
      F(["// Relaciones", ""]),
      F(["schedules", "Schedule[]", undefined, "Schedule"]),
      F(["timeRecords", "TimeRecord[]", undefined, "TimeRecord"]),
      F(["expenses", "Expense[]", undefined, "Expense"]),
      F(["assignedTasks", "TaskAssignment[]", undefined, "TaskAssignment"]),
      F(["chatMessages", "ChatMessage[]", undefined, "ChatMessage"]),
      F(["documents", "DocumentSignature[]", undefined, "DocumentSignature"]),
      F(["incidents", "Incident[]", '@relation("ReportedBy")', "Incident"]),
      F(["createdAt", "DateTime", "@default(now())"]),
      F(["updatedAt", "DateTime", "@updatedAt"]),
    ],
  },
  {
    name: "Schedule", domain: "scheduling", note: "Turnos programados por usuario y sucursal",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["userId", "String"]),
      F(["user", "User", "@relation(fields: [userId], references: [id])", "User"]),
      F(["branchId", "String"]),
      F(["date", "DateTime"]),
      F(["startTime", "DateTime"]),
      F(["endTime", "DateTime"]),
      F(["status", "ShiftStatus", "@default(SCHEDULED)"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "TimeRecord", domain: "timetracking", note: "Fichaje con foto, huella y geolocalización",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["userId", "String"]),
      F(["user", "User", "@relation(fields: [userId], references: [id])", "User"]),
      F(["branchId", "String"]),
      F(["branch", "Branch", "@relation(fields: [branchId], references: [id])", "Branch"]),
      F(["type", "ClockType"]),
      F(["timestamp", "DateTime", "@default(now())"]),
      F(["photo", "String?", undefined, undefined, "Foto al fichar"]),
      F(["fingerprintHash", "String?", undefined, undefined, "Hash biométrico"]),
      F(["deviceId", "String?", undefined, undefined, "ID de la tablet/dispositivo"]),
      F(["latitude", "Float?"]),
      F(["longitude", "Float?"]),
    ],
  },
  {
    name: "Task", domain: "tasks", note: "Tareas recurrentes con título multiidioma (Json)",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["title", "Json", undefined, undefined, '{ es: "", pt: "", en: "" }']),
      F(["description", "Json?"]),
      F(["recurrence", "Recurrence"]),
      F(["priority", "TaskPriority", "@default(MEDIUM)"]),
      F(["branchId", "String?"]),
      F(["branch", "Branch?", "@relation(fields: [branchId], references: [id])", "Branch"]),
      F(["checklist", "ChecklistItem[]", undefined, "ChecklistItem"]),
      F(["assignments", "TaskAssignment[]", undefined, "TaskAssignment"]),
      F(["createdBy", "String"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "ChecklistItem", domain: "tasks", note: "Pasos del checklist · foto o QR requeridos",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["taskId", "String"]),
      F(["task", "Task", "@relation(fields: [taskId], references: [id])", "Task"]),
      F(["text", "Json", undefined, undefined, '{ es: "", pt: "", en: "" }']),
      F(["order", "Int"]),
      F(["requiresPhoto", "Boolean", "@default(false)"]),
      F(["requiresQR", "Boolean", "@default(false)"]),
    ],
  },
  {
    name: "TaskAssignment", domain: "tasks", note: "Asignación con evidencia fotográfica",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["taskId", "String"]),
      F(["task", "Task", "@relation(fields: [taskId], references: [id])", "Task"]),
      F(["userId", "String"]),
      F(["user", "User", "@relation(fields: [userId], references: [id])", "User"]),
      F(["status", "TaskStatus", "@default(PENDING)"]),
      F(["dueDate", "DateTime?"]),
      F(["completedAt", "DateTime?"]),
      F(["evidence", "String[]", undefined, undefined, "URLs de fotos/videos"]),
      F(["notes", "String?"]),
    ],
  },
  {
    name: "Expense", domain: "expenses", note: "Gastos con análisis IA del ticket",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["userId", "String"]),
      F(["user", "User", "@relation(fields: [userId], references: [id])", "User"]),
      F(["amount", "Decimal", "@db.Decimal(10, 2)"]),
      F(["currency", "String", '@default("MXN")']),
      F(["category", "String?"]),
      F(["receiptImage", "String", undefined, undefined, "URL del ticket"]),
      F(["aiAnalysis", "Json?", undefined, undefined, "Resultado del análisis IA"]),
      F(["status", "ExpenseStatus", "@default(PENDING)"]),
      F(["aiVerdict", "AIVerdict?"]),
      F(["items", "ExpenseItem[]", undefined, "ExpenseItem"]),
      F(["approvedBy", "String?"]),
      F(["approvedAt", "DateTime?"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "ExpenseItem", domain: "expenses", note: "Líneas del ticket · la IA marca gastos personales",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["expenseId", "String"]),
      F(["expense", "Expense", "@relation(fields: [expenseId], references: [id])", "Expense"]),
      F(["name", "String"]),
      F(["price", "Decimal", "@db.Decimal(10, 2)"]),
      F(["isPersonal", "Boolean", "@default(false)", undefined, "Marcado por IA como gasto personal"]),
    ],
  },
  {
    name: "TrainingVideo", domain: "training", note: "Micro-videos de capacitación (TikTok)",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["title", "Json", undefined, undefined, '{ es: "", pt: "", en: "" }']),
      F(["description", "Json?"]),
      F(["videoUrl", "String"]),
      F(["thumbnail", "String"]),
      F(["duration", "Int", undefined, undefined, "segundos"]),
      F(["category", "String"]),
      F(["isRequired", "Boolean", "@default(false)"]),
      F(["views", "TrainingView[]", undefined, "TrainingView"]),
      F(["createdBy", "String"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "TrainingView", domain: "training", note: "Porcentaje visto por usuario",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["videoId", "String"]),
      F(["video", "TrainingVideo", "@relation(fields: [videoId], references: [id])", "TrainingVideo"]),
      F(["userId", "String"]),
      F(["watchedPct", "Float", undefined, undefined, "Porcentaje visto"]),
      F(["completed", "Boolean", "@default(false)"]),
      F(["viewedAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "ChatRoom", domain: "chat", note: "Salas directas, grupos y broadcast",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["name", "String?"]),
      F(["type", "ChatType"]),
      F(["branchId", "String?"]),
      F(["members", "ChatMember[]", undefined, "ChatMember"]),
      F(["messages", "ChatMessage[]", undefined, "ChatMessage"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "ChatMember", domain: "chat", note: "Membresía y rol dentro de la sala",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["roomId", "String"]),
      F(["room", "ChatRoom", "@relation(fields: [roomId], references: [id])", "ChatRoom"]),
      F(["userId", "String"]),
      F(["role", "ChatRole", "@default(MEMBER)"]),
      F(["joinedAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "ChatMessage", domain: "chat", note: "Texto, media y ubicación · recibos de lectura",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["roomId", "String"]),
      F(["room", "ChatRoom", "@relation(fields: [roomId], references: [id])", "ChatRoom"]),
      F(["senderId", "String"]),
      F(["sender", "User", "@relation(fields: [senderId], references: [id])", "User"]),
      F(["type", "MessageType", "@default(TEXT)"]),
      F(["content", "String?", undefined, undefined, "Texto o URL de media"]),
      F(["metadata", "Json?", undefined, undefined, "Para ubicación, etc."]),
      F(["readBy", "String[]", undefined, undefined, "IDs de usuarios que leyeron"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "Document", domain: "documents", note: "PDFs que requieren firma digital",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["title", "Json"]),
      F(["content", "String", undefined, undefined, "URL del PDF"]),
      F(["category", "String"]),
      F(["requiresSignature", "Boolean", "@default(true)"]),
      F(["signatures", "DocumentSignature[]", undefined, "DocumentSignature"]),
      F(["createdBy", "String"]),
      F(["createdAt", "DateTime", "@default(now())"]),
    ],
  },
  {
    name: "DocumentSignature", domain: "documents", note: "Firma con imagen, IP y dispositivo",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["documentId", "String"]),
      F(["document", "Document", "@relation(fields: [documentId], references: [id])", "Document"]),
      F(["userId", "String"]),
      F(["user", "User", "@relation(fields: [userId], references: [id])", "User"]),
      F(["signedAt", "DateTime?"]),
      F(["signatureImage", "String?", undefined, undefined, "Imagen de la firma"]),
      F(["ipAddress", "String?"]),
      F(["deviceInfo", "String?"]),
    ],
  },
  {
    name: "Incident", domain: "incidents", note: "Denuncias anónimas con evidencia",
    fields: [
      F(["id", "String", "@id @default(cuid())"]),
      F(["title", "String"]),
      F(["description", "String"]),
      F(["category", "IncidentCategory"]),
      F(["evidence", "String[]", undefined, undefined, "URLs de fotos/videos"]),
      F(["status", "IncidentStatus", "@default(OPEN)"]),
      F(["reportedBy", "String?", undefined, undefined, "Puede ser null si es anónimo"]),
      F(["reporter", "User?", '@relation("ReportedBy", fields: [reportedBy], references: [id])', "User"]),
      F(["isAnonymous", "Boolean", "@default(true)"]),
      F(["branchId", "String?"]),
      F(["createdAt", "DateTime", "@default(now())"]),
      F(["resolvedAt", "DateTime?"]),
      F(["resolution", "String?"]),
    ],
  },
];

const ENUMS: EnumDef[] = [
  { name: "UserRole", values: ["EMPLOYEE", "SECTION_MANAGER", "GENERAL_MANAGER", "ADMIN"] },
  { name: "Language", values: ["ES", "PT", "EN"] },
  { name: "PlanType", values: ["BASIC", "CLASSIC", "ENTERPRISE"] },
  { name: "ShiftStatus", values: ["SCHEDULED", "CONFIRMED", "COMPLETED", "ABSENT"] },
  { name: "ClockType", values: ["CLOCK_IN", "CLOCK_OUT"] },
  { name: "Recurrence", values: ["ONCE", "DAILY", "WEEKLY", "MONTHLY"] },
  { name: "TaskPriority", values: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
  { name: "TaskStatus", values: ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED", "OVERDUE"] },
  { name: "ExpenseStatus", values: ["PENDING", "AI_REVIEWING", "APPROVED", "REJECTED", "FLAGGED"] },
  { name: "AIVerdict", values: ["APPROVED", "REJECTED", "NEEDS_REVIEW"] },
  { name: "ChatType", values: ["DIRECT", "GROUP", "BROADCAST"] },
  { name: "ChatRole", values: ["ADMIN", "MEMBER"] },
  { name: "MessageType", values: ["TEXT", "IMAGE", "VIDEO", "AUDIO", "FILE", "LOCATION", "SYSTEM"] },
  { name: "IncidentCategory", values: ["SAFETY", "HARASSMENT", "THEFT", "MAINTENANCE", "OTHER"] },
  { name: "IncidentStatus", values: ["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"] },
];

const DOMAINS: Domain[] = ["core", "scheduling", "timetracking", "tasks", "expenses", "training", "chat", "documents", "incidents"];
const DOMAIN_COLOR: Record<Domain, string> = {
  core: "#256b52",
  scheduling: "#e89f2e",
  timetracking: "#2e7d8c",
  tasks: "#54688c",
  expenses: "#ce5638",
  training: "#7b5ea7",
  chat: "#a34d75",
  documents: "#144935",
  incidents: "#b04327",
};
const DOMAINS_I18N: Record<Domain, string> = {
  core: "dm.dom.core",
  scheduling: "nav.scheduling",
  timetracking: "nav.timetracking",
  tasks: "nav.tasks",
  expenses: "nav.expenses",
  training: "nav.training",
  chat: "nav.chat",
  documents: "nav.documents",
  incidents: "nav.incidents",
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
    lines.push({ parts, plain: parts.map((p) => p.text).join(""), model });
  };

  push([{ text: "// StaffHub 360 · modelo de datos principal", cls: "tok-c" }]);
  push([{ text: "// PostgreSQL + Prisma · Redis para sesiones y caché", cls: "tok-c" }]);
  push([{ text: "", cls: "" }]);
  push([{ text: "generator", cls: "tok-k" }, { text: " client {", cls: "tok-b" }]);
  push([{ text: "  provider ", cls: "tok-f" }, { text: "= ", cls: "tok-b" }, { text: '"prisma-client-js"', cls: "tok-s" }]);
  push([{ text: "}", cls: "tok-b" }]);
  push([{ text: "", cls: "" }]);
  push([{ text: "datasource", cls: "tok-k" }, { text: " db {", cls: "tok-b" }]);
  push([{ text: "  provider ", cls: "tok-f" }, { text: "= ", cls: "tok-b" }, { text: '"postgresql"', cls: "tok-s" }]);
  push([{ text: "  url      ", cls: "tok-f" }, { text: "= ", cls: "tok-b" }, { text: 'env("DATABASE_URL")', cls: "tok-s" }]);
  push([{ text: "}", cls: "tok-b" }]);

  let prevDomain: Domain | null = null;
  for (const m of MODELS) {
    push([{ text: "", cls: "" }]);
    if (m.domain !== prevDomain) {
      push([{ text: "// " + SECT_LABEL[m.domain], cls: "tok-c" }]);
      prevDomain = m.domain;
    }
    const start = lines.length;
    push([{ text: "model", cls: "tok-k" }, { text: " " + m.name, cls: "tok-n" }, { text: " {", cls: "tok-b" }], m.name);

    const real = m.fields.filter((f) => !f.name.startsWith("//"));
    const maxName = Math.max(...real.map((f) => f.name.length));
    const maxType = Math.max(...real.map((f) => f.type.length));

    for (const f of m.fields) {
      if (f.name.startsWith("//")) {
        push([{ text: "  " + f.name, cls: "tok-c" }], m.name);
        continue;
      }
      const parts: Part[] = [
        { text: "  " + f.name.padEnd(maxName + 1), cls: f.name.startsWith("@@") ? "tok-a" : "tok-f" },
      ];
      parts.push({ text: f.type.padEnd(maxType + 1), cls: typeCls(f.type) });
      if (f.attrs) parts.push({ text: f.attrs, cls: "tok-a" });
      if (f.rel) parts.push({ text: "  → " + f.rel, cls: "tok-rel" });
      if (f.comment) parts.push({ text: " // " + f.comment, cls: "tok-c" });
      push(parts, m.name);
    }
    push([{ text: "}", cls: "tok-b" }], m.name);
    ranges[m.name] = [start, lines.length - 1];
  }

  push([{ text: "", cls: "" }]);
  push([{ text: "// ── Enums ─────────────────────────────────────", cls: "tok-c" }]);
  for (const e of ENUMS) {
    push([{ text: "", cls: "" }]);
    push([{ text: "enum", cls: "tok-k" }, { text: " " + e.name, cls: "tok-n" }, { text: " {", cls: "tok-b" }]);
    push([{ text: "  " + e.values.join("  "), cls: "tok-te" }]);
    push([{ text: "}", cls: "tok-b" }]);
  }

  return { lines, ranges };
}

export default function DataModel({ notify }: { notify: (m: string) => void }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<string | null>("User");
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
    } catch {
      /* noop */
    }
    notify(t("dm.copied"));
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
          <h1 className="font-display font-extrabold text-[28px] tracking-tight text-ink leading-none flex items-center gap-3 flex-wrap">
            Prisma Schema
            <Pill tone="pine"><IDatabase size={11} /> PostgreSQL</Pill>
            <Pill tone="amber">cuid()</Pill>
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
          { v: DOMAINS.length, l: t("dm.domains"), c: "#7b5ea7" },
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
              const fieldCount = m.fields.filter((f) => !f.name.startsWith("//")).length;
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
                    <span className="ml-auto text-[10.5px] font-semibold text-mute font-mono">{fieldCount} {t("dm.fields")}</span>
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
