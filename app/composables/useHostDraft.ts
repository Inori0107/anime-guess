import type { ManualQuestionInput, QuestionType } from '#shared/types/game'

const DRAFT_KEY = 'anime_guess_host_draft'

export type HostDraft = {
  hostType: 'player' | 'system'
  nickname: string
  types: QuestionType[]
  count: number
  roundSeconds: number
  questions: ManualQuestionInput[]
}

const defaultDraft = (): HostDraft => ({
  hostType: 'system',
  nickname: '',
  types: ['song', 'character', 'quote'],
  count: 10,
  roundSeconds: 20,
  questions: [],
})

export const useHostDraft = () => {
  const draft = useState<HostDraft>('host-draft', defaultDraft)

  const loadDraft = () => {
    if (!import.meta.client) {
      return
    }
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (raw) {
      try {
        draft.value = { ...defaultDraft(), ...JSON.parse(raw) }
      }
      catch {
        draft.value = defaultDraft()
      }
    }
  }

  const saveDraft = () => {
    if (import.meta.client) {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft.value))
    }
  }

  const addQuestion = (question: ManualQuestionInput) => {
    draft.value.questions.push(question)
    saveDraft()
  }

  const removeQuestion = (index: number) => {
    draft.value.questions.splice(index, 1)
    saveDraft()
  }

  return {
    draft,
    loadDraft,
    saveDraft,
    addQuestion,
    removeQuestion,
  }
}
