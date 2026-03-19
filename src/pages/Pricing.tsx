import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Music, Zap, Crown } from "lucide-react";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "$19",
    period: "/month",
    description: "Self-paced music learning with foundational modules",
    icon: Music,
    features: [
      "Access to Foundation Modules",
      "Course progress tracking",
      "Learning resources library",
      "Community access",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$49",
    period: "/month",
    description: "Full access with live lessons, AI tutor & personalized coaching",
    icon: Crown,
    features: [
      "Everything in Basic",
      "1-on-1 live lessons with teachers",
      "AI Music Tutor (24/7)",
      "Gamified learning maps",
      "Personalized lesson plans",
      "Priority booking for lessons",
    ],
    cta: "Go Premium",
    popular: true,
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Stripe checkout will be wired here later
    console.log(`Selected plan: ${planId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-semibold">Unlock Your Musical Journey</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4">
              Choose Your <span className="text-primary">Plan</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Subscribe to access the Music Learning Portal — track your progress, take lessons, and master your instrument.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative bg-card border-border transition-all hover:scale-[1.02] ${
                  plan.popular ? "border-primary ring-2 ring-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <plan.icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.popular ? "" : "variant-outline"}`}
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
