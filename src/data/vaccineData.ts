import type { VaccineInfo, VaccineRule } from '@/types'

// Vaccine information with CDC VIS-based side effects
export const VACCINE_INFO: Record<string, VaccineInfo> = {
  HepB: {
    id: 'HepB',
    name: 'Hepatitis B',
    koreanName: 'Hepatitis B',
    description: 'Prevents infection caused by the hepatitis B virus (HBV).',
    commonSideEffects: ['Soreness or redness at injection site', 'Low-grade fever', 'Fatigue'],
    seriousSideEffects: ['Severe allergic reaction (anaphylaxis)'],
  },
  DTaP: {
    id: 'DTaP',
    name: 'DTaP',
    koreanName: 'DTaP',
    description: 'Combination vaccine that protects against diphtheria, tetanus, and pertussis (whooping cough).',
    commonSideEffects: [
      'Redness, swelling, or pain at injection site',
      'Mild fever (below 101°F / 38.3°C)',
      'Fussiness or decreased appetite',
      'Drowsiness',
    ],
    seriousSideEffects: [
      'High fever (above 105°F / 40.5°C)',
      'Crying for more than 3 hours',
      'Seizure',
      'Severe allergic reaction',
    ],
  },
  IPV: {
    id: 'IPV',
    name: 'IPV',
    koreanName: 'IPV',
    description: 'Inactivated poliovirus vaccine; prevents poliomyelitis.',
    commonSideEffects: ['Redness or pain at injection site', 'Low-grade fever'],
    seriousSideEffects: ['Severe allergic reaction (anaphylaxis)'],
  },
  MMR: {
    id: 'MMR',
    name: 'MMR',
    koreanName: 'MMR',
    description: 'Combination vaccine that protects against measles, mumps, and rubella.',
    commonSideEffects: [
      'Soreness at injection site',
      'Mild rash or fever 7–12 days after vaccination',
      'Joint pain or stiffness (mainly in adults)',
      'Mild lymph node swelling',
    ],
    seriousSideEffects: [
      'Severe allergic reaction',
      'Thrombocytopenic purpura (low platelet count)',
      'Febrile seizure',
    ],
  },
  Varicella: {
    id: 'Varicella',
    name: 'Varicella',
    koreanName: 'Varicella',
    description: 'Prevents chickenpox caused by the varicella-zoster virus.',
    commonSideEffects: [
      'Soreness or redness at injection site',
      'Low-grade fever',
      'Mild chickenpox-like rash after vaccination',
    ],
    seriousSideEffects: ['Severe allergic reaction', 'Pneumonia', 'Encephalitis (very rare)'],
  },
  Hib: {
    id: 'Hib',
    name: 'Hib',
    koreanName: 'Hib',
    description: 'Prevents meningitis, pneumonia, and epiglottitis caused by Haemophilus influenzae type b.',
    commonSideEffects: ['Redness, swelling, or pain at injection site', 'Fever', 'Fussiness'],
    seriousSideEffects: ['Severe allergic reaction'],
  },
  PCV: {
    id: 'PCV',
    name: 'PCV15/PCV20',
    koreanName: 'PCV15/PCV20',
    description: 'Prevents pneumonia, meningitis, and bacteremia caused by Streptococcus pneumoniae.',
    commonSideEffects: [
      'Redness, swelling, or pain at injection site',
      'Fever',
      'Fussiness or decreased appetite',
      'Drowsiness',
    ],
    seriousSideEffects: ['Severe allergic reaction'],
  },
  HepA: {
    id: 'HepA',
    name: 'Hepatitis A',
    koreanName: 'Hepatitis A',
    description: 'Prevents infection caused by the hepatitis A virus (HAV).',
    commonSideEffects: ['Soreness or redness at injection site', 'Headache', 'Loss of appetite', 'Fatigue'],
    seriousSideEffects: ['Severe allergic reaction (anaphylaxis)'],
  },
  Rotavirus: {
    id: 'Rotavirus',
    name: 'RotaTeq (RV5)',
    koreanName: 'RotaTeq',
    description: 'Prevents severe diarrhea and vomiting caused by rotavirus (RotaTeq, 3-dose series).',
    commonSideEffects: ['Fussiness or irritability', 'Temporary diarrhea or vomiting'],
    seriousSideEffects: ['Intussusception / bowel obstruction (very rare)'],
  },
  RotarixHRV: {
    id: 'RotarixHRV',
    name: 'Rotarix (HRV)',
    koreanName: 'Rotarix',
    description: 'Prevents severe diarrhea and vomiting caused by rotavirus (Rotarix, 2-dose series).',
    commonSideEffects: ['Fussiness or irritability', 'Temporary diarrhea or vomiting'],
    seriousSideEffects: ['Intussusception / bowel obstruction (very rare)'],
  },
  Tdap: {
    id: 'Tdap',
    name: 'Tdap',
    koreanName: 'Tdap',
    description: 'Adolescent/adult booster protecting against tetanus, diphtheria, and pertussis (whooping cough).',
    commonSideEffects: [
      'Pain, redness, or swelling at injection site',
      'Mild fever',
      'Headache',
      'Fatigue',
      'Nausea or stomach upset',
    ],
    seriousSideEffects: [
      'Severe allergic reaction (anaphylaxis)',
      'Shoulder injury related to vaccine administration (SIRVA)',
    ],
  },
  MCV4: {
    id: 'MCV4',
    name: 'MenACWY',
    koreanName: 'MenACWY',
    description: 'Prevents meningococcal disease caused by Neisseria meningitidis serogroups A, C, W, and Y.',
    commonSideEffects: [
      'Pain, redness, or swelling at injection site',
      'Mild fever',
      'Headache',
      'Fatigue',
    ],
    seriousSideEffects: [
      'Severe allergic reaction (anaphylaxis)',
      'Guillain-Barré syndrome (very rare)',
    ],
  },
  HPV: {
    id: 'HPV',
    name: 'HPV',
    koreanName: 'HPV',
    description: 'Prevents infection by human papillomavirus strains that cause cervical cancer, genital warts, and other HPV-related cancers.',
    commonSideEffects: [
      'Pain, redness, or swelling at injection site',
      'Dizziness or fainting (sit for 15 min after vaccination)',
      'Headache',
      'Nausea',
      'Mild fever',
    ],
    seriousSideEffects: [
      'Severe allergic reaction (anaphylaxis)',
    ],
  },
  MenB: {
    id: 'MenB',
    name: 'MenB',
    koreanName: 'MenB',
    description: 'Prevents meningococcal disease caused by Neisseria meningitidis serogroup B.',
    commonSideEffects: [
      'Pain, redness, or swelling at injection site',
      'Fatigue',
      'Headache',
      'Muscle or joint pain',
      'Fever or chills',
      'Nausea',
    ],
    seriousSideEffects: [
      'Severe allergic reaction (anaphylaxis)',
    ],
  },
}

// CDC Birth-18 Years Immunization Schedule 2026
// standardAgeMonths: recommended age in months (0 = birth)
// minAgeWeeks: minimum age in weeks for this dose
// minIntervalWeeks: minimum interval from previous dose in weeks
export const VACCINE_RULES: VaccineRule[] = [
  // Hepatitis B (HepB)
  { vaccineId: 'HepB', doseNumber: 1, standardAgeMonths: 0, minAgeWeeks: 0 },
  { vaccineId: 'HepB', doseNumber: 2, standardAgeMonths: 2, minAgeWeeks: 4, minIntervalWeeks: 4 },
  { vaccineId: 'HepB', doseNumber: 3, standardAgeMonths: 6, minAgeWeeks: 24, minIntervalWeeks: 8 },

  // DTaP — approved only for children < 7 years (< 364 weeks); use Tdap at age 7+
  { vaccineId: 'DTaP', doseNumber: 1, standardAgeMonths: 2, minAgeWeeks: 6, maxAgeWeeks: 364 },
  { vaccineId: 'DTaP', doseNumber: 2, standardAgeMonths: 4, minAgeWeeks: 10, minIntervalWeeks: 4, maxAgeWeeks: 364 },
  { vaccineId: 'DTaP', doseNumber: 3, standardAgeMonths: 6, minAgeWeeks: 14, minIntervalWeeks: 4, maxAgeWeeks: 364 },
  { vaccineId: 'DTaP', doseNumber: 4, standardAgeMonths: 15, minAgeWeeks: 52, minIntervalWeeks: 24, maxAgeWeeks: 364 },
  { vaccineId: 'DTaP', doseNumber: 5, standardAgeMonths: 48, minAgeWeeks: 192, minIntervalWeeks: 24, maxAgeWeeks: 364 },

  // IPV
  // D3 interval is age-dependent (handled in scheduleLogic):
  //   4 weeks if child <4 years at D3; 6 months (26w) if ≥4 years (D3 is then final)
  // D4: 6 months (26w) after D3, minimum age 4 years (208w) — only if D3 given <4 years
  { vaccineId: 'IPV', doseNumber: 1, standardAgeMonths: 2, minAgeWeeks: 6 },
  { vaccineId: 'IPV', doseNumber: 2, standardAgeMonths: 4, minAgeWeeks: 10, minIntervalWeeks: 4 },
  { vaccineId: 'IPV', doseNumber: 3, standardAgeMonths: 6, minAgeWeeks: 14, minIntervalWeeks: 4 },
  { vaccineId: 'IPV', doseNumber: 4, standardAgeMonths: 48, minAgeWeeks: 208, minIntervalWeeks: 26 },

  // MMR
  { vaccineId: 'MMR', doseNumber: 1, standardAgeMonths: 12, minAgeWeeks: 52 },
  { vaccineId: 'MMR', doseNumber: 2, standardAgeMonths: 48, minAgeWeeks: 192, minIntervalWeeks: 4 },

  // Varicella
  { vaccineId: 'Varicella', doseNumber: 1, standardAgeMonths: 12, minAgeWeeks: 52 },
  { vaccineId: 'Varicella', doseNumber: 2, standardAgeMonths: 48, minAgeWeeks: 192, minIntervalWeeks: 12 },

  // Hib — not recommended for healthy children >= 5 years (260 weeks)
  { vaccineId: 'Hib', doseNumber: 1, standardAgeMonths: 2, minAgeWeeks: 6, maxAgeWeeks: 260 },
  { vaccineId: 'Hib', doseNumber: 2, standardAgeMonths: 4, minAgeWeeks: 10, minIntervalWeeks: 4, maxAgeWeeks: 260 },
  { vaccineId: 'Hib', doseNumber: 3, standardAgeMonths: 6, minAgeWeeks: 14, minIntervalWeeks: 4, maxAgeWeeks: 260 },
  { vaccineId: 'Hib', doseNumber: 4, standardAgeMonths: 12, minAgeWeeks: 52, minIntervalWeeks: 8, maxAgeWeeks: 260 },

  // PCV (Pneumococcal) — not recommended for healthy children >= 5 years (260 weeks)
  { vaccineId: 'PCV', doseNumber: 1, standardAgeMonths: 2, minAgeWeeks: 6, maxAgeWeeks: 260 },
  { vaccineId: 'PCV', doseNumber: 2, standardAgeMonths: 4, minAgeWeeks: 10, minIntervalWeeks: 4, maxAgeWeeks: 260 },
  { vaccineId: 'PCV', doseNumber: 3, standardAgeMonths: 6, minAgeWeeks: 14, minIntervalWeeks: 4, maxAgeWeeks: 260 },
  { vaccineId: 'PCV', doseNumber: 4, standardAgeMonths: 12, minAgeWeeks: 52, minIntervalWeeks: 8, maxAgeWeeks: 260 },

  // Hepatitis A (HepA)
  { vaccineId: 'HepA', doseNumber: 1, standardAgeMonths: 12, minAgeWeeks: 52 },
  { vaccineId: 'HepA', doseNumber: 2, standardAgeMonths: 18, minAgeWeeks: 78, minIntervalWeeks: 26 },

  // Rotavirus (RotaTeq, RV5) — 3-dose series
  // D1: must start by 14w6d (max 15w); series must be complete by 8 months (max 32w)
  { vaccineId: 'Rotavirus', doseNumber: 1, standardAgeMonths: 2, minAgeWeeks: 6, maxAgeWeeks: 15 },
  { vaccineId: 'Rotavirus', doseNumber: 2, standardAgeMonths: 4, minAgeWeeks: 10, minIntervalWeeks: 4, maxAgeWeeks: 32 },
  { vaccineId: 'Rotavirus', doseNumber: 3, standardAgeMonths: 6, minAgeWeeks: 14, minIntervalWeeks: 4, maxAgeWeeks: 32 },

  // Rotavirus (Rotarix, HRV) — 2-dose series
  // D1: same start window as RotaTeq; series must be complete by 6 months (max 24w)
  // Not shown in standard (newborn) schedule — user selects brand in catch-up history
  { vaccineId: 'RotarixHRV', doseNumber: 1, standardAgeMonths: 2, minAgeWeeks: 6, maxAgeWeeks: 15 },
  { vaccineId: 'RotarixHRV', doseNumber: 2, standardAgeMonths: 4, minAgeWeeks: 10, minIntervalWeeks: 4, maxAgeWeeks: 24 },

  // Tdap — adolescent booster at age 11–12 years (routine); catch-up for ages 7–18
  // minAgeWeeks: 364 = 7 years; maxAgeWeeks: 936 = 18 years
  { vaccineId: 'Tdap', doseNumber: 1, standardAgeMonths: 132, minAgeWeeks: 364, maxAgeWeeks: 936 },

  // MenACWY (MCV4) — D1 at 11–12 years, D2 booster at 16 years
  // D2 minAgeWeeks: 832 = 16 years; minIntervalWeeks: 8 (catch-up minimum)
  { vaccineId: 'MCV4', doseNumber: 1, standardAgeMonths: 132, minAgeWeeks: 572 },
  { vaccineId: 'MCV4', doseNumber: 2, standardAgeMonths: 192, minAgeWeeks: 832, minIntervalWeeks: 8 },

  // HPV — series length depends on age at D1 (handled in scheduleLogic):
  //   D1 before 15th birthday (< 780w): 2-dose series, D1→D2 ≥24w (6 months)
  //   D1 at ≥15 years (≥780w):          3-dose series, D1→D2 ≥4w, D2→D3 ≥12w, D1→D3 ≥24w
  // D3 is excluded from the standard (newborn) schedule — standard D1 is at 11yr (<15yr)
  // minAgeWeeks: 468 = 9 years
  { vaccineId: 'HPV', doseNumber: 1, standardAgeMonths: 132, minAgeWeeks: 468 },
  { vaccineId: 'HPV', doseNumber: 2, standardAgeMonths: 138, minAgeWeeks: 468, minIntervalWeeks: 4 },
  { vaccineId: 'HPV', doseNumber: 3, standardAgeMonths: 144, minAgeWeeks: 468, minIntervalWeeks: 12 },

  // MenB — 2-dose series at 16–23 years (shared clinical decision-making)
  // minAgeWeeks: 832 = 16 years; minIntervalWeeks: 4 (1 month minimum, Bexsero 2-dose schedule)
  { vaccineId: 'MenB', doseNumber: 1, standardAgeMonths: 192, minAgeWeeks: 832 },
  { vaccineId: 'MenB', doseNumber: 2, standardAgeMonths: 193, minAgeWeeks: 832, minIntervalWeeks: 4 },
]
