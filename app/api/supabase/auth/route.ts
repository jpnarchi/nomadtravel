import { NextResponse } from "next/server";

export async function POST() {
    const clientId = process.env.NEXT_PUBLIC_SUPABASE_CLIENT_ID
    const redirectUri = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URI

    if (!clientId || !redirectUri) {
        return NextResponse.json({ error: 'Client ID or redirect URI is not set' }, { status: 400 });
    }

    const urlParams = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code'
    });

    const supabaseAuthUrl = `https://api.supabase.com/v1/oauth/authorize?${urlParams.toString()}`

    return NextResponse.json({ url: supabaseAuthUrl });
}