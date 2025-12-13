'use client'

import React, { useState } from 'react'
import { Input, Button } from 'antd'
import { IoSearch, IoClose } from 'react-icons/io5'
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
                    <Input
                        placeholder='Keyword, destination, activity...'
                        prefix={<IoSearch className='text-gray-400' />}
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={handleKeyPress}
                        size='large'
                    />
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
                        size='large'
                    />
                </div>

                {/* Action Buttons */}
                <div className='flex items-end gap-2'>
                    <Button
                        type='primary'
                        size='large'
                        icon={<IoSearch />}
                        onClick={handleSearch}
                        className='flex-1'
                    >
                        Search
                    </Button>
                    <Button
                        size='large'
                        icon={<IoClose />}
                        onClick={handleClear}
                    >
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default SearchGuidesForm
