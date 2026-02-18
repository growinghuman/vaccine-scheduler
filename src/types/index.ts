export type VaccineType =
  | 'HepB'
  | 'DTaP'
  | 'IPV'
  | 'MMR'
  | 'Varicella'
  | 'Hib'
  | 'PCV'
  | 'HepA'
  | 'Rotavirus'

export interface VaccineInfo {
  id: VaccineType
  name: string
  koreanName: string
  description: string
  commonSideEffects: string[]
  seriousSideEffects: string[]
}

export interface VaccineRule {
  vaccineId: VaccineType
  doseNumber: number
  standardAgeMonths: number
  minAgeWeeks: number
  minIntervalWeeks?: number
}

export type ScheduleMode = 'newborn' | 'catchup'

export interface ChildInfo {
  name: string
  dob: string // ISO date string (YYYY-MM-DD)
  gender: 'male' | 'female'
}

export interface DoseHistory {
  vaccineId: VaccineType
  doseNumber: number
  dateGiven: string // ISO date string
}

export interface ScheduledDose {
  vaccineId: VaccineType
  vaccineName: string
  vaccineKoreanName: string
  doseNumber: number
  scheduledDate: string // ISO date string
  ageLabel: string // e.g. "생후 2개월"
  status: 'upcoming' | 'due' | 'overdue' | 'completed'
}

export interface SchedulerFormValues {
  childInfo: ChildInfo
  mode: ScheduleMode
  history: DoseHistory[]
}
