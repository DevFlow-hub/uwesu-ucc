import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get the page user was trying to access
  const from = (location.state as any)?.from || "/";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
        setMode("login");
      } else if (mode === "login") {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          sessionStorage.setItem('just-logged-in', 'true');
          window.dispatchEvent(new Event('user-logged-in'));
        }

        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
        navigate(from);
      } else {
        if (!whatsappNumber) {
          throw new Error("Please enter your WhatsApp number");
        }

        // Extract country code and number from WhatsApp input
        const phoneMatch = whatsappNumber.match(/^\+(\d{1,3})(\d+)$/);
        if (!phoneMatch) {
          throw new Error("Invalid WhatsApp number format");
        }
        const countryCode = `+${phoneMatch[1]}`;
        const number = phoneMatch[2];

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        // Update profile with WhatsApp number
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              whatsapp_number: number,
              country_code: countryCode,
            })
            .eq('user_id', data.user.id);

          if (profileError) console.error('Profile update error:', profileError);
        }

        sessionStorage.setItem('just-logged-in', 'true');
        window.dispatchEvent(new Event('user-logged-in'));

        toast({
          title: "Account created!",
          description: "You have been automatically logged in.",
        });
        navigate(from);
      }
    } catch (error: any) {
      const errorMessage = error.message || error.error_description || "An error occurred";
      
      // Handle "user already registered" error specifically
      if (errorMessage.includes("already registered") || errorMessage.includes("User already registered")) {
        toast({
          title: "Account Already Exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
        // Auto-switch to login mode
        setMode("login");
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {mode === "reset" ? "Reset Password" : mode === "login" ? "Welcome Back" : "Join Our Union"}
            </CardTitle>
            <CardDescription>
              {mode === "reset"
                ? "Enter your email to receive a password reset link"
                : mode === "login"
                ? "Sign in with your email"
                : "Create your account to become a member"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <PhoneInput
                    international
                    defaultCountry="US"
                    value={whatsappNumber}
                    onChange={(value) => setWhatsappNumber(value || "")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send event reminders via WhatsApp. Your number will only be used for union communications.
                  </p>
                </div>
              )}

              {mode !== "reset" && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-hero"
                disabled={loading}
              >
                {loading ? "Loading..." : mode === "reset" ? "Send Reset Link" : mode === "login" ? "Sign In" : "Sign Up"}
              </Button>

              <div className="text-center pt-4 space-y-2">
                {mode === "reset" ? (
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back to sign in
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode(mode === "login" ? "signup" : "login")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {mode === "login"
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"}
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
