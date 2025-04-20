import { Link, useLocation } from 'wouter';
import { useState } from 'react';
import { Category } from '@shared/schema';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
}

export default function MobileMenu({ isOpen, onClose, categories }: MobileMenuProps) {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality would go here
    console.log('Searching for:', searchTerm);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <nav className="bg-white border-t border-[#EFEFEF]">
      <div className="py-3 px-4">
        <form onSubmit={handleSearch} className="mb-3">
          <input 
            type="text" 
            placeholder="Search articles..." 
            className="w-full px-4 py-2 rounded-full border border-[#EFEFEF] focus:outline-none focus:ring-2 focus:ring-[#0066CC] font-['Inter']"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
        
        <ul className="flex flex-col space-y-3 text-sm font-['Inter'] font-medium">
          <li>
            <Link 
              href="/" 
              className={location === '/' 
                ? "text-[#FF4500] font-semibold block py-1" 
                : "text-[#333333] hover:text-[#0066CC] block py-1"}
              onClick={onClose}
            >
              Home
            </Link>
          </li>
          {categories.map(category => (
            <li key={category.id}>
              <Link
                href={`/category/${category.slug}`}
                className={location === `/category/${category.slug}` 
                  ? "text-[#FF4500] hover:text-[#0066CC] block py-1" 
                  : "text-[#333333] hover:text-[#0066CC] block py-1"}
                onClick={onClose}
              >
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="mt-4 pt-3 border-t border-[#EFEFEF] space-y-3">
          <Link 
            href="/admin" 
            className="flex items-center justify-center text-sm font-['Inter'] font-medium px-3 py-2 rounded-full bg-[#333333] text-white"
            onClick={onClose}
          >
            <i className="fas fa-user-shield mr-1"></i>
            Admin Dashboard
          </Link>
          <Link 
            href="#" 
            className="flex items-center justify-center text-sm font-['Inter'] font-medium px-3 py-2 rounded-full bg-[#0066CC] text-white"
          >
            <i className="fas fa-envelope mr-1"></i>
            Subscribe to Newsletter
          </Link>
        </div>
      </div>
    </nav>
  );
}
