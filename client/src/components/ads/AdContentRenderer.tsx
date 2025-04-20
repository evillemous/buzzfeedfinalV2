import React, { useEffect, useRef } from 'react';
import AdPlacement from './AdPlacement';

interface AdContentRendererProps {
  content: string;
}

/**
 * AdContentRenderer processes HTML content and inserts actual ad components 
 * where <div class="ad-break"></div> placeholders are found.
 */
export default function AdContentRenderer({ content }: AdContentRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // If no content, return nothing
  if (!content) return null;
  
  // Handle image loading errors
  useEffect(() => {
    if (contentRef.current) {
      const images = contentRef.current.querySelectorAll('img');
      
      images.forEach(img => {
        // Set a default placeholder for images that fail to load
        img.onerror = () => {
          img.src = "https://via.placeholder.com/800x450?text=Image+Unavailable";
          img.alt = "Image unavailable";
          img.classList.add('image-loading-error');
        };
        
        // Add loading="lazy" attribute to all images for better performance
        img.setAttribute('loading', 'lazy');
        
        // Add a placeholder class until the image loads
        img.classList.add('image-loading');
        
        // Remove the placeholder class once the image loads
        img.onload = () => {
          img.classList.remove('image-loading');
        };
      });
    }
  }, [content]);
  
  // Split content at ad break points
  const contentParts = content.split('<div class="ad-break"></div>');
  
  // Create result with ads inserted
  const contentWithAds = contentParts.map((part, index) => {
    // Skip rendering an ad after the last content segment
    const isLastPart = index === contentParts.length - 1;
    
    // Process content to add class to listicle images
    let processedPart = part;
    if (part.includes('<h2>') && part.includes('<img')) {
      processedPart = part.replace(/<img/g, '<img class="listicle-image"');
    }
    
    return (
      <React.Fragment key={`content-part-${index}`}>
        {/* Render the content segment */}
        <div ref={index === 0 ? contentRef : null} dangerouslySetInnerHTML={{ __html: processedPart }} />
        
        {/* Insert ad after the segment (unless it's the last segment) */}
        {!isLastPart && (
          <div className="ad-insertion-point">
            <AdPlacement 
              type="in-content"
              className="w-full my-6"
              label="ADVERTISEMENT"
            />
          </div>
        )}
      </React.Fragment>
    );
  });
  
  return <>{contentWithAds}</>;
}