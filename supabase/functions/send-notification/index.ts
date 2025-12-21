import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'contract_sent' | 'invoice_created' | 'deliverable_sent' | 'client_approved' | 'message_received';
  clientId: string;
  data?: Record<string, string>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, clientId, data }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to client ${clientId}`);

    // Get client profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', clientId)
      .single();

    if (profileError || !profile) {
      console.error('Profile not found:', profileError);
      return new Response(JSON.stringify({ error: 'Client profile not found' }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let subject = '';
    let html = '';
    const clientName = profile.full_name || 'Valued Client';

    switch (type) {
      case 'contract_sent':
        subject = 'Your Contract is Ready - Stackline Studios';
        html = `
          <h1>Hello ${clientName}!</h1>
          <p>Your contract is ready for review and signature.</p>
          <p>Please log in to your client portal to review and sign the contract.</p>
          <br>
          <p>Best regards,<br>Stackline Studios</p>
        `;
        break;

      case 'invoice_created':
        subject = 'New Invoice - Stackline Studios';
        html = `
          <h1>Hello ${clientName}!</h1>
          <p>A new invoice has been created for you:</p>
          <p><strong>Amount:</strong> $${data?.amount || 'N/A'}</p>
          <p><strong>Description:</strong> ${data?.description || 'N/A'}</p>
          <p>Please log in to your client portal to view and pay the invoice.</p>
          <br>
          <p>Best regards,<br>Stackline Studios</p>
        `;
        break;

      case 'deliverable_sent':
        subject = 'New Deliverable Ready - Stackline Studios';
        html = `
          <h1>Hello ${clientName}!</h1>
          <p>A new deliverable has been shared with you:</p>
          <p><strong>${data?.title || 'New File'}</strong></p>
          <p>Please log in to your client portal to download or view it.</p>
          <br>
          <p>Best regards,<br>Stackline Studios</p>
        `;
        break;

      case 'client_approved':
        subject = 'You\'re Approved! - Stackline Studios';
        html = `
          <h1>Welcome ${clientName}!</h1>
          <p>Great news! Your application has been approved.</p>
          <p>You can now log in to your client portal to:</p>
          <ul>
            <li>Sign your contract</li>
            <li>View project progress</li>
            <li>Access deliverables</li>
            <li>Send messages</li>
          </ul>
          <br>
          <p>We're excited to work with you!</p>
          <p>Best regards,<br>Stackline Studios</p>
        `;
        break;

      case 'message_received':
        subject = 'New Message - Stackline Studios';
        html = `
          <h1>Hello ${clientName}!</h1>
          <p>You have received a new message from Stackline Studios.</p>
          <p>Please log in to your client portal to view and respond.</p>
          <br>
          <p>Best regards,<br>Stackline Studios</p>
        `;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Unknown notification type' }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    // Send email using Resend API directly via fetch
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: "Stackline Studios <onboarding@resend.dev>",
        to: [profile.email],
        subject,
        html,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResponse: emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in send-notification function:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
