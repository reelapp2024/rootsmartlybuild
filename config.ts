import axios from "axios";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_PROJECT_URL || 'http://localhost:3000';

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
  timeout: 60000, // 60 second timeout for file uploads
  transformRequest: [(data) => {
    // If data is already FormData, return as is
    if (data instanceof FormData) {
      return data;
    }
    // Convert plain object to FormData
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  }],
});

// Add response interceptor to suppress expected errors in console
httpFile.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress 404 and 400 errors from console (expected for missing data)
    const status = error?.response?.status;
    if (status === 404 || status === 400) {
      // Return the error but don't log it - let the catch blocks handle it
      return Promise.reject(error);
    }
    // Log other errors (500, etc.) as they indicate real problems
    return Promise.reject(error);
  }
);

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
