import { apiFetch } from "@/lib/apiClient";
import type { Task } from "@/types";

const VALID_CATEGORIES: Task["category"][] = [
  "assignment",
  "exam",
  "meeting",
  "bill",
  "interview",
  "personal",
  "work",
];

interface ParsedRow {
  title: string;
  category: Task["category"];
  estimatedMinutes: number;
  deadline: string;
}

/** Minimal CSV parser handling quoted fields with embedded commas — matches what exportTasksToCSV produces. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

export function parseTaskCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const rawRows = parseCsv(text);
  if (rawRows.length === 0) return { rows: [], errors: ["File is empty."] };

  const header = rawRows[0].map((h) => h.trim().toLowerCase());
  const titleIdx = header.indexOf("title");
  const categoryIdx = header.indexOf("category");
  const minutesIdx = header.indexOf("estimatedminutes");
  const deadlineIdx = header.indexOf("deadline");

  if (titleIdx === -1 || deadlineIdx === -1) {
    return { rows: [], errors: ['CSV must include at least "title" and "deadline" columns.'] };
  }

  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  rawRows.slice(1).forEach((cells, i) => {
    const lineNum = i + 2;
    const title = cells[titleIdx]?.trim();
    const deadlineRaw = cells[deadlineIdx]?.trim();
    const categoryRaw = (categoryIdx >= 0 ? cells[categoryIdx]?.trim() : "personal") || "personal";
    const minutesRaw = minutesIdx >= 0 ? cells[minutesIdx]?.trim() : "30";

    if (!title) {
      errors.push(`Line ${lineNum}: missing title, skipped.`);
      return;
    }
    const deadline = new Date(deadlineRaw);
    if (isNaN(deadline.getTime())) {
      errors.push(`Line ${lineNum}: unrecognized deadline "${deadlineRaw}", skipped.`);
      return;
    }
    const category = VALID_CATEGORIES.includes(categoryRaw as Task["category"])
      ? (categoryRaw as Task["category"])
      : "personal";
    const estimatedMinutes = Math.max(5, parseInt(minutesRaw, 10) || 30);

    rows.push({ title, category, estimatedMinutes, deadline: deadline.toISOString() });
  });

  return { rows, errors };
}

export async function importTasksFromCsv(text: string): Promise<{ imported: number; errors: string[] }> {
  const { rows, errors } = parseTaskCsv(text);

  let imported = 0;
  for (const row of rows) {
    try {
      await apiFetch("/api/tasks", { method: "POST", body: JSON.stringify(row) });
      imported++;
    } catch (e) {
      errors.push(`"${row.title}": ${(e as Error).message}`);
    }
  }

  return { imported, errors };
}
