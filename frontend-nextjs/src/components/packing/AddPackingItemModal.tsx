'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LuPlus } from 'react-icons/lu'
import type { PackingCategory, CreatePackingItemRequest } from '@/interfaces/packing.interface'
import { PACKING_CATEGORY_CONFIG } from '@/interfaces/packing.interface'

interface AddPackingItemModalProps {
  onAdd: (data: CreatePackingItemRequest) => void
  isLoading?: boolean
}

const CATEGORIES: PackingCategory[] = [
  'clothing',
  'toiletries',
  'electronics',
  'documents',
  'medicine',
  'accessories',
  'food',
  'other',
]

export default function AddPackingItemModal({ onAdd, isLoading }: AddPackingItemModalProps) {
  const t = useTranslations('tripDetail.packing')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<PackingCategory>('other')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onAdd({
      name: name.trim(),
      category,
      quantity,
      notes: notes.trim() || undefined,
    })

    // Reset form
    setName('')
    setCategory('other')
    setQuantity(1)
    setNotes('')
    setOpen(false)
  }

  const getCategoryLabel = (cat: PackingCategory) => {
    const config = PACKING_CATEGORY_CONFIG[cat]
    return locale === 'th' ? config.labelTh : config.labelEn
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1">
          <LuPlus size={16} />
          <span className="hidden sm:inline">{t('addItem')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addItemTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('itemName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('itemNamePlaceholder')}
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t('category')}</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const config = PACKING_CATEGORY_CONFIG[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                      category === cat
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-xs mt-1 text-center leading-tight">
                      {getCategoryLabel(cat)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="quantity">{t('quantity')}</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={999}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-24"
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')} ({t('optional')})</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              rows={2}
            />
          </div>

          {/* Submit button */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? t('adding') : t('add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
