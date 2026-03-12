"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SuccessToast from "@/components/ui/success-toast";
import EditPartnerDomainModal from "@/components/EditPartnerDomainModal"; // create a modal similar to EditUserModal

export default function AdminPartnerDomainsPage() {
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingDomain, setEditingDomain] = useState(null);

    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    // Toast state
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const showToast = (message) => {
        setToastMessage(message);
        setToastOpen(true);
        setTimeout(() => setToastOpen(false), 3000);
    };

    // Fetch domains
    useEffect(() => {
        async function fetchDomains() {
            try {
                const res = await fetch("/api/partner-domains", { credentials: "include" });
                if (!res.ok) {
                    const body = await res.json();
                    throw new Error(body.error || "Failed to load partner domains");
                }
                const data = await res.json();
                setDomains(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchDomains();
    }, []);

    const filteredDomains = useMemo(() => {
        return domains.filter((d) => {
            const matchesSearch = !search || d.domain.toLowerCase().includes(search.toLowerCase());
            const matchesType = typeFilter === "all" || d.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [domains, search, typeFilter]);

    const getTypeVariant = (type) => {
        switch (type) {
            case "allow":
                return "success";
            case "deny":
                return "destructive";
            default:
                return "outline";
        }
    };

    const handleDeleteDomain = async (domain) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete ${domain.domain}?`);
        if (!confirmDelete) return;

        try {
            const res = await fetch(`/api/partner-domains/${domain.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.error || "Failed to delete domain");
            }
            setDomains((prev) => prev.filter((d) => d.id !== domain.id));
            showToast(`Domain ${domain.domain} has been deleted`);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="p-6">
            <Card className="shadow-sm">
                <CardHeader className="space-y-4">
                    <div className="flex justify-between items-center">
                        <CardTitle>Partner Onboarding · Domain Management</CardTitle>
                        <Button onClick={() => setEditingDomain({})} lefticon={<Plus />}>Add Domain</Button>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <Input
                            placeholder="Search by domain…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="md:max-w-sm"
                        />
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="md:w-48">
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="allow">Allow</SelectItem>
                                <SelectItem value="deny">Deny</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>

                <CardContent>
                    {loading && <p>Loading partner domains…</p>}
                    {error && <p className="text-destructive">{error}</p>}
                    {!loading && !error && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Domain</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDomains.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No domains found
                                        </TableCell>
                                    </TableRow>
                                )}

                                {filteredDomains.map((domain) => (
                                    <TableRow key={domain.id}>
                                        <TableCell className="font-mono text-xs">{domain.id}</TableCell>
                                        <TableCell>{domain.domain}</TableCell>
                                        <TableCell>
                                            <Badge variant={getTypeVariant(domain.type)}>{domain.type}</Badge>
                                        </TableCell>
                                        <TableCell>{domain.reason || "—"}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => setEditingDomain(domain)}>Edit</Button>
                                            <Button size="icon" variant="destructive" onClick={() => handleDeleteDomain(domain)} className="h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Modal */}
            {editingDomain && (
                <EditPartnerDomainModal
                    domain={editingDomain}
                    open={!!editingDomain}
                    onOpenChange={() => setEditingDomain(null)}
                    onSaved={(updatedDomain) => {
                        if (!updatedDomain) return;

                        setDomains((prev) => {
                            const exists = prev.find((d) => d.id === updatedDomain.id);

                            if (exists) {
                                // Update existing domain
                                return prev.map((d) => (d.id === updatedDomain.id ? updatedDomain : d));
                            } else {
                                // Add new domain at the top
                                return [updatedDomain, ...prev];
                            }
                        });

                        showToast(
                            `Domain ${updatedDomain.domain} has been ${updatedDomain.id ? "updated" : "added"}`
                        );

                        setEditingDomain(null);
                    }}
                />
            )}

            {/* Toast */}
            <SuccessToast message={toastMessage} isOpen={toastOpen} onClose={() => setToastOpen(false)} />
        </div>
    );
}