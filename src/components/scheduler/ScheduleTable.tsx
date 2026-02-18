import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { PrinterIcon, DownloadIcon } from 'lucide-react'
import { useScheduler } from '@/context/SchedulerContext'
import { VACCINE_INFO } from '@/data/vaccineData'
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
}

const STATUS_VARIANTS: Record<ScheduledDose['status'], 'default' | 'success' | 'warning' | 'destructive' | 'secondary'> = {
  upcoming: 'secondary',
  due: 'default',
  overdue: 'destructive',
  completed: 'success',
}

// Format ISO date string to US format (MM/dd/yyyy)
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
  const { childInfo, schedule } = useScheduler()
  const [selectedVaccine, setSelectedVaccine] = useState<VaccineInfo | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!childInfo || schedule.length === 0) return null

  // Status → PDF cell fill color (RGB)
  const STATUS_COLORS: Record<ScheduledDose['status'], [number, number, number]> = {
    overdue:   [254, 226, 226], // red-100
    due:       [219, 234, 254], // blue-100
    upcoming:  [243, 244, 246], // gray-100
    completed: [220, 252, 231], // green-100
  }

  const STATUS_TEXT_COLORS: Record<ScheduledDose['status'], [number, number, number]> = {
    overdue:   [185,  28,  28], // red-700
    due:       [ 29,  78, 216], // blue-700
    upcoming:  [ 75,  85,  99], // gray-600
    completed: [ 21, 128,  61], // green-700
  }

  const handleSavePDF = async () => {
    if (!childInfo) return
    setIsExporting(true)
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
      ])

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const margin = 14

      // Header
      doc.setFontSize(18)
      doc.setTextColor(31, 41, 55) // gray-800
      doc.text(`${childInfo.name}'s Vaccination Schedule`, margin, 20)

      doc.setFontSize(10)
      doc.setTextColor(107, 114, 128) // gray-500
      doc.text(
        `DOB: ${formatDate(childInfo.dob)}  ·  ${childInfo.gender === 'male' ? 'Male' : 'Female'}  ·  Generated ${format(new Date(), 'MM/dd/yyyy')}`,
        margin,
        28,
      )

      // Table
      autoTable(doc, {
        startY: 34,
        margin: { left: margin, right: margin },
        head: [['Vaccine', 'Dose', 'Recommended Age', 'Due Date', 'Status']],
        body: schedule.map((dose) => [
          dose.vaccineName,
          `Dose ${dose.doseNumber}`,
          dose.ageLabel,
          formatDate(dose.scheduledDate),
          STATUS_LABELS[dose.status],
        ]),
        headStyles: {
          fillColor: [37, 99, 235],  // blue-600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: { fontSize: 9, textColor: [55, 65, 81] },
        columnStyles: { 0: { fontStyle: 'bold' } },
        didDrawCell: (data) => {
          // Color the Status column cells
          if (data.section === 'body' && data.column.index === 4) {
            const dose = schedule[data.row.index]
            if (!dose) return
            const fill = STATUS_COLORS[dose.status]
            const text = STATUS_TEXT_COLORS[dose.status]
            doc.setFillColor(...fill)
            doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F')
            doc.setTextColor(...text)
            doc.setFontSize(8)
            doc.text(
              STATUS_LABELS[dose.status],
              data.cell.x + data.cell.width / 2,
              data.cell.y + data.cell.height / 2 + 1,
              { align: 'center' },
            )
          }
        },
        alternateRowStyles: { fillColor: [249, 250, 251] }, // gray-50
      })

      // Footer
      const pageHeight = doc.internal.pageSize.getHeight()
      doc.setFontSize(7)
      doc.setTextColor(156, 163, 175) // gray-400
      doc.text('For reference only. Consult a healthcare provider for accurate vaccination guidance.', margin, pageHeight - 8)
      doc.text('Source: CDC 2026 Immunization Schedule', margin, pageHeight - 4)

      doc.save(`${childInfo.name.replace(/\s+/g, '-')}-vaccination-schedule.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border space-y-4 print-card">
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
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => window.print()}
          >
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="text-left py-2 pr-4 font-medium">Vaccine</th>
              <th className="text-left py-2 pr-4 font-medium">Dose</th>
              <th className="text-left py-2 pr-4 font-medium">Recommended Age</th>
              <th className="text-left py-2 pr-4 font-medium">Due Date</th>
              <th className="text-left py-2 pr-4 font-medium">Status</th>
              <th className="text-left py-2 font-medium no-print">Safety Info</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedule.map((dose) => (
              <tr key={`${dose.vaccineId}-${dose.doseNumber}`} className="hover:bg-gray-50">
                <td className="py-2.5 pr-4 font-medium text-gray-800">
                  {dose.vaccineName}
                </td>
                <td className="py-2.5 pr-4 text-gray-600">Dose {dose.doseNumber}</td>
                <td className="py-2.5 pr-4 text-gray-600">{dose.ageLabel}</td>
                <td className="py-2.5 pr-4 text-gray-600">{formatDate(dose.scheduledDate)}</td>
                <td className="py-2.5 pr-4">
                  <Badge variant={STATUS_VARIANTS[dose.status]}>
                    {STATUS_LABELS[dose.status]}
                  </Badge>
                </td>
                <td className="py-2.5 no-print">
                  <button
                    onClick={() => setSelectedVaccine(VACCINE_INFO[dose.vaccineId])}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Side Effects
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVaccine && (
        <SideEffectModal vaccine={selectedVaccine} onClose={() => setSelectedVaccine(null)} />
      )}
    </div>
  )
}
