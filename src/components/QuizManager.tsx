import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, X, HelpCircle, Award, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  passing_score: number;
  time_limit_minutes?: number;
}

interface QuizManagerProps {
  lessonId: string;
  onQuizCreated?: () => void;
}

export const QuizManager = ({ lessonId, onQuizCreated }: QuizManagerProps) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimit, setTimeLimit] = useState<number | undefined>();
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (lessonId) {
      fetchQuizzes();
    }
  }, [lessonId]);

  const fetchQuizzes = async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
    } else {
      setQuizzes((data || []).map(quiz => ({
        ...quiz,
        questions: Array.isArray(quiz.questions) 
          ? (quiz.questions as unknown as Question[])
          : []
      })));
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPassingScore(70);
    setTimeLimit(undefined);
    setQuestions([]);
    setEditingQuiz(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (quiz: Quiz) => {
    setTitle(quiz.title);
    setDescription(quiz.description || '');
    setPassingScore(quiz.passing_score);
    setTimeLimit(quiz.time_limit_minutes);
    setQuestions(quiz.questions);
    setEditingQuiz(quiz);
    setDialogOpen(true);
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: crypto.randomUUID(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = questions.map((q, i) => 
      i === index ? { ...q, [field]: value } : q
    );
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = questions.map((q, i) => {
      if (i === questionIndex) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Quiz title is required');
      return;
    }

    if (questions.length === 0) {
      toast.error('At least one question is required');
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is empty`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        toast.error(`Question ${i + 1} has empty options`);
        return;
      }
    }

    const quizData = {
      title: title.trim(),
      description: description.trim() || null,
      questions: questions as any,
      passing_score: passingScore,
      time_limit_minutes: timeLimit || null,
      lesson_id: lessonId
    };

    try {
      let result;
      if (editingQuiz) {
        result = await supabase
          .from('quizzes')
          .update(quizData)
          .eq('id', editingQuiz.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('quizzes')
          .insert(quizData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      toast.success(editingQuiz ? 'Quiz updated successfully!' : 'Quiz created successfully!');
      setDialogOpen(false);
      resetForm();
      fetchQuizzes();
      onQuizCreated?.();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Failed to save quiz');
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);

    if (error) {
      toast.error('Failed to delete quiz');
    } else {
      toast.success('Quiz deleted successfully');
      fetchQuizzes();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading quizzes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-muted-foreground">Quiz Management</h4>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="quiz-title">Quiz Title *</Label>
                  <Input
                    id="quiz-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Basic Greetings Quiz"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="quiz-description">Description</Label>
                  <Textarea
                    id="quiz-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of the quiz..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="passing-score">Passing Score (%)</Label>
                  <Input
                    id="passing-score"
                    type="number"
                    min="0"
                    max="100"
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value))}
                  />
                </div>

                <div>
                  <Label htmlFor="time-limit">Time Limit (minutes)</Label>
                  <Input
                    id="time-limit"
                    type="number"
                    min="1"
                    value={timeLimit || ''}
                    onChange={(e) => setTimeLimit(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium">Questions</h4>
                  <Button type="button" onClick={addQuestion} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>

                {questions.map((question, questionIndex) => (
                  <Card key={question.id} className="p-4 border-2 border-muted">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <Label className="text-base font-medium">Question {questionIndex + 1}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(questionIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <Textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                        placeholder="Enter your question..."
                        rows={2}
                        className="text-base"
                      />

                      <div className="space-y-3">
                        <Label>Answer Options (select the correct one)</Label>
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-3 p-2 border rounded-lg">
                            <input
                              type="radio"
                              name={`question-${questionIndex}-correct`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => updateQuestion(questionIndex, 'correctAnswer', optionIndex)}
                              className="w-4 h-4"
                            />
                            <Label className="text-sm font-medium text-muted-foreground min-w-0">
                              {String.fromCharCode(65 + optionIndex)}.
                            </Label>
                            <Input
                              value={option}
                              onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                              className="flex-1"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label>Explanation (optional)</Label>
                        <Textarea
                          value={question.explanation || ''}
                          onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                          placeholder="Explain why this is the correct answer..."
                          rows={2}
                        />
                      </div>
                    </div>
                  </Card>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted rounded-lg">
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No questions added yet</p>
                    <p className="text-sm">Click "Add Question" to get started</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-6 border-t">
                <Button 
                  type="submit"
                  className="bg-gradient-primary"
                  disabled={questions.length === 0 || !title.trim()}
                >
                  {editingQuiz ? 'Update Quiz' : 'Create Quiz'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {quizzes.length > 0 ? (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      <h5 className="font-medium text-sm">{quiz.title}</h5>
                    </div>
                    {quiz.description && (
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{quiz.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="bg-muted px-2 py-1 rounded">{quiz.questions?.length || 0} questions</span>
                      <span className="bg-muted px-2 py-1 rounded">Pass: {quiz.passing_score}%</span>
                      {quiz.time_limit_minutes && (
                        <span className="bg-muted px-2 py-1 rounded">{quiz.time_limit_minutes} min limit</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(quiz)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteQuiz(quiz.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No quizzes yet</p>
          <p className="text-xs">Create a quiz to test student knowledge</p>
        </div>
      )}
    </div>
  );
};