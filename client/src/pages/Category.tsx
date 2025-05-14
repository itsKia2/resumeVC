import type React from "react"

import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Search, Upload, MoreHorizontal, FileText, FolderOpen, Loader2 } from "lucide-react"
import { useUser } from "@clerk/clerk-react"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { fetcher } from "@/lib/utils"

// Types
interface Category {
  id: string
  name: string
}

interface Resume {
  id: string
  name: string
  categoryId: string
  uploadDate: string
  fileSize: string
  link?: string
}

// Mutation functions
async function deleteResumeFetcher(url: string, { arg }: { arg: { id: string } }) {
  const response = await fetch(`${url}/${arg.id}`, {
    method: 'DELETE',
  })
  
  if (!response.ok) {
    throw new Error('Failed to delete resume')
  }
  
  return response.json()
}

async function moveResumeFetcher(url: string, { arg }: { arg: { id: string, categoryId: string } }) {
  const response = await fetch(`${url}/${arg.id}/move`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      categoryId: arg.categoryId
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to move resume')
  }
  
  return response.json()
}

async function uploadResumeFetcher(url: string, { arg }: { arg: { formData: FormData } }) {
  const response = await fetch(url, {
    method: 'POST',
    body: arg.formData
  })
  
  if (!response.ok) {
    throw new Error('Failed to upload resume')
  }
  
  return response.json()
}

// Utility to strip _timestamp from filename
function stripTimestampFromFilename(filename: string): string {
  // Matches _YYYYMMDDHHMMSS before the file extension
  return filename.replace(/_\d{14}(?=\.[^.]+$)/, '');
}

export default function CategoryPage() {
  const navigate = useNavigate()
  const params = useParams()
  const { user, isSignedIn, isLoaded } = useUser()
  const categoryId = params.id as string

  // State
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [resumeToMove, setResumeToMove] = useState<Resume | null>(null)
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadResponse, setUploadResponse] = useState<string | null>(null)

  // SWR data fetching
  const shouldFetch = isLoaded && isSignedIn && !!user
  
  // Fetch categories data
  const { 
    data: categoriesData,
    error: categoriesError
  } = useSWR(shouldFetch ? '/api/categories' : null, fetcher)
  
  // Fetch resumes for the current category
  const {
    data: resumesData,
    error: resumesError,
    isLoading,
    mutate: mutateResumes
  } = useSWR(shouldFetch ? `/api/categories/${categoryId}/resumes` : null, fetcher)
  
  // Mutations
  const { trigger: deleteResume, isMutating: isDeleting } = useSWRMutation('/api/resumes', deleteResumeFetcher, {
    onSuccess: () => {
      mutateResumes()
      setResumeToDelete(null)
    }
  })
  
  const { trigger: moveResume, isMutating: isMoving } = useSWRMutation('/api/resumes', moveResumeFetcher, {
    onSuccess: () => {
      mutateResumes()
      setResumeToMove(null)
    }
  })
  
  const { trigger: uploadResume, isMutating: isUploading } = useSWRMutation('/api/resume-upload', uploadResumeFetcher, {
    onSuccess: () => {
      mutateResumes()
      setUploadResponse(`Successfully uploaded ${file?.name}`)
      setTimeout(() => {
        setFile(null)
        setUploadResponse(null)
        setIsUploadDialogOpen(false)
      }, 2000)
    },
    onError: () => {
      setUploadResponse(`Error: Failed to upload ${file?.name}. Please try again.`)
    }
  })

  // Extract data from SWR responses
  const categories: Category[] = shouldFetch 
    ? (categoriesData?.categories || []).concat({ id: "all", name: "All" }) 
    : [{ id: "all", name: "All" }]
    
  const formattedResumes: Resume[] = shouldFetch && resumesData?.resumes
    ? resumesData.resumes.map((resume: any) => ({
        id: resume.id,
        name: resume.name,
        categoryId: resume.category_id,
        uploadDate: new Date(resume.date).toISOString().split('T')[0],
        fileSize: "N/A",
        link: resume.link
      }))
    : []

  // Determine loading and error state
  const isFetchLoading = !isLoaded || isLoading
  const isMutationLoading = isDeleting || isMoving || isUploading
  const isAnyLoading = isFetchLoading || isMutationLoading
  
  const error = categoriesError || resumesError
    ? 'Failed to load data. Please try again later.'
    : (!isSignedIn && isLoaded) ? "Please sign in to view your categories and resumes." : null

  const currentCategoryName =
    categoryId === "all"
      ? "All"
      : isAnyLoading
        ? "Loading..."
        : categories.find((cat: Category) => cat.id.toString() === categoryId.toString())?.name || "Category Not Found"

  const filteredResumes = formattedResumes.filter((resume: Resume) => {
    const matchesSearch = resume.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat: Category) => cat.id === categoryId)
    return category ? category.name : "Uncategorized"
  }

  const handleDeleteResume = async (resumeId: string) => {
    deleteResume({ id: resumeId })
  }

  const handleChangeCategory = async (resumeId: string, newCategoryId: string) => {
    moveResume({ id: resumeId, categoryId: newCategoryId })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
  }

  const handleUpload = async () => {
    if (!file) return

    const formData = new FormData()
    formData.append('pdf', file)

    // Use categoryId directly for upload
    let categoryIdToUpload = categoryId === "all" ? "" : categoryId
    formData.append('categoryId', categoryIdToUpload)

    uploadResume({ formData })
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      <main className="flex-1">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Button variant="ghost" className="p-0 h-auto font-normal" onClick={() => navigate("/categories")}>
                <FolderOpen className="h-5 w-5 mr-2" />
                Categories
              </Button>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="font-semibold text-lg">
                {currentCategoryName} Resumes
              </span>
            </div>

            <div className="relative w-64">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Resume
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          {isFetchLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading resumes...</span>
            </div>
          ) : error ? (
            <div className="text-center p-6 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          ) : filteredResumes.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">No resumes found in this category.</p>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredResumes.map((resume) => (
              <Card key={resume.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base truncate" title={stripTimestampFromFilename(resume.name)}>
                      {stripTimestampFromFilename(resume.name)}
                    </CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => resume.link && window.open(resume.link, '_blank')}>
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          if (resume.link) {
                            const link = document.createElement('a');
                            link.href = resume.link;
                            link.download = stripTimestampFromFilename(resume.name);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}>
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault()
                            setResumeToMove(resume)
                          }}
                        >
                          Move to
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setResumeToDelete(resume)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center justify-center h-32 bg-muted rounded-md">
                    <FileText className="h-16 w-16 text-muted-foreground" />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start text-xs text-muted-foreground">
                  <div className="flex justify-between w-full">
                    <span>Category: {getCategoryName(resume.categoryId)}</span>
                    <span>{resume.fileSize}</span>
                  </div>
                  <span>Uploaded: {resume.uploadDate}</span>
                </CardFooter>
              </Card>
            ))}
            </div>
          )}
        </ScrollArea>
      </main>

      <Dialog open={!!resumeToMove} onOpenChange={(open) => !open && setResumeToMove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Resume</DialogTitle>
            <DialogDescription>Select a category to move "{resumeToMove?.name}" to.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <ScrollArea className="h-[200px]">
              <div className="grid gap-2">
                {categories
                  .filter((cat: Category) => cat.id !== "all" && (resumeToMove ? cat.id !== resumeToMove.categoryId : true))
                  .map((category: Category) => (
                    <Button
                      key={category.id}
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        if (resumeToMove) {
                          handleChangeCategory(resumeToMove.id, category.id)
                        }
                      }}
                    >
                      {category.name}
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResumeToMove(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resumeToDelete} onOpenChange={(open) => !open && setResumeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{resumeToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResumeToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => resumeToDelete && handleDeleteResume(resumeToDelete.id)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Resume</DialogTitle>
            <DialogDescription>
              Upload a new resume to{" "}
              {categoryId === "all" ? "your collection" : `the ${categories.find((cat: Category) => cat.id === categoryId)?.name || "General"} category`}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Resume File (PDF)</Label>
              <Input id="file" type="file" accept="application/pdf" onChange={handleFileChange} />
            </div>

            {uploadResponse && (
              <div className="p-2 bg-green-50 text-green-700 rounded-md text-sm">{uploadResponse}</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
