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
    name: 'Rotavirus',
    koreanName: 'Rotavirus',
    description: 'Prevents severe diarrhea and vomiting caused by rotavirus infection.',
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
  { vaccineId: 'IPV', doseNumber: 1, standardAgeMonths: 2, minAgeWeeks: 6 },
  { vaccineId: 'IPV', doseNumber: 2, standardAgeMonths: 4, minAgeWeeks: 10, minIntervalWeeks: 4 },
  { vaccineId: 'IPV', doseNumber: 3, standardAgeMonths: 6, minAgeWeeks: 14, minIntervalWeeks: 4 },
  { vaccineId: 'IPV', doseNumber: 4, standardAgeMonths: 48, minAgeWeeks: 192, minIntervalWeeks: 24 },

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

  // Rotavirus — D1 must be given before 15 weeks of age; any dose before 8 months (35 weeks)
  { vaccineId: 'Rotavirus', doseNumber: 1, standardAgeMonths: 2, minAgeWeeks: 6, maxAgeWeeks: 15 },
  { vaccineId: 'Rotavirus', doseNumber: 2, standardAgeMonths: 4, minAgeWeeks: 10, minIntervalWeeks: 4, maxAgeWeeks: 35 },
  { vaccineId: 'Rotavirus', doseNumber: 3, standardAgeMonths: 6, minAgeWeeks: 14, minIntervalWeeks: 4, maxAgeWeeks: 35 },

  // Tdap — adolescent booster at age 11–12 years (routine); catch-up for ages 7–18
  // minAgeWeeks: 364 = 7 years (earliest catch-up age)
  // maxAgeWeeks: 936 = 18 years (end of childhood/adolescent schedule)
  { vaccineId: 'Tdap', doseNumber: 1, standardAgeMonths: 132, minAgeWeeks: 364, maxAgeWeeks: 936 },
]
