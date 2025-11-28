import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  ArrowLeft,
  Check,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ResultType = "normal" | "abnormal" | "not_assessed";

interface ChecklistItem {
  key: string;
  label: string;
  assessedBy: string;
  description: string;
  result: ResultType;
  note: string;
}

const CHECKLIST_ITEMS: Omit<ChecklistItem, "result" | "note">[] = [
  {
    key: "lump_or_mass",
    label: "New Lump or Mass",
    assessedBy: "Touch",
    description: "Feel for any new hard lumps or masses in the breast tissue or underarm area.",
  },
  {
    key: "thickening_swelling",
    label: "Thickening or Swelling",
    assessedBy: "Touch/Sight",
    description: "Check for any areas that feel thicker than usual or show visible swelling.",
  },
  {
    key: "size_shape_change",
    label: "Size/Shape Change",
    assessedBy: "Sight",
    description: "Look for any changes in the overall size or shape of either breast.",
  },
  {
    key: "skin_dimpling",
    label: "Skin Dimpling/Puckering",
    assessedBy: "Sight",
    description: "Look for any dimpling, puckering, or indentation of the skin.",
  },
  {
    key: "redness_rash",
    label: "Redness or Rash",
    assessedBy: "Sight/Touch",
    description: "Check for any unusual redness, irritation, or rash on the breast skin.",
  },
  {
    key: "nipple_inversion",
    label: "Nipple Inversion",
    assessedBy: "Sight",
    description: "Look for any nipple that has become inverted (turned inward) when it wasn't before.",
  },
  {
    key: "nipple_discharge",
    label: "Nipple Discharge",
    assessedBy: "Sight",
    description: "Check for any unusual discharge from the nipple (not milk if breastfeeding).",
  },
  {
    key: "persistent_pain",
    label: "Persistent Pain",
    assessedBy: "Touch/Feel",
    description: "Note any persistent pain in the breast or armpit area that doesn't go away.",
  },
  {
    key: "vein_changes",
    label: "Vein Changes",
    assessedBy: "Sight",
    description: "Look for any new visible veins or changes in existing vein patterns.",
  },
];

const BseCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<ChecklistItem[]>(
    CHECKLIST_ITEMS.map((item) => ({
      ...item,
      result: "not_assessed",
      note: "",
    }))
  );
  const [generalNotes, setGeneralNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const updateItem = (index: number, result: ResultType) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, result } : item))
    );
  };

  const updateItemNote = (index: number, note: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, note } : item))
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Create BSE record
      const { data: record, error: recordError } = await supabase
        .from("bse_records")
        .insert({
          user_id: user.id,
          notes: generalNotes || null,
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Create checklist items
      const checklistItems = items.map((item) => ({
        record_id: record.id,
        item_key: item.key,
        assessed_by: item.assessedBy,
        result: item.result,
        note: item.note || null,
      }));

      const { error: itemsError } = await supabase
        .from("checklist_items")
        .insert(checklistItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Exam completed!",
        description: "Your breast self-exam has been recorded successfully.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error saving exam",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasAbnormalFindings = items.some((item) => item.result === "abnormal");
  const completedCount = items.filter((item) => item.result !== "not_assessed").length;

  if (authLoading) {
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
            <span className="font-display font-semibold text-foreground">Self-Exam</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm font-medium text-foreground">
              {completedCount} of {items.length} items
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-300"
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        {/* Instructions */}
        <div className="mb-8 p-4 rounded-xl bg-accent/10 border border-accent/20 animate-fade-in">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-accent mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-foreground mb-1">How to perform your exam</p>
              <p className="text-sm text-muted-foreground">
                Stand in front of a mirror with arms at your sides, then raised. 
                Lie down and use the pads of your fingers to feel each breast in circular motions.
              </p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-4 mb-8">
          {items.map((item, index) => (
            <div
              key={item.key}
              className="p-5 rounded-2xl gradient-card border border-border/50 shadow-soft animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{item.label}</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground">
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{item.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Assessed by: {item.assessedBy}
                  </p>
                </div>
              </div>

              {/* Result Buttons */}
              <div className="flex gap-2 mb-3">
                <Button
                  variant={item.result === "normal" ? "success" : "outline"}
                  size="sm"
                  onClick={() => updateItem(index, "normal")}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Normal
                </Button>
                <Button
                  variant={item.result === "abnormal" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => updateItem(index, "abnormal")}
                  className="flex-1"
                >
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Abnormal
                </Button>
                <Button
                  variant={item.result === "not_assessed" ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => updateItem(index, "not_assessed")}
                  className="flex-1"
                >
                  Skip
                </Button>
              </div>

              {/* Note Input */}
              {item.result === "abnormal" && (
                <Textarea
                  placeholder="Add notes about this finding..."
                  value={item.note}
                  onChange={(e) => updateItemNote(index, e.target.value)}
                  className="mt-3"
                  rows={2}
                />
              )}
            </div>
          ))}
        </div>

        {/* General Notes */}
        <div className="mb-8 animate-slide-up" style={{ animationDelay: "500ms" }}>
          <label className="block text-sm font-medium text-foreground mb-2">
            General Notes (Optional)
          </label>
          <Textarea
            placeholder="Add any additional observations or notes..."
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Warning if abnormal findings */}
        {hasAbnormalFindings && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Important Notice</p>
                <p className="text-sm text-muted-foreground">
                  You've noted some abnormal findings. Please consult a healthcare professional 
                  for a proper clinical examination. Early detection is key to good outcomes.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          variant="hero"
          size="xl"
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Complete Exam
            </>
          )}
        </Button>
      </main>
    </div>
  );
};

export default BseCheck;
