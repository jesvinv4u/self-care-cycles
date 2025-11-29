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
      .select("last_period_end, avg_cycle_days, reminder_offset_days, reminder_enabled, timezone")
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

    // Calculate next reminder time at 9 AM in user's timezone
    const nextScheduledAt = computeNextReminder(
      new Date(profile.last_period_end).getTime(),
      profile.reminder_offset_days || 7,
      profile.avg_cycle_days || 28,
      profile.timezone || "UTC",
      9 // 9 AM local time
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
  timezone: string = "UTC",
  targetHour: number = 9, // 9 AM local time
  now: number = Date.now()
): number {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const offsetMs = offsetDays * DAY_MS;
  const cycleMs = avgCycleDays * DAY_MS;
  
  // Calculate the base reminder date (midnight UTC on the target day)
  let baseDate = lastPeriodEnd + offsetMs;
  
  // If base date is in the past, advance by cycle increments
  if (baseDate < now) {
    const steps = Math.floor((now - baseDate) / cycleMs) + 1;
    baseDate += steps * cycleMs;
  }
  
  // Convert to 9 AM in user's timezone
  const targetDate = new Date(baseDate);
  
  // Get the date components in the user's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  
  const parts = formatter.formatToParts(targetDate);
  const year = parseInt(parts.find(p => p.type === "year")?.value || "2025");
  const month = parseInt(parts.find(p => p.type === "month")?.value || "1") - 1;
  const day = parseInt(parts.find(p => p.type === "day")?.value || "1");
  
  // Create a date string for 9 AM in the user's timezone
  const localDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(targetHour).padStart(2, "0")}:00:00`;
  
  // Get the UTC offset for the target timezone at this date
  const testDate = new Date(localDateStr + "Z");
  const utcFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    hour12: false,
  });
  
  // Calculate offset by comparing UTC time to local time
  const localHour = parseInt(utcFormatter.format(testDate));
  const utcHour = testDate.getUTCHours();
  let offsetHours = localHour - utcHour;
  
  // Handle day boundary crossings
  if (offsetHours > 12) offsetHours -= 24;
  if (offsetHours < -12) offsetHours += 24;
  
  // Create the final UTC timestamp for 9 AM local time
  const finalDate = new Date(Date.UTC(year, month, day, targetHour - offsetHours, 0, 0));
  
  // If this time has already passed today, check if we need to adjust
  if (finalDate.getTime() < now) {
    // Move to next cycle
    return computeNextReminder(
      lastPeriodEnd,
      offsetDays,
      avgCycleDays,
      timezone,
      targetHour,
      finalDate.getTime() + DAY_MS
    );
  }
  
  return finalDate.getTime();
}
