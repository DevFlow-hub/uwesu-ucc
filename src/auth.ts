// src/utils/auth.ts
export const checkAuth = () => {
  // This is a placeholder for actual auth logic
  // Replace with your real auth state (e.g., from Supabase or Firebase)
  const user = {
    id: "temp-user-id", // temporary ID until real auth
    full_name: "Admin User",
    email: "admin@example.com",
    role: "admin", // ✅ ADD THIS LINE
  };
  return user;
};