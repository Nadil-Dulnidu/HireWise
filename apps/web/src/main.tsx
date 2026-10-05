import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "@/store";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!clerkPubKey) {
  throw new Error(
    "Missing VITE_CLERK_PUBLISHABLE_KEY. Add it to your .env file. See .env.example for reference.",
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider
          publishableKey={clerkPubKey}
          appearance={{
            variables: {
              colorPrimary: "#2563eb",
              colorText: "#0f172a",
              colorTextSecondary: "#475569",
              colorBackground: "#ffffff",
              colorInputBackground: "#f8fafc",
              colorBorder: "#e2e8f0",
              borderRadius: "0.5rem",
              fontFamily: "Roboto, sans-serif",
            },
            elements: {
              card: "shadow-xl border border-slate-200 rounded-2xl bg-white",
              formButtonPrimary:
                "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all",
              footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
            },
          }}
        >
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ClerkProvider>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
