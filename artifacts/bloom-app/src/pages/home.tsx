import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Layers, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 md:py-32 max-w-4xl mx-auto">
        <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary mb-8 font-medium">
          <BookOpen className="mr-2 h-4 w-4" />
          Master your subjects, don't just memorize them.
        </div>
        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 leading-tight">
          Learn deeper with <br className="hidden md:inline" />
          <span className="text-primary">Bloom's Taxonomy</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          Upload any document and instantly generate study materials perfectly aligned with your cognitive journey—from basic recall to complex creation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button asChild size="lg" className="h-14 px-8 text-lg rounded-full">
            <Link href="/register">Start Learning</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-accent/50 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We process your study material through the six levels of cognitive learning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Layers className="h-8 w-8 text-primary" />}
              title="1. Upload Material"
              description="Upload your PDFs, lecture notes, or textbook chapters in multiple languages."
            />
            <FeatureCard 
              icon={<Brain className="h-8 w-8 text-primary" />}
              title="2. AI Analysis"
              description="Our engine extracts key concepts and maps them across the cognitive domain."
            />
            <FeatureCard 
              icon={<CheckCircle2 className="h-8 w-8 text-primary" />}
              title="3. Deep Learning"
              description="Test yourself with targeted quizzes, flip flashcards, and step-by-step hints."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-5 inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
