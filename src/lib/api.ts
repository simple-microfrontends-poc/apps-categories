const API_BASE = process.env.API_BASE ?? "http://localhost:8000";

export interface CategoryOut {
  id: number;
  name: string;
  children: CategoryOut[];
}

export interface CategoryTree {
  items: CategoryOut[];
  total: number;
}

export async function fetchCategoryTree(): Promise<CategoryTree> {
  const res = await fetch(`${API_BASE}/categories/tree`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function fetchCategoryFlat(): Promise<CategoryOut[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

export async function fetchCategoryById(id: number): Promise<CategoryOut> {
  const res = await fetch(`${API_BASE}/categories/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}
