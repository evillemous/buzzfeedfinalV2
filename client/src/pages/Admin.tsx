import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Category, Article } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  
  // Batch generation states
  const [batchCount, setBatchCount] = useState("10");
  const [listiclePercentage, setListiclePercentage] = useState("40");
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchResults, setBatchResults] = useState<{success: boolean; count: number; message: string} | null>(null);
  
  // Content management states
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  
  // Listicle states
  const [listicleNumItems, setListicleNumItems] = useState("10");
  
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
  
  // Fetch articles for content management
  const { 
    data: articles, 
    isLoading: articlesLoading,
    refetch: refetchArticles 
  } = useQuery<Article[]>({
    queryKey: ['/api/articles'],
    refetchOnWindowFocus: false,
  });
  
  // Delete article mutation
  const deleteArticleMutation = useMutation({
    mutationFn: async (articleId: number) => {
      return apiRequest(`/api/articles/${articleId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      // Refresh article list after deletion
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({
        title: "Article Deleted",
        description: "The article has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Failed to delete the article. Please try again.",
      });
    }
  });
  
  // Update article mutation
  const updateArticleMutation = useMutation({
    mutationFn: async (article: Partial<Article> & { id: number }) => {
      return apiRequest(`/api/articles/${article.id}`, {
        method: 'PATCH',
        body: JSON.stringify(article),
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      setEditingArticle(null);
      // Refresh article list after update
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      toast({
        title: "Article Updated",
        description: "The article has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to update the article. Please try again.",
      });
    }
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
  
  // Generate listicle content mutation
  const generateListicleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{
        title: string;
        content: string;
        excerpt: string;
      }>('/api/ai/generate-listicle', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          numItems: parseInt(listicleNumItems),
          targetLength: parseInt(targetLength),
        }),
      });
    },
    onSuccess: (data) => {
      setPreviewTitle(data.title);
      setPreviewContent(data.content);
      setPreviewExcerpt(data.excerpt);
      
      toast({
        title: "Listicle Generated",
        description: `Your "${data.title}" listicle has been generated successfully.`,
      });
      
      setActiveTab("preview");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate listicle content. Please try again.",
      });
    }
  });
  
  // Create listicle mutation
  const createListicleMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{ article: any, message: string }>('/api/ai/create-listicle', {
        method: 'POST',
        body: JSON.stringify({
          topic,
          categoryId: parseInt(categoryId),
          numItems: parseInt(listicleNumItems),
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
      setListicleNumItems("10");
      setPreviewTitle("");
      setPreviewContent("");
      setPreviewExcerpt("");
      setPreviewImage("");
      
      // Invalidate articles cache to refresh lists
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      
      toast({
        title: "Listicle Published",
        description: "Your listicle has been created and published successfully.",
      });
      
      setActiveTab("generate");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Publication Failed",
        description: "Failed to publish the listicle. Please try again.",
      });
    }
  });
  
  // Batch generate content mutation
  const batchGenerateMutation = useMutation({
    mutationFn: async () => {
      setBatchGenerating(true);
      return apiRequest<{
        success: boolean;
        count: number;
        message: string;
      }>('/api/ai/batch-generate', {
        method: 'POST',
        body: JSON.stringify({
          count: parseInt(batchCount),
          listiclePercentage: parseInt(listiclePercentage),
        }),
      });
    },
    onSuccess: (data) => {
      setBatchResults(data);
      setBatchGenerating(false);
      
      // Invalidate articles cache to refresh lists
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      
      toast({
        title: "Batch Generation Complete",
        description: data.message,
      });
    },
    onError: () => {
      setBatchGenerating(false);
      toast({
        variant: "destructive",
        title: "Batch Generation Failed",
        description: "Failed to generate batch content. Please try again.",
      });
    }
  });
  
  const handleGenerateListicle = (e: React.FormEvent) => {
    e.preventDefault();
    generateListicleMutation.mutate();
  };
  
  const handleCreateListicle = () => {
    createListicleMutation.mutate();
  };
  
  const handleBatchGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    batchGenerateMutation.mutate();
  };

  const handleCreateArticle = () => {
    createArticleMutation.mutate();
  };
  
  // Handle article editing
  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    setIsEditing(true);
  };
  
  // Handle article delete confirmation
  const handleDeleteArticle = (articleId: number) => {
    deleteArticleMutation.mutate(articleId);
  };
  
  // Handle article update submission
  const handleUpdateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingArticle) {
      updateArticleMutation.mutate(editingArticle);
    }
  };
  
  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingArticle(null);
  };
  
  // Filter articles by search term and content type
  const filteredArticles = articles?.filter(article => {
    // First apply search term filter
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Then apply content type filter
    const matchesContentType = 
      contentTypeFilter === "all" || 
      article.contentType === contentTypeFilter;
    
    return matchesSearch && matchesContentType;
  });
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="text-gray-500 mb-8">
        Create and manage content for your yourbuzzfeed website. Generate high-converting, viral articles with AI.
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="generate">Article</TabsTrigger>
          <TabsTrigger value="listicle">Listicle</TabsTrigger>
          <TabsTrigger value="batch">Batch Generate</TabsTrigger>
          <TabsTrigger value="ideas">Ideas</TabsTrigger>
          <TabsTrigger value="manage">Manage Content</TabsTrigger>
          <TabsTrigger value="preview" disabled={!previewContent}>
            Preview
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
        
        {/* Listicle Tab */}
        <TabsContent value="listicle">
          <Card>
            <CardHeader>
              <CardTitle>AI Listicle Generator</CardTitle>
              <CardDescription>
                Create engaging, high-converting listicles that drive clicks and pageviews.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateListicle} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listicleTopic">List Topic</Label>
                  <Input
                    id="listicleTopic"
                    placeholder="E.g., Best Productivity Apps of 2025"
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
                  <Label htmlFor="listicleNumItems">
                    Number of Items (5-20)
                  </Label>
                  <Input
                    id="listicleNumItems"
                    type="number"
                    placeholder="10"
                    min="5"
                    max="20"
                    value={listicleNumItems}
                    onChange={(e) => setListicleNumItems(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Listicles with 10+ items perform better for ad revenue.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="targetLength">
                    Total Word Count (600-2000)
                  </Label>
                  <Input
                    id="targetLength"
                    type="number"
                    placeholder="1000"
                    min="600"
                    max="2000"
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
                onClick={handleGenerateListicle}
                disabled={!topic || !categoryId || generateListicleMutation.isPending}
              >
                {generateListicleMutation.isPending ? "Generating..." : "Generate Listicle"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Content Management Tab */}
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                Manage, edit, and delete your existing content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing && editingArticle ? (
                // Edit Article Form
                <form onSubmit={handleUpdateArticle} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editingArticle.title}
                      onChange={(e) => setEditingArticle({...editingArticle, title: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-excerpt">Excerpt</Label>
                    <Textarea
                      id="edit-excerpt"
                      value={editingArticle.excerpt}
                      onChange={(e) => setEditingArticle({...editingArticle, excerpt: e.target.value})}
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select
                      value={editingArticle.categoryId?.toString() || ""}
                      onValueChange={(value) => setEditingArticle({...editingArticle, categoryId: parseInt(value)})}
                      required
                    >
                      <SelectTrigger id="edit-category">
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
                    <Label htmlFor="edit-featured-image">Featured Image URL</Label>
                    <Input
                      id="edit-featured-image"
                      value={editingArticle.featuredImage || ""}
                      onChange={(e) => setEditingArticle({...editingArticle, featuredImage: e.target.value})}
                    />
                    {editingArticle.featuredImage && (
                      <div className="mt-2">
                        <img 
                          src={editingArticle.featuredImage} 
                          alt="Featured" 
                          className="h-24 object-cover rounded-md"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-content">Content</Label>
                    <Textarea
                      id="edit-content"
                      value={editingArticle.content}
                      onChange={(e) => setEditingArticle({...editingArticle, content: e.target.value})}
                      rows={10}
                      required
                    />
                  </div>
                  
                  <div className="flex space-x-2 justify-end pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={updateArticleMutation.isPending}
                    >
                      {updateArticleMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                // Article List
                <>
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <Label htmlFor="search">Search Articles</Label>
                      <Input
                        id="search"
                        placeholder="Search by title or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="w-full md:w-48">
                      <Label htmlFor="content-type-filter">Content Type</Label>
                      <Select
                        value={contentTypeFilter}
                        onValueChange={setContentTypeFilter}
                      >
                        <SelectTrigger id="content-type-filter" className="mt-1">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="article">Articles</SelectItem>
                          <SelectItem value="listicle">Listicles</SelectItem>
                          <SelectItem value="news">News</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {articlesLoading ? (
                    <div className="py-8 flex justify-center">
                      <p>Loading articles...</p>
                    </div>
                  ) : filteredArticles && filteredArticles.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="hidden md:table-cell">Type</TableHead>
                            <TableHead className="hidden md:table-cell">Views</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredArticles.map((article) => {
                            const category = categories?.find(c => c.id === article.categoryId);
                            
                            return (
                              <TableRow key={article.id}>
                                <TableCell className="font-medium">
                                  <div className="truncate max-w-[200px]">{article.title}</div>
                                  <div className="text-xs text-gray-500 truncate max-w-[200px]">{article.excerpt}</div>
                                </TableCell>
                                <TableCell>{category?.name || "Uncategorized"}</TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <Badge variant={
                                    article.contentType === 'listicle' ? "secondary" : 
                                    article.contentType === 'news' ? "default" : 
                                    "outline"
                                  }>
                                    {article.contentType || 'article'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">{article.views || 0}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleEditArticle(article)}
                                    >
                                      Edit
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="destructive" 
                                          size="sm"
                                        >
                                          Delete
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This will permanently delete "{article.title}". This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction 
                                            onClick={() => handleDeleteArticle(article.id)}
                                            className="bg-red-500 hover:bg-red-600"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p>No articles found. Try a different search term or create new content.</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Batch Generate Tab */}
        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch Content Generator</CardTitle>
              <CardDescription>
                Quickly generate multiple pieces of content across different categories to populate your site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBatchGenerate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batchCount">
                    Number of Articles (1-50)
                  </Label>
                  <Input
                    id="batchCount"
                    type="number"
                    placeholder="10"
                    min="1"
                    max="50"
                    value={batchCount}
                    onChange={(e) => setBatchCount(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    How many articles to generate in this batch. Default is 10.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="listiclePercentage">
                    Listicle Percentage (0-100)
                  </Label>
                  <Input
                    id="listiclePercentage"
                    type="number"
                    placeholder="40"
                    min="0"
                    max="100"
                    value={listiclePercentage}
                    onChange={(e) => setListiclePercentage(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    What percentage of generated content should be listicles vs regular articles. Default is 40%.
                  </p>
                </div>
                
                <div className="border rounded-md p-4 mt-6">
                  <h3 className="font-medium mb-2">Important Notes:</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Batch generation can take several minutes depending on the number of articles.</li>
                    <li>• Articles will be generated across random categories. If a category doesn't exist, it will be created.</li>
                    <li>• All articles will be published immediately with random images.</li>
                    <li>• The system will generate interesting, clickable titles to maximize engagement.</li>
                  </ul>
                </div>
                
                {batchResults && (
                  <div className={`p-4 rounded-md mt-4 ${batchResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className={`font-medium ${batchResults.success ? 'text-green-800' : 'text-red-800'}`}>
                      {batchResults.success ? 'Generation Complete' : 'Generation Failed'}
                    </h3>
                    <p className="mt-1 text-sm">
                      {batchResults.message}
                    </p>
                  </div>
                )}
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleBatchGenerate}
                disabled={batchGenerating}
                className="w-full"
              >
                {batchGenerating ? 
                  "Generating Content (This may take a few minutes)..." : 
                  `Generate ${batchCount} Articles/Listicles`
                }
              </Button>
            </CardFooter>
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
                        Publish Content
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
                          onClick={activeTab === "listicle" ? handleCreateListicle : handleCreateArticle}
                          disabled={createArticleMutation.isPending || createListicleMutation.isPending}
                        >
                          {createArticleMutation.isPending || createListicleMutation.isPending ? 
                            "Publishing..." : 
                            "Publish Now"}
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