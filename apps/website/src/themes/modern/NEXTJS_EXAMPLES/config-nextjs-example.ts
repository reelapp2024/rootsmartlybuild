// config.ts - Next.js compatible config
import axios from 'axios'

// Next.js uses process.env.NEXT_PUBLIC_* for client-side variables
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const http = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

export const httpFile = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 60000,
})

export const httpFileData = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'multipart/form-data,application/json',
    secret_key: "Bbz3G9AwLNqKuG5OSn5GriwXvw==",
    publish_key: "U0Kvc4Wzg6AYZMbx29m2eJHa3g==",
  },
  timeout: 60000,
})

export const httpHosting = axios.create({
  baseURL: `${apiUrl}hosting/`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
})


