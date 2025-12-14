export interface CheckIn {
  id: string
  userId: string
  countryCode: string
  country: string
  countryFlag: string
  regionId?: string
  region?: string
  cityId: string
  city: string
  latitude: number
  longitude: number
  visitedAt: string
  note?: string
  photos?: string[]
  tripId?: string
  createdAt: string
  updatedAt: string
}

export interface CheckInStats {
  totalCountries: number
  totalCities: number
  countries: CountryStat[]
}

export interface CountryStat {
  countryCode: string
  country: string
  flag: string
  citiesCount: number
}

export interface CheckInListResponse {
  checkins: CheckIn[]
  stats: CheckInStats
}

export interface CreateCheckInRequest {
  countryCode: string
  country: string
  countryFlag: string
  regionId?: string
  region?: string
  cityId: string
  city: string
  latitude: number
  longitude: number
  visitedAt: string
  note?: string
  tripId?: string
}

export interface UpdateCheckInRequest {
  visitedAt?: string
  note?: string
  photos?: string[]
  tripId?: string
}
