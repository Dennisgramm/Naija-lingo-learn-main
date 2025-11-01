import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { CourseCard } from "@/components/CourseCard";
import { LanguageFilter } from "@/components/LanguageFilter";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Import course images
import yorubaCourse from "@/assets/yoruba-course.jpg";
import igboCourse from "@/assets/igbo-course.jpg";
import hausaCourse from "@/assets/hausa-course.jpg";
import efikCourse from "@/assets/efik-course.jpg";
import pidginCourse from "@/assets/pidgin-course.jpg";

// Mock course data
const mockCourses = [
  {
    id: 1,
    title: "Complete Yoruba for Beginners",
    instructor: "Adebayo Olumide",
    language: "Yoruba",
    level: "Beginner",
    duration: "8 weeks",
    students: 2547,
    rating: 4.9,
    price: "₦15,000",
    image: yorubaCourse,
    description: "Learn Yoruba from scratch with native speakers. Master greetings, daily conversations, and cultural context.",
  },
  {
    id: 2,
    title: "Business Igbo Essentials",
    instructor: "Chioma Okafor",
    language: "Igbo",
    level: "Intermediate",
    duration: "6 weeks",
    students: 1832,
    rating: 4.8,
    price: "₦18,000",
    image: igboCourse,
    description: "Professional Igbo for business settings. Learn formal communication and cultural business practices.",
  },
  {
    id: 3,
    title: "Hausa Conversation Mastery",
    instructor: "Musa Abdullahi",
    language: "Hausa",
    level: "Intermediate",
    duration: "10 weeks",
    students: 1456,
    rating: 4.7,
    price: "Free",
    image: hausaCourse,
    description: "Advanced conversational Hausa for fluent communication in Northern Nigeria and beyond.",
  },
];

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    fetchRealCourses();
    
    // Handle scroll to courses section if coming from other pages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('scrollTo') === 'courses') {
      setTimeout(() => {
        const coursesSection = document.getElementById('courses');
        if (coursesSection) {
          coursesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [courses, searchQuery, selectedLanguage, selectedLevel, sortBy]);

  const getImageForLanguage = (language: string) => {
    switch (language.toLowerCase()) {
      case 'yoruba': return yorubaCourse;
      case 'igbo': return igboCourse;
      case 'hausa': return hausaCourse;
      case 'efik': return efikCourse;
      case 'pidgin english': return pidginCourse;
      default: return yorubaCourse;
    }
  };

  const fetchRealCourses = async () => {
    try {
      // First get courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesData && coursesData.length > 0) {
        // Then get teacher profiles separately to avoid RLS issues
        const teacherIds = coursesData.map(course => course.teacher_id);
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', teacherIds);

        // Create a map of teacher profiles
        const profilesMap = new Map();
        profilesData?.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });

        // Map database courses to match existing interface
        const mappedCourses = coursesData.map(course => ({
          id: course.id,
          title: course.title,
          instructor: profilesMap.get(course.teacher_id)?.full_name || 'Unknown Instructor',
          language: course.language,
          level: course.level,
          duration: `${course.duration_weeks} weeks`,
          students: 0, // We'll update this with actual enrollment count later
          rating: 4.8, // Default rating for now
          price: course.price === 0 ? "Free" : `₦${course.price.toLocaleString()}`,
          image: getImageForLanguage(course.language),
          description: course.description,
          isPublished: course.is_published,
        }));
        setCourses(mappedCourses);
      } else {
        // If no courses at all, show mock courses as examples
        setCourses(mockCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Fallback to mock courses on error
      setCourses(mockCourses);
    }
    
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...courses];

    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.language.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedLanguage && selectedLanguage !== 'all') {
      filtered = filtered.filter(course =>
        course.language.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    if (selectedLevel && selectedLevel !== 'all') {
      filtered = filtered.filter(course =>
        course.level.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.students - a.students);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        // Already sorted by creation date from API
        break;
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = a.price === 'Free' ? 0 : parseFloat(a.price.replace(/[₦,]/g, ''));
          const priceB = b.price === 'Free' ? 0 : parseFloat(b.price.replace(/[₦,]/g, ''));
          return priceA - priceB;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = a.price === 'Free' ? 0 : parseFloat(a.price.replace(/[₦,]/g, ''));
          const priceB = b.price === 'Free' ? 0 : parseFloat(b.price.replace(/[₦,]/g, ''));
          return priceB - priceA;
        });
        break;
      default:
        break;
    }

    setFilteredCourses(filtered);
  };

  const featuredStats = [
    { icon: Users, label: "Active Students", value: "15,000+", color: "text-blue-600" },
    { icon: BookOpen, label: "Courses Available", value: "50+", color: "text-green-600" },
    { icon: Star, label: "Average Rating", value: "4.8/5", color: "text-yellow-600" },
    { icon: TrendingUp, label: "Success Rate", value: "94%", color: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose NaijaLearn?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the most comprehensive Nigerian language learning platform
              built by native speakers for authentic cultural immersion.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredStats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-card rounded-xl shadow-medium hover:shadow-large transition-shadow">
                <div className={`w-12 h-12 ${stat.color} bg-muted rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Explore Nigerian Languages
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the rich linguistic diversity of Nigeria through our carefully crafted courses.
            </p>
          </div>

          <LanguageFilter 
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
          />
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Featured Courses
              </h2>
              <p className="text-lg text-muted-foreground">
                Start your language journey with our most popular courses
              </p>
            </div>
            
            <div className="mt-6 lg:mt-0">
              <SearchAndFilter
                onSearch={setSearchQuery}
                onSort={setSortBy}
                onFilter={({ language, level }) => {
                  if (language) setSelectedLanguage(language);
                  if (level) setSelectedLevel(level);
                }}
                searchQuery={searchQuery}
                sortBy={sortBy}
                filters={{
                  language: selectedLanguage,
                  level: selectedLevel
                }}
              />
            </div>
          </div>

          <div className="space-y-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-xl h-64 mb-4"></div>
                    <div className="bg-muted rounded h-6 mb-2"></div>
                    <div className="bg-muted rounded h-4 w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search criteria or browse all courses.
                </p>
                <Button onClick={() => {
                  setSearchQuery("");
                  setSelectedLanguage("");
                  setSelectedLevel("");
                }} variant="outline">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <div 
                    key={course.id} 
                    className="animate-fade-in cursor-pointer"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    <CourseCard {...course} />
                  </div>
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
                Load More Courses
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern-overlay opacity-10"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Language Journey?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of students preserving and learning Nigerian languages. 
            Start with a free course today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shadow-large"
              onClick={() => window.location.href = user ? '/dashboard' : '/auth'}
            >
              {user ? 'Go to Dashboard' : 'Browse Free Courses'}
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-primary"
              onClick={() => window.location.href = '/auth'}
            >
              Become a Teacher
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">NaijaLearn</span>
              </div>
              <p className="text-white/70">
                Preserving Nigerian languages through accessible, high-quality education.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Languages</h3>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Yoruba</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Igbo</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hausa</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pidgin English</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-white/70">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Teaching Guide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-12 pt-8 text-center text-white/70">
            <p>&copy; 2024 NaijaLearn. Proudly preserving Nigerian heritage through language education.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;