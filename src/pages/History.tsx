import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Heart,
  ArrowLeft,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
} from "lucide-react";
import { format } from "date-fns";

interface ChecklistItem {
  id: string;
  item_key: string;
  assessed_by: string;
  result: string;
  note: string | null;
}

interface BseRecord {
  id: string;
  timestamp: string;
  notes: string | null;
  checklist_items?: ChecklistItem[];
}

const ITEM_LABELS: Record<string, string> = {
  lump_or_mass: "New Lump or Mass",
  thickening_swelling: "Thickening or Swelling",
  size_shape_change: "Size/Shape Change",
  skin_dimpling: "Skin Dimpling/Puckering",
  redness_rash: "Redness or Rash",
  nipple_inversion: "Nipple Inversion",
  nipple_discharge: "Nipple Discharge",
  persistent_pain: "Persistent Pain",
  vein_changes: "Vein Changes",
};

const History = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<BseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from("bse_records")
        .select(`
          id,
          timestamp,
          notes,
          checklist_items (
            id,
            item_key,
            assessed_by,
            result,
            note
          )
        `)
        .eq("user_id", user!.id)
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getRecordSummary = (record: BseRecord) => {
    const items = record.checklist_items || [];
    const normal = items.filter((i) => i.result === "normal").length;
    const abnormal = items.filter((i) => i.result === "abnormal").length;
    return { normal, abnormal, total: items.length };
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
            <span className="font-display font-semibold text-foreground">History</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Exam History
          </h1>
          <p className="text-muted-foreground">
            View your past breast self-examinations
          </p>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold text-foreground mb-2">
              No exams yet
            </h2>
            <p className="text-muted-foreground mb-6">
              Complete your first self-exam to start tracking your history
            </p>
            <Button variant="hero" onClick={() => navigate("/check")}>
              Start First Exam
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record, index) => {
              const summary = getRecordSummary(record);
              const isExpanded = expandedId === record.id;

              return (
                <div
                  key={record.id}
                  className="rounded-2xl gradient-card border border-border/50 shadow-soft overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Record Header */}
                  <button
                    onClick={() => toggleExpand(record.id)}
                    className="w-full p-5 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-display font-semibold text-foreground">
                          {format(new Date(record.timestamp), "MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.timestamp), "h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {summary.abnormal > 0 ? (
                          <span className="flex items-center gap-1 text-sm text-destructive">
                            <AlertTriangle className="w-4 h-4" />
                            {summary.abnormal} abnormal
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm text-success">
                            <CheckCircle className="w-4 h-4" />
                            All normal
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-border/50">
                      <div className="pt-4 space-y-3">
                        {record.checklist_items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start justify-between p-3 rounded-xl bg-secondary/30"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                {ITEM_LABELS[item.item_key] || item.item_key}
                              </p>
                              {item.note && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {item.note}
                                </p>
                              )}
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                item.result === "normal"
                                  ? "bg-success/10 text-success"
                                  : item.result === "abnormal"
                                  ? "bg-destructive/10 text-destructive"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {item.result === "not_assessed" ? "Skipped" : item.result}
                            </span>
                          </div>
                        ))}
                        {record.notes && (
                          <div className="p-3 rounded-xl bg-secondary/30">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Notes: </span>
                              {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
