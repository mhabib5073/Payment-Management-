import { App as AntApp, Button, Layout, Result, Space, Spin, Tabs, Tag, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { api, type Meta } from './api'
import { useAuth } from './auth/AuthContext'
import { EmployeesPage } from './pages/EmployeesPage'
import { InsightsPage } from './pages/InsightsPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'

function ManagerWorkspace() {
  const { message } = AntApp.useApp()
  const [meta, setMeta] = useState<Meta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadMeta = useCallback(() => {
    api.meta().then(setMeta).catch((e) => setError(e.message))
  }, [])

  useEffect(loadMeta, [loadMeta])

  const onDataChanged = () => {
    setRefreshKey((k) => k + 1) // refresh insights
    loadMeta() // new job titles appear in dropdowns
  }

  if (error) return <Result status="error" title="Cannot reach the API" subTitle={error} />
  if (!meta) return <Spin size="large" style={{ display: 'block', marginTop: 120 }} />

  return (
    <Tabs
      onChange={() => message.destroy()}
      items={[
        { key: 'employees', label: 'Employees', children: <EmployeesPage meta={meta} onDataChanged={onDataChanged} /> },
        { key: 'insights', label: 'Insights', children: <InsightsPage meta={meta} refreshKey={refreshKey} /> },
        { key: 'profile', label: 'My profile', children: <ProfilePage /> },
      ]}
    />
  )
}

export default function App() {
  const { me, loading, logout } = useAuth()

  if (loading) return <Spin size="large" style={{ display: 'block', marginTop: 120 }} />
  if (!me) return <LoginPage />

  const isManager = me.user.role === 'manager'
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          ACME Salary Management
        </Typography.Title>
        <Space>
          <Typography.Text style={{ color: '#fff' }}>{me.user.email}</Typography.Text>
          <Tag color={isManager ? 'gold' : 'blue'}>{me.user.role}</Tag>
          <Button size="small" onClick={logout}>
            Log out
          </Button>
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>{isManager ? <ManagerWorkspace /> : <ProfilePage />}</Layout.Content>
    </Layout>
  )
}