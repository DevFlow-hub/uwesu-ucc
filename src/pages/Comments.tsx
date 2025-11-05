import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Comments = () => {
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    setIsAdmin(data || false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth", { state: { from: "/comments" } });
        return;
      }

      setUser(session.user);
      if (session.user) {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth", { state: { from: "/comments" } });
        return;
      }

      setUser(session.user);
      if (session.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const { data: comments } = useQuery({
    queryKey: ["comments"],
    queryFn: async () => {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      if (!commentsData || commentsData.length === 0) return [];

      // Fetch profiles separately
      const userIds = commentsData?.map(c => c.user_id) || [];
      const { data: profilesData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      if (profileError) {
        console.error("Error fetching profiles:", profileError);
      }

      // Merge data
      return commentsData?.map(comment => {
        const profile = profilesData?.find(p => p.user_id === comment.user_id);
        return {
          ...comment,
          profile_name: profile?.full_name || "Anonymous"
        };
      });
    },
    enabled: !!user, // Only run query when user is loaded
  });

  if (loading) {
    return null;
  }

  const createMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase
        .from("comments")
        .insert({ content, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      setNewComment("");
      toast({ title: "Comment posted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
      toast({ title: "Comment deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate(newComment);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 gradient-text">Comments & Suggestions</h1>
            <p className="text-muted-foreground">
              Share your thoughts and suggestions with the union
            </p>
          </div>

          {/* Comment Form */}
          {user ? (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Post a Comment</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    placeholder="Share your feedback or suggestions..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                  />
                  <Button type="submit" disabled={!newComment.trim()}>
                    Post Comment
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-8">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Please log in to post comments</p>
              </CardContent>
            </Card>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments?.map((comment) => (
              <Card key={comment.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">{comment.profile_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    {(user?.id === comment.user_id || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {comments?.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No comments yet. Be the first to share!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Comments;