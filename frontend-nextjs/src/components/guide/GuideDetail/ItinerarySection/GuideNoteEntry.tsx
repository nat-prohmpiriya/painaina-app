
import { LuStickyNote } from "react-icons/lu";
import { ItineraryEntry } from "@/interfaces/trip.interface";

export interface GuideNoteEntryProps {
    entry: ItineraryEntry;
}

const GuideNoteEntry = ({ entry }: GuideNoteEntryProps) => {
    return (
        <div className="p-4 rounded-xl hover:bg-gray-100 ">
            <div className="flex items-center gap-4 mb-2">
                <LuStickyNote size={24} className="font-semibold" />
                <h3 className="text-lg font-semibold">{entry.title}</h3>
            </div>
            <p className="mt-2">{entry.description}</p>
        </div>
    )
}

export default GuideNoteEntry