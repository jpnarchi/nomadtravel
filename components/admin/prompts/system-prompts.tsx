'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, Save, Eye, Edit } from 'lucide-react'

type AgentType = "main_agent" | "code_generator"

const agentInfo = {
    main_agent: {
        title: "Main Agent",
        description: "Primary conversational AI that handles general user interactions and chat responses",
        color: "default"
    },
    code_generator: {
        title: "Code Generator",
        description: "Specialized agent for generating and analyzing code in chat conversations",
        color: "secondary"
    },
    title_generator: {
        title: "Title Generator",
        description: "Agent responsible for generating meaningful titles for chat conversations",
        color: "secondary"
    },
    suggestion_generator: {
        title: "Suggestion Generator",
        description: "Agent that creates contextual suggestions to help users continue conversations",
        color: "secondary"
    }
} as const

export function SystemPrompts() {
    const [editingAgent, setEditingAgent] = useState<AgentType | null>(null)
    const [editContent, setEditContent] = useState('')

    // Fetch all prompts for each agent
    const mainAgentPrompt = useQuery(api.prompts.get, { agent: "main_agent" })
    const codeGeneratorPrompt = useQuery(api.prompts.get, { agent: "code_generator" })
    const titleGeneratorPrompt = useQuery(api.prompts.get, { agent: "title_generator" })
    const suggestionGeneratorPrompt = useQuery(api.prompts.get, { agent: "suggestion_generator" })

    const updatePrompt = useMutation(api.prompts.update)

    const prompts = {
        main_agent: mainAgentPrompt,
        code_generator: codeGeneratorPrompt,
        title_generator: titleGeneratorPrompt,
        suggestion_generator: suggestionGeneratorPrompt
    }

    const isLoading = Object.values(prompts).some(prompt => prompt === undefined)

    const handleEdit = (agent: AgentType) => {
        const prompt = prompts[agent]
        setEditingAgent(agent)
        setEditContent(prompt?.prompt || '')
    }

    const handleCancel = () => {
        setEditingAgent(null)
        setEditContent('')
    }

    const handleSave = async () => {
        if (!editingAgent) return

        try {
            await updatePrompt({
                agent: editingAgent,
                prompt: editContent
            })
            toast.success(`${agentInfo[editingAgent].title} prompt updated successfully`)
            setEditingAgent(null)
            setEditContent('')
        } catch (error) {
            toast.error('Failed to update prompt. Please try again.')
            console.error('Error updating prompt:', error)
        }
    }

    if (isLoading) {
        return (
            <div className="container mx-auto py-8">
                <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading system prompts...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="py-4 sm:py-8 space-y-4 sm:space-y-6 px-4 sm:px-0">
            <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">System Prompts</h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                    Manage the system prompts for different AI agents. These prompts define how each agent behaves and responds.
                </p>
            </div>

            <Separator />

            <div className="grid gap-4 sm:gap-6">
                {(Object.keys(agentInfo) as AgentType[]).map((agent) => {
                    const prompt = prompts[agent]
                    const info = agentInfo[agent]
                    const isEditing = editingAgent === agent

                    return (
                        <Card key={agent} className="relative">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <CardTitle className="text-xl">{info.title}</CardTitle>
                                            <Badge variant={info.color as any}>
                                                {agent.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-sm sm:text-base">{info.description}</CardDescription>
                                    </div>

                                    {!isEditing && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(agent)}
                                            className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto justify-center sm:justify-start"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Edit
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <Textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            placeholder="Enter the system prompt for this agent..."
                                            className="min-h-[200px] resize-none"
                                        />
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                                onClick={handleSave}
                                                className="flex items-center gap-2 justify-center"
                                                disabled={!editContent.trim()}
                                            >
                                                <Save className="h-4 w-4" />
                                                Save Changes
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleCancel}
                                                className="justify-center"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {prompt?.prompt ? (
                                            <div className="bg-muted/50 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        Current Prompt
                                                    </span>
                                                </div>
                                                <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">
                                                    {prompt.prompt}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 sm:p-4">
                                                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300">
                                                    No prompt configured for this agent. Click "Edit" to add one.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}