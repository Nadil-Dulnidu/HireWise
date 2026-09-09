import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { availabilityApi } from '@/lib/api/availability-api'
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import {
  type CreateAvailabilitySlotRequest,
  normalizeDayOfWeek,
  formatTimeDisplay
} from '@/types/interviews'

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' }
]

export function InterviewerAvailabilityPage() {
  const queryClient = useQueryClient()
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('16:00')
  const [timezone, setTimezone] = useState('UTC')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['myAvailability'],
    queryFn: availabilityApi.getMyAvailability
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateAvailabilitySlotRequest) => availabilityApi.createSlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] })
      setSuccessMsg('Interviewer availability slot added!')
      setErrorMsg(null)
      setTimeout(() => setSuccessMsg(null), 3000)
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Failed to add availability slot.')
    }
  })

  const bulkCreateMutation = useMutation({
    mutationFn: (slots: CreateAvailabilitySlotRequest[]) => availabilityApi.bulkCreateSlots({ slots }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] })
      setSuccessMsg('Weekday interview slots (10am–4pm) set!')
      setErrorMsg(null)
      setTimeout(() => setSuccessMsg(null), 3000)
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Failed to set schedule.')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => availabilityApi.deleteSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAvailability'] })
    }
  })

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault()
    if (startTime >= endTime) {
      setErrorMsg('End time must be later than start time.')
      return
    }

    createMutation.mutate({
      dayOfWeek: selectedDay,
      startTime: `${startTime}:00`,
      endTime: `${endTime}:00`,
      timezone,
      isRecurring: true
    })
  }

  const handleAddPreset = () => {
    const weekdaySlots: CreateAvailabilitySlotRequest[] = [1, 2, 3, 4, 5].map((d) => ({
      dayOfWeek: d,
      startTime: '10:00:00',
      endTime: '16:00:00',
      timezone,
      isRecurring: true
    }))
    bulkCreateMutation.mutate(weekdaySlots)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Clock className="h-7 w-7 text-emerald-600" /> Interviewer Availability
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Recruiters will use these open slots to match and schedule candidate technical rounds without calendar conflicts.
          </p>
        </div>
        <button
          onClick={handleAddPreset}
          disabled={bulkCreateMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-sm font-medium transition disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <Clock className="h-4 w-4 text-emerald-600" /> Mon–Fri 10am–4pm Preset
        </button>
      </div>

      {/* Status messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* Grid: Form & List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1 h-fit">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-600" /> Add Available Slot
          </h3>

          <form onSubmit={handleAddSlot} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Day of the Week</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer"
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500"
                placeholder="e.g. UTC"
                required
              />
            </div>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Save Slot
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" /> Active Schedule Slots
          </h3>

          {isLoading ? (
            <div className="p-12 text-center">
              <Loader2 className="h-6 w-6 text-emerald-600 animate-spin mx-auto" />
            </div>
          ) : slots.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="text-sm text-slate-500">No availability slots registered.</p>
              <p className="text-xs text-slate-400">
                Provide slots so recruiters know when to schedule candidates with you.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {DAYS.map((day) => {
                const daySlots = slots.filter((s) => normalizeDayOfWeek(s.dayOfWeek) === day.value)

                return (
                  <div
                    key={day.value}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="w-28 font-semibold text-sm text-slate-900">{day.label}</div>

                    <div className="flex-1 flex flex-wrap gap-2">
                      {daySlots.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No slots scheduled</span>
                      ) : (
                        daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 shadow-sm"
                          >
                            <Clock className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="font-medium">
                              {formatTimeDisplay(slot.startTime)} – {formatTimeDisplay(slot.endTime)}
                            </span>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {slot.timezone}
                            </span>
                            <button
                              onClick={() => deleteMutation.mutate(slot.id)}
                              className="text-slate-400 hover:text-red-500 transition ml-1 cursor-pointer"
                              title="Delete slot"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
