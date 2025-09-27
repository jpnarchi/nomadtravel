'use client'

import * as React from "react"
import { Plus, Search, MoreHorizontal, Trash2, Edit2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"

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
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useQuery } from "convex/react"
import Image from "next/image"

interface Chat {
  _id: string
  title?: string
  // Add other chat properties as needed
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { setOpen, setOpenMobile, isMobile } = useSidebar()
  const getAllChats = useQuery(api.chats.getAll)
  const deleteChat = useMutation(api.chats.deleteChat)
  const updateTitle = useMutation(api.chats.updateTitle)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [editingChatId, setEditingChatId] = React.useState<string | null>(null)
  const [editTitle, setEditTitle] = React.useState("")

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

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat({ chatId: chatId as Id<"chats"> })
    } catch (error) {
      console.error('Failed to delete chat:', error)
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
        <SidebarMenu>
          <SidebarMenuItem>
            <Image
              src="/lentes.svg"
              alt="Logo"
              width={32}
              height={32}
              priority
              className="mt-2 ml-2"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* New Chat Button */}
          <div className="px-1 pb-2">
            <Button
              onClick={handleNewChat}
              className="w-full justify-start gap-2 h-9 cursor-pointer"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Search Input */}
          <div className="px-1 pb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>

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
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleEditStart(item._id, item.title || "")}
                            className="gap-2 cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4 text-white" />
                            Edit title
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteChat(item._id)}
                            className="gap-2 cursor-pointer text-red-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                            <p className="text-red-500">Delete</p>
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
                No chats found matching "{searchQuery}"
              </div>
            )}

            {/* No chats message */}
            {!searchQuery && (!getAllChats || getAllChats.length === 0) && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No chats yet. Create your first chat!
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}