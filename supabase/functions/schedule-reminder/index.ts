import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const { user_id } = await req.json();
    
    if (!user_id) {
      throw new Error("user_id is required");
    }

    console.log(`Scheduling reminder for user ${user_id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("last_period_end, avg_cycle_days, reminder_offset_days, reminder_enabled")
      .eq("id", user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw profileError;
    }

    if (!profile?.reminder_enabled) {
      return new Response(
        JSON.stringify({ message: "Reminders disabled for user" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!profile?.last_period_end) {
      return new Response(
        JSON.stringify({ message: "No last period end date set" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate next reminder time
    const nextScheduledAt = computeNextReminder(
      new Date(profile.last_period_end).getTime(),
      profile.reminder_offset_days || 7,
      profile.avg_cycle_days || 28
    );

    // Delete any existing unfired reminders for this user
    await supabase
      .from("reminder_instances")
      .delete()
      .eq("user_id", user_id)
      .eq("fired", false);

    // Create new reminder
    const { data: reminder, error: insertError } = await supabase
      .from("reminder_instances")
      .insert({
        user_id,
        scheduled_at: new Date(nextScheduledAt).toISOString(),
        fired: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating reminder:", insertError);
      throw insertError;
    }

    console.log(`Created reminder for ${new Date(nextScheduledAt).toISOString()}`);

    return new Response(
      JSON.stringify({ 
        message: "Reminder scheduled", 
        scheduled_at: new Date(nextScheduledAt).toISOString(),
        reminder 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in schedule-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

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
