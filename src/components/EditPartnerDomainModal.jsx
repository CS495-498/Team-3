"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function EditPartnerDomainModal({ domain, open, onOpenChange, onSaved }) {
  const [formDomain, setFormDomain] = useState(domain?.domain || "");
  const [formType, setFormType] = useState(domain?.type || "allow");
  const [formReason, setFormReason] = useState(domain?.reason || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFormDomain(domain?.domain || "");
    setFormType(domain?.type || "allow");
    setFormReason(domain?.reason || "");
  }, [domain]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const method = domain?.id ? "PUT" : "POST";
      const url = domain?.id ? `/api/partner-domains/${domain.id}` : "/api/partner-domains";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          domain: formDomain,
          type: formType,
          reason: formReason,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save domain");
      }
      const data = await res.json();
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{domain?.id ? "Edit Partner Domain" : "Add Partner Domain"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block mb-1 text-sm font-medium">Domain</label>
            <Input
              placeholder="example.com"
              value={formDomain}
              onChange={(e) => setFormDomain(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Type</label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow">Allow</SelectItem>
                <SelectItem value="deny">Deny</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium">Reason (optional)</label>
            <Input
              placeholder="Reason or notes"
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
            />
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}