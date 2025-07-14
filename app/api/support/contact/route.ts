import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

/**
 * POST /api/support/contact - Send contact form
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Contact form submission:", { ...body, message: body.message?.substring(0, 50) + "..." })

    const { name, email, subject, message } = contactSchema.parse(body)

    // Check if SMTP is configured
    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS

    if (smtpConfigured) {
      try {
        // Try to send email if SMTP is configured
        const nodemailer = await import("nodemailer")

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number.parseInt(process.env.SMTP_PORT || "587"),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        })

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
          subject: `Support Request: ${subject}`,
          html: `
            <h3>New Support Request</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, "<br>")}</p>
          `,
        })

        console.log("Email sent successfully")
      } catch (emailError) {
        console.error("Failed to send email, but continuing:", emailError)
        // Don't fail the request if email fails - we'll log it instead
      }
    } else {
      console.log("SMTP not configured, logging contact form submission")
    }

    // Always log the contact form submission for manual review
    console.log("=== CONTACT FORM SUBMISSION ===")
    console.log("Name:", name)
    console.log("Email:", email)
    console.log("Subject:", subject)
    console.log("Message:", message)
    console.log("Timestamp:", new Date().toISOString())
    console.log("===============================")

    return NextResponse.json({
      success: true,
      message: "Your message has been received successfully. We'll get back to you soon!",
    })
  } catch (error) {
    console.error("Error processing contact form:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to send message. Please try again later." }, { status: 500 })
  }
}
