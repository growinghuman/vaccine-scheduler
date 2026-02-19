import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useScheduler } from '@/context/SchedulerContext'
import { calculateNewbornSchedule, calculateCatchupSchedule } from '@/lib/scheduleLogic'
import { VACCINE_INFO, VACCINE_RULES } from '@/data/vaccineData'
import { COMBO_VACCINES } from '@/data/comboVaccines'
import type { SchedulerFormValues, VaccineType } from '@/types'

const VACCINE_IDS = Object.keys(VACCINE_INFO) as VaccineType[]

function maxDosesFor(vaccineId: VaccineType): number {
  return Math.max(...VACCINE_RULES.filter((r) => r.vaccineId === vaccineId).map((r) => r.doseNumber))
}

// Auto-insert slashes as user types digits → MM/DD/YYYY
function autoFormatDate(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 8)
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`
  return d
}

// MM/DD/YYYY → YYYY-MM-DD
function toISO(mmddyyyy: string): string {
  const [mm, dd, yyyy] = mmddyyyy.split('/')
  return `${yyyy}-${mm}-${dd}`
}

function isValidMMDDYYYY(v: string): boolean {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return false
  const [mm, dd, yyyy] = v.split('/').map(Number)
  const d = new Date(yyyy, mm - 1, dd)
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd
}

export function SchedulerForm() {
  const { setChildInfo, setMode, setSchedule } = useScheduler()

  const { register, handleSubmit, watch, control, formState: { errors } } =
    useForm<SchedulerFormValues>({
      defaultValues: {
        childInfo: { name: '', dob: '', gender: 'male' },
        mode: 'newborn',
        history: [],
      },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'history' })
  const mode = watch('mode')

  // DOB text input: display as MM/DD/YYYY, store and submit as YYYY-MM-DD
  const { onChange: dobOnChange, ...dobRest } = register('childInfo.dob', {
    required: 'Please enter the date of birth.',
    validate: (v: string) => {
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return 'Please use MM/DD/YYYY format'
      const [mm, dd, yyyy] = v.split('/').map(Number)
      const d = new Date(yyyy, mm - 1, dd)
      return (d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd)
        || 'Invalid date'
    },
  })

  // ── Single-vaccine add ───────────────────────────────────────────────────
  const [newVaccineId, setNewVaccineId] = useState<VaccineType>('HepB')
  const [newDoseNumber, setNewDoseNumber] = useState(1)
  const [newDate, setNewDate] = useState('')
  const [addError, setAddError] = useState('')

  const handleVaccineChange = (id: VaccineType) => {
    setNewVaccineId(id)
    setNewDoseNumber(1)
  }

  const handleAddSingle = () => {
    if (!isValidMMDDYYYY(newDate)) { setAddError('Date required (MM/DD/YYYY).'); return }
    setAddError('')
    append({ vaccineId: newVaccineId, doseNumber: newDoseNumber, dateGiven: toISO(newDate) })
    setNewDate('')
  }

  // ── Combo-vaccine add ────────────────────────────────────────────────────
  const [inputMode, setInputMode] = useState<'single' | 'combo'>('single')
  const [selectedComboIdx, setSelectedComboIdx] = useState(0)
  const [comboDoses, setComboDoses] = useState<number[]>(
    COMBO_VACCINES[0].components.map((c) => c.defaultDose),
  )
  const [comboDate, setComboDate] = useState('')
  const [comboError, setComboError] = useState('')

  const selectedCombo = COMBO_VACCINES[selectedComboIdx]

  const handleComboChange = (idx: number) => {
    setSelectedComboIdx(idx)
    setComboDoses(COMBO_VACCINES[idx].components.map((c) => c.defaultDose))
  }

  const handleAddCombo = () => {
    if (!isValidMMDDYYYY(comboDate)) { setComboError('Date required (MM/DD/YYYY).'); return }
    setComboError('')
    selectedCombo.components.forEach((comp, i) => {
      append({ vaccineId: comp.vaccineId, doseNumber: comboDoses[i], dateGiven: toISO(comboDate) })
    })
    setComboDate('')
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  const onSubmit = (data: SchedulerFormValues) => {
    // Convert DOB from MM/DD/YYYY display format to YYYY-MM-DD (ISO) for internal use
    const [mm, dd, yyyy] = data.childInfo.dob.split('/')
    const isoDob = `${yyyy}-${mm}-${dd}`
    const childInfo = { ...data.childInfo, dob: isoDob }
    setChildInfo(childInfo)
    setMode(data.mode)
    const schedule =
      data.mode === 'newborn'
        ? calculateNewbornSchedule(isoDob)
        : calculateCatchupSchedule(isoDob, data.history)
    setSchedule(schedule)
  }

  // Sorted view of history for display
  const sortedFields = [...fields]
    .map((f, i) => ({ ...f, originalIndex: i }))
    .sort((a, b) => a.dateGiven.localeCompare(b.dateGiven))

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 bg-white rounded-xl p-6 shadow-sm border"
    >
      <h2 className="text-xl font-bold text-gray-800">Child Information</h2>

      {/* Child name */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Child's Name</label>
        <input
          {...register('childInfo.name', { required: "Please enter the child's name." })}
          placeholder="Jane Doe"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.childInfo?.name && (
          <p className="text-xs text-red-500">{errors.childInfo.name.message}</p>
        )}
      </div>

      {/* Date of Birth */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
        <input
          type="text"
          placeholder="MM/DD/YYYY"
          maxLength={10}
          {...dobRest}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
            e.target.value = digits.length > 4
              ? `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
              : digits.length > 2
              ? `${digits.slice(0, 2)}/${digits.slice(2)}`
              : digits
            dobOnChange(e)
          }}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.childInfo?.dob && (
          <p className="text-xs text-red-500">{errors.childInfo.dob.message}</p>
        )}
      </div>

      {/* Gender */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Sex</label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="male" {...register('childInfo.gender')} />
            <span className="text-sm">Male</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="female" {...register('childInfo.gender')} />
            <span className="text-sm">Female</span>
          </label>
        </div>
      </div>

      {/* Schedule Mode */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Schedule Type</label>
        <div className="flex rounded-md border overflow-hidden">
          <label
            className={`flex-1 text-center py-2 text-sm cursor-pointer transition-colors ${
              mode === 'newborn' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <input type="radio" value="newborn" {...register('mode')} className="sr-only" />
            Standard (Newborn)
          </label>
          <label
            className={`flex-1 text-center py-2 text-sm cursor-pointer transition-colors ${
              mode === 'catchup' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <input type="radio" value="catchup" {...register('mode')} className="sr-only" />
            Catch-up (Delayed)
          </label>
        </div>
      </div>

      {/* Vaccination History — catch-up mode only */}
      {mode === 'catchup' && (
        <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Vaccination History</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Add previously administered doses. Interval violations are flagged automatically.
            </p>
          </div>

          {/* Single / Combo toggle */}
          <div className="flex rounded-md border border-gray-200 overflow-hidden w-fit text-xs">
            <button
              type="button"
              onClick={() => { setInputMode('single'); setAddError(''); setComboError('') }}
              className={`px-3 py-1.5 transition-colors ${
                inputMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Single Vaccine
            </button>
            <button
              type="button"
              onClick={() => { setInputMode('combo'); setAddError(''); setComboError('') }}
              className={`px-3 py-1.5 transition-colors ${
                inputMode === 'combo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              Combo Vaccine
            </button>
          </div>

          {/* ── Single mode ── */}
          {inputMode === 'single' && (
            <div className="flex flex-wrap gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Vaccine</label>
                <select
                  value={newVaccineId}
                  onChange={(e) => handleVaccineChange(e.target.value as VaccineType)}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {VACCINE_IDS.map((id) => (
                    <option key={id} value={id}>{VACCINE_INFO[id].name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Dose #</label>
                <select
                  value={newDoseNumber}
                  onChange={(e) => setNewDoseNumber(Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
                >
                  {Array.from({ length: maxDosesFor(newVaccineId) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>Dose {n}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Date Given</label>
                <input
                  type="text"
                  placeholder="MM/DD/YYYY"
                  maxLength={10}
                  value={newDate}
                  onChange={(e) => { setNewDate(autoFormatDate(e.target.value)); setAddError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSingle())}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                />
              </div>

              <Button
                type="button"
                onClick={handleAddSingle}
                variant="outline"
                size="sm"
                className="self-end border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                + Add
              </Button>
            </div>
          )}

          {addError && <p className="text-xs text-red-500">{addError}</p>}

          {/* ── Combo mode ── */}
          {inputMode === 'combo' && (
            <div className="space-y-2">
              {/* Combo vaccine selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Combo Vaccine</label>
                <select
                  value={selectedComboIdx}
                  onChange={(e) => handleComboChange(Number(e.target.value))}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COMBO_VACCINES.map((cv, i) => (
                    <option key={cv.id} value={i}>{cv.name}</option>
                  ))}
                </select>
              </div>

              {/* Per-component dose selectors */}
              <div className="flex flex-wrap gap-2 items-end">
                {selectedCombo.components.map((comp, i) => (
                  <div key={comp.vaccineId} className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500">
                      {VACCINE_INFO[comp.vaccineId].name}
                    </label>
                    <select
                      value={comboDoses[i]}
                      onChange={(e) => {
                        const next = [...comboDoses]
                        next[i] = Number(e.target.value)
                        setComboDoses(next)
                      }}
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                    >
                      {Array.from({ length: maxDosesFor(comp.vaccineId) }, (_, n) => n + 1).map((n) => (
                        <option key={n} value={n}>D{n}</option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">Date Given</label>
                  <input
                    type="text"
                    placeholder="MM/DD/YYYY"
                    maxLength={10}
                    value={comboDate}
                    onChange={(e) => { setComboDate(autoFormatDate(e.target.value)); setComboError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCombo())}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                  />
                </div>

                <Button
                  type="button"
                  onClick={handleAddCombo}
                  variant="outline"
                  size="sm"
                  className="self-end border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  + Add All
                </Button>
              </div>

              {comboError && <p className="text-xs text-red-500">{comboError}</p>}
            </div>
          )}

          {/* Hidden RHF inputs */}
          {fields.map((field, index) => (
            <span key={field.id} className="hidden">
              <input {...register(`history.${index}.vaccineId`)} />
              <input {...register(`history.${index}.doseNumber`, { valueAsNumber: true })} />
              <input {...register(`history.${index}.dateGiven`)} />
            </span>
          ))}

          {/* History list */}
          {sortedFields.length > 0 ? (
            <ul className="space-y-1 mt-1">
              {sortedFields.map((field) => (
                <li
                  key={field.id}
                  className="flex items-center gap-2 bg-white rounded-md border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-gray-800 w-32 shrink-0">
                    {VACCINE_INFO[field.vaccineId]?.name}
                  </span>
                  <span className="text-gray-500 w-14 shrink-0">Dose {field.doseNumber}</span>
                  <span className="text-gray-500 flex-1">
                    {format(parseISO(field.dateGiven), 'MM/dd/yyyy')}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(field.originalIndex)}
                    className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none ml-auto"
                    title="Remove"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 italic">No doses added yet.</p>
          )}
        </div>
      )}

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        Calculate Schedule
      </Button>
    </form>
  )
}
