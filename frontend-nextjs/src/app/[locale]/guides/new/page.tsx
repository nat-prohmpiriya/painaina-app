'use client'

import { imgUrl } from '@/lib/imgUrl'
import { Button, Input, Select, Tag } from 'antd'
import { Search, Heart, Bookmark, Eye, User, MapPin, Clock, Star } from 'lucide-react'
import { useState } from 'react'

const NewGuidesPage = () => {
  const [activeTab, setActiveTab] = useState('discover')

  // Mock data
  const mockGuides = [
    {
      id: 1,
      title: "3 วัน 2 คืน เที่ยวภูเก็ต งบ 5,000 บาท",
      description: "เที่ยวภูเก็ตแบบประหยัด ครบทุกจุดสำคัญ",
      location: "ภูเก็ต",
      duration: "3 วัน",
      difficulty: "Easy",
      creator: {
        name: "Sarah Travel",
        avatar: imgUrl
      },
      stats: {
        views: 1250,
        likes: 89,
        saves: 156
      },
      tags: ["ประหยัด", "ทะเล", "อาหาร"],
      coverImage: imgUrl
    },
    {
      id: 2,
      title: "เชียงใหม่ 5 วัน 4 คืน ธรรมชาติ + วัฒนธรรม",
      description: "สัมผัสธรรมชาติและวัฒนธรรมล้านนา",
      location: "เชียงใหม่",
      duration: "5 วัน",
      difficulty: "Moderate",
      creator: {
        name: "Northern Explorer",
        avatar: imgUrl
      },
      stats: {
        views: 2340,
        likes: 145,
        saves: 203
      },
      tags: ["ธรรมชาติ", "วัฒนธรรม", "ภูเขา"],
      coverImage: imgUrl
    },
    {
      id: 3,
      title: "กรุงเทพ 2 วัน 1 คืน Street Food + วัด",
      description: "ล่าอาหารริมทางและชมวัดสวยในกรุงเทพ",
      location: "กรุงเทพ",
      duration: "2 วัน",
      difficulty: "Easy",
      creator: {
        name: "Bangkok Foodie",
        avatar: imgUrl
      },
      stats: {
        views: 3100,
        likes: 234,
        saves: 445
      },
      tags: ["อาหาร", "วัด", "เมือง"],
      coverImage: imgUrl
    },
    {
      id: 4,
      title: "เกาะช้าง 4 วัน 3 คืน แบบ Chill ๆ",
      description: "เกาะช้างสบายๆ ชิลๆ พักผ่อนเต็มที่",
      location: "เกาะช้าง",
      duration: "4 วัน",
      difficulty: "Easy",
      creator: {
        name: "Island Lover",
        avatar: imgUrl
      },
      stats: {
        views: 890,
        likes: 67,
        saves: 123
      },
      tags: ["เกาะ", "พักผ่อน", "ทะเล"],
      coverImage: imgUrl
    },
    {
      id: 5,
      title: "สุโขทัย 2 วัน 1 คืน ย้อนรอยประวิติศาสตร์",
      description: "สำรวจเมืองเก่าและโบราณสถานสุโขทัย",
      location: "สุโขทัย",
      duration: "2 วัน",
      difficulty: "Easy",
      creator: {
        name: "History Hunter",
        avatar: imgUrl
      },
      stats: {
        views: 756,
        likes: 45,
        saves: 89
      },
      tags: ["ประวัติศาสตร์", "วัฒนธรรม", "โบราณ"],
      coverImage: imgUrl
    },
    {
      id: 6,
      title: "ขาวใหญ่ 3 วัน 2 คืน Safari + ธรรมชาติ",
      description: "ผจญภัยสวนสัตว์ป่าและธรรมชาติขาวใหญ่",
      location: "ขาวใหญ่",
      duration: "3 วัน",
      difficulty: "Moderate",
      creator: {
        name: "Nature Guide",
        avatar: imgUrl
      },
      stats: {
        views: 1450,
        likes: 98,
        saves: 167
      },
      tags: ["ธรรมชาติ", "สัตว์ป่า", "ผจญภัย"],
      coverImage: imgUrl
    }
  ]

  const categories = [
    "ทั้งหมด", "ทะเล", "ภูเขา", "เมือง", "ธรรมชาติ", 
    "วัฒนธรรม", "อาหาร", "ประหยัด", "หรูหรา", "ผจญภัย"
  ]

  const GuideCard = ({ guide }: { guide: any }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative">
        <img 
          src={guide.coverImage} 
          alt={guide.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">
          <Button 
            shape="circle" 
            icon={<Bookmark size={16} />} 
            className="bg-white/80 border-none shadow-sm"
          />
        </div>
        <div className="absolute bottom-3 left-3">
          <Tag color="blue">{guide.difficulty}</Tag>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{guide.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{guide.description}</p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            <span>{guide.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{guide.duration}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {guide.tags.slice(0, 3).map((tag: string, index: number) => (
            <Tag key={index} className="text-xs">{tag}</Tag>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={guide.creator.avatar} 
              alt={guide.creator.name}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm text-gray-600">{guide.creator.name}</span>
          </div>
          
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Eye size={12} />
              <span>{guide.stats.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart size={12} />
              <span>{guide.stats.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'discover':
        return (
          <div>
            {/* Featured Guides */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Featured Guides</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockGuides.slice(0, 3).map(guide => (
                  <GuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category, index) => (
                  <Tag 
                    key={index}
                    className={`cursor-pointer px-3 py-1 ${index === 0 ? 'bg-blue-100 border-blue-300' : ''}`}
                  >
                    {category}
                  </Tag>
                ))}
              </div>
            </div>

            {/* All Guides */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">All Guides</h2>
                <Select defaultValue="latest" className="w-32">
                  <Select.Option value="latest">ล่าสุด</Select.Option>
                  <Select.Option value="popular">ยอดนิยม</Select.Option>
                  <Select.Option value="trending">กำลังฮิต</Select.Option>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockGuides.map(guide => (
                  <GuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            </div>
          </div>
        )
      
      case 'following':
        return (
          <div className="text-center py-20">
            <User size={64} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Follow Creators to See Their Guides</h3>
            <p className="text-gray-600 mb-6">เมื่อคุณติดตาม creators ที่ชอบ ก็จะเห็น guides ใหม่ๆ ของพวกเขาที่นี่</p>
            <Button type="primary" onClick={() => setActiveTab('discover')}>
              Discover Creators
            </Button>
          </div>
        )
      
      case 'trending':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-6">Trending This Week</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockGuides
                .sort((a, b) => b.stats.views - a.stats.views)
                .slice(0, 6)
                .map(guide => (
                  <GuideCard key={guide.id} guide={guide} />
                ))}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-black relative h-[60vh] flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${imgUrl})` }}
        />
        <div className="absolute inset-0 bg-black/40" />
        
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Amazing Travel Guides
          </h1>
          <p className="text-lg md:text-xl mb-8">
            เที่ยวไปตามเก๋ๆ กับ guides จากคนจริงที่ไปมาแล้ว
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <Input
              size="large"
              placeholder="ค้นหาจุดหมาย, กิจกรรม, หรือ keyword ที่สนใจ..."
              prefix={<Search size={20} />}
              className="h-12 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="container mx-auto px-4">
          <div className="flex">
            {[
              { key: 'discover', label: 'Discover', icon: '🔍' },
              { key: 'following', label: 'Following', icon: '👥' },
              { key: 'trending', label: 'Trending', icon: '🔥' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container mx-auto px-4 py-8">
        {renderTabContent()}
      </div>
    </div>
  )
}

export default NewGuidesPage