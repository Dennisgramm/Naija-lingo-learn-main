import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Github, Twitter, Linkedin, Mail, Heart, Code2, Users, Globe } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">About NaijaLearn</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Preserving Nigerian languages through accessible, high-quality education and connecting cultures worldwide.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12 shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <Heart className="w-6 h-6 text-red-500" />
              <span>Our Mission</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-lg text-muted-foreground space-y-4">
            <p>
              NaijaLearn was built with a passion for preserving and promoting the rich linguistic heritage of Nigeria. 
              Our platform makes it easy for people worldwide to learn Yoruba, Igbo, Hausa, and other Nigerian languages 
              from native speakers and certified instructors.
            </p>
            <p>
              We believe that language is more than communication—it's culture, identity, and connection. Through our 
              interactive courses and community-driven approach, we're building bridges between generations and cultures.
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="text-center shadow-medium">
            <CardContent className="pt-6">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Native Instructors</h3>
              <p className="text-muted-foreground">Learn from certified native speakers who understand the cultural nuances of each language.</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-medium">
            <CardContent className="pt-6">
              <Globe className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Cultural Context</h3>
              <p className="text-muted-foreground">Go beyond vocabulary with courses that include cultural history, traditions, and modern usage.</p>
            </CardContent>
          </Card>

          <Card className="text-center shadow-medium">
            <CardContent className="pt-6">
              <Code2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Modern Technology</h3>
              <p className="text-muted-foreground">Interactive lessons, quizzes, and multimedia content make learning engaging and effective.</p>
            </CardContent>
          </Card>
        </div>

        {/* Developer Section */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Meet the Developer</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-muted-foreground mb-8">
                Hi! I'm passionate about technology and cultural preservation. NaijaLearn represents my commitment 
                to making Nigerian languages accessible to learners worldwide through modern technology.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="group hover:bg-gray-900 hover:text-white transition-colors"
                  onClick={() => window.open('https://github.com/dennisgramm', '_blank')}
                >
                  <Github className="w-5 h-5 mr-2 group-hover:text-white" />
                  GitHub
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="group hover:bg-blue-600 hover:text-white transition-colors"
                  onClick={() => window.open('https://twitter.com/madaraonfent', '_blank')}
                >
                  <Twitter className="w-5 h-5 mr-2 group-hover:text-white" />
                  Twitter
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="group hover:bg-blue-700 hover:text-white transition-colors"
                  onClick={() => window.open('https://linkedin.com/in/yourusername', '_blank')}
                >
                  <Linkedin className="w-5 h-5 mr-2 group-hover:text-white" />
                  LinkedIn
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="group hover:bg-red-600 hover:text-white transition-colors"
                  onClick={() => window.open('mailto:hello@naijlearn.com', '_blank')}
                >
                  <Mail className="w-5 h-5 mr-2 group-hover:text-white" />
                  Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">Join Our Community</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Whether you want to learn or teach, you're welcome in our growing community of language enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-gradient-primary"
              onClick={() => window.location.href = '/auth'}
            >
              Start Learning Today
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => window.location.href = '/#courses'}
            >
              Explore Courses
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;