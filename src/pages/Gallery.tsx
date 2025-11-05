import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Gallery = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayCount, setDisplayCount] = useState(9);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // All hooks must be called before any conditional returns
  const { data: categories } = useQuery({
    queryKey: ["gallery-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !loading,
  });

  const { data: images } = useQuery({
    queryKey: ["gallery-images", selectedCategory, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("gallery_images")
        .select("*, gallery_categories(name)")
        .order("created_at", { ascending: false });

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,event_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !loading,
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageData: { id: string; imageUrl: string }) => {
      // Extract file path from URL
      const urlParts = imageData.imageUrl.split("/");
      const filePath = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("gallery-images")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", imageData.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery-images"] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const checkAuthAndAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();
      
      setIsAdmin(!!data);
      setLoading(false);
    };

    checkAuthAndAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Now conditional return is safe - all hooks have been called
  if (loading) {
    return null;
  }

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      // Fetch the original image
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create an image element to get dimensions
      const img = new Image();
      const imgUrl = URL.createObjectURL(blob);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });
      
      // Create canvas to compress image while maintaining quality
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
      // Set max dimensions while maintaining aspect ratio
      const maxWidth = 1920;
      const maxHeight = 1920;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw image with high quality
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      // Convert to blob with optimized quality (0.92 provides excellent quality with smaller file size)
      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            const url = window.URL.createObjectURL(compressedBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${title}.jpg`;
            link.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            window.URL.revokeObjectURL(imgUrl);
          }
        },
        "image/jpeg",
        0.92
      );
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (imageId: string, imageUrl: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteImageMutation.mutate({ id: imageId, imageUrl });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold mb-4 gradient-text animate-fade-in">Union Gallery</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto font-display animate-slide-up">
            Browse through our collection of memorable moments and events
          </p>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-4 mb-8 max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by title or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images?.slice(0, displayCount).map((image, index) => (
            <Card key={image.id} className="overflow-hidden group hover:shadow-lg transition-all duration-500 hover:scale-[1.02] border-2 border-border hover:border-secondary/30 animate-scale-in" style={{ animationDelay: `${(index % 9) * 0.05}s` }}>
              <div className="relative w-full h-80 overflow-hidden bg-muted/30">
                <img
                  src={image.image_url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1">{image.title}</h3>
                {image.event_name && (
                  <p className="text-sm text-muted-foreground mb-3">{image.event_name}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(image.image_url, image.title)}
                    className="flex-1 animate-pulse-glow"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(image.id, image.image_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {images && images.length > displayCount && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setDisplayCount(prev => prev + 9)}
              variant="outline"
              size="lg"
            >
              View More
            </Button>
          </div>
        )}

        {images?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No images found</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Gallery;