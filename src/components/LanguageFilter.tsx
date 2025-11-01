import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LanguageFilterProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const languages = [
  { name: "All Languages", value: "all", color: "bg-muted" },
  { name: "Yoruba", value: "yoruba", color: "bg-primary" },
  { name: "Igbo", value: "igbo", color: "bg-accent" },
  { name: "Hausa", value: "hausa", color: "bg-secondary" },
  { name: "Pidgin English", value: "pidgin", color: "bg-gold" }
];

export const LanguageFilter = ({ selectedLanguage, onLanguageChange }: LanguageFilterProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-soft border border-border/50">
      <h3 className="text-lg font-semibold mb-4 text-foreground">Filter by Language</h3>
      <div className="space-y-2">
        {languages.map((language) => (
          <Button
            key={language.value}
            variant={selectedLanguage === language.value ? "default" : "ghost"}
            className={`w-full justify-start ${
              selectedLanguage === language.value 
                ? "bg-gradient-primary text-white" 
                : "hover:bg-muted"
            }`}
            onClick={() => onLanguageChange(language.value)}
          >
            <div className={`w-3 h-3 rounded-full mr-3 ${
              selectedLanguage === language.value ? "bg-white/80" : language.color
            }`} />
            {language.name}
            {selectedLanguage === language.value && (
              <Badge className="ml-auto bg-white/20 text-white">
                Active
              </Badge>
            )}
          </Button>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gradient-secondary/10 rounded-lg">
        <h4 className="font-medium text-foreground mb-2">Why Learn Nigerian Languages?</h4>
        <p className="text-sm text-muted-foreground">
          Connect with your roots, preserve cultural heritage, and communicate with millions of speakers worldwide.
        </p>
      </div>
    </div>
  );
};