'use client'

import { useRouter } from "next/navigation"
import { LuMapPin, LuCalendar, LuUsers, LuHeart } from "react-icons/lu"
import { format } from "date-fns"
import { TripDetailResponse } from "@/interfaces/trip.interface"
import { useAuth } from "@/hooks/useAuth"

interface TripCardProps {
  trip: TripDetailResponse
  isClickable?: boolean
}

export function TripCard({ trip, isClickable = true }: TripCardProps) {
  const router = useRouter()
  const { user } = useAuth()

  const handleImageClick = () => {
    if (isClickable) {
      router.push(`/trips/${trip.id}`)
    }
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start.getTime() === end.getTime()) {
      return format(start, "MMM dd, yyyy")
    }

    return `${format(start, "MMM dd")} - ${format(end, "MMM dd, yyyy")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700'
      case 'draft':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Easy':
        return 'bg-blue-100 text-blue-700'
      case 'Medium':
        return 'bg-orange-100 text-orange-700'
      case 'Hard':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getRoleTrips = trip.tripMembers.find(member => member.userId === user?.id)?.role

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col ${!isClickable ? 'relative' : ''}`}>
      {/* Non-clickable overlay */}
      {!isClickable && (
        <div className="absolute inset-0 bg-gray-900 bg-opacity-5 z-10 cursor-not-allowed" />
      )}

      {/* Image Section */}
      <div
        className={`relative h-48 bg-gray-200 ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'} overflow-hidden group`}
        onClick={handleImageClick}
      >
        {trip.coverPhoto ? (
          <img
            src={trip.coverPhoto}
            alt={trip.destinations.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 transition-colors duration-300">
            <LuMapPin className="w-16 h-16 text-blue-400" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
            {trip.status}
          </span>
        </div>

        {/* Level Badge */}
        {trip.level && (
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(trip.level)}`}>
              {trip.level}
            </span>
          </div>
        )}

        {/* User Role Badge */}
        {trip.tripMembers && (
          <div className="absolute bottom-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleTrips === 'owner'
              ? 'bg-purple-100 text-purple-700'
              : getRoleTrips === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
            >
              {getRoleTrips}
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
          {trip.title}
        </h3>

        {/* Destination */}
        <div className="flex items-start gap-2 mb-3">
          <LuMapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 line-clamp-1">{trip.destinations.name}</p>
            <p className="text-xs text-gray-500 line-clamp-1">
              {trip.destinations.address || trip.destinations.country}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
          {trip.description}
        </p>

        {/* Date */}
        <div className="flex items-center gap-2 mb-3">
          <LuCalendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {formatDateRange(trip.startDate, trip.endDate)}
          </span>
        </div>

        {/* Footer Stats - Push to bottom */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-4">
            {trip.tripMembers && (
              <div className="flex items-center gap-1">
                <LuUsers className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{trip.tripMembers.length} members</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TripCard