import { SchedulerForm } from '@/components/scheduler/SchedulerForm'
import { ScheduleTable } from '@/components/scheduler/ScheduleTable'

export function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center space-y-1 no-print">
          <h1 className="text-3xl font-bold text-gray-900">Vaccination Scheduler</h1>
          <p className="text-gray-500 text-sm">
            CDC 2026 Guidelines · Standard & Catch-up Immunization Schedule
          </p>
        </header>

        <div className="no-print"><SchedulerForm /></div>
        <ScheduleTable />

        <footer className="text-center text-xs text-gray-400 pb-4 no-print">
          For reference only. Consult a healthcare provider for accurate vaccination guidance.
        </footer>
      </div>
    </main>
  )
}
