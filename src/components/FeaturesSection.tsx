import { Headphones, Globe, Users } from "lucide-react";

const features = [
  {
    icon: Headphones,
    number: "1",
    title: "learn at your own pace",
    description: "Learn on your terms, but never alone. Enjoy lifetime access to your course with the 12 month access to the Flux Community",
    image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=400&h=300&fit=crop",
  },
  {
    icon: Globe,
    number: "2",
    title: "build your network",
    description: "Join a growing community, get peer insights, and discover exciting business opportunities and collaborations.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop",
  },
  {
    icon: Headphones,
    number: "3",
    title: "get expert support",
    description: "Our team of coaches and experts is always a message away for answers and feedback.",
    image: "https://images.unsplash.com/photo-1531545514256-b1400bc00f31?w=400&h=300&fit=crop",
  },
];

const FeaturesSection = () => {
  return (
    <section id="about" className="py-20 bg-navy-dark/50">
      <div className="container mx-auto px-4">
        <h2 className="section-title text-center text-foreground mb-4">
          WHAT OUR PARENTS SAY
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          {features.map((feature, index) => (
            <div key={index} className="feature-card group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-3 lowercase">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground text-sm mb-4">
                {feature.description}
              </p>
              
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-foreground font-bold">
                  {feature.number}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
