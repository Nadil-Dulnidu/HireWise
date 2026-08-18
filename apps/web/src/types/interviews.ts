export type InterviewStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'

export type RecommendationType =
  | 'STRONG_HIRE'
  | 'HIRE'
  | 'NO_HIRE'
  | 'STRONG_NO_HIRE'

export type QuestionCategory =
  | 'TECHNICAL'
  | 'BEHAVIORAL'
  | 'PROBLEM_SOLVING'
  | 'PROJECT_BASED'

export type DifficultyLevel =
  | 'EASY'
  | 'MEDIUM'
  | 'HARD'

export interface Interview {
  id: string
  applicationId: string
  jobId: string
  jobTitle: string
  companyId: string
  companyName: string
  candidateId: string
  candidateName: string
  candidateEmail: string
  candidateProfileImageUrl?: string
  interviewerId: string
  interviewerName: string
  interviewerEmail: string
  scheduledStartTime: string
  scheduledEndTime: string
  meetingLink?: string
  status: InterviewStatus
  notes?: string
  hasFeedback: boolean
  overallRating?: number
  recommendation?: RecommendationType
  createdAt: string
}

export interface InterviewQuestion {
  id: string
  category: QuestionCategory
  question: string
  expectedAnswer?: string
  difficultyLevel: DifficultyLevel
  orderIndex: number
}

export interface InterviewFeedback {
  id: string
  interviewId: string
  interviewerId: string
  interviewerName: string
  technicalSkillsRating: number
  problemSolvingRating: number
  communicationRating: number
  culturalFitRating: number
  overallRating: number
  recommendation: RecommendationType
  notes?: string
  strengths?: string
  weaknesses?: string
  submittedAt: string
  createdAt: string
}

export interface InterviewDetail extends Interview {
  jobDescription?: string
  candidatePhone?: string
  resumeSnapshotUrl?: string
  feedback?: InterviewFeedback
  questions: InterviewQuestion[]
}

export interface CreateInterviewRequest {
  applicationId: string
  interviewerId: string
  scheduledStartTime: string
  scheduledEndTime: string
  meetingLink?: string
  notes?: string
}

export interface UpdateInterviewRequest {
  scheduledStartTime?: string
  scheduledEndTime?: string
  meetingLink?: string
  notes?: string
}

export interface SubmitFeedbackRequest {
  technicalSkillsRating: number
  problemSolvingRating: number
  communicationRating: number
  culturalFitRating: number
  recommendation: RecommendationType
  notes?: string
  strengths?: string
  weaknesses?: string
}

export interface UpdateFeedbackRequest {
  technicalSkillsRating?: number
  problemSolvingRating?: number
  communicationRating?: number
  culturalFitRating?: number
  recommendation?: RecommendationType
  notes?: string
  strengths?: string
  weaknesses?: string
}

export interface InterviewFilterRequest {
  page?: number
  pageSize?: number
  search?: string
  status?: InterviewStatus
  interviewerId?: string
  candidateId?: string
  jobId?: string
  dateFrom?: string
  dateTo?: string
}

export interface AvailabilitySlot {
  id: string
  userId: string
  userName: string
  dayOfWeek: number | string
  startTime: string // "09:00:00"
  endTime: string // "17:00:00"
  timezone: string
  isRecurring: boolean
  specificDate?: string
  createdAt: string
}

export interface CreateAvailabilitySlotRequest {
  dayOfWeek: number
  startTime: string
  endTime: string
  timezone?: string
  isRecurring?: boolean
  specificDate?: string
}

export interface UpdateAvailabilitySlotRequest {
  dayOfWeek?: number
  startTime?: string
  endTime?: string
  timezone?: string
  isRecurring?: boolean
  specificDate?: string
}

export interface BulkCreateAvailabilityRequest {
  slots: CreateAvailabilitySlotRequest[]
}

export const normalizeDayOfWeek = (day: number | string | undefined | null): number => {
  if (typeof day === 'number') return day
  if (day === undefined || day === null) return -1
  const s = day.toString().trim().toLowerCase()
  switch (s) {
    case '0':
    case 'sunday':
    case 'sun':
      return 0
    case '1':
    case 'monday':
    case 'mon':
      return 1
    case '2':
    case 'tuesday':
    case 'tue':
    case 'tues':
      return 2
    case '3':
    case 'wednesday':
    case 'wed':
      return 3
    case '4':
    case 'thursday':
    case 'thu':
    case 'thur':
    case 'thurs':
      return 4
    case '5':
    case 'friday':
    case 'fri':
      return 5
    case '6':
    case 'saturday':
    case 'sat':
      return 6
    default:
      const num = parseInt(s, 10)
      return isNaN(num) ? -1 : num
  }
}

export const getDayLabel = (day: number | string | undefined | null, short = false): string => {
  const num = normalizeDayOfWeek(day)
  const daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  if (num >= 0 && num <= 6) {
    return short ? daysShort[num] : daysFull[num]
  }
  return String(day ?? '')
}

export const formatTimeDisplay = (timeStr?: string): string => {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10)
    const mins = parts[1].padStart(2, '0')
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 === 0 ? 12 : hours % 12
    return `${displayHours}:${mins} ${ampm}`
  }
  return timeStr
}
