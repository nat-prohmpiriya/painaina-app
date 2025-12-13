'use client'

import { MessageSquareX, Calculator, MapPinOff } from 'lucide-react'

const PainPointsSection = () => {
  const painPoints = [
    {
      icon: MessageSquareX,
      emoji: '😫',
      title: '"ส่งแผนไปใน Line แล้วหายไปไหน?"',
      description: 'ส่งไป 10 รอบ เพื่อนก็ยังถามว่าไปไหนต่อ'
    },
    {
      icon: Calculator,
      emoji: '😵',
      title: '"หารเงินตอนจบทริป ต้องนั่งคิดเงินกันอีก"',
      description: 'ใครจ่ายอะไรไป ต้องโอนใครเท่าไหร่ งงไปหมด'
    },
    {
      icon: MapPinOff,
      emoji: '🤯',
      title: '"อยากไปเที่ยวแต่ไม่รู้จะไปไหนดี"',
      description: 'เปิด Google หา review จนตาลาย ยังตัดสินใจไม่ได้'
    }
  ]

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Headline */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            เคยมีปัญหาแบบนี้ไหม?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            ปัญหาที่ทุกคนเจอเวลาวางแผนเที่ยวกับเพื่อน
          </p>
        </div>

        {/* Pain Point Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {painPoints.map((point, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-xl p-8 shadow-sm border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              {/* Emoji */}
              <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">
                {point.emoji}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-foreground mb-3 leading-relaxed">
                {point.title}
              </h3>

              {/* Description */}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {point.description}
              </p>

              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-3xl rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PainPointsSection
