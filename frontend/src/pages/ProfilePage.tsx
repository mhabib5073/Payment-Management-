import { CalendarOutlined, EnvironmentOutlined, MailOutlined } from '@ant-design/icons'
import { Card, Col, Descriptions, Result, Row, Space, Statistic, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { DepartmentTag } from '../components/DepartmentTag'
import { UserAvatar } from '../components/UserAvatar'
import { formatMoney } from '../format'

function tenure(hireDate: string): string {
  const months = dayjs().diff(dayjs(hireDate), 'month')
  const years = Math.floor(months / 12)
  return years > 0 ? `${years} yr ${months % 12} mo` : `${months} mo`
}

export function ProfilePage() {
  const { me, refresh } = useAuth()

  useEffect(() => {
    refresh() // show the latest data, e.g. after HR changed the salary
  }, [refresh])

  const p = me?.profile
  if (!p) return <Result status="info" title="No employee record is linked to this account" />

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 900 }}>
      <Card className="profile-hero" variant="borderless">
        <Space size="large" align="center" wrap>
          <UserAvatar first={p.first_name} last={p.last_name} size={88} />
          <div>
            <Typography.Title level={2} style={{ margin: 0, color: '#fff' }}>
              {p.first_name} {p.last_name}
            </Typography.Title>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16 }}>{p.job_title}</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <DepartmentTag department={p.department} />
            </div>
          </div>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Annual salary" value={p.salary != null ? formatMoney(p.salary, p.currency) : '—'} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Monthly (before tax)" value={p.salary != null ? formatMoney(Math.round(p.salary / 12), p.currency) : '—'} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic title="Time at ACME" value={tenure(p.hire_date)} />
          </Card>
        </Col>
      </Row>

      <Card title="Details">
        <Descriptions column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label={<Space size={6}><MailOutlined />Email</Space>}>{p.email}</Descriptions.Item>
          <Descriptions.Item label={<Space size={6}><EnvironmentOutlined />Country</Space>}>{p.country}</Descriptions.Item>
          <Descriptions.Item label={<Space size={6}><CalendarOutlined />Hire date</Space>}>
            {dayjs(p.hire_date).format('D MMM YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Currency">{p.currency}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  )
}