import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { ImageCropper } from "@/components/ImageCropper";
import { useToast } from "@/hooks/use-toast";

interface Executive {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  designation: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface ExecutiveEditorProps {
  executive: Executive | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExecutiveEditor = ({ executive, open, onClose, onSuccess }: ExecutiveEditorProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    designation: "",
    bio: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const { toast } = useToast();

  // Update form data when executive changes
  useEffect(() => {
    if (executive) {
      setFormData({
        full_name: executive.full_name || "",
        email: executive.email || "",
        phone: executive.phone || "",
        designation: executive.designation || "",
        bio: executive.bio || "",
      });
      setAvatarFile(null);
      setImagePreview(null);
      setShowCropper(false);
    }
  }, [executive]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
    setAvatarFile(croppedFile);
    setShowCropper(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!executive) return;

    setIsSubmitting(true);
    try {
      let avatar_url = executive.avatar_url;

      // Upload new avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Delete old avatar if exists
        if (executive.avatar_url) {
          const oldFileName = executive.avatar_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage
              .from('executives-avatars')
              .remove([oldFileName]);
          }
        }

        // Upload new avatar
        const { error: uploadError } = await supabase.storage
          .from('executives-avatars')
          .upload(filePath, avatarFile, {
            cacheControl: '0', // Disable caching to see changes immediately
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('executives-avatars')
          .getPublicUrl(filePath);
        
        // Add cache-busting parameter
        avatar_url = `${publicUrl}?t=${Date.now()}`;
      }

      // Update executive profile in the executives table
      const { error } = await supabase
        .from("executives")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          designation: formData.designation || null,
          bio: formData.bio || null,
          avatar_url,
        })
        .eq("id", executive.id);

      if (error) throw error;

      toast({
        title: "✅ Success",
        description: "Executive profile updated successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating executive:", error);
      toast({
        title: "❌ Error",
        description: "Failed to update executive: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!executive) return null;

  const getInitials = (name: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter(Boolean)
      .map(n => n[0].toUpperCase())
      .join("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Executive Profile</DialogTitle>
          <DialogDescription>Update executive information and profile details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={avatarFile ? URL.createObjectURL(avatarFile) : executive.avatar_url || undefined} 
                alt={executive.full_name || "Avatar"} 
              />
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(executive.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="edit-avatar">Change Profile Picture</Label>
              <Input
                id="edit-avatar"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
              />
              {avatarFile && (
                <p className="text-sm text-green-600 mt-1 font-medium">
                  ✓ Image cropped and ready to upload
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="edit-full-name">Full Name *</Label>
              <Input
                id="edit-full-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-designation">Position/Designation *</Label>
              <Input
                id="edit-designation"
                value={formData.designation || ""}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g., President, Secretary, Treasurer"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-bio">Bio</Label>
              <Textarea
                id="edit-bio"
                value={formData.bio || ""}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief biography or description"
                rows={4}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="3d" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        {imagePreview && (
          <ImageCropper
            image={imagePreview}
            open={showCropper}
            onClose={() => {
              setShowCropper(false);
              setImagePreview(null);
            }}
            onComplete={handleCropComplete}
            aspectRatio={1}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};