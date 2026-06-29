import React from "react";
import { createRoot } from "react-dom/client";
import App from "./renderer/App";
const el = document.getElementById("root")!;
createRoot(el).render(<App />);
