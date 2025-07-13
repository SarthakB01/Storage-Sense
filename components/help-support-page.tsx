"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useApi } from "@/hooks/use-api"
import { useToast } from "@/hooks/use-toast"
import { HelpCircle, Mail, MessageSquare, Book } from "lucide-react"

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type ContactFormData = z.infer<typeof contactSchema>

const faqs = [
  {
    question: "How much storage do I get?",
    answer: "Each account comes with 10GB of free storage. You can upgrade to get more storage space if needed.",
  },
  {
    question: "What file formats are supported for conversion?",
    answer:
      "We support conversion between PDF, DOCX, DOC, ODT, and TXT formats. More formats are being added regularly.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes, all files are encrypted during upload and storage. We use industry-standard security practices to protect your data.",
  },
  {
    question: "Can I share files with others?",
    answer: "File sharing features are coming soon. Currently, you can download files and share them manually.",
  },
  {
    question: "What's the maximum file size I can upload?",
    answer: "The maximum file size per upload is 100MB. For larger files, please contact support.",
  },
  {
    question: "How long are files stored?",
    answer:
      "Files are stored indefinitely as long as your account is active. Inactive accounts may have files removed after 1 year.",
  },
]

export function HelpSupportPage() {
  const [loading, setLoading] = useState(false)
  const { apiCall } = useApi()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true)
    try {
      await apiCall("/api/support/contact", {
        method: "POST",
        body: JSON.stringify(data),
      })

      toast({
        title: "Message sent!",
        description: "We've received your message and will get back to you soon.",
      })

      reset()
    } catch (error) {
      console.error("Failed to send message:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
          Help & Support
        </h1>
        <p className="text-muted-foreground mt-1">Get help with FileVault or contact our support team</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Getting Started</h4>
                <p className="text-sm text-muted-foreground">
                  Upload files by dragging and dropping them into the upload area, or click to browse your computer.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Converting Documents</h4>
                <p className="text-sm text-muted-foreground">
                  Go to the Convert section, select your file, choose the target format, and start the conversion.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Managing Files</h4>
                <p className="text-sm text-muted-foreground">
                  Use the My Files section to view, download, or delete your uploaded files.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your full name"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  {...register("subject")}
                  className={errors.subject ? "border-red-500" : ""}
                />
                {errors.subject && <p className="text-sm text-red-500">{errors.subject.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Please describe your issue or question in detail..."
                  rows={6}
                  {...register("message")}
                  className={errors.message ? "border-red-500" : ""}
                />
                {errors.message && <p className="text-sm text-red-500">{errors.message.message}</p>}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>You can also email us directly at support@filevault.com</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
