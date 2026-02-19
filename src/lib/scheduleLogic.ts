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
  if (AGE_LABELS[months] !== undefined) return AGE_LABELS[months]
  if (months >= 24) {
    const years = Math.floor(months / 12)
    const rem = months % 12
    if (rem === 0) return `${years} years`
    if (rem === 1) return `${years} years 1 month`
    return `${years} years ${rem} months`
  }
  return `${months} months`
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

  // Exclude from standard (newborn) schedule:
  //  - HPV D3: only for 3-dose series (D1 at ≥15yr); standard D1 is at 11yr
  //  - RotarixHRV: brand-specific 2-dose series; standard schedule uses RotaTeq (Rotavirus)
  //  - InfluenzaLAIV / InfluenzaRIV: user selects vaccine type; standard shows IIV only
  return VACCINE_RULES.filter(
    (rule) => !(rule.vaccineId === 'HPV' && rule.doseNumber === 3)
           && rule.vaccineId !== 'RotarixHRV'
           && rule.vaccineId !== 'InfluenzaLAIV'
           && rule.vaccineId !== 'InfluenzaRIV',
  ).map((rule) => {
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
    // InfluenzaLAIV and InfluenzaRIV are handled as part of the 'Influenza' group
    if (vaccineId === 'InfluenzaLAIV' || vaccineId === 'InfluenzaRIV') continue

    const rules = VACCINE_RULES.filter((r) => r.vaccineId === vaccineId).sort(
      (a, b) => a.doseNumber - b.doseNumber,
    )
    // Merge all Influenza subtypes into one group; annotate each dose with its actual type.
    // For non-Influenza vaccines _typeId === vaccineId.
    const isInfluenzaGroup = vaccineId === 'Influenza'
    const given: (DoseHistory & { _typeId: VaccineType })[] = isInfluenzaGroup
      ? [
          ...(historyMap.get('Influenza')     ?? []).map((d) => ({ ...d, _typeId: 'Influenza'     as VaccineType })),
          ...(historyMap.get('InfluenzaLAIV') ?? []).map((d) => ({ ...d, _typeId: 'InfluenzaLAIV' as VaccineType })),
          ...(historyMap.get('InfluenzaRIV')  ?? []).map((d) => ({ ...d, _typeId: 'InfluenzaRIV'  as VaccineType })),
        ].sort((a, b) => new Date(a.dateGiven).getTime() - new Date(b.dateGiven).getTime())
      : (historyMap.get(vaccineId) ?? [])
          .map((d) => ({ ...d, _typeId: vaccineId as VaccineType }))
          .sort((a, b) => new Date(a.dateGiven).getTime() - new Date(b.dateGiven).getTime())
    const info = VACCINE_INFO[vaccineId]

    let prevValidDate: Date | null = null
    let firstValidDoseDate: Date | null = null
    let validDoseCount = 0

    for (const dose of given) {
      // HPV 2-dose series: if D1 was before the 15th birthday (< 780w), the series
      // is complete after 2 doses — any additional dose is beyond the series length.
      if (vaccineId === 'HPV' && validDoseCount >= 2 && firstValidDoseDate) {
        const ageAtD1Weeks = differenceInWeeks(firstValidDoseDate, dobDate)
        if (ageAtD1Weeks < 780) {
          result.push({
            vaccineId: dose._typeId,
            vaccineName: VACCINE_INFO[dose._typeId].name,
            vaccineKoreanName: VACCINE_INFO[dose._typeId].koreanName,
            doseNumber: dose.doseNumber,
            scheduledDate: dose.dateGiven,
            ageLabel: '—',
            status: 'invalid',
          })
          continue
        }
      }

      const rule = rules[validDoseCount] // next rule slot in series

      if (!rule) {
        // Given beyond the total series length — mark invalid
        result.push({
          vaccineId: dose._typeId,
          vaccineName: VACCINE_INFO[dose._typeId].name,
          vaccineKoreanName: VACCINE_INFO[dose._typeId].koreanName,
          doseNumber: dose.doseNumber,
          scheduledDate: dose.dateGiven,
          ageLabel: '—',
          status: 'invalid',
        })
        continue
      }

      const givenDate = new Date(dose.dateGiven)
      // Influenza subtypes each have their own minimum age
      const doseTypeStr = dose._typeId as string
      const effectiveMinAgeWeeks = isInfluenzaGroup
        ? (doseTypeStr === 'InfluenzaLAIV' ? 104 : doseTypeStr === 'InfluenzaRIV' ? 936 : 26)
        : rule.minAgeWeeks
      // minAgeMonths (if set) uses exact calendar month (e.g. 1st birthday); overrides minAgeWeeks
      const minAgeDate = rule.minAgeMonths !== undefined
        ? addMonths(dobDate, rule.minAgeMonths)
        : addWeeks(dobDate, effectiveMinAgeWeeks)
      const isOldEnough = !isBefore(givenDate, minAgeDate)
      // IPV D3: minimum interval is age-dependent
      //   <4 years (208w) at time of dose → 4 weeks;  ≥4 years → 6 months (26w, final dose)
      // HPV D2: interval depends on series type determined by age at D1
      //   2-dose (D1 < 780w = 15yr): D1→D2 minimum 24w (6 months)
      //   3-dose (D1 ≥ 780w = 15yr): D1→D2 minimum 4w
      let effectiveMinInterval = rule.minIntervalWeeks
      if (vaccineId === 'IPV' && validDoseCount === 2 && rule.minIntervalWeeks !== undefined) {
        effectiveMinInterval = differenceInWeeks(givenDate, dobDate) >= 208 ? 26 : 4
      }
      if (vaccineId === 'HPV' && validDoseCount === 1 && firstValidDoseDate) {
        const ageAtD1Weeks = differenceInWeeks(firstValidDoseDate, dobDate)
        effectiveMinInterval = ageAtD1Weeks < 780 ? 24 : 4
      }
      const hasMinInterval =
        !prevValidDate || !effectiveMinInterval
          ? true
          : !isBefore(givenDate, addWeeks(prevValidDate, effectiveMinInterval))
      // HPV D3 (3-dose series): additionally enforce D1→D3 minimum 24 weeks (5 months)
      const hasHpvD1ToD3Min =
        !(vaccineId === 'HPV' && validDoseCount === 2 && firstValidDoseDate)
        || differenceInWeeks(givenDate, firstValidDoseDate) >= 24
      const isValid = isOldEnough && hasMinInterval && hasHpvD1ToD3Min

      result.push({
        vaccineId: dose._typeId,
        vaccineName: VACCINE_INFO[dose._typeId].name,
        vaccineKoreanName: VACCINE_INFO[dose._typeId].koreanName,
        // Valid doses get the correct sequential number; invalid keep what user entered
        doseNumber: isValid ? validDoseCount + 1 : dose.doseNumber,
        scheduledDate: dose.dateGiven,
        ageLabel: getAgeLabel(rule.standardAgeMonths),
        status: isValid ? 'completed' : 'invalid',
      })

      if (isValid) {
        if (firstValidDoseDate === null) firstValidDoseDate = givenDate
        prevValidDate = givenDate
        validDoseCount++
      }
    }

    // Age-dependent catch-up series length for Hib and PCV.
    // First dose date is taken from history (firstValidDoseDate) or assumed to be today.
    //
    // Hib (CDC catch-up table — exact rules):
    //   D1 at 7–11m (30–51w): 3 doses — D2 4w after D1, D3/final at ≥12m or 8w after D2
    //   D1 at 12–14m (52–64w): 2 doses — D2/final 8w after D1
    //   D1 before 12m AND D2 before 15m (validDoseCount=2): D3/final 8w after D2
    //   1 dose at 15m+ (≥65w): done — no further doses
    //   Unvaccinated at 15–59m (≥65w): 1 dose
    //   Unvaccinated at 60m+ (≥260w): none (not recommended)
    //
    // PCV (CDC catch-up table):
    //   < 12 months  (< 52w): standard 4-dose series
    //   12–23 months (52–103w): 2 doses — D2 (booster) 8w after D1
    //   24+ months  (≥104w): 1 dose only (healthy children)
    let effectiveRules = rules
    if (vaccineId === 'Hib') {
      const firstDoseDate = firstValidDoseDate ?? today
      const ageW = differenceInWeeks(firstDoseDate, dobDate)

      if (ageW >= 260) {
        effectiveRules = []
      } else if (ageW >= 65) {
        effectiveRules = [rules[0]]  // 1 dose only
      } else if (ageW >= 52) {
        effectiveRules = [rules[0], rules[3]]  // 2-dose: booster 8w after D1, ≥12m
      } else if (ageW >= 30) {
        effectiveRules = [rules[0], rules[1], rules[3]]  // 3-dose
      } else {
        // D1 before 7 months (standard 4-dose territory), but:
        // CDC rule: if D1 before 12m AND D2 before 15m → D3 is the FINAL dose (8w after D2)
        if (validDoseCount === 2 && firstValidDoseDate && prevValidDate) {
          const d1AgeW = differenceInWeeks(firstValidDoseDate, dobDate)
          const d2AgeW = differenceInWeeks(prevValidDate, dobDate)
          if (d1AgeW < 52 && d2AgeW < 65) {
            effectiveRules = [rules[0], rules[1], rules[3]]  // D3/final uses booster rule
          }
        }
        // else: standard 4-dose series (effectiveRules = rules)
      }
    }

    if (vaccineId === 'PCV') {
      const firstDoseDate = firstValidDoseDate ?? today
      const firstDoseAgeW = differenceInWeeks(firstDoseDate, dobDate)
      const todayAgeW = differenceInWeeks(today, dobDate)

      if (firstDoseAgeW >= 104) {
        // D1 at 24m+: 1 dose only (healthy children)
        effectiveRules = [rules[0]]
      } else if (firstDoseAgeW >= 52) {
        // D1 at 12-23m: 2 doses, D2=booster (8w after D1, at ≥12m)
        effectiveRules = [rules[0], rules[3]]
      } else if (validDoseCount >= 1 && validDoseCount < 4 && todayAgeW >= 52) {
        // D1 was before 12m AND child is now ≥12m old:
        // the next dose is the FINAL booster (8w min interval, ≥12m age)
        effectiveRules = [...rules.slice(0, validDoseCount), rules[3]]
      }
      // else: D1 before 12m, child still < 12m → standard 4-dose series
    }

    // Influenza (IIV / LAIV / RIV): annual vaccine.
    // Series length depends on age at first dose and prior dose count.
    //   Age ≥9yr (≥468w) at D1: 1 dose only (RIV min age 18yr → always 1 dose)
    //   Age <9yr with ≥2 prior valid doses: series already complete (no projection)
    //   Age <9yr with <2 prior valid doses: 2-dose series (D1→D2 ≥4w)
    if (isInfluenzaGroup) {
      const firstDoseDate = firstValidDoseDate ?? today
      const ageAtD1Weeks = differenceInWeeks(firstDoseDate, dobDate)
      if (ageAtD1Weeks >= 468) {
        effectiveRules = [rules[0]]   // ≥9yr: 1 dose only
      } else if (validDoseCount >= 2) {
        effectiveRules = []           // <9yr with ≥2 prior doses: complete, nothing to project
      }
      // else: <9yr with <2 prior doses → standard 2-dose series (effectiveRules = rules)
    }

    // HPV: 2-dose series if D1 before 15th birthday (< 780w); 3-dose series if D1 ≥15 years.
    // firstValidDoseDate is the actual D1 date; fall back to today for unvaccinated children.
    if (vaccineId === 'HPV') {
      const firstDoseDate = firstValidDoseDate ?? today
      const ageAtD1Weeks = differenceInWeeks(firstDoseDate, dobDate)
      if (ageAtD1Weeks < 780) {
        effectiveRules = rules.slice(0, 2)  // 2-dose series
      }
      // else: ≥15 years → 3-dose series (effectiveRules = rules, all 3)
    }

    // Conditional final-dose skips:
    // DTaP D5 not needed if D4 was given at age >= 4 years (208 weeks from DOB).
    // IPV D4 not needed if D3 was given at age >= 4 years (208 weeks from DOB).
    // PCV: no further doses if most recent dose was at age >= 24 months (104 weeks).
    let effectiveRulesLength = effectiveRules.length
    if (prevValidDate) {
      const ageAtLastDoseWeeks = differenceInWeeks(prevValidDate, dobDate)
      if (vaccineId === 'DTaP' && validDoseCount === 4 && ageAtLastDoseWeeks >= 208) {
        effectiveRulesLength = 4 // D5 not needed
      }
      if (vaccineId === 'IPV' && validDoseCount === 3 && ageAtLastDoseWeeks >= 208) {
        effectiveRulesLength = 3 // D4 not needed
      }
      if (vaccineId === 'PCV' && ageAtLastDoseWeeks >= 104) {
        effectiveRulesLength = validDoseCount // no more doses after 24m+
      }
    }

    // Schedule ALL remaining doses in a compressed catch-up sequence.
    // Each dose projects forward from the previous planned date; overdue doses
    // are assumed to be given "today" when projecting the next dose's earliest date.
    let firstDoseDate: Date | null = firstValidDoseDate  // tracked for HepB 16-week rule
    let projectedPrevDate = prevValidDate
    for (let i = validDoseCount; i < effectiveRulesLength; i++) {
      const rule = effectiveRules[i]
      if (!rule) break
      const minAgeDate = rule.minAgeMonths !== undefined
        ? addMonths(dobDate, rule.minAgeMonths)
        : addWeeks(dobDate, rule.minAgeWeeks)
      const minIntervalDate =
        projectedPrevDate && rule.minIntervalWeeks
          ? addWeeks(projectedPrevDate, rule.minIntervalWeeks)
          : minAgeDate
      let earliestDate = isAfter(minIntervalDate, minAgeDate) ? minIntervalDate : minAgeDate

      // HepB D3: CDC requires at least 16 weeks after D1 in addition to 8w after D2
      if (vaccineId === 'HepB' && i === 2 && firstDoseDate) {
        const d1Plus16w = addWeeks(firstDoseDate, 16)
        if (isAfter(d1Plus16w, earliestDate)) earliestDate = d1Plus16w
      }

      // HPV D2: 2-dose series requires D1→D2 ≥24w (6 months); 3-dose uses 4w from rule
      if (vaccineId === 'HPV' && i === 1 && effectiveRulesLength === 2 && firstDoseDate) {
        const d1Plus24w = addWeeks(firstDoseDate, 24)
        if (isAfter(d1Plus24w, earliestDate)) earliestDate = d1Plus24w
      }
      // HPV D3: 3-dose series requires D1→D3 ≥24w (5 months) in addition to D2→D3 ≥12w
      if (vaccineId === 'HPV' && i === 2 && firstDoseDate) {
        const d1Plus24w = addWeeks(firstDoseDate, 24)
        if (isAfter(d1Plus24w, earliestDate)) earliestDate = d1Plus24w
      }

      // IPV D3: interval is age-dependent
      //   If child is <4 years (208w) at projected D3 date → 4-week interval (D4 still needed)
      //   If child is ≥4 years at projected D3 date → 6-month (26w) interval, D3 is final
      if (vaccineId === 'IPV' && i === 2 && projectedPrevDate) {
        const ageAtD3Weeks = differenceInWeeks(earliestDate, dobDate)
        if (ageAtD3Weeks >= 208) {
          const d2Plus26w = addWeeks(projectedPrevDate, 26)
          if (isAfter(d2Plus26w, earliestDate)) earliestDate = d2Plus26w
          effectiveRulesLength = 3  // D3 is the final dose when given at ≥4 years
        }
      }

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

      if (firstDoseDate === null) firstDoseDate = scheduledDate  // record projected D1
      projectedPrevDate = scheduledDate
    }
  }

  return result.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
}
