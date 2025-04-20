import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import FeaturedStory from "@/components/articles/FeaturedStory";
import ArticleCard from "@/components/articles/ArticleCard";
import AdPlacement from "@/components/ads/AdPlacement";
import Sidebar from "@/components/layout/Sidebar";
import { Article, Category } from "@shared/schema";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  
  // Fetch featured article
  const { data: featuredArticle, isLoading: loadingFeatured } = useQuery<Article[]>({
    queryKey: ['/api/articles/featured'],
  });
  
  // Fetch trending articles
  const { data: trendingArticles, isLoading: loadingTrending } = useQuery<Article[]>({
    queryKey: ['/api/articles?limit=4'],
  });
  
  // Fetch categories for reference
  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Set up keyboard shortcut sequence for admin access
  useEffect(() => {
    // For tracking sequence of keys pressed
    const keySequence: string[] = [];
    const targetSequence = ['a', 'd', 'm', 'i', 'n'];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get the key pressed (case insensitive)
      const key = e.key.toLowerCase();
      
      // If it's one of the modifier keys (Alt/Option or Meta/Command), ignore
      if (key === 'alt' || key === 'meta' || key === 'shift' || key === 'control') {
        return;
      }
      
      // Only process when Alt/Option is pressed (metaKey for Command on Mac)
      if (e.altKey) {
        // Add the current key to our sequence
        keySequence.push(key);
        
        // Check if the sequence matches so far
        let isValid = true;
        for (let i = 0; i < keySequence.length; i++) {
          if (keySequence[i] !== targetSequence[i]) {
            isValid = false;
            break;
          }
        }
        
        // If invalid sequence, reset
        if (!isValid) {
          keySequence.length = 0;
          return;
        }
        
        // If we've completed the sequence successfully
        if (keySequence.length === targetSequence.length) {
          e.preventDefault();
          setLocation('/login');
          keySequence.length = 0;
        }
      } else {
        // Reset sequence if Alt/Option is not held down
        keySequence.length = 0;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setLocation]);
  
  // Find category for an article
  const findCategory = (categoryId: number | undefined) => {
    if (!categories || !categoryId) return null;
    return categories.find(cat => cat.id === categoryId);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Desktop: Two-column layout */}
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* Left Column (Content) */}
        <div className="md:w-2/3">
          {/* Featured Story */}
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-['Roboto_Condensed'] font-bold mb-4">Featured Story</h2>
            {loadingFeatured ? (
              <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-64 bg-gray-200 rounded-md mb-4"></div>
                <div className="h-8 bg-gray-200 rounded-md mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded-md mb-1 w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded-md w-full mb-4"></div>
                <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
              </div>
            ) : featuredArticle && featuredArticle.length > 0 ? (
              <FeaturedStory 
                article={featuredArticle[0]} 
                category={findCategory(featuredArticle[0].categoryId)}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-500">No featured articles available</p>
              </div>
            )}
          </div>
          
          {/* Horizontal Ad Placement */}
          <AdPlacement 
            type="banner"
            className="w-full h-32 mb-8"
            label="High-visibility banner ad placement (728×90)"
          />
          
          {/* Trending Articles */}
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-['Roboto_Condensed'] font-bold mb-4">Trending Now</h2>
            
            {loadingTrending ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-md mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded-md mb-2 w-1/4"></div>
                    <div className="h-6 bg-gray-200 rounded-md mb-3 w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded-md w-1/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {trendingArticles && trendingArticles.map(article => (
                  <ArticleCard 
                    key={article.id} 
                    article={article} 
                    category={findCategory(article.categoryId)}
                  />
                ))}
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
        
        {/* Right Column (Sidebar) */}
        <div className="md:w-1/3 space-y-8 mt-8 md:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}
