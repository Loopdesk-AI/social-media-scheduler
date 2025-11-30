import './index.css';
import React from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./AppRouter";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<AppRouter />);
}