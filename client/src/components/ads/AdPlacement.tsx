import { useEffect, useRef } from 'react';

interface AdPlacementProps {
  type: 'banner' | 'sidebar' | 'in-content' | 'mobile-anchor';
  className?: string;
  label?: string;
}

export default function AdPlacement({ type, className = '', label = 'ADVERTISEMENT' }: AdPlacementProps) {
  const adRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // This function loads and initializes AdSense ads
    const loadAdSense = () => {
      try {
        // Check if AdSense script is loaded
        if (typeof (window as any).adsbygoogle !== 'undefined') {
          // Get appropriate ad size based on ad type
          let adSize: string;
          let adFormat: string = 'auto';
          
          switch (type) {
            case 'banner':
              adSize = 'horizontal';
              break;
            case 'sidebar':
              adSize = 'rectangle';
              break;
            case 'in-content':
              adSize = 'fluid';
              break;
            case 'mobile-anchor':
              adSize = 'horizontal';
              adFormat = 'autorelaxed';
              break;
            default:
              adSize = 'auto';
          }
          
          // Create the ins element for AdSense
          const adElement = document.createElement('ins');
          adElement.className = 'adsbygoogle';
          adElement.style.display = 'block';
          adElement.style.textAlign = 'center';
          adElement.setAttribute('data-ad-client', 'ca-pub-8333936306401310');
          adElement.setAttribute('data-ad-slot', '');  // Your specific ad slot ID would go here
          adElement.setAttribute('data-ad-format', adFormat);
          adElement.setAttribute('data-full-width-responsive', 'true');
          
          // Clear and append the ad element
          if (adRef.current) {
            adRef.current.innerHTML = '';
            adRef.current.appendChild(adElement);
            
            // Push command to AdSense to display ads
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            } catch (pushError) {
              console.error('Error pushing adsbygoogle command:', pushError);
            }
          }
        } else {
          console.log('AdSense not loaded yet. Waiting for script to load...');
          
          // Try again after a short delay
          setTimeout(loadAdSense, 1000);
        }
      } catch (error) {
        console.error('Error loading AdSense ad:', error);
      }
    };
    
    // Load AdSense ads
    loadAdSense();
    
    // Clean up on component unmount
    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = '';
      }
    };
  }, [type]);
  
  return (
    <div className={`ad-container ${className}`}>
      <div className="text-center">
        <div className="font-['Inter'] text-gray-500">{label}</div>
        <div className="text-xs mt-1">
          {type === 'banner' && 'Banner advertisement'}
          {type === 'sidebar' && 'Sidebar advertisement'}
          {type === 'in-content' && 'In-content advertisement'}
          {type === 'mobile-anchor' && 'Mobile anchor advertisement'}
        </div>
        <div ref={adRef} className="adsense-container my-2"></div>
      </div>
    </div>
  );
}
