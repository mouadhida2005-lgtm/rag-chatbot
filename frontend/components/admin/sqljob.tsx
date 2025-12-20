"use client"

import type React from "react"

import { useState, useCallback, useRef } from "react"
import {
  Database,
  FolderUp,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Loader2,
  Table2,
  Rows3,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ExtractionJob {
  id: string
  folderName: string
  filesCount: number
  status: "queued" | "extracting" | "inserting" | "completed" | "failed"
  progress: number
  rowsExtracted: number
  rowsInserted: number
  tablesAffected: string[]
  startedAt: string
  completedAt?: string
  error?: string
}

interface ExtractionStep {
  id: string
  label: string
  status: "pending" | "active" | "completed" | "error"
}

export function SqlDataExtractor() {
  const [isDragging, setIsDragging] = useState(false)
  const [jobs, setJobs] = useState<ExtractionJob[]>([
    {
      id: "1",
      folderName: "student_records_2024",
      filesCount: 15,
      status: "completed",
      progress: 100,
      rowsExtracted: 2450,
      rowsInserted: 2450,
      tablesAffected: ["students", "enrollments", "grades"],
      startedAt: "2024-01-15 14:30",
      completedAt: "2024-01-15 14:35",
    },
    {
      id: "2",
      folderName: "course_data_spring",
      filesCount: 8,
      status: "completed",
      progress: 100,
      rowsExtracted: 890,
      rowsInserted: 890,
      tablesAffected: ["courses", "schedules"],
      startedAt: "2024-01-14 10:15",
      completedAt: "2024-01-14 10:18",
    },
  ])
  const [activeJob, setActiveJob] = useState<ExtractionJob | null>(null)
  const [extractionSteps, setExtractionSteps] = useState<ExtractionStep[]>([])
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
  const folderInputRef = useRef<HTMLInputElement>(null)

  const toggleJobExpand = (id: string) => {
    const newExpanded = new Set(expandedJobs)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedJobs(newExpanded)
  }

  const simulateExtraction = (folderName: string, filesCount: number) => {
    const jobId = `job-${Date.now()}`
    const newJob: ExtractionJob = {
      id: jobId,
      folderName,
      filesCount,
      status: "queued",
      progress: 0,
      rowsExtracted: 0,
      rowsInserted: 0,
      tablesAffected: [],
      startedAt: new Date().toLocaleString(),
    }

    setJobs((prev) => [newJob, ...prev])
    setActiveJob(newJob)

    // Initialize extraction steps
    setExtractionSteps([
      { id: "scan", label: "Scanning files", status: "pending" },
      { id: "parse", label: "Parsing data structure", status: "pending" },
      { id: "validate", label: "Validating records", status: "pending" },
      { id: "transform", label: "Transforming data", status: "pending" },
      { id: "insert", label: "Inserting to database", status: "pending" },
      { id: "verify", label: "Verifying integrity", status: "pending" },
    ])

    // Simulate extraction process
    const totalRows = Math.floor(Math.random() * 2000) + 500
    const tables = ["students", "courses", "enrollments", "faculty", "departments"]
    const selectedTables = tables.slice(0, Math.floor(Math.random() * 3) + 1)

    let stepIndex = 0
    const stepInterval = setInterval(() => {
      if (stepIndex < 6) {
        setExtractionSteps((prev) =>
          prev.map((step, idx) => {
            if (idx === stepIndex) return { ...step, status: "active" }
            if (idx < stepIndex) return { ...step, status: "completed" }
            return step
          }),
        )

        const progress = Math.min(((stepIndex + 1) / 6) * 100, 100)
        const extracted = Math.floor((totalRows * progress) / 100)

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: stepIndex < 4 ? "extracting" : "inserting",
                  progress,
                  rowsExtracted: extracted,
                  rowsInserted: stepIndex >= 4 ? extracted : 0,
                  tablesAffected: selectedTables,
                }
              : job,
          ),
        )

        setActiveJob((prev) =>
          prev?.id === jobId
            ? {
                ...prev,
                status: stepIndex < 4 ? "extracting" : "inserting",
                progress,
                rowsExtracted: extracted,
                rowsInserted: stepIndex >= 4 ? extracted : 0,
                tablesAffected: selectedTables,
              }
            : prev,
        )

        stepIndex++
      } else {
        clearInterval(stepInterval)

        // Complete the job
        setExtractionSteps((prev) => prev.map((step) => ({ ...step, status: "completed" })))

        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: "completed",
                  progress: 100,
                  rowsExtracted: totalRows,
                  rowsInserted: totalRows,
                  completedAt: new Date().toLocaleString(),
                }
              : job,
          ),
        )

        setTimeout(() => {
          setActiveJob(null)
          setExtractionSteps([])
        }, 2000)
      }
    }, 1200)
  }

  const handleFolderSelect = () => {
    folderInputRef.current?.click()
  }

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Get folder name from first file path
    const firstFile = files[0]
    const pathParts = firstFile.webkitRelativePath.split("/")
    const folderName = pathParts[0] || "uploaded_folder"

    simulateExtraction(folderName, files.length)

    if (folderInputRef.current) folderInputRef.current.value = ""
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const items = e.dataTransfer.items
    if (!items) return

    // Count files (simulated folder upload)
    let fileCount = 0
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file") {
        fileCount++
      }
    }

    if (fileCount > 0) {
      simulateExtraction(`dropped_folder_${Date.now()}`, fileCount)
    }
  }, [])

  const retryJob = (job: ExtractionJob) => {
    simulateExtraction(job.folderName, job.filesCount)
  }

  const getStatusIcon = (status: ExtractionJob["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-destructive" />
      case "queued":
        return <Clock className="h-5 w-5 text-muted-foreground" />
      default:
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />
    }
  }

  const getStatusBadge = (status: ExtractionJob["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Completed</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "queued":
        return <Badge variant="outline">Queued</Badge>
      case "extracting":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Extracting</Badge>
      case "inserting":
        return <Badge className="bg-primary/10 text-primary border-primary/30">Inserting</Badge>
    }
  }

  return (
    <Card className="border-0 shadow-xl overflow-hidden mt-6">
      <CardHeader className="bg-card border-b border-border pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl text-foreground">SQL Data Extraction</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Upload folders to extract and insert data into database
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6">
        {/* Active Extraction Process */}
        {activeJob && (
          <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center">
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{activeJob.folderName}</h3>
                  <p className="text-sm text-muted-foreground">Processing {activeJob.filesCount} files</p>
                </div>
              </div>
              {getStatusBadge(activeJob.status)}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{Math.round(activeJob.progress)}%</span>
              </div>
              <Progress value={activeJob.progress} className="h-2" />
            </div>

            {/* Extraction Steps */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {extractionSteps.map((step) => (
                <div
                  key={step.id}
                  className={cn(
                    "p-2 rounded-lg text-center transition-all duration-300",
                    step.status === "completed" && "bg-green-500/10 border border-green-500/30",
                    step.status === "active" && "bg-primary/10 border border-primary/30 animate-pulse",
                    step.status === "pending" && "bg-muted/50 border border-border",
                    step.status === "error" && "bg-destructive/10 border border-destructive/30",
                  )}
                >
                  <div className="flex justify-center mb-1">
                    {step.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {step.status === "active" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                    {step.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground" />}
                    {step.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                  <span className="text-xs font-medium text-foreground">{step.label}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Rows3 className="h-4 w-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Rows Extracted</span>
                </div>
                <span className="text-lg font-bold text-foreground">{activeJob.rowsExtracted.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-4 w-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Rows Inserted</span>
                </div>
                <span className="text-lg font-bold text-foreground">{activeJob.rowsInserted.toLocaleString()}</span>
              </div>
              <div className="p-3 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Table2 className="h-4 w-4 text-secondary" />
                  <span className="text-xs text-muted-foreground">Tables Affected</span>
                </div>
                <span className="text-lg font-bold text-foreground">{activeJob.tablesAffected.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone */}
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore - webkitdirectory is a non-standard attribute
          webkitdirectory=""
          directory=""
          multiple
          className="hidden"
          onChange={handleFolderChange}
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleFolderSelect}
          className={cn(
            "border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer mb-6",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
          )}
        >
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
                isDragging ? "bg-primary/20 scale-110" : "bg-secondary/20",
              )}
            >
              <FolderUp className={cn("h-8 w-8 transition-colors", isDragging ? "text-primary" : "text-secondary")} />
            </div>
            <p className="text-base font-medium text-foreground mb-1">Drop a folder here or click to browse</p>
            <p className="text-sm text-muted-foreground text-center">
              Upload folders containing CSV, Excel, or JSON files to extract and insert data into SQL database
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="outline" className="text-xs">
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                CSV
              </Badge>
              <Badge variant="outline" className="text-xs">
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                XLSX
              </Badge>
              <Badge variant="outline" className="text-xs">
                <FileSpreadsheet className="h-3 w-3 mr-1" />
                JSON
              </Badge>
            </div>
          </div>
        </div>

        {/* Job History */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-secondary" />
            Extraction History
          </h3>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/30"
              >
                <div
                  className="p-3 flex items-center justify-between cursor-pointer"
                  onClick={() => toggleJobExpand(job.id)}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="font-medium text-sm text-foreground">{job.folderName}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.filesCount} files | {job.startedAt}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(job.status)}
                    {expandedJobs.has(job.id) ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {expandedJobs.has(job.id) && (
                  <div className="px-3 pb-3 pt-0 border-t border-border bg-muted/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="p-2 rounded-lg bg-card">
                        <span className="text-xs text-muted-foreground block">Rows Extracted</span>
                        <span className="font-semibold text-foreground">{job.rowsExtracted.toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-card">
                        <span className="text-xs text-muted-foreground block">Rows Inserted</span>
                        <span className="font-semibold text-foreground">{job.rowsInserted.toLocaleString()}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-card">
                        <span className="text-xs text-muted-foreground block">Tables</span>
                        <span className="font-semibold text-foreground">{job.tablesAffected.join(", ")}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-card">
                        <span className="text-xs text-muted-foreground block">Duration</span>
                        <span className="font-semibold text-foreground">
                          {job.completedAt ? "~5 min" : "In progress"}
                        </span>
                      </div>
                    </div>

                    {job.status === "failed" && (
                      <div className="mt-3 p-2 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">{job.error || "Extraction failed"}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => retryJob(job)}>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {jobs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No extraction jobs yet</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
