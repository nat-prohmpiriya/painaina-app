'use client';

import { Button } from '@/components/ui/button'
import { useState } from 'react';
import { Bed, Plane, Car, Bus, Ticket, UtensilsCrossed, Train } from 'lucide-react';
import FlightSearch from './FlightSearch';
import StaySearch from './StaySearch';
import CarRentalSearch from './CarRentalSearch';
import BusRentalSearch from './BusRentalSearch';
import EventSearch from './EventSearch';
import RestaurantsSearch from './RestaurantsSearch';
import TrainsSearch from './TrainsSearch';


const BookingForm = () => {

    const [currentTab, setCurrentTab] = useState('Stays');

    const listButton = [
        { label: 'Stays', icon: <Bed size={20} /> },
        { label: 'Flights', icon: <Plane size={20} /> },
        // { label: 'Car', icon: <Car size={20} /> },
        // { label: 'Buses', icon: <Bus size={20} /> },
        // { label: 'Trains', icon: <Train size={20} /> },
        { label: 'Event', icon: <Ticket size={20} /> },
        // { label: 'Restaurants', icon: <UtensilsCrossed size={20} /> },
    ]
    return (
        <div className='w-full'>
            <div className='w-full'>
                <h3 className='text-2xl font-bold'>Book your <span className='text-red-500'>{currentTab}</span></h3>
            </div>
            <div className='w-full flex flex-wrap mt-4 justify-start gap-2'>
                {
                    listButton.map((item, index) => (
                        <Button
                            size='lg'
                            variant={item.label === currentTab ? 'default' : 'outline'}
                            key={index}
                            className={`rounded-full ${currentTab === item.label
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white'
                                }`}
                            onClick={() => setCurrentTab(item.label)}
                        >
                            {item.icon}
                        </Button>
                    ))
                }
            </div>
            <div className='w-full mt-4'>
                {currentTab === 'Flights' && <FlightSearch />}
                {currentTab === 'Stays' && <StaySearch />}
                {currentTab === 'Car' && <CarRentalSearch />}
                {currentTab === 'Buses' && <BusRentalSearch />}
                {currentTab === 'Event' && <EventSearch />}
                {currentTab === 'Trains' && <TrainsSearch />}
                {currentTab === 'Restaurants' && <RestaurantsSearch />}
            </div>
        </div>
    )
}

export default BookingForm