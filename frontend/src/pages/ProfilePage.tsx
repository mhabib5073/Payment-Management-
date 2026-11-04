import { Card, Descriptions, Result } from 'antd'
import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { formatMoney } from '../format'

export function ProfilePage() {
  const { me, refresh } = useAuth()

  useEffect(() => {
    refresh() // show the latest data, e.g. after HR changed the salary
  }, [refresh])

  const profile = me?.profile
  if (!profile) {
    return <Result status="info" title="No employee record is linked to this account" />
  }

  return (
    <Card title={`${profile.first_name} ${profile.last_name}`} style={{ maxWidth: 720 }}>
      <Descriptions column={1} bordered>
        <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
        <Descriptions.Item label="Job title">{profile.job_title}</Descriptions.Item>
        <Descriptions.Item label="Department">{profile.department}</Descriptions.Item>
        <Descriptions.Item label="Country">{profile.country}</Descriptions.Item>
        <Descriptions.Item label="Annual salary">{formatMoney(profile.salary, profile.currency)}</Descriptions.Item>
        <Descriptions.Item label="Hire date">{profile.hire_date}</Descriptions.Item>
      </Descriptions>
    </Card>
  )
}