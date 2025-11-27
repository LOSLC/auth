"use client";

import { createOAuthApp } from "@/app/actions/oauth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/auth";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";

const AVAILABLE_SCOPES = [
  {
    value: "openid",
    label: "OpenID Connect (basic user info)",
  },
  { value: "offline_access", label: "Offline access (refresh tokens)" },
];

interface CreateOAuthAppDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateOAuthAppDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOAuthAppDialogProps) {
  const { data: currentUser } = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    appName: "",
    description: "",
    url: "",
    logoUrl: "",
    supportEmail: "",
    redirectUris: [""],
    scopes: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validate redirect URIs
    const validRedirectUris = formData.redirectUris.filter(
      (uri) => uri.trim() !== "",
    );
    if (validRedirectUris.length === 0) {
      toast.error("Please add at least one redirect URI");
      return;
    }

    setLoading(true);
    try {
      const result = await createOAuthApp(currentUser, {
        appName: formData.appName,
        description: formData.description || undefined,
        url: formData.url,
        logoUrl: formData.logoUrl || undefined,
        supportEmail: formData.supportEmail || undefined,
        redirectUris: validRedirectUris,
        scopes: formData.scopes as any,
      });

      if (result.success) {
        setClientSecret(result.data.clientSecret);
        toast.success("OAuth application created successfully");
      } else {
        toast.error(result.message || "Failed to create application");
      }
    } catch (error) {
      toast.error("An error occurred while creating the application");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (clientSecret) {
      onSuccess();
      setClientSecret(null);
      setFormData({
        appName: "",
        description: "",
        url: "",
        logoUrl: "",
        supportEmail: "",
        redirectUris: [""],
        scopes: [],
      });
    }
    onOpenChange(false);
  };

  const addRedirectUri = () => {
    setFormData({
      ...formData,
      redirectUris: [...formData.redirectUris, ""],
    });
  };

  const removeRedirectUri = (index: number) => {
    setFormData({
      ...formData,
      redirectUris: formData.redirectUris.filter((_, i) => i !== index),
    });
  };

  const updateRedirectUri = (index: number, value: string) => {
    const newUris = [...formData.redirectUris];
    newUris[index] = value;
    setFormData({ ...formData, redirectUris: newUris });
  };

  const toggleScope = (scope: string) => {
    setFormData({
      ...formData,
      scopes: formData.scopes.includes(scope)
        ? formData.scopes.filter((s) => s !== scope)
        : [...formData.scopes, scope],
    });
  };

  if (clientSecret) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Application Created Successfully</DialogTitle>
            <DialogDescription>
              Save your client secret now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure to copy your client secret now. For security reasons,
                you won't be able to see it again.
              </AlertDescription>
            </Alert>
            <div>
              <Label>Client Secret</Label>
              <div className="flex gap-2 mt-2">
                <Input value={clientSecret} readOnly className="font-mono" />
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(clientSecret);
                    toast.success("Copied to clipboard");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create OAuth Application</DialogTitle>
          <DialogDescription>
            Register a new OAuth 2.0 application to integrate with your service
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName">Application Name *</Label>
            <Input
              id="appName"
              value={formData.appName}
              onChange={(e) =>
                setFormData({ ...formData, appName: e.target.value })
              }
              placeholder="My Application"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="A brief description of your application"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Application URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              placeholder="https://example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              type="url"
              value={formData.logoUrl}
              onChange={(e) =>
                setFormData({ ...formData, logoUrl: e.target.value })
              }
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={formData.supportEmail}
              onChange={(e) =>
                setFormData({ ...formData, supportEmail: e.target.value })
              }
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRedirectUri}
            >
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
                    id={scope.value}
                    checked={formData.scopes.includes(scope.value)}
                    onCheckedChange={() => toggleScope(scope.value)}
                  />
                  <Label
                    htmlFor={scope.value}
                    className="font-normal cursor-pointer"
                  >
                    {scope.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
