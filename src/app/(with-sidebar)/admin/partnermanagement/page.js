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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SuccessToast from "@/components/ui/success-toast";
import EditPartnerDomainModal from "@/components/EditPartnerDomainModal";

export default function AdminPartnerDomainsPage() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingDomain, setEditingDomain] = useState(null);
  const [editingReason, setEditingReason] = useState(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [signupFilter, setSignupFilter] = useState("all");

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
      const matchesSearch =
        !search || d.domain.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" || d.type === typeFilter;

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && d.active) ||
        (activeFilter === "inactive" && !d.active);

      const matchesSignup =
        signupFilter === "all" ||
        (signupFilter === "allowed" && d.type === "allow") ||
        (signupFilter === "blocked" && d.type === "deny");

      return matchesSearch && matchesType && matchesActive && matchesSignup;
    });
  }, [domains, search, typeFilter, activeFilter, signupFilter]);

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

  // Delete domain
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

  // Toggle fields (allowSignups / active)
  const handleToggle = async (domainId, field, value) => {
    const previousDomains = domains;

    // ✅ optimistic update
    setDomains((prev) =>
      prev.map((d) =>
        d.id === domainId
          ? {
            ...d,
            ...(field === "type"
              ? { type: value ? "allow" : "deny" }
              : { [field]: value }),
          }
          : d
      )
    );

    try {
      const current = previousDomains.find((d) => d.id === domainId);
      if (!current) return;

      const updated = {
        domain: current.domain,
        type: field === "type" ? (value ? "allow" : "deny") : current.type,
        reason: field === "reason" ? value : current.reason,
        active: field === "active" ? value : current.active,
      };

      const res = await fetch(`/api/partner-domains/${domainId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Failed to update domain");

      const updatedDomain = await res.json();

      // ✅ sync with server (in case backend modifies anything)
      setDomains((prev) =>
        prev.map((d) => (d.id === updatedDomain.id ? updatedDomain : d))
      );
    } catch (err) {
      // ❗ rollback on failure
      setDomains(previousDomains);
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
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Input
                placeholder="Search by domain…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:max-w-sm"
              />

              {/* Active Filter */}
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full">
                <span className="text-xs text-muted-foreground">Status:</span>
                {["all", "active", "inactive"].map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={activeFilter === value ? "default" : "outline"}
                    className="h-7 px-3 text-xs rounded-full capitalize"
                    onClick={() => setActiveFilter(value)}
                  >
                    {value === "all" ? "All" : value}
                  </Button>
                ))}
              </div>

              {/* Signup Filter */}
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-full">
                <span className="text-xs text-muted-foreground">Signups:</span>
                {["all", "allowed", "blocked"].map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={signupFilter === value ? "default" : "outline"}
                    className="h-7 px-3 text-xs rounded-full capitalize"
                    onClick={() => setSignupFilter(value)}
                  >
                    {value === "all"
                      ? "All"
                      : value === "allowed"
                        ? "Allowed"
                        : "Blocked"}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading && <p>Loading partner domains…</p>}
          {error && <p className="text-destructive">{error}</p>}

          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Allow Signups</TableHead>
                  <TableHead>Active</TableHead>
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

                    <TableCell>{domain.domain}</TableCell>

                    <TableCell>
                      <Switch
                        checked={domain.type === "allow"}
                        onCheckedChange={(value) =>
                          handleToggle(domain.id, "type", value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={domain.active}
                        onCheckedChange={(value) => handleToggle(domain.id, "active", value)}
                      />
                    </TableCell>
                    <TableCell>

                      {editingReason?.id === domain.id ? (
                        <Input
                          value={editingReason.reason || ""}
                          onChange={(e) =>
                            setEditingReason((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // ✅ prevents blur firing immediately
                              handleToggle(domain.id, "reason", editingReason.reason);
                              setEditingReason(null);
                            }
                          }}

                          onBlur={() => {
                            handleToggle(domain.id, "reason", editingReason.reason);
                            setEditingReason(null);
                          }}
                          autoFocus
                          className="h-8"
                        />
                      ) : (
                        <div
                          className="cursor-pointer text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setEditingReason({
                              id: domain.id,
                              reason: domain.reason,
                            })
                          }
                        >
                          {domain.reason || "—"}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">

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

      {/* Edit/Add Modal */}
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
                return prev.map((d) => (d.id === updatedDomain.id ? updatedDomain : d));
              } else {
                return [updatedDomain, ...prev];
              }
            });

            showToast(`Domain ${updatedDomain.domain} has been ${updatedDomain.id ? "updated" : "added"}`);
            setEditingDomain(null);
          }}
        />
      )}

      {/* Toast */}
      <SuccessToast message={toastMessage} isOpen={toastOpen} onClose={() => setToastOpen(false)} />
    </div>
  );
}