'use client'

import { useState, useEffect } from "react"
import { LuWallet, LuPencil } from "react-icons/lu"
import { useTripContext } from '@/contexts/TripContext'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useUpdateTrip } from '@/hooks/useTripQueries'
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface BudgetFormValues {
	amount: string
	currency: string
}

interface SetBudgetModalProps {
	mode?: 'create' | 'update'
}

const SetBudgetModal = ({ mode = 'create' }: SetBudgetModalProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [formData, setFormData] = useState<BudgetFormValues>({
		amount: '',
		currency: 'THB'
	})
	const [loading, setLoading] = useState(false)
	const { tripData } = useTripContext()
	const updateTrip = useUpdateTrip()
	const { showSuccess, showError } = useToastMessage()

	// Auto-populate form when modal opens in update mode
	useEffect(() => {
		if (isModalOpen && mode === 'update' && tripData?.budget?.amount) {
			setFormData({
				amount: tripData.budget.amount.toString(),
				currency: tripData.budget.currency || 'THB'
			})
		}
	}, [isModalOpen, mode, tripData])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!tripData) return

		const amount = parseFloat(formData.amount)
		if (isNaN(amount) || amount <= 0) {
			showError('Please enter a valid amount greater than 0')
			return
		}

		setLoading(true)
		try {
			await updateTrip.mutateAsync({
				tripId: tripData.id,
				data: {
					budgetTotal: amount,
					budgetCurrency: formData.currency
				}
			})
			showSuccess(mode === 'create' ? 'Budget set successfully!' : 'Budget updated successfully!')
			setIsModalOpen(false)
			setFormData({ amount: '', currency: 'THB' })
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

	const formatNumber = (value: string) => {
		const num = value.replace(/\D/g, '')
		return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
	}

	const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/,/g, '')
		if (value === '' || /^\d*\.?\d*$/.test(value)) {
			setFormData({ ...formData, amount: value })
		}
	}

	return (
		<>
			<Button
				variant={mode === 'create' ? 'default' : 'outline'}
				size={mode === 'update' ? 'sm' : 'default'}
				className={mode === 'create' ? 'rounded-full mt-2' : 'rounded-full'}
				onClick={() => setIsModalOpen(true)}
			>
				{buttonIcon}
				{buttonText}
			</Button>

			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>{modalTitle}</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSubmit} className="space-y-6 mt-4">
						<div className="space-y-2">
							<Label htmlFor="amount">
								Budget Amount <span className="text-red-500">*</span>
							</Label>
							<Input
								id="amount"
								type="text"
								value={formatNumber(formData.amount)}
								onChange={handleAmountChange}
								placeholder="Enter amount"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="currency">
								Currency <span className="text-red-500">*</span>
							</Label>
							<Select
								value={formData.currency}
								onValueChange={(value) => setFormData({ ...formData, currency: value })}
							>
								<SelectTrigger id="currency">
									<SelectValue placeholder="Select currency" />
								</SelectTrigger>
								<SelectContent>
									{currencyOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<DialogFooter className="gap-2 sm:gap-0">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsModalOpen(false)}
								disabled={loading}
							>
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={loading}
							>
								{loading ? 'Saving...' : (mode === 'create' ? 'Set Budget' : 'Update Budget')}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	)
}

export default SetBudgetModal
