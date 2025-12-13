'use client';

import React, { useState, useRef, useEffect } from 'react';
import { prefectures, regions, Region, regionDestinations } from './JapanMapData';

interface InteractiveJapanMapProps {
  onRegionClick?: (region: Region) => void;
  className?: string;
}

export const InteractiveJapanMap: React.FC<InteractiveJapanMapProps> = ({
  onRegionClick,
  className = ''
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>('kanto');
  const [showRegionCard, setShowRegionCard] = useState(false);
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  const handlePrefectureHover = (regionId: string, event: React.MouseEvent) => {
    setHoveredRegion(regionId);
    setShowRegionCard(true);
    
    // Calculate card position relative to map container
    if (mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setCardPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };

  const handlePrefectureLeave = () => {
    setHoveredRegion(null);
    setShowRegionCard(false);
  };

  const handleRegionClick = (regionId: string) => {
    setSelectedRegion(regionId);
    const region = regions.find(r => r.id === regionId);
    if (region && onRegionClick) {
      onRegionClick(region);
    }
  };

  const getRegionColor = (regionId: string): string => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return '#e5e7eb'; // default gray
    
    if (hoveredRegion === regionId) {
      return '#1f2937'; // darker on hover
    }
    
    if (selectedRegion === regionId) {
      return region.color; // use region's designated color
    }
    
    // Lighter version of region color for non-selected regions
    return region.color === '#ef4444' ? '#fca5a5' : '#86efac';
  };

  const getStrokeColor = (regionId: string): string => {
    if (hoveredRegion === regionId) {
      return '#111827';
    }
    return '#ffffff';
  };

  const getStrokeWidth = (regionId: string): number => {
    if (hoveredRegion === regionId) {
      return 3;
    }
    return 1.5;
  };

  const hoveredRegionData = hoveredRegion ? regions.find(r => r.id === hoveredRegion) : null;
  const destinations = hoveredRegion ? regionDestinations[hoveredRegion as keyof typeof regionDestinations] : [];

  return (
    <div ref={mapRef} className={`relative inline-block ${className}`}>
      {/* SVG Map */}
      <svg
        width="900"
        height="1000"
        viewBox="0 0 900 1000"
        className="w-full h-auto"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* Map Background */}
        <rect width="900" height="1000" fill="#f8fafc" />
        
        {/* Prefecture Paths */}
        {prefectures.map((prefecture) => (
          <path
            key={prefecture.id}
            d={prefecture.path}
            fill={getRegionColor(prefecture.region)}
            stroke={getStrokeColor(prefecture.region)}
            strokeWidth={getStrokeWidth(prefecture.region)}
            className="transition-all duration-200 ease-in-out cursor-pointer"
            onMouseEnter={(e) => handlePrefectureHover(prefecture.region, e)}
            onMouseLeave={handlePrefectureLeave}
            onMouseMove={(e) => {
              if (mapRef.current) {
                const rect = mapRef.current.getBoundingClientRect();
                setCardPosition({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top
                });
              }
            }}
            onClick={() => handleRegionClick(prefecture.region)}
          />
        ))}

        {/* Region Labels */}
        <text x="750" y="140" textAnchor="middle" className="fill-gray-700 font-semibold text-lg">
          Hokkaido
        </text>
        <text x="750" y="300" textAnchor="middle" className="fill-gray-700 font-semibold text-lg">
          Tohoku  
        </text>
        <text x="875" y="660" textAnchor="middle" className="fill-gray-700 font-semibold text-lg">
          Tokyo
        </text>
        <text x="550" y="525" textAnchor="middle" className="fill-gray-700 font-semibold text-lg">
          Kyoto
        </text>
        <text x="700" y="430" textAnchor="middle" className="fill-gray-700 font-semibold text-lg">
          Kansai
        </text>
        <text x="400" y="710" textAnchor="middle" className="fill-gray-700 font-semibold text-lg">
          Chugoku
        </text>
        <text x="350" y="790" textAnchor="middle" className="fill-gray-700 font-semibold text-lg">
          Shikoku
        </text>
        <text x="300" y="870" textAnchor="middle" className="fill-gray-700 font-semibold text-lg">
          Kyushu
        </text>
        <text x="875" y="950" textAnchor="middle" className="fill-gray-700 font-semibold text-lg">
          Okinawa
        </text>

        {/* City Labels */}
        <text x="845" y="180" className="fill-gray-600 text-sm">Sapporo</text>
        <text x="895" y="255" className="fill-gray-600 text-sm">Furano</text>
        <text x="945" y="311" className="fill-gray-600 text-sm">Hakodate</text>
        <text x="950" y="374" className="fill-gray-600 text-sm">Aomori</text>
        <text x="950" y="500" className="fill-gray-600 text-sm">Sendai</text>
        <text x="950" y="592" className="fill-gray-600 text-sm">Nikko</text>
        <text x="620" y="456" className="fill-gray-600 text-sm">Takayama</text>
        <text x="575" y="457" className="fill-gray-600 text-sm">Kanazawa</text>
        <text x="695" y="465" className="fill-gray-600 text-sm">Aizu</text>
        <text x="380" y="628" className="fill-gray-600 text-sm">Hiroshima</text>
        <text x="245" y="672" className="fill-gray-600 text-sm">Fukuoka</text>
        <text x="370" y="897" className="fill-gray-600 text-sm">Kagoshima</text>
        <text x="465" y="929" className="fill-gray-600 text-sm">Nara</text>
        <text x="530" y="869" className="fill-gray-600 text-sm">Nagoya</text>
        <text x="640" y="756" className="fill-gray-600 text-sm">Hakone</text>
        <text x="280" y="963" className="fill-gray-600 text-sm">Nagasaki</text>
        <text x="723" y="815" className="fill-gray-600 text-sm">Mt. Fuji</text>
      </svg>

      {/* Floating Region Card */}
      {showRegionCard && hoveredRegionData && (
        <div
          className="absolute z-10 bg-white rounded-lg shadow-lg border p-4 w-80 pointer-events-none"
          style={{
            left: `${Math.min(cardPosition.x + 20, mapRef.current ? mapRef.current.offsetWidth - 320 : cardPosition.x)}px`,
            top: `${Math.max(cardPosition.y - 20, 0)}px`,
            transform: cardPosition.y < 100 ? 'translateY(20px)' : 'translateY(-100%)'
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: hoveredRegionData.color }}
            />
            <h3 className="text-lg font-semibold text-gray-900">
              {hoveredRegionData.name}
            </h3>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">
            {hoveredRegionData.description}
          </p>

          {destinations && destinations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Popular Destinations:</p>
              <div className="flex flex-wrap gap-1">
                {destinations.slice(0, 3).map((dest, index) => (
                  <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {dest.nameEn}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Region Selection Card (Left Side) */}
      {selectedRegion && (
        <div className="absolute left-4 top-4 bg-white rounded-xl shadow-lg border p-6 w-80">
          <div className="text-sm text-gray-500 mb-2">Explore</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="text-2xl">🗾</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {regions.find(r => r.id === selectedRegion)?.name}
              </h2>
              <p className="text-gray-600 text-sm">
                {regions.find(r => r.id === selectedRegion)?.description}
              </p>
            </div>
            <button className="ml-auto p-1 hover:bg-gray-100 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveJapanMap;