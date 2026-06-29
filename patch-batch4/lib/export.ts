import type { Task } from "@/types";

const CSV_COLUMNS = ["title", "category", "estimatedMinutes", "remainingMinutes", "deadline", "status"] as const;

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTasksToCSV(tasks: Task[]) {
  const header = CSV_COLUMNS.join(",");
  const rows = tasks.map((t) => CSV_COLUMNS.map((col) => escapeCsvCell(t[col] as string | number)).join(","));
  const csv = [header, ...rows].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Opens a print-formatted window and triggers the browser's print dialog, which on every
 * modern browser offers "Save as PDF" — a real PDF export path with zero extra dependencies.
 */
export function exportTasksToPDF(tasks: Task[]) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const rows = tasks
    .map(
      (t) => `
      <tr>
        <td>${t.title}</td>
        <td>${t.category}</td>
        <td>${t.remainingMinutes}m / ${t.estimatedMinutes}m</td>
        <td>${new Date(t.deadline).toLocaleString()}</td>
        <td>${t.riskLevel ?? "—"}</td>
        <td>${t.status}</td>
      </tr>`
    )
    .join("");

  printWindow.document.write(`
    <html>
      <head>
        <title>Last-Minute Life Saver — Tasks</title>
        <style>
          body { font-family: -apple-system, Segoe UI, sans-serif; padding: 32px; color: #111; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          p { color: #666; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ddd; }
          th { text-transform: uppercase; font-size: 10px; color: #888; }
        </style>
      </head>
      <body>
        <h1>Last-Minute Life Saver — Task Export</h1>
        <p>Generated ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr><th>Title</th><th>Category</th><th>Work remaining</th><th>Deadline</th><th>Risk</th><th>Status</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
