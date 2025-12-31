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
import { LuFileText, LuCheck } from 'react-icons/lu'
import { usePackingTemplates } from '@/hooks/usePackingQueries'
import type { PackingTemplate } from '@/interfaces/packing.interface'
import { Skeleton } from '@/components/ui/skeleton'

interface PackingTemplateModalProps {
  onApply: (templateId: string) => void
  isLoading?: boolean
}

export default function PackingTemplateModal({ onApply, isLoading }: PackingTemplateModalProps) {
  const t = useTranslations('tripDetail.packing')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const { data: templates, isLoading: isLoadingTemplates } = usePackingTemplates()

  const handleApply = () => {
    if (selectedTemplate) {
      onApply(selectedTemplate)
      setSelectedTemplate(null)
      setOpen(false)
    }
  }

  const getTemplateName = (template: PackingTemplate) => {
    return locale === 'th' ? template.nameTh : template.name
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <LuFileText size={16} />
          <span className="hidden sm:inline">{t('template')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('selectTemplate')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {isLoadingTemplates ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))
          ) : templates?.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => setSelectedTemplate(template.id)}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{getTemplateName(template)}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {template.items.length} {t('items')}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.items.slice(0, 5).map((item, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 px-2 py-0.5 rounded"
                      >
                        {item.name}
                      </span>
                    ))}
                    {template.items.length > 5 && (
                      <span className="text-xs text-gray-500">
                        +{template.items.length - 5} {t('more')}
                      </span>
                    )}
                  </div>
                </div>
                {selectedTemplate === template.id && (
                  <LuCheck className="text-blue-500 flex-shrink-0" size={20} />
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedTemplate || isLoading}
          >
            {isLoading ? t('applying') : t('applyTemplate')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
