import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@/store/useStore';
import { Candidate } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
  phone: z.string().min(10, 'Phone number seems too short.'),
});

type CollectInfoFormValues = z.infer<typeof formSchema>;

interface Props {
  candidate: Candidate;
}

const CollectInfoForm: React.FC<Props> = ({ candidate }) => {
  const { updateCandidate } = useStore();

  const form = useForm<CollectInfoFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: candidate.name || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
    },
  });

  const onSubmit = (values: CollectInfoFormValues) => {
    updateCandidate(candidate.id, {
      ...values,
      interviewState: 'READY_TO_START',
    });
    toast.success('Information confirmed. Your interview is ready!');
  };

  return (
    <Card className="w-full max-w-lg mx-auto animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle>Confirm Your Details</CardTitle>
        <CardDescription>
          We extracted the following details from your resume. Please confirm or correct them before we begin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="(123) 456-7890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Confirm and Start Interview
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CollectInfoForm;
