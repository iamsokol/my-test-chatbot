import { CaseMap } from 'src/lib/case'

export const osteoporosisCase: CaseMap = {
  id: 'osteoporosis-standard-66f',
  demographics: { age: 66, sex: 'female', nameHint: 'short, common name' },
  concern: 'Worried about weak bones / osteoporosis risk',
  history: {
    pastMedical: [],
    surgical: ['Hysterectomy with bilateral oophorectomy at age 39 (endometriosis)'],
    family: ['Mother hip fracture at 75, later nursing home'],
    social: ['No smoking', 'Few glasses of wine in the evening'],
    medications: [],
    allergies: [],
  },
  risks: ['Early menopause after oophorectomy', 'Maternal hip fracture'],
  vitals: ['T 37.5°C', 'HR 72', 'BP 122/78', 'RR 12', 'Wt 105 lb', 'Ht 52 in', 'BMI 19.2 kg/m^2'],
  tests: [
    'DXA: lumbar spine T‑score −2.6',
    'DXA: femoral neck T‑score −2.8',
  ],
  constraints: [
    'Patient does not provide diagnoses or treatment advice',
    'If unsure, asks for clarification rather than inventing details',
    'Keep responses concise, human, and consistent',
  ],
  notes: [],
}


