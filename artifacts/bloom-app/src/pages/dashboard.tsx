import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { format } from "date-fns";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Brain, HelpCircle, Layers, ArrowRight, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const BLOOM_COLORS: Record<string, string> = {
  remember: "hsl(var(--bloom-remember))",
  understand: "hsl(var(--bloom-understand))",
  apply: "hsl(var(--bloom-apply))",
  analyze: "hsl(var(--bloom-analyze))",
  evaluate: "hsl(var(--bloom-evaluate))",
  create: "hsl(var(--bloom-create))",
};

export default function Dashboard() {
  const { data: stats, isLoading } = useGetStats({
    query: {
      queryKey: getGetStatsQueryKey()
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-foreground">Your Learning Space</h1>
          <p className="text-muted-foreground mt-1">Track your progress and dive into your materials.</p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <UploadCloud className="w-4 h-4 mr-2" />
            Upload New Material
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Analyzed Documents" 
          value={stats.analyzedDocuments} 
          icon={<FileText className="h-5 w-5 text-primary" />} 
        />
        <StatCard 
          title="Flashcards Generated" 
          value={stats.totalFlashcards} 
          icon={<Layers className="h-5 w-5 text-secondary" />} 
        />
        <StatCard 
          title="Quiz Questions" 
          value={stats.totalQuestions} 
          icon={<HelpCircle className="h-5 w-5 text-bloom-apply" />} 
        />
        <StatCard 
          title="Cognitive Nodes" 
          value={stats.bloomLevelDistribution.reduce((acc, curr) => acc + curr.count, 0)} 
          icon={<Brain className="h-5 w-5 text-bloom-evaluate" />} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Bloom Level Distribution</CardTitle>
            <CardDescription>Concepts mapped across the six levels of cognitive learning.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {stats.bloomLevelDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.bloomLevelDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="level" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--accent))' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                    formatter={(value) => [`${value} concepts`, "Count"]}
                    labelFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.bloomLevelDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BLOOM_COLORS[entry.level] || 'hsl(var(--primary))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-xl">
                No data available. Upload a document to see your cognitive distribution.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Recent Documents</CardTitle>
            <CardDescription>Your recently analyzed study materials.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            {stats.recentDocuments.length > 0 ? (
              <div className="space-y-4">
                {stats.recentDocuments.map((doc) => (
                  <Link 
                    key={doc.id} 
                    href={`/results/${doc.id}`}
                    className="block p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-foreground truncate pr-4" title={doc.originalName}>
                        {doc.originalName}
                      </div>
                      <Badge variant={doc.status === 'analyzed' ? 'default' : 'secondary'} className="capitalize shrink-0">
                        {doc.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(doc.createdAt), 'MMM d, yyyy')}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-border rounded-xl">
                <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground mb-4">You haven't uploaded any documents yet.</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/upload">Upload PDF</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}
