"use client";

import { getOAuthApp, listOAuthAppUsers, deleteOAuthApp } from "@/app/actions/oauth";
import { useCurrentUser } from "@/hooks/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Copy, ExternalLink, Settings, Trash2, Key, Users as UsersIcon } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { AppSettingsTab } from "@/app/dashboard/developers/oauth-apps/_components/app-settings-tab";
import { ClientSecretsTab } from "@/app/dashboard/developers/oauth-apps/_components/client-secrets-tab";

export default function OAuthAppDetailPage({ params }: { params: { appId: string } }) {
  const { data: currentUser } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (currentUser === undefined) {
      redirect("/signin");
    }
  }, [currentUser]);

  const { data: appResponse, isLoading } = useQuery({
    queryKey: ["oauth", "app", params.appId],
    queryFn: () => getOAuthApp({ appId: params.appId, user: currentUser! }),
    enabled: !!currentUser,
  });

  const { data: usersResponse } = useQuery({
    queryKey: ["oauth", "app", "users", params.appId],
    queryFn: () =>
      listOAuthAppUsers({
        data: { appId: params.appId, user: currentUser! },
      }),
    enabled: !!currentUser,
  });

  const app = appResponse?.data;
  const users = usersResponse?.data ?? [];

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDelete = async () => {
    if (!currentUser || !app) return;
    
    setDeleting(true);
    try {
      const result = await deleteOAuthApp({ appId: app.id, user: currentUser });
      if (result.success) {
        toast.success("Application deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["oauth", "apps"] });
        router.push("/dashboard/developers/oauth-apps");
      } else {
        toast.error(result.message || "Failed to delete application");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the application");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!currentUser || isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="space-y-6">
        <Link href="/dashboard/developers/oauth-apps">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
        </Link>
        <Alert>
          <AlertDescription>Application not found or you don't have access to it.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard/developers/oauth-apps">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {app.logoUrl ? (
              <img
                src={app.logoUrl}
                alt={app.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{app.name}</h1>
              {app.description && (
                <p className="text-muted-foreground mt-1">{app.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Link href={app.url} target="_blank">
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {app.url}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete App
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Created</CardDescription>
            <CardTitle className="text-xl">
              {format(new Date(app.createdAt), "MMM d, yyyy")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Connected Users</CardDescription>
            <CardTitle className="text-xl">{users.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Scopes</CardDescription>
            <CardTitle className="text-xl">{app.scopes.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Redirect URIs</CardDescription>
            <CardTitle className="text-xl">{app.redirectUris.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="secrets">
            <Key className="mr-2 h-4 w-4" />
            Client Secrets
          </TabsTrigger>
          <TabsTrigger value="users">
            <UsersIcon className="mr-2 h-4 w-4" />
            Connected Users ({users.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Client ID</h3>
                <div className="flex gap-2">
                  <code className="flex-1 p-2 bg-muted rounded font-mono text-sm break-all">
                    {app.clientId}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(app.clientId, "Client ID")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Redirect URIs</h3>
                <div className="space-y-2">
                  {app.redirectUris.map((uri, index) => (
                    <div key={index} className="flex gap-2">
                      <code className="flex-1 p-2 bg-muted rounded font-mono text-sm break-all">
                        {uri}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(uri, "Redirect URI")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Scopes</h3>
                <div className="flex flex-wrap gap-2">
                  {app.scopes.map((scope) => (
                    <Badge key={scope} variant="secondary">
                      {scope}
                    </Badge>
                  ))}
                  {app.scopes.length === 0 && (
                    <span className="text-sm text-muted-foreground">No scopes configured</span>
                  )}
                </div>
              </div>

              {app.supportEmail && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-2">Support Email</h3>
                    <a href={`mailto:${app.supportEmail}`} className="text-sm text-primary hover:underline">
                      {app.supportEmail}
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <AppSettingsTab app={app} />
        </TabsContent>

        <TabsContent value="secrets">
          <ClientSecretsTab appId={app.id} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Users</CardTitle>
              <CardDescription>
                Users who have authorized this application
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No users have connected to this application yet
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="font-medium text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the application
              <strong> {app.name}</strong> and all associated data including client secrets,
              authorization codes, and refresh tokens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Application"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
