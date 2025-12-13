'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTripContext } from "@/contexts/TripContext"
import { useState } from "react"

type Level = "Easy" | "Moderate" | "Hard" | "Expert"

interface LevelSelectorProps {
    level: Level
    disabled?: boolean
}

const LevelSelector = ({ level, disabled = false }: LevelSelectorProps) => {
    const { tripData, updateTrip } = useTripContext()
    const [isUpdating, setIsUpdating] = useState(false)

    const levelOptions = [
        { value: "Easy", label: "🟢 Easy", color: "#52c41a" },
        { value: "Moderate", label: "🟡 Moderate", color: "#faad14" },
        { value: "Hard", label: "🟠 Hard", color: "#fa8c16" },
        { value: "Expert", label: "🔴 Expert", color: "#f5222d" }
    ]

    const handleLevelChange = async (newLevel: Level) => {
        if (!tripData || newLevel === level) return

        setIsUpdating(true)
        try {
            await updateTrip(tripData.id, { level: newLevel })
        } catch (error) {
            console.error('Failed to update level:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <Select
            value={level}
            onValueChange={handleLevelChange}
            disabled={disabled || isUpdating}
        >
            <SelectTrigger className="w-full">
                <SelectValue placeholder={isUpdating ? "Updating..." : "Select Level"} />
            </SelectTrigger>
            <SelectContent>
                {levelOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

export default LevelSelector