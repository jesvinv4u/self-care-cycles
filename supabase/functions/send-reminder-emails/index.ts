import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting reminder email check...");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // Get all due reminders that haven't been fired yet
    const { data: dueReminders, error: fetchError } = await supabase
      .from("reminder_instances")
      .select("*")
      .eq("fired", false)
      .lte("scheduled_at", now);

    if (fetchError) {
      console.error("Error fetching reminders:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueReminders?.length || 0} due reminders`);

    const results = [];

    for (const reminder of dueReminders || []) {
      // Skip if snoozed and snooze time hasn't passed
      if (reminder.snoozed_until && new Date(reminder.snoozed_until) > new Date()) {
        console.log(`Skipping reminder ${reminder.id} - snoozed until ${reminder.snoozed_until}`);
        continue;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, reminder_enabled, last_period_end, avg_cycle_days, reminder_offset_days")
        .eq("id", reminder.user_id)
        .single();

      if (profileError || !profile) {
        console.log(`Skipping reminder ${reminder.id} - profile not found`);
        continue;
      }

      if (!profile.reminder_enabled) {
        console.log(`Skipping reminder ${reminder.id} - reminders disabled for user`);
        continue;
      }

      if (!profile.email) {
        console.log(`Skipping reminder ${reminder.id} - no email found`);
        continue;
      }

      console.log(`Sending reminder to ${profile.email}`);

      // Send the email using Resend API
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "BSE Tracker <onboarding@resend.dev>",
          to: [profile.email],
          subject: "🩺 Time for Your Breast Self-Exam",
          html: generateEmailHtml(supabaseUrl),
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error(`Error sending email to ${profile.email}:`, errorData);
        results.push({ id: reminder.id, success: false, error: errorData });
        continue;
      }

      // Mark reminder as fired
      await supabase
        .from("reminder_instances")
        .update({ fired: true })
        .eq("id", reminder.id);

      // Schedule next reminder based on cycle
      if (profile.last_period_end) {
        const nextScheduledAt = computeNextReminder(
          new Date(profile.last_period_end).getTime(),
          profile.reminder_offset_days || 7,
          profile.avg_cycle_days || 28
        );

        await supabase.from("reminder_instances").insert({
          user_id: reminder.user_id,
          scheduled_at: new Date(nextScheduledAt).toISOString(),
          fired: false,
        });

        console.log(`Scheduled next reminder at ${new Date(nextScheduledAt).toISOString()}`);
      }

      results.push({ id: reminder.id, success: true, email: profile.email });
      console.log(`Successfully sent reminder to ${profile.email}`);
    }

    return new Response(
      JSON.stringify({ message: "Reminder check complete", processed: results.length, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-reminder-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

function generateEmailHtml(supabaseUrl: string): string {
  const appUrl = "https://gbebydlvqllafkpigvby.lovable.app";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #FDF8F6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #E8B4B8 0%, #D4A5A5 100%); border-radius: 16px 16px 0 0; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">BSE Tracker</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">Your Health Companion</p>
        </div>
        
        <div style="background: #ffffff; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <h2 style="color: #2D3748; margin: 0 0 16px 0; font-size: 22px;">It's Time for Your Monthly Self-Exam 💕</h2>
          
          <p style="color: #4A5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
            This is your friendly reminder that it's the optimal time in your cycle to perform your breast self-examination. 
            Regular self-exams help you understand what's normal for you and catch any changes early.
          </p>
          
          <div style="background: #F0FDF4; border-left: 4px solid #A7C4A0; padding: 16px; border-radius: 8px; margin: 0 0 24px 0;">
            <p style="color: #166534; margin: 0; font-size: 14px;">
              <strong>Best Practice:</strong> Perform your exam 7-10 days after your period ends, when breast tissue is least tender.
            </p>
          </div>
          
          <a href="${appUrl}/bse-check" 
             style="display: inline-block; background: linear-gradient(135deg, #E8B4B8 0%, #D4A5A5 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; margin: 0 0 24px 0;">
            Start Your Self-Exam →
          </a>
          
          <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
            <strong>Important:</strong> If you notice any unusual changes during your exam, please consult with your healthcare provider. 
            Early detection saves lives.
          </p>
        </div>
        
        <div style="text-align: center; padding: 24px;">
          <p style="color: #A0AEC0; font-size: 12px; margin: 0;">
            You're receiving this because you enabled reminders in BSE Tracker.<br>
            <a href="${appUrl}/settings" style="color: #E8B4B8;">Manage your preferences</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function computeNextReminder(
  lastPeriodEnd: number,
  offsetDays: number,
  avgCycleDays: number = 28,
  now: number = Date.now()
): number {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const offsetMs = offsetDays * DAY_MS;
  const cycleMs = avgCycleDays * DAY_MS;
  
  let next = lastPeriodEnd + offsetMs;
  
  if (next < now) {
    const steps = Math.floor((now - next) / cycleMs) + 1;
    next += steps * cycleMs;
  }
  
  return next;
}
