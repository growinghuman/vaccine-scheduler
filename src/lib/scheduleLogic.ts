import { addWeeks, addMonths, isAfter, isBefore, isToday, format } from 'date-fns'
import { VACCINE_RULES, VACCINE_INFO } from '@/data/vaccineData'
import type { DoseHistory, ScheduledDose, VaccineType } from '@/types'

const AGE_LABELS: Record<number, string> = {
  0: 'At birth',
  1: '1 month',
  2: '2 months',
  4: '4 months',
  6: '6 months',
  12: '12 months',
  15: '15 months',
  18: '18 months',
  24: '24 months',
  48: '4 years',
}

function getAgeLabel(months: number): string {
  return AGE_LABELS[months] ?? `${months} months`
}

function getDoseStatus(scheduledDate: Date, today: Date): ScheduledDose['status'] {
  if (isBefore(scheduledDate, today) && !isToday(scheduledDate)) return 'overdue'
  if (isToday(scheduledDate)) return 'due'
  if (isAfter(scheduledDate, today)) return 'upcoming'
  return 'upcoming'
}

/**
 * Calculate standard newborn vaccination schedule from DOB.
 */
export function calculateNewbornSchedule(dob: string): ScheduledDose[] {
  const dobDate = new Date(dob)
  const today = new Date()

  return VACCINE_RULES.map((rule) => {
    const info = VACCINE_INFO[rule.vaccineId]
    const scheduledDate = addMonths(dobDate, rule.standardAgeMonths)

    return {
      vaccineId: rule.vaccineId,
      vaccineName: info.name,
      vaccineKoreanName: info.koreanName,
      doseNumber: rule.doseNumber,
      scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
      ageLabel: getAgeLabel(rule.standardAgeMonths),
      status: getDoseStatus(scheduledDate, today),
    } satisfies ScheduledDose
  })
}

/**
 * Calculate catch-up schedule based on dose history.
 * For each dose not yet in history, next eligible date =
 *   max(DOB + minAgeWeeks, lastDoseDate + minIntervalWeeks)
 */
export function calculateCatchupSchedule(dob: string, history: DoseHistory[]): ScheduledDose[] {
  const dobDate = new Date(dob)
  const today = new Date()
  const result: ScheduledDose[] = []

  // Group history by vaccineId for quick lookup
  const historyMap = new Map<string, DoseHistory[]>()
  for (const dose of history) {
    const key = dose.vaccineId
    if (!historyMap.has(key)) historyMap.set(key, [])
    historyMap.get(key)!.push(dose)
  }

  // Process each unique vaccine
  const vaccineIds = [...new Set(VACCINE_RULES.map((r) => r.vaccineId))]

  for (const vaccineId of vaccineIds) {
    const rules = VACCINE_RULES.filter((r) => r.vaccineId === vaccineId).sort(
      (a, b) => a.doseNumber - b.doseNumber
    )
    const given = (historyMap.get(vaccineId) ?? []).sort((a, b) => a.doseNumber - b.doseNumber)
    const info = VACCINE_INFO[vaccineId]

    // Mark completed doses
    for (const dose of given) {
      const rule = rules.find((r) => r.doseNumber === dose.doseNumber)
      if (!rule) continue
      result.push({
        vaccineId: vaccineId as VaccineType,
        vaccineName: info.name,
        vaccineKoreanName: info.koreanName,
        doseNumber: dose.doseNumber,
        scheduledDate: dose.dateGiven,
        ageLabel: getAgeLabel(rule.standardAgeMonths),
        status: 'completed',
      })
    }

    // Calculate next pending dose
    const nextDoseNumber = given.length + 1
    const nextRule = rules.find((r) => r.doseNumber === nextDoseNumber)
    if (!nextRule) continue

    const minAgeDate = addWeeks(dobDate, nextRule.minAgeWeeks)
    const lastGiven = given.at(-1)
    const minIntervalDate =
      lastGiven && nextRule.minIntervalWeeks
        ? addWeeks(new Date(lastGiven.dateGiven), nextRule.minIntervalWeeks)
        : minAgeDate

    const nextDate = isAfter(minIntervalDate, minAgeDate) ? minIntervalDate : minAgeDate

    result.push({
      vaccineId: vaccineId as VaccineType,
      vaccineName: info.name,
      vaccineKoreanName: info.koreanName,
      doseNumber: nextDoseNumber,
      scheduledDate: format(nextDate, 'yyyy-MM-dd'),
      ageLabel: getAgeLabel(nextRule.standardAgeMonths),
      status: getDoseStatus(nextDate, today),
    })
  }

  return result.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
}
