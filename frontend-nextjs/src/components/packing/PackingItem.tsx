'use client'

import { useState, useRef, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { LuGripVertical } from 'react-icons/lu'
import { FiTrash2, FiEdit2 } from 'react-icons/fi'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { PackingItem as PackingItemType, PackingCategory } from '@/interfaces/packing.interface'
import { PACKING_CATEGORY_CONFIG } from '@/interfaces/packing.interface'
import { useLocale } from 'next-intl'

interface PackingItemProps {
  item: PackingItemType
  onToggle: (itemId: string) => void
  onDelete: (itemId: string) => void
  onUpdate: (itemId: string, data: { name?: string; quantity?: number }) => void
  isEditable?: boolean
}

export default function PackingItem({
  item,
  onToggle,
  onDelete,
  onUpdate,
  isEditable = true,
}: PackingItemProps) {
  const locale = useLocale()
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editQuantity, setEditQuantity] = useState(item.quantity)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const categoryConfig = PACKING_CATEGORY_CONFIG[item.category as PackingCategory]

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (editName.trim() && (editName !== item.name || editQuantity !== item.quantity)) {
      onUpdate(item.id, {
        name: editName.trim(),
        quantity: editQuantity,
      })
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setEditName(item.name)
      setEditQuantity(item.quantity)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-lg group transition-all ${
        isDragging ? 'opacity-50 bg-blue-50' : 'hover:bg-gray-50'
      } ${item.packed ? 'opacity-60' : ''}`}
      data-testid={`packing-item-${item.id}`}
    >
      {/* Drag handle */}
      {isEditable && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-60 transition-opacity p-1 hover:bg-gray-200 rounded touch-none"
          data-testid={`packing-item-drag-${item.id}`}
        >
          <LuGripVertical size={16} className="text-gray-400" />
        </div>
      )}

      {/* Checkbox */}
      <Checkbox
        checked={item.packed}
        onCheckedChange={() => onToggle(item.id)}
        disabled={!isEditable}
        className="flex-shrink-0"
        data-testid={`packing-item-checkbox-${item.id}`}
      />

      {/* Category icon */}
      <span className="text-lg flex-shrink-0" title={locale === 'th' ? categoryConfig?.labelTh : categoryConfig?.labelEn} data-testid={`packing-item-icon-${item.id}`}>
        {categoryConfig?.icon || '📦'}
      </span>

      {/* Item name and quantity */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2" data-testid={`packing-item-edit-form-${item.id}`}>
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid={`packing-item-edit-name-${item.id}`}
            />
            <input
              type="number"
              min={1}
              max={999}
              value={editQuantity}
              onChange={(e) => setEditQuantity(Number(e.target.value))}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="w-16 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid={`packing-item-edit-quantity-${item.id}`}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`truncate ${item.packed ? 'line-through text-gray-400' : ''}`} data-testid={`packing-item-name-${item.id}`}>
              {item.name}
            </span>
            {item.quantity > 1 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded" data-testid={`packing-item-quantity-${item.id}`}>
                x{item.quantity}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {isEditable && !isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`packing-item-actions-${item.id}`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 w-7 p-0"
            data-testid={`packing-item-edit-btn-${item.id}`}
          >
            <FiEdit2 size={14} className="text-gray-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(item.id)}
            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            data-testid={`packing-item-delete-btn-${item.id}`}
          >
            <FiTrash2 size={14} />
          </Button>
        </div>
      )}
    </div>
  )
}
