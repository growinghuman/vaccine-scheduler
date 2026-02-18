import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { useScheduler } from '@/context/SchedulerContext'
import { calculateNewbornSchedule, calculateCatchupSchedule } from '@/lib/scheduleLogic'
import type { SchedulerFormValues } from '@/types'

export function SchedulerForm() {
  const { setChildInfo, setMode, setSchedule } = useScheduler()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SchedulerFormValues>({
    defaultValues: {
      childInfo: { name: '', dob: '', gender: 'male' },
      mode: 'newborn',
      history: [],
    },
  })

  const mode = watch('mode')

  const onSubmit = (data: SchedulerFormValues) => {
    setChildInfo(data.childInfo)
    setMode(data.mode)

    const schedule =
      data.mode === 'newborn'
        ? calculateNewbornSchedule(data.childInfo.dob)
        : calculateCatchupSchedule(data.childInfo.dob, data.history)

    setSchedule(schedule)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white rounded-xl p-6 shadow-sm border">
      <h2 className="text-xl font-bold text-gray-800">Child Information</h2>

      {/* Child name */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Child's Name</label>
        <input
          {...register('childInfo.name', { required: 'Please enter the child\'s name.' })}
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

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
        Calculate Schedule
      </Button>
    </form>
  )
}
