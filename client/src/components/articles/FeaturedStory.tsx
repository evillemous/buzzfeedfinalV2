import { Link } from 'wouter';
import { Article, Category } from '@shared/schema';
import { format } from 'date-fns';

interface FeaturedStoryProps {
  article: Article;
  category: Category | null;
}

export default function FeaturedStory({ article, category }: FeaturedStoryProps) {
  // Format the date
  const formattedDate = article.publishDate 
    ? format(new Date(article.publishDate), 'MMMM dd, yyyy')
    : '';
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition duration-200 hover:shadow-lg">
      <div className="relative">
        <img 
          src={article.featuredImage || 'https://via.placeholder.com/1000x500'} 
          alt={article.title}
          onError={(e) => {
            // If image fails to load, use a fallback
            e.currentTarget.onerror = null; // Prevent infinite loops
            e.currentTarget.src = 'https://via.placeholder.com/1000x500?text=Featured+Image+Unavailable';
          }}
          className="w-full h-64 md:h-80 object-cover"
        />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4">
          {category && (
            <span 
              className="px-2 py-1 text-xs font-['Inter'] rounded-sm text-white"
              style={{ backgroundColor: category.color || '#0066CC' }}
            >
              {category.name}
            </span>
          )}
          <h3 className="text-white text-xl md:text-2xl font-['Roboto_Condensed'] font-bold mt-2">
            {article.title}
          </h3>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center text-xs text-gray-500 mb-3 font-['Inter']">
          <span>By {article.authorId ? `Author ${article.authorId}` : 'Anonymous'}</span>
          <span className="mx-2">•</span>
          <span>{formattedDate}</span>
          <span className="mx-2">•</span>
          <span>{article.readTime} min read</span>
        </div>
        <p className="text-gray-700 mb-4">{article.excerpt}</p>
        <Link 
          href={`/article/${article.slug}`} 
          className="inline-block px-4 py-2 bg-[#0066CC] text-white text-sm font-medium rounded-full hover:bg-[#0066CC]/90 transition font-['Inter']"
        >
          Continue Reading
        </Link>
      </div>
    </div>
  );
}
