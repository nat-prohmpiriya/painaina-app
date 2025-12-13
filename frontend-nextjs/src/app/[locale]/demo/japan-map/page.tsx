'use client';

import { InteractiveJapanMap } from '@/components/map';
import type { Region } from '@/components/map/JapanMapData';

export default function JapanMapDemo() {
  const handleRegionClick = (region: Region) => {
    console.log('Selected region:', region);
    alert(`Selected: ${region.name} - ${region.description}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interactive Japan Map Demo
          </h1>
          <p className="text-gray-600">
            Hover over different regions to see details and click to select
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-4xl w-full">
            <InteractiveJapanMap 
              onRegionClick={handleRegionClick}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-8 max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Features:</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• <strong>Hover Effects:</strong> เมื่อ hover ไปที่ภูมิภาคต่างๆ จะมี tooltip แสดงข้อมูล</li>
            <li>• <strong>Region Highlighting:</strong> พื้นที่จะเปลี่ยนสีเมื่อ hover และ select</li>
            <li>• <strong>Interactive Cards:</strong> แสดง region card ทางซ้ายเมื่อคลิกเลือก</li>
            <li>• <strong>Responsive Design:</strong> ปรับขนาดได้ตามหน้าจอ</li>
            <li>• <strong>Prefecture Data:</strong> มีข้อมูล SVG path ของแต่ละจังหวัด</li>
          </ul>
        </div>
      </div>
    </div>
  );
}