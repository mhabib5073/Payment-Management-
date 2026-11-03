// frontend/src/pages/InsightsPage.tsx
import { App, Card, Segmented, Select, Space, Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'
import { api, type Meta, type SalaryStats } from '../api'
import { formatMoney } from '../format'

type GroupBy = 'job_title' | 'department'

const statColumns = (groupTitle: string): ColumnsType<SalaryStats> => [
  { title: groupTitle, dataIndex: 'group' },
  { title: 'Headcount', dataIndex: 'headcount', align: 'right', sorter: (a, b) => a.headcount - b.headcount },
  { title: 'Min', align: 'right', render: (_, s) => formatMoney(s.min_salary, s.currency) },
  {
    title: 'Median', align: 'right', sorter: (a, b) => a.median_salary - b.median_salary,
    render: (_, s) => formatMoney(s.median_salary, s.currency),
  },
  { title: 'Average', align: 'right', render: (_, s) => formatMoney(s.avg_salary, s.currency) },
  { title: 'Max', align: 'right', render: (_, s) => formatMoney(s.max_salary, s.currency) },
]

export function InsightsPage({ meta, refreshKey }: { meta: Meta; refreshKey: number }) {
  const { message } = App.useApp()
  const [byCountry, setByCountry] = useState<SalaryStats[]>([])
  const [country, setCountry] = useState<string>('India')
  const [groupBy, setGroupBy] = useState<GroupBy>('job_title')
  const [breakdown, setBreakdown] = useState<SalaryStats[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.salaryStats('country').then(setByCountry).catch((e) => message.error(e.message))
  }, [refreshKey, message])

  useEffect(() => {
    setLoading(true)
    api.salaryStats(groupBy, country)
      .then(setBreakdown)
      .catch((e) => message.error(e.message))
      .finally(() => setLoading(false))
  }, [groupBy, country, refreshKey, message])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="Pay by country (each in local currency)">
        <Table rowKey="group" columns={statColumns('Country')} dataSource={byCountry} pagination={false} />
      </Card>

      <Card
        title="Breakdown within a country"
        extra={
          <Space>
            <Select
              value={country}
              style={{ width: 180 }}
              onChange={setCountry}
              options={Object.keys(meta.countries).map((c) => ({ value: c }))}
            />
            <Segmented<GroupBy>
              value={groupBy}
              onChange={setGroupBy}
              options={[{ label: 'Job title', value: 'job_title' }, { label: 'Department', value: 'department' }]}
            />
          </Space>
        }
      >
        <Table
          rowKey="group"
          loading={loading}
          columns={statColumns(groupBy === 'job_title' ? 'Job title' : 'Department')}
          dataSource={breakdown}
          pagination={false}
        />
      </Card>
    </Space>
  )
}