'use client'

import * as React from "react"
import { Plus, Search, MoreHorizontal, Trash2, Edit2, Copy, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { TransferChatDialog } from "@/components/chat/transfer-chat-dialog"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import { formatCreationTime } from "@/lib/utils"

interface Chat {
  _id: string
  title?: string
  _creationTime: number
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { setOpen, setOpenMobile, isMobile } = useSidebar()
  const getAllChats = useQuery(api.chats.getAll)
  const deleteChat = useMutation(api.chats.deleteChat)
  const updateTitle = useMutation(api.chats.updateTitle)
  const duplicateChat = useMutation(api.chats.duplicateChat)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [editingChatId, setEditingChatId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [chatToDelete, setChatToDelete] = React.useState<{ id: string; title: string } | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isDuplicating, setIsDuplicating] = React.useState(false)

  // Filter chats based on search query
  const filteredChats = React.useMemo(() => {
    if (!getAllChats) return []
    if (!searchQuery.trim()) return getAllChats

    return getAllChats.filter((chat: Chat) =>
      chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [getAllChats, searchQuery])

  const handleNewChat = () => {
    router.push('/')
    // Collapse the sidebar after navigation
    if (isMobile) {
      setOpenMobile(false)
    } else {
      setOpen(false)
    }
  }

  const handleDeleteClick = (chatId: string, chatTitle: string) => {
    setChatToDelete({ id: chatId, title: chatTitle })
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!chatToDelete) return

    setIsDeleting(true)
    try {
      await deleteChat({ chatId: chatToDelete.id as Id<"chats"> })
      setIsDeleteDialogOpen(false)
      setChatToDelete(null)
      handleNewChat()
    } catch (error) {
      console.error('Failed to delete chat:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false)
    setChatToDelete(null)
  }

  const handleDuplicateChat = async (chatId: string) => {
    setIsDuplicating(true)
    try {
      const newChatId = await duplicateChat({ chatId: chatId as Id<"chats"> })
      router.push(`/chat/${newChatId}`)
      // Collapse the sidebar after navigation
      if (isMobile) {
        setOpenMobile(false)
      } else {
        setOpen(false)
      }
    } catch (error) {
      console.error('Failed to duplicate chat:', error)
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleEditStart = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId)
    setEditTitle(currentTitle)
  }

  const handleEditSave = async (chatId: string) => {
    if (editTitle.trim()) {
      try {
        await updateTitle({
          chatId: chatId as Id<"chats">,
          title: editTitle.trim()
        })
      } catch (error) {
        console.error('Failed to update chat title:', error)
      }
    }
    setEditingChatId(null)
    setEditTitle("")
  }

  const handleEditCancel = () => {
    setEditingChatId(null)
    setEditTitle("")
  }

  const handleKeyPress = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === "Enter") {
      handleEditSave(chatId)
    } else if (e.key === "Escape") {
      handleEditCancel()
    }
  }

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        {/* New Chat Button */}
        <div className="px-1 pt-2 pb-1">
          <Button
            onClick={handleNewChat}
            className="w-full justify-start gap-2 h-9 cursor-pointer"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            Nuevo Chat
          </Button>
        </div>

        {/* Search Input */}
        <div className="px-1 pb-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* Chat List */}
          <SidebarMenu className="gap-2">
            {filteredChats?.map((item: Chat) => (
              <SidebarMenuItem key={item._id}>
                <div className="flex items-center group w-full">
                  {editingChatId === item._id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, item._id)}
                      onBlur={() => handleEditSave(item._id)}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  ) : (
                    <>
                      <SidebarMenuButton asChild className="flex-1 min-w-0">
                        <a href={`/chat/${item._id}`} className="font-medium truncate">
                          {item.title || "Untitled Chat"}
                        </a>
                      </SidebarMenuButton>

                      {/* Three Dots Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            {formatCreationTime(item._creationTime)}
                          </div>
                          <DropdownMenuItem
                            onClick={() => handleEditStart(item._id, item.title || "")}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4 text-white" />
                            Editar título
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicateChat(item._id)}
                            className="gap-2 cursor-pointer"
                            disabled={isDuplicating}
                          >
                            {isDuplicating ? (
                              <Loader2 className="h-4 w-4 text-white animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4 text-white" />
                            )}
                            {isDuplicating ? "Duplicando" : "Duplicar"}
                          </DropdownMenuItem>
                          <div className="px-1">
                            <TransferChatDialog
                              chatId={item._id as Id<"chats">}
                              chatTitle={item.title || "Untitled Chat"}
                            />
                          </div>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(item._id, item.title || "Untitled Chat")}
                            className="gap-2 cursor-pointer text-red-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <p className="text-red-500">Eliminar</p>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </SidebarMenuItem>
            ))}

            {/* No results message */}
            {searchQuery && filteredChats?.length === 0 && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No chats encontrados que coincidan con "{searchQuery}"
              </div>
            )}

            {/* No chats message */}
            {!searchQuery && (!getAllChats || getAllChats.length === 0) && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No hay chats. Crea tu primer chat!
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Eliminar Chat</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres eliminar "{chatToDelete?.title}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-500/70 hover:bg-red-500 text-white cursor-pointer"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}