/**
 * Dashboard state context — manages widgets, layout, edit mode.
 * Supports multiple dashboards per user.
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
import { supabase } from "@/integrations/supabase/client";

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
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDashboard = useCallback(async (dashId: string) => {
    const w = await fetchWidgets(dashId);
    setWidgets(w);
    const dash = dashboards.find((d) => d.id === dashId) || dashboard;
    const savedLayout = Array.isArray(dash?.layout_json) ? (dash.layout_json as unknown as LayoutItem[]) : [];
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
  }, [dashboards, dashboard]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let dashes = await fetchDashboards(user.id);
      if (dashes.length === 0) {
        const newDash = await createDashboard(user.id);
        dashes = [newDash];
      }
      setDashboards(dashes);
      const active = dashes[0];
      setDashboard(active);
      await loadDashboardWidgets(active, dashes);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadDashboardWidgets = async (dash: Dashboard, dashes?: Dashboard[]) => {
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
    const dash = await createDashboard(user.id, "New Dashboard");
    setDashboards((prev) => [...prev, dash]);
    setDashboard(dash);
    setWidgets([]);
    setLayout([]);
  }, [user]);

  const deleteDashboardFn = useCallback(async () => {
    if (!dashboard || dashboards.length <= 1) return;
    await deleteDashboardService(dashboard.id);
    const remaining = dashboards.filter((d) => d.id !== dashboard.id);
    setDashboards(remaining);
    setDashboard(remaining[0]);
    await loadDashboardWidgets(remaining[0]);
  }, [dashboard, dashboards]);

  const renameDashboardFn = useCallback(async (name: string) => {
    if (!dashboard) return;
    await renameDashboardService(dashboard.id, name);
    setDashboard({ ...dashboard, name });
    setDashboards((prev) => prev.map((d) => d.id === dashboard.id ? { ...d, name } : d));
  }, [dashboard]);

  const duplicateDashboardFn = useCallback(async () => {
    if (!dashboard || !user) return;
    const newDash = await createDashboard(user.id, dashboard.name + " (Copy)");
    // Copy widgets
    for (const w of widgets) {
      await createWidget(newDash.id, w.type, w.config_json as any);
    }
    await updateDashboardLayout(newDash.id, layout);
    setDashboards((prev) => [...prev, { ...newDash, layout_json: layout as any }]);
    setDashboard({ ...newDash, layout_json: layout as any });
    await loadDashboardWidgets({ ...newDash, layout_json: layout as any });
  }, [dashboard, user, widgets, layout]);

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
  }, [widgets, dashboard]);

  const onLayoutChange = useCallback(
    (newLayout: LayoutItem[]) => {
      setLayout(newLayout);
      if (!dashboard) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await updateDashboardLayout(dashboard.id, newLayout);
        } catch (e) {
          console.error("Layout save error:", e);
        }
      }, 500);
    },
    [dashboard]
  );

  const addWidget = useCallback(
    async (type: string, config: any = {}) => {
      if (!dashboard) return;
      const w = await createWidget(dashboard.id, type, config);
      setWidgets((prev) => [...prev, w]);
      setLayout((prev: LayoutItem[]) => [
        ...prev,
        { i: w.id, x: 0, y: Infinity, w: 4, h: 3 },
      ]);
    },
    [dashboard]
  );

  const removeWidget = useCallback(
    async (id: string) => {
      // Optimistic removal
      setWidgets((prev) => prev.filter((w) => w.id !== id));
      setLayout((prev: LayoutItem[]) => prev.filter((l) => l.i !== id));
      await deleteWidgetService(id);
    },
    []
  );

  return (
    <DashboardContext.Provider
      value={{
        dashboards, dashboard, widgets, layout, loading, editMode,
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
