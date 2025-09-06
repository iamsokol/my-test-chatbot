import { ChatMessage } from 'src/lib/ai'

export interface CaseMap {
  id: string
  demographics: { age: number; sex?: 'female' | 'male'; nameHint?: string }
  concern: string
  history: {
    pastMedical?: string[]
    surgical?: string[]
    family?: string[]
    social?: string[]
    medications?: string[]
    allergies?: string[]
  }
  risks?: string[]
  vitals?: string[]
  tests?: string[]
  constraints?: string[]
  notes?: string[]
}

function list(lines?: string[]): string {
  return (lines && lines.length > 0) ? `- ${lines.join('\n- ')}` : '-'
}

export function buildSystemPrompt(basePolicy: string, caseMap: CaseMap): string {
  return (
    `${basePolicy}\n\n` +
    `Case Map (for internal consistency, do not read aloud):\n` +
    `- ID: ${caseMap.id}\n` +
    `- Demographics: age ${caseMap.demographics.age}${caseMap.demographics.sex ? `, ${caseMap.demographics.sex}` : ''}${caseMap.demographics.nameHint ? `, name hint: ${caseMap.demographics.nameHint}` : ''}\n` +
    `- Concern: ${caseMap.concern}\n` +
    `- Risks:\n${list(caseMap.risks)}\n` +
    `- History:\n` +
    `  - Past medical:\n${list(caseMap.history.pastMedical)}\n` +
    `  - Surgical:\n${list(caseMap.history.surgical)}\n` +
    `  - Family:\n${list(caseMap.history.family)}\n` +
    `  - Social:\n${list(caseMap.history.social)}\n` +
    `  - Medications:\n${list(caseMap.history.medications)}\n` +
    `  - Allergies:\n${list(caseMap.history.allergies)}\n` +
    `- Vitals (if asked):\n${list(caseMap.vitals)}\n` +
    `- Tests (if asked):\n${list(caseMap.tests)}\n` +
    `- Constraints:\n${list(caseMap.constraints)}\n` +
    `${caseMap.notes && caseMap.notes.length ? `- Notes:\n${list(caseMap.notes)}\n` : ''}`
  )
}

export function buildEvaluationPrompt(caseMap: CaseMap, transcript: ChatMessage[]): string {
  const joined = transcript.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
  return (
    `You are a medical education evaluator. Assess the doctor's interview with a standardized patient.\n` +
    `Write plain text (no JSON, no markdown). Be concise and structured with short lines.\n` +
    `Include sections in this order:\n` +
    `Summary: one or two sentences overview.\n` +
    `Scores (1-5): HPI=_, PMH=_, PSH=_, SH=_, FH=_, Meds=_, Empathy=_, Structure=_, Language=_.\n` +
    `Missed questions: a short list of the most important missing questions.\n` +
    `Advice: 1-3 short, actionable suggestions.\n` +
    `Patient case (for reference): ${caseMap.concern}; risks: ${(caseMap.risks || []).join(', ')}.\n` +
    `Transcript (USER=doctor, ASSISTANT=patient):\n${joined}`
  )
}


