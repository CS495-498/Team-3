"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EditUserModal from "@/components/EditUserModal";

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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Skeleton } from "@/components/ui/skeleton";
import { AlertTitle, AlertDescription } from "@/components/ui/adminAlert";
import SuccessToast from "@/components/ui/success-toast";

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (message) => {
    setToastMessage(message);
    setToastOpen(true);
    setTimeout(() => setToastOpen(false), 3000); // auto-close after 3s
  };

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/profiles", { credentials: "include" });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load users");
        }
        const data = await res.json();

        setUsers(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.users)
              ? data.users
              : []
        );

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.username?.toLowerCase().includes(search.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const getRoleVariant = (role) => {
    switch (role) {
      case "admin":
        return "destructive"; // red
      case "contentstack":
        return "default"; // purple variant
      case "partner":
        return "secondary"; // gray
      default:
        return "outline";
    }
  };

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader className="space-y-4">
          <CardTitle>Admin · User Management</CardTitle>

          {/* Filters */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Search by email, username, or name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-sm"
            />

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="contentstack">Contentstack</SelectItem>
                <SelectItem value="partner">Partner</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </div>
          )}

          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Persona</TableHead>
                  <TableHead className="text-right">Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}

                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                    <TableCell className="font-mono text-sm">{user.email || "—"}</TableCell>
                    <TableCell>{user.username || "—"}</TableCell>
                    <TableCell>{user.full_name || "—"}</TableCell>
                    <TableCell>
                      {user.role ? (
                        <Badge variant={getRoleVariant(user.role)}>
                          {user.role}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {user.active_persona_id ? (
                        <Badge variant="outline">{user.active_persona_id}</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {user.updated_at ? new Date(user.updated_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingUser(user)}
                      >
                        Edit
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
      {editingUser && (
        <EditUserModal
          user={editingUser}
          open={!!editingUser}
          onOpenChange={() => setEditingUser(null)}
          onSaved={(updatedUser) => {
            if (!updatedUser) return;

            // Update table immediately
            setUsers((prev) =>
              prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
            );

            // Show toast
            showToast(
              `${updatedUser.full_name || updatedUser.username || updatedUser.email || "User"} has been updated`
            );

            setEditingUser(null);
          }}
        />
      )}



      {/* Toast */}
      <SuccessToast
        message={toastMessage}
        isOpen={toastOpen}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
