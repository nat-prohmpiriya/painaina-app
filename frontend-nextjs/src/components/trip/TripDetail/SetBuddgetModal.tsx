'use client'

import { Modal, Button, Form, InputNumber, Select } from "antd"
import { useState, useEffect } from "react"
import { LuWallet, LuPencil } from "react-icons/lu"
import { useTripContext } from '@/contexts/TripContext'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useUpdateTrip } from '@/hooks/useTripQueries'

interface BudgetFormValues {
	amount: number
	currency: string
}

interface SetBudgetModalProps {
	mode?: 'create' | 'update'
}

const SetBudgetModal = ({ mode = 'create' }: SetBudgetModalProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [form] = Form.useForm()
	const [loading, setLoading] = useState(false)
	const { tripData } = useTripContext()
	const updateTrip = useUpdateTrip()
	const { showSuccess, showError } = useToastMessage()

	// Auto-populate form when modal opens in update mode
	useEffect(() => {
		if (isModalOpen && mode === 'update' && tripData?.budget?.amount) {
			form.setFieldsValue({
				amount: tripData.budget.amount,
				currency: tripData.budget.currency || 'THB'
			})
		}
	}, [isModalOpen, mode, tripData, form])

	const handleSubmit = async (values: BudgetFormValues) => {
		if (!tripData) return

		setLoading(true)
		try {
			await updateTrip.mutateAsync({
				tripId: tripData.id,
				data: {
					budgetTotal: values.amount,
					budgetCurrency: values.currency
				}
			})
			showSuccess(mode === 'create' ? 'Budget set successfully!' : 'Budget updated successfully!')
			setIsModalOpen(false)
			form.resetFields()
		} catch (error) {
			console.error(`Failed to ${mode} budget:`, error)
			showError(`Failed to ${mode} budget`)
		} finally {
			setLoading(false)
		}
	}

	const currencyOptions = [
		{ value: 'THB', label: '฿ Thai Baht' },
		{ value: 'USD', label: '$ US Dollar' },
		{ value: 'EUR', label: '€ Euro' },
		{ value: 'GBP', label: '£ British Pound' },
		{ value: 'JPY', label: '¥ Japanese Yen' },
		{ value: 'SGD', label: 'S$ Singapore Dollar' },
	]

	const buttonText = mode === 'create' ? 'Set Budget' : 'Edit Budget'
	const modalTitle = mode === 'create' ? 'Set Trip Budget' : 'Edit Trip Budget'
	const buttonIcon = mode === 'create' ? <LuWallet /> : <LuPencil />

	return (
		<>
			<Button
				icon={buttonIcon}
				shape='round'
				type={mode === 'create' ? 'primary' : 'default'}
				className='mt-2'
				onClick={() => setIsModalOpen(true)}
				size={mode === 'update' ? 'small' : 'middle'}
			>
				{buttonText}
			</Button>
			<Modal
				title={modalTitle}
				open={isModalOpen}
				onCancel={() => setIsModalOpen(false)}
				footer={null}
				width={500}
			>
				<Form
					form={form}
					layout="vertical"
					onFinish={handleSubmit}
					initialValues={{ currency: 'THB' }}
					className="mt-4"
				>
					<Form.Item
						name="amount"
						label="Budget Amount"
						rules={[
							{ required: true, message: 'Please enter budget amount' },
							{ type: 'number', min: 1, message: 'Amount must be greater than 0' }
						]}
					>
						<InputNumber
							size="large"
							className="w-full"
							placeholder="Enter amount"
							formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
							parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
						/>
					</Form.Item>

					<Form.Item
						name="currency"
						label="Currency"
						rules={[{ required: true, message: 'Please select currency' }]}
					>
						<Select
							size="large"
							placeholder="Select currency"
							options={currencyOptions}
						/>
					</Form.Item>

					<div className="flex gap-2 justify-end mt-6">
						<Button
							onClick={() => setIsModalOpen(false)}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button
							type="primary"
							htmlType="submit"
							loading={loading}
						>
							{mode === 'create' ? 'Set Budget' : 'Update Budget'}
						</Button>
					</div>
				</Form>
			</Modal>
		</>
	)
}

export default SetBudgetModal