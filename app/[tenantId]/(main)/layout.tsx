"use client";
import "../../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function TenantLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {

	return (
		<SidebarProvider>
			<div className="w-full min-w-full">
				{children}
			</div>
		</SidebarProvider>
	);
}
