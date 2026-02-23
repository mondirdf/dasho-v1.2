/**
 * CSV Export button — extracts tabular data from a widget and downloads it.
 * Placed inside WidgetContainer for Pro users.
 */
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  widgetType: string;
}

/** Scrape visible table/list data from the widget DOM */
function extractWidgetData(container: HTMLElement): string[][] {
  // Try table first
  const table = container.querySelector("table");
  if (table) {
    const rows: string[][] = [];
    table.querySelectorAll("tr").forEach((tr) => {
      const cells: string[] = [];
      tr.querySelectorAll("th, td").forEach((cell) => {
        cells.push((cell as HTMLElement).innerText.trim());
      });
      if (cells.length > 0) rows.push(cells);
    });
    return rows;
  }

  // Fallback: extract text from list items or divs with data
  const items = container.querySelectorAll("[data-export-row]");
  if (items.length > 0) {
    const rows: string[][] = [];
    items.forEach((item) => {
      const cells: string[] = [];
      item.querySelectorAll("[data-export-cell]").forEach((cell) => {
        cells.push((cell as HTMLElement).innerText.trim());
      });
      if (cells.length > 0) rows.push(cells);
    });
    return rows;
  }

  // Last resort: try all rows with numeric content
  const allText: string[][] = [];
  container.querySelectorAll(".flex, .grid > div, li").forEach((el) => {
    const text = (el as HTMLElement).innerText.trim();
    if (text && text.includes("\n")) {
      allText.push(text.split("\n").map((s) => s.trim()).filter(Boolean));
    } else if (text) {
      allText.push([text]);
    }
  });
  return allText;
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => {
        const escaped = cell.replace(/"/g, '""');
        return cell.includes(",") || cell.includes('"') || cell.includes("\n")
          ? `"${escaped}"`
          : escaped;
      }).join(",")
    )
    .join("\n");
}

const CsvExportButton = ({ widgetType }: Props) => {
  const { toast } = useToast();

  const handleExport = () => {
    // Find the closest widget container and extract data
    const containers = document.querySelectorAll(`[data-widget-type="${widgetType}"]`);
    const container = containers[containers.length - 1] as HTMLElement | null;
    
    if (!container) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const data = extractWidgetData(container);
    if (data.length === 0) {
      toast({ title: "No tabular data found", variant: "destructive" });
      return;
    }

    const csv = toCsv(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${widgetType}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported" });
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleExport();
      }}
      className="p-1.5 rounded-lg bg-secondary/80 text-muted-foreground hover:text-primary transition-all hover:scale-110"
      aria-label="Export CSV"
      title="Export as CSV"
    >
      <Download className="h-3 w-3" />
    </button>
  );
};

export default CsvExportButton;
