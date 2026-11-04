import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Input, Popconfirm, Select, Space, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { api, type Employee, type EmployeeInput, type EmployeeQuery, type Meta } from '../api'
import { DepartmentTag } from '../components/DepartmentTag'
import { EmployeeFormModal } from '../components/EmployeeFormModal'
import { UserAvatar } from '../components/UserAvatar'
import { formatMoney } from '../format'

interface Props {
  meta: Meta
  canEdit: boolean // managers: salaries, add, edit, delete. Employees: read-only directory
  onDataChanged?: () => void
}

export function EmployeesPage({ meta, canEdit, onDataChanged }: Props) {
  const { message } = App.useApp()
  const [query, setQuery] = useState<EmployeeQuery>({ page: 1, page_size: 20, sort: 'name', order: 'asc' })
  const [data, setData] = useState<{ items: Employee[]; total: number }>({ items: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const page = await api.listEmployees(query)
      setData({ items: page.items, total: page.total })
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [query, message])

  useEffect(() => {
    load()
  }, [load])

  const afterChange = (text: string) => {
    message.success(text)
    load()
    onDataChanged?.()
  }

  const save = async (values: EmployeeInput) => {
    setSaving(true)
    try {
      if (editing) await api.updateEmployee(editing.id, values)
      else await api.createEmployee(values)
      setModalOpen(false)
      afterChange(editing ? 'Employee updated' : 'Employee added')
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await api.deleteEmployee(id)
      afterChange('Employee deleted')
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  const onTableChange = (
    pagination: TablePaginationConfig,
    _filters: unknown,
    sorter: SorterResult<Employee> | SorterResult<Employee>[],
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter
    setQuery((q) => ({
      ...q,
      page: pagination.current ?? 1,
      page_size: pagination.pageSize ?? 20,
      sort: s.order ? (s.columnKey as EmployeeQuery['sort']) : 'name',
      order: s.order === 'descend' ? 'desc' : 'asc',
    }))
  }

  const columns: ColumnsType<Employee> = [
    {
      title: 'Employee', key: 'name', sorter: true,
      render: (_, e) => (
        <Space>
          <UserAvatar first={e.first_name} last={e.last_name} />
          <div>
            <Typography.Text strong>{e.first_name} {e.last_name}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>{e.email}</Typography.Text>
          </div>
        </Space>
      ),
    },
    { title: 'Job title', key: 'job_title', dataIndex: 'job_title', sorter: true },
    { title: 'Department', key: 'department', render: (_, e) => <DepartmentTag department={e.department} /> },
    { title: 'Country', key: 'country', dataIndex: 'country', sorter: true },
    ...(canEdit
      ? [{
          title: 'Salary', key: 'salary', sorter: true, align: 'right' as const,
          render: (_: unknown, e: Employee) =>
            e.salary != null ? <Typography.Text strong>{formatMoney(e.salary, e.currency)}</Typography.Text> : '—',
        }]
      : []),
    {
      title: 'Hire date', key: 'hire_date', sorter: true,
      render: (_, e) => dayjs(e.hire_date).format('D MMM YYYY'),
    },
    ...(canEdit
      ? [{
          title: '', key: 'actions', width: 96,
          render: (_: unknown, e: Employee) => (
            <Space>
              <Tooltip title="Edit">
                <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(e); setModalOpen(true) }} />
              </Tooltip>
              <Popconfirm title={`Delete ${e.first_name} ${e.last_name}?`} onConfirm={() => remove(e.id)}>
                <Tooltip title="Delete">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Tooltip>
              </Popconfirm>
            </Space>
          ),
        }]
      : []),
  ]

  return (
    <Card>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 16 }}>
        <Space wrap>
          <Input.Search
            placeholder="Search name or email"
            allowClear
            style={{ width: 280 }}
            onSearch={(search) => setQuery((q) => ({ ...q, search, page: 1 }))}
          />
          <Select
            placeholder="All countries"
            allowClear
            style={{ width: 180 }}
            options={Object.keys(meta.countries).map((c) => ({ value: c }))}
            onChange={(country) => setQuery((q) => ({ ...q, country, page: 1 }))}
          />
          <Select
            placeholder="All departments"
            allowClear
            style={{ width: 180 }}
            options={meta.departments.map((d) => ({ value: d }))}
            onChange={(department) => setQuery((q) => ({ ...q, department, page: 1 }))}
          />
        </Space>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setModalOpen(true) }}>
            Add employee
          </Button>
        )}
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data.items}
        loading={loading}
        onChange={onTableChange}
        pagination={{
          current: query.page, pageSize: query.page_size, total: data.total,
          showSizeChanger: true, showTotal: (t) => `${t.toLocaleString()} employees`,
        }}
        scroll={{ x: true }}
      />

      {canEdit && (
        <EmployeeFormModal
          open={modalOpen}
          employee={editing}
          meta={meta}
          saving={saving}
          onCancel={() => setModalOpen(false)}
          onSubmit={save}
        />
      )}
    </Card>
  )
}