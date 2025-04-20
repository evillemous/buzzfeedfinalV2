import { useQuery } from "@tanstack/react-query";
import { Link } from 'wouter';
import { Article } from '@shared/schema';

interface RelatedArticlesProps {
  articleId: number;
}

export default function RelatedArticles({ articleId }: RelatedArticlesProps) {
  const { data: relatedArticles, isLoading } = useQuery<Article[]>({
    queryKey: [`/api/articles/${articleId}/related`],
    enabled: !!articleId,
  });
  
  return (
    <>
      <h3 className="text-xl font-['Roboto_Condensed'] font-bold mb-4">You Might Also Like</h3>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="w-full h-32 bg-gray-200"></div>
              <div className="p-3">
                <div className="h-4 bg-gray-200 rounded-md mb-2 w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded-md w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : relatedArticles && relatedArticles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {relatedArticles.map(article => (
            <Link 
              key={article.id} 
              href={`/article/${article.slug}`}
              className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col h-full hover:shadow-md transition duration-200"
            >
              <img 
                src={article.featuredImage || 'https://via.placeholder.com/500x320'} 
                alt={article.title}
                className="w-full h-32 object-cover"
              />
              <div className="p-3 flex-grow">
                <h4 className="font-['Roboto_Condensed'] font-bold text-sm">{article.title}</h4>
                <div className="text-xs text-gray-500 mt-2 font-['Inter']">
                  {article.views} views
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-gray-500">No related articles found</p>
        </div>
      )}
    </>
  );
}
