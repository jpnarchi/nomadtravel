import { Chat } from "@/components/hero/chat"

export default function Home() {
  return <Chat />
}

// "use client"

// import { Button } from "@/components/ui/button"

// export default function Home() {
//   const vercelToken = "Ak9DE4hwO9sydddxeNdfUV9r"

//   const handleGetVercelToken = () => {
//     window.open("https://vercel.com/account/tokens", "_blank")
//   }

//   const handleAuthenticate = async () => {
//     const response = await fetch('https://api.vercel.com/v2/user', {
//       headers: {
//         Authorization: `Bearer ${vercelToken}`,
//         'User-Agent': 'Astri.dev',
//       },
//     });
//     const data = await response.json();
//     console.log("Authenticated");
//     console.log(data);
//   }

//   const handleFetchProjects = async () => {
//     const projectsResponse = await fetch('https://api.vercel.com/v9/projects', {
//       headers: {
//         Authorization: `Bearer ${vercelToken}`,
//         'Content-Type': 'application/json',
//       },
//       cache: 'no-store',
//     });
//     const projectsData = await projectsResponse.json();
//     console.log("Projects");
//     console.log(projectsData);
//     return projectsData;
//   }

//   const fetchProjectDetails = async (projectId: string) => {
//     const projectDetailsResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
//       headers: {
//         Authorization: `Bearer ${vercelToken}`,
//         'Content-Type': 'application/json',
//       },
//       cache: 'no-store',
//     });
//     const projectDetailsData = await projectDetailsResponse.json();
//     console.log("Project Details");
//     console.log(projectDetailsData);
//   }

//   const fetchDeployments = async (projectId: string) => {
//     const deploymentsResponse = await fetch(
//       `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1`,
//       {
//         headers: {
//           Authorization: `Bearer ${vercelToken}`,
//           'Content-Type': 'application/json',
//         },
//         cache: 'no-store',
//       },
//     );
//     const deploymentsData = await deploymentsResponse.json();
//     console.log("Deployments");
//     console.log(deploymentsData);
//   }

//   const createNewProject = async (projectName: string, framework: string) => {
//     const createProjectResponse = await fetch('https://api.vercel.com/v9/projects', {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${vercelToken}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         name: projectName,
//         framework: framework || null,
//       }),
//     });
//     const createProjectData = await createProjectResponse.json();
//     console.log("Create Project");
//     console.log(createProjectData);
//     return createProjectData;
//   }

//   const createNewDeployment = async (projectId: string, projectName: string, deploymentFiles: any) => {
//     // Create a new deployment
//     const deploymentConfig: any = {
//       name: projectName,
//       project: projectId,
//       target: 'production',
//       files: deploymentFiles,
//       buildCommand: 'npm run build',
//       outputDirectory: 'dist'
//     };

//     const deployResponse = await fetch(`https://api.vercel.com/v13/deployments`, {
//       method: 'POST',
//       headers: {
//         Authorization: `Bearer ${vercelToken}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(deploymentConfig),
//     });

//     const deployData = (await deployResponse.json()) as any;

//     // Poll for deployment status
//     let retryCount = 0;
//     const maxRetries = 60;
//     let deploymentUrl = '';
//     let deploymentState = '';

//     while (retryCount < maxRetries) {
//       const statusResponse = await fetch(`https://api.vercel.com/v13/deployments/${deployData.id}`, {
//         headers: {
//           Authorization: `Bearer ${vercelToken}`,
//         },
//       });

//       if (statusResponse.ok) {
//         const status = (await statusResponse.json()) as any;
//         deploymentState = status.readyState;
//         deploymentUrl = status.url ? `https://${status.url}` : '';

//         if (status.readyState === 'READY' || status.readyState === 'ERROR') {
//           break;
//         }
//       }

//       retryCount++;
//       await new Promise((resolve) => setTimeout(resolve, 2000));
//     }

//     if (deploymentState === 'ERROR') {
//       return { error: 'Deployment failed' };
//     }

//     if (retryCount >= maxRetries) {
//       return { error: 'Deployment timed out' };
//     }

//     return {
//       success: true,
//       deploy: {
//         id: deployData.id,
//         state: deploymentState,
//         url: deploymentUrl,
//       },
//     };
//   }

//   const handleDeploy = async () => {
//     // authenticate
//     // await handleAuthenticate();

//     // // fetch projects
//     // const projects = await handleFetchProjects();

//     // // fetch project details
//     // await fetchProjectDetails(projects.projects[0].id);

//     // // fetch deployments
//     // await fetchDeployments(projects.projects[0].id);

//     // create new project
//     // await createNewProject('test-project', 'vite');

//     // const viteFiles = [
//     //   {
//     //     file: "package.json",
//     //     data: JSON.stringify(
//     //       {
//     //         name: "vite-hello-world",
//     //         private: true,
//     //         version: "0.0.1",
//     //         type: "module",
//     //         scripts: {
//     //           dev: "vite",
//     //           build: "vite build",
//     //           preview: "vite preview --port 4173",
//     //         },
//     //         devDependencies: {
//     //           vite: "^5.4.0",
//     //         },
//     //       },
//     //       null,
//     //       2,
//     //     ),
//     //   },
//     //   {
//     //     file: "index.html",
//     //     data:
//     //       "<!doctype html>\n" +
//     //       "<html>\n" +
//     //       "  <head>\n" +
//     //       "    <meta charset=\"UTF-8\" />\n" +
//     //       "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n" +
//     //       "    <title>Hello World</title>\n" +
//     //       "  </head>\n" +
//     //       "  <body>\n" +
//     //       "    <div id=\"app\"></div>\n" +
//     //       "    <script type=\"module\" src=\"/main.js\"></script>\n" +
//     //       "  </body>\n" +
//     //       "</html>\n",
//     //   },
//     //   {
//     //     file: "main.js",
//     //     data:
//     //       "document.getElementById('app').innerHTML = '<h1>Hello World!</h1>';\n",
//     //   },
//     // ];
//     // const projectId = 'prj_XzgMBiDWgxM3V7sCIZHHdPZLblVe'
//     // const projectName = 'test-project'
//     // const result = await createNewDeployment(projectId, projectName, viteFiles)
//     // console.log("Deployment Result");
//     // console.log(result);
//   }

//   return (
//     <div className="flex flex-col items-center justify-center h-screen gap-4">
//       <h1>Deploy to vercel</h1>
//       <Button onClick={handleGetVercelToken}>Get Vercel Token</Button>
//       <Button onClick={handleDeploy}>Deploy</Button>
//     </div>
//   )
// }