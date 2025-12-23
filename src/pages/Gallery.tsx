import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Search, X, ChevronLeft, ChevronRight, Maximize2, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Gallery = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [displayCount, setDisplayCount] = useState(9);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        .select("*, gallery_categories(id, name)")
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewImage) return;

      if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "Escape") {
        setPreviewImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage, currentImageIndex, images]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-24 space-y-8">
          <div className="h-16 w-96 bg-muted animate-pulse rounded-lg mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleDownload = async (imageUrl: string, title: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const img = new Image();
      const imgUrl = URL.createObjectURL(blob);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imgUrl;
      });
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      
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
      
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
      }
      
      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            const url = window.URL.createObjectURL(compressedBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${title}.jpg`;
            link.click();
            
            window.URL.revokeObjectURL(url);
            window.URL.revokeObjectURL(imgUrl);
          }
        },
        "image/jpeg",
        0.92
      );

      toast({
        title: "Success",
        description: "Image downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download image",
        variant: "destructive",
      });
    }
  };

  const handleImageClick = (image: any, index: number) => {
    setPreviewImage(image);
    setCurrentImageIndex(index);
  };

  const handleNextImage = () => {
    if (!images || images.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % images.length;
    setCurrentImageIndex(nextIndex);
    setPreviewImage(images[nextIndex]);
  };

  const handlePrevImage = () => {
    if (!images || images.length === 0) return;
    const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
    setCurrentImageIndex(prevIndex);
    setPreviewImage(images[prevIndex]);
  };

  // Group images by category when showing all
  const groupedImages = selectedCategory === "all" && images
    ? images.reduce((acc, image) => {
        const categoryName = image.gallery_categories?.name || "Uncategorized";
        if (!acc[categoryName]) {
          acc[categoryName] = [];
        }
        acc[categoryName].push(image);
        return acc;
      }, {} as Record<string, any[]>)
    : null;

  const displayedImages = images?.slice(0, displayCount) || [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4 gradient-text animate-fade-in">Union Gallery</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-display animate-slide-up">
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

        {/* Gallery Grid - With Category Headers */}
        {selectedCategory === "all" && groupedImages ? (
          <div className="space-y-12">
            {Object.entries(groupedImages).slice(0, Math.ceil(displayCount / 3)).map(([categoryName, categoryImages]) => (
              <div key={categoryName}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-6 pb-3 border-b-2 border-primary/20">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Folder className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{categoryName}</h2>
                  <span className="ml-auto px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    {categoryImages.length} image{categoryImages.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {categoryImages.map((image, index) => (
                    <Card 
                      key={image.id} 
                      className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 border-border hover:border-primary/30 animate-scale-in cursor-pointer" 
                      style={{ animationDelay: `${(index % 9) * 0.05}s` }}
                      onClick={() => handleImageClick(image, images.indexOf(image))}
                    >
                      <div className="relative w-full h-80 overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                        <img
                          src={image.image_url}
                          alt={image.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                          <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1 truncate">{image.title}</h3>
                        {image.event_name && (
                          <p className="text-sm text-muted-foreground mb-3 truncate">{image.event_name}</p>
                        )}
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(image.image_url, image.title)}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Single Category View (no headers needed)
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedImages.map((image, index) => (
              <Card 
                key={image.id} 
                className="overflow-hidden group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 border-border hover:border-primary/30 animate-scale-in cursor-pointer" 
                style={{ animationDelay: `${(index % 9) * 0.05}s` }}
                onClick={() => handleImageClick(image, index)}
              >
                <div className="relative w-full h-80 overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center">
                  <img
                    src={image.image_url}
                    alt={image.title}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <Maximize2 className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{image.title}</h3>
                  {image.event_name && (
                    <p className="text-sm text-muted-foreground mb-3 truncate">{image.event_name}</p>
                  )}
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(image.image_url, image.title)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {images && images.length > displayCount && (
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => setDisplayCount(prev => prev + 9)}
              variant="outline"
              size="lg"
            >
              Load More Images
            </Button>
          </div>
        )}

        {images?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No images found matching your criteria</p>
          </div>
        )}
      </main>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none">
          <div className="relative w-full h-[95vh] flex flex-col">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {images && images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="flex-1 flex items-center justify-center p-4 min-h-0 overflow-hidden">
              <img
                src={previewImage?.image_url}
                alt={previewImage?.title}
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>

            <div className="bg-black/90 p-4 text-white flex-shrink-0">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate">{previewImage?.title}</h3>
                    {previewImage?.event_name && (
                      <p className="text-sm text-gray-300 truncate">{previewImage.event_name}</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center flex-shrink-0">
                    {images && (
                      <span className="text-sm text-gray-400 mr-2">
                        {currentImageIndex + 1} / {images.length}
                      </span>
                    )}
                    <Button
                      onClick={() => handleDownload(previewImage?.image_url, previewImage?.title)}
                      variant="outline"
                      size="sm"
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
     <BackToTop />
    </div>
  );
};

export default Gallery;