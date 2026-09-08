import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resumesApi } from '@/lib/api/resumes-api'
import {
  FileText,
  Upload,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
  FileCheck2
} from 'lucide-react'

export function CandidateResumePage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data: resume, isLoading } = useQuery({
    queryKey: ['myResume'],
    queryFn: async () => {
      try {
        return await resumesApi.getMyActiveResume()
      } catch (err: any) {
        if (err?.response?.status === 404) return null
        throw err
      }
    }
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumesApi.uploadResume(file),
    onSuccess: () => {
      setUploadError(null)
      setSuccessMessage('Resume uploaded and set as active profile resume!')
      queryClient.invalidateQueries({ queryKey: ['myResume'] })
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    onError: (err: any) => {
      setSuccessMessage(null)
      setUploadError(err?.response?.data?.error || err.message || 'Failed to upload resume')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumesApi.deleteResume(id),
    onSuccess: () => {
      setSuccessMessage('Resume deleted successfully.')
      queryClient.invalidateQueries({ queryKey: ['myResume'] })
      setTimeout(() => setSuccessMessage(null), 5000)
    }
  })

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5MB limit.')
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['pdf', 'docx', 'doc'].includes(ext || '')) {
      setUploadError('Only PDF and Word documents (.pdf, .docx, .doc) are permitted.')
      return
    }
    setUploadError(null)
    uploadMutation.mutate(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 mb-3">
          <FileText className="h-3.5 w-3.5 text-blue-600" /> Candidate Documents
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          Manage Resume & CV
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Upload your latest technical resume. Our AI analysis agent parses your projects, skills, and experience when you apply to jobs.
        </p>
      </div>

      {/* Alerts */}
      {uploadError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{uploadError}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Current Active Resume Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileCheck2 className="h-5 w-5 text-blue-600" /> Active Profile Resume
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : resume ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-xl bg-slate-50 border border-slate-200 gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900 truncate max-w-xs sm:max-w-md">
                    {resume.fileName}
                  </h3>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>{(resume.fileSize / 1024).toFixed(1)} KB</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" /> Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={resumesApi.downloadResumeUrl(resume.id)}
                download
                className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition shadow-xs"
              >
                <Download className="h-3.5 w-3.5 text-blue-600" /> Download
              </a>
              <button
                onClick={() => deleteMutation.mutate(resume.id)}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 text-xs font-semibold transition"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center space-y-2">
            <p className="text-sm text-slate-700 font-medium">No active resume uploaded</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your PDF or Word resume below so you can apply to jobs with one-click AI evaluation.
            </p>
          </div>
        )}
      </div>

      {/* Drag and Drop Uploader */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Upload className="h-5 w-5 text-indigo-600" /> Upload New Version
        </h2>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0])
              }
            }}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              {uploadMutation.isPending ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <Upload className="h-7 w-7" />
              )}
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">
                {uploadMutation.isPending ? 'Processing & uploading resume...' : 'Click to browse or drag and drop your file'}
              </p>
              <p className="text-xs text-slate-500">
                PDF, DOCX or DOC up to 5MB
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
