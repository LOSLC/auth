"use client";

import { updateApp } from "@/app/actions/oauth";
import type { OAuthApp } from "@/core/db/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/auth";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const AVAILABLE_SCOPES = [
  { value: "read:user", label: "Read user profile" },
  { value: "write:user", label: "Update user profile" },
  { value: "read:email", label: "Read email address" },
  { value: "offline_access", label: "Offline access (refresh tokens)" },
];

interface AppSettingsTabProps {
  app: OAuthApp;
}

export function AppSettingsTab({ app }: AppSettingsTabProps) {
  const { data: currentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: app.name,
    description: app.description || "",
    logoUrl: app.logoUrl || "",
    supportEmail: app.supportEmail || "",
    redirectUris: app.redirectUris.length > 0 ? app.redirectUris : [""],
    scopes: app.scopes,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate redirect URIs
    const validRedirectUris = formData.redirectUris.filter(uri => uri.trim() !== "");
    if (validRedirectUris.length === 0) {
      toast.error("Please add at least one redirect URI");
      return;
    }

    setLoading(true);
    try {
      const result = await updateApp({
        appId: app.id,
        user: currentUser,
        payload: {
          name: formData.name,
          description: formData.description || undefined,
          logoUrl: formData.logoUrl || undefined,
          supportEmail: formData.supportEmail || undefined,
          redirectUris: validRedirectUris,
          scopes: formData.scopes,
        },
      });

      if (result.success) {
        toast.success("Application updated successfully");
        queryClient.invalidateQueries({ queryKey: ["oauth", "app", app.id] });
        queryClient.invalidateQueries({ queryKey: ["oauth", "apps"] });
      } else {
        toast.error(result.message || "Failed to update application");
      }
    } catch (error) {
      toast.error("An error occurred while updating the application");
    } finally {
      setLoading(false);
    }
  };

  const addRedirectUri = () => {
    setFormData({
      ...formData,
      redirectUris: [...formData.redirectUris, ""],
    });
  };

  const removeRedirectUri = (index: number) => {
    if (formData.redirectUris.length > 1) {
      setFormData({
        ...formData,
        redirectUris: formData.redirectUris.filter((_, i) => i !== index),
      });
    }
  };

  const updateRedirectUri = (index: number, value: string) => {
    const newUris = [...formData.redirectUris];
    newUris[index] = value;
    setFormData({ ...formData, redirectUris: newUris });
  };

  const toggleScope = (scope: string) => {
    setFormData({
      ...formData,
      scopes: formData.scopes.includes(scope as any)
        ? formData.scopes.filter((s) => s !== scope)
        : [...formData.scopes, scope as any],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Settings</CardTitle>
        <CardDescription>Update your application configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Application Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Application"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="A brief description of your application"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={formData.supportEmail}
              onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
              placeholder="support@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Redirect URIs *</Label>
            <p className="text-xs text-muted-foreground">
              Users will be redirected to these URLs after authorization
            </p>
            <div className="space-y-2">
              {formData.redirectUris.map((uri, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={uri}
                    onChange={(e) => updateRedirectUri(index, e.target.value)}
                    placeholder="https://example.com/callback"
                    type="url"
                  />
                  {formData.redirectUris.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRedirectUri(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addRedirectUri}>
              <Plus className="h-4 w-4 mr-2" />
              Add Redirect URI
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Scopes</Label>
            <p className="text-xs text-muted-foreground">
              Select the permissions your application will request
            </p>
            <div className="space-y-2">
              {AVAILABLE_SCOPES.map((scope) => (
                <div key={scope.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`settings-${scope.value}`}
                    checked={formData.scopes.includes(scope.value as any)}
                    onCheckedChange={() => toggleScope(scope.value)}
                  />
                  <Label htmlFor={`settings-${scope.value}`} className="font-normal cursor-pointer">
                    {scope.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
