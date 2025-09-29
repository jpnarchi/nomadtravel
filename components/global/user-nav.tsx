// "use client"

// import {
//     Avatar,
//     AvatarFallback,
//     // AvatarImage,
// } from "@/components/ui/avatar"
// import { Button } from "@/components/ui/button"
// import {
//     DropdownMenu,
//     DropdownMenuContent,
//     DropdownMenuGroup,
//     DropdownMenuItem,
//     DropdownMenuLabel,
//     DropdownMenuSeparator,
//     DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import {
//     Settings,
//     UserPlus,
//     Gift,
//     HelpCircle,
//     Crown,
//     ChevronsUpDown,
//     LogOut
// } from "lucide-react"

// export function UserNav() {
//     return (
//         <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" className="relative h-8 w-8 rounded-full cursor-pointer">
//                     <Avatar className="h-8 w-8">
//                         {/* <AvatarImage src="/avatars/01.png" alt="@username" /> */}
//                         <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
//                             H
//                         </AvatarFallback>
//                     </Avatar>
//                 </Button>
//                 {/* <div className="flex flex-row gap-2">
//                     <Button variant="ghost" className="cursor-pointer">
//                         Login
//                     </Button>
//                     <Button variant="default" className="cursor-pointer">
//                         Register
//                     </Button>
//                 </div> */}
//             </DropdownMenuTrigger>
//             <DropdownMenuContent className="w-64" align="end" forceMount>
//                 <DropdownMenuLabel className="font-normal">
//                     <div className="flex flex-col space-y-1">
//                         <div className="flex items-center space-x-2">
//                             <Avatar className="h-8 w-8">
//                                 {/* <AvatarImage src="/avatars/01.png" alt="@username" /> */}
//                                 <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
//                                     H
//                                 </AvatarFallback>
//                             </Avatar>
//                             <div className="flex flex-col gap-1">
//                                 <p className="text-sm font-medium leading-none">Hans Preinfalk</p>
//                                 <p className="text-xs leading-none text-muted-foreground">
//                                     hans@gmail.com
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 </DropdownMenuLabel>

//                 <DropdownMenuSeparator />

//                 <DropdownMenuGroup>
//                     <DropdownMenuItem className="flex items-center justify-between">
//                         <div className="flex items-center">
//                             <Crown className="mr-2 h-4 w-4" />
//                             <span>Turn Pro</span>
//                         </div>
//                         <Button size="sm" className="h-6 px-2 text-xs">
//                             Upgrade
//                         </Button>
//                     </DropdownMenuItem>
//                 </DropdownMenuGroup>

//                 <DropdownMenuSeparator />

//                 <DropdownMenuGroup>
//                     <DropdownMenuLabel className="text-xs text-muted-foreground">
//                         <div className="flex items-center justify-between">
//                             <span>Credits</span>
//                             <span>5 left</span>
//                         </div>
//                         <div className="mt-1 h-1 bg-secondary rounded-full overflow-hidden">
//                             <div className="h-full bg-primary rounded-full" style={{ width: "20%" }}></div>
//                         </div>
//                         <div className="flex items-center mt-1 text-xs">
//                             <div className="w-1 h-1 bg-muted-foreground rounded-full mr-1"></div>
//                             <span>Daily credits reset at midnight UTC</span>
//                         </div>
//                     </DropdownMenuLabel>
//                 </DropdownMenuGroup>

//                 <DropdownMenuSeparator />

//                 <DropdownMenuGroup>
//                     <DropdownMenuItem>
//                         <Settings className="mr-2 h-4 w-4" />
//                         <span>Settings</span>
//                     </DropdownMenuItem>
//                     <DropdownMenuItem>
//                         <UserPlus className="mr-2 h-4 w-4" />
//                         <span>Invite</span>
//                     </DropdownMenuItem>
//                 </DropdownMenuGroup>

//                 <DropdownMenuSeparator />

//                 <DropdownMenuGroup>
//                     <DropdownMenuItem>
//                         <Gift className="mr-2 h-4 w-4" />
//                         <span>Get free credits</span>
//                     </DropdownMenuItem>
//                     <DropdownMenuItem>
//                         <HelpCircle className="mr-2 h-4 w-4" />
//                         <span>Help Center</span>
//                     </DropdownMenuItem>
//                     <DropdownMenuItem className="flex items-center justify-between">
//                         <span>Appearance</span>
//                         <ChevronsUpDown className="h-3 w-3" />
//                     </DropdownMenuItem>
//                 </DropdownMenuGroup>

//                 <DropdownMenuSeparator />

//                 <DropdownMenuItem>
//                     <LogOut className="mr-2 h-4 w-4" />
//                     <span>Sign out</span>
//                 </DropdownMenuItem>
//             </DropdownMenuContent>
//         </DropdownMenu>
//     )
// }


"use client"

import { UserButton } from "@clerk/nextjs"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { Info, Lock, Laptop2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserNav() {
    const isAdmin = useQuery(api.users.isAdmin);
    const router = useRouter();

    return (
        <UserButton>
            <UserButton.MenuItems>
                {isAdmin && (
                    <UserButton.Action
                        label="Admin"
                        labelIcon={<Lock className="w-3.5 h-3.5 stroke-2" />}
                        onClick={() => router.push('/admin')}
                    />
                )}
                {isAdmin && (
                    <UserButton.Action
                        label="Plantillas"
                        labelIcon={<Laptop2 className="w-3.5 h-3.5 stroke-2" />}
                        onClick={() => router.push('/templates')}
                    />
                )}
                <UserButton.Action label="manageAccount" />
                <UserButton.Action label="signOut" />
            </UserButton.MenuItems>
            
            <UserButton.UserProfilePage label="Help" labelIcon={<Info className="w-3.5 h-3.5 mt-0.5" />} url="help">
                <div>
                    <h1>Ayuda</h1>
                    <p>Esta es la página de ayuda personalizada</p>
                </div>
            </UserButton.UserProfilePage>
        </UserButton>
    )
}
