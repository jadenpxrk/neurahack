import * as z from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  cn,
  formatEasternDate,
  isDateDisabled,
  toEasternMidnight,
} from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import React from "react";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { useQuiz } from "@/contexts/QuizContext";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

interface QuizSettings {
  enableTimer: boolean;
  mcqTimeLimit: number;
  shortAnswerTimeLimit: number;
  unlimitedMCQAttempts: boolean;
  testDate: Date;
  age: number;
}

interface SettingsCardProps {
  settings: QuizSettings;
  onStartQuiz: (settings: QuizSettings) => void;
}

const formSchema = z.object({
  enableTimer: z.boolean(),
  mcqTimeLimit: z.number().min(5).max(300),
  shortAnswerTimeLimit: z.number().min(10).max(600),
  unlimitedMCQAttempts: z.boolean(),
  testDate: z.date(),
  age: z.number().min(1).max(120),
});

type FormData = z.infer<typeof formSchema>;

export const SettingsCard: React.FC<SettingsCardProps> = ({
  settings,
  onStartQuiz,
}) => {
  const { endQuiz } = useQuiz();
  const router = useRouter();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...settings,
      testDate: settings.testDate || new Date(),
    },
  });

  const watchEnableTimer = form.watch("enableTimer");

  const onSubmit = (data: FormData) => {
    const normalizedData = {
      ...data,
      testDate: data.testDate,
    };
    onStartQuiz(normalizedData);
  };

  const handleCancel = () => {
    endQuiz();
    router.push("/dashboard");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Quiz Settings</CardTitle>
        <CardDescription>
          Customize your quiz experience before starting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="testDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Test Date</FormLabel>
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
                            formatEasternDate(field.value.toISOString())
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          if (date) {
                            const easternMidnight = toEasternMidnight(date);
                            field.onChange(easternMidnight);
                          }
                        }}
                        disabled={isDateDisabled}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the date you want to be tested on (Eastern Time)
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="age"
              render={({
                field,
              }: {
                field: { value: number; onChange: (value: number) => void };
              }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      value={field.value || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const value =
                          e.target.value === "" ? 0 : parseInt(e.target.value);
                        const clampedValue = isNaN(value)
                          ? 1
                          : Math.min(Math.max(value, 1), 120);
                        field.onChange(clampedValue);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your age to compare your memory performance with
                    others in your age group
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="enableTimer"
              render={({
                field,
              }: {
                field: { value: boolean; onChange: (value: boolean) => void };
              }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Timer</FormLabel>
                    <FormDescription>
                      Set time limits for each question
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchEnableTimer && (
              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mcqTimeLimit"
                  render={({
                    field,
                  }: {
                    field: { value: number; onChange: (value: number) => void };
                  }) => (
                    <FormItem>
                      <FormLabel>MCQ Time Limit (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value || ""}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value);
                            const clampedValue = isNaN(value)
                              ? 5
                              : Math.min(Math.max(value, 5), 300);
                            field.onChange(clampedValue);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Time limit for multiple choice questions (5-300 seconds)
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shortAnswerTimeLimit"
                  render={({
                    field,
                  }: {
                    field: { value: number; onChange: (value: number) => void };
                  }) => (
                    <FormItem>
                      <FormLabel>Short Answer Time Limit (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          value={field.value || ""}
                          onChange={(
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            const value =
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value);
                            const clampedValue = isNaN(value)
                              ? 10
                              : Math.min(Math.max(value, 10), 600);
                            field.onChange(clampedValue);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Time limit for short answer questions (10-600 seconds)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormField
              control={form.control}
              name="unlimitedMCQAttempts"
              render={({
                field,
              }: {
                field: { value: boolean; onChange: (value: boolean) => void };
              }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Unlimited MCQ Attempts
                    </FormLabel>
                    <FormDescription>
                      Allow unlimited attempts for multiple choice questions
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full">
                Start Quiz
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
