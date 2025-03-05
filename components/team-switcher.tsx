"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"
import Image from "next/image"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

interface Team {
    name: string
    logo: string
    plan: string
    className?: string
    href?: string
}

export function TeamSwitcher({
    teams,
}: {
    teams: Team[]
}) {
    const { isMobile } = useSidebar()
    const [activeTeam, setActiveTeam] = React.useState<Team | null>(teams[0] || null)

    if (!activeTeam) return null;

    return (
        <SidebarMenu>
            <SidebarMenuItem className="!bg-sky-100/80 dark:!bg-indigo-500/20 hover:!bg-sky-200/90 dark:hover:!bg-indigo-500/30 !rounded-xl !transition-all !duration-200">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <div className="relative h-6 w-6">
                                    <Image
                                        src={activeTeam.logo}
                                        alt={activeTeam.name}
                                        fill
                                        sizes="(max-width: 24px) 100vw"
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {activeTeam.name}
                                </span>
                                <span className="truncate text-xs">{activeTeam.plan}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Modüller
                        </DropdownMenuLabel>
                        {teams
                            .filter(team => team.plan !== activeTeam.plan)
                            .map((team) => (
                            <DropdownMenuItem
                                key={team.name}
                                className="cursor-pointer gap-2 p-2"
                                asChild
                            >
                                <a 
                                    href={team.href} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center"
                                >
                                    <div className="flex size-6 items-center justify-center rounded-sm border">
                                        <div className="relative h-4 w-4">
                                            <Image
                                                src={team.logo}
                                                alt={team.name}
                                                fill
                                                sizes="(max-width: 16px) 100vw"
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <span>{team.plan}</span>
                                    </div>
                                </a>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
