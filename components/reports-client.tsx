"use client";

import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { ReportData } from "@/lib/db/reports";

// Function to convert array of objects to CSV
const convertToCSV = (data: Record<string, unknown>[], headers: { key: string, label: string }[]) => {
    const headerRow = headers.map(h => h.label).join(',');
    const bodyRows = data.map(row => {
        return headers.map(header => {
            let value = row[header.key];
            if (typeof value === 'number') {
                value = value.toFixed(2);
            }
            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '""')}"`;
            }
             if (typeof value === 'object' && value !== null) {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',');
    });
    return [headerRow, ...bodyRows].join('\n');
};

const downloadCSV = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export function ReportsClient({ initialOrderReportData }: { initialOrderReportData: ReportData[] }) {
    const [reportData] = useState<ReportData[]>(initialOrderReportData);
    const [productFilter, setProductFilter] = useState<string>('');
    const [assemblyFilter, setAssemblyFilter] = useState<string>('');

    const { uniqueProducts, uniqueAssemblies } = useMemo(() => {
        const products = new Set<string>();
        const assemblies = new Set<string>();
        for (const order of initialOrderReportData) {
            for (const product of order.products) {
                products.add(product.name);
                for (const assembly of product.assemblies) {
                    assemblies.add(assembly);
                }
                for (const subAssembly of product.subAssemblies) {
                    assemblies.add(subAssembly);
                }
            }
        }
        return {
            uniqueProducts: Array.from(products).sort(),
            uniqueAssemblies: Array.from(assemblies).sort()
        };
    }, [initialOrderReportData]);

    const filteredReportData = useMemo(() => {
        return reportData.filter(order => {
            const productMatch = !productFilter || order.products.some(p => p.name === productFilter);
            const assemblyMatch = !assemblyFilter || order.products.some(p =>
                p.assemblies.includes(assemblyFilter) || p.subAssemblies.includes(assemblyFilter)
            );
            return productMatch && assemblyMatch;
        });
    }, [reportData, productFilter, assemblyFilter]);

    const handleExport = () => {
        const headers = [
            { key: 'orderNumber', label: 'Order #' },
            { key: 'clientName', label: 'Client' },
            { key: 'products', label: 'Products' },
            { key: 'assemblies', label: 'Assemblies' },
            { key: 'subAssemblies', label: 'Sub Assemblies' },
            { key: 'totalHours', label: 'Total Hours' },
            { key: 'divisionHours', label: 'Division Hours' }
        ];

        const flattenedData = filteredReportData.flatMap(order => {
            if (order.products.length === 0) {
                return [{
                    orderNumber: order.orderNumber,
                    clientName: order.clientName || 'N/A',
                    products: '',
                    assemblies: '',
                    subAssemblies: '',
                    totalHours: order.totalHours,
                    divisionHours: JSON.stringify(order.divisionHours)
                }];
            }
            return order.products.map(product => ({
                orderNumber: order.orderNumber,
                clientName: order.clientName || 'N/A',
                products: product.name,
                assemblies: product.assemblies.join('; '),
                subAssemblies: product.subAssemblies.join('; '),
                totalHours: order.totalHours,
                divisionHours: JSON.stringify(order.divisionHours)
            }));
        });

        const csv = convertToCSV(flattenedData, headers);
        downloadCSV(csv, 'order_report.csv');
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4 items-end">
                    <div className="grid gap-2 flex-grow">
                        <Label htmlFor="product-filter">Product</Label>
                        <select
                            id="product-filter"
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
                        >
                            <option value="">All Products</option>
                            {uniqueProducts.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="grid gap-2 flex-grow">
                        <Label htmlFor="assembly-filter">Assembly / Sub Assembly</Label>
                        <select
                            id="assembly-filter"
                            value={assemblyFilter}
                            onChange={(e) => setAssemblyFilter(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm"
                        >
                            <option value="">All Assemblies</option>
                             {uniqueAssemblies.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                    </div>
                    <Button variant="outline" onClick={() => { setProductFilter(''); setAssemblyFilter(''); }}>Clear Filters</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Work Order Report</CardTitle>
                            <CardDescription>Detailed breakdown of hours by order, product, and assemblies.</CardDescription>
                        </div>
                        <Button onClick={handleExport}>Export to CSV</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Products</TableHead>
                                <TableHead>Assemblies</TableHead>
                                <TableHead>Sub Assemblies</TableHead>
                                <TableHead>Total Hours</TableHead>
                                <TableHead>Division Hours</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReportData.map((order, index) => (
                                <TableRow key={`${order.orderNumber}-${index}`}>
                                    <TableCell>{order.orderNumber}</TableCell>
                                    <TableCell>{order.clientName}</TableCell>
                                    <TableCell>
                                        {order.products.map((p, i) => <div key={i}>{p.name}</div>)}
                                    </TableCell>
                                    <TableCell>
                                        {order.products.map((p, i) => <div key={i}>{p.assemblies.join(', ')}</div>)}
                                    </TableCell>
                                    <TableCell>
                                        {order.products.map((p, i) => <div key={i}>{p.subAssemblies.join(', ')}</div>)}
                                    </TableCell>
                                    <TableCell>{order.totalHours.toFixed(2)}</TableCell>
                                    <TableCell>
                                        {Object.entries(order.divisionHours).map(([division, hours]) => (
                                            <div key={division}>{division}: {hours.toFixed(2)} hrs</div>
                                        ))}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}