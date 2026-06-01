import React, { useState, useEffect } from "react";
import { fetchCategoryTree, CategoryOut } from "../lib/api";

function CategoryTree({
  categories,
  level = 0,
  onSelect,
  selectedId,
}: {
  categories: CategoryOut[];
  level?: number;
  onSelect: (cat: CategoryOut) => void;
  selectedId: number | null;
}) {
  return (
    <ul className={level === 0 ? "space-y-1" : "ml-5 mt-1 space-y-0.5"}>
      {categories.map((cat) => (
        <li key={cat.id}>
          <button
            onClick={() => onSelect(cat)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
              selectedId === cat.id
                ? "bg-indigo-50 text-indigo-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            style={{ paddingLeft: `${level * 16 + 12}px` }}
          >
            <span>{cat.name}</span>
            {cat.children.length > 0 && (
              <span className="text-xs text-gray-400">
                {cat.children.length}
              </span>
            )}
          </button>
          {cat.children.length > 0 && (
            <CategoryTree
              categories={cat.children}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

function CategoryDetail({ category }: { category: CategoryOut }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-2">{category.name}</h3>
      <p className="text-sm text-gray-500 mb-4">ID: {category.id}</p>

      {category.children.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Podkategorie ({category.children.length})
          </h4>
          <ul className="space-y-1">
            {category.children.map((child) => (
              <li
                key={child.id}
                className="flex justify-between px-3 py-2 bg-gray-50 rounded text-sm"
              >
                <span className="text-gray-700">{child.name}</span>
                <span className="text-xs text-gray-400 font-mono">ID: {child.id}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Categories() {
  const [categories, setCategories] = useState<CategoryOut[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryOut | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoryTree()
      .then((data) => setCategories(data.items))
      .catch((e) => console.error("Failed to load categories:", e))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (cat: CategoryOut) => {
    setSelectedCategory(cat);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Kategorie</h2>
        <p className="text-sm text-gray-500">
          {categories.length} kategorii w drzewie
        </p>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Drzewo kategorii</h3>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full" />
            </div>
          ) : (
            <CategoryTree
              categories={categories}
              onSelect={handleSelect}
              selectedId={selectedCategory?.id ?? null}
            />
          )}
        </div>

        {selectedCategory && (
          <div className="w-80 shrink-0">
            <CategoryDetail category={selectedCategory} />
          </div>
        )}
      </div>
    </div>
  );
}

export default Categories;
