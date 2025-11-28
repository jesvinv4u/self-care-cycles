import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Calendar, Bell, CheckCircle, ArrowRight } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Calendar,
      title: "Cycle-Aware Scheduling",
      description: "Reminders automatically sync with your menstrual cycle for optimal exam timing.",
    },
    {
      icon: CheckCircle,
      title: "Guided Checklist",
      description: "Step-by-step checklist covering all 9 essential examination points.",
    },
    {
      icon: Bell,
      title: "Smart Reminders",
      description: "Email notifications with snooze options so you never miss an exam.",
    },
    {
      icon: Shield,
      title: "Private & Secure",
      description: "Your health data is encrypted and never shared with third parties.",
    },
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-foreground">BSE Tracker</span>
          </div>
          <Button variant="hero" onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center animate-fade-in">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Your Health, Your Priority
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Take Control of Your
              <span className="block text-primary">Breast Health</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A gentle, guided companion for regular breast self-examinations. 
              Track your exams, receive timely reminders, and maintain your health records—all in one secure place.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" onClick={() => navigate("/auth")}>
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="xl" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                Learn More
              </Button>
            </div>
          </div>

          {/* Hero Image/Illustration Area */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10 rounded-3xl" />
            <div className="aspect-video rounded-3xl gradient-card shadow-soft overflow-hidden flex items-center justify-center">
              <div className="text-center p-12">
                <div className="w-24 h-24 mx-auto rounded-full gradient-primary flex items-center justify-center mb-6 animate-float">
                  <Heart className="w-12 h-12 text-primary-foreground" />
                </div>
                <p className="text-muted-foreground text-lg">
                  Join thousands of women taking charge of their health
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Designed with care to make breast self-examination a comfortable, consistent habit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-8 rounded-2xl gradient-card border border-border/50 hover:shadow-soft transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center p-12 rounded-3xl gradient-primary shadow-glow">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/90 text-lg mb-8 max-w-xl mx-auto">
              Create your free account and take the first step towards better breast health awareness.
            </p>
            <Button
              variant="secondary"
              size="xl"
              className="bg-background text-foreground hover:bg-background/90"
              onClick={() => navigate("/auth")}
            >
              Create Free Account
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <span className="font-display font-medium text-foreground">BSE Tracker</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} BSE Tracker. Your health data is private and secure.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
