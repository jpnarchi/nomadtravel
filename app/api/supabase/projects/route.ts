import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { accessToken } = await request.json();

        if (!accessToken) {
            return NextResponse.json(
                { error: 'Access token is required' },
                { status: 400 }
            );
        }

        const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!projectsResponse.ok) {
            const errorText = await projectsResponse.text();
            console.error('Supabase API error:', errorText);

            return NextResponse.json(
                { error: 'Failed to fetch projects from Supabase' },
                { status: projectsResponse.status }
            );
        }

        const projects = await projectsResponse.json();

        // Remove duplicates and sort by creation date
        const uniqueProjectsMap = new Map();
        for (const project of projects) {
            if (!uniqueProjectsMap.has(project.id)) {
                uniqueProjectsMap.set(project.id, project);
            }
        }

        const uniqueProjects = Array.from(uniqueProjectsMap.values());
        uniqueProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return NextResponse.json({ projects: uniqueProjects });

    } catch (error) {
        console.error('Error fetching Supabase projects:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 