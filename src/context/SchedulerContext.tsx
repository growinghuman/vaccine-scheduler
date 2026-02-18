import { createContext, useContext, useState, type ReactNode } from 'react'
import type { ChildInfo, DoseHistory, ScheduleMode, ScheduledDose } from '@/types'

interface SchedulerState {
  childInfo: ChildInfo | null
  mode: ScheduleMode
  history: DoseHistory[]
  schedule: ScheduledDose[]
}

interface SchedulerContextValue extends SchedulerState {
  setChildInfo: (info: ChildInfo) => void
  setMode: (mode: ScheduleMode) => void
  setHistory: (history: DoseHistory[]) => void
  setSchedule: (schedule: ScheduledDose[]) => void
  reset: () => void
}

const defaultState: SchedulerState = {
  childInfo: null,
  mode: 'newborn',
  history: [],
  schedule: [],
}

const SchedulerContext = createContext<SchedulerContextValue | null>(null)

export function SchedulerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SchedulerState>(defaultState)

  const setChildInfo = (childInfo: ChildInfo) =>
    setState((prev) => ({ ...prev, childInfo }))

  const setMode = (mode: ScheduleMode) =>
    setState((prev) => ({ ...prev, mode }))

  const setHistory = (history: DoseHistory[]) =>
    setState((prev) => ({ ...prev, history }))

  const setSchedule = (schedule: ScheduledDose[]) =>
    setState((prev) => ({ ...prev, schedule }))

  const reset = () => setState(defaultState)

  return (
    <SchedulerContext.Provider
      value={{ ...state, setChildInfo, setMode, setHistory, setSchedule, reset }}
    >
      {children}
    </SchedulerContext.Provider>
  )
}

export function useScheduler() {
  const ctx = useContext(SchedulerContext)
  if (!ctx) throw new Error('useScheduler must be used within SchedulerProvider')
  return ctx
}
