
import axios from "axios";
const apiUrl = import.meta.env.VITE_API_URL 
console.log("API URL:", apiUrl);

export const http = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 second timeout for hosting operations
});

export const httpFile = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "multipart/form-data",
  },
  timeout: 120000, // deploy start + uploads; static build runs server-side after 200
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

// Hosting API instance
export const httpHosting = axios.create({
  baseURL: `${apiUrl}hosting/`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000, // 2 minute timeout for hosting operations
});
