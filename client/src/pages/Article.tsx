import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useEffect, useState } from "react";
import AdPlacement from "@/components/ads/AdPlacement";
import AdContentRenderer from "@/components/ads/AdContentRenderer";
import Sidebar from "@/components/layout/Sidebar";
import RelatedArticles from "@/components/articles/RelatedArticles";
import { Article, Category, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function ArticlePage() {
  const [_, params] = useRoute("/article/:slug");
  const slug = params?.slug;
  const [showFullContent, setShowFullContent] = useState(false);
  
  // Fetch article
  const { data: article, isLoading: loadingArticle } = useQuery<Article>({
    queryKey: [`/api/articles/${slug}`],
    enabled: !!slug,
  });
  
  // Fetch article categories for reference
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Fetch article author
  const { data: author } = useQuery<User>({
    queryKey: [`/api/users/${article?.authorId}`],
    enabled: !!article?.authorId,
  });
  
  // Find category for the article
  const category = article?.categoryId && categories 
    ? categories.find(c => c.id === article.categoryId) 
    : null;
  
  // Format the article's publish date
  const formattedDate = article?.publishDate 
    ? format(new Date(article.publishDate), 'MMMM dd, yyyy') 
    : '';
  
  // Split content for "Continue Reading" feature
  const contentParts = article?.content ? splitContentIntoPages(article.content) : ['', ''];
  
  // Handle sharing the article
  const handleShare = async () => {
    if (article) {
      try {
        await apiRequest('POST', `/api/articles/${article.id}/share`, {});
        // Show share dialog
        if (navigator.share) {
          await navigator.share({
            title: article.title,
            text: article.excerpt,
            url: window.location.href,
          });
        } else {
          // Fallback for browsers that don't support the Web Share API
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
        }
      } catch (error) {
        console.error('Error sharing article:', error);
      }
    }
  };
  
  // Helper function to split content for pagination
  function splitContentIntoPages(content: string): string[] {
    const midPoint = Math.floor(content.length / 2);
    const breakPoint = content.indexOf('</p>', midPoint);
    
    if (breakPoint === -1 || content.length < 1000) {
      return [content, ''];
    }
    
    return [
      content.substring(0, breakPoint + 4),
      content.substring(breakPoint + 4)
    ];
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Main Content Area */}
        <div className="md:w-2/3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            {loadingArticle ? (
              <div className="p-4 md:p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded-md mb-3 w-1/4"></div>
                <div className="h-8 bg-gray-200 rounded-md mb-4 w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded-md mb-6 w-full"></div>
                <div className="h-64 bg-gray-200 rounded-md mb-6"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-full"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-3/4"></div>
                </div>
              </div>
            ) : article ? (
              <div className="p-4 md:p-6">
                <div className="flex items-center mb-4">
                  <Link href="/" className="text-[#0066CC] text-sm font-medium hover:underline font-['Inter']">
                    <i className="fas fa-arrow-left mr-1"></i> Back to Home
                  </Link>
                </div>
                
                {category && (
                  <span 
                    className="px-2 py-1 text-xs font-['Inter'] rounded-sm"
                    style={{
                      backgroundColor: category.bgColor,
                      color: category.color
                    }}
                  >
                    {category.name}
                  </span>
                )}
                
                <h1 className="text-2xl md:text-4xl font-['Roboto_Condensed'] font-bold mt-3 mb-4">
                  {article.title}
                </h1>
                
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-full bg-gray-300 mr-3" />
                  <div>
                    <div className="font-medium">{author?.fullName || 'Anonymous'}</div>
                    <div className="text-sm text-gray-500 font-['Inter']">
                      {category?.name && `${category.name} Editor`} • {formattedDate} • {article.readTime} min read
                    </div>
                  </div>
                  <div className="ml-auto flex space-x-3">
                    <button onClick={handleShare} className="text-gray-500 hover:text-[#0066CC]">
                      <i className="fas fa-share-alt text-lg"></i>
                    </button>
                    <a href="#" className="text-gray-500 hover:text-[#0066CC]">
                      <i className="fab fa-facebook-square text-lg"></i>
                    </a>
                    <a href="#" className="text-gray-500 hover:text-[#0066CC]">
                      <i className="fab fa-twitter-square text-lg"></i>
                    </a>
                  </div>
                </div>
                
                {/* Featured Image */}
                <div className="mb-6">
                  {article.featuredImage && (
                    <>
                      <img 
                        src={article.featuredImage} 
                        alt={article.title}
                        className="w-full h-auto rounded-lg"
                      />
                      <p className="text-sm text-gray-500 mt-2 italic">
                        {category?.name} - {article.title}
                      </p>
                    </>
                  )}
                </div>
                
                {/* Article Content with Ads */}
                <div className="article-content text-gray-800 leading-relaxed">
                  {/* First section of content */}
                  {contentParts[0] && (
                    <AdContentRenderer content={contentParts[0]} />
                  )}
                  
                  {/* Show "Continue Reading" button if there's more content */}
                  {contentParts[1] && !showFullContent && (
                    <div className="flex justify-center my-8">
                      <button 
                        onClick={() => setShowFullContent(true)}
                        className="px-6 py-3 bg-[#0066CC] text-white text-lg font-medium rounded-full hover:bg-[#0066CC]/90 transition font-['Inter'] shadow-md"
                      >
                        Continue Reading <i className="fas fa-arrow-right ml-2"></i>
                      </button>
                    </div>
                  )}
                  
                  {/* Show the rest of the content if "Continue Reading" was clicked */}
                  {showFullContent && contentParts[1] && (
                    <>
                      {/* Second section of content */}
                      <AdContentRenderer content={contentParts[1]} />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-gray-500">Article not found</p>
              </div>
            )}
            
            {/* Related Articles Section */}
            {article && (
              <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50">
                <RelatedArticles articleId={article.id} />
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="md:w-1/3 space-y-8 mt-8 md:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
