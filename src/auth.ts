export const checkAuth = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Not authenticated");
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("user_id", user.id)
    .single();

  return {
    id: user.id,
    full_name: profile?.full_name || user.email?.split('@')[0] || "User",
    email: user.email,
    role: profile?.role || "member",
  };
};