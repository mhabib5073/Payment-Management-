import { AutoComplete, DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect } from 'react'
import type { Employee, EmployeeInput, Meta } from '../api'


interface FormValues extends Omit<EmployeeInput, 'hire_date'> {
  hire_date: Dayjs
}
interface Props {
  open: boolean
  employee: Employee | null // null = create
  meta: Meta
  saving: boolean
  onCancel: () => void
  onSubmit: (values: EmployeeInput) => void
}
export function EmployeeFormModal({ open, employee, meta, saving, onCancel, onSubmit }: Props) {
  const [form] = Form.useForm<FormValues>()
  const country = Form.useWatch('country', form)

  useEffect(() => {
    if (!open) return
    if (employee) form.setFieldsValue({ ...employee, hire_date: dayjs(employee.hire_date) })
    else form.resetFields()
  }, [open, employee, form])

  const submit = (values: FormValues) => onSubmit({ ...values, hire_date: values.hire_date.format('YYYY-MM-DD') })

  return (
    <Modal
      title={employee ? 'Edit employee' : 'Add employee'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={saving}
      okText="Save"
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item name="first_name" label="First name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="last_name" label="Last name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="job_title" label="Job title" rules={[{ required: true }]}>
          <AutoComplete options={meta.job_titles.map((t) => ({ value: t }))} filterOption />
        </Form.Item>
        <Form.Item name="department" label="Department" rules={[{ required: true }]}>
          <Select options={meta.departments.map((d) => ({ value: d }))} />
        </Form.Item>
        <Form.Item name="country" label="Country" rules={[{ required: true }]}>
          <Select options={Object.keys(meta.countries).map((c) => ({ value: c }))} />
        </Form.Item>
        <Form.Item name="salary" label="Annual salary" rules={[{ required: true }]}>
          <InputNumber<number>
            min={1}
            style={{ width: '100%' }}
            addonAfter={country ? meta.countries[country] : 'currency'}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(v) => Number(v?.replace(/,/g, ''))}
          />
        </Form.Item>
        <Form.Item name="hire_date" label="Hire date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs())} />
        </Form.Item>
      </Form>
    </Modal>
  )
}