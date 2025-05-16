// React is used implicitly for JSX

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Search, MoreHorizontal, ChevronRight, FolderOpen, Loader2 } from "lucide-react"
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { SignInAlert } from "@/components/ui/SignInAlert"
import { fetcher } from "@/lib/utils"

// Types
interface Category {
    id: string
    name: string
    resumeCount: number
}

// Mutation function for creating a new category
async function createCategoryFetcher(url: string, { arg }: { arg: { name: string } }) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(arg)
    });
    
    if (!response.ok) {
        throw new Error('Failed to create category');
    }
    
    return response.json();
}

// Mutation function for renaming category
async function renameCategoryFetcher(url: string, { arg }: { arg: { id: string, name: string } }) {
    const response = await fetch(`${url}/${arg.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: arg.name })
    });
    
    if (!response.ok) {
        throw new Error('Failed to rename category');
    }
    
    return response.json();
}

// Mutation function for deleting category
async function deleteCategoryFetcher(url: string, { arg }: { arg: { id: string } }) {
    const response = await fetch(`${url}/${arg.id}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        throw new Error('Failed to delete category');
    }
    
    return response.json();
}

export default function CategoriesPage() {
    const navigate = useNavigate()
    const { user } = useUser()

    // State
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [newCategoryName, setNewCategoryName] = useState<string>("")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false)
    const [categoryToRename, setCategoryToRename] = useState<Category | null>(null)
    const [newName, setNewName] = useState<string>("")
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState<boolean>(false)
    const [isCategoryDeleteDialogOpen, setIsCategoryDeleteDialogOpen] = useState<boolean>(false)
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

    // Data fetching using SWR
    const {
        data,
        error: fetchError,
        isLoading,
        mutate
    } = useSWR(user ? '/api/categories' : null, fetcher)
    
    // Category creation mutation
    const { trigger: createCategory } = useSWRMutation('/api/categories', createCategoryFetcher, {
        onSuccess: () => {
            // Revalidate the categories list
            mutate();
            setNewCategoryName("");
            setIsCreateDialogOpen(false);
        }
    })
    
    // Category renaming mutation
    const { trigger: renameCategory } = useSWRMutation('/api/categories', renameCategoryFetcher, {
        onSuccess: () => {
            // Revalidate the categories list
            mutate();
            setCategoryToRename(null);
            setNewName("");
            setIsRenameDialogOpen(false);
        }
    })
    
    // Category deletion mutation
    const { trigger: deleteCategory } = useSWRMutation('/api/categories', deleteCategoryFetcher, {
        onSuccess: () => {
            // Revalidate the categories list
            mutate();
            setCategoryToDelete(null);
            setIsCategoryDeleteDialogOpen(false);
        }
    })

    // Extract categories from the data
    const categories: Category[] = data?.categories || [];
    
    // Filter categories based on search query
    const filteredCategories = categories.filter((category: Category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    // Handlers
    const handleCreateCategory = async () => {
        if (newCategoryName.trim()) {
            createCategory({ name: newCategoryName.trim() });
        }
    }

    const handleRenameCategory = async () => {
        if (categoryToRename && newName.trim() && categoryToRename.id !== 'all') {
            renameCategory({ id: categoryToRename.id, name: newName.trim() });
        }
    }

    const handleDeleteCategory = async (categoryId: string) => {
        // Don't allow deleting the "All" category
        if (categoryId === "all") return;
        deleteCategory({ id: categoryId });
    }

    const navigateToCategory = (categoryId: string) => {
        navigate(`/categories/${categoryId}`)
    }

    // Extract error message
    const error = fetchError ? 'Failed to load categories. Please try again later.' : null;

    return (
        <>
            <SignedOut>
                <SignInAlert />
            </SignedOut>
            <SignedIn>
                <div className="min-h-screen flex flex-col p-6">
                    {/* Main Content */}
                    <main className="flex-1">
                        <div className="flex items-center justify-between mb-6 border-b pb-4">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" className="p-0 h-auto font-semibold text-lg" onClick={() => navigate("/categories")}>
                                        <FolderOpen className="h-5 w-5 mr-2" />
                                        Categories
                                    </Button>
                                </div>

                                <div className="relative w-64 ml-4">
                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search categories..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">

                                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Category
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create New Category</DialogTitle>
                                            <DialogDescription>Enter a name for your new category.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={(e) => {
                                            e.preventDefault();
                                            handleCreateCategory();
                                        }}>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="name">Name</Label>
                                                    <Input
                                                        id="name"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="Category name"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button type="submit">Create</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center h-48">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="ml-2 text-lg">Loading categories...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center p-6 bg-red-50 text-red-600 rounded-md">
                                {error}
                            </div>
                        ) : filteredCategories.length === 0 && searchQuery === "" ? (
                            <div className="text-center p-6 text-muted-foreground">
                                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                <p className="text-lg mb-2">No categories yet.</p>
                                <p className="text-sm mb-4">Get started by creating a new category.</p>
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Category
                                </Button>
                            </div>
                        ) : filteredCategories.length === 0 && searchQuery !== "" ? (
                             <div className="text-center p-6 text-muted-foreground">
                                <p className="text-lg">No categories found for "{searchQuery}".</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {filteredCategories.map((category: Category) => (
                                    <Card key={category.id} className="overflow-hidden">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <CardTitle className="text-lg">{category.name}</CardTitle>
                                                {category.id !== "all" && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                                <span className="sr-only">Actions</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setCategoryToRename(category)
                                                                    setNewName(category.name)
                                                                    setIsRenameDialogOpen(true)
                                                                }}
                                                            >
                                                                Rename
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => {
                                                                    setCategoryToDelete(category)
                                                                    setIsCategoryDeleteDialogOpen(true)
                                                                }}
                                                            >
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-2">
                                            <p className="text-sm text-muted-foreground">
                                                {category.resumeCount} {category.resumeCount === 1 ? "resume" : "resumes"}
                                            </p>
                                        </CardContent>
                                        <CardFooter>
                                            <Button variant="default" className="w-full" onClick={() => navigateToCategory(category.id)}>
                                                View Resumes
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </main>

                    {/* Rename Category Dialog */}
                    <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Rename Category</DialogTitle>
                                <DialogDescription>Enter a new name for this category.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleRenameCategory();
                            }}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="rename">Name</Label>
                                        <Input
                                            id="rename"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Category name"
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">Save</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Category Confirmation Dialog */}
                    <Dialog open={isCategoryDeleteDialogOpen} onOpenChange={setIsCategoryDeleteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete Category</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to delete the category "{categoryToDelete?.name}"? All resumes in this category will
                                    be moved to Uncategorized.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                categoryToDelete && handleDeleteCategory(categoryToDelete.id);
                            }}>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCategoryDeleteDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="destructive">
                                        Delete
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </SignedIn>
        </>
    )
}
