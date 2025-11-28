import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Calendar, 
  History, 
  Settings, 
  LogOut, 
  Play, 
  Clock,
  CheckCircle,
  Loader2 
} from "lucide-react";
import { format, differenceInDays, addDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  last_period_end: string | null;
  avg_cycle_days: number;
  reminder_enabled: boolean;
  reminder_offset_days: number;
}

interface BseRecord {
  id: string;
  timestamp: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastRecord, setLastRecord] = useState<BseRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch last BSE record
      const { data: recordData } = await supabase
        .from("bse_records")
        .select("id, timestamp")
        .eq("user_id", user!.id)
        .order("timestamp", { ascending: false })
        .limit(1)
        .single();
      
      if (recordData) {
        setLastRecord(recordData);
      }
    } catch (error) {
      // Profile might not exist yet for new users
    } finally {
      setLoading(false);
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

  const getNextExamDate = () => {
    if (!profile?.last_period_end) return null;
    const lastPeriod = new Date(profile.last_period_end);
    const nextExam = addDays(lastPeriod, profile.reminder_offset_days);
    
    // If the next exam date is in the past, calculate the next one
    const today = new Date();
    if (nextExam < today) {
      const daysPassed = differenceInDays(today, nextExam);
      const cyclesPassed = Math.ceil(daysPassed / profile.avg_cycle_days);
      return addDays(nextExam, cyclesPassed * profile.avg_cycle_days);
    }
    return nextExam;
  };

  const nextExamDate = getNextExamDate();
  const daysUntilExam = nextExamDate ? differenceInDays(nextExamDate, new Date()) : null;

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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">BSE Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate("/history")}>
              <History className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome back!
          </h1>
          <p className="text-muted-foreground">
            Stay on top of your breast health with regular self-exams.
          </p>
        </div>

        {/* Next Exam Card */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="p-6 rounded-2xl gradient-card border border-border/50 shadow-soft">
            {profile?.last_period_end ? (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Exam</p>
                    <p className="font-display text-xl font-semibold text-foreground">
                      {nextExamDate ? format(nextExamDate, "MMMM d, yyyy") : "Set up your cycle"}
                    </p>
                  </div>
                </div>
                {daysUntilExam !== null && (
                  <div className="p-4 rounded-xl bg-secondary/50">
                    {daysUntilExam <= 0 ? (
                      <p className="text-accent font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        It's time for your self-exam!
                      </p>
                    ) : daysUntilExam <= 3 ? (
                      <p className="text-warning font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {daysUntilExam} day{daysUntilExam !== 1 ? "s" : ""} until your next exam
                      </p>
                    ) : (
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {daysUntilExam} days until your next exam
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-2">Set up your cycle</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your cycle information to get personalized reminders
                </p>
                <Button variant="outline" onClick={() => navigate("/settings")}>
                  Go to Settings
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Start Check Button */}
        <div className="mb-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={() => navigate("/check")}
          >
            <Play className="w-5 h-5" />
            Start Self-Exam
          </Button>
        </div>

        {/* Last Exam Card */}
        {lastRecord && (
          <div className="mb-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <div className="p-6 rounded-2xl gradient-card border border-border/50 shadow-soft">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Completed</p>
                  <p className="font-display text-lg font-semibold text-foreground">
                    {format(new Date(lastRecord.timestamp), "MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: "400ms" }}>
          <button
            onClick={() => navigate("/history")}
            className="p-6 rounded-2xl gradient-card border border-border/50 shadow-soft hover:shadow-glow transition-all text-left group"
          >
            <History className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">View History</p>
            <p className="text-sm text-muted-foreground">See past exams</p>
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="p-6 rounded-2xl gradient-card border border-border/50 shadow-soft hover:shadow-glow transition-all text-left group"
          >
            <Settings className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <p className="font-medium text-foreground">Settings</p>
            <p className="text-sm text-muted-foreground">Manage reminders</p>
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
