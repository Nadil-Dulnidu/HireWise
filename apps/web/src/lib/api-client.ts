import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Correlation ID & Token Holder
let authTokenGetter: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  authTokenGetter = getter;
};

apiClient.interceptors.request.use(async (config) => {
  // Add Correlation ID
  const correlationId = crypto.randomUUID();
  config.headers["X-Correlation-ID"] = correlationId;

  // Add Clerk Bearer Token if available
  if (authTokenGetter) {
    try {
      const token = await authTokenGetter();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn("Failed to retrieve Clerk auth token", err);
    }
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized API access detected");
    }
    return Promise.reject(error);
  },
);
