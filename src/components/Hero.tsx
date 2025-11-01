import { Button } from "@/components/ui/button";
import { Play, Users, BookOpen, Award } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-pattern-overlay opacity-10"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-in">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Learn Nigeria's
            <span className="block bg-gradient-secondary bg-clip-text text-transparent">
              Beautiful Languages
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect with your heritage through authentic courses in Yoruba, Igbo, Hausa, and Pidgin English. 
            Learn from native speakers and preserve our cultural identity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 transition-all shadow-large text-lg px-8 py-4 h-auto"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Learning Free
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-primary transition-all text-lg px-8 py-4 h-auto"
            >
              Browse Courses
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="animate-slide-up">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">50K+</div>
              <div className="text-white/80 text-sm">Students</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">200+</div>
              <div className="text-white/80 text-sm">Courses</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-center mb-2">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">4</div>
              <div className="text-white/80 text-sm">Languages</div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <div className="text-2xl md:text-3xl font-bold">100+</div>
              <div className="text-white/80 text-sm">Teachers</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-secondary/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
    </section>
  );
};