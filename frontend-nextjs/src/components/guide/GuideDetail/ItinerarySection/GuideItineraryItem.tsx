'use client'

import React from 'react'
import { LuChevronRight } from "react-icons/lu";
import GuidePlaceEntry from './GuidePlaceEntry';
import GuideNoteEntry from './GuideNoteEntry';
import GuideTodoEntry from './GuideTodoEntry';
import { ItineraryWithEntries } from '@/interfaces/trip.interface';

interface GuideItineraryItemProps {
    day: ItineraryWithEntries
}

const GuideItineraryItem = ({ day }: GuideItineraryItemProps) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const placesFiltered = day.entries?.filter((entry) => entry.type === 'place')
    const numberOfPlaces = placesFiltered ? placesFiltered.length : 0
    let placeIndex = 0
    return (
        <div className='space-y-4 p-4'>
            <div className='border-b pb-2 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <LuChevronRight
                        className={`inline ${!isCollapsed ? 'rotate-90' : ''} transition-transform duration-300 cursor-pointer font-bold text-2xl`}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    />
                    <h3 className='text-xl font-semibold'>
                        {day.title || formatDate(day.date)}
                    </h3>
                    <span className='text-sm text-gray-500'>
                        {numberOfPlaces} {numberOfPlaces === 1 ? 'place' : 'places'}
                    </span>
                </div>
                <div>
                    <button
                        className='text-sm text-blue-600 font-semibold'
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? 'Show more' : 'Show less'}
                    </button>
                </div>
            </div>

            <div
                className={`transition-all duration-500 ease-in-out overflow-hidden ${isCollapsed
                    ? 'max-h-0 opacity-0'
                    : 'opacity-100'
                    }`}
            >
                {day?.entries?.map((entry) => (
                    <React.Fragment key={entry.id}>
                        {entry.type === 'place' && <GuidePlaceEntry entry={entry} placeName={++placeIndex} />}
                        {entry.type === 'note' && <GuideNoteEntry entry={entry} />}
                        {entry.type === 'todos' && <GuideTodoEntry entry={entry} />}
                    </React.Fragment>
                ))}

                {(!day.entries || day.entries.length === 0) && (
                    <div className="p-4 text-center text-gray-500">
                        No activities planned for this day.
                    </div>
                )}
            </div>
        </div>
    )
}

export default GuideItineraryItem