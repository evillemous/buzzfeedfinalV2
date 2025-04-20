import { Link } from 'wouter';
import { Article, Category } from '@shared/schema';
import { format } from 'date-fns';

interface ArticleCardProps {
  article: Article;
  category: Category | null;
}

export default function ArticleCard({ article, category }: ArticleCardProps) {
  // Format the date
  const formattedDate = article.publishDate 
    ? format(new Date(article.publishDate), 'MMMM dd, yyyy')
    : '';
  
  return (
    <div className="article-card bg-white rounded-lg shadow-md overflow-hidden transition duration-200 hover:translate-y-[-3px] hover:shadow-lg">
      <Link href={`/article/${article.slug}`}>
        <img 
          src={article.featuredImage || 'https://via.placeholder.com/600x400'} 
          alt={article.title} 
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
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
          <h3 className="font-['Roboto_Condensed'] font-bold text-lg mt-2 mb-2">
            {article.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {article.excerpt}
          </p>
          <div className="flex items-center text-xs text-gray-500 font-['Inter']">
            <span>By {article.authorId ? `Author ${article.authorId}` : 'Anonymous'}</span>
            <span className="mx-2">•</span>
            <span>{formattedDate}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
