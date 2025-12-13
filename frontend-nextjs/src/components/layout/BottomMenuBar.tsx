'use client'

import { LuHouse, LuMap, LuCalendarDays, LuCircleUserRound } from "react-icons/lu";
import { useState } from "react";

const BottomMenuBar = () => {

    const [currentClick, setCurrentClick] = useState<string>("home");

    return (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-white md:hidden shadow-2xl rounded-tl-3xl rounded-tr-3xl border-t border-gray-200 z-50">
            <div className="w-full h-full px-8 flex justify-between items-center">
                <LuHouse
                    className={currentClick === "home"
                        ? "text-red-500 scale-110 transition-all duration-200 text-3xl"
                        : "text-gray-700 text-2xl"
                    }
                    onClick={() => setCurrentClick("home")}
                />
                <LuMap

                    className={currentClick === "map"
                        ? "text-red-500 scale-110 transition-all duration-200 text-3xl"
                        : "text-gray-700 text-2xl"
                    }
                    onClick={() => setCurrentClick("map")}
                />
                <LuCalendarDays
                    className={currentClick === "calendar"
                        ? "text-red-500 scale-110 transition-all duration-200 text-3xl"
                        : "text-gray-700 text-2xl"
                    }
                    onClick={() => setCurrentClick("calendar")}
                />
                <LuCircleUserRound
                    className={currentClick === "profile"
                        ? "text-red-500 scale-110 transition-all duration-200 text-3xl"
                        : "text-gray-700 text-2xl"
                    }
                    onClick={() => setCurrentClick("profile")}
                />
            </div>
        </div>
    )
}

export default BottomMenuBar