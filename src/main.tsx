// Apply saved theme before render
const savedTheme = localStorage.getItem("dasho-theme");
if (savedTheme && savedTheme !== "dark") {
  document.documentElement.setAttribute("data-theme", savedTheme);
}

import { createRoot } from "react-dom/client";
import { inject } from "@vercel/analytics";
import App from "./App.tsx";
import "./index.css";

inject();

createRoot(document.getElementById("root")!).render(<App />);
