import {
  BarChartOutlined, DashboardOutlined, LogoutOutlined, TeamOutlined, UserOutlined,
} from '@ant-design/icons'
import { Avatar, Dropdown, Layout, Menu, Result, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { api, type Meta } from './api'
import { useAuth } from './auth/AuthContext'
import { UserAvatar } from './components/UserAvatar'
import { EmployeesPage } from './pages/EmployeesPage'
import { InsightsPage } from './pages/InsightsPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { ProfilePage } from './pages/ProfilePage'

type PageKey = 'overview' | 'employees' | 'insights' | 'directory' | 'profile'

const MANAGER_MENU = [
  { key: 'overview', icon: <DashboardOutlined />, label: 'Overview' },
  { key: 'employees', icon: <TeamOutlined />, label: 'Employees' },
  { key: 'insights', icon: <BarChartOutlined />, label: 'Insights' },
  { key: 'profile', icon: <UserOutlined />, label: 'My profile' },
]

const EMPLOYEE_MENU = [
  { key: 'profile', icon: <UserOutlined />, label: 'My profile' },
  { key: 'directory', icon: <TeamOutlined />, label: 'Directory' },
]

export default function App() {
  const { me, loading, logout } = useAuth()
  const [page, setPage] = useState<PageKey>('overview')
  const [meta, setMeta] = useState<Meta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const isManager = me?.user.role === 'manager'

  const loadMeta = useCallback(() => {
    api.meta().then(setMeta).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!me) return
    setPage(me.user.role === 'manager' ? 'overview' : 'profile')
    loadMeta()
  }, [me?.user.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spin size="large" fullscreen />
  if (!me) return <LoginPage />
  if (error) return <Result status="error" title="Cannot reach the API" subTitle={error} />
  if (!meta) return <Spin size="large" fullscreen />

  const onDataChanged = () => {
    setRefreshKey((k) => k + 1)
    loadMeta() // new job titles appear in dropdowns
  }

  const pages: Record<PageKey, { title: string; node: ReactNode }> = {
    overview: { title: 'Overview', node: <OverviewPage meta={meta} refreshKey={refreshKey} /> },
    employees: { title: 'Employees', node: <EmployeesPage meta={meta} canEdit onDataChanged={onDataChanged} /> },
    insights: { title: 'Salary insights', node: <InsightsPage meta={meta} refreshKey={refreshKey} /> },
    directory: { title: 'Company directory', node: <EmployeesPage meta={meta} canEdit={false} /> },
    profile: { title: 'My profile', node: <ProfilePage /> },
  }

  const name = me.profile ? `${me.profile.first_name} ${me.profile.last_name}` : me.user.email

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider breakpoint="lg" collapsedWidth={0} width={220} theme="dark">
        <div className="brand">ACME People</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[page]}
          items={isManager ? MANAGER_MENU : EMPLOYEE_MENU}
          onClick={({ key }) => setPage(key as PageKey)}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="app-header">
          <Typography.Title level={4} style={{ margin: 0 }}>
            {pages[page].title}
          </Typography.Title>
          <Dropdown
            menu={{
              items: [
                { key: 'email', label: me.user.email, disabled: true },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', onClick: logout },
              ],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              {me.profile ? (
                <UserAvatar first={me.profile.first_name} last={me.profile.last_name} />
              ) : (
                <Avatar icon={<UserOutlined />} />
              )}
              <Typography.Text strong>{name}</Typography.Text>
              <Tag color={isManager ? 'gold' : 'blue'}>{isManager ? 'Manager' : 'Employee'}</Tag>
            </Space>
          </Dropdown>
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>{pages[page].node}</Layout.Content>
      </Layout>
    </Layout>
  )
}