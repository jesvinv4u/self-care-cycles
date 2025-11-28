import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Heart,
  ArrowLeft,
  Calendar,
  Bell,
  User,
  Loader2,
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Profile {
  email: string | null;
  timezone: string | null;
  last_period_end: string | null;
  avg_cycle_days: number;
  reminder_enabled: boolean;
  reminder_offset_days: number;
}

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [lastPeriodEnd, setLastPeriodEnd] = useState("");
  const [avgCycleDays, setAvgCycleDays] = useState(28);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderOffsetDays, setReminderOffsetDays] = useState(7);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setLastPeriodEnd(data.last_period_end || "");
        setAvgCycleDays(data.avg_cycle_days || 28);
        setReminderEnabled(data.reminder_enabled);
        setReminderOffsetDays(data.reminder_offset_days || 7);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          last_period_end: lastPeriodEnd || null,
          avg_cycle_days: avgCycleDays,
          reminder_enabled: reminderEnabled,
          reminder_offset_days: reminderOffsetDays,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">Settings</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your cycle information and reminder preferences
          </p>
        </div>

        {/* Account Info */}
        <div className="mb-6 p-5 rounded-2xl gradient-card border border-border/50 shadow-soft animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Account</p>
              <p className="font-medium text-foreground">{profile?.email || user?.email}</p>
            </div>
          </div>
        </div>

        {/* Cycle Settings */}
        <div className="mb-6 p-5 rounded-2xl gradient-card border border-border/50 shadow-soft animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">Cycle Information</p>
              <p className="text-sm text-muted-foreground">Used to calculate your exam schedule</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lastPeriod" className="text-foreground">
                Last Period End Date
              </Label>
              <Input
                id="lastPeriod"
                type="date"
                value={lastPeriodEnd}
                onChange={(e) => setLastPeriodEnd(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
                className="h-12"
              />
              <p className="text-sm text-muted-foreground">
                Enter the date your last period ended
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cycleDays" className="text-foreground">
                Average Cycle Length (days)
              </Label>
              <Input
                id="cycleDays"
                type="number"
                value={avgCycleDays}
                onChange={(e) => setAvgCycleDays(parseInt(e.target.value) || 28)}
                min={21}
                max={45}
                className="h-12"
              />
              <p className="text-sm text-muted-foreground">
                Typical range is 21-35 days
              </p>
            </div>
          </div>
        </div>

        {/* Reminder Settings */}
        <div className="mb-8 p-5 rounded-2xl gradient-card border border-border/50 shadow-soft animate-slide-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">Reminders</p>
              <p className="text-sm text-muted-foreground">Configure when you get notified</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Receive email notifications for upcoming exams
                </p>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {reminderEnabled && (
              <div className="space-y-2">
                <Label htmlFor="offsetDays" className="text-foreground">
                  Days After Period End
                </Label>
                <Input
                  id="offsetDays"
                  type="number"
                  value={reminderOffsetDays}
                  onChange={(e) => setReminderOffsetDays(parseInt(e.target.value) || 7)}
                  min={1}
                  max={14}
                  className="h-12"
                />
                <p className="text-sm text-muted-foreground">
                  Best time is typically 7-10 days after your period ends
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="space-y-4">
          <Button
            variant="hero"
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Settings;
