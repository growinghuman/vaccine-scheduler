import type { VaccineType } from '@/types'

export type ComboComponent = {
  vaccineId: VaccineType
  defaultDose: number
}

export type ComboVaccine = {
  id: string
  name: string          // full name shown in dropdown
  tag: string           // short tag shown in history list
  components: ComboComponent[]
}

// CDC-approved combination vaccines available in the US (2026)
export const COMBO_VACCINES: ComboVaccine[] = [
  {
    id: 'vaxelis',
    name: 'Vaxelis — DTaP-IPV-Hib-HepB',
    tag: 'Vaxelis',
    components: [
      { vaccineId: 'DTaP', defaultDose: 1 },
      { vaccineId: 'IPV',  defaultDose: 1 },
      { vaccineId: 'Hib',  defaultDose: 1 },
      { vaccineId: 'HepB', defaultDose: 2 },  // HepB D1 typically given at birth
    ],
  },
  {
    id: 'pentacel',
    name: 'Pentacel — DTaP-IPV-Hib',
    tag: 'Pentacel',
    components: [
      { vaccineId: 'DTaP', defaultDose: 1 },
      { vaccineId: 'IPV',  defaultDose: 1 },
      { vaccineId: 'Hib',  defaultDose: 1 },
    ],
  },
  {
    id: 'pediarix',
    name: 'Pediarix — DTaP-IPV-HepB',
    tag: 'Pediarix',
    components: [
      { vaccineId: 'DTaP', defaultDose: 1 },
      { vaccineId: 'IPV',  defaultDose: 1 },
      { vaccineId: 'HepB', defaultDose: 2 },  // HepB D1 typically given at birth
    ],
  },
  {
    id: 'kinrix',
    name: 'Kinrix — DTaP-IPV (4–6 yr booster)',
    tag: 'Kinrix',
    components: [
      { vaccineId: 'DTaP', defaultDose: 5 },  // 5th DTaP dose
      { vaccineId: 'IPV',  defaultDose: 4 },  // 4th IPV dose
    ],
  },
  {
    id: 'quadracel',
    name: 'Quadracel — DTaP-IPV (4–6 yr booster)',
    tag: 'Quadracel',
    components: [
      { vaccineId: 'DTaP', defaultDose: 5 },
      { vaccineId: 'IPV',  defaultDose: 4 },
    ],
  },
  {
    id: 'proquad',
    name: 'ProQuad — MMRV',
    tag: 'ProQuad',
    components: [
      { vaccineId: 'MMR',       defaultDose: 1 },
      { vaccineId: 'Varicella', defaultDose: 1 },
    ],
  },
  {
    id: 'twinrix',
    name: 'Twinrix — HepA-HepB (18 yr+)',
    tag: 'Twinrix',
    components: [
      { vaccineId: 'HepA', defaultDose: 1 },
      { vaccineId: 'HepB', defaultDose: 1 },
    ],
  },
]
