import { ApartmentOutlined, GlobalOutlined, RiseOutlined, TeamOutlined } from '@ant-design/icons'
import { App, Card, Col, List, Progress, Row, Space, Statistic, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { api, type Employee, type Meta, type SalaryStats } from '../api'
import { DepartmentTag } from '../components/DepartmentTag'
import { UserAvatar } from '../components/UserAvatar'
import { formatMoney } from '../format'

export function OverviewPage({ meta, refreshKey }: { meta: Meta; refreshKey: number }) {
  const { message } = App.useApp()
  const [countries, setCountries] = useState<SalaryStats[]>([])
  const [recent, setRecent] = useState<Employee[]>([])

  useEffect(() => {
    api.salaryStats('country').then(setCountries).catch((e) => message.error(e.message))
    api.listEmployees({ sort: 'hire_date', order: 'desc', page_size: 5 })
      .then((page) => setRecent(page.items))
      .catch((e) => message.error(e.message))
  }, [refreshKey, message])

  const total = countries.reduce((sum, c) => sum + c.headcount, 0)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Employees" value={total} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Countries" value={countries.length} prefix={<GlobalOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Departments" value={meta.departments.length} prefix={<ApartmentOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="Largest location" value={countries[0]?.group ?? '—'} prefix={<RiseOutlined />} /></Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="Headcount and median pay by country">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {countries.map((c) => (
                <div key={c.group}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Typography.Text strong>{c.group}</Typography.Text>
                    <Typography.Text type="secondary">
                      {c.headcount.toLocaleString()} people · median {formatMoney(c.median_salary, c.currency)}
                    </Typography.Text>
                  </Space>
                  <Progress percent={total ? Math.round((c.headcount / total) * 100) : 0} showInfo={false} />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Most recent hires">
            <List
              dataSource={recent}
              renderItem={(e) => (
                <List.Item extra={<Typography.Text type="secondary">{dayjs(e.hire_date).format('D MMM YYYY')}</Typography.Text>}>
                  <List.Item.Meta
                    avatar={<UserAvatar first={e.first_name} last={e.last_name} />}
                    title={`${e.first_name} ${e.last_name}`}
                    description={<Space size={4} wrap>{e.job_title}<DepartmentTag department={e.department} /></Space>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  )
}