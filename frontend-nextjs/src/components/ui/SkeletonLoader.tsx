'use client'

import React from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
)

export const TripBannerSkeleton = () => (
  <div className="relative h-64 bg-gray-100">
    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent">
      <div className="absolute bottom-4 left-4 right-4">
        <Skeleton className="h-8 w-3/4 mb-2 bg-gray-300" />
        <Skeleton className="h-4 w-1/2 bg-gray-300" />
      </div>
    </div>
  </div>
)

export const ItinerarySkeleton = () => (
  <div className="p-4 space-y-6">
    {[1, 2, 3].map(day => (
      <div key={day} className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2].map(entry => (
            <div key={entry} className="flex gap-3 p-3 border rounded">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-1" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
)

export const BudgetSkeleton = () => (
  <div className="p-4">
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    </div>
  </div>
)