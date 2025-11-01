import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Clock, Users, Star } from "lucide-react";

interface CourseCardProps {
  title: string;
  instructor: string;
  language: string;
  level: string;
  duration: string;
  students: number;
  rating: number;
  price: string;
  image: string;
  description: string;
  isPublished?: boolean;
}

export const CourseCard = ({ 
  title, 
  instructor, 
  language, 
  level, 
  duration, 
  students, 
  rating, 
  price, 
  image, 
  description,
  isPublished = true
}: CourseCardProps) => {
  return (
    <Card className="group hover:shadow-large transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
          <div className="absolute top-4 left-4 flex gap-2">
            <Badge className="bg-primary text-primary-foreground">
              {language}
            </Badge>
            {!isPublished && (
              <Badge variant="destructive" className="bg-orange-500">
                Draft
              </Badge>
            )}
          </div>
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="bg-white/90 text-primary">
              {level}
            </Badge>
          </div>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button size="sm" className="bg-white/90 text-primary hover:bg-white shadow-medium">
              <Play className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          
          <p className="text-muted-foreground text-sm line-clamp-2">
            {description}
          </p>

          <div className="text-sm text-muted-foreground">
            by <span className="font-medium text-foreground">{instructor}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{students.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 fill-secondary text-secondary" />
              <span>{rating}</span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6 pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="text-2xl font-bold text-primary">
            {price === "Free" ? (
              <span className="text-success">Free</span>
            ) : (
              price
            )}
          </div>
          <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-medium">
            Enroll Now
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};