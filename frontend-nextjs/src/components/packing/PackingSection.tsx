'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { LuPackage } from 'react-icons/lu'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'

import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import PackingItem from './PackingItem'
import AddPackingItemModal from './AddPackingItemModal'
import PackingTemplateModal from './PackingTemplateModal'
import {
  usePackingList,
  useAddPackingItem,
  useUpdatePackingItem,
  useDeletePackingItem,
  useTogglePackingItem,
  useReorderPackingItems,
  useApplyPackingTemplate,
} from '@/hooks/usePackingQueries'
import type { PackingItem as PackingItemType, PackingCategory } from '@/interfaces/packing.interface'
import { PACKING_CATEGORY_CONFIG } from '@/interfaces/packing.interface'
import { useToastMessage } from '@/contexts/ToastMessageContext'

interface PackingSectionProps {
  tripId: string
  isEditable?: boolean
}

// Group items by category
function groupItemsByCategory(items: PackingItemType[]): Record<PackingCategory, PackingItemType[]> {
  const groups: Record<PackingCategory, PackingItemType[]> = {
    clothing: [],
    toiletries: [],
    electronics: [],
    documents: [],
    medicine: [],
    accessories: [],
    food: [],
    other: [],
  }

  for (const item of items) {
    const category = item.category as PackingCategory
    if (groups[category]) {
      groups[category].push(item)
    } else {
      groups.other.push(item)
    }
  }

  // Sort items within each category by order
  for (const category of Object.keys(groups) as PackingCategory[]) {
    groups[category].sort((a, b) => a.order - b.order)
  }

  return groups
}

export default function PackingSection({ tripId, isEditable = true }: PackingSectionProps) {
  const t = useTranslations('tripDetail.packing')
  const locale = useLocale()
  const { showSuccess, showError } = useToastMessage()

  // Queries
  const { data: packingList, isLoading } = usePackingList(tripId)

  // Mutations
  const addItem = useAddPackingItem(tripId)
  const updateItem = useUpdatePackingItem(tripId)
  const deleteItem = useDeletePackingItem(tripId)
  const toggleItem = useTogglePackingItem(tripId)
  const reorderItems = useReorderPackingItems(tripId)
  const applyTemplate = useApplyPackingTemplate(tripId)

  // DnD sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Group items by category
  const groupedItems = useMemo(() => {
    if (!packingList?.items) return null
    return groupItemsByCategory(packingList.items)
  }, [packingList?.items])

  // Calculate stats
  const stats = useMemo(() => {
    if (!packingList?.items) return { total: 0, packed: 0, percentage: 0 }
    const total = packingList.items.length
    const packed = packingList.items.filter((item) => item.packed).length
    const percentage = total > 0 ? Math.round((packed / total) * 100) : 0
    return { total, packed, percentage }
  }, [packingList?.items])

  // Handlers
  const handleAddItem = async (data: Parameters<typeof addItem.mutateAsync>[0]) => {
    try {
      await addItem.mutateAsync(data)
      showSuccess(t('itemAdded'))
    } catch {
      showError(t('addItemError'))
    }
  }

  const handleToggle = async (itemId: string) => {
    try {
      await toggleItem.mutateAsync(itemId)
    } catch {
      showError(t('toggleError'))
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem.mutateAsync(itemId)
      showSuccess(t('itemDeleted'))
    } catch {
      showError(t('deleteError'))
    }
  }

  const handleUpdate = async (itemId: string, data: { name?: string; quantity?: number }) => {
    try {
      await updateItem.mutateAsync({ itemId, data })
    } catch {
      showError(t('updateError'))
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    try {
      await applyTemplate.mutateAsync({ templateId })
      showSuccess(t('templateApplied'))
    } catch {
      showError(t('templateError'))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !packingList?.items) return

    const oldIndex = packingList.items.findIndex((item) => item.id === active.id)
    const newIndex = packingList.items.findIndex((item) => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(packingList.items, oldIndex, newIndex)
      try {
        await reorderItems.mutateAsync({ itemIds: newItems.map((item) => item.id) })
      } catch {
        showError(t('reorderError'))
      }
    }
  }

  const getCategoryLabel = (category: PackingCategory) => {
    const config = PACKING_CATEGORY_CONFIG[category]
    return locale === 'th' ? config.labelTh : config.labelEn
  }

  const getCategoryStats = (category: PackingCategory) => {
    const items = groupedItems?.[category] || []
    const packed = items.filter((item) => item.packed).length
    return `${packed}/${items.length}`
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-9 w-20" />
        </div>
        <Skeleton className="h-2 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <LuPackage className="text-gray-600" size={20} />
            <h3 className="font-semibold text-lg">{t('title')}</h3>
          </div>
          {isEditable && (
            <div className="flex items-center gap-2">
              <PackingTemplateModal
                onApply={handleApplyTemplate}
                isLoading={applyTemplate.isPending}
              />
              <AddPackingItemModal onAdd={handleAddItem} isLoading={addItem.isPending} />
            </div>
          )}
        </div>

        {/* Progress bar */}
        {stats.total > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {stats.packed}/{stats.total} {t('itemsPacked')}
              </span>
              <span>{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2" />
          </div>
        )}
      </div>

      {/* Items list grouped by category */}
      <div className="p-4">
        {stats.total === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <LuPackage className="mx-auto mb-2" size={40} />
            <p>{t('emptyList')}</p>
            <p className="text-sm mt-1">{t('emptyListHint')}</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <div className="space-y-4">
              {(Object.keys(groupedItems || {}) as PackingCategory[])
                .filter((category) => (groupedItems?.[category]?.length || 0) > 0)
                .map((category) => {
                  const items = groupedItems?.[category] || []
                  const config = PACKING_CATEGORY_CONFIG[category]

                  return (
                    <div key={category} className="space-y-1">
                      {/* Category header */}
                      <div className="flex items-center justify-between py-2 px-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{config.icon}</span>
                          <span className="font-medium text-sm">
                            {getCategoryLabel(category)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {getCategoryStats(category)}
                        </span>
                      </div>

                      {/* Items */}
                      <SortableContext
                        items={items.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="pl-2">
                          {items.map((item) => (
                            <PackingItem
                              key={item.id}
                              item={item}
                              onToggle={handleToggle}
                              onDelete={handleDelete}
                              onUpdate={handleUpdate}
                              isEditable={isEditable}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </div>
                  )
                })}
            </div>
          </DndContext>
        )}
      </div>
    </div>
  )
}
