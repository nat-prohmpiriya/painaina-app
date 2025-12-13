'use client';

import { Button } from 'antd'
import { useState } from 'react';
import { LuBed, LuPlane, LuCarFront, LuBusFront } from 'react-icons/lu';
import { MdOutlineLocalActivity } from "react-icons/md";
import { IoRestaurantOutline } from "react-icons/io5";
import FlightSearch from './FlightSearch';
import StaySearch from './StaySearch';
import CarRentalSearch from './CarRentalSearch';
import BusRentalSearch from './BusRentalSearch';
import EventSearch from './EventSearch';
import RestaurantsSearch from './RestaurantsSearch';
import { FaTrain } from "react-icons/fa6";
import TrainsSearch from './TrainsSearch';


const BookingForm = () => {

    const [currentTab, setCurrentTab] = useState('Stays');

    const listButton = [
        { label: 'Stays', icon: <LuBed size={20} /> },
        { label: 'Flights', icon: <LuPlane size={20} /> },
        // { label: 'Car', icon: <LuCarFront size={20} /> },
        // { label: 'Buses', icon: <LuBusFront size={20} /> },
        // { label: 'Trains', icon: <FaTrain size={20} /> },
        { label: 'Event', icon: <MdOutlineLocalActivity size={20} /> },
        // { label: 'Restaurants', icon: <IoRestaurantOutline size={20} /> },
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
                            size='large'
                            variant={item.label === currentTab ? 'solid' : 'outlined'}
                            color={item.label === currentTab ? 'danger' : 'default'}

                            key={index}
                            icon={item.icon}
                            className={`rounded-full ${currentTab === item.label
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-red-500 hover:text-white'
                                }`}
                            onClick={() => setCurrentTab(item.label)}
                        />
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