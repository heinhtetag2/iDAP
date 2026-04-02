export interface UserProfile {
  user_id: string
  birth_date: string | null
  gender: 'male' | 'female' | 'other' | null
  province: string | null
  district: string | null
  occupation: string | null
  education_level: 'primary' | 'secondary' | 'vocational' | 'bachelor' | 'master' | 'phd' | 'other' | null
  marital_status: 'single' | 'married' | 'divorced' | 'other' | null
  income_range: 'under_500k' | '500k_1m' | '1m_3m' | '3m_5m' | 'over_5m' | null
  interests: string[]
  languages: string[]
  profile_score: number
}

export interface ProfileScoreItem {
  field: string
  weight: number
  completed: boolean
}

export interface ProfileScore {
  total_score: number
  items: ProfileScoreItem[]
}
