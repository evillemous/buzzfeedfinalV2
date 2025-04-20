import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Category } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("generate");
  
  // Form states
  const [topic, setTopic] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [targetLength, setTargetLength] = useState("800");
  const [imageKeyword, setImageKeyword] = useState("");
  
  // Generate ideas form state
  const [ideaCategory, setIdeaCategory] = useState("");
  const [ideaCount, setIdeaCount] = useState("5");
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  
  // Preview states
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [previewExcerpt, setPreviewExcerpt] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchOnWindowFocus: false,
  });
  
  // Generate content mutation
  const generateContentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{
        title: string;
        content: string;
        excerpt: string;
      }>('/api/ai/generate-content', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          targetLength: parseInt(targetLength),
        }),
      });
    },
    onSuccess: (data) => {
      setPreviewTitle(data.title);
      setPreviewContent(data.content);
      setPreviewExcerpt(data.excerpt);
      
      // Show success message
      toast({
        title: "Content Generated",
        description: "Your article content has been generated successfully.",
      });
      
      // Automatically switch to preview tab
      setActiveTab("preview");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
      });
    }
  });
  
  // Generate article ideas mutation
  const generateIdeasMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ ideas: string[] }>('/api/ai/generate-ideas', {
        method: 'POST',
        body: JSON.stringify({
          category: ideaCategory,
          count: parseInt(ideaCount),
        }),
      });
    },
    onSuccess: (data) => {
      setGeneratedIdeas(data.ideas || []);
      
      toast({
        title: "Ideas Generated",
        description: `Generated ${data.ideas.length} article ideas.`,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate article ideas. Please try again.",
      });
    }
  });
  
  // Get random image
  const getRandomImageMutation = useMutation({
    mutationFn: async () => {
      const query = imageKeyword || topic;
      return apiRequest<{ image: { urls: { regular: string } } }>(`/api/images/random?query=${encodeURIComponent(query)}`, {
        method: 'GET',
      });
    },
    onSuccess: (data) => {
      setPreviewImage(data.image.urls.regular);
      
      toast({
        title: "Image Found",
        description: "A featured image has been selected for your article.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Image Search Failed",
        description: "Failed to find an image. Please try a different keyword.",
      });
    }
  });
  
  // Create article mutation
  const createArticleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ article: any, message: string }>('/api/ai/create-article', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          categoryId: parseInt(categoryId),
          targetLength: parseInt(targetLength),
          imageKeyword: imageKeyword || topic,
        }),
      });
    },
    onSuccess: () => {
      // Reset form and previews
      setTopic("");
      setCategoryId("");
      setTargetLength("800");
      setImageKeyword("");
      setPreviewTitle("");
      setPreviewContent("");
      setPreviewExcerpt("");
      setPreviewImage("");
      
      // Invalidate articles cache to refresh lists
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      
      toast({
        title: "Article Published",
        description: "Your article has been created and published successfully.",
      });
      
      setActiveTab("generate");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Publication Failed",
        description: "Failed to publish the article. Please try again.",
      });
    }
  });
  
  const handleGenerateContent = (e: React.FormEvent) => {
    e.preventDefault();
    generateContentMutation.mutate();
  };
  
  const handleGenerateIdeas = (e: React.FormEvent) => {
    e.preventDefault();
    generateIdeasMutation.mutate();
  };
  
  const handleGetRandomImage = () => {
    getRandomImageMutation.mutate();
  };
  
  const handleUseIdea = (idea: string) => {
    setTopic(idea);
    setActiveTab("generate");
  };
  
  const handleCreateArticle = () => {
    createArticleMutation.mutate();
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">
        Create and manage content for your yourbuzzfeed website. Generate high-converting, viral articles with AI.
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="ideas">Article Ideas</TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewContent}>
            Preview & Publish
          </TabsTrigger>
        </TabsList>
        
        {/* Generate Content Tab */}
        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>AI Content Generator</CardTitle>
              <CardDescription>
                Create high-quality, SEO-optimized content using OpenAI's advanced models.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateContent} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic or Title</Label>
                  <Input
                    id="topic"
                    placeholder="E.g., 10 Ways to Boost Your Productivity"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={categoryId}
                    onValueChange={setCategoryId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetLength">
                    Word Count (300-1500)
                  </Label>
                  <Input
                    id="targetLength"
                    type="number"
                    placeholder="800"
                    min="300"
                    max="1500"
                    value={targetLength}
                    onChange={(e) => setTargetLength(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imageKeyword">
                    Image Keyword (Optional)
                  </Label>
                  <Input
                    id="imageKeyword"
                    placeholder="Leave blank to use topic"
                    value={imageKeyword}
                    onChange={(e) => setImageKeyword(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    This will be used to find a relevant featured image.
                  </p>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("ideas")}
              >
                Need Ideas?
              </Button>
              <Button 
                onClick={handleGenerateContent}
                disabled={!topic || !categoryId || generateContentMutation.isPending}
              >
                {generateContentMutation.isPending ? "Generating..." : "Generate Content"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Article Ideas Tab */}
        <TabsContent value="ideas">
          <Card>
            <CardHeader>
              <CardTitle>Article Ideas Generator</CardTitle>
              <CardDescription>
                Generate engaging article ideas based on category or trend.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateIdeas} className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="ideaCategory">Category/Trend</Label>
                  <Input
                    id="ideaCategory"
                    placeholder="E.g., Cryptocurrency, Fitness Trends, Home Decor"
                    value={ideaCategory}
                    onChange={(e) => setIdeaCategory(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ideaCount">Number of Ideas (1-10)</Label>
                  <Input
                    id="ideaCount"
                    type="number"
                    min="1"
                    max="10"
                    value={ideaCount}
                    onChange={(e) => setIdeaCount(e.target.value)}
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={!ideaCategory || generateIdeasMutation.isPending}
                  className="w-full"
                >
                  {generateIdeasMutation.isPending ? "Generating Ideas..." : "Generate Ideas"}
                </Button>
              </form>
              
              {/* Display generated ideas */}
              {generatedIdeas.length > 0 && (
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Generated Ideas:</h3>
                  <ul className="space-y-2">
                    {generatedIdeas.map((idea, index) => (
                      <li 
                        key={index}
                        className="border-b pb-2 flex justify-between items-center"
                      >
                        <span>{idea}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleUseIdea(idea)}
                        >
                          Use
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Preview & Publish Tab */}
        <TabsContent value="preview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Preview Article</CardTitle>
                <CardDescription>
                  Review and edit your article before publishing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="previewTitle">Title</Label>
                  <Input
                    id="previewTitle"
                    value={previewTitle}
                    onChange={(e) => setPreviewTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="previewExcerpt">Excerpt</Label>
                  <Textarea
                    id="previewExcerpt"
                    className="h-24"
                    value={previewExcerpt}
                    onChange={(e) => setPreviewExcerpt(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="previewContent">Content</Label>
                  <div className="border rounded-md p-4">
                    <div 
                      id="previewContent"
                      className="prose max-w-none"
                      dangerouslySetInnerHTML={{ __html: previewContent }} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Featured Image</CardTitle>
                <CardDescription>
                  Select an image for your article.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewImage ? (
                  <div className="border rounded-md overflow-hidden">
                    <img 
                      src={previewImage} 
                      alt="Featured" 
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="border rounded-md p-12 flex items-center justify-center bg-muted">
                    <p className="text-sm text-muted-foreground">No image selected</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleGetRandomImage}
                  disabled={getRandomImageMutation.isPending}
                  className="w-full"
                >
                  {getRandomImageMutation.isPending ? "Finding Image..." : "Get Random Image"}
                </Button>
                
                <div className="pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className="w-full"
                        disabled={!previewTitle || !previewContent || !categoryId}
                      >
                        Publish Article
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will publish the article to your website immediately.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCreateArticle}
                          disabled={createArticleMutation.isPending}
                        >
                          {createArticleMutation.isPending ? "Publishing..." : "Publish Now"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}