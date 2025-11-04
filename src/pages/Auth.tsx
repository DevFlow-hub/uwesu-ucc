import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      if (isLogin) {
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
        navigate("/");
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
        navigate("/");
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
        setIsLogin(true);
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
        <Button
          variant="ghost"
          className="text-primary-foreground hover:bg-primary-foreground/10 mb-4"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="shadow-elevated">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome Back" : "Join Our Union"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in with your email"
                : "Create your account to become a member"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
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

              {!isLogin && (
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
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-hero"
                disabled={loading}
              >
                {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
              </Button>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
