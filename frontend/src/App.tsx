// frontend/src/App.tsx
import { App as AntApp, Layout, Result, Spin, Tabs, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { api, type Meta } from './api'
import { EmployeesPage } from './pages/EmployeesPage'
import { InsightsPage } from './pages/InsightsPage'

export default function App() {
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
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
          ACME Salary Management
        </Typography.Title>
      </Layout.Header>
      <Layout.Content style={{ padding: 24 }}>
        <Tabs
          items={[
            { key: 'employees', label: 'Employees', children: <EmployeesPage meta={meta} onDataChanged={onDataChanged} /> },
            { key: 'insights', label: 'Insights', children: <InsightsPage meta={meta} refreshKey={refreshKey} /> },
          ]}
          onChange={() => message.destroy()}
        />
      </Layout.Content>
    </Layout>
  )
}