'use client'

import { Button, Popover, TimePicker } from "antd";
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
        <Popover 
            content={
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <TimePicker
                            value={localStartTime ? dayjs(localStartTime, format) : null}
                            format={format}
                            onChange={(time, timeString) => setLocalStartTime(Array.isArray(timeString) ? timeString[0] : timeString)}
                            placeholder="Start time"
                        />
                        <span>-</span>
                        <TimePicker
                            value={localEndTime ? dayjs(localEndTime, format) : null}
                            format={format}
                            onChange={(time, timeString) => setLocalEndTime(Array.isArray(timeString) ? timeString[0] : timeString)}
                            placeholder="End time"
                        />
                    </div>

                    <div className="flex gap-2 p-2">
                        <Button type="default" shape="round" className="w-full" onClick={handleClear}>
                            Clear
                        </Button>
                        <Button 
                            type="primary" 
                            shape="round" 
                            className="w-full" 
                            onClick={handleSave}
                            disabled={!localStartTime || !localEndTime}
                        >
                            Save
                        </Button>
                    </div>
                </div>
            }
            trigger="click"
            placement="bottom"
            open={isOpen}
            onOpenChange={setIsOpen}
        >
            <Button 
                icon={<LuClock9 />} 
                shape="round" 
                size="small" 
                type={hasTime ? "default" : "primary"}
                className={hasTime ? "bg-green-50 border-green-200 text-green-700" : ""}
            >
                <span className="font-bold text-xs">{displayText}</span>
            </Button>
        </Popover>
    )
}

export default AddTimePlace