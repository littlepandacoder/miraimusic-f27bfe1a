import { Users, DollarSign, Clock, MessageCircle, Video, Star } from "lucide-react";

const SkoolCommunitySection = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "Fraction of the Cost",
      description: "Get premium piano education at a price that won't break the bank"
    },
    {
      icon: Users,
      title: "Supportive Community",
      description: "Connect with fellow learners, share progress, and stay motivated together"
    },
    {
      icon: Video,
      title: "Weekly Live Sessions",
      description: "Join live Q&A sessions and group lessons with expert instructors"
    },
    {
      icon: MessageCircle,
      title: "24/7 Support",
      description: "Get answers to your questions from our community and mentors anytime"
    },
    {
      icon: Clock,
      title: "Learn at Your Pace",
      description: "Access all resources whenever it fits your schedule"
    },
    {
      icon: Star,
      title: "Exclusive Content",
      description: "Members-only tutorials, practice sheets, and insider tips"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background via-navy/30 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-pink/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-pink/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-pink/20 text-pink rounded-full text-sm font-semibold mb-4 animate-pulse">
            💰 AFFORDABLE ALTERNATIVE
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6">
            CAN'T AFFORD <span className="text-pink">1-ON-1 LESSONS?</span>
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            We get it. Private piano lessons can cost <span className="text-pink font-bold">$50-$150 per hour</span>. 
            That's why we created something special for hobbyists, parents, and budget-conscious learners.
          </p>
        </div>

        {/* Main Card */}
        <div className="max-w-5xl mx-auto mb-12">
          <div className="bg-navy/50 backdrop-blur-sm border-2 border-pink/30 rounded-3xl p-8 md:p-12 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-pink/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-pink rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-background" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                  Join Our Skool Community
                </h3>
              </div>
              
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
                Get the <span className="text-pink font-semibold">same quality education</span> through our 
                thriving community. Perfect for self-motivated learners who want guidance without the premium price tag.
              </p>

              {/* Who it's for */}
              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="bg-background/30 rounded-xl p-6 border border-pink/20">
                  <h4 className="text-xl font-bold text-foreground mb-2">🎹 Hobbyists</h4>
                  <p className="text-muted-foreground">
                    Learning piano for fun? Get expert guidance without committing to expensive private lessons.
                  </p>
                </div>
                <div className="bg-background/30 rounded-xl p-6 border border-pink/20">
                  <h4 className="text-xl font-bold text-foreground mb-2">👨‍👩‍👧 Parents</h4>
                  <p className="text-muted-foreground">
                    Support your child's musical journey with affordable resources and a supportive community.
                  </p>
                </div>
                <div className="bg-background/30 rounded-xl p-6 border border-pink/20">
                  <h4 className="text-xl font-bold text-foreground mb-2">💪 Self-Starters</h4>
                  <p className="text-muted-foreground">
                    Disciplined learners who thrive with structure but don't need hand-holding every step.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center">
                <a 
                  href="https://www.skool.com/pianomastery90days/about?ref=76fa2e8809594da080da4f38ee98471a"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-10 py-5 bg-pink text-background font-bold text-xl rounded-full hover:bg-pink/90 hover:scale-105 transition-all duration-300 shadow-lg shadow-pink/30"
                >
                  JOIN THE COMMUNITY NOW →
                </a>
                <p className="text-muted-foreground mt-4 text-sm">
                  Join hundreds of piano learners already inside
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="bg-navy/30 rounded-xl p-6 border border-pink/10 hover:border-pink/30 transition-all duration-300 hover:transform hover:scale-105"
            >
              <benefit.icon className="w-8 h-8 text-pink mb-4" />
              <h4 className="text-lg font-bold text-foreground mb-2">{benefit.title}</h4>
              <p className="text-muted-foreground text-sm">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Stop waiting. <span className="text-pink">Start playing.</span>
          </p>
          <a 
            href="https://www.skool.com/pianomastery90days/about?ref=76fa2e8809594da080da4f38ee98471a"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-8 py-4 bg-transparent border-2 border-pink text-pink font-bold text-lg rounded-full hover:bg-pink hover:text-background transition-all duration-300"
          >
            EXPLORE SKOOL COMMUNITY
          </a>
        </div>
      </div>
    </section>
  );
};

export default SkoolCommunitySection;
