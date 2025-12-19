import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const Comments = () => {
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments"],
    queryFn: async () => {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!commentsData || commentsData.length === 0) return [];

      const userIds = commentsData.map((c) => c.user_id).filter(Boolean);

      let profilesData = [];
      if (userIds.length > 0) {
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        if (!profileError) {
          profilesData = data || [];
        }
      }

      return commentsData.map((comment) => {
        const profile = profilesData.find((p) => p.user_id === comment.user_id);
        return {
          ...comment,
          profile_name: profile?.full_name || "Anonymous",
        };
      });
    },
    enabled: !!user,
  });

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createMutation.mutate(newComment);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            Comments & Suggestions
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Share your thoughts, ideas, and feedback with the union community
          </p>
        </div>

        {/* Comment Form */}
        {user ? (
          <Card className="mb-8 shadow-lg border-slate-200 hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Send className="w-5 h-5" />
                Share Your Thoughts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  placeholder="What's on your mind? Share your ideas, suggestions, or feedback..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={5}
                  className="resize-none border-slate-300 focus:border-primary focus:ring-primary text-base"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">
                    {newComment.length} characters
                  </span>
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim() || createMutation.isPending}
                    className="px-6"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Comment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 shadow-lg border-slate-200">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 text-lg mb-4">
                Please log in to join the conversation
              </p>
              <Button onClick={() => navigate("/auth")} variant="default">
                Sign In
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Comments Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Recent Comments
            {comments && comments.length > 0 && (
              <span className="ml-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                {comments.length}
              </span>
            )}
          </h2>
        </div>

        {/* Comments List */}
        {commentsLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {comments?.map((comment, index) => (
              <Card 
                key={comment.id} 
                className="shadow-md hover:shadow-lg transition-all duration-300 border-slate-200 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {comment.profile_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-base">
                          {comment.profile_name}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-1">
                          {format(
                            new Date(comment.created_at),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </p>
                      </div>
                    </div>
                    {(user?.id === comment.user_id || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(comment.id)}
                        disabled={deleteMutation.isPending}
                        className="hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed pl-13">
                    {comment.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {comments?.length === 0 && !commentsLoading && (
          <Card className="shadow-lg border-slate-200">
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
                <MessageSquare className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-600 text-lg font-medium mb-2">
                No comments yet
              </p>
              <p className="text-slate-500">
                Be the first to share your thoughts with the community!
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Comments;