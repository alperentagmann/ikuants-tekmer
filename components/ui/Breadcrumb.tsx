'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ikuantstekmer.com';

    const breadcrumbListSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Ana Sayfa',
                item: baseUrl,
            },
            ...items.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 2,
                name: item.label,
                ...(item.href ? { item: `${baseUrl}${item.href.startsWith('/') ? '' : '/'}${item.href}` } : {}),
            })),
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbListSchema) }}
            />
            <nav aria-label="Breadcrumb" className={`flex items-center text-sm text-slate-500 ${className}`}>
                <ol className="flex items-center space-x-2 flex-wrap">
                    <li className="flex items-center">
                        <Link
                            href="/"
                            className="flex items-center text-slate-400 hover:text-cyan-400 transition-colors"
                        >
                            <Home className="w-4 h-4 mr-1" />
                            <span>Ana Sayfa</span>
                        </Link>
                    </li>
                    {items.map((item, idx) => {
                        const isLast = idx === items.length - 1;
                        return (
                            <li key={idx} className="flex items-center space-x-2">
                                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                {item.href && !isLast ? (
                                    <Link
                                        href={item.href}
                                        className="text-slate-400 hover:text-cyan-400 transition-colors font-medium truncate max-w-[200px]"
                                    >
                                        {item.label}
                                    </Link>
                                ) : (
                                    <span className="text-cyan-400 font-medium truncate max-w-[240px]" aria-current="page">
                                        {item.label}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </>
    );
}
