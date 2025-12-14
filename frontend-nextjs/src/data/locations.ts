// Location data for check-in feature
// Curated list of popular travel destinations in Asia

export interface Country {
  code: string
  name: string
  nameLocal: string
  flag: string
  latitude: number
  longitude: number
  regions: Region[]
}

export interface Region {
  id: string
  name: string
  nameLocal?: string
}

export interface City {
  id: string
  name: string
  nameLocal: string
  countryCode: string
  regionId?: string
  latitude: number
  longitude: number
}

// Countries
export const countries: Country[] = [
  {
    code: 'JP',
    name: 'Japan',
    nameLocal: 'ญี่ปุ่น',
    flag: '🇯🇵',
    latitude: 36.2048,
    longitude: 138.2529,
    regions: [
      { id: 'hokkaido', name: 'Hokkaido', nameLocal: 'ฮอกไกโด' },
      { id: 'tohoku', name: 'Tohoku', nameLocal: 'โทโฮคุ' },
      { id: 'kanto', name: 'Kanto', nameLocal: 'คันโต' },
      { id: 'chubu', name: 'Chubu', nameLocal: 'ชูบุ' },
      { id: 'kansai', name: 'Kansai', nameLocal: 'คันไซ' },
      { id: 'chugoku', name: 'Chugoku', nameLocal: 'ชูโกคุ' },
      { id: 'shikoku', name: 'Shikoku', nameLocal: 'ชิโกคุ' },
      { id: 'kyushu', name: 'Kyushu', nameLocal: 'คิวชู' },
      { id: 'okinawa', name: 'Okinawa', nameLocal: 'โอกินาว่า' },
    ],
  },
  {
    code: 'TH',
    name: 'Thailand',
    nameLocal: 'ไทย',
    flag: '🇹🇭',
    latitude: 15.870,
    longitude: 100.9925,
    regions: [
      { id: 'central', name: 'Central', nameLocal: 'ภาคกลาง' },
      { id: 'north', name: 'North', nameLocal: 'ภาคเหนือ' },
      { id: 'northeast', name: 'Northeast', nameLocal: 'ภาคอีสาน' },
      { id: 'east', name: 'East', nameLocal: 'ภาคตะวันออก' },
      { id: 'south', name: 'South', nameLocal: 'ภาคใต้' },
    ],
  },
  {
    code: 'KR',
    name: 'South Korea',
    nameLocal: 'เกาหลีใต้',
    flag: '🇰🇷',
    latitude: 35.9078,
    longitude: 127.7669,
    regions: [
      { id: 'capital', name: 'Capital Area', nameLocal: 'เขตเมืองหลวง' },
      { id: 'gangwon', name: 'Gangwon', nameLocal: 'คังวอน' },
      { id: 'chungcheong', name: 'Chungcheong', nameLocal: 'ชุงช็อง' },
      { id: 'gyeongsang', name: 'Gyeongsang', nameLocal: 'คย็องซัง' },
      { id: 'jeolla', name: 'Jeolla', nameLocal: 'ช็อลลา' },
      { id: 'jeju', name: 'Jeju', nameLocal: 'เชจู' },
    ],
  },
  {
    code: 'TW',
    name: 'Taiwan',
    nameLocal: 'ไต้หวัน',
    flag: '🇹🇼',
    latitude: 23.6978,
    longitude: 120.9605,
    regions: [
      { id: 'north', name: 'North', nameLocal: 'ภาคเหนือ' },
      { id: 'central', name: 'Central', nameLocal: 'ภาคกลาง' },
      { id: 'south', name: 'South', nameLocal: 'ภาคใต้' },
      { id: 'east', name: 'East', nameLocal: 'ภาคตะวันออก' },
    ],
  },
  {
    code: 'VN',
    name: 'Vietnam',
    nameLocal: 'เวียดนาม',
    flag: '🇻🇳',
    latitude: 14.0583,
    longitude: 108.2772,
    regions: [
      { id: 'north', name: 'North', nameLocal: 'ภาคเหนือ' },
      { id: 'central', name: 'Central', nameLocal: 'ภาคกลาง' },
      { id: 'south', name: 'South', nameLocal: 'ภาคใต้' },
    ],
  },
  {
    code: 'SG',
    name: 'Singapore',
    nameLocal: 'สิงคโปร์',
    flag: '🇸🇬',
    latitude: 1.3521,
    longitude: 103.8198,
    regions: [],
  },
  {
    code: 'MY',
    name: 'Malaysia',
    nameLocal: 'มาเลเซีย',
    flag: '🇲🇾',
    latitude: 4.2105,
    longitude: 101.9758,
    regions: [
      { id: 'peninsular', name: 'Peninsular', nameLocal: 'คาบสมุทร' },
      { id: 'sabah', name: 'Sabah', nameLocal: 'ซาบาห์' },
      { id: 'sarawak', name: 'Sarawak', nameLocal: 'ซาราวัก' },
    ],
  },
  {
    code: 'ID',
    name: 'Indonesia',
    nameLocal: 'อินโดนีเซีย',
    flag: '🇮🇩',
    latitude: -0.7893,
    longitude: 113.9213,
    regions: [
      { id: 'java', name: 'Java', nameLocal: 'ชวา' },
      { id: 'bali', name: 'Bali', nameLocal: 'บาหลี' },
      { id: 'sumatra', name: 'Sumatra', nameLocal: 'สุมาตรา' },
      { id: 'kalimantan', name: 'Kalimantan', nameLocal: 'กาลิมันตัน' },
      { id: 'sulawesi', name: 'Sulawesi', nameLocal: 'สุลาเวสี' },
    ],
  },
  {
    code: 'PH',
    name: 'Philippines',
    nameLocal: 'ฟิลิปปินส์',
    flag: '🇵🇭',
    latitude: 12.8797,
    longitude: 121.7740,
    regions: [
      { id: 'luzon', name: 'Luzon', nameLocal: 'ลูซอน' },
      { id: 'visayas', name: 'Visayas', nameLocal: 'วิซายัส' },
      { id: 'mindanao', name: 'Mindanao', nameLocal: 'มินดาเนา' },
    ],
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    nameLocal: 'ฮ่องกง',
    flag: '🇭🇰',
    latitude: 22.3193,
    longitude: 114.1694,
    regions: [],
  },
  {
    code: 'MO',
    name: 'Macau',
    nameLocal: 'มาเก๊า',
    flag: '🇲🇴',
    latitude: 22.1987,
    longitude: 113.5439,
    regions: [],
  },
  {
    code: 'CN',
    name: 'China',
    nameLocal: 'จีน',
    flag: '🇨🇳',
    latitude: 35.8617,
    longitude: 104.1954,
    regions: [
      { id: 'east', name: 'East China', nameLocal: 'จีนตะวันออก' },
      { id: 'south', name: 'South China', nameLocal: 'จีนใต้' },
      { id: 'north', name: 'North China', nameLocal: 'จีนเหนือ' },
      { id: 'southwest', name: 'Southwest', nameLocal: 'จีนตะวันตกเฉียงใต้' },
    ],
  },
]

// Cities - organized by country
export const cities: City[] = [
  // Japan - Hokkaido
  { id: 'sapporo', name: 'Sapporo', nameLocal: 'ซัปโปโร', countryCode: 'JP', regionId: 'hokkaido', latitude: 43.0618, longitude: 141.3545 },
  { id: 'hakodate', name: 'Hakodate', nameLocal: 'ฮาโกดาเตะ', countryCode: 'JP', regionId: 'hokkaido', latitude: 41.7687, longitude: 140.7288 },
  { id: 'otaru', name: 'Otaru', nameLocal: 'โอตารุ', countryCode: 'JP', regionId: 'hokkaido', latitude: 43.1907, longitude: 140.9947 },
  { id: 'furano', name: 'Furano', nameLocal: 'ฟุราโนะ', countryCode: 'JP', regionId: 'hokkaido', latitude: 43.3422, longitude: 142.3831 },
  { id: 'niseko', name: 'Niseko', nameLocal: 'นิเซโกะ', countryCode: 'JP', regionId: 'hokkaido', latitude: 42.8048, longitude: 140.6874 },

  // Japan - Tohoku
  { id: 'sendai', name: 'Sendai', nameLocal: 'เซนได', countryCode: 'JP', regionId: 'tohoku', latitude: 38.2682, longitude: 140.8694 },
  { id: 'aomori', name: 'Aomori', nameLocal: 'อาโอโมริ', countryCode: 'JP', regionId: 'tohoku', latitude: 40.8246, longitude: 140.7406 },

  // Japan - Kanto
  { id: 'tokyo', name: 'Tokyo', nameLocal: 'โตเกียว', countryCode: 'JP', regionId: 'kanto', latitude: 35.6762, longitude: 139.6503 },
  { id: 'yokohama', name: 'Yokohama', nameLocal: 'โยโกฮาม่า', countryCode: 'JP', regionId: 'kanto', latitude: 35.4437, longitude: 139.6380 },
  { id: 'kamakura', name: 'Kamakura', nameLocal: 'คามาคุระ', countryCode: 'JP', regionId: 'kanto', latitude: 35.3192, longitude: 139.5467 },
  { id: 'nikko', name: 'Nikko', nameLocal: 'นิกโก้', countryCode: 'JP', regionId: 'kanto', latitude: 36.7199, longitude: 139.6982 },
  { id: 'hakone', name: 'Hakone', nameLocal: 'ฮาโกเนะ', countryCode: 'JP', regionId: 'kanto', latitude: 35.2324, longitude: 139.1069 },

  // Japan - Chubu
  { id: 'nagoya', name: 'Nagoya', nameLocal: 'นาโกย่า', countryCode: 'JP', regionId: 'chubu', latitude: 35.1815, longitude: 136.9066 },
  { id: 'kanazawa', name: 'Kanazawa', nameLocal: 'คานาซาว่า', countryCode: 'JP', regionId: 'chubu', latitude: 36.5944, longitude: 136.6256 },
  { id: 'takayama', name: 'Takayama', nameLocal: 'ทาคายาม่า', countryCode: 'JP', regionId: 'chubu', latitude: 36.1461, longitude: 137.2522 },
  { id: 'shirakawago', name: 'Shirakawa-go', nameLocal: 'ชิราคาวาโกะ', countryCode: 'JP', regionId: 'chubu', latitude: 36.2578, longitude: 136.9056 },
  { id: 'matsumoto', name: 'Matsumoto', nameLocal: 'มัตสึโมโตะ', countryCode: 'JP', regionId: 'chubu', latitude: 36.2381, longitude: 137.9720 },

  // Japan - Kansai
  { id: 'osaka', name: 'Osaka', nameLocal: 'โอซาก้า', countryCode: 'JP', regionId: 'kansai', latitude: 34.6937, longitude: 135.5023 },
  { id: 'kyoto', name: 'Kyoto', nameLocal: 'เกียวโต', countryCode: 'JP', regionId: 'kansai', latitude: 35.0116, longitude: 135.7681 },
  { id: 'nara', name: 'Nara', nameLocal: 'นารา', countryCode: 'JP', regionId: 'kansai', latitude: 34.6851, longitude: 135.8048 },
  { id: 'kobe', name: 'Kobe', nameLocal: 'โกเบ', countryCode: 'JP', regionId: 'kansai', latitude: 34.6901, longitude: 135.1956 },
  { id: 'himeji', name: 'Himeji', nameLocal: 'ฮิเมจิ', countryCode: 'JP', regionId: 'kansai', latitude: 34.8394, longitude: 134.6939 },

  // Japan - Chugoku
  { id: 'hiroshima', name: 'Hiroshima', nameLocal: 'ฮิโรชิม่า', countryCode: 'JP', regionId: 'chugoku', latitude: 34.3853, longitude: 132.4553 },
  { id: 'miyajima', name: 'Miyajima', nameLocal: 'มิยาจิม่า', countryCode: 'JP', regionId: 'chugoku', latitude: 34.2961, longitude: 132.3198 },
  { id: 'okayama', name: 'Okayama', nameLocal: 'โอคายาม่า', countryCode: 'JP', regionId: 'chugoku', latitude: 34.6618, longitude: 133.9344 },

  // Japan - Shikoku
  { id: 'matsuyama', name: 'Matsuyama', nameLocal: 'มัตสึยาม่า', countryCode: 'JP', regionId: 'shikoku', latitude: 33.8392, longitude: 132.7657 },
  { id: 'takamatsu', name: 'Takamatsu', nameLocal: 'ทาคามัตสึ', countryCode: 'JP', regionId: 'shikoku', latitude: 34.3401, longitude: 134.0434 },

  // Japan - Kyushu
  { id: 'fukuoka', name: 'Fukuoka', nameLocal: 'ฟุกุโอกะ', countryCode: 'JP', regionId: 'kyushu', latitude: 33.5904, longitude: 130.4017 },
  { id: 'nagasaki', name: 'Nagasaki', nameLocal: 'นางาซากิ', countryCode: 'JP', regionId: 'kyushu', latitude: 32.7503, longitude: 129.8779 },
  { id: 'kumamoto', name: 'Kumamoto', nameLocal: 'คุมาโมโตะ', countryCode: 'JP', regionId: 'kyushu', latitude: 32.8032, longitude: 130.7079 },
  { id: 'beppu', name: 'Beppu', nameLocal: 'เบปปุ', countryCode: 'JP', regionId: 'kyushu', latitude: 33.2846, longitude: 131.4914 },
  { id: 'kagoshima', name: 'Kagoshima', nameLocal: 'คาโกชิม่า', countryCode: 'JP', regionId: 'kyushu', latitude: 31.5966, longitude: 130.5571 },

  // Japan - Okinawa
  { id: 'naha', name: 'Naha', nameLocal: 'นาฮะ', countryCode: 'JP', regionId: 'okinawa', latitude: 26.2124, longitude: 127.6809 },
  { id: 'ishigaki', name: 'Ishigaki', nameLocal: 'อิชิงากิ', countryCode: 'JP', regionId: 'okinawa', latitude: 24.3448, longitude: 124.1572 },

  // Thailand - Central
  { id: 'bangkok', name: 'Bangkok', nameLocal: 'กรุงเทพ', countryCode: 'TH', regionId: 'central', latitude: 13.7563, longitude: 100.5018 },
  { id: 'ayutthaya', name: 'Ayutthaya', nameLocal: 'อยุธยา', countryCode: 'TH', regionId: 'central', latitude: 14.3692, longitude: 100.5877 },
  { id: 'kanchanaburi', name: 'Kanchanaburi', nameLocal: 'กาญจนบุรี', countryCode: 'TH', regionId: 'central', latitude: 14.0227, longitude: 99.5328 },

  // Thailand - North
  { id: 'chiangmai', name: 'Chiang Mai', nameLocal: 'เชียงใหม่', countryCode: 'TH', regionId: 'north', latitude: 18.7883, longitude: 98.9853 },
  { id: 'chiangrai', name: 'Chiang Rai', nameLocal: 'เชียงราย', countryCode: 'TH', regionId: 'north', latitude: 19.9105, longitude: 99.8406 },
  { id: 'pai', name: 'Pai', nameLocal: 'ปาย', countryCode: 'TH', regionId: 'north', latitude: 19.3622, longitude: 98.4408 },

  // Thailand - Northeast
  { id: 'khorat', name: 'Nakhon Ratchasima', nameLocal: 'โคราช', countryCode: 'TH', regionId: 'northeast', latitude: 14.9799, longitude: 102.0978 },
  { id: 'khonkaen', name: 'Khon Kaen', nameLocal: 'ขอนแก่น', countryCode: 'TH', regionId: 'northeast', latitude: 16.4322, longitude: 102.8236 },
  { id: 'udonthani', name: 'Udon Thani', nameLocal: 'อุดรธานี', countryCode: 'TH', regionId: 'northeast', latitude: 17.4156, longitude: 102.7872 },

  // Thailand - East
  { id: 'pattaya', name: 'Pattaya', nameLocal: 'พัทยา', countryCode: 'TH', regionId: 'east', latitude: 12.9236, longitude: 100.8825 },
  { id: 'rayong', name: 'Rayong', nameLocal: 'ระยอง', countryCode: 'TH', regionId: 'east', latitude: 12.6814, longitude: 101.2816 },
  { id: 'kohchang', name: 'Koh Chang', nameLocal: 'เกาะช้าง', countryCode: 'TH', regionId: 'east', latitude: 12.0583, longitude: 102.3311 },

  // Thailand - South
  { id: 'phuket', name: 'Phuket', nameLocal: 'ภูเก็ต', countryCode: 'TH', regionId: 'south', latitude: 7.8804, longitude: 98.3923 },
  { id: 'krabi', name: 'Krabi', nameLocal: 'กระบี่', countryCode: 'TH', regionId: 'south', latitude: 8.0863, longitude: 98.9063 },
  { id: 'kohsamui', name: 'Koh Samui', nameLocal: 'เกาะสมุย', countryCode: 'TH', regionId: 'south', latitude: 9.5120, longitude: 100.0136 },
  { id: 'kohphangan', name: 'Koh Phangan', nameLocal: 'เกาะพะงัน', countryCode: 'TH', regionId: 'south', latitude: 9.7471, longitude: 100.0320 },
  { id: 'hatyai', name: 'Hat Yai', nameLocal: 'หาดใหญ่', countryCode: 'TH', regionId: 'south', latitude: 7.0086, longitude: 100.4747 },

  // South Korea
  { id: 'seoul', name: 'Seoul', nameLocal: 'โซล', countryCode: 'KR', regionId: 'capital', latitude: 37.5665, longitude: 126.9780 },
  { id: 'incheon', name: 'Incheon', nameLocal: 'อินช็อน', countryCode: 'KR', regionId: 'capital', latitude: 37.4563, longitude: 126.7052 },
  { id: 'busan', name: 'Busan', nameLocal: 'ปูซาน', countryCode: 'KR', regionId: 'gyeongsang', latitude: 35.1796, longitude: 129.0756 },
  { id: 'gyeongju', name: 'Gyeongju', nameLocal: 'คยองจู', countryCode: 'KR', regionId: 'gyeongsang', latitude: 35.8562, longitude: 129.2247 },
  { id: 'daegu', name: 'Daegu', nameLocal: 'แทกู', countryCode: 'KR', regionId: 'gyeongsang', latitude: 35.8714, longitude: 128.6014 },
  { id: 'jeju', name: 'Jeju', nameLocal: 'เชจู', countryCode: 'KR', regionId: 'jeju', latitude: 33.4996, longitude: 126.5312 },
  { id: 'gangneung', name: 'Gangneung', nameLocal: 'คังนึง', countryCode: 'KR', regionId: 'gangwon', latitude: 37.7519, longitude: 128.8761 },
  { id: 'jeonju', name: 'Jeonju', nameLocal: 'ช็อนจู', countryCode: 'KR', regionId: 'jeolla', latitude: 35.8242, longitude: 127.1480 },

  // Taiwan
  { id: 'taipei', name: 'Taipei', nameLocal: 'ไทเป', countryCode: 'TW', regionId: 'north', latitude: 25.0330, longitude: 121.5654 },
  { id: 'jiufen', name: 'Jiufen', nameLocal: 'จิ่วเฟิ่น', countryCode: 'TW', regionId: 'north', latitude: 25.1089, longitude: 121.8443 },
  { id: 'taichung', name: 'Taichung', nameLocal: 'ไถจง', countryCode: 'TW', regionId: 'central', latitude: 24.1477, longitude: 120.6736 },
  { id: 'sunmoonlake', name: 'Sun Moon Lake', nameLocal: 'ซันมูนเลค', countryCode: 'TW', regionId: 'central', latitude: 23.8531, longitude: 120.9135 },
  { id: 'kaohsiung', name: 'Kaohsiung', nameLocal: 'เกาสง', countryCode: 'TW', regionId: 'south', latitude: 22.6273, longitude: 120.3014 },
  { id: 'tainan', name: 'Tainan', nameLocal: 'ไถหนาน', countryCode: 'TW', regionId: 'south', latitude: 22.9998, longitude: 120.2269 },
  { id: 'hualien', name: 'Hualien', nameLocal: 'ฮัวเหลียน', countryCode: 'TW', regionId: 'east', latitude: 23.9910, longitude: 121.6111 },

  // Vietnam
  { id: 'hanoi', name: 'Hanoi', nameLocal: 'ฮานอย', countryCode: 'VN', regionId: 'north', latitude: 21.0278, longitude: 105.8342 },
  { id: 'halong', name: 'Ha Long', nameLocal: 'ฮาลอง', countryCode: 'VN', regionId: 'north', latitude: 20.9517, longitude: 107.0480 },
  { id: 'sapa', name: 'Sapa', nameLocal: 'ซาปา', countryCode: 'VN', regionId: 'north', latitude: 22.3364, longitude: 103.8438 },
  { id: 'danang', name: 'Da Nang', nameLocal: 'ดานัง', countryCode: 'VN', regionId: 'central', latitude: 16.0544, longitude: 108.2022 },
  { id: 'hoian', name: 'Hoi An', nameLocal: 'ฮอยอัน', countryCode: 'VN', regionId: 'central', latitude: 15.8801, longitude: 108.3380 },
  { id: 'hue', name: 'Hue', nameLocal: 'เว้', countryCode: 'VN', regionId: 'central', latitude: 16.4637, longitude: 107.5909 },
  { id: 'hochiminh', name: 'Ho Chi Minh City', nameLocal: 'โฮจิมินห์', countryCode: 'VN', regionId: 'south', latitude: 10.8231, longitude: 106.6297 },
  { id: 'phuquoc', name: 'Phu Quoc', nameLocal: 'ฟูก๊วก', countryCode: 'VN', regionId: 'south', latitude: 10.2270, longitude: 103.9670 },

  // Singapore
  { id: 'singapore', name: 'Singapore', nameLocal: 'สิงคโปร์', countryCode: 'SG', latitude: 1.3521, longitude: 103.8198 },

  // Malaysia
  { id: 'kualalumpur', name: 'Kuala Lumpur', nameLocal: 'กัวลาลัมเปอร์', countryCode: 'MY', regionId: 'peninsular', latitude: 3.1390, longitude: 101.6869 },
  { id: 'penang', name: 'Penang', nameLocal: 'ปีนัง', countryCode: 'MY', regionId: 'peninsular', latitude: 5.4164, longitude: 100.3327 },
  { id: 'langkawi', name: 'Langkawi', nameLocal: 'ลังกาวี', countryCode: 'MY', regionId: 'peninsular', latitude: 6.3500, longitude: 99.8000 },
  { id: 'malacca', name: 'Malacca', nameLocal: 'มะละกา', countryCode: 'MY', regionId: 'peninsular', latitude: 2.1896, longitude: 102.2501 },
  { id: 'kotakinabalu', name: 'Kota Kinabalu', nameLocal: 'โกตาคินาบาลู', countryCode: 'MY', regionId: 'sabah', latitude: 5.9804, longitude: 116.0735 },

  // Indonesia
  { id: 'jakarta', name: 'Jakarta', nameLocal: 'จาการ์ตา', countryCode: 'ID', regionId: 'java', latitude: -6.2088, longitude: 106.8456 },
  { id: 'yogyakarta', name: 'Yogyakarta', nameLocal: 'ยอกยาการ์ตา', countryCode: 'ID', regionId: 'java', latitude: -7.7956, longitude: 110.3695 },
  { id: 'bali_denpasar', name: 'Denpasar', nameLocal: 'เดนปาซาร์', countryCode: 'ID', regionId: 'bali', latitude: -8.6705, longitude: 115.2126 },
  { id: 'ubud', name: 'Ubud', nameLocal: 'อูบุด', countryCode: 'ID', regionId: 'bali', latitude: -8.5069, longitude: 115.2625 },
  { id: 'seminyak', name: 'Seminyak', nameLocal: 'เซมินยัก', countryCode: 'ID', regionId: 'bali', latitude: -8.6913, longitude: 115.1682 },
  { id: 'nusadua', name: 'Nusa Dua', nameLocal: 'นูซาดูอา', countryCode: 'ID', regionId: 'bali', latitude: -8.8030, longitude: 115.2330 },

  // Philippines
  { id: 'manila', name: 'Manila', nameLocal: 'มะนิลา', countryCode: 'PH', regionId: 'luzon', latitude: 14.5995, longitude: 120.9842 },
  { id: 'cebu', name: 'Cebu', nameLocal: 'เซบู', countryCode: 'PH', regionId: 'visayas', latitude: 10.3157, longitude: 123.8854 },
  { id: 'boracay', name: 'Boracay', nameLocal: 'โบราไกย์', countryCode: 'PH', regionId: 'visayas', latitude: 11.9674, longitude: 121.9248 },
  { id: 'palawan', name: 'Palawan', nameLocal: 'ปาลาวัน', countryCode: 'PH', regionId: 'luzon', latitude: 9.8349, longitude: 118.7384 },
  { id: 'siargao', name: 'Siargao', nameLocal: 'ซีอาร์เกา', countryCode: 'PH', regionId: 'mindanao', latitude: 9.8482, longitude: 126.0458 },

  // Hong Kong
  { id: 'hongkong', name: 'Hong Kong', nameLocal: 'ฮ่องกง', countryCode: 'HK', latitude: 22.3193, longitude: 114.1694 },

  // Macau
  { id: 'macau', name: 'Macau', nameLocal: 'มาเก๊า', countryCode: 'MO', latitude: 22.1987, longitude: 113.5439 },

  // China
  { id: 'shanghai', name: 'Shanghai', nameLocal: 'เซี่ยงไฮ้', countryCode: 'CN', regionId: 'east', latitude: 31.2304, longitude: 121.4737 },
  { id: 'beijing', name: 'Beijing', nameLocal: 'ปักกิ่ง', countryCode: 'CN', regionId: 'north', latitude: 39.9042, longitude: 116.4074 },
  { id: 'guangzhou', name: 'Guangzhou', nameLocal: 'กวางโจว', countryCode: 'CN', regionId: 'south', latitude: 23.1291, longitude: 113.2644 },
  { id: 'shenzhen', name: 'Shenzhen', nameLocal: 'เซินเจิ้น', countryCode: 'CN', regionId: 'south', latitude: 22.5431, longitude: 114.0579 },
  { id: 'chengdu', name: 'Chengdu', nameLocal: 'เฉิงตู', countryCode: 'CN', regionId: 'southwest', latitude: 30.5728, longitude: 104.0668 },
  { id: 'xian', name: "Xi'an", nameLocal: 'ซีอาน', countryCode: 'CN', regionId: 'north', latitude: 34.3416, longitude: 108.9398 },
  { id: 'guilin', name: 'Guilin', nameLocal: 'กุ้ยหลิน', countryCode: 'CN', regionId: 'south', latitude: 25.2742, longitude: 110.2900 },
]

// Helper functions
export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code)
}

export const getCitiesByCountry = (countryCode: string): City[] => {
  return cities.filter(c => c.countryCode === countryCode)
}

export const getCitiesByRegion = (countryCode: string, regionId: string): City[] => {
  return cities.filter(c => c.countryCode === countryCode && c.regionId === regionId)
}

export const getCityById = (cityId: string): City | undefined => {
  return cities.find(c => c.id === cityId)
}

export const searchCities = (query: string): City[] => {
  const q = query.toLowerCase()
  return cities.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.nameLocal.includes(q)
  )
}
