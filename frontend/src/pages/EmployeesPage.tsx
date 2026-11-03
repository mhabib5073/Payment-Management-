// frontend/src/pages/EmployeesPage.tsx
import { App, Button, Input, Popconfirm, Select, Space, Table } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult } from 'antd/es/table/interface'
import { useCallback, useEffect, useState } from 'react'
import { api, type Employee, type EmployeeInput, type EmployeeQuery, type Meta } from '../api'
import { EmployeeFormModal } from '../components/EmployeeFormModal'
import { formatMoney } from '../format'

export function EmployeesPage({ meta, onDataChanged }: { meta: Meta; onDataChanged: () => void }) {
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

  const save = async (values: EmployeeInput) => {
    setSaving(true)
    try {
      if (editing) await api.updateEmployee(editing.id, values)
      else await api.createEmployee(values)
      message.success(editing ? 'Employee updated' : 'Employee added')
      setModalOpen(false)
      load()
      onDataChanged()
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await api.deleteEmployee(id)
      message.success('Employee deleted')
      load()
      onDataChanged()
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
    { title: 'Name', key: 'name', sorter: true, render: (_, e) => `${e.first_name} ${e.last_name}` },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Job title', key: 'job_title', dataIndex: 'job_title', sorter: true },
    { title: 'Department', dataIndex: 'department' },
    { title: 'Country', key: 'country', dataIndex: 'country', sorter: true },
    {
      title: 'Salary', key: 'salary', sorter: true, align: 'right',
      render: (_, e) => formatMoney(e.salary, e.currency),
    },
    { title: 'Hire date', key: 'hire_date', dataIndex: 'hire_date', sorter: true },
    {
      title: '', key: 'actions',
      render: (_, e) => (
        <Space>
          <Button size="small" onClick={() => { setEditing(e); setModalOpen(true) }}>Edit</Button>
          <Popconfirm title="Delete this employee?" onConfirm={() => remove(e.id)}>
            <Button size="small" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space wrap>
        <Input.Search
          placeholder="Search name or email"
          allowClear
          style={{ width: 260 }}
          onSearch={(search) => setQuery((q) => ({ ...q, search, page: 1 }))}
        />
        <Select
          placeholder="Country"
          allowClear
          style={{ width: 180 }}
          options={Object.keys(meta.countries).map((c) => ({ value: c }))}
          onChange={(country) => setQuery((q) => ({ ...q, country, page: 1 }))}
        />
        <Select
          placeholder="Department"
          allowClear
          style={{ width: 180 }}
          options={meta.departments.map((d) => ({ value: d }))}
          onChange={(department) => setQuery((q) => ({ ...q, department, page: 1 }))}
        />
        <Button type="primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
          Add employee
        </Button>
      </Space>

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

      <EmployeeFormModal
        open={modalOpen}
        employee={editing}
        meta={meta}
        saving={saving}
        onCancel={() => setModalOpen(false)}
        onSubmit={save}
      />
    </Space>
  )
}