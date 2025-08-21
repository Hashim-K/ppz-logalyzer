"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";

const navItems = [
	{ name: "Sessions", href: "/sessions" },
	{ name: "Dashboard", href: "/dashboard" },
	{ name: "Upload", href: "/upload" },
	{ name: "Settings", href: "/settings" },
];

export default function Navigation() {
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();

	return (
		<nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center">
				<div className="mr-4 hidden md:flex">
					<Link href="/" className="mx-6 flex items-center space-x-2">
						<span className="hidden font-bold sm:inline-block">
							PPZ LogAnalyzer
						</span>
					</Link>
					<nav className="flex items-center space-x-6 text-sm font-medium">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`transition-colors hover:text-foreground/80 ${
									pathname === item.href
										? "text-foreground"
										: "text-foreground/60"
								}`}
							>
								{item.name}
							</Link>
						))}
					</nav>
				</div>
				<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
					<div className="w-full flex-1 md:w-auto md:flex-none">
						{/* Search can be added here later */}
					</div>
					<nav className="flex items-center space-x-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setTheme(theme === "light" ? "dark" : "light")}
						>
							<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
							<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
							<span className="sr-only">Toggle theme</span>
						</Button>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon">
									<User className="h-[1.2rem] w-[1.2rem]" />
									<span className="sr-only">User menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link href="/settings">
										<Settings className="mr-2 h-4 w-4" />
										Settings
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<LogOut className="mr-2 h-4 w-4" />
									Log out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</nav>
				</div>
			</div>
		</nav>
	);
}
