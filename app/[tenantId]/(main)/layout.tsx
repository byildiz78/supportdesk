"use client";
import "../../globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CategoriesProvider } from "@/providers/categories-provider";

export default function TenantLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {

	return (
		<SidebarProvider>
			<CategoriesProvider>
				<div className="w-full min-w-full">
					{children}
				</div>
			</CategoriesProvider>
		</SidebarProvider>
	);
}
