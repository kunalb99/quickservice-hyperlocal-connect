
import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, isLoading, login, signup } = useApp();
  const navigate = useNavigate();
  
  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isSignup) {
        if (!name) {
          toast.error("Please enter your name");
          setIsSubmitting(false);
          return;
        }
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isSignup ? "Create an account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-gray-600">
            {isSignup
              ? "Sign up to start using our service"
              : "Please sign in to your account"}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required={isSignup}
                disabled={isSubmitting || isLoading}
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting || isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? "Processing..." : isSignup ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
          </span>{" "}
          <button
            type="button"
            className="font-medium text-primary hover:text-primary/80"
            onClick={() => setIsSignup(!isSignup)}
            disabled={isSubmitting || isLoading}
          >
            {isSignup ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
