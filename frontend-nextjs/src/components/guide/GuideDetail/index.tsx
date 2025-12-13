
import React from 'react'
import type { TripDetailResponse, ItineraryWithEntries } from '@/interfaces/trip.interface'
import type { Expense } from '@/interfaces/expense.interface'
import HoeroTrip from './HoeroTrip'
import ItinerarySection from './ItinerarySection'
import ExpenseSection from './ExpenseSection'
import CommentSection from './CommentSection';

interface GuideDetailProps {
    guide: TripDetailResponse;
    itinerary: ItineraryWithEntries[] | null;
    expenses: Expense[];
}

const GuideDetail: React.FC<GuideDetailProps> = ({ guide, itinerary, expenses }) => {
    return (
        <div className='overflow-y-auto h-[calc(100vh-64px)] [&::-webkit-scrollbar]:hidden scrollbar-width-none'>
            <HoeroTrip guide={guide} />
            <ItinerarySection itinerary={itinerary} />
            <ExpenseSection expenses={expenses} />
            <CommentSection guideId={guide.id} />
        </div>
    )
}

export default GuideDetail