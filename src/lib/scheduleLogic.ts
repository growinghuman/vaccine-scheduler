import { addWeeks, addMonths, isAfter, isBefore, isToday, format, differenceInWeeks } from 'date-fns'
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
 *
 * Doses in history are validated against CDC minimum age (DOB + minAgeWeeks)
 * and minimum interval (prevValidDose + minIntervalWeeks). A dose that violates
 * either constraint is marked 'invalid' and does NOT count toward series
 * progression — the next pending dose number is based only on valid doses.
 */
export function calculateCatchupSchedule(dob: string, history: DoseHistory[]): ScheduledDose[] {
  const dobDate = new Date(dob)
  const today = new Date()
  const result: ScheduledDose[] = []

  // Group history by vaccineId, sorted by date given
  const historyMap = new Map<string, DoseHistory[]>()
  for (const dose of history) {
    if (!historyMap.has(dose.vaccineId)) historyMap.set(dose.vaccineId, [])
    historyMap.get(dose.vaccineId)!.push(dose)
  }

  const vaccineIds = [...new Set(VACCINE_RULES.map((r) => r.vaccineId))]

  for (const vaccineId of vaccineIds) {
    const rules = VACCINE_RULES.filter((r) => r.vaccineId === vaccineId).sort(
      (a, b) => a.doseNumber - b.doseNumber,
    )
    // Sort by actual date given (not user-entered dose number)
    const given = (historyMap.get(vaccineId) ?? []).sort(
      (a, b) => new Date(a.dateGiven).getTime() - new Date(b.dateGiven).getTime(),
    )
    const info = VACCINE_INFO[vaccineId]

    let prevValidDate: Date | null = null
    let validDoseCount = 0

    for (const dose of given) {
      const rule = rules[validDoseCount] // next rule slot in series

      if (!rule) {
        // Given beyond the total series length — mark invalid
        result.push({
          vaccineId: vaccineId as VaccineType,
          vaccineName: info.name,
          vaccineKoreanName: info.koreanName,
          doseNumber: dose.doseNumber,
          scheduledDate: dose.dateGiven,
          ageLabel: '—',
          status: 'invalid',
        })
        continue
      }

      const givenDate = new Date(dose.dateGiven)
      const minAgeDate = addWeeks(dobDate, rule.minAgeWeeks)
      const isOldEnough = !isBefore(givenDate, minAgeDate)
      const hasMinInterval =
        !prevValidDate || !rule.minIntervalWeeks
          ? true
          : !isBefore(givenDate, addWeeks(prevValidDate, rule.minIntervalWeeks))
      const isValid = isOldEnough && hasMinInterval

      result.push({
        vaccineId: vaccineId as VaccineType,
        vaccineName: info.name,
        vaccineKoreanName: info.koreanName,
        // Valid doses get the correct sequential number; invalid keep what user entered
        doseNumber: isValid ? validDoseCount + 1 : dose.doseNumber,
        scheduledDate: dose.dateGiven,
        ageLabel: getAgeLabel(rule.standardAgeMonths),
        status: isValid ? 'completed' : 'invalid',
      })

      if (isValid) {
        prevValidDate = givenDate
        validDoseCount++
      }
    }

    // Conditional final-dose skip:
    // DTaP D5 not needed if D4 was given at age >= 4 years (208 weeks from DOB).
    // IPV D4 not needed if D3 was given at age >= 4 years (208 weeks from DOB).
    let effectiveRulesLength = rules.length
    if (prevValidDate) {
      const ageAtLastDoseWeeks = differenceInWeeks(prevValidDate, dobDate)
      if (vaccineId === 'DTaP' && validDoseCount === 4 && ageAtLastDoseWeeks >= 208) {
        effectiveRulesLength = 4 // D5 not needed
      }
      if (vaccineId === 'IPV' && validDoseCount === 3 && ageAtLastDoseWeeks >= 208) {
        effectiveRulesLength = 3 // D4 not needed
      }
    }

    // Schedule ALL remaining doses in a compressed catch-up sequence.
    // Each dose projects forward from the previous planned date; overdue doses
    // are assumed to be given "today" when projecting the next dose's earliest date.
    let projectedPrevDate = prevValidDate
    for (let i = validDoseCount; i < effectiveRulesLength; i++) {
      const rule = rules[i]
      const minAgeDate = addWeeks(dobDate, rule.minAgeWeeks)
      const minIntervalDate =
        projectedPrevDate && rule.minIntervalWeeks
          ? addWeeks(projectedPrevDate, rule.minIntervalWeeks)
          : minAgeDate
      const earliestDate = isAfter(minIntervalDate, minAgeDate) ? minIntervalDate : minAgeDate
      // If the earliest eligible date is in the past, reschedule to today
      const scheduledDate = isBefore(earliestDate, today) ? today : earliestDate

      // Max age check: if scheduled date is at or after DOB + maxAgeWeeks, stop the series
      if (rule.maxAgeWeeks !== undefined) {
        const maxAgeDate = addWeeks(dobDate, rule.maxAgeWeeks)
        if (!isBefore(scheduledDate, maxAgeDate)) break
      }

      result.push({
        vaccineId: vaccineId as VaccineType,
        vaccineName: info.name,
        vaccineKoreanName: info.koreanName,
        doseNumber: i + 1,
        scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
        ageLabel: getAgeLabel(rule.standardAgeMonths),
        status: getDoseStatus(scheduledDate, today),
      })

      projectedPrevDate = scheduledDate
    }
  }

  return result.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
}
