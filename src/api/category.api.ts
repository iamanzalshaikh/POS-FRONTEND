import api from "@/service/api"
import type { Category } from "@/types/category"

const HIERARCHY_KEY = "pos_category_hierarchy"

// ----------- Hierarchy localStorage helpers -----------
export function getHierarchyMap(): Record<string, string | null> {
  try {
    const raw = localStorage.getItem(HIERARCHY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function setParent(categoryId: string, parentId: string | null) {
  const map = getHierarchyMap()
  map[categoryId] = parentId
  localStorage.setItem(HIERARCHY_KEY, JSON.stringify(map))
}

export function removeFromHierarchy(categoryId: string) {
  const map = getHierarchyMap()
  delete map[categoryId]
  localStorage.setItem(HIERARCHY_KEY, JSON.stringify(map))
}

const SUBCATEGORIES_KEY = "pos_category_subcategories"

export function getSubcategoriesMap(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(SUBCATEGORIES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getSubcategories(categoryId: string): string[] {
  return getSubcategoriesMap()[categoryId] || []
}

export function setSubcategories(categoryId: string, subcategories: string[]) {
  const map = getSubcategoriesMap()
  map[categoryId] = subcategories
  localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(map))
}

export function removeSubcategories(categoryId: string) {
  const map = getSubcategoriesMap()
  delete map[categoryId]
  localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(map))
}

/** Enriches a list of API categories with parentId/parentName from localStorage */
export function enrichWithHierarchy(categories: Category[]): Category[] {
  const map = getHierarchyMap()
  return categories.map((cat) => {
    const parentId = map[cat.id] ?? null
    const parentName = parentId
      ? categories.find((c) => c.id === parentId)?.name ?? null
      : null
    return { ...cat, parentId, parentName }
  })
}

// ----------- API calls -----------
export const getCategories = (params?: { tree?: boolean }) => {
  return api
    .get("/categories", { params: params?.tree ? { tree: "true" } : undefined })
    .then((res) => res.data)
}

export const createCategory = (data: {
  name: string
  description?: string
  parentId?: string | null
  slug?: string
}) => {
  const body: Record<string, unknown> = { name: data.name.trim() }
  if (data.parentId) body.parentId = data.parentId
  if (data.slug?.trim()) body.slug = data.slug.trim()
  return api.post("/categories", body).then((res) => res.data)
}

export const updateCategory = (id: string, data: any) => {
  return api.patch(`/categories/${id}`, data).then(res => res.data)
}

export const deleteCategory = (id: string) => {
  return api.delete(`/categories/${id}`).then(res => res.data)
}
