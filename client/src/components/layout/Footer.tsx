import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Category } from '@shared/schema';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function Footer() {
  const [email, setEmail] = useState('');
  const { toast } = useToast();
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter subscription would be implemented here
    toast({
      title: "Subscription successful",
      description: "Thank you for subscribing to our newsletter!",
    });
    setEmail('');
  };
  
  return (
    <footer className="bg-[#333333] text-white py-10 mt-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-['Roboto_Condensed'] font-bold mb-4">
              your<span className="text-[#FF4500]">buzzfeed</span>
            </h3>
            <p className="text-gray-400 text-sm">Stay ahead of the curve with the latest stories and insights on topics that matter.</p>
            <div className="flex space-x-4 mt-4">
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-twitter"></i></a>
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-instagram"></i></a>
              <a href="#" className="text-gray-400 hover:text-white"><i className="fab fa-pinterest"></i></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-['Roboto_Condensed'] font-bold mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              {categories?.map(category => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`} className="hover:text-white">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-['Roboto_Condensed'] font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Contact</a></li>
              <li><a href="#" className="hover:text-white">Advertise</a></li>
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-['Roboto_Condensed'] font-bold mb-4">Subscribe</h4>
            <p className="text-gray-400 text-sm mb-4">Get the latest stories delivered straight to your inbox.</p>
            <form className="space-y-2" onSubmit={handleSubscribe}>
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className="w-full px-4 py-2 bg-[#FF4500] text-white font-medium rounded-lg hover:bg-[#FF4500]/90 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} yourbuzzfeed. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
