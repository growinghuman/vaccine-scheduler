import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useScheduler } from '@/context/SchedulerContext'
import { calculateNewbornSchedule, calculateCatchupSchedule } from '@/lib/scheduleLogic'
import { VACCINE_INFO, VACCINE_RULES } from '@/data/vaccineData'
import type { SchedulerFormValues, VaccineType } from '@/types'

const VACCINE_IDS = Object.keys(VACCINE_INFO) as VaccineType[]

function maxDosesFor(vaccineId: VaccineType): number {
  return Math.max(...VACCINE_RULES.filter((r) => r.vaccineId === vaccineId).map((r) => r.doseNumber))
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

  // Local state for the "add dose" row
  const [newVaccineId, setNewVaccineId] = useState<VaccineType>('HepB')
  const [newDoseNumber, setNewDoseNumber] = useState(1)
  const [newDate, setNewDate] = useState('')
  const [addError, setAddError] = useState('')

  const handleVaccineChange = (id: VaccineType) => {
    setNewVaccineId(id)
    setNewDoseNumber(1)
  }

  const handleAdd = () => {
    if (!newDate) { setAddError('Date required.'); return }
    setAddError('')
    append({ vaccineId: newVaccineId, doseNumber: newDoseNumber, dateGiven: newDate })
    setNewDate('')
  }

  const onSubmit = (data: SchedulerFormValues) => {
    setChildInfo(data.childInfo)
    setMode(data.mode)
    const schedule =
      data.mode === 'newborn'
        ? calculateNewbornSchedule(data.childInfo.dob)
        : calculateCatchupSchedule(data.childInfo.dob, data.history)
    setSchedule(schedule)
  }

  // Sorted view of history (display only — original indices preserved for remove())
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
          type="date"
          {...register('childInfo.dob', { required: 'Please enter the date of birth.' })}
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

          {/* Add dose row */}
          <div className="flex flex-wrap gap-2 items-end">
            {/* Vaccine selector */}
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

            {/* Dose number selector */}
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

            {/* Date given */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Date Given</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => { setNewDate(e.target.value); setAddError('') }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                className="rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              type="button"
              onClick={handleAdd}
              variant="outline"
              size="sm"
              className="self-end border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              + Add
            </Button>
          </div>

          {addError && <p className="text-xs text-red-500">{addError}</p>}

          {/* Hidden RHF inputs so values are included on submit */}
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
                  <span className="font-medium text-gray-800 w-28 shrink-0">
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
