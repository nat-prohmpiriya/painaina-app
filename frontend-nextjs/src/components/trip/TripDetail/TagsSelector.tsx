'use client'

import { Select, Tag } from "antd"
import { useTripContext } from "@/contexts/TripContext"
import { useState } from "react"
import { 
    LuCamera, LuUtensils, LuChurch, LuTrees, LuMountain, 
    LuWaves, LuBuilding2, LuShoppingBag, LuMusic, LuBookOpen,
    LuPalette, LuDollarSign, LuCrown, LuUsers, LuUser,
    LuBackpack, LuSparkles, LuPawPrint, LuCalendarDays, LuMapPin,
    LuGem, LuLibrary, LuTrophy
} from "react-icons/lu"

interface TagsSelectorProps {
    tags: string[]
    disabled?: boolean
}

const TagsSelector = ({ tags, disabled = false }: TagsSelectorProps) => {
    const { tripData, updateTrip } = useTripContext()
    const [isUpdating, setIsUpdating] = useState(false)

    // Common travel tags with icons
    const commonTags = [
        { value: "culture", label: "culture", icon: <LuBookOpen size={14} />, color: "blue" },
        { value: "food", label: "food", icon: <LuUtensils size={14} />, color: "orange" },
        { value: "temples", label: "temples", icon: <LuChurch size={14} />, color: "gold" },
        { value: "nature", label: "nature", icon: <LuTrees size={14} />, color: "green" },
        { value: "adventure", label: "adventure", icon: <LuMountain size={14} />, color: "red" },
        { value: "beach", label: "beach", icon: <LuWaves size={14} />, color: "cyan" },
        { value: "city", label: "city", icon: <LuBuilding2 size={14} />, color: "geekblue" },
        { value: "mountain", label: "mountain", icon: <LuMountain size={14} />, color: "volcano" },
        { value: "shopping", label: "shopping", icon: <LuShoppingBag size={14} />, color: "magenta" },
        { value: "nightlife", label: "nightlife", icon: <LuMusic size={14} />, color: "purple" },
        { value: "history", label: "history", icon: <LuLibrary size={14} />, color: "brown" },
        { value: "art", label: "art", icon: <LuPalette size={14} />, color: "pink" },
        { value: "photography", label: "photography", icon: <LuCamera size={14} />, color: "lime" },
        { value: "budget", label: "budget", icon: <LuDollarSign size={14} />, color: "green" },
        { value: "luxury", label: "luxury", icon: <LuCrown size={14} />, color: "gold" },
        { value: "family", label: "family", icon: <LuUsers size={14} />, color: "blue" },
        { value: "solo", label: "solo", icon: <LuUser size={14} />, color: "gray" },
        { value: "backpacking", label: "backpacking", icon: <LuBackpack size={14} />, color: "orange" },
        { value: "relaxation", label: "relaxation", icon: <LuSparkles size={14} />, color: "cyan" },
        { value: "wildlife", label: "wildlife", icon: <LuPawPrint size={14} />, color: "green" },
        { value: "festivals", label: "festivals", icon: <LuCalendarDays size={14} />, color: "red" },
        { value: "local", label: "local", icon: <LuMapPin size={14} />, color: "volcano" },
        { value: "hidden-gems", label: "hidden-gems", icon: <LuGem size={14} />, color: "purple" },
        { value: "museums", label: "museums", icon: <LuLibrary size={14} />, color: "geekblue" },
        { value: "sports", label: "sports", icon: <LuTrophy size={14} />, color: "orange" }
    ]

    const handleTagsChange = async (newTags: string[]) => {
        if (!tripData) return

        setIsUpdating(true)
        try {
            await updateTrip(tripData.id, { tags: newTags })
        } catch (error) {
            console.error('Failed to update tags:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <Select
            mode="multiple"
            value={tags}
            onChange={handleTagsChange}
            style={{ width: '100%' }}
            disabled={disabled || isUpdating}
            loading={isUpdating}
            placeholder="Select tags"
            maxTagCount="responsive"
            options={commonTags.map(tag => ({
                value: tag.value,
                label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {tag.icon}
                        <span>{tag.label}</span>
                    </div>
                )
            }))}
            tagRender={(props) => {
                const { label, value, closable, onClose } = props
                const tagData = commonTags.find(tag => tag.value === value)
                return (
                    <Tag
                        color={tagData?.color || "blue"}
                        closable={closable}
                        onClose={onClose}
                        style={{ marginRight: 3, display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        {tagData?.icon}
                        <span>{label}</span>
                    </Tag>
                )
            }}
        />
    )
}

export default TagsSelector