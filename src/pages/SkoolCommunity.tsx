import { Link } from "react-router-dom";
import { Users, DollarSign, Clock, MessageCircle, Video, Star, CheckCircle, ArrowLeft } from "lucide-react";

const SkoolCommunity = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "Fraction of the Cost",
      description: "Get premium piano education at a price that won't break the bank. Save thousands compared to private lessons."
    },
    {
      icon: Users,
      title: "Supportive Community",
      description: "Connect with fellow learners, share progress, celebrate wins, and stay motivated together."
    },
    {
      icon: Video,
      title: "Weekly Live Sessions",
      description: "Join live Q&A sessions and group lessons with expert instructors every week."
    },
    {
      icon: MessageCircle,
      title: "24/7 Support",
      description: "Get answers to your questions from our community and mentors anytime, day or night."
    },
    {
      icon: Clock,
      title: "Learn at Your Pace",
      description: "Access all resources whenever it fits your schedule. No pressure, no deadlines."
    },
    {
      icon: Star,
      title: "Exclusive Content",
      description: "Members-only tutorials, practice sheets, backing tracks, and insider tips."
    }
  ];

  const includes = [
    "Step-by-step video lessons for all levels",
    "Weekly live group coaching sessions",
    "Practice routines and sheet music library",
    "Direct access to ask questions anytime",
    "Monthly challenges to keep you motivated",
    "Community accountability partners",
    "Progress tracking tools",
    "Exclusive member discounts on courses"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-black text-foreground">
              Miraimusic
            </Link>
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-pink/5 to-transparent pointer-events-none" />
          <div className="absolute top-20 left-10 w-64 h-64 bg-pink/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-pink/5 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <span className="inline-block px-4 py-2 bg-pink/20 text-pink rounded-full text-sm font-semibold mb-6">
                💰 THE AFFORDABLE WAY TO LEARN PIANO
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 leading-tight">
                JOIN OUR <span className="text-pink">SKOOL</span> COMMUNITY
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Can't afford $50-$150/hour for private lessons? Get the same quality education through our thriving community at a fraction of the cost.
              </p>
              <a 
                href="https://www.skool.com/pianomastery90days/about?ref=76fa2e8809594da080da4f38ee98471a"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-12 py-5 bg-pink text-background font-bold text-xl rounded-full hover:bg-pink/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-pink/30"
              >
                JOIN NOW →
              </a>
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-20 bg-navy/20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-black text-center text-foreground mb-16">
              PERFECT FOR <span className="text-pink">YOU</span> IF...
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-pink/20 text-center">
                <div className="text-6xl mb-6">🎹</div>
                <h3 className="text-2xl font-bold text-foreground mb-4">You're a Hobbyist</h3>
                <p className="text-muted-foreground">
                  Learning piano for fun and personal enjoyment? Get expert guidance without the premium price tag of private lessons.
                </p>
              </div>
              
              <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-pink/20 text-center">
                <div className="text-6xl mb-6">👨‍👩‍👧</div>
                <h3 className="text-2xl font-bold text-foreground mb-4">You're a Parent</h3>
                <p className="text-muted-foreground">
                  Want to support your child's musical journey without breaking the bank? Our community provides affordable, quality resources.
                </p>
              </div>
              
              <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-8 border border-pink/20 text-center">
                <div className="text-6xl mb-6">💪</div>
                <h3 className="text-2xl font-bold text-foreground mb-4">You're Self-Motivated</h3>
                <p className="text-muted-foreground">
                  Disciplined learners who thrive with structure but don't need hand-holding every step of the way.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-black text-foreground mb-8">
                    WHAT'S <span className="text-pink">INCLUDED</span>
                  </h2>
                  <div className="space-y-4">
                    {includes.map((item, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-6 h-6 text-pink flex-shrink-0 mt-0.5" />
                        <span className="text-lg text-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-navy/50 backdrop-blur-sm rounded-3xl p-8 border-2 border-pink/30">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Private Lessons Cost</p>
                    <p className="text-4xl font-bold text-muted-foreground line-through mb-4">$200-$600/month</p>
                    <p className="text-pink font-semibold mb-2">Skool Community</p>
                    <p className="text-6xl font-black text-foreground mb-2">AFFORDABLE</p>
                    <p className="text-muted-foreground mb-8">Same quality, fraction of the price</p>
                    <a 
                      href="https://www.skool.com/pianomastery90days/about?ref=76fa2e8809594da080da4f38ee98471a"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block w-full px-8 py-4 bg-pink text-background font-bold text-lg rounded-full hover:bg-pink/90 transition-all duration-300"
                    >
                      SEE PRICING & JOIN
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-20 bg-navy/20">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-black text-center text-foreground mb-16">
              COMMUNITY <span className="text-pink">BENEFITS</span>
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="bg-background/50 backdrop-blur-sm rounded-xl p-8 border border-pink/10 hover:border-pink/30 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <benefit.icon className="w-12 h-12 text-pink mb-6" />
                  <h3 className="text-xl font-bold text-foreground mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">
                READY TO <span className="text-pink">START?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10">
                Join hundreds of piano learners who are mastering the piano without spending a fortune. Your musical journey starts here.
              </p>
              <a 
                href="https://www.skool.com/pianomastery90days/about?ref=76fa2e8809594da080da4f38ee98471a"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-12 py-5 bg-pink text-background font-bold text-xl rounded-full hover:bg-pink/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-pink/30 mb-6"
              >
                JOIN THE COMMUNITY NOW →
              </a>
              <p className="text-muted-foreground">
                Questions? <Link to="/" className="text-pink hover:underline">Contact us</Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Miraimusic. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SkoolCommunity;
