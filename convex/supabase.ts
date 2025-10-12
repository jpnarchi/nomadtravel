import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

export const getOAuthUrl = action({
    args: {
        redirectUri: v.string(),
        state: v.optional(v.string()),
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

        // Add state parameter if provided (for passing chat ID)
        if (args.state) {
            urlParams.append('state', args.state);
        }

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

export const createProject = action({
    args: {
        name: v.string(),
        dbPass: v.string(),
        organizationId: v.string(),
        region: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user?.supabaseAccessToken) {
            throw new Error("Supabase access token is required");
        }

        const result = await fetch('https://api.supabase.com/v1/projects', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.supabaseAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: args.name,
                db_pass: args.dbPass,
                organization_id: args.organizationId,
                region: args.region,
            }),
        });

        if (!result.ok) {
            const errorText = await result.text();
            console.error('Supabase API error:', errorText);
            return {
                success: false,
                error: errorText,
                project: null,
            }
        }

        const project = await result.json();

        return {
            success: true,
            project: project,
            error: null,
        }
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

export const executeSQLQuery = action({
    args: {
        query: v.string(),
        projectId: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user?.supabaseAccessToken) {
            throw new Error("Supabase access token is required");
        }

        if (!args.projectId) {
            throw new Error("Project ID is required");
        }

        const response = await fetch(`https://api.supabase.com/v1/projects/${args.projectId}/database/query`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.supabaseAccessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: args.query }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase API error:', errorText);
            return {
                success: false,
                error: errorText,
                message: `Error ${response.status}: ${errorText}`
            };
        }

        const data = await response.json();

        return {
            success: true,
            data: data,
            message: 'Consulta SQL ejecutada exitosamente'
        };
    },
});

export const getSupabaseAnonKey = action({
    args: {
        projectId: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user?.supabaseAccessToken) {
            throw new Error("Supabase access token is required");
        }

        if (!args.projectId) {
            throw new Error("Project ID is required");
        }

        const response = await fetch(`https://api.supabase.com/v1/projects/${args.projectId}/api-keys`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${user.supabaseAccessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase API error:', errorText);
            return errorText;
        }

        const apiKeys = await response.json();

        const anonKey = apiKeys[0].api_key;

        return { anonKey };
    },
});

export const saveStripeCredentials = action({
    args: {
        publishableKey: v.string(),
        secretKey: v.string(),
        webhookSecret: v.string(),
        projectId: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.supabaseAccessToken) {
            throw new Error("Supabase access token is required");
        }

        if (!args.projectId) {
            throw new Error("Project ID is required");
        }

        // Save Stripe credentials as secrets in Supabase
        const response = await fetch(`https://api.supabase.com/v1/projects/${args.projectId}/secrets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.supabaseAccessToken}`
            },
            body: JSON.stringify([
                {
                    name: 'STRIPE_PUBLISHABLE_KEY',
                    value: args.publishableKey
                },
                {
                    name: 'STRIPE_SECRET_KEY',
                    value: args.secretKey
                },
                {
                    name: 'STRIPE_WEBHOOK_SECRET',
                    value: args.webhookSecret
                }
            ])
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase secrets API error:', errorText);
            return {
                success: false,
                error: errorText,
            };
        }

        return { success: true };
    },
});

export const restoreProject = action({
    args: {
        projectId: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user?.supabaseAccessToken) {
            throw new Error("Supabase access token is required");
        }

        if (!args.projectId) {
            throw new Error("Project ID is required");
        }

        const response = await fetch(`https://api.supabase.com/v1/projects/${args.projectId}/restore`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.supabaseAccessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Supabase API error:', errorText);
            return {
                success: false,
                error: errorText,
            };
        }

        return {
            success: true,
            error: null,
        };
    },
});

export const deployEdgeFunction = action({
    args: {
        functionName: v.string(),
        fileContent: v.string(),
        projectId: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        if (!user.supabaseAccessToken) {
            throw new Error("Supabase access token is required");
        }

        if (!args.projectId) {
            throw new Error("Project ID is required");
        }

        if (!args.functionName) {
            throw new Error("Function name is required");
        }

        if (!args.fileContent) {
            throw new Error("File content is required");
        }

        const METADATA = {
            name: args.functionName,
            entrypoint_path: 'index.ts',
            verify_jwt: false,
            static_patterns: [],
        };

        // Build multipart/form-data body
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(METADATA)], { type: 'application/json' }));
        // Provide the function source as a file - Supabase expects the file path to match entrypoint_path
        form.append('file', new Blob([args.fileContent], { type: 'application/typescript' }), 'index.ts');

        // Deploy to Supabase (slug as query param)
        const url = `https://api.supabase.com/v1/projects/${args.projectId}/functions/deploy?slug=${encodeURIComponent(args.functionName)}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.supabaseAccessToken}`,
                Accept: 'application/json',
            },
            body: form,
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: errorText,
                status: response.status,
                message: `Error ${response.status}: ${errorText}`,
            };
        }

        const data = await response.json();
        return {
            success: true,
            data,
            message: 'Function deployed successfully',
        };
    },
});