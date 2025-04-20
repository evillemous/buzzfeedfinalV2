import React from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { 
  Facebook, 
  Twitter, 
  Linkedin, 
  Link, 
  MessageCircle, 
  Mail,
  Share
} from "lucide-react";
import { generateShareLinks } from '@/lib/utils';

interface ShareButtonsProps {
  article: {
    title: string;
    slug: string;
  };
  className?: string;
  compact?: boolean;
}

export function ShareButtons({ article, className = "", compact = false }: ShareButtonsProps) {
  const { title, slug } = article;
  const shareLinks = generateShareLinks({ title, slug });
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLinks.copyLink).then(() => {
      toast({
        title: "Link Copied",
        description: "Article link copied to clipboard",
      });
    }, () => {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy link",
      });
    });
  };

  const incrementShareCount = async () => {
    try {
      // Extract article ID from data-id attribute or props
      // For this simplified version, we'll just log it
      console.log(`Shared article: ${slug}`);
      // In a real implementation, you would call the API to increment share count
      // await fetch(`/api/articles/${articleId}/share`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to increment share count:', error);
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Button 
          size="sm" 
          variant="ghost" 
          className="p-2 h-auto" 
          onClick={() => {
            window.open(shareLinks.facebook, '_blank');
            incrementShareCount();
          }}
          aria-label="Share on Facebook"
        >
          <Facebook size={18} />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="p-2 h-auto" 
          onClick={() => {
            window.open(shareLinks.twitter, '_blank');
            incrementShareCount();
          }}
          aria-label="Share on Twitter"
        >
          <Twitter size={18} />
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="p-2 h-auto" 
          onClick={copyToClipboard}
          aria-label="Copy link"
        >
          <Link size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <Button 
        size="sm" 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={() => {
          window.open(shareLinks.facebook, '_blank');
          incrementShareCount();
        }}
      >
        <Facebook size={16} />
        <span className="hidden sm:inline">Facebook</span>
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={() => {
          window.open(shareLinks.twitter, '_blank');
          incrementShareCount();
        }}
      >
        <Twitter size={16} />
        <span className="hidden sm:inline">Twitter</span>
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={() => {
          window.open(shareLinks.linkedin, '_blank');
          incrementShareCount();
        }}
      >
        <Linkedin size={16} />
        <span className="hidden sm:inline">LinkedIn</span>
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={() => {
          window.open(shareLinks.whatsapp, '_blank');
          incrementShareCount();
        }}
      >
        <MessageCircle size={16} />
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="flex items-center gap-2" 
        onClick={() => {
          window.open(shareLinks.email, '_blank');
          incrementShareCount();
        }}
      >
        <Mail size={16} />
        <span className="hidden sm:inline">Email</span>
      </Button>
      <Button 
        size="sm" 
        variant="secondary" 
        className="flex items-center gap-2" 
        onClick={copyToClipboard}
      >
        <Link size={16} />
        <span className="hidden sm:inline">Copy Link</span>
      </Button>
    </div>
  );
}