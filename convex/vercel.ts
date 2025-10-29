import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { action, internalAction } from "./_generated/server";

const viteFiles = [
    {
        file: "package.json",
        data: JSON.stringify(
            {
                name: "vite-react-app",
                private: true,
                version: "0.0.1",
                type: "module",
                scripts: {
                    dev: "vite",
                    build: "vite build",
                    preview: "vite preview --port 4173",
                },
                dependencies: {
                    react: "^18.3.0",
                    "react-dom": "^18.3.0",
                },
                devDependencies: {
                    "@vitejs/plugin-react": "^4.3.0",
                    vite: "^5.4.0",
                    tailwindcss: "^3.4.0",
                    postcss: "^8.4.0",
                    autoprefixer: "^10.4.0",
                },
            },
            null,
            2,
        ),
    },
    {
        file: "index.html",
        data:
            "<!doctype html>\n" +
            "<html lang=\"en\">\n" +
            "  <head>\n" +
            "    <meta charset=\"UTF-8\" />\n" +
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n" +
            "    <title>Astri</title>\n" +
            "  </head>\n" +
            "  <body>\n" +
            "    <div id=\"root\"></div>\n" +
            "    <script type=\"module\" src=\"/src/main.jsx\"></script>\n" +
            "  </body>\n" +
            "</html>\n",
    },
    {
        file: "src/main.jsx",
        data:
            "import React from 'react';\n" +
            "import ReactDOM from 'react-dom/client';\n" +
            "import App from './App';\n" +
            "import './index.css';\n\n" +
            "ReactDOM.createRoot(document.getElementById('root')).render(\n" +
            "  <React.StrictMode>\n" +
            "    <App />\n" +
            "  </React.StrictMode>,\n" +
            ");\n",
    },
    // {
    //     file: "src/App.jsx",
    //     data:
    //         "import { useState } from 'react';\n" +
    //         "import Button from './components/Button';\n\n" +
    //         "function App() {\n" +
    //         "  return (\n" +
    //         "    <div className=\"min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center\">\n" +
    //         "      <div className=\"text-center space-y-8\">\n" +
    //         "        <h1 className=\"text-5xl font-bold text-gray-800\">Hello World!</h1>\n" +
    //         "        <p className=\"text-xl text-gray-600\">Welcome to Vite + React + Tailwind CSS</p>\n" +
    //         "        <Button />\n" +
    //         "      </div>\n" +
    //         "    </div>\n" +
    //         "  );\n" +
    //         "}\n\n" +
    //         "export default App;\n",
    // },
    // {
    //     file: "src/components/Button.jsx",
    //     data:
    //         "import { useState } from 'react';\n\n" +
    //         "function Button() {\n" +
    //         "  const [count, setCount] = useState(0);\n\n" +
    //         "  return (\n" +
    //         "    <button\n" +
    //         "      onClick={() => setCount(count + 1)}\n" +
    //         "      className=\"px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg transform hover:scale-105 transition-all duration-200 active:scale-95\"\n" +
    //         "    >\n" +
    //         "      {count === 0 ? 'Click Me!' : `Clicked ${count} time${count === 1 ? '' : 's'}!`}\n" +
    //         "    </button>\n" +
    //         "  );\n" +
    //         "}\n\n" +
    //         "export default Button;\n",
    // },
    {
        file: "src/index.css",
        data:
            "@tailwind base;\n" +
            "@tailwind components;\n" +
            "@tailwind utilities;\n",
    },
    {
        file: "vite.config.js",
        data:
            "import { defineConfig } from 'vite';\n" +
            "import react from '@vitejs/plugin-react';\n\n" +
            "export default defineConfig({\n" +
            "  plugins: [react()],\n" +
            "  server: {\n" +
            "    historyApiFallback: true\n" +
            "  },\n" +
            "});\n",
    },
    {
        file: "tailwind.config.js",
        data:
            "/** @type {import('tailwindcss').Config} */\n" +
            "export default {\n" +
            "  content: [\n" +
            "    './index.html',\n" +
            "    './src/**/*.{js,jsx}',\n" +
            "  ],\n" +
            "  theme: {\n" +
            "    extend: {},\n" +
            "  },\n" +
            "  plugins: [],\n" +
            "}\n",
    },
    {
        file: "postcss.config.js",
        data:
            "export default {\n" +
            "  plugins: {\n" +
            "    tailwindcss: {},\n" +
            "    autoprefixer: {},\n" +
            "  },\n" +
            "}\n",
    },
    {
        file: "vercel.json",
        data: JSON.stringify({
            "rewrites": [
                {
                    "source": "/(.*)",
                    "destination": "/index.html"
                }
            ]
        }, null, 2),
    }
];

// Function to convert React files to Vite format
function convertToViteFormat(files: Record<string, string>) {
    const initialFiles = Object.entries(files).map(([path, content]) => ({
        file: path,
        data: content,
    }));

    const vFiles = new Map(viteFiles.map((file) => [file.file, file.data]));

    // Find and parse package.json from input files
    let inputPackageJson = null;
    for (const file of initialFiles) {
        const fileName = file.file.slice(1);
        if (fileName.includes('package.json')) {
            try {
                inputPackageJson = JSON.parse(file.data);
            } catch (e) {
                console.error('Error parsing input package.json:', e);
            }
            break;
        }
    }

    // Merge dependencies from input package.json into vite package.json
    if (inputPackageJson && vFiles.has('package.json')) {
        try {
            const vitePackageJson = JSON.parse(vFiles.get('package.json')!);

            // Merge dependencies from input, excluding react-scripts and other non-vite packages
            if (inputPackageJson.dependencies) {
                const excludedDeps = ['react-scripts', 'web-vitals'];
                for (const [dep, version] of Object.entries(inputPackageJson.dependencies)) {
                    if (!excludedDeps.includes(dep) && !vitePackageJson.dependencies[dep]) {
                        vitePackageJson.dependencies[dep] = version;
                    }
                }
            }

            // Update the vFiles map with the merged package.json
            vFiles.set('package.json', JSON.stringify(vitePackageJson, null, 2));
        } catch (e) {
            console.error('Error merging package.json:', e);
        }
    }

    // Process other files (excluding package.json, index.html, index.js, styles.css)
    // for (const file of initialFiles) {
    //     const fileName = file.file.slice(1);
    //     if (!fileName.includes('public/index.html') && !fileName.includes('index.js') && !fileName.includes('styles.css') && !fileName.includes('package.json')) {
    //         const newFileName = 'src/' + fileName.replace('.js', '.jsx');
    //         if (!vFiles.has(newFileName)) {
    //             vFiles.set(newFileName, file.data);
    //         }
    //     }
    // }
    for (const file of initialFiles) {
        const fileName = file.file.slice(1);

        if (!fileName.includes('public/index.html') &&
            !fileName.includes('index.js') &&
            !fileName.includes('styles.css') &&
            !fileName.includes('package.json')) {

            const newFileName = 'src/' + fileName.replace('.js', '.jsx');

            if (!vFiles.has(newFileName)) {
                let fileContent = file.data;

                // Calculate the directory depth of the current file
                // e.g., 'src/App.jsx' = 0 levels, 'src/components/TestPage.jsx' = 1 level
                const fileDepth = (newFileName.match(/\//g) || []).length - 1;

                // Fix absolute imports starting with '/' (convert to relative path)
                fileContent = fileContent.replace(
                    /from\s+['"]\/([^'"]+)['"]/g,
                    (match, importPath) => {
                        // Build relative path based on depth
                        const relativePath = fileDepth === 0 ? './' : '../'.repeat(fileDepth);
                        return `from '${relativePath}${importPath}'`;
                    }
                );

                vFiles.set(newFileName, fileContent);
            }
        }
    }

    const filesArray = Array.from(vFiles, ([file, data]) => ({ file, data })); 
    // console.log(filesArray);

    return filesArray;
}

function normalizeSiteName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/-+$/, '');
}

export const deploy = action({
    args: {
        id: v.id('chats'),
        version: v.number(),
    },
    handler: async (ctx, args): Promise<any> => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        if (user.role !== "admin" && user.plan !== "pro" && user.plan !== "premium") {
            throw new Error("User does not have permission to deploy");
        }

        if (!args.id) {
            throw new Error("Chat ID is required");
        }

        if (!args.version) {
            throw new Error("Version is required");
        }

        const chat = await ctx.runQuery(api.chats.getById, { chatId: args.id });

        if (!chat) {
            throw new Error("Chat not found");
        }

        if (chat.userId !== user._id && user.role !== "admin") {
            throw new Error("Access denied");
        }

        const isAuthenticated = await ctx.runAction(internal.vercel.authenticate, {});

        if (!isAuthenticated) {
            throw new Error("Not authenticated");
        }

        let projectId = '';

        if (chat.vercelProjectId) {
            projectId = chat.vercelProjectId;
        } else {
            let projectName = chat.title || `Nuevo Proyecto`;
            projectName = normalizeSiteName(`${projectName}-${args.id}`).slice(0, 30);
            if (projectName.endsWith('-') || projectName.endsWith('_')) {
                projectName = projectName.slice(0, -1);
            }
            projectId = await ctx.runAction(internal.vercel.createProject, {
                chatId: args.id,
                name: projectName,
                framework: "vite",
            });
        }

        const projectInfo = await ctx.runAction(internal.vercel.getProjectInfo, { projectId: projectId });

        const files = await ctx.runQuery(api.files.getAll, { chatId: args.id, version: args.version });

        // Convert React files to Vite format
        const deploymentFiles = convertToViteFormat(files);

        const { success, error, deploymentUrl } = await ctx.runAction(internal.vercel.createDeployment, {
            projectId: projectId,
            projectName: projectInfo.name,
            deploymentFiles: deploymentFiles,
            projectUrl: `https://${projectInfo.name}.vercel.app`,
        });

        if (!success) {
            throw new Error(error || "Deployment failed");
        }

        await ctx.runMutation(api.chats.updatedDeploymentUrl, {
            chatId: args.id,
            deploymentUrl: deploymentUrl,
        });

        return { success: true, deploymentUrl: deploymentUrl };
    },
});

export const authenticate = internalAction({
    args: {},
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        const response = await fetch('https://api.vercel.com/v2/user', {
            headers: {
                Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
                'User-Agent': 'Astri.dev',
            },
        });
        const data = await response.json();
        if (!data) {
            return false;
        }
        return true;
    },
})

export const createProject = internalAction({
    args: {
        chatId: v.id('chats'),
        name: v.string(),
        framework: v.string()
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        const response = await fetch('https://api.vercel.com/v9/projects', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
                'User-Agent': 'Astri.dev',
            },
            body: JSON.stringify({
                name: args.name,
                framework: args.framework || null,
            }),
        });
        const data = await response.json();
        if (!data) {
            return null;
        }

        await ctx.runMutation(api.chats.updateVercelProjectId, {
            chatId: args.chatId,
            vercelProjectId: data.id,
        });

        return data.id;
    },
})

export const createDeployment = internalAction({
    args: {
        projectId: v.string(),
        projectName: v.string(),
        deploymentFiles: v.array(v.object({
            file: v.string(),
            data: v.string(),
        })),
        projectUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        const deploymentConfig: any = {
            name: args.projectName,
            project: args.projectId,
            target: 'production',
            files: args.deploymentFiles,
            buildCommand: 'npm install && npm run build',
            outputDirectory: 'dist'
        };
        const response = await fetch('https://api.vercel.com/v13/deployments', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(deploymentConfig),
        });

        const deployData = (await response.json()) as any;

        if (!response.ok) {
            return {
                error: deployData.error?.message || 'Deployment request failed',
                success: false,
                deploymentUrl: ''
            };
        }

        // Poll for deployment status
        let retryCount = 0;
        const maxRetries = 60;
        let deploymentUrl = '';
        let deploymentState = '';

        while (retryCount < maxRetries) {
            const statusResponse = await fetch(`https://api.vercel.com/v13/deployments/${deployData.id}`, {
                headers: {
                    Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
                },
            });

            if (statusResponse.ok) {
                const status = (await statusResponse.json()) as any;
                deploymentState = status.readyState;
                deploymentUrl = status.url ? `https://${status.url}` : '';

                if (status.readyState === 'READY' || status.readyState === 'ERROR') {
                    break;
                }
            }

            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        if (deploymentState === 'ERROR') {
            return { error: 'Deployment failed', success: false, deploymentUrl: '' };
        }

        if (retryCount >= maxRetries) {
            return { error: 'Deployment timed out', success: false, deploymentUrl: '' };
        }

        return {
            success: true,
            error: null,
            deploymentUrl: args.projectUrl || deploymentUrl,
        };
    },
})

export const getProjectInfo = internalAction({
    args: {
        projectId: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(api.users.getUserInfo, {});

        if (!user) {
            throw new Error("User not found");
        }

        if (!args.projectId) {
            throw new Error("Project ID is required");
        }

        const response = await fetch(`https://api.vercel.com/v9/projects/${args.projectId}`, {
            headers: {
                Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });
        const data = await response.json();
        if (!data) {
            return null;
        }
        return data
    },
})