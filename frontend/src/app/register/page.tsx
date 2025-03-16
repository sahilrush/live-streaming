"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AtSign,
  KeyRound,
  User,
  Loader2,
  GraduationCap,
  BookOpen,
} from "lucide-react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT" as "STUDENT" | "TEACHER",
  });
  const { register, loading } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (role: "STUDENT" | "TEACHER") => {
    setFormData({
      ...formData,
      role,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await register(formData);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-8 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-block p-4 rounded-full bg-primary/10 mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Join our platform
          </h1>
          <p className="text-muted-foreground mt-2">
            Create an account to start your journey
          </p>
        </div>

        <Card className="w-full shadow-lg border-t-4 border-t-primary animate-in fade-in duration-500">
          <CardHeader>
            <CardTitle className="text-xl">Create an Account</CardTitle>
            <CardDescription>Enter your information to sign up</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {/* Role selection at the top */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">I want to</Label>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    type="button"
                    className={`flex flex-col items-center space-y-3 rounded-md border-2 p-4 ${
                      formData.role === "STUDENT"
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    }`}
                    onClick={() => handleRoleChange("STUDENT")}
                  >
                    <BookOpen
                      className={`h-6 w-6 ${
                        formData.role === "STUDENT"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        formData.role === "STUDENT" ? "text-primary" : ""
                      }`}
                    >
                      Learn
                    </span>
                    <p className="text-xs text-center text-muted-foreground">
                      Join sessions and learn from teachers
                    </p>
                  </button>

                  <button
                    type="button"
                    className={`flex flex-col items-center space-y-3 rounded-md border-2 p-4 ${
                      formData.role === "TEACHER"
                        ? "border-primary bg-primary/5"
                        : "border-muted"
                    }`}
                    onClick={() => handleRoleChange("TEACHER")}
                  >
                    <GraduationCap
                      className={`h-6 w-6 ${
                        formData.role === "TEACHER"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        formData.role === "TEACHER" ? "text-primary" : ""
                      }`}
                    >
                      Teach
                    </span>
                    <p className="text-xs text-center text-muted-foreground">
                      Create and host learning sessions
                    </p>
                  </button>
                </div>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Account Information
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <AtSign className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Password should be at least 8 characters long
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full font-medium"
                size="lg"
                disabled={
                  loading ||
                  !formData.name ||
                  !formData.email ||
                  !formData.password
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Login
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
