export interface Employee {
  id: number
  first_name: string
  last_name: string
  email: string
  job_title: string
  department: string
  country: string
  currency: string
  salary: number
  hire_date: string // YYYY-MM-DD
}

export type EmployeeInput = Omit<Employee, 'id' | 'currency'>

export interface EmployeePage {
  items: Employee[]
  total: number
  page: number
  page_size: number
}

export interface SalaryStats {
  group: string
  currency: string
  headcount: number
  min_salary: number
  max_salary: number
  avg_salary: number
  median_salary: number
}

export interface Meta {
  countries: Record<string, string> // country -> currency
  departments: string[]
  job_titles: string[]
}

export interface EmployeeQuery {
  search?: string
  country?: string
  department?: string
  sort?: 'name' | 'salary' | 'hire_date' | 'country' | 'job_title'
  order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export function buildQuery(params: object): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  const query = new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  return query ? `?${query}` : ''
}

export function errorMessage(detail: unknown, fallback: string): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    // FastAPI 422: [{ loc: [...], msg: "..." }]
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => `${d.loc?.[d.loc.length - 1]}: ${d.msg}`)
      .join(', ')
  }
  return fallback
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(errorMessage(body.detail, response.statusText))
  }
  return response.status === 204 ? (undefined as T) : response.json()
}

export const api = {
  listEmployees: (query: EmployeeQuery) => request<EmployeePage>(`/api/employees${buildQuery(query)}`),
  createEmployee: (data: EmployeeInput) =>
    request<Employee>('/api/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: Partial<EmployeeInput>) =>
    request<Employee>(`/api/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEmployee: (id: number) => request<void>(`/api/employees/${id}`, { method: 'DELETE' }),
  salaryStats: (groupBy: 'country' | 'job_title' | 'department', country?: string) =>
    request<SalaryStats[]>(`/api/insights/salaries${buildQuery({ group_by: groupBy, country })}`),
  meta: () => request<Meta>('/api/meta'),
}