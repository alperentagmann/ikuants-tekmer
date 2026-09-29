"use client";
import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Search, ChevronLeft, ChevronRight, Download, Filter, Eye, CheckSquare, Square, ArrowUpDown, ChevronDown } from 'lucide-react';

export interface Column<T> {
    key: string;
    header: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
    hidden?: boolean;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    searchKey?: string;
    searchPlaceholder?: string;
    onRowClick?: (item: T) => void;
    onBulkAction?: (action: string, selectedItems: T[]) => void;
    bulkActions?: Array<{ key: string; label: string; isDestructive?: boolean }>;
    exportFileName?: string;
    emptyMessage?: string;
    filterOptions?: Array<{
        key: string;
        label: string;
        options: Array<{ value: string; label: string }>;
    }>;
}

export function DataTable<T extends Record<string, any>>({
    data,
    columns,
    searchPlaceholder = 'Tabloda ara...',
    onRowClick,
    onBulkAction,
    bulkActions = [],
    exportFileName = 'export',
    emptyMessage = 'Kayıt bulunamadı.',
    filterOptions = [],
}: DataTableProps<T>) {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(15);
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    // Filter and search
    const filteredData = useMemo(() => {
        return data.filter((item) => {
            // Apply search term across all string fields
            if (search) {
                const searchLower = search.toLowerCase();
                const matches = Object.values(item).some((val) => {
                    if (val === null || val === undefined) return false;
                    if (typeof val === 'string' || typeof val === 'number') {
                        return String(val).toLowerCase().includes(searchLower);
                    }
                    return false;
                });
                if (!matches) return false;
            }

            // Apply dropdown filters
            for (const [filterKey, filterVal] of Object.entries(activeFilters)) {
                if (filterVal && item[filterKey] !== filterVal) {
                    return false;
                }
            }

            return true;
        });
    }, [data, search, activeFilters]);

    // Sorting
    const sortedData = useMemo(() => {
        if (!sortKey) return filteredData;
        return [...filteredData].sort((a, b) => {
            const valA = a[sortKey];
            const valB = b[sortKey];
            if (valA === valB) return 0;
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;
            const comparison = valA > valB ? 1 : -1;
            return sortDir === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortKey, sortDir]);

    // Pagination
    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, page, pageSize]);

    const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

    // Selection
    const toggleSelectAll = () => {
        if (selectedIds.size === paginatedData.length) {
            setSelectedIds(new Set());
        } else {
            const newSet = new Set<string>();
            paginatedData.forEach((item) => {
                if (item.id) newSet.add(item.id);
            });
            setSelectedIds(newSet);
        }
    };

    const toggleSelectOne = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    // Export to Excel / CSV
    const handleExport = (format: 'xlsx' | 'csv') => {
        const exportData = sortedData.map((item) => {
            const row: Record<string, any> = {};
            columns.forEach((col) => {
                if (!col.hidden) {
                    let val = item[col.key];
                    // Formula injection protection: sanitize leading '=', '+', '-', '@'
                    if (typeof val === 'string' && /^[=+@-]/.test(val)) {
                        val = `'${val}`;
                    }
                    row[col.header] = val ?? '';
                }
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Veri');
        XLSX.writeFile(workbook, `${exportFileName}-${Date.now()}.${format}`);
    };

    const selectedItems = useMemo(() => {
        return data.filter((item) => selectedIds.has(item.id));
    }, [data, selectedIds]);

    return (
        <div className="bg-[#0e0e18] border border-white/10 rounded-2xl overflow-hidden text-white shadow-xl">
            {/* Action & Filter Toolbar */}
            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Search */}
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        placeholder={searchPlaceholder}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:border-primary outline-none transition-colors"
                    />
                </div>

                {/* Filters and Export */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                    {filterOptions.map((f) => (
                        <select
                            key={f.key}
                            value={activeFilters[f.key] || ''}
                            onChange={(e) => {
                                setActiveFilters({ ...activeFilters, [f.key]: e.target.value });
                                setPage(1);
                            }}
                            className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:border-primary outline-none [&>option]:bg-[#0f0f18] [&>option]:text-white"
                        >
                            <option value="">{f.label}: Tümü</option>
                            {f.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    ))}

                    <button
                        onClick={() => handleExport('xlsx')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-colors"
                    >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        Excel
                    </button>
                </div>
            </div>

            {/* Bulk Actions Banner */}
            {selectedIds.size > 0 && bulkActions.length > 0 && (
                <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex items-center justify-between animate-in fade-in duration-150">
                    <span className="text-xs font-semibold text-primary">
                        {selectedIds.size} kayıt seçildi
                    </span>
                    <div className="flex items-center gap-2">
                        {bulkActions.map((act) => (
                            <button
                                key={act.key}
                                onClick={() => onBulkAction && onBulkAction(act.key, selectedItems)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                    act.isDestructive
                                        ? 'bg-rose-600/20 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-600/30'
                                        : 'bg-primary/20 text-primary hover:bg-primary hover:text-white border border-primary/30'
                                }`}
                            >
                                {act.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-black/40 text-gray-400 font-mono uppercase tracking-wider border-b border-white/10">
                        <tr>
                            {bulkActions.length > 0 && (
                                <th className="p-3 w-10 text-center">
                                    <button onClick={toggleSelectAll} className="p-1 hover:text-white">
                                        {selectedIds.size === paginatedData.length && paginatedData.length > 0 ? (
                                            <CheckSquare className="w-4 h-4 text-primary" />
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                    </button>
                                </th>
                            )}
                            {columns.filter(c => !c.hidden).map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => col.sortable !== false && handleSort(col.key)}
                                    className={`p-3.5 select-none ${col.sortable !== false ? 'cursor-pointer hover:text-white' : ''}`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span>{col.header}</span>
                                        {col.sortable !== false && (
                                            <ArrowUpDown className={`w-3 h-3 ${sortKey === col.key ? 'text-primary' : 'opacity-40'}`} />
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + (bulkActions.length > 0 ? 1 : 0)}
                                    className="p-8 text-center text-gray-500 font-medium"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, idx) => {
                                const isSelected = item.id && selectedIds.has(item.id);
                                return (
                                    <tr
                                        key={item.id || idx}
                                        onClick={() => onRowClick && onRowClick(item)}
                                        className={`hover:bg-white/[0.03] transition-colors ${
                                            onRowClick ? 'cursor-pointer' : ''
                                        } ${isSelected ? 'bg-primary/5' : ''}`}
                                    >
                                        {bulkActions.length > 0 && (
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={(e) => toggleSelectOne(item.id, e)}
                                                    className="p-1 text-gray-400 hover:text-white"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="w-4 h-4 text-primary" />
                                                    ) : (
                                                        <Square className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </td>
                                        )}
                                        {columns.filter(c => !c.hidden).map((col) => (
                                            <td key={col.key} className="p-3.5 text-gray-300">
                                                {col.render ? col.render(item) : String(item[col.key] ?? '')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
                <div>
                    Toplam <span className="text-white font-semibold">{sortedData.length}</span> kayıttan{' '}
                    <span className="text-white font-semibold">
                        {sortedData.length === 0 ? 0 : (page - 1) * pageSize + 1}-
                        {Math.min(page * pageSize, sortedData.length)}
                    </span>{' '}
                    arası gösteriliyor
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 outline-none"
                    >
                        <option value="10">10 / sayfa</option>
                        <option value="15">15 / sayfa</option>
                        <option value="25">25 / sayfa</option>
                        <option value="50">50 / sayfa</option>
                    </select>

                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono px-2">
                        {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
