import { describe, expect, it } from "vitest";
import type { WidgetRegistryEntry } from "@/components/widgets/widgetRegistry";
import { getFilteredWidgets } from "@/components/widgets/addWidgetSheetUtils";

const mockWidgets = [
  {
    type: "alpha",
    category: "crypto",
    assetType: "crypto",
    label: "Alpha Widget",
    desc: "Shows alpha signals",
    icon: (() => null) as unknown as WidgetRegistryEntry["icon"],
    iconColor: "text-primary",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn" },
    defaultSize: { w: 4, h: 3 },
    constraints: { minW: 3, minH: 2 },
    configFields: [],
  },
  {
    type: "beta",
    category: "news",
    assetType: "crypto",
    label: "Beta News",
    desc: "Macro headlines",
    icon: (() => null) as unknown as WidgetRegistryEntry["icon"],
    iconColor: "text-accent",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn" },
    defaultSize: { w: 4, h: 4 },
    constraints: { minW: 3, minH: 3 },
    configFields: [],
  },
  {
    type: "gamma",
    category: "crypto",
    assetType: "crypto",
    label: "Gamma Tracker",
    desc: "Tracks coins",
    icon: (() => null) as unknown as WidgetRegistryEntry["icon"],
    iconColor: "text-success",
    available: true,
    visual: { bg: "glass", shadow: "md", layout: "default", animation: "fadeIn" },
    defaultSize: { w: 3, h: 3 },
    constraints: { minW: 2, minH: 2 },
    configFields: [],
  },
] satisfies WidgetRegistryEntry[];

describe("getFilteredWidgets", () => {
  it("filters by search term and installed-only state", () => {
    const result = getFilteredWidgets({
      widgets: mockWidgets,
      activeCategory: "all",
      activeCategories: ["crypto", "news"],
      searchTerm: "macro",
      showInstalledOnly: true,
      installedCounts: { beta: 2 },
      selected: new Set<string>(),
    });

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("beta");
  });

  it("prioritizes selected widgets then installed count", () => {
    const result = getFilteredWidgets({
      widgets: mockWidgets,
      activeCategory: "all",
      activeCategories: ["crypto", "news"],
      searchTerm: "",
      showInstalledOnly: false,
      installedCounts: { alpha: 1, beta: 3, gamma: 2 },
      selected: new Set<string>(["gamma"]),
    });

    expect(result.map((widget) => widget.type)).toEqual(["gamma", "beta", "alpha"]);
  });

  it("respects explicit category filter", () => {
    const result = getFilteredWidgets({
      widgets: mockWidgets,
      activeCategory: "crypto",
      activeCategories: ["crypto", "news"],
      searchTerm: "",
      showInstalledOnly: false,
      installedCounts: {},
      selected: new Set<string>(),
    });

    expect(result.every((widget) => widget.category === "crypto")).toBe(true);
    expect(result.map((widget) => widget.type)).toEqual(["alpha", "gamma"]);
  });
});
