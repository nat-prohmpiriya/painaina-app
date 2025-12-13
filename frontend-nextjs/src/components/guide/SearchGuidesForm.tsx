'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import type { SearchGuidesQuery } from '@/services/guide.service'

interface SearchGuidesFormProps {
    initialQuery?: SearchGuidesQuery
    onSearch: (query: SearchGuidesQuery) => void
    onClear?: () => void
}

const SearchGuidesForm: React.FC<SearchGuidesFormProps> = ({
    initialQuery = {},
    onSearch,
    onClear
}) => {
    const [keyword, setKeyword] = useState(initialQuery.q || '')
    const [tags, setTags] = useState(initialQuery.tags || '')

    const handleSearch = () => {
        const query: SearchGuidesQuery = {}

        if (keyword.trim()) query.q = keyword.trim()
        if (tags.trim()) query.tags = tags.trim()

        onSearch(query)
    }

    const handleClear = () => {
        setKeyword('')
        setTags('')
        onClear?.()
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    return (
        <div className='bg-white p-4 rounded-xl shadow-md w-full'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                {/* Keyword Search */}
                <div className='flex flex-col'>
                    <label className='text-sm font-medium text-gray-700 mb-1'>
                        Search
                    </label>
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                        <Input
                            placeholder='Keyword, destination, activity...'
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className='pl-9 h-10'
                        />
                    </div>
                </div>

                {/* Tags */}
                <div className='flex flex-col'>
                    <label className='text-sm font-medium text-gray-700 mb-1'>
                        Tags
                    </label>
                    <Input
                        placeholder='e.g., beach, adventure, food'
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className='h-10'
                    />
                </div>

                {/* Action Buttons */}
                <div className='flex items-end gap-2'>
                    <Button
                        onClick={handleSearch}
                        className='flex-1 h-10'
                    >
                        <Search className="h-4 w-4 mr-2" />
                        Search
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleClear}
                        className='h-10'
                    >
                        <X className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default SearchGuidesForm
