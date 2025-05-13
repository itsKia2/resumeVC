import type React from "react"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Search, Upload, MoreHorizontal, FileText, FolderOpen, Loader2 } from "lucide-react"
import { useUser } from "@clerk/clerk-react"

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
  const [categories, setCategories] = useState<Category[]>([
    { id: "all", name: "All" }
  ])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [resumeToMove, setResumeToMove] = useState<Resume | null>(null)
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadResponse, setUploadResponse] = useState<string | null>(null)

  // Fetch categories and resumes
  useEffect(() => {
    if (!isLoaded) {
      setIsLoading(true)
      return
    }

    if (isSignedIn && user) {
      const fetchData = async () => {
        setIsLoading(true)
        try {
          const categoriesResponse = await fetch('/api/categories')
          if (!categoriesResponse.ok) throw new Error('Failed to fetch categories list')
          const categoriesData = await categoriesResponse.json()
          setCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : [])

          const resumesResponse = await fetch(`/api/categories/${categoryId}/resumes`)
          if (!resumesResponse.ok) {
            throw new Error('Failed to fetch resumes')
          }
          const resumesData = await resumesResponse.json()

          const formattedResumes: Resume[] = Array.isArray(resumesData.resumes)
            ? resumesData.resumes.map((resume: any) => ({
                id: resume.id,
                name: resume.name,
                categoryId: resume.category_id,
                uploadDate: new Date(resume.date).toISOString().split('T')[0],
                fileSize: "N/A",
                link: resume.link
              }))
            : []

          setResumes(formattedResumes)
          setError(null)
        } catch (err) {
          console.error('Error fetching data:', err)
          setError('Failed to load data. Please try again later.')
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    } else {
      setIsLoading(false)
      setCategories([])
      setResumes([])
      setError("Please sign in to view your categories and resumes.")
    }
  }, [isLoaded, isSignedIn, user?.id, categoryId])

  const currentCategoryName =
    categoryId === "all"
      ? categories.find(cat => cat.id === "all")?.name || "All"
      : isLoading
        ? "Loading..."
        : categories.find(cat => cat.id.toString() === categoryId.toString())?.name || "Category Not Found"

  const filteredResumes = resumes.filter((resume) => {
    const matchesSearch = resume.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Uncategorized"
  }

  const handleDeleteResume = async (resumeId: string) => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete resume')
      }

      setResumes(resumes.filter(resume => resume.id !== resumeId))
      setResumeToDelete(null)

    } catch (err) {
      console.error('Error deleting resume:', err)
      setError('Failed to delete resume. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeCategory = async (resumeId: string, newCategoryId: string) => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/resumes/${resumeId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId: newCategoryId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to move resume')
      }

      setResumes(resumes.map((resume) =>
        resume.id === resumeId ? { ...resume, categoryId: newCategoryId } : resume
      ))

    } catch (err) {
      console.error('Error moving resume:', err)
      setError('Failed to move resume. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      // Use categoryId directly for upload
      let categoryIdToUpload = categoryId === "all" ? "" : categoryId;
      formData.append('categoryId', categoryIdToUpload)

      const response = await fetch('/api/resume-upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload resume')
      }

      await response.json()

      const resumesResponse = await fetch(`/api/categories/${categoryId}/resumes`)
      if (!resumesResponse.ok) {
        throw new Error('Failed to refresh resume list')
      }

      const resumesData = await resumesResponse.json()

      const formattedResumes: Resume[] = resumesData.resumes.map((resume: any) => ({
        id: resume.id,
        name: resume.name,
        categoryId: resume.category_id,
        uploadDate: new Date(resume.date).toISOString().split('T')[0],
        fileSize: "N/A",
        link: resume.link
      }))

      setResumes(formattedResumes)
      setUploadResponse(`Successfully uploaded ${file.name}`)

      setTimeout(() => {
        setFile(null)
        setUploadResponse(null)
        setIsUploadDialogOpen(false)
      }, 2000)

    } catch (err) {
      console.error('Error uploading file:', err)
      setUploadResponse(`Error: Failed to upload ${file.name}. Please try again.`)
    } finally {
      setIsUploading(false)
    }
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
          {isLoading ? (
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
                  .filter((cat) => cat.id !== "all" && (resumeToMove ? cat.id !== resumeToMove.categoryId : true))
                  .map((category) => (
                    <Button
                      key={category.id}
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        if (resumeToMove) {
                          handleChangeCategory(resumeToMove.id, category.id)
                          setResumeToMove(null)
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
            <Button variant="destructive" onClick={() => resumeToDelete && handleDeleteResume(resumeToDelete.id)}>
              Delete
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
              {categoryId === "all" ? "your collection" : `the ${categories.find((cat) => cat.id === categoryId)?.name || "General"} category`}.
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
