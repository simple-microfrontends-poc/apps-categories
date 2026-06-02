import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchCategoryTree,
  fetchCategoryFlat,
  fetchCategoryById,
} from "./api";

const API_BASE = "http://localhost:8000";

function mockFetchOnce(body: unknown, init?: Partial<Response>) {
  const res = {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? "OK",
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
  return vi.fn().mockResolvedValue(res);
}

describe("api", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("fetchCategoryTree", () => {
    it("GETs /categories/tree and returns parsed body", async () => {
      const body = { items: [{ id: 1, name: "A", children: [] }], total: 1 };
      vi.stubGlobal("fetch", mockFetchOnce(body));

      const result = await fetchCategoryTree();

      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/categories/tree`);
      expect(result).toEqual(body);
    });

    it("throws with status + statusText when response is not ok", async () => {
      vi.stubGlobal(
        "fetch",
        mockFetchOnce(null, { ok: false, status: 500, statusText: "Server Error" }),
      );

      await expect(fetchCategoryTree()).rejects.toThrow(
        "HTTP 500: Server Error",
      );
    });
  });

  describe("fetchCategoryFlat", () => {
    it("GETs /categories and returns parsed body", async () => {
      const body = [{ id: 1, name: "A", children: [] }];
      vi.stubGlobal("fetch", mockFetchOnce(body));

      const result = await fetchCategoryFlat();

      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/categories`);
      expect(result).toEqual(body);
    });

    it("throws on a non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        mockFetchOnce(null, { ok: false, status: 404, statusText: "Not Found" }),
      );

      await expect(fetchCategoryFlat()).rejects.toThrow("HTTP 404: Not Found");
    });
  });

  describe("fetchCategoryById", () => {
    it("interpolates the id into the URL", async () => {
      const body = { id: 42, name: "A", children: [] };
      vi.stubGlobal("fetch", mockFetchOnce(body));

      const result = await fetchCategoryById(42);

      expect(fetch).toHaveBeenCalledWith(`${API_BASE}/categories/42`);
      expect(result).toEqual(body);
    });

    it("throws on a non-ok response", async () => {
      vi.stubGlobal(
        "fetch",
        mockFetchOnce(null, { ok: false, status: 404, statusText: "Not Found" }),
      );

      await expect(fetchCategoryById(99)).rejects.toThrow("HTTP 404: Not Found");
    });
  });
});
