import React from 'react';

interface MarkdownTableProps {
    children: React.ReactNode;
}

export function MarkdownTable({ children }: MarkdownTableProps) {
    return (
        <div className="my-6 overflow-x-auto rounded-lg border border-blue-200 dark:border-blue-900/50 shadow-sm">
            <table className="min-w-full divide-y divide-blue-200 dark:divide-blue-900/50">
                {children}
            </table>
        </div>
    );
}

export function TableHead({ children }: { children: React.ReactNode }) {
    return (
        <thead className="bg-blue-50/50 dark:bg-blue-900/20">
            {children}
        </thead>
    );
}

export function TableBody({ children }: { children: React.ReactNode }) {
    return (
        <tbody className="divide-y divide-blue-200 dark:divide-blue-900/50">
            {children}
        </tbody>
    );
}

export function TableRow({ children }: { children: React.ReactNode }) {
    return (
        <tr className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
            {children}
        </tr>
    );
}

export function TableHeader({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 dark:text-blue-300 uppercase tracking-wider">
            {children}
        </th>
    );
}

export function TableCell({ children }: { children: React.ReactNode }) {
    return (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
            {children}
        </td>
    );
}
