import axios from "axios";
import { resolveAdminApiUrl } from "./lib/backendUrl";

const resolved = resolveAdminApiUrl().replace(/\/+$/, "");
const apiUrl = resolved ? `${resolved}/` : "";

if (!apiUrl || !/^https?:\/\//i.test(apiUrl)) {
  console.error(
    "[config] FATAL: API base URL is empty. Login will POST to this same site and 404. " +
      "Set VITE_BackendUrl on Railway (origin only) and redeploy admin."
  );
} else {
  console.log("[config] API URL:", apiUrl);
}

export const http = axios.create({
  baseURL: apiUrl || undefined,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const httpFile = axios.create({
  baseURL: apiUrl || undefined,
  headers: {
    "Content-Type": "multipart/form-data",
  },
  timeout: 120000,
});

export const httpFileData = axios.create({
  baseURL: apiUrl || undefined,
  headers: {
    "Content-Type": "multipart/form-data,application/json",
    secret_key: "Bbz3G9AwLNqKuG5OSn5GriwXvw==",
    publish_key: "U0Kvc4Wzg6AYZMbx29m2eJHa3g==",
  },
  timeout: 60000,
});

export const httpHosting = axios.create({
  baseURL: apiUrl ? `${apiUrl}hosting/` : undefined,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});

// Guard: never silently hit same-origin relative /login
[http, httpFile, httpFileData, httpHosting].forEach((client) => {
  client.interceptors.request.use((config) => {
    const base = String(config.baseURL || "");
    if (!base || !/^https?:\/\//i.test(base)) {
      return Promise.reject(
        new Error(
          "VITE_BackendUrl is not baked into this build. Set it on Railway and redeploy."
        )
      );
    }
    return config;
  });
});
