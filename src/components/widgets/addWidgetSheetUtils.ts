import type { WidgetRegistryEntry } from "@/components/widgets/widgetRegistry";

interface FilterArgs {
  widgets: WidgetRegistryEntry[];
  activeCategory: string;
  activeCategories: string[];
  searchTerm: string;
  showInstalledOnly: boolean;
  installedCounts: Record<string, number>;
  selected: Set<string>;
}

export const getFilteredWidgets = ({
  widgets,
  activeCategory,
  activeCategories,
  searchTerm,
  showInstalledOnly,
  installedCounts,
  selected,
}: FilterArgs): WidgetRegistryEntry[] => {
  const query = searchTerm.trim().toLowerCase();

  return widgets
    .filter((widget) => (activeCategory === "all"
      ? activeCategories.includes(widget.category)
      : widget.category === activeCategory))
    .filter((widget) => (query
      ? `${widget.label} ${widget.desc}`.toLowerCase().includes(query)
      : true))
    .filter((widget) => !showInstalledOnly || (installedCounts[widget.type] ?? 0) > 0)
    .sort((a, b) => {
      const countA = installedCounts[a.type] ?? 0;
      const countB = installedCounts[b.type] ?? 0;
      const selectedA = selected.has(a.type) ? 1 : 0;
      const selectedB = selected.has(b.type) ? 1 : 0;
      if (selectedA !== selectedB) return selectedB - selectedA;
      if (countA !== countB) return countB - countA;
      return a.label.localeCompare(b.label);
    });
};
