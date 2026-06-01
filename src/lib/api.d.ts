export interface CategoryOut {
    id: number;
    name: string;
    children: CategoryOut[];
}
export interface CategoryTree {
    items: CategoryOut[];
    total: number;
}
export declare function fetchCategoryTree(): Promise<CategoryTree>;
export declare function fetchCategoryFlat(): Promise<CategoryOut[]>;
export declare function fetchCategoryById(id: number): Promise<CategoryOut>;
//# sourceMappingURL=api.d.ts.map