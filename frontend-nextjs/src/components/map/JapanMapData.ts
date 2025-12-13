// Japan Map Data with SVG paths for each prefecture/region
export interface Prefecture {
  id: string;
  name: string;
  region: string;
  path: string;
  center: [number, number]; // [x, y] for label positioning
}

export interface Region {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  description: string;
  prefectures: string[];
}

export const regions: Region[] = [
  {
    id: 'hokkaido',
    name: 'Hokkaido',
    nameEn: 'Hokkaido',
    color: '#22c55e',
    description: 'Northernmost island known for snow, seafood, and nature',
    prefectures: ['hokkaido']
  },
  {
    id: 'tohoku',
    name: 'Tohoku',
    nameEn: 'Tohoku', 
    color: '#22c55e',
    description: 'Mountains, hot springs, and traditional culture',
    prefectures: ['aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima']
  },
  {
    id: 'kanto',
    name: 'Kanto',
    nameEn: 'Kanto',
    color: '#ef4444',
    description: 'Tokyo and a wealth of nearby destinations',
    prefectures: ['ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa']
  },
  {
    id: 'chubu',
    name: 'Chubu',
    nameEn: 'Chubu',
    color: '#22c55e',
    description: 'Central Japan with Mount Fuji and Japanese Alps',
    prefectures: ['niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano', 'gifu', 'shizuoka', 'aichi']
  },
  {
    id: 'kansai',
    name: 'Kansai',
    nameEn: 'Kansai',
    color: '#22c55e',
    description: 'Historic region with Kyoto, Osaka, and Nara',
    prefectures: ['mie', 'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama']
  },
  {
    id: 'chugoku',
    name: 'Chugoku',
    nameEn: 'Chugoku',
    color: '#22c55e',
    description: 'Western Honshu with Hiroshima and scenic coastlines',
    prefectures: ['tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi']
  },
  {
    id: 'shikoku',
    name: 'Shikoku',
    nameEn: 'Shikoku',
    color: '#22c55e',
    description: 'Smallest main island famous for pilgrimage routes',
    prefectures: ['tokushima', 'kagawa', 'ehime', 'kochi']
  },
  {
    id: 'kyushu',
    name: 'Kyushu',
    nameEn: 'Kyushu',
    color: '#22c55e',
    description: 'Southern island with hot springs and active volcanoes',
    prefectures: ['fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima']
  },
  {
    id: 'okinawa',
    name: 'Okinawa',
    nameEn: 'Okinawa',
    color: '#22c55e',
    description: 'Tropical islands with unique culture and beautiful beaches',
    prefectures: ['okinawa']
  }
];

export const prefectures: Prefecture[] = [
  // Hokkaido
  {
    id: 'hokkaido',
    name: 'Hokkaido',
    region: 'hokkaido',
    path: 'M695,42L742,45L780,62L798,85L810,115L815,145L808,175L792,195L768,208L735,215L698,210L665,195L640,175L625,150L630,120L645,92L670,70Z',
    center: [720, 130]
  },
  
  // Tohoku
  {
    id: 'aomori',
    name: 'Aomori',
    region: 'tohoku',
    path: 'M665,195L698,210L735,215L768,208L792,195L808,175L815,145L810,115L798,85L780,62L742,45L695,42L670,70L645,92L630,120L625,150L640,175Z',
    center: [720, 160]
  },
  {
    id: 'iwate',
    name: 'Iwate', 
    region: 'tohoku',
    path: 'M665,195L640,175L625,150L630,120L645,92L670,70L695,42L720,65L745,90L765,120L775,155L770,190L750,215L720,230L695,235L675,225Z',
    center: [710, 180]
  },
  
  // Kanto - Tokyo area highlighted in red
  {
    id: 'tokyo',
    name: 'Tokyo',
    region: 'kanto', 
    path: 'M720,350L750,340L775,355L785,375L780,395L770,410L750,420L720,415L700,405L695,385L705,365Z',
    center: [740, 385]
  },
  {
    id: 'kanagawa',
    name: 'Kanagawa',
    region: 'kanto',
    path: 'M720,415L750,420L770,410L780,395L785,375L790,395L795,420L785,445L760,455L735,450L715,440L705,420Z',
    center: [745, 430]
  },
  {
    id: 'chiba',
    name: 'Chiba', 
    region: 'kanto',
    path: 'M750,340L780,335L805,345L825,365L830,390L820,415L800,435L775,440L750,420L720,415L720,350Z',
    center: [775, 380]
  },
  {
    id: 'saitama',
    name: 'Saitama',
    region: 'kanto',
    path: 'M695,315L720,310L745,320L750,340L720,350L705,365L695,385L680,375L675,355L685,335Z',
    center: [715, 340]
  },
  {
    id: 'gunma',
    name: 'Gunma',
    region: 'kanto', 
    path: 'M675,285L695,280L715,285L735,295L745,320L720,310L695,315L685,335L675,355L665,345L660,320L665,300Z',
    center: [700, 315]
  },
  {
    id: 'tochigi',
    name: 'Tochigi',
    region: 'kanto',
    path: 'M715,285L735,280L755,285L765,305L760,325L745,320L735,295L715,285Z',
    center: [740, 300]
  },
  {
    id: 'ibaraki',
    name: 'Ibaraki',
    region: 'kanto',
    path: 'M755,285L775,280L795,290L810,315L820,340L805,345L780,335L765,305L755,285Z',
    center: [785, 315]
  },

  // Chubu
  {
    id: 'yamanashi',
    name: 'Yamanashi',
    region: 'chubu',
    path: 'M675,355L695,385L700,405L720,415L735,450L720,470L695,475L675,465L660,450L655,425L665,395L675,370Z',
    center: [690, 415]
  },
  {
    id: 'shizuoka',
    name: 'Shizuoka', 
    region: 'chubu',
    path: 'M720,470L735,450L760,455L785,445L795,420L815,435L835,455L825,485L800,505L775,510L750,500L725,485Z',
    center: [775, 475]
  },
  {
    id: 'aichi',
    name: 'Aichi',
    region: 'chubu',
    path: 'M625,475L650,470L675,465L695,475L720,470L725,485L705,505L680,515L655,510L635,495Z',
    center: [675, 490]
  },
  
  // Kansai
  {
    id: 'kyoto',
    name: 'Kyoto',
    region: 'kansai',
    path: 'M585,485L610,480L635,485L655,505L650,525L625,535L600,530L580,515L575,495Z',
    center: [615, 505]
  },
  {
    id: 'osaka',
    name: 'Osaka',
    region: 'kansai', 
    path: 'M625,535L650,525L675,535L685,555L675,575L650,585L625,580L605,565L610,545Z',
    center: [645, 555]
  },
  {
    id: 'nara',
    name: 'Nara',
    region: 'kansai',
    path: 'M655,505L680,515L705,505L725,485L745,500L735,525L715,545L690,550L670,540L650,525Z',
    center: [690, 520]
  },
  {
    id: 'hyogo',
    name: 'Hyogo',
    region: 'kansai',
    path: 'M575,495L580,515L600,530L625,535L610,545L605,565L580,575L555,570L535,555L540,535L555,515Z',
    center: [575, 535]
  },

  // Chugoku  
  {
    id: 'hiroshima',
    name: 'Hiroshima',
    region: 'chugoku',
    path: 'M485,575L510,570L535,575L555,590L545,615L520,625L495,620L475,605L470,585Z',
    center: [510, 595]
  },
  {
    id: 'okayama',
    name: 'Okayama',
    region: 'chugoku',
    path: 'M535,555L555,570L580,575L605,565L625,580L615,605L590,615L565,610L545,595L535,575Z',
    center: [575, 585]
  },

  // Shikoku
  {
    id: 'kagawa',
    name: 'Kagawa',
    region: 'shikoku',
    path: 'M565,610L590,615L615,605L635,615L630,635L605,645L580,640L565,625Z',
    center: [595, 625]
  },
  {
    id: 'ehime',
    name: 'Ehime',
    region: 'shikoku',
    path: 'M520,625L545,615L565,625L580,640L575,665L550,675L525,670L505,655L510,635Z',
    center: [545, 645]
  },

  // Kyushu
  {
    id: 'fukuoka',
    name: 'Fukuoka',
    region: 'kyushu',
    path: 'M425,665L450,660L475,665L485,685L480,705L455,715L430,710L415,695L420,675Z',
    center: [450, 685]
  },
  {
    id: 'kumamoto',
    name: 'Kumamoto',
    region: 'kyushu', 
    path: 'M455,715L480,705L505,715L510,735L495,755L470,765L445,760L435,745L445,725Z',
    center: [470, 735]
  },
  {
    id: 'kagoshima',
    name: 'Kagoshima',
    region: 'kyushu',
    path: 'M445,760L470,765L495,755L510,735L520,755L515,785L490,805L465,800L450,785L445,765Z',
    center: [480, 775]
  },

  // Okinawa
  {
    id: 'okinawa',
    name: 'Okinawa', 
    region: 'okinawa',
    path: 'M325,885L350,880L375,885L380,905L375,925L350,935L325,930L320,910Z',
    center: [350, 910]
  }
];

// Featured destinations for each region
export const regionDestinations = {
  kanto: [
    { name: 'Tokyo', nameEn: 'Tokyo' },
    { name: 'Hakone', nameEn: 'Hakone' },
    { name: 'Nikko', nameEn: 'Nikko' }
  ],
  kansai: [
    { name: 'Kyoto', nameEn: 'Kyoto' },
    { name: 'Osaka', nameEn: 'Osaka' },
    { name: 'Nara', nameEn: 'Nara' }
  ],
  hokkaido: [
    { name: 'Sapporo', nameEn: 'Sapporo' },
    { name: 'Furano', nameEn: 'Furano' },
    { name: 'Hakodate', nameEn: 'Hakodate' }
  ],
  // Add more destinations for other regions as needed
};