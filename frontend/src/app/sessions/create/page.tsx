"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import axios from "axios";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

// Create two schemas for the two different modes
const scheduledSessionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  startTime: z.date().min(new Date(), "Start time must be in the future"),
  isInstantStart: z.literal(false),
});

const instantSessionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  isInstantStart: z.literal(true),
});

// Combine them with discriminated union
const formSchema = z.discriminatedUnion("isInstantStart", [
  scheduledSessionSchema,
  instantSessionSchema,
]);

type FormValues = z.infer<typeof formSchema>;

export default function CreateSessionPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"schedule" | "instant">("schedule");

  // Redirect if not a teacher
  if (user && user.role !== "TEACHER") {
    router.push("/dashboard");
    return null;
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      isInstantStart: false,
      startTime: undefined,
    },
  });

  const watchIsInstantStart = form.watch("isInstantStart");

  // Update the form values when mode changes
  const handleModeChange = (newMode: "schedule" | "instant") => {
    setMode(newMode);
    form.setValue("isInstantStart", newMode === "instant");
  };

  const onSubmit = async (values: FormValues) => {
    if (!token) {
      toast.error("You must be logged in to create a session");
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionData = {
        title: values.title,
        description: values.description || "",
        startTime: values.isInstantStart ? new Date() : values.startTime,
      };

      // Create the session
      const sessionResponse = await axios.post(
        `http://localhost:8000/api/session/create`,
        sessionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const sessionId = sessionResponse.data.id;

      // If instant start, also create a LiveKit room immediately
      if (values.isInstantStart) {
        try {
          await axios.post(
            `http://localhost:8000/api/rooms/${sessionId}`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          toast.success("Session created and started", {
            description:
              "Your live session has been created and is now active.",
          });

          // Redirect to join page directly
          router.push(`/sessions/${sessionId}/join`);
          return;
        } catch (error) {
          console.error("Error starting session:", error);
          toast.error("Created session but couldn't start it immediately");

          // Still redirect to session page if we can't start it
          router.push(`/sessions/${sessionId}`);
          return;
        }
      }

      toast.success("Session scheduled successfully", {
        description: "Your new session has been created and scheduled.",
      });

      router.push(`/sessions/${sessionId}`);
    } catch (err: any) {
      toast.error("Failed to create session", {
        description: err.response?.data?.message || "An error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8">Create New Session</h1>

      <Tabs
        value={mode}
        onValueChange={(v) => handleModeChange(v as "schedule" | "instant")}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="schedule">
            <Clock className="mr-2 h-4 w-4" />
            Schedule for Later
          </TabsTrigger>
          <TabsTrigger value="instant">
            <PlayCircle className="mr-2 h-4 w-4" />
            Start Right Now
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a title for your session"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what your session will cover"
                          className="resize-none min-h-32"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isInstantStart"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {mode === "schedule" && (
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Time</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP p")
                                ) : (
                                  <span>Pick a date and time</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                            <div className="p-3 border-t">
                              <Input
                                type="time"
                                onChange={(e) => {
                                  const date = field.value || new Date();
                                  const [hours, minutes] = e.target.value
                                    .split(":")
                                    .map(Number);
                                  date.setHours(hours, minutes);
                                  field.onChange(date);
                                }}
                                defaultValue={
                                  field.value
                                    ? format(field.value, "HH:mm")
                                    : ""
                                }
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {mode === "instant" && (
                  <div className="rounded-lg bg-primary/10 p-4 flex items-center">
                    <PlayCircle className="h-6 w-6 text-primary mr-3" />
                    <div>
                      <p className="text-sm font-medium">Start Immediately</p>
                      <p className="text-xs text-muted-foreground">
                        Your session will begin as soon as you click the button
                        below.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating Session..."
              : mode === "instant"
              ? "Create and Start Session Now"
              : "Schedule Session"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
