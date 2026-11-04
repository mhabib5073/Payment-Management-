import { Tag } from 'antd'

const DEPARTMENT_COLORS: Record<string, string> = {
  Engineering: 'blue',
  Product: 'purple',
  Sales: 'green',
  Marketing: 'magenta',
  Finance: 'gold',
  HR: 'volcano',
  Operations: 'cyan',
  Support: 'geekblue',
}

export function DepartmentTag({ department }: { department: string }) {
  return <Tag color={DEPARTMENT_COLORS[department] ?? 'default'}>{department}</Tag>
}