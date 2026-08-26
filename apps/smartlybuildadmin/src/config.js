import axios from "axios";
import { resolveAdminApiUrl } from "./lib/backendUrl";

const apiUrl = resolveAdminApiUrl().replace(/\/+$/, "") + "/";
if (!apiUrl || apiUrl === "/") {
  console.error(
    "[config] VITE_BackendUrl is missing. Set origin only, e.g. VITE_BackendUrl=http://localhost:1111"
  );
}
console.log("API URL:", apiUrl);

export const http = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

export const httpFile = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "multipart/form-data",
  },
  timeout: 120000,
});

export const httpFileData = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "multipart/form-data,application/json",
    secret_key: "Bbz3G9AwLNqKuG5OSn5GriwXvw==",
    publish_key: "U0Kvc4Wzg6AYZMbx29m2eJHa3g==",
  },
  timeout: 60000,
});

export const httpHosting = axios.create({
  baseURL: `${apiUrl}hosting/`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000,
});
