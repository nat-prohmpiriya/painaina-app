'use client'

import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { TimePicker } from '@/components/ui/time-picker'
import { LuClock9 } from "react-icons/lu";
import dayjs from 'dayjs';
import { useState } from "react";

const format = 'HH:mm';

interface AddTimePlaceProps {
    startTime?: string
    endTime?: string
    onTimeUpdate?: (startTime: string, endTime: string) => void
}

const AddTimePlace = ({ startTime, endTime, onTimeUpdate }: AddTimePlaceProps) => {
    const [localStartTime, setLocalStartTime] = useState(startTime || '');
    const [localEndTime, setLocalEndTime] = useState(endTime || '');
    const [isOpen, setIsOpen] = useState(false);

    const handleSave = () => {
        if (localStartTime && localEndTime && onTimeUpdate) {
            onTimeUpdate(localStartTime, localEndTime);
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        setLocalStartTime('');
        setLocalEndTime('');
        if (onTimeUpdate) {
            onTimeUpdate('', '');
        }
        setIsOpen(false);
    };

    const hasTime = startTime && endTime;
    const displayText = hasTime ? `${startTime}-${endTime}` : 'Add Time';
    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={hasTime ? "outline" : "default"}
                    size="sm"
                    className={`rounded-full h-7 px-2.5 ${hasTime ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-700" : ""}`}
                >
                    <LuClock9 className="size-3.5" />
                    <span className="font-bold text-xs">{displayText}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-4" align="start" sideOffset={4} collisionPadding={16}>
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <TimePicker
                            value={localStartTime}
                            onChange={(value) => setLocalStartTime(value)}
                            placeholder="Start time"
                            className="flex-1"
                        />
                        <span className="text-muted-foreground">-</span>
                        <TimePicker
                            value={localEndTime}
                            onChange={(value) => setLocalEndTime(value)}
                            placeholder="End time"
                            className="flex-1"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={handleClear}>
                            Clear
                        </Button>
                        <Button
                            variant="default"
                            className="flex-1"
                            onClick={handleSave}
                            disabled={!localStartTime || !localEndTime}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export default AddTimePlace