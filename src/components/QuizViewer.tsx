import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, HelpCircle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizViewerProps {
  questions: QuizQuestion[];
  onComplete?: (score: number) => void;
}

export const QuizViewer = ({ questions, onComplete }: QuizViewerProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Safety checks for empty questions
  if (!questions || questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Quiz Available</h3>
            <p>This quiz hasn't been set up yet. Please contact your instructor.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      completeQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const completeQuiz = () => {
    setIsCompleted(true);
    setShowResults(true);
    
    const correctAnswers = questions.filter(
      question => selectedAnswers[question.id] === question.correctAnswer
    ).length;
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    onComplete?.(score);
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setIsCompleted(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  if (showResults) {
    const correctAnswers = questions.filter(
      question => selectedAnswers[question.id] === question.correctAnswer
    ).length;
    const score = Math.round((correctAnswers / questions.length) * 100);

    return (
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="text-3xl font-bold">🎉 Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 p-8">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-4 ${getScoreColor(score)} drop-shadow-lg`}>
              {score}%
            </div>
            <p className="text-lg text-muted-foreground">
              You answered {correctAnswers} out of {questions.length} questions correctly
            </p>
            {score >= 80 && (
              <p className="text-success font-medium mt-2">🌟 Excellent work!</p>
            )}
            {score >= 60 && score < 80 && (
              <p className="text-amber-600 font-medium mt-2">👍 Good job!</p>
            )}
            {score < 60 && (
              <p className="text-destructive font-medium mt-2">📚 Keep studying!</p>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Answers</h3>
            {questions.map((question, index) => {
              const userAnswer = selectedAnswers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <div key={question.id} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{question.question}</p>
                      <p className="text-sm text-muted-foreground">
                        Your answer: {question.options[userAnswer]} {!isCorrect && '❌'}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-success">
                          Correct answer: {question.options[question.correctAnswer]} ✓
                        </p>
                      )}
                      {question.explanation && (
                        <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                          {question.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={resetQuiz} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">
            Question {currentQuestionIndex + 1} of {questions.length}
          </CardTitle>
          <div className="text-right">
            <span className="text-sm text-muted-foreground block">Progress</span>
            <span className="text-lg font-semibold text-primary">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
        <Progress value={progress} className="w-full h-2 mt-3" />
      </CardHeader>
      
      <CardContent className="space-y-8 p-8">
        <div>
          <h3 className="text-xl font-semibold mb-6 text-foreground leading-relaxed">
            {currentQuestion.question}
          </h3>
          
          <RadioGroup
            value={selectedAnswers[currentQuestion.id]?.toString()}
            onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            className="space-y-4"
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 border-2 rounded-xl hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 cursor-pointer group">
                <RadioGroupItem 
                  value={index.toString()} 
                  id={`option-${index}`} 
                  className="w-5 h-5"
                />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="flex-1 cursor-pointer text-base leading-relaxed group-hover:text-primary transition-colors"
                >
                  <span className="font-medium mr-2 text-primary">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2"
          >
            <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Answer to continue</span>
          </div>
          
          <Button
            onClick={handleNext}
            disabled={selectedAnswers[currentQuestion.id] === undefined}
            className="bg-gradient-primary px-6 py-2 shadow-lg hover:shadow-xl transition-shadow"
          >
            {currentQuestionIndex === questions.length - 1 ? 'Complete Quiz' : 'Next Question'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};