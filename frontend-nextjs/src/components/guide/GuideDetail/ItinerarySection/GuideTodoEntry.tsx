'use client'

import { LuCircle, LuListTodo } from "react-icons/lu";
import { ItineraryEntry } from "@/interfaces/trip.interface";

export interface GuideTodoEntryProps {
    entry: ItineraryEntry;
}

const GuideTodoEntry = ({ entry }: GuideTodoEntryProps) => {
    return (
        <div className="p-4 rounded-xl hover:bg-gray-100 ">
            <div className="flex items-center gap-4 mb-2">
                <LuListTodo size={24} className="font-semibold" />
                <h3 className="text-lg font-semibold">{entry.title}</h3>
            </div>
            {
                entry.todos?.map((todo, index) => (
                    <p key={index} className="flex items-center gap-2">
                        <LuCircle />
                        <span className="ml-2">{todo.title}</span>
                    </p>
                ))
            }
        </div>
    )
}

export default GuideTodoEntry