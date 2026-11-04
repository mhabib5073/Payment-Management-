import { Alert, Button, Card, Form, Input, Tabs, Typography } from 'antd'
import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

interface Credentials {
  email: string
  password: string
}

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
    <Form<Credentials> layout="vertical" onFinish={(v) => run(() => login(v.email, v.password))}>
      <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
        <Input autoComplete="username" />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true }]}>
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={busy} block>
        Log in
      </Button>
    </Form>
  )

  const registerForm = (
    <Form<Credentials & { confirm: string }>
      layout="vertical"
      onFinish={(v) => run(() => register(v.email, v.password))}
    >
      <Typography.Paragraph type="secondary">
        Use the work email HR has on record. Manager accounts are created by HR, not here.
      </Typography.Paragraph>
      <Form.Item name="email" label="Work email" rules={[{ required: true, type: 'email' }]}>
        <Input autoComplete="username" />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true, min: 8, max: 72 }]}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        name="confirm"
        label="Confirm password"
        dependencies={['password']}
        rules={[
          { required: true },
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              value === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Passwords differ')),
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={busy} block>
        Create account
      </Button>
    </Form>
  )

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          ACME Salary Management
        </Typography.Title>
        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
        <Tabs
          centered
          onChange={() => setError(null)}
          items={[
            { key: 'login', label: 'Log in', children: loginForm },
            { key: 'register', label: 'Register', children: registerForm },
          ]}
        />
      </Card>
    </div>
  )
}