"use client";

import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTitle, AlertDescription } from "@/components/ui/adminAlert";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/profiles", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load users");
        }

        const data = await res.json();
        setUsers(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Admin · User Management</CardTitle>
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
                </TableRow>
              </TableHeader>

              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">
                      {user.id}
                    </TableCell>

                    <TableCell className="font-mono text-sm">
                      {user.email || "—"}
                    </TableCell>

                    <TableCell>{user.username || "—"}</TableCell>
                    <TableCell>{user.full_name || "—"}</TableCell>

                    <TableCell>
                      {user.role ? (
                        <Badge
                          variant={
                            user.role === "admin" ? "destructive" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell>
                      {user.active_persona_id ? (
                        <Badge variant="outline">
                          {user.active_persona_id}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="text-right text-muted-foreground">
                      {user.updated_at
                        ? new Date(user.updated_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
