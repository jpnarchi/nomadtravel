import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { code, codeVerifier } = await request.json();

        const clientId = process.env.NEXT_PUBLIC_SUPABASE_CLIENT_ID;
        const clientSecret = process.env.SUPABASE_CLIENT_SECRET;
        const redirectUri = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            return NextResponse.json(
                { error: 'Missing required environment variables' },
                { status: 500 }
            );
        }

        if (!code) {
            return NextResponse.json(
                { error: 'Authorization code is required' },
                { status: 400 }
            );
        }

        // Exchange the authorization code for an access token
        const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: redirectUri,
                code_verifier: codeVerifier || '',
            }),
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Token exchange failed:', errorData);
            return NextResponse.json(
                { error: 'Token exchange failed' },
                { status: tokenResponse.status }
            );
        }

        const data = await tokenResponse.json();

        return NextResponse.json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error('Token exchange error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}   