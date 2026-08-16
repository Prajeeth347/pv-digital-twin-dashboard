import React from "react";
import { createRoot } from "react-dom/client";
import GitHubPagesApp from "./GitHubPagesApp.jsx";
import "../app/globals.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GitHubPagesApp />
  </React.StrictMode>,
);
