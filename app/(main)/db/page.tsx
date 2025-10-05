'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Project {
    id: string;
    name: string;
    status: string;
    region: string;
    created_at: string;
    database: {
        host: string;
        version: string;
        postgres_engine: string;
        release_channel: string;
    };
    organization_id: string;
}

export default function Page() {
    const searchParams = useSearchParams()
    const code = searchParams.get('code')
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSupabaseConnect = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/supabase/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
            const data = await response.json()
            console.log('DATA FRONT', data.url)
            window.location.href = data.url
        } catch (err) {
            setError('Failed to connect to Supabase')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (code) {
            handleSupabaseToken()
        }
    }, [code])

    const handleSupabaseToken = async () => {
        setLoading(true)
        setError(null)
        try {
            const response = await fetch('/api/supabase/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code: code }),
            })
            const result = await response.json()
            const accessToken = result.data.access_token
            const refreshToken = result.data.refresh_token
            const expiresIn = result.data.expires_in
            const tokenType = result.data.token_type

            handleSupabaseProjects(accessToken)
        } catch (err) {
            setError('Failed to get access token')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleSupabaseProjects = async (accessToken: string) => {
        try {
            const response = await fetch('/api/supabase/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ accessToken: accessToken }),
            })
            const result = await response.json()
            console.log('PROJECTS', result)
            setProjects(result.projects || [])
        } catch (err) {
            setError('Failed to fetch projects')
            console.error(err)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-500'
            case 'inactive':
                return 'bg-gray-500'
            default:
                return 'bg-yellow-500'
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Supabase Projects</h1>
                <Button
                    onClick={handleSupabaseConnect}
                    disabled={loading}
                    className="min-w-[150px]"
                >
                    {loading ? 'Connecting...' : 'Connect to Supabase'}
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {code && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-blue-800">Authorization code received: {code}</p>
                </div>
            )}

            {projects.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Your Projects ({projects.length})</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <Card key={project.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{project.name}</CardTitle>
                                        <Badge
                                            className={`${getStatusColor(project.status)} text-white`}
                                        >
                                            {project.status}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        ID: {project.id}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="font-medium">Region:</span>
                                            <p className="text-gray-600">{project.region}</p>
                                        </div>
                                        <div>
                                            <span className="font-medium">Created:</span>
                                            <p className="text-gray-600">
                                                {new Date(project.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="text-sm">
                                            <span className="font-medium">Database:</span>
                                            <div className="mt-1 space-y-1 text-gray-600">
                                                <p>Host: {project.database.host}</p>
                                                <p>Version: {project.database.version}</p>
                                                <p>Engine: PostgreSQL {project.database.postgres_engine}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {projects.length === 0 && !loading && !error && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No projects found. Connect to Supabase to see your projects.</p>
                </div>
            )}
        </div>
    )
}