// Apply saved theme before render
const savedTheme = localStorage.getItem("dasho-theme");
if (savedTheme && savedTheme !== "dark") {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
