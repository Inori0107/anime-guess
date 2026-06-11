import type { Choice } from '#shared/types/game'
import { shuffle } from './random'

const CHOICE_IDS = ['a', 'b', 'c', 'd'] as const

const buildChoices = (
  correctDisplay: string,
  pool: string[],
): { choices: Choice[]; correctChoiceId: string } => {
  const unique = new Map<string, string>()
  unique.set(correctDisplay, correctDisplay)
  for (const item of pool) {
    if (!unique.has(item)) {
      unique.set(item, item)
    }
  }

  while (unique.size < 4) {
    const n = unique.size + 1
    unique.set(`選項 ${n}`, `選項 ${n}`)
  }

  const shuffled = shuffle([...unique.values()].slice(0, 4))
  const choices: Choice[] = shuffled.map((display, index) => ({
    id: CHOICE_IDS[index]!,
    display,
  }))

  const correctChoiceId = choices.find(c => c.display === correctDisplay)?.id ?? choices[0]!.id
  return { choices, correctChoiceId }
}

export const buildChoicesFromLabels = (
  correct: string,
  distractors: string[],
): { choices: Choice[]; correctChoiceId: string } => {
  return buildChoices(correct.trim(), distractors.slice(0, 3).map(d => d.trim()))
}
