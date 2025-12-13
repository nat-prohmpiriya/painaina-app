
import { LuMapPin } from "react-icons/lu";
import AddToTripButton from "@/components/trip/TripMap/AddToTripButton";
import { Badge } from "antd";
import { ItineraryEntry } from "@/interfaces/trip.interface";

interface GuidePlaceEntryProps {
    entry: ItineraryEntry;
    placeName?: number;
}

const GuidePlaceEntry = ({ entry, placeName }: GuidePlaceEntryProps) => {
    const replaceWord = (str: string) => {
        return str.replace(/_/g, ' ');
    }

    const getPhotoUrl = () => {
        if (entry.place?.photos && entry.place.photos.length > 0) {
            const photoRef = entry.place.photos[0].photoReference;
            if (photoRef) {
                return `${process.env.NEXT_PUBLIC_API_URL}/places/photo?photoReference=${photoRef}&maxWidth=400`;
            }
        }
        return '';
    }

    return (
        <div className="p-4 rounded-xl hover:bg-gray-100">
            <div className="flex justify-between items-center mb-2">
                <div className="">
                    <div className="flex items-center gap-4">
                        <LuMapPin size={24} className="font-semibold" />
                        {placeName && <span className="text-sm text-gray-500 bg-red-500 text-white font-bold p-1 rounded-full w-6 h-6 flex items-center justify-center">{placeName}</span>}
                        <h3 className="text-lg font-semibold">{entry?.place?.name}</h3>
                    </div>
                    <div className="flex flex-wrap">
                        {entry.place?.categories && (
                            <div className="flex flex-wrap">
                                {entry.place.categories.map((category, index) => (
                                    <span
                                        key={index}
                                        className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full mr-2 mt-2"
                                    >
                                        {replaceWord(category)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <AddToTripButton placeDetails={entry?.place || null} />
            </div>
            {/* <p className="text-sm text-gray-600">{entry?.place?.address}</p> */}

            <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">

                <div className="lg:col-span-5">

                    <p className="text-sm text-gray-600">{entry.description}</p>
                </div>
                <div className="lg:col-span-3">
                    {getPhotoUrl() && (
                        <img
                            src={getPhotoUrl()}
                            alt={entry?.place?.name}
                            className="w-full h-36 object-cover rounded-lg mb-2"
                        />
                    )}
                    <span className="text-xs p-1 bg-gray-200 rounded-2xl font-semibold">
                        {entry.startTime} - {entry.endTime}
                    </span>

                </div>
            </div>
            {/* <pre>{JSON.stringify(entry, null, 2)}</pre> */}

        </div>
    )
}

export default GuidePlaceEntry