export interface Category {
    id: string;
    name: string;
    parentId: string | null;
    isEnabled: boolean;
    description: string | null;
    subcategories: Category[];
    slug: string;
}