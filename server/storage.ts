import { 
  users, categories, articles, tags, articlesTags,
  type User, type InsertUser, 
  type Category, type InsertCategory,
  type Article, type InsertArticle,
  type Tag, type InsertTag,
  type ArticleTag, type InsertArticleTag
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Article methods
  getArticles(limit?: number, offset?: number): Promise<Article[]>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  getFeaturedArticles(limit?: number): Promise<Article[]>;
  getArticlesByCategory(categoryId: number, limit?: number): Promise<Article[]>;
  getArticlesByCategorySlug(slug: string, limit?: number): Promise<Article[]>;
  getPopularArticles(limit?: number): Promise<Article[]>;
  getRelatedArticles(articleId: number, limit?: number): Promise<Article[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  incrementArticleViews(id: number): Promise<void>;
  incrementArticleShares(id: number): Promise<void>;
  
  // Tag methods
  getTags(): Promise<Tag[]>;
  getTagBySlug(slug: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  getArticlesByTag(tagId: number): Promise<Article[]>;
  getArticlesByTagSlug(slug: string): Promise<Article[]>;
  
  // Article-Tag relationship
  addTagToArticle(articleId: number, tagId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private categories: Map<number, Category>;
  private articles: Map<number, Article>;
  private tags: Map<number, Tag>;
  private articlesTags: Map<number, ArticleTag>;
  private userIdCounter: number;
  private categoryIdCounter: number;
  private articleIdCounter: number;
  private tagIdCounter: number;
  private articleTagIdCounter: number;

  constructor() {
    this.users = new Map();
    this.categories = new Map();
    this.articles = new Map();
    this.tags = new Map();
    this.articlesTags = new Map();
    this.userIdCounter = 1;
    this.categoryIdCounter = 1;
    this.articleIdCounter = 1;
    this.tagIdCounter = 1;
    this.articleTagIdCounter = 1;

    // Initialize with some seed data
    this.initializeData();
  }

  // Initialize with seed data for demo purposes
  private initializeData() {
    // Create categories
    const categories: InsertCategory[] = [
      { name: "Health & Wellness", slug: "health-wellness", description: "Health and wellness tips and news", color: "#FF3B30", bgColor: "#FFEBE9" },
      { name: "Personal Finance", slug: "personal-finance", description: "Personal finance advice and news", color: "#0066CC", bgColor: "#E6F0FF" },
      { name: "Technology", slug: "technology", description: "Technology news and updates", color: "#FF9500", bgColor: "#FFF4E5" },
      { name: "Celebrity", slug: "celebrity", description: "Celebrity news and gossip", color: "#9C27B0", bgColor: "#F3E5F5" },
      { name: "Travel", slug: "travel", description: "Travel tips and destination guides", color: "#35C759", bgColor: "#E9F7EF" },
      { name: "Home & DIY", slug: "home-diy", description: "Home improvement and DIY projects", color: "#8E8E93", bgColor: "#F2F2F7" }
    ];
    
    categories.forEach(category => this.createCategory(category));

    // Create users
    const users: InsertUser[] = [
      { username: "jameswilson", password: "password123", email: "james@example.com", fullName: "James Wilson", isAdmin: true },
      { username: "sarahjohnson", password: "password123", email: "sarah@example.com", fullName: "Sarah Johnson", isAdmin: false },
      { username: "michaelchen", password: "password123", email: "michael@example.com", fullName: "Dr. Michael Chen", isAdmin: false },
      { username: "emmarodriguez", password: "password123", email: "emma@example.com", fullName: "Emma Rodriguez", isAdmin: false },
      { username: "tylerbrooks", password: "password123", email: "tyler@example.com", fullName: "Tyler Brooks", isAdmin: false }
    ];
    
    users.forEach(user => this.createUser(user));

    // Create articles
    const articles: InsertArticle[] = [
      {
        title: "How AI Is Completely Transforming These 10 Industries - #7 Will Shock You",
        slug: "ai-transforming-industries",
        excerpt: "Artificial intelligence isn't just changing tech companies – it's revolutionizing industries you'd never expect. From healthcare diagnostics to your morning coffee, AI is behind the scenes improving...",
        content: `<p>Artificial intelligence has moved beyond science fiction and into our everyday lives, transforming industries at a pace never seen before. While many of us know about self-driving cars and voice assistants, AI's influence extends far beyond these visible applications.</p>
        <p>In this article, we'll explore the 10 most surprising industries being completely revolutionized by artificial intelligence right now. Some of these transformations are happening right under our noses, while others are just beginning to emerge.</p>
        <h2>1. Healthcare: AI Doctors Making Breakthrough Diagnoses</h2>
        <p>Healthcare might seem like an obvious choice, but the depth of AI's impact is stunning. AI systems can now detect certain cancers more accurately than human radiologists. In one recent study, an AI system identified lung cancer nodules with 94% accuracy, compared to 69% accuracy from human experts.</p>
        <p>Even more impressive, AI is now being used to discover new medications by analyzing molecular structures and predicting how different compounds will interact with disease targets. This process used to take years—now it can happen in weeks.</p>
        <blockquote>"AI is not replacing doctors—it's giving them superpowers. The combination of human expertise and machine learning is creating a new paradigm in healthcare delivery." - Dr. Emily Chen, Stanford Medical Center</blockquote>
        <h2>2. Agriculture: Smart Farming Feeds Billions</h2>
        <p>Agriculture might seem low-tech, but it's experiencing a revolution thanks to AI. Smart sensors and drones collect data on soil conditions, plant health, and weather patterns. AI systems then analyze this information to optimize irrigation, fertilization, and harvest timing.</p>
        <p>The results are impressive: farms using AI-powered systems are reporting yield increases of up to 30% while using 30% less water and fertilizer. This technology could be key to feeding our growing global population sustainably.</p>
        <h2>3. Manufacturing: Smart Factories Revolutionize Production</h2>
        <p>Modern factories are becoming "smart factories" where AI systems monitor and control every aspect of production. Predictive maintenance algorithms can detect when machines are likely to fail before they actually do, reducing downtime by up to 50%.</p>
        <p>AI-powered quality control systems can spot defects invisible to the human eye, reducing waste and improving product quality. Some factories have reported defect reductions of 90% after implementing these systems.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1618044733300-9472054094ee?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80",
        categoryId: 3,
        authorId: 1,
        isFeatured: true,
        readTime: 5
      },
      {
        title: "7 Side Hustles That Are Making People Rich in 2025",
        slug: "side-hustles-making-people-rich",
        excerpt: "These little-known opportunities are helping ordinary people generate extraordinary income without quitting their day jobs...",
        content: `<p>In today's gig economy, side hustles have evolved from simple ways to make extra cash to serious income streams that can rival or even surpass traditional jobs. With advancing technology and shifting work paradigms, 2025 has introduced unprecedented opportunities for those looking to boost their income.</p>
        <p>Here are 7 side hustles that are helping ordinary people generate extraordinary wealth this year:</p>
        <h2>1. AI Prompt Engineering</h2>
        <p>As artificial intelligence becomes increasingly integrated into business operations, companies need skilled prompt engineers who can effectively communicate with AI systems. This niche skill doesn't require a technical background but pays handsomely, with experienced prompt engineers earning $75-200 per hour on a contract basis.</p>
        <h2>2. Virtual Event Production</h2>
        <p>The hybrid work model is here to stay, creating massive demand for virtual event specialists. With just a laptop and the right software, you can help businesses create engaging online experiences, earning between $2,000-5,000 per event.</p>
        <h2>3. Financial Content Creation</h2>
        <p>The appetite for financial education has never been greater. Content creators who can break down complex financial concepts into digestible content are monetizing through ad revenue, sponsorships, and digital products, with top creators earning six figures monthly.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        categoryId: 2,
        authorId: 2,
        isFeatured: false,
        readTime: 4
      },
      {
        title: "Doctors Are Warning About This Common Symptom You're Ignoring",
        slug: "common-symptom-warning",
        excerpt: "This everyday sign could indicate a serious health condition. Learn why medical professionals say you shouldn't overlook it...",
        content: `<p>Health experts across the country are raising alarms about a common symptom that many people dismiss as insignificant, but which could be an early warning sign of several serious medical conditions.</p>
        <p>According to recent medical studies, persistent fatigue that doesn't improve with rest is being overlooked by millions of Americans who attribute it simply to busy lifestyles, stress, or aging. However, this symptom could indicate underlying conditions ranging from thyroid disorders to autoimmune diseases.</p>
        <h2>Why Fatigue Shouldn't Be Ignored</h2>
        <p>"Persistent fatigue is one of the most common complaints we see, but also one of the most dismissed by patients themselves," explains Dr. Lisa Karrington, endocrinologist at Mayo Clinic. "People adapt to feeling tired and accept it as their normal state, which can delay diagnosis of treatable conditions."</p>
        <p>Medical professionals are particularly concerned because unexplained fatigue can be an early indicator of serious conditions including:</p>
        <ul>
          <li>Hypothyroidism</li>
          <li>Anemia</li>
          <li>Sleep apnea</li>
          <li>Heart disease</li>
          <li>Diabetes</li>
          <li>Autoimmune disorders</li>
        </ul>`,
        featuredImage: "https://images.unsplash.com/photo-1544991185-13fe5d113fe3?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        categoryId: 1,
        authorId: 3,
        isFeatured: false,
        readTime: 3
      },
      {
        title: "These Hidden Travel Deals Can Save You Thousands This Summer",
        slug: "hidden-travel-deals-summer",
        excerpt: "Insider secrets from travel agents reveal how to get luxury vacations at budget prices that airlines don't want you to know about...",
        content: `<p>As summer approaches and travel demand surges, savvy travelers are using insider strategies to secure luxury experiences at a fraction of the advertised cost. Travel industry experts are revealing techniques that airlines and hotels prefer to keep quiet.</p>
        <p>"The travel industry operates on complex pricing algorithms designed to maximize revenue, but there are predictable patterns and loopholes that consumers can leverage," explains Maria Gonzalez, a former airline pricing analyst turned consumer advocate.</p>
        <h2>1. The 'Hidden City' Ticket Hack</h2>
        <p>One of the most powerful strategies involves booking what's known as "hidden city" tickets. This approach takes advantage of the airline industry's hub-and-spoke routing system.</p>
        <p>"Sometimes a flight from New York to Chicago might cost $400, but a flight from New York to Minneapolis with a connection in Chicago might only cost $250," Gonzalez explains. "If Chicago is your actual destination, you could book the cheaper connecting ticket and simply not take the second flight."</p>
        <p>While this practice isn't illegal, it does violate most airlines' terms of service, so travelers should be aware of potential drawbacks: you can't check bags, and airlines may cancel your return flights if they detect the pattern.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1470214783678-7a85ebfeb290?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        categoryId: 5,
        authorId: 4,
        isFeatured: false,
        readTime: 6
      },
      {
        title: "15 Celebrities Who Are Unrecognizable Today - You Won't Believe #8",
        slug: "unrecognizable-celebrities-today",
        excerpt: "These famous faces have changed so dramatically that fans can barely recognize them. See the shocking transformations...",
        content: `<p>Hollywood has always been fascinated with transformations, but some celebrities have changed so dramatically over the years that even their most dedicated fans might have trouble recognizing them today. From dramatic weight losses to plastic surgery, lifestyle changes to aging effects, these transformations remind us how fluid appearance can be in the entertainment industry.</p>
        <h2>1. Matthew Perry</h2>
        <p>Friends fans remember Matthew Perry as the sarcastic, quick-witted Chandler Bing. While his talent remains undeniable, Perry has been open about his struggles with addiction and health issues that have contributed to his changed appearance over the years.</p>
        <h2>2. Renée Zellweger</h2>
        <p>The Bridget Jones star sparked intense media speculation when she appeared at a 2014 event looking noticeably different. Zellweger later addressed the attention, attributing her changed appearance to "living a different, happy, more fulfilling life."</p>
        <h2>3. Mickey Rourke</h2>
        <p>Once considered one of Hollywood's most handsome leading men, Rourke's appearance changed dramatically after he left acting temporarily to pursue a professional boxing career. Multiple facial injuries required reconstructive surgery, resulting in a completely transformed look when he returned to films.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        categoryId: 4,
        authorId: 5,
        isFeatured: false,
        readTime: 8
      },
      {
        title: "This New AI App Can Write Perfect Emails in Seconds",
        slug: "ai-app-write-perfect-emails",
        excerpt: "Never struggle with professional communication again. This revolutionary AI tool is changing how we write emails forever.",
        content: `<p>Professional communication just got a major upgrade thanks to a groundbreaking new AI application that promises to take the stress and time out of crafting the perfect email. The tool, which uses advanced natural language processing, can generate contextually appropriate, personalized emails in seconds.</p>
        <p>EmailGenius, launched just last month, is already gaining traction among professionals from various industries who struggle with email composition or simply want to save time. The application doesn't just create generic templates – it learns your writing style and adapts to match your voice.</p>
        <h2>How It Works</h2>
        <p>"The technology analyzes thousands of professionally written emails to understand effective communication patterns," explains Dr. Samantha Lee, chief AI scientist at EmailGenius. "But what makes our system unique is its ability to personalize output based on relationship context, previous communications, and the user's own writing style."</p>
        <p>Users simply need to input a few key points they want to communicate, select the tone (formal, friendly, urgent, etc.), and specify the recipient relationship (client, colleague, manager, etc.). The AI then generates a complete email that can be used as-is or tweaked as needed.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        categoryId: 3,
        authorId: 1,
        isFeatured: false,
        readTime: 3
      },
      {
        title: "5 AI Tools That Are Making Professionals Obsolete",
        slug: "ai-tools-replacing-professionals",
        excerpt: "These powerful AI systems are already outperforming human experts in these five key fields. Is your job next?",
        content: `<p>The AI revolution is accelerating faster than most experts predicted, with sophisticated systems now capable of performing tasks that once required years of specialized human training and experience. While the full impact of these technologies is still unfolding, certain professions are already feeling the effects of automation.</p>
        <p>Here are five fields where AI tools are not just assisting professionals but potentially replacing them entirely:</p>
        <h2>1. Radiology</h2>
        <p>AI diagnostic systems can now detect certain types of cancer and other abnormalities in medical imaging with accuracy rates that exceed human radiologists. A 2023 Stanford study found that their leading AI system correctly identified early-stage lung tumors with 97% accuracy, compared to 88% for experienced radiologists.</p>
        <p>"The writing is on the wall for diagnostic radiology as we know it," says Dr. Robert Chen, who specializes in medical AI integration. "Within five years, the primary role of radiologists will shift from initial diagnosis to verifying and explaining AI findings."</p>
        <h2>2. Legal Research & Contract Analysis</h2>
        <p>Law firms are increasingly relying on AI systems that can review thousands of legal documents in hours rather than the weeks it would take a team of paralegals and junior associates. These tools don't just search for keywords – they understand legal concepts and can identify relevant precedents and potential contract issues.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        categoryId: 3,
        authorId: 3,
        isFeatured: false,
        readTime: 5
      },
      {
        title: "Why Big Tech Is Betting Everything on AI (It's Not What You Think)",
        slug: "big-tech-betting-on-ai",
        excerpt: "The true reason tech giants are investing billions in artificial intelligence goes beyond productivity or innovation.",
        content: `<p>While the public narrative around Big Tech's massive investments in AI typically focuses on improving products, increasing efficiency, or future-proofing business models, industry insiders reveal that the stakes are actually much higher – and the motivations more complex – than most people realize.</p>
        <p>"This isn't just about making better recommendation algorithms or voice assistants," explains Dr. Maya Patel, former head of research at a major Silicon Valley AI lab. "What we're witnessing is nothing less than a modern arms race with existential implications for these companies."</p>
        <h2>The Real Motivation: Survival</h2>
        <p>According to multiple senior executives speaking anonymously, the primary driver behind the unprecedented AI investments isn't innovation but fear – specifically, fear of obsolescence and being left behind in what they see as a winner-take-all technological revolution.</p>
        <p>"Inside boardrooms, there's a widely held belief that companies who master AI first will dominate the next era of computing, while everyone else becomes irrelevant," says venture capitalist Thomas Zhang, who has invested in over 20 AI startups. "It's creating a high-stakes environment where rational investment calculations have been replaced by existential panic."</p>
        <p>This panic is compounded by the recognition that AI development has reached a critical inflection point where progress is accelerating exponentially rather than linearly, making it nearly impossible for laggards to catch up.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1557838923-2985c318be48?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80",
        categoryId: 3,
        authorId: 1,
        isFeatured: false,
        readTime: 4
      },
      {
        title: "This Hidden iPhone Feature Can Save You Thousands on Your Next Bill",
        slug: "hidden-iphone-feature-save-money",
        excerpt: "Most iPhone users have no idea this built-in tool can drastically reduce their monthly charges. Here's how to find it.",
        content: `<p>With the average American cell phone bill hovering around $144 per month according to recent studies, millions of iPhone users are unknowingly paying far more than necessary for their mobile service. The solution isn't switching carriers or downgrading plans – it's using a hidden feature that's been built into iOS for years.</p>
        <h2>The Data Usage Analyzer You Never Knew You Had</h2>
        <p>Buried in your iPhone's settings is a sophisticated data analysis tool that provides detailed insights into exactly how your cellular data is being used. This feature goes far beyond the basic data counter that most users occasionally check.</p>
        <p>"What makes this tool so valuable is that it breaks down data usage by app, time period, and even location," explains tech analyst Maria Rodriguez. "This level of detail allows you to identify specific data-draining behaviors and apps that you might not even realize are costing you money."</p>
        <p>The analyzer can reveal surprising patterns – like background app refreshes consuming gigabytes of data or certain social media apps using excessive data even when you think you're browsing with minimal usage.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1512054502232-10a0a035d672?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        categoryId: 3,
        authorId: 2,
        isFeatured: false,
        readTime: 3
      },
      {
        title: "Doctors Are Now Recommending This One Food for Better Sleep",
        slug: "doctors-recommend-food-for-sleep",
        excerpt: "This surprising dietary addition is helping thousands overcome insomnia and sleep disturbances without medication.",
        content: `<p>As sleep disorders continue to affect millions of Americans, with an estimated 50-70 million adults suffering from insomnia or other sleep-related problems, medical professionals are increasingly turning to dietary interventions before prescribing medications. Among these recommendations, one particular food has been gaining substantial attention from sleep specialists for its remarkable effectiveness.</p>
        <h2>The Unexpected Sleep Aid: Tart Cherries</h2>
        <p>Tart cherries, particularly in the form of concentrated juice or supplements, have emerged as a scientifically validated sleep enhancer that many doctors now recommend to patients struggling with sleep disturbances.</p>
        <p>"The research on tart cherries for sleep improvement has become quite compelling," explains Dr. Rebecca Lane, neurologist and sleep medicine specialist. "Multiple studies have demonstrated that regular consumption can significantly improve both sleep duration and quality, often matching the effectiveness of over-the-counter sleep aids but without the side effects."</p>
        <p>The sleep-promoting properties of tart cherries are attributed to their naturally high concentration of melatonin – the hormone that regulates sleep-wake cycles – and their rich content of anti-inflammatory compounds that help reduce pain and discomfort that might otherwise disturb sleep.</p>`,
        featuredImage: "https://images.unsplash.com/photo-1518057111178-44a106bad149?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
        categoryId: 1,
        authorId: 3,
        isFeatured: false,
        readTime: 4
      }
    ];
    
    articles.forEach(article => this.createArticle(article));

    // Create tags
    const tags: InsertTag[] = [
      { name: "AI", slug: "ai" },
      { name: "Side Hustles", slug: "side-hustles" },
      { name: "Health", slug: "health" },
      { name: "Travel", slug: "travel" },
      { name: "Celebrity", slug: "celebrity" },
      { name: "Technology", slug: "technology" },
      { name: "Finance", slug: "finance" },
      { name: "Sleep", slug: "sleep" },
      { name: "iPhone", slug: "iphone" },
      { name: "Weight Loss", slug: "weight-loss" }
    ];
    
    tags.forEach(tag => this.createTag(tag));

    // Add tags to articles
    this.addTagToArticle(1, 1); // AI Transforming -> AI
    this.addTagToArticle(1, 6); // AI Transforming -> Technology
    this.addTagToArticle(2, 2); // Side Hustles -> Side Hustles
    this.addTagToArticle(2, 7); // Side Hustles -> Finance
    this.addTagToArticle(3, 3); // Common Symptom -> Health
    this.addTagToArticle(4, 4); // Travel Deals -> Travel
    this.addTagToArticle(5, 5); // Celebrities -> Celebrity
    this.addTagToArticle(6, 1); // AI App -> AI
    this.addTagToArticle(6, 6); // AI App -> Technology
    this.addTagToArticle(7, 1); // AI Tools -> AI
    this.addTagToArticle(7, 6); // AI Tools -> Technology
    this.addTagToArticle(8, 1); // Big Tech -> AI
    this.addTagToArticle(8, 6); // Big Tech -> Technology
    this.addTagToArticle(9, 9); // iPhone -> iPhone
    this.addTagToArticle(9, 7); // iPhone -> Finance
    this.addTagToArticle(10, 3); // Food for Sleep -> Health
    this.addTagToArticle(10, 8); // Food for Sleep -> Sleep
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(category => category.slug === slug);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }

  // Articles
  async getArticles(limit: number = 20, offset: number = 0): Promise<Article[]> {
    return Array.from(this.articles.values())
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(offset, offset + limit);
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    return Array.from(this.articles.values()).find(article => article.slug === slug);
  }

  async getFeaturedArticles(limit: number = 1): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter(article => article.isFeatured)
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, limit);
  }

  async getArticlesByCategory(categoryId: number, limit: number = 10): Promise<Article[]> {
    return Array.from(this.articles.values())
      .filter(article => article.categoryId === categoryId)
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime())
      .slice(0, limit);
  }

  async getArticlesByCategorySlug(slug: string, limit: number = 10): Promise<Article[]> {
    const category = await this.getCategoryBySlug(slug);
    if (!category) return [];
    return this.getArticlesByCategory(category.id, limit);
  }

  async getPopularArticles(limit: number = 5): Promise<Article[]> {
    return Array.from(this.articles.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  async getRelatedArticles(articleId: number, limit: number = 3): Promise<Article[]> {
    const article = this.articles.get(articleId);
    if (!article) return [];
    
    // Get tags for this article
    const articleTagIds = Array.from(this.articlesTags.values())
      .filter(at => at.articleId === articleId)
      .map(at => at.tagId);
    
    // Find other articles with same tags
    const relatedArticleIds = new Set<number>();
    articleTagIds.forEach(tagId => {
      Array.from(this.articlesTags.values())
        .filter(at => at.tagId === tagId && at.articleId !== articleId)
        .forEach(at => relatedArticleIds.add(at.articleId));
    });
    
    // If not enough related by tag, add from same category
    if (relatedArticleIds.size < limit) {
      Array.from(this.articles.values())
        .filter(a => a.categoryId === article.categoryId && a.id !== articleId)
        .forEach(a => relatedArticleIds.add(a.id));
    }
    
    // Get the articles and sort by views
    const relatedArticles = Array.from(relatedArticleIds)
      .map(id => this.articles.get(id))
      .filter((a): a is Article => a !== undefined)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
    
    return relatedArticles;
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const id = this.articleIdCounter++;
    const newArticle: Article = { ...article, id, views: 0, shares: 0 };
    this.articles.set(id, newArticle);
    return newArticle;
  }

  async incrementArticleViews(id: number): Promise<void> {
    const article = this.articles.get(id);
    if (article) {
      article.views += 1;
      this.articles.set(id, article);
    }
  }

  async incrementArticleShares(id: number): Promise<void> {
    const article = this.articles.get(id);
    if (article) {
      article.shares += 1;
      this.articles.set(id, article);
    }
  }

  // Tags
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async getTagBySlug(slug: string): Promise<Tag | undefined> {
    return Array.from(this.tags.values()).find(tag => tag.slug === slug);
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const id = this.tagIdCounter++;
    const newTag: Tag = { ...tag, id };
    this.tags.set(id, newTag);
    return newTag;
  }

  async getArticlesByTag(tagId: number): Promise<Article[]> {
    const articleIds = Array.from(this.articlesTags.values())
      .filter(at => at.tagId === tagId)
      .map(at => at.articleId);
    
    return articleIds
      .map(id => this.articles.get(id))
      .filter((a): a is Article => a !== undefined)
      .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());
  }

  async getArticlesByTagSlug(slug: string): Promise<Article[]> {
    const tag = await this.getTagBySlug(slug);
    if (!tag) return [];
    return this.getArticlesByTag(tag.id);
  }

  // Article-Tag relationship
  async addTagToArticle(articleId: number, tagId: number): Promise<void> {
    const id = this.articleTagIdCounter++;
    const articleTag: ArticleTag = { id, articleId, tagId };
    this.articlesTags.set(id, articleTag);
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.slug, slug));
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  // Article methods
  async getArticles(limit: number = 20, offset: number = 0): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(articles.publishDate));
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const result = await db.select().from(articles).where(eq(articles.slug, slug));
    return result[0];
  }

  async getFeaturedArticles(limit: number = 1): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.isFeatured, true))
      .limit(limit)
      .orderBy(desc(articles.publishDate));
  }

  async getArticlesByCategory(categoryId: number, limit: number = 10): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .where(eq(articles.categoryId, categoryId))
      .limit(limit)
      .orderBy(desc(articles.publishDate));
  }

  async getArticlesByCategorySlug(slug: string, limit: number = 10): Promise<Article[]> {
    const category = await this.getCategoryBySlug(slug);
    if (!category) return [];
    
    return await this.getArticlesByCategory(category.id, limit);
  }

  async getPopularArticles(limit: number = 5): Promise<Article[]> {
    return await db
      .select()
      .from(articles)
      .orderBy(desc(articles.views))
      .limit(limit);
  }

  async getRelatedArticles(articleId: number, limit: number = 3): Promise<Article[]> {
    // Get the article first to find its category
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, articleId));
    
    if (!article) return [];

    // Get articles in the same category
    return await db
      .select()
      .from(articles)
      .where(and(
        eq(articles.categoryId, article.categoryId),
        sql`${articles.id} != ${articleId}`
      ))
      .limit(limit)
      .orderBy(desc(articles.publishDate));
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const result = await db.insert(articles).values(article).returning();
    return result[0];
  }

  async incrementArticleViews(id: number): Promise<void> {
    await db
      .update(articles)
      .set({ views: sql`${articles.views} + 1` })
      .where(eq(articles.id, id));
  }

  async incrementArticleShares(id: number): Promise<void> {
    await db
      .update(articles)
      .set({ shares: sql`${articles.shares} + 1` })
      .where(eq(articles.id, id));
  }

  // Tag methods
  async getTags(): Promise<Tag[]> {
    return await db.select().from(tags);
  }

  async getTagBySlug(slug: string): Promise<Tag | undefined> {
    const result = await db.select().from(tags).where(eq(tags.slug, slug));
    return result[0];
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const result = await db.insert(tags).values(tag).returning();
    return result[0];
  }

  async getArticlesByTag(tagId: number): Promise<Article[]> {
    // Get article IDs that have this tag
    const results = await db
      .select()
      .from(articlesTags)
      .where(eq(articlesTags.tagId, tagId));
    
    const articleIds = results.map(r => r.articleId).filter(id => id !== null) as number[];
    if (articleIds.length === 0) return [];

    // Get the articles
    return await db
      .select()
      .from(articles)
      .where(inArray(articles.id, articleIds))
      .orderBy(desc(articles.publishDate));
  }

  async getArticlesByTagSlug(slug: string): Promise<Article[]> {
    const tag = await this.getTagBySlug(slug);
    if (!tag) return [];
    
    return await this.getArticlesByTag(tag.id);
  }

  // Article-Tag relationship
  async addTagToArticle(articleId: number, tagId: number): Promise<void> {
    await db.insert(articlesTags).values({ articleId, tagId });
  }
}

// Use database storage
export const storage = new DatabaseStorage();
