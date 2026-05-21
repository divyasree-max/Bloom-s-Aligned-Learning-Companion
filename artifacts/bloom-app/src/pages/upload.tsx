import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useUploadPdf, useAnalyzeContent } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, File, X, Loader2 } from "lucide-react";

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const uploadMutation = useUploadPdf();
  const analyzeMutation = useAnalyzeContent();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PDF document.",
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadAndAnalyze = () => {
    if (!file) return;

    uploadMutation.mutate({ data: { file, language } }, {
      onSuccess: (document) => {
        toast({
          title: "File uploaded successfully",
          description: "Starting deep cognitive analysis...",
        });
        
        analyzeMutation.mutate({ data: { documentId: document.id, language } }, {
          onSuccess: () => {
            toast({
              title: "Analysis complete",
              description: "Your study materials are ready.",
            });
            setLocation(`/results/${document.id}`);
          },
          onError: (error: any) => {
            toast({
              variant: "destructive",
              title: "Analysis failed",
              description: error?.data?.error || "There was a problem analyzing your document.",
            });
          }
        });
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: error?.data?.error || "Could not upload the file.",
        });
      }
    });
  };

  const isProcessing = uploadMutation.isPending || analyzeMutation.isPending;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">Upload Study Material</h1>
        <p className="text-muted-foreground text-lg">
          Upload a PDF and we'll generate comprehensive study tools based on Bloom's Taxonomy.
        </p>
      </div>

      <Card className="border-2 shadow-md rounded-2xl overflow-hidden">
        <CardContent className="p-8">
          {!file ? (
            <div 
              className={`border-3 border-dashed rounded-xl p-12 text-center transition-colors flex flex-col items-center justify-center min-h-[300px] cursor-pointer
                ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-accent/30'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileSelect}
              />
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold mb-2">Click or drag PDF here</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Upload your lecture notes, textbook chapters, or research papers.
              </p>
              <Button variant="outline" className="rounded-full">Select File</Button>
            </div>
          ) : (
            <div className="flex flex-col min-h-[300px] justify-center space-y-8">
              <div className="flex items-center justify-between p-6 bg-accent rounded-xl border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                    <File className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">{file.name}</h3>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {!isProcessing && (
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Output Language</Label>
                  <Select value={language} onValueChange={setLanguage} disabled={isProcessing}>
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish (Español)</SelectItem>
                      <SelectItem value="fr">French (Français)</SelectItem>
                      <SelectItem value="ar">Arabic (العربية)</SelectItem>
                      <SelectItem value="zh">Chinese (中文)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select the language you want your study materials generated in.
                  </p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="w-full h-14 text-lg rounded-xl"
                onClick={handleUploadAndAnalyze}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {uploadMutation.isPending ? "Uploading..." : "Analyzing Content (This takes a minute)..."}
                  </>
                ) : (
                  "Generate Study Materials"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
