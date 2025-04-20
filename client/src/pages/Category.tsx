import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import ArticleCard from "@/components/articles/ArticleCard";
import AdPlacement from "@/components/ads/AdPlacement";
import Sidebar from "@/components/layout/Sidebar";
import { Article, Category } from "@shared/schema";

export default function CategoryPage() {
  const [_, params] = useRoute("/category/:slug");
  const slug = params?.slug;
  
  // Fetch category
  const { data: category, isLoading: loadingCategory } = useQuery<Category>({
    queryKey: [`/api/categories/${slug}`],
    enabled: !!slug,
  });
  
  // Fetch articles for this category
  const { data: articles, isLoading: loadingArticles } = useQuery<Article[]>({
    queryKey: [`/api/categories/${slug}/articles?limit=10`],
    enabled: !!slug,
  });
  
  // Fetch all categories for reference
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Main Content Area */}
        <div className="md:w-2/3">
          {/* Category Header */}
          <div className="mb-8">
            {loadingCategory ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded-md mb-2 w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded-md w-2/3"></div>
              </div>
            ) : category ? (
              <>
                <h1 
                  className="text-2xl md:text-3xl font-['Roboto_Condensed'] font-bold mb-2"
                  style={{ color: category.color }}
                >
                  {category.name}
                </h1>
                <p className="text-gray-600">{category.description}</p>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500">Category not found</p>
              </div>
            )}
          </div>
          
          {/* Horizontal Ad Placement */}
          <AdPlacement 
            type="banner"
            className="w-full h-32 mb-8"
            label="Category page banner ad"
          />
          
          {/* Articles Grid */}
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-['Roboto_Condensed'] font-bold mb-4">
              Latest {category?.name || ''} Articles
            </h2>
            
            {loadingArticles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded-md mb-2 w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded-md mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : articles && articles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {articles.map(article => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    category={category}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <p className="text-gray-500">No articles found in this category</p>
              </div>
            )}
          </div>
          
          {/* In-content Ad */}
          <AdPlacement 
            type="in-content"
            className="w-full h-32 mb-8"
            label="In-content responsive ad unit"
          />
        </div>
        
        {/* Sidebar */}
        <div className="md:w-1/3 space-y-8 mt-8 md:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
