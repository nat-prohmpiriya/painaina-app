'use client'

import { LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";
import { FaRoute } from "react-icons/fa6";
import { useState, forwardRef, useImperativeHandle } from "react";
import { Tabs } from 'antd'
import AboutTab from './tabs/AboutTab'
import PhotosTab from './tabs/PhotosTab'
import ReviewsTab from './tabs/ReviewsTab'
import { LuInfo, LuCamera, LuStar } from "react-icons/lu";
import { PlaceInfo } from '@/interfaces/itinerary.interface'

export interface MapBottomSheetRef {
    setIsOpen: (open: boolean) => void;
}

interface MapBottomSheetProps {
    selectedPlace?: PlaceInfo
    allPlaces?: PlaceInfo[]
    onClose?: () => void
    onPlaceChange?: (place: PlaceInfo) => void
}

const MapBottomSheet = forwardRef<MapBottomSheetRef, MapBottomSheetProps>((props, ref) => {
    const { selectedPlace, allPlaces = [], onClose, onPlaceChange } = props
    const [isOpen, setIsOpen] = useState(true);

    // Find current place index
    const currentIndex = selectedPlace ? allPlaces.findIndex(p => p.id === selectedPlace.id) : -1;
    const totalPlaces = allPlaces.length;

    // Navigation functions
    const goToPreviousPlace = () => {
        if (currentIndex > 0 && onPlaceChange) {
            onPlaceChange(allPlaces[currentIndex - 1]);
        }
    };

    const goToNextPlace = () => {
        if (currentIndex < totalPlaces - 1 && onPlaceChange) {
            onPlaceChange(allPlaces[currentIndex + 1]);
        }
    };

    useImperativeHandle(ref, () => ({
        setIsOpen: (open: boolean) => setIsOpen(open)
    }));

    const handleClose = () => {
        setIsOpen(false)
        if (onClose) {
            onClose()
        }
    }

    const listTab = [
        {
            key: 'about',
            label: <span className="text-xs font-bold flex items-center"><LuInfo size={16} className="inline-block mr-2" />About</span>,
            children: <AboutTab placeDetails={selectedPlace} />
        },
        {
            key: 'photos',
            label: <span className="text-xs font-bold flex items-center"><LuCamera size={16} className="inline-block mr-2" />Photos</span>,
            children: <PhotosTab placeDetails={selectedPlace} />
        },
        {
            key: 'reviews',
            label: <span className="text-xs font-bold flex items-center"><LuStar size={16} className="inline-block mr-2" />Reviews</span>,
            children: <ReviewsTab placeDetails={selectedPlace} />
        },
    ];

    if (!isOpen) return null;

    return (
        <div className="w-full h-[45vh] animate-in slide-in-from-bottom-4 duration-300">
            {/* Header Controls */}
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                    <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl py-2 px-3 flex items-center space-x-2 hover:bg-white transition-all duration-200">
                        <LuChevronLeft
                            className={`text-lg cursor-pointer transition-colors ${currentIndex > 0 ? 'text-gray-600 hover:text-gray-800' : 'text-gray-300 cursor-not-allowed'
                                }`}
                            onClick={goToPreviousPlace}
                        />
                        <span className="font-semibold text-sm text-gray-700">
                            {currentIndex + 1} of {totalPlaces}
                        </span>
                        <LuChevronRight
                            className={`text-lg cursor-pointer transition-colors ${currentIndex < totalPlaces - 1 ? 'text-gray-600 hover:text-gray-800' : 'text-gray-300 cursor-not-allowed'
                                }`}
                            onClick={goToNextPlace}
                        />
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl py-2 px-3 flex items-center space-x-2 cursor-pointer hover:bg-white transition-all duration-200">
                        <FaRoute className="text-blue-600 text-lg" />
                        <span className="font-semibold text-sm text-gray-700">Optimize route</span>
                        <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-lg text-xs font-bold">PRO</span>
                    </div>
                </div>
                <div className="h-10 w-10 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105">
                    <LuX size={20} onClick={handleClose} className="text-gray-600" />
                </div>
            </div>

            {/* Main Content Card */}
            <div className="bg-white/90 backdrop-blur-sm shadow-xl rounded-3xl flex flex-col h-full">
                {/* Place Header - Left aligned title */}
                {selectedPlace && (
                    <div className="p-2">
                        <h2 className="text-lg ml-2 -mb-3 font-bold text-gray-800 text-left">
                            {selectedPlace?.name}
                        </h2>
                    </div>
                )}

                {/* Tabs */}
                <div className="px-3">
                    <Tabs
                        items={listTab}
                        defaultActiveKey="about"
                        className="h-full"
                    />
                </div>
            </div>
        </div>
    )
})

MapBottomSheet.displayName = 'MapBottomSheet'

export default MapBottomSheet