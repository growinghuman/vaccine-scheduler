import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { PrinterIcon, DownloadIcon } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useScheduler } from '@/context/SchedulerContext'
import { VACCINE_INFO, VACCINE_RULES } from '@/data/vaccineData'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ScheduledDose, VaccineInfo } from '@/types'

const STATUS_LABELS: Record<ScheduledDose['status'], string> = {
  upcoming: 'Upcoming',
  due: 'Due Today',
  overdue: 'Overdue',
  completed: 'Completed',
  invalid: 'Invalid (Not Counted)',
}

const STATUS_VARIANTS: Record<ScheduledDose['status'], 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'invalid'> = {
  upcoming: 'secondary',
  due: 'default',
  overdue: 'destructive',
  completed: 'success',
  invalid: 'invalid',
}

function formatDate(isoDate: string): string {
  return format(parseISO(isoDate), 'MM/dd/yyyy')
}

function SideEffectModal({ vaccine, onClose }: { vaccine: VaccineInfo; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vaccine.name} — Safety Information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Common Side Effects</h3>
            <ul className="space-y-1">
              {vaccine.commonSideEffects.map((effect) => (
                <li key={effect} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 text-blue-400">•</span>
                  {effect}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-red-600 mb-2">Call a Doctor Immediately If:</h3>
            <ul className="space-y-1">
              {vaccine.seriousSideEffects.map((effect) => (
                <li key={effect} className="flex items-start gap-2 text-sm text-red-600">
                  <span className="mt-0.5">⚠️</span>
                  {effect}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-gray-400 border-t pt-3">
            Source: CDC Vaccine Information Statements (VIS)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ScheduleTable() {
  const { childInfo, mode, schedule } = useScheduler()
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineInfo | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!childInfo || schedule.length === 0) return null

  // --- Pivot: rows = sorted dates, columns = vaccines ---
  const dates = [...new Set(schedule.map((d) => d.scheduledDate))].sort()

  // Preserve vaccine order by first appearance in schedule
  const vaccines = [
    ...new Map(
      schedule.map((d) => [d.vaccineId, { id: d.vaccineId, name: d.vaccineName }])
    ).values(),
  ]

  // lookup[date][vaccineId] = dose
  const pivot = new Map<string, Map<string, ScheduledDose>>()
  for (const dose of schedule) {
    if (!pivot.has(dose.scheduledDate)) pivot.set(dose.scheduledDate, new Map())
    pivot.get(dose.scheduledDate)!.set(dose.vaccineId, dose)
  }

  // Series completion status (catch-up mode only)
  const seriesStatus = vaccines.map((v) => {
    const totalDoses = VACCINE_RULES.filter((r) => r.vaccineId === v.id).length
    const validCompleted = schedule.filter(
      (d) => d.vaccineId === v.id && d.status === 'completed',
    ).length
    return { id: v.id, isComplete: validCompleted >= totalDoses, validCompleted, totalDoses }
  })

  // --- PDF ---
  const STATUS_COLORS: Record<ScheduledDose['status'], [number, number, number]> = {
    overdue:   [254, 226, 226],
    due:       [219, 234, 254],
    upcoming:  [243, 244, 246],
    completed: [220, 252, 231],
    invalid:   [255, 237, 213],
  }
  const STATUS_TEXT_COLORS: Record<ScheduledDose['status'], [number, number, number]> = {
    overdue:   [185,  28,  28],
    due:       [ 29,  78, 216],
    upcoming:  [ 75,  85,  99],
    completed: [ 21, 128,  61],
    invalid:   [194,  65,  12],
  }

  const handleSavePDF = async () => {
    if (!childInfo) return
    setIsExporting(true)
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const margin = 14

      doc.setFontSize(16)
      doc.setTextColor(31, 41, 55)
      doc.text(`${childInfo.name}'s Vaccination Schedule`, margin, 18)

      doc.setFontSize(9)
      doc.setTextColor(107, 114, 128)
      doc.text(
        `DOB: ${formatDate(childInfo.dob)}  ·  ${childInfo.gender === 'male' ? 'Male' : 'Female'}  ·  Generated ${format(new Date(), 'MM/dd/yyyy')}`,
        margin, 25,
      )

      // Pivot table: rows = vaccines, cols = dates
      const statusCol = mode === 'catchup'
      const head = [[
        'Vaccine',
        ...dates.map((d) => formatDate(d)),
        ...(statusCol ? ['Status'] : []),
      ]]
      const body = vaccines.map((v) => {
        const s = seriesStatus.find((x) => x.id === v.id)
        return [
          v.name,
          ...dates.map((date) => {
            const dose = pivot.get(date)?.get(v.id)
            return dose ? `D${dose.doseNumber}` : '—'
          }),
          ...(statusCol ? [s?.isComplete ? 'Complete' : `${s?.validCompleted ?? 0}/${s?.totalDoses ?? 0}`] : []),
        ]
      })

      const lastColIndex = dates.length + 1

      autoTable(doc, {
        startY: 30,
        margin: { left: margin, right: margin },
        head,
        body,
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7,
          halign: 'center',
        },
        bodyStyles: { fontSize: 8, halign: 'center' },
        columnStyles: {
          0: { halign: 'left', fontStyle: 'bold', cellWidth: 28 },
          ...(statusCol ? { [lastColIndex]: { cellWidth: 18 } } : {}),
        },
        didDrawCell: (data) => {
          if (data.section !== 'body' || data.column.index === 0) return
          if (statusCol && data.column.index === lastColIndex) return
          const dateIdx = data.column.index - 1
          const date = dates[dateIdx]
          const dose = pivot.get(date)?.get(vaccines[data.row.index]?.id ?? '')
          if (!dose) return
          const fill = STATUS_COLORS[dose.status]
          const text = STATUS_TEXT_COLORS[dose.status]
          doc.setFillColor(...fill)
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
          doc.setTextColor(...text)
          doc.setFontSize(7)
          doc.text(
            `D${dose.doseNumber}`,
            data.cell.x + data.cell.width / 2,
            data.cell.y + data.cell.height / 2 + 1,
            { align: 'center' },
          )
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      })

      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(7)
      doc.setTextColor(156, 163, 175)
      doc.text('For reference only. Consult a healthcare provider for accurate vaccination guidance.  |  Source: CDC 2026 Immunization Schedule', margin, pageHeight - 5)

      doc.save(`${childInfo.name.replace(/\s+/g, '-')}-vaccination-schedule.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4 print-card">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {childInfo.name}'s Vaccination Schedule
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            DOB: {formatDate(childInfo.dob)} &nbsp;·&nbsp;
            {childInfo.gender === 'male' ? 'Male' : 'Female'}
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}>
            <PrinterIcon className="h-4 w-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleSavePDF}
            disabled={isExporting}
          >
            <DownloadIcon className="h-4 w-4" />
            {isExporting ? 'Saving…' : 'Save PDF'}
          </Button>
        </div>
      </div>

      {/* Pivot table: rows = vaccines, cols = dates */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="text-left py-2 px-3 font-medium whitespace-nowrap rounded-tl-md">
                Vaccine
              </th>
              {dates.map((date) => (
                <th key={date} className="py-2 px-2 font-medium text-center whitespace-nowrap">
                  {formatDate(date)}
                </th>
              ))}
              {mode === 'catchup' && (
                <th className="py-2 px-2 font-medium text-center whitespace-nowrap">Status</th>
              )}
            </tr>
          </thead>
          <tbody>
            {vaccines.map((v, i) => {
              const s = seriesStatus.find((x) => x.id === v.id)!
              return (
                <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">
                    {v.name}
                  </td>
                  {dates.map((date) => {
                    const dose = pivot.get(date)?.get(v.id)
                    if (!dose) {
                      return (
                        <td key={date} className="py-2.5 px-2 text-center text-gray-200">
                          —
                        </td>
                      )
                    }
                    return (
                      <td key={date} className="py-2.5 px-2 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <Badge variant={STATUS_VARIANTS[dose.status]} className="text-xs px-1.5 py-0">
                            D{dose.doseNumber}
                          </Badge>
                          <button
                            onClick={() => setSelectedVaccine(VACCINE_INFO[dose.vaccineId])}
                            className="text-blue-400 hover:text-blue-600 no-print leading-none"
                            title={`${v.name} side effects`}
                          >
                            ⓘ
                          </button>
                        </div>
                      </td>
                    )
                  })}
                  {mode === 'catchup' && (
                    <td className="py-2.5 px-2 text-center">
                      {s.isComplete ? (
                        <Badge variant="success" className="text-xs px-1.5 py-0">Complete</Badge>
                      ) : (
                        <span className="text-xs text-gray-400">{s.validCompleted}/{s.totalDoses}</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap no-print">
        {(Object.entries(STATUS_LABELS) as [ScheduledDose['status'], string][]).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1">
            <Badge variant={STATUS_VARIANTS[status]}>{label}</Badge>
          </div>
        ))}
        <span className="text-xs text-gray-400 self-center">· ⓘ = side effects</span>
      </div>

      {selectedVaccine && (
        <SideEffectModal vaccine={selectedVaccine} onClose={() => setSelectedVaccine(null)} />
      )}
    </div>
  )
}
