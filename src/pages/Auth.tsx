import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ArrowLeft, Eye, EyeOff, Sparkles, Shield, Mail, Lock, User, Phone } from "lucide-react";
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

        if (error) {
          if (error.message.includes("Invalid login credentials") || 
              error.message.includes("Email not confirmed") ||
              error.message.includes("User not found")) {
            toast({
              title: "Account Not Found",
              description: "No account exists with this email. Please sign up instead.",
            });
            setMode("signup");
            setLoading(false);
            return;
          }
          throw error;
        }

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
        if (!fullName.trim()) {
          throw new Error("Please enter your full name");
        }
        
        if (!whatsappNumber || whatsappNumber.length < 10) {
          throw new Error("Please enter a valid WhatsApp number");
        }

        const phoneMatch = whatsappNumber.match(/^\+(\d{1,3})(\d+)$/);
        if (!phoneMatch) {
          throw new Error("Please enter a valid WhatsApp number with country code");
        }
        const countryCode = `+${phoneMatch[1]}`;
        const number = phoneMatch[2];

        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              whatsapp_number: number,
              country_code: countryCode,
            },
          },
        });

        if (error) throw error;

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
      
      if (errorMessage.includes("already registered") || errorMessage.includes("User already registered")) {
        toast({
          title: "Account Already Exists",
          description: "This email is already registered. Please sign in instead.",
          variant: "destructive",
        });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -right-20 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -left-20 w-[400px] h-[400px] bg-gradient-to-tr from-secondary/20 to-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-full blur-3xl" />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-secondary/40 rounded-full animate-ping" style={{ animationDelay: '1s', animationDuration: '3s' }} />
        <div className="absolute bottom-1/3 left-2/3 w-2 h-2 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '2s', animationDuration: '3s' }} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
        <Card className="shadow-2xl border-2 border-slate-200 overflow-hidden backdrop-blur-sm bg-white/95">
          {/* Gradient header overlay */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-primary" />
          
          <CardHeader className="text-center pt-10 pb-6 relative">
            {/* Enhanced icon container */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-full blur-2xl animate-pulse" />
                <div className="relative p-5 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10 rounded-2xl shadow-lg">
                  <Users className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>
            
            {/* Title with badge */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full border border-primary/20 mb-2">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold tracking-wider text-primary uppercase">
                  {mode === "reset" ? "Password Recovery" : mode === "login" ? "Member Login" : "New Member"}
                </span>
                <Sparkles className="w-3.5 h-3.5 text-secondary" />
              </div>
              
              <CardTitle className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
                {mode === "reset" ? "Reset Password" : mode === "login" ? "Welcome Back" : "Join Our Union"}
              </CardTitle>
              
              <CardDescription className="text-base text-slate-600">
                {mode === "reset"
                  ? "Enter your email to receive a password reset link"
                  : mode === "login"
                  ? "Sign in with your email"
                  : "Create your account to become a member"}
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleAuth} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2 animate-in slide-in-from-right duration-500">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-slate-700">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pl-10 h-11 border-slate-300 focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2 animate-in slide-in-from-left duration-500">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 border-slate-300 focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              {mode === "signup" && (
                <div className="space-y-2 animate-in slide-in-from-right duration-500" style={{ animationDelay: '100ms' }}>
                  <Label htmlFor="whatsapp" className="text-sm font-semibold text-slate-700">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                    <PhoneInput
                      international
                      defaultCountry="GH"
                      value={whatsappNumber}
                      onChange={(value) => setWhatsappNumber(value || "")}
                      className="flex h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                    />
                  </div>
                  <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-200">
                    Required: We'll send event reminders via WhatsApp. Your number will only be used for union communications.
                  </p>
                </div>
              )}

              {mode !== "reset" && (
                <div className="space-y-2 animate-in slide-in-from-left duration-500" style={{ animationDelay: '200ms' }}>
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="pl-10 pr-10 h-11 border-slate-300 focus:border-primary focus:ring-primary"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                      )}
                    </Button>
                  </div>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("reset")}
                      className="text-xs text-primary hover:text-primary/80 hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : (
                  mode === "reset" ? "Send Reset Link" : mode === "login" ? "Sign In" : "Sign Up"
                )}
              </Button>

              <div className="text-center pt-4 space-y-3">
                {mode === "reset" ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode("login")}
                    className="w-full h-11 border-2 border-slate-300 hover:border-primary hover:bg-slate-50 font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to sign in
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-slate-500 font-medium">
                          {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMode(mode === "login" ? "signup" : "login")}
                      className="w-full h-11 border-2 border-slate-300 hover:border-primary hover:bg-slate-50 font-semibold"
                    >
                      {mode === "login" ? "Sign Up" : "Sign In"}
                    </Button>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Decorative bottom element */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            <div className="h-1 w-12 bg-gradient-to-r from-transparent to-primary/50 rounded-full" />
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <div className="h-1 w-12 bg-gradient-to-l from-transparent to-secondary/50 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;