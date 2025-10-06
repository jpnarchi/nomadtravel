import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

export const getOAuthUrl = action({
    args: {
        redirectUri: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        if (!args.redirectUri) {
            throw new Error("Redirect URI is required");
        }

        const clientId = process.env.SUPABASE_CLIENT_ID;

        if (!clientId) {
            throw new Error("Client ID is required");
        }

        const urlParams = new URLSearchParams({
            client_id: clientId,
            redirect_uri: args.redirectUri,
            response_type: 'code'
        });

        const supabaseOAuthUrl = `https://api.supabase.com/v1/oauth/authorize?${urlParams.toString()}`

        return supabaseOAuthUrl
    },
});

export const exangeCodeForToken = action({
    args: {
        code: v.string(),
        redirectUri: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!args.code || !args.redirectUri) {
            throw new Error("Code and redirect URI are required");
        }

        const clientId = process.env.SUPABASE_CLIENT_ID;
        const clientSecret = process.env.SUPABASE_CLIENT_SECRET;

        const result = await fetch('https://api.supabase.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: args.code,
                redirect_uri: args.redirectUri,
                code_verifier: '',
            }),
        });

        if (!result.ok) {
            return null;
        }

        const data = await result.json();

        return data;
    },
});

export const getOrganizations = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user?.supabaseAccessToken) {
            throw new Error("Supabase access token is required");
        }

        const result = await fetch('https://api.supabase.com/v1/organizations', {
            headers: {
                Authorization: `Bearer ${user.supabaseAccessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!result.ok) {
            const errorText = await result.text();
            console.error('Supabase API error:', errorText);
            return null
        }

        const organizations = await result.json();

        return organizations;
    },
});


export const fetchProjects = action({
    args: {},
    handler: async (ctx): Promise<any> => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user?.supabaseAccessToken) {
            throw new Error("Supabase access token is required");
        }

        const result = await fetch('https://api.supabase.com/v1/projects', {
            headers: {
                Authorization: `Bearer ${user.supabaseAccessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!result.ok) {
            const errorText = await result.text();
            console.error('Supabase API error:', errorText);
            return null
        }

        const projects = await result.json();

        // Remove duplicates and sort by creation date
        const uniqueProjectsMap = new Map();
        for (const project of projects) {
            if (!uniqueProjectsMap.has(project.id)) {
                uniqueProjectsMap.set(project.id, project);
            }
        }

        const uniqueProjects = Array.from(uniqueProjectsMap.values());
        uniqueProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return { projects: uniqueProjects };
    },
});