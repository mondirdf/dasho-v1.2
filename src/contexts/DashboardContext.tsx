/**
 * Dashboard state context — manages widgets, layout, edit mode.
 * Supports multiple dashboards per user with plan limit enforcement.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getWidgetDef } from "@/components/widgets/widgetRegistry";
import {
  fetchDashboards,
  createDashboard,
  fetchWidgets,
  updateDashboardLayout,
  createWidget,
  deleteWidget as deleteWidgetService,
  deleteDashboard as deleteDashboardService,
  renameDashboard as renameDashboardService,
  type Dashboard,
  type Widget,
} from "@/services/dataService";
import { useToast } from "@/hooks/use-toast";

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  [key: string]: any;
}

interface DashboardState {
  dashboards: Dashboard[];
  dashboard: Dashboard | null;
  widgets: Widget[];
  layout: LayoutItem[];
  loading: boolean;
  editMode: boolean;
  isNewUser: boolean;
  setEditMode: (v: boolean) => void;
  addWidget: (type: string, config?: any) => Promise<void>;
  removeWidget: (id: string) => Promise<void>;
  onLayoutChange: (layout: LayoutItem[]) => void;
  refresh: () => Promise<void>;
  switchDashboard: (id: string) => void;
  createNewDashboard: () => Promise<void>;
  deleteDashboard: () => Promise<void>;
  renameDashboard: (name: string) => Promise<void>;
  duplicateDashboard: () => Promise<void>;
  resetLayout: () => void;
  renameOpen: boolean;
  setRenameOpen: (v: boolean) => void;
}

const DashboardContext = createContext<DashboardState>({} as DashboardState);

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboardWidgets = async (dash: Dashboard) => {
    const w = await fetchWidgets(dash.id);
    setWidgets(w);
    const savedLayout = Array.isArray(dash.layout_json) ? (dash.layout_json as unknown as LayoutItem[]) : [];
    if (savedLayout.length > 0) {
      setLayout(savedLayout);
    } else {
      setLayout(
        w.map((widget) => ({
          i: widget.id,
          x: widget.position_x,
          y: widget.position_y,
          w: widget.width,
          h: widget.height,
        }))
      );
    }
  };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const dashes = await fetchDashboards(user.id);
      if (dashes.length === 0) {
        // New user — don't auto-create, show onboarding
        setIsNewUser(true);
        setDashboards([]);
        setDashboard(null);
        setWidgets([]);
        setLayout([]);
        setLoading(false);
        return;
      }
      setIsNewUser(false);
      setDashboards(dashes);
      const active = dashes[0];
      setDashboard(active);
      await loadDashboardWidgets(active);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const switchDashboard = useCallback(async (id: string) => {
    const dash = dashboards.find((d) => d.id === id);
    if (!dash) return;
    setDashboard(dash);
    setEditMode(false);
    await loadDashboardWidgets(dash);
  }, [dashboards]);

  const createNewDashboard = useCallback(async () => {
    if (!user) return;
    try {
      const dash = await createDashboard(user.id, "New Dashboard");
      setDashboards((prev) => [...prev, dash]);
      setDashboard(dash);
      setWidgets([]);
      setLayout([]);
      toast({ title: "Dashboard created" });
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("Free plan")) {
        toast({ title: "Plan limit reached", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Error creating dashboard", variant: "destructive" });
      }
    }
  }, [user, toast]);

  const deleteDashboardFn = useCallback(async () => {
    if (!dashboard || dashboards.length <= 1) return;
    await deleteDashboardService(dashboard.id);
    const remaining = dashboards.filter((d) => d.id !== dashboard.id);
    setDashboards(remaining);
    setDashboard(remaining[0]);
    await loadDashboardWidgets(remaining[0]);
    toast({ title: "Dashboard deleted" });
  }, [dashboard, dashboards, toast]);

  const renameDashboardFn = useCallback(async (name: string) => {
    if (!dashboard) return;
    const trimmed = name.trim().slice(0, 100);
    if (!trimmed) return;
    await renameDashboardService(dashboard.id, trimmed);
    setDashboard({ ...dashboard, name: trimmed });
    setDashboards((prev) => prev.map((d) => d.id === dashboard.id ? { ...d, name: trimmed } : d));
    toast({ title: "Dashboard renamed" });
  }, [dashboard, toast]);

  const duplicateDashboardFn = useCallback(async () => {
    if (!dashboard || !user) return;
    try {
      const newDash = await createDashboard(user.id, dashboard.name + " (Copy)");
      for (const w of widgets) {
        await createWidget(newDash.id, w.type, w.config_json as any);
      }
      await updateDashboardLayout(newDash.id, layout);
      setDashboards((prev) => [...prev, { ...newDash, layout_json: layout as any }]);
      setDashboard({ ...newDash, layout_json: layout as any });
      await loadDashboardWidgets({ ...newDash, layout_json: layout as any });
      toast({ title: "Dashboard duplicated" });
    } catch (e: any) {
      const msg = e?.message || "";
      if (msg.includes("Free plan")) {
        toast({ title: "Plan limit reached", description: msg, variant: "destructive" });
      } else {
        toast({ title: "Error duplicating dashboard", variant: "destructive" });
      }
    }
  }, [dashboard, user, widgets, layout, toast]);

  const resetLayout = useCallback(() => {
    const newLayout = widgets.map((w, i) => ({
      i: w.id,
      x: (i * 4) % 12,
      y: Math.floor((i * 4) / 12) * 3,
      w: 4,
      h: 3,
    }));
    setLayout(newLayout);
    if (dashboard) {
      updateDashboardLayout(dashboard.id, newLayout);
    }
    toast({ title: "Layout reset" });
  }, [widgets, dashboard, toast]);

  /** Validate layout: guard against NaN, negative, oversized values */
  const validateLayout = useCallback((items: LayoutItem[]): LayoutItem[] => {
    return items.map((item) => ({
      ...item,
      x: Number.isFinite(item.x) && item.x >= 0 ? item.x : 0,
      y: Number.isFinite(item.y) && item.y >= 0 ? item.y : 0,
      w: Number.isFinite(item.w) && item.w >= 1 ? Math.min(item.w, 12) : 4,
      h: Number.isFinite(item.h) && item.h >= 1 ? Math.min(item.h, 12) : 3,
    }));
  }, []);

  const onLayoutChange = useCallback(
    (newLayout: LayoutItem[]) => {
      const validated = validateLayout(newLayout);
      setLayout(validated);
      if (!dashboard) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await updateDashboardLayout(dashboard.id, validated);
        } catch (e) {
          console.error("Layout save error:", e);
        }
      }, 500);
    },
    [dashboard, validateLayout]
  );

  const addWidget = useCallback(
    async (type: string, config: any = {}) => {
      if (!dashboard) return;
      try {
        const def = getWidgetDef(type);
        const size = def?.defaultSize ?? { w: 4, h: 3 };
        const w = await createWidget(dashboard.id, type, config);
        setWidgets((prev) => [...prev, w]);
        setLayout((prev: LayoutItem[]) => [
          ...prev,
          { i: w.id, x: 0, y: Infinity, w: size.w, h: size.h },
        ]);
        toast({ title: "Widget added" });
      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("Free plan")) {
          toast({ title: "Plan limit reached", description: msg, variant: "destructive" });
        } else {
          toast({ title: "Error adding widget", variant: "destructive" });
        }
      }
    },
    [dashboard, toast]
  );

  const removeWidget = useCallback(
    async (id: string) => {
      setWidgets((prev) => prev.filter((w) => w.id !== id));
      setLayout((prev: LayoutItem[]) => prev.filter((l) => l.i !== id));
      await deleteWidgetService(id);
      toast({ title: "Widget removed" });
    },
    [toast]
  );

  return (
    <DashboardContext.Provider
      value={{
        dashboards, dashboard, widgets, layout, loading, editMode, isNewUser,
        setEditMode, addWidget, removeWidget, onLayoutChange,
        refresh: load, switchDashboard, createNewDashboard,
        deleteDashboard: deleteDashboardFn, renameDashboard: renameDashboardFn,
        duplicateDashboard: duplicateDashboardFn, resetLayout,
        renameOpen, setRenameOpen,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
