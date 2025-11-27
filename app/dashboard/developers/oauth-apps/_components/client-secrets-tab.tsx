"use client";

import { generateNewClientSecret, revokeClientSecret, listClientSecrets } from "@/app/actions/oauth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/auth";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Key, Plus, Copy, Trash2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClientSecretsTabProps {
  appId: string;
}

export function ClientSecretsTab({ appId }: ClientSecretsTabProps) {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretToRevoke, setSecretToRevoke] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  const { data: secretsResponse } = useQuery({
    queryKey: ["oauth", "app", "secrets", appId],
    queryFn: () => listClientSecrets({ appId, user: currentUser! }),
    enabled: !!currentUser,
  });

  const secrets = secretsResponse?.data ?? [];
  const activeSecrets = secrets.filter(
    (s) => !s.revokedAt && (!s.expiresAt || s.expiresAt > new Date())
  );

  const handleGenerateSecret = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await generateNewClientSecret({
        appId,
        user: currentUser,
      });

      if (result.success) {
        setNewSecret(result.data.clientSecret);
        toast.success("Client secret generated successfully");
        queryClient.invalidateQueries({ queryKey: ["oauth", "app", "secrets", appId] });
      } else {
        toast.error(result.message || "Failed to generate client secret");
      }
    } catch (error) {
      toast.error("An error occurred while generating the client secret");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSecret = async () => {
    if (!currentUser || !secretToRevoke) return;

    setRevoking(true);
    try {
      const result = await revokeClientSecret({
        appId,
        user: currentUser,
        secretToRevoke,
      });

      if (result.success) {
        toast.success("Client secret revoked successfully");
        queryClient.invalidateQueries({ queryKey: ["oauth", "app", "secrets", appId] });
        setSecretToRevoke(null);
      } else {
        toast.error(result.message || "Failed to revoke client secret");
      }
    } catch (error) {
      toast.error("An error occurred while revoking the client secret");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Secrets</CardTitle>
              <CardDescription>
                Manage your application's client secrets for OAuth authentication
              </CardDescription>
            </div>
            <Button onClick={handleGenerateSecret} disabled={loading}>
              <Plus className="mr-2 h-4 w-4" />
              {loading ? "Generating..." : "Generate New Secret"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Client secrets are used to authenticate your application when exchanging authorization
              codes for access tokens. Keep them secure and never expose them in client-side code.
            </AlertDescription>
          </Alert>

          {activeSecrets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active client secrets</p>
              <p className="text-sm">Generate a new secret to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSecrets.map((secret) => (
                <div
                  key={secret.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono">••••••••••••••••</code>
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {format(new Date(secret.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      {secret.expiresAt && (
                        <> • Expires {format(new Date(secret.expiresAt), "MMM d, yyyy")}</>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSecretToRevoke(secret.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {secrets.length > activeSecrets.length && (
            <>
              <div className="pt-4">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Revoked Secrets</h4>
                <div className="space-y-2">
                  {secrets
                    .filter((s) => s.revokedAt)
                    .map((secret) => (
                      <div
                        key={secret.id}
                        className="flex items-center justify-between p-3 border rounded-lg opacity-50"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-sm font-mono">••••••••••••••••</code>
                            <Badge variant="outline" className="text-xs">
                              Revoked
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Revoked {format(new Date(secret.revokedAt!), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* New Secret Dialog */}
      <AlertDialog open={!!newSecret} onOpenChange={() => setNewSecret(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Client Secret Generated</AlertDialogTitle>
            <AlertDialogDescription>
              Make sure to copy your client secret now. You won't be able to see it again!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                For security reasons, you won't be able to see this secret again. Store it in a
                secure location.
              </AlertDescription>
            </Alert>
            <div>
              <Label>Client Secret</Label>
              <div className="flex gap-2 mt-2">
                <Input value={newSecret || ""} readOnly className="font-mono text-sm" />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(newSecret || "");
                    toast.success("Copied to clipboard");
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setNewSecret(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!secretToRevoke} onOpenChange={() => setSecretToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Client Secret</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this client secret? Applications using this secret
              will no longer be able to authenticate. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSecret}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={revoking}
            >
              {revoking ? "Revoking..." : "Revoke Secret"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
