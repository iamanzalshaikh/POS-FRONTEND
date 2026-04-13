export interface Category {
  id: string
  name: string
  slug?: string
  parentId?: string | null
  parentName?: string | null
  parent?: { id: string; name: string; slug: string } | null
  description?: string | null
  _count?: {
    products: number
    children?: number
    productGroups?: number
  }
  children?: Category[]
}

// Frontend-only hierarchy metadata stored in localStorage
export interface CategoryHierarchyEntry {
  categoryId: string
  parentId: string | null
}
