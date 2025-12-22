import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface CategoryEditorProps {
  category: Category | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CategoryEditor = ({ category, open, onClose, onSuccess }: CategoryEditorProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageTitle: "",
    eventName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageCount, setImageCount] = useState(0);
  const { toast } = useToast();

  // Fetch image count and current values when category changes
  useEffect(() => {
    const fetchCategoryData = async () => {
      if (category) {
        // Get category info
        setFormData({
          name: category.name || "",
          description: category.description || "",
          imageTitle: "",
          eventName: "",
        });

        // Count images in this category
        const { data: images, error } = await supabase
          .from("gallery_images")
          .select("id, title, event_name")
          .eq("category_id", category.id);

        if (!error && images) {
          setImageCount(images.length);
          
          // Pre-fill with existing values if all images have the same title/event
          if (images.length > 0) {
            const firstImage = images[0];
            const allSameTitle = images.every(img => img.title === firstImage.title);
            const allSameEvent = images.every(img => img.event_name === firstImage.event_name);
            
            setFormData(prev => ({
              ...prev,
              imageTitle: allSameTitle ? (firstImage.title || "") : "",
              eventName: allSameEvent ? (firstImage.event_name || "") : "",
            }));
          }
        }
      }
    };

    fetchCategoryData();
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setIsSubmitting(true);
    try {
      // Step 1: Update the category itself
      const { error: categoryError } = await supabase
        .from("gallery_categories")
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq("id", category.id);

      if (categoryError) throw categoryError;

      // Step 2: Update ALL images in this category (if title or event name provided)
      if (formData.imageTitle || formData.eventName) {
        const updateData: any = {};
        
        if (formData.imageTitle.trim()) {
          updateData.title = formData.imageTitle.trim();
        }
        
        if (formData.eventName.trim()) {
          updateData.event_name = formData.eventName.trim();
        }

        if (Object.keys(updateData).length > 0) {
          const { error: imagesError } = await supabase
            .from("gallery_images")
            .update(updateData)
            .eq("category_id", category.id);

          if (imagesError) throw imagesError;
        }
      }

      toast({
        title: "✅ Success",
        description: imageCount > 0 
          ? `Category and ${imageCount} image(s) updated successfully`
          : "Category updated successfully",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast({
        title: "❌ Error",
        description: "Failed to update: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Category & Images</DialogTitle>
          <DialogDescription>
            Update category details and apply changes to all images in this category
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Section */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="font-semibold text-sm text-slate-700">Category Information</h3>
            
            <div>
              <Label htmlFor="edit-category-name">Category Name *</Label>
              <Input
                id="edit-category-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Freshers Welcome 2024"
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-category-description">Description</Label>
              <Textarea
                id="edit-category-description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this category"
                rows={2}
              />
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-slate-700">
                Update All Images in Category
              </h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                {imageCount} image{imageCount !== 1 ? 's' : ''}
              </span>
            </div>

            {imageCount > 0 ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Bulk Update</p>
                    <p className="text-xs mt-1">
                      Changes below will apply to ALL {imageCount} image{imageCount !== 1 ? 's' : ''} in this category. 
                      Leave fields empty to keep existing values.
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-image-title">
                    Image Title (applies to all images)
                  </Label>
                  <Input
                    id="edit-image-title"
                    value={formData.imageTitle}
                    onChange={(e) => setFormData({ ...formData, imageTitle: e.target.value })}
                    placeholder="e.g., Freshers Welcome Photos"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to keep individual image titles unchanged
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-event-name">
                    Event Name (applies to all images)
                  </Label>
                  <Input
                    id="edit-event-name"
                    value={formData.eventName}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    placeholder="e.g., Freshers Welcome (2024/25)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to keep individual event names unchanged
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-muted-foreground">
                  No images in this category yet
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};