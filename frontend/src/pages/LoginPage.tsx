import { BarChartOutlined, LockOutlined, MailOutlined, SafetyOutlined, TeamOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Divider, Form, Input, Space, Tabs, Typography } from 'antd'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

interface Credentials {
  email: string
  password: string
}

const DEMO = {
  manager: { email: 'hr.manager@acme.com', password: 'Manager@123' },
  employee: { email: 'demo.employee@acme.com', password: 'Employee@123' },
}

const FEATURES = [
  { icon: <TeamOutlined />, text: '10,000 employees across 8 countries, searchable in milliseconds' },
  { icon: <BarChartOutlined />, text: 'Pay ranges by country, job title and department' },
  { icon: <SafetyOutlined />, text: 'Role-based access: salaries stay private' },
]

export function LoginPage() {
  const { login, register } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (action: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await action()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const loginForm = (
    <Form<Credentials> layout="vertical" size="large" onFinish={(v) => run(() => login(v.email, v.password))}>
      <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
        <Input prefix={<MailOutlined />} placeholder="Work email" autoComplete="username" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="Password" autoComplete="current-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={busy} block>
        Log in
      </Button>
      <Divider plain>
        <Typography.Text type="secondary">or try a demo account</Typography.Text>
      </Divider>
      <Space style={{ width: '100%' }} direction="vertical">
        <Button block disabled={busy} onClick={() => run(() => login(DEMO.manager.email, DEMO.manager.password))}>
          Continue as HR manager
        </Button>
        <Button block disabled={busy} onClick={() => run(() => login(DEMO.employee.email, DEMO.employee.password))}>
          Continue as employee
        </Button>
      </Space>
    </Form>
  )

  const registerForm = (
    <Form<Credentials & { confirm: string }>
      layout="vertical"
      size="large"
      onFinish={(v) => run(() => register(v.email, v.password))}
    >
      <Typography.Paragraph type="secondary">
        Use the work email HR has on record. Manager accounts are created by HR.
      </Typography.Paragraph>
      <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
        <Input prefix={<MailOutlined />} placeholder="Work email" autoComplete="username" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true, min: 8, max: 72 }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="Password (8+ characters)" autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirm"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Please confirm your password' },
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Passwords differ')),
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" autoComplete="new-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={busy} block>
        Create account
      </Button>
    </Form>
  )

  return (
    <div className="login-screen">
      <section className="login-brand">
        <Typography.Title style={{ color: '#fff', marginBottom: 8 }}>ACME People</Typography.Title>
        <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, maxWidth: 420 }}>
          Salary management for HR, without the spreadsheets.
        </Typography.Paragraph>
        <Space direction="vertical" size="middle" style={{ marginTop: 24 }}>
          {FEATURES.map((f) => (
            <Space key={f.text} align="start" style={{ color: '#fff', fontSize: 15 }}>
              <span className="login-feature-icon">{f.icon}</span>
              <span>{f.text}</span>
            </Space>
          ))}
        </Space>
      </section>
      <section className="login-form">
        <Card style={{ width: '100%', maxWidth: 400 }} variant="borderless">
          <Typography.Title level={3} style={{ marginTop: 0 }}>
            Welcome back
          </Typography.Title>
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
          <Tabs
            onChange={() => setError(null)}
            items={[
              { key: 'login', label: 'Log in', children: loginForm },
              { key: 'register', label: 'Register', children: registerForm },
            ]}
          />
        </Card>
      </section>
    </div>
  )
}