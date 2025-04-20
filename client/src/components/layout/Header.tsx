import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import MobileMenu from './MobileMenu';
import { Category } from '@shared/schema';

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality would go here
    console.log('Searching for:', searchTerm);
  };
  
  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);
  
  return (
    <header className="sticky top-0 bg-white shadow-md z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar with Logo and Search */}
        <div className="flex items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-[#0066CC] text-2xl font-['Roboto_Condensed'] font-bold">
              your<span className="text-[#FF4500]">buzzfeed</span>
            </span>
          </Link>
          
          {/* Search Bar (Hidden on Mobile) */}
          <div className="hidden md:block w-1/3">
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                placeholder="Search articles..." 
                className="w-full px-4 py-2 rounded-full border border-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#0066CC] font-['Inter']"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="absolute right-3 top-2 text-gray-400">
                <i className="fas fa-search"></i>
              </button>
            </form>
          </div>
          
          {/* Mobile Nav Toggle & User Menu */}
          <div className="flex items-center space-x-4">
            <button 
              className="md:hidden text-[#333333]"
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-search text-lg"></i>
            </button>
            <button 
              className="md:hidden text-[#333333]"
              onClick={toggleMobileMenu}
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
            <Link 
              href="/admin" 
              className="hidden md:flex items-center text-sm font-['Inter'] font-medium px-3 py-1 rounded-full bg-[#333333] text-white mr-2"
            >
              <i className="fas fa-user-shield mr-1"></i>
              Admin
            </Link>
            <Link 
              href="#" 
              className="hidden md:flex items-center text-sm font-['Inter'] font-medium px-3 py-1 rounded-full bg-[#0066CC] text-white"
            >
              <i className="fas fa-envelope mr-1"></i>
              Subscribe
            </Link>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:block border-t border-[#EFEFEF]">
          <ul className="flex overflow-x-auto py-3 space-x-6 text-sm font-['Inter'] font-medium">
            <li>
              <Link 
                href="/" 
                className={location === '/' ? "text-[#FF4500] font-semibold" : "text-[#333333] hover:text-[#0066CC]"}
              >
                Home
              </Link>
            </li>
            {categories?.map(category => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className={location === `/category/${category.slug}` 
                    ? "text-[#FF4500] hover:text-[#0066CC]" 
                    : "text-[#333333] hover:text-[#0066CC]"}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Mobile Navigation */}
        <MobileMenu 
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          categories={categories || []}
        />
      </div>
    </header>
  );
}
