/**
 * Unsplash API service for fetching images
 */

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
  };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

/**
 * Search for images on Unsplash
 * 
 * @param query Search term
 * @param page Page number (default: 1)
 * @param perPage Number of results per page (default: 10)
 * @returns Array of image results
 */
export async function searchUnsplashImages(
  query: string, 
  page: number = 1, 
  perPage: number = 10
): Promise<UnsplashPhoto[]> {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
    
    if (!accessKey) {
      throw new Error('Unsplash API key is not configured');
    }
    
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as UnsplashSearchResponse;
    return data.results;
  } catch (error) {
    console.error('Error searching Unsplash images:', error);
    throw new Error('Failed to search for images');
  }
}

/**
 * Get a random image from Unsplash based on a query
 * 
 * @param query Search term
 * @returns Random image URL
 */
export async function getRandomImage(query: string): Promise<UnsplashPhoto | null> {
  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
    
    if (!accessKey) {
      throw new Error('Unsplash API key is not configured');
    }
    
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json() as UnsplashPhoto;
  } catch (error) {
    console.error('Error getting random Unsplash image:', error);
    return null;
  }
}