import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState } from "react";
import AdPlacement from "@/components/ads/AdPlacement";
import { Article, Tag } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Sidebar() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  
  // Fetch popular articles
  const { data: popularArticles, isLoading: loadingPopular } = useQuery<Article[]>({
    queryKey: ['/api/articles/popular?limit=5'],
  });
  
  // Fetch trending tags
  const { data: tags, isLoading: loadingTags } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Subscription successful",
      description: "Thank you for subscribing to our newsletter!",
    });
    setEmail("");
  };
  
  return (
    <>
      {/* Sticky Sidebar Ad */}
      <AdPlacement 
        type="sidebar"
        className="w-full h-64 rounded-lg sticky top-24"
        label="Sticky sidebar ad (300×600)"
      />
      
      {/* Newsletter Signup */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-5">
        <h3 className="text-lg font-['Roboto_Condensed'] font-bold mb-3">Get Trending Stories First</h3>
        <p className="text-gray-600 text-sm mb-4">Sign up for our free daily newsletter and never miss the hottest stories.</p>
        
        <form className="space-y-3" onSubmit={handleSubscribe}>
          <div>
            <input 
              type="email" 
              placeholder="Your email address" 
              className="w-full px-4 py-2 rounded-lg border border-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#0066CC] font-['Inter']"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full px-4 py-2 bg-[#FF4500] text-white font-medium rounded-lg hover:bg-[#FF4500]/90 transition font-['Inter']"
          >
            Subscribe Now
          </button>
          <p className="text-xs text-gray-500 text-center">We respect your privacy. Unsubscribe at any time.</p>
        </form>
      </div>
      
      {/* Trending Topics */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-5">
        <h3 className="text-lg font-['Roboto_Condensed'] font-bold mb-3">Trending Topics</h3>
        
        {loadingTags ? (
          <div className="flex flex-wrap gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-3 py-1 bg-gray-200 rounded-full animate-pulse w-20 h-6"></div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags?.map(tag => (
              <Link 
                key={tag.id} 
                href={`/tag/${tag.slug}`} 
                className="px-3 py-1 bg-[#EFEFEF] rounded-full text-sm text-[#333333] hover:bg-[#0066CC] hover:text-white transition font-['Inter']"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Most Popular */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden p-5">
        <h3 className="text-lg font-['Roboto_Condensed'] font-bold mb-3">Most Popular</h3>
        
        {loadingPopular ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="text-2xl font-['Roboto_Condensed'] font-bold text-gray-300 w-5">{i+1}</div>
                <div className="flex-grow">
                  <div className="h-4 bg-gray-200 rounded-md mb-1 w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {popularArticles?.map((article, index) => (
              <Link 
                key={article.id} 
                href={`/article/${article.slug}`} 
                className="flex gap-3 group"
              >
                <span className="text-2xl font-['Roboto_Condensed'] font-bold text-gray-300 group-hover:text-[#0066CC] transition">
                  {index + 1}
                </span>
                <span className="flex-grow">
                  <h4 className="text-sm font-bold group-hover:text-[#0066CC] transition">{article.title}</h4>
                  <p className="text-xs text-gray-500 mt-1 font-['Inter']">{article.shares} shares</p>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Lower Sidebar Ad */}
      <AdPlacement 
        type="sidebar"
        className="w-full h-64 rounded-lg"
        label="Lower sidebar ad (300×250)"
      />
    </>
  );
}
