/**
 * Dashboard state context — manages widgets, layout, edit mode.
 * Single source of truth for the active dashboard.
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
  type Dashboard,
  type Widget,
} from "@/services/dataService";

// Layout item shape for react-grid-layout
export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  [key: string]: any;
}

interface DashboardState {
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
}

const DashboardContext = createContext<DashboardState>({} as DashboardState);

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layout, setLayout] = useState<LayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let dashboards = await fetchDashboards(user.id);
      if (dashboards.length === 0) {
        const newDash = await createDashboard(user.id);
        dashboards = [newDash];
      }
      const dash = dashboards[0];
      setDashboard(dash);

      const w = await fetchWidgets(dash.id);
      setWidgets(w);

      const savedLayout = Array.isArray(dash.layout_json) ? dash.layout_json : [];
      if (savedLayout.length > 0) {
        setLayout(savedLayout as unknown as LayoutItem[]);
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
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

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
      await deleteWidgetService(id);
      setWidgets((prev) => prev.filter((w) => w.id !== id));
      setLayout((prev: LayoutItem[]) => prev.filter((l) => l.i !== id));
    },
    []
  );

  return (
    <DashboardContext.Provider
      value={{
        dashboard, widgets, layout, loading, editMode,
        setEditMode, addWidget, removeWidget, onLayoutChange,
        refresh: load,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
