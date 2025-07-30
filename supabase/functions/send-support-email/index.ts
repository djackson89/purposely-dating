import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  type: 'feedback' | 'support';
  name: string;
  email: string;
  feedback: string;
  subject: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, name, email, feedback, subject }: SupportEmailRequest = await req.json();

    // Validate required fields
    if (!feedback || !feedback.trim()) {
      return new Response(
        JSON.stringify({ error: "Feedback message is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send email to business
    const businessEmailResponse = await resend.emails.send({
      from: "Purposely Support <onboarding@resend.dev>",
      to: ["info@thepurposelyapp.com"],
      subject: subject || `New ${type} from Purposely App`,
      html: `
        <h2>New ${type === 'feedback' ? 'User Feedback' : 'Support Request'}</h2>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>From:</strong> ${name} ${email !== 'not-provided@example.com' ? `(${email})` : '(Anonymous)'}</p>
          <p><strong>Type:</strong> ${type === 'feedback' ? 'Improvement Feedback' : 'Support Request'}</p>
          <p><strong>Message:</strong></p>
          <div style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">
            ${feedback.replace(/\n/g, '<br>')}
          </div>
        </div>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          This message was sent from the Purposely app support system.
        </p>
      `,
    });

    // Send confirmation email to user if they provided an email
    if (email && email !== 'not-provided@example.com') {
      await resend.emails.send({
        from: "Purposely Team <onboarding@resend.dev>",
        to: [email],
        subject: "We received your feedback!",
        html: `
          <h1>Thank you for your feedback, ${name}!</h1>
          <p>We have received your message and truly appreciate you taking the time to help us improve Purposely.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p><strong>Your message:</strong></p>
            <p style="font-style: italic;">"${feedback}"</p>
          </div>
          
          <p>Our team will review your feedback carefully. If you provided your email address and your feedback requires a response, we'll get back to you within 24-48 hours.</p>
          
          <p>Thank you for helping us make Purposely better for everyone! 💕</p>
          
          <p>Best regards,<br>
          The Purposely Team</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            If you have any urgent concerns, please email us directly at 
            <a href="mailto:info@thepurposelyapp.com">info@thepurposelyapp.com</a>
          </p>
        `,
      });
    }

    console.log("Support email sent successfully:", businessEmailResponse);

    return new Response(JSON.stringify(businessEmailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);