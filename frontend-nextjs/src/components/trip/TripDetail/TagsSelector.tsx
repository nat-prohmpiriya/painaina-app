'use client'

import { useTripContext } from "@/contexts/TripContext"
import { useState } from "react"
import {
    LuCamera, LuUtensils, LuChurch, LuTrees, LuMountain,
    LuWaves, LuBuilding2, LuShoppingBag, LuMusic, LuBookOpen,
    LuPalette, LuDollarSign, LuCrown, LuUsers, LuUser,
    LuBackpack, LuSparkles, LuPawPrint, LuCalendarDays, LuMapPin,
    LuGem, LuLibrary, LuTrophy, LuCheck, LuX
} from "react-icons/lu"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TagsSelectorProps {
    tags: string[]
    disabled?: boolean
}

const TagsSelector = ({ tags, disabled = false }: TagsSelectorProps) => {
    const { tripData, updateTrip } = useTripContext()
    const [isUpdating, setIsUpdating] = useState(false)
    const [open, setOpen] = useState(false)

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

    const toggleTag = async (tagValue: string) => {
        if (!tripData) return

        const newTags = tags.includes(tagValue)
            ? tags.filter(t => t !== tagValue)
            : [...tags, tagValue]

        setIsUpdating(true)
        try {
            await updateTrip(tripData.id, { tags: newTags })
        } catch (error) {
            console.error('Failed to update tags:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    const removeTag = async (tagValue: string) => {
        if (!tripData) return

        const newTags = tags.filter(t => t !== tagValue)
        setIsUpdating(true)
        try {
            await updateTrip(tripData.id, { tags: newTags })
        } catch (error) {
            console.error('Failed to update tags:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    const getTagColor = (colorName: string) => {
        const colorMap: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
            orange: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
            gold: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
            green: 'bg-green-100 text-green-700 hover:bg-green-200',
            red: 'bg-red-100 text-red-700 hover:bg-red-200',
            cyan: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200',
            geekblue: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
            volcano: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
            magenta: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
            purple: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
            brown: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
            pink: 'bg-pink-100 text-pink-700 hover:bg-pink-200',
            lime: 'bg-lime-100 text-lime-700 hover:bg-lime-200',
            gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        }
        return colorMap[colorName] || colorMap.blue
    }

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tagValue => {
                    const tagData = commonTags.find(t => t.value === tagValue)
                    if (!tagData) return null
                    return (
                        <Badge
                            key={tagValue}
                            variant="secondary"
                            className={`${getTagColor(tagData.color)} flex items-center gap-1`}
                        >
                            {tagData.icon}
                            <span>{tagData.label}</span>
                            <button
                                onClick={() => removeTag(tagValue)}
                                disabled={disabled || isUpdating}
                                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                            >
                                <LuX size={12} />
                            </button>
                        </Badge>
                    )
                })}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-muted-foreground"
                        disabled={disabled || isUpdating}
                    >
                        {isUpdating ? 'Updating...' : 'Select tags'}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search tags..." />
                        <CommandList>
                            <CommandEmpty>No tags found.</CommandEmpty>
                            <CommandGroup>
                                {commonTags.map(tag => (
                                    <CommandItem
                                        key={tag.value}
                                        onSelect={() => toggleTag(tag.value)}
                                        className="flex items-center gap-2"
                                    >
                                        <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                            tags.includes(tag.value) ? 'bg-primary border-primary text-primary-foreground' : 'border-gray-300'
                                        }`}>
                                            {tags.includes(tag.value) && <LuCheck size={12} />}
                                        </div>
                                        {tag.icon}
                                        <span>{tag.label}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}

export default TagsSelector