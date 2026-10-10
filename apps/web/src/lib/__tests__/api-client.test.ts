/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient, setAuthTokenGetter } from "../api-client";

describe("apiClient integration and interceptors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthTokenGetter(async () => null);
  });

  it("injects X-Correlation-ID header on outgoing requests", async () => {
    const config = { headers: {} as Record<string, string> };
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const modifiedConfig = await requestInterceptor(config);

    expect(modifiedConfig.headers["X-Correlation-ID"]).toBeDefined();
    expect(typeof modifiedConfig.headers["X-Correlation-ID"]).toBe("string");
    expect(modifiedConfig.headers["X-Correlation-ID"].length).toBeGreaterThan(0);
  });

  it("injects Authorization Bearer token when authTokenGetter returns a token", async () => {
    setAuthTokenGetter(async () => "mock-jwt-token-12345");

    const config = { headers: {} as Record<string, string> };
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const modifiedConfig = await requestInterceptor(config);

    expect(modifiedConfig.headers["Authorization"]).toBe("Bearer mock-jwt-token-12345");
  });

  it("handles authTokenGetter rejection gracefully without breaking request pipeline", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    setAuthTokenGetter(async () => {
      throw new Error("Clerk token retrieval failed");
    });

    const config = { headers: {} as Record<string, string> };
    const requestInterceptor = (apiClient.interceptors.request as any).handlers[0].fulfilled;

    const modifiedConfig = await requestInterceptor(config);

    expect(modifiedConfig.headers["Authorization"]).toBeUndefined();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Failed to retrieve Clerk auth token",
      expect.any(Error)
    );
  });

  it("handles 401 Unauthorized response in error interceptor and logs warning", async () => {
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const responseErrorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    const mock401Error = {
      response: {
        status: 401,
        data: { message: "Unauthorized" },
      },
    };

    await expect(responseErrorInterceptor(mock401Error)).rejects.toEqual(mock401Error);
    expect(consoleWarnSpy).toHaveBeenCalledWith("Unauthorized API access detected");
  });

  it("propagates other error responses (400, 500) through error interceptor", async () => {
    const responseErrorInterceptor = (apiClient.interceptors.response as any).handlers[0].rejected;

    const mock500Error = {
      response: {
        status: 500,
        data: { error: "Internal Server Error" },
      },
    };

    await expect(responseErrorInterceptor(mock500Error)).rejects.toEqual(mock500Error);
  });
});
