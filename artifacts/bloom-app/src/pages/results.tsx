import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetDocument, getGetDocumentQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, Brain, HelpCircle, Layers, Lightbulb, CheckCircle2, XCircle } from "lucide-react";

export default function Results() {
  const params = useParams();
  const documentId = parseInt(params.id || "0", 10);
  
  const { data: documentWithAnalysis, isLoading } = useGetDocument(documentId, {
    query: {
      enabled: !!documentId,
      queryKey: getGetDocumentQueryKey(documentId)
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl space-y-8">
        <Skeleton className="h-8 w-24 mb-4" />
        <Skeleton className="h-12 w-3/4 mb-8" />
        <Skeleton className="h-12 w-full rounded-lg mb-6" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!documentWithAnalysis || !documentWithAnalysis.analysis) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Analysis not found</h2>
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const { document, analysis } = documentWithAnalysis;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-6xl">
      <Button asChild variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
        <Link href="/dashboard">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="mb-10">
        <Badge variant="outline" className="mb-4 text-primary border-primary/20 bg-primary/5">
          {document.language?.toUpperCase() || 'EN'} • {document.pageCount} pages
        </Badge>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground break-words">
          {document.originalName}
        </h1>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="w-full flex justify-start overflow-x-auto p-1 bg-accent/50 rounded-xl mb-8 h-auto flex-wrap">
          <TabsTrigger value="summary" className="py-2.5 px-4 rounded-lg data-[state=active]:shadow-sm">
            <BookOpen className="w-4 h-4 mr-2" /> Summary
          </TabsTrigger>
          <TabsTrigger value="bloom" className="py-2.5 px-4 rounded-lg data-[state=active]:shadow-sm">
            <Brain className="w-4 h-4 mr-2" /> Bloom Levels
          </TabsTrigger>
          <TabsTrigger value="quiz" className="py-2.5 px-4 rounded-lg data-[state=active]:shadow-sm">
            <HelpCircle className="w-4 h-4 mr-2" /> Quiz
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="py-2.5 px-4 rounded-lg data-[state=active]:shadow-sm">
            <Layers className="w-4 h-4 mr-2" /> Flashcards
          </TabsTrigger>
          <TabsTrigger value="hints" className="py-2.5 px-4 rounded-lg data-[state=active]:shadow-sm">
            <Lightbulb className="w-4 h-4 mr-2" /> Hints
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="focus-visible:outline-none">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <Card className="shadow-sm border-border">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {analysis.summary}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="shadow-sm border-border bg-accent/30">
                <CardHeader>
                  <CardTitle className="font-serif text-xl">Key Concepts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keyConcepts.map((concept, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-background">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="bloom" className="focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {analysis.bloomLevels.map((level, idx) => (
              <BloomLevelCard key={idx} data={level} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="focus-visible:outline-none">
          <div className="max-w-3xl mx-auto space-y-8">
            {analysis.quiz.map((q, idx) => (
              <QuizCard key={q.id} question={q} index={idx} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="flashcards" className="focus-visible:outline-none">
          <FlashcardDeck flashcards={analysis.flashcards} />
        </TabsContent>

        <TabsContent value="hints" className="focus-visible:outline-none">
          <Card className="shadow-sm max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Study Hints & Strategies</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-6">
                {analysis.hints.map((hint, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center font-bold">
                      {i + 1}
                    </div>
                    <p className="text-lg text-foreground/90 leading-relaxed pt-1">{hint}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BloomLevelCard({ data }: { data: any }) {
  const colorVar = `var(--bloom-${data.level})`;
  
  return (
    <Card className="overflow-hidden border border-border shadow-sm flex flex-col transition-all hover:shadow-md">
      <div 
        className="h-2 w-full" 
        style={{ backgroundColor: `hsl(${colorVar})` }} 
      />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant="outline" 
            style={{ color: `hsl(${colorVar})`, borderColor: `hsl(${colorVar})` }}
            className="capitalize font-bold px-3 py-1"
          >
            {data.level}
          </Badge>
        </div>
        <CardTitle className="font-serif text-xl">{data.description}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 bg-accent/20 pt-4">
        <ul className="space-y-2">
          {data.concepts.map((concept: string, i: number) => (
            <li key={i} className="flex items-start gap-2">
              <div 
                className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                style={{ backgroundColor: `hsl(${colorVar})` }} 
              />
              <span className="text-sm font-medium">{concept}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function QuizCard({ question, index }: { question: any, index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === question.correctIndex;

  return (
    <Card className="shadow-sm border-border">
      <CardContent className="p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <h3 className="font-serif text-xl font-bold text-foreground">
            <span className="text-muted-foreground mr-2">{index + 1}.</span>
            {question.question}
          </h3>
          <Badge variant="outline" className="capitalize shrink-0 ml-4">
            {question.bloomLevel}
          </Badge>
        </div>

        <div className="space-y-3 mb-6">
          {question.options.map((opt: string, i: number) => {
            let stateClass = "border-border hover:border-primary/50 bg-card";
            
            if (submitted) {
              if (i === question.correctIndex) {
                stateClass = "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300";
              } else if (selected === i) {
                stateClass = "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300";
              }
            } else if (selected === i) {
              stateClass = "border-primary bg-primary/5 ring-1 ring-primary";
            }

            return (
              <button
                key={i}
                onClick={() => !submitted && setSelected(i)}
                disabled={submitted}
                className={`w-full text-left p-4 rounded-xl border transition-all ${stateClass} disabled:cursor-default flex items-center justify-between`}
              >
                <span>{opt}</span>
                {submitted && i === question.correctIndex && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {submitted && selected === i && i !== question.correctIndex && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            );
          })}
        </div>

        {!submitted ? (
          <Button 
            onClick={() => setSubmitted(true)} 
            disabled={selected === null}
            className="w-full sm:w-auto"
          >
            Check Answer
          </Button>
        ) : (
          <div className={`p-4 rounded-xl mt-6 ${isCorrect ? 'bg-green-50/50 dark:bg-green-950/10' : 'bg-primary/5'}`}>
            <h4 className="font-bold mb-2 flex items-center">
              {isCorrect ? <span className="text-green-600 dark:text-green-400">Correct!</span> : <span>Explanation</span>}
            </h4>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FlashcardDeck({ flashcards }: { flashcards: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcards || flashcards.length === 0) return null;

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150); // wait for flip animation to start before changing content
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? flashcards.length - 1 : prev - 1));
    }, 150);
  };

  return (
    <div className="flex flex-col items-center max-w-2xl mx-auto py-8">
      <div className="flex items-center justify-between w-full mb-6">
        <span className="text-muted-foreground font-medium">Card {currentIndex + 1} of {flashcards.length}</span>
        <Badge variant="outline" className="capitalize">{currentCard.bloomLevel}</Badge>
      </div>

      <div 
        className="relative w-full h-[400px] perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <Card className="absolute inset-0 backface-hidden border-2 shadow-md flex items-center justify-center p-8 text-center bg-card">
            <div>
              <p className="text-sm font-medium text-primary mb-6 uppercase tracking-wider">Concept</p>
              <h3 className="font-serif text-3xl font-bold text-foreground">{currentCard.front}</h3>
            </div>
            <p className="absolute bottom-6 text-sm text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity">
              Click to flip
            </p>
          </Card>
          
          {/* Back */}
          <Card className="absolute inset-0 backface-hidden rotate-y-180 border-2 shadow-md flex items-center justify-center p-8 text-center bg-accent/20">
            <div>
              <p className="text-sm font-medium text-secondary-foreground mb-6 uppercase tracking-wider">Definition</p>
              <p className="text-xl text-foreground leading-relaxed">{currentCard.back}</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-8">
        <Button variant="outline" size="lg" onClick={handlePrev} className="w-24">Prev</Button>
        <Button size="lg" onClick={handleNext} className="w-24">Next</Button>
      </div>
    </div>
  );
}
