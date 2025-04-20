import React from 'react';
import AdPlacement from './AdPlacement';

interface AdContentRendererProps {
  content: string;
}

/**
 * AdContentRenderer processes HTML content and inserts actual ad components 
 * where <div class="ad-break"></div> placeholders are found.
 */
export default function AdContentRenderer({ content }: AdContentRendererProps) {
  // If no content, return nothing
  if (!content) return null;
  
  // Split content at ad break points
  const contentParts = content.split('<div class="ad-break"></div>');
  
  // Create result with ads inserted
  const contentWithAds = contentParts.map((part, index) => {
    // Skip rendering an ad after the last content segment
    const isLastPart = index === contentParts.length - 1;
    
    return (
      <React.Fragment key={`content-part-${index}`}>
        {/* Render the content segment */}
        <div dangerouslySetInnerHTML={{ __html: part }} />
        
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