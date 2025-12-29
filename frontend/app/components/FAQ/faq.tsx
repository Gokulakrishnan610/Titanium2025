"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ChevronDown, Search, HelpCircle, Users, Calendar, Trophy, Code, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./faq.module.css";

gsap.registerPlugin(ScrollTrigger);

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

const faqCategories = [
  { id: "general", label: "General", icon: HelpCircle, color: "from-blue-500/20 to-cyan-500/20" },
  { id: "registration", label: "Registration", icon: Users, color: "from-green-500/20 to-emerald-500/20" },
  { id: "events", label: "Events", icon: Calendar, color: "from-purple-500/20 to-violet-500/20" },
  { id: "competitions", label: "Competitions", icon: Trophy, color: "from-yellow-500/20 to-orange-500/20" },
  { id: "technical", label: "Technical", icon: Code, color: "from-red-500/20 to-pink-500/20" },
  { id: "security", label: "Security", icon: Shield, color: "from-indigo-500/20 to-blue-500/20" },
];

const faqData: FAQItem[] = [
  {
    id: "what-is-titanium",
    question: "What is TITANIUM 2025?",
    answer: "TITANIUM 2025 is an international-level technical symposium that brings together technology enthusiasts, industry experts, and innovators from around the world. It features hackathons, workshops, competitions, plenary sessions, and networking opportunities across cutting-edge tech domains.",
    category: "general",
    tags: ["symposium", "technology", "international"]
  },
  {
    id: "when-where",
    question: "When and where is TITANIUM 2025 taking place?",
    answer: "TITANIUM 2025 will be held from [Date] to [Date] at [Venue]. The event spans multiple days with both in-person and virtual participation options available for global attendees.",
    category: "general",
    tags: ["date", "venue", "location"]
  },
  {
    id: "registration-process",
    question: "How do I register for TITANIUM 2025?",
    answer: "Registration is available through our official website. Simply click on the 'Register' button, fill out the required information, select your participation category (student/professional), and complete the payment process. Early bird discounts are available for limited time.",
    category: "registration",
    tags: ["register", "signup", "payment"]
  },
  {
    id: "registration-fee",
    question: "What are the registration fees?",
    answer: "Registration fees vary based on participation type: Students: ₹500 (Early Bird: ₹400), Professionals: ₹1500 (Early Bird: ₹1200), International Participants: $50 (Early Bird: $40). Group discounts are available for teams of 5 or more.",
    category: "registration",
    tags: ["fees", "cost", "pricing", "discount"]
  },
  {
    id: "hackathon-details",
    question: "What hackathons are available at TITANIUM 2025?",
    answer: "We host multiple hackathons including AI/ML Innovation Challenge, Web3 & Blockchain Hackathon, Cybersecurity CTF, IoT Solutions Challenge, and Sustainable Tech Hackathon. Each hackathon has different themes, prize pools, and duration (24-48 hours).",
    category: "competitions",
    tags: ["hackathon", "AI", "blockchain", "cybersecurity", "IoT"]
  },
  {
    id: "team-formation",
    question: "Can I participate in teams? How do I form a team?",
    answer: "Yes! Most competitions allow teams of 2-4 members. You can register with an existing team or join our team formation platform where you can connect with other participants. Solo participation is also allowed in most events.",
    category: "competitions",
    tags: ["team", "collaboration", "solo"]
  },
  {
    id: "workshops-available",
    question: "What workshops and sessions are available?",
    answer: "TITANIUM 2025 features hands-on workshops on AI/ML, Cloud Computing, DevOps, Cybersecurity, Web Development, Mobile App Development, and emerging technologies. All workshops include practical exercises and take-home resources.",
    category: "events",
    tags: ["workshops", "learning", "hands-on", "skills"]
  },
  {
    id: "plenary-sessions",
    question: "Who are the keynote speakers and what are the plenary sessions about?",
    answer: "Our plenary sessions feature industry leaders discussing AI Revolution, Quantum Computing, Sustainable Mobility, SpaceTech, Bio-Digital Convergence, and Climate Technology. Speakers include executives from top tech companies and renowned researchers.",
    category: "events",
    tags: ["speakers", "keynote", "industry", "leaders"]
  },
  {
    id: "accommodation",
    question: "Is accommodation provided for outstation participants?",
    answer: "We provide assistance in finding nearby accommodations. Partner hotels offer special rates for TITANIUM participants. Hostel accommodations and shared stays can also be arranged through our accommodation portal.",
    category: "general",
    tags: ["accommodation", "hotel", "stay", "outstation"]
  },
  {
    id: "certificates",
    question: "Will I receive certificates for participation?",
    answer: "Yes! All registered participants receive digital certificates of participation. Winners of competitions receive special achievement certificates. Workshop attendees get skill-based completion certificates.",
    category: "general",
    tags: ["certificates", "participation", "achievement"]
  },
  {
    id: "technical-requirements",
    question: "What are the technical requirements for participation?",
    answer: "Participants should bring their own laptops with required software pre-installed. We provide high-speed internet, power outlets, and basic development tools. Specific requirements for each workshop/competition are listed in the detailed event descriptions.",
    category: "technical",
    tags: ["laptop", "software", "requirements", "setup"]
  },
  {
    id: "food-arrangements",
    question: "Are meals and refreshments provided?",
    answer: "Yes! Registration includes breakfast, lunch, dinner, and refreshments throughout the event days. We cater to various dietary preferences including vegetarian, vegan, and special dietary requirements (please mention during registration).",
    category: "general",
    tags: ["food", "meals", "dietary", "refreshments"]
  },
  {
    id: "networking-opportunities",
    question: "What networking opportunities are available?",
    answer: "TITANIUM 2025 offers structured networking sessions, industry meetups, startup showcases, career fairs, and informal networking spaces. Our mobile app includes participant directory and networking features.",
    category: "events",
    tags: ["networking", "career", "industry", "connections"]
  },
  {
    id: "prizes-awards",
    question: "What prizes and awards are available?",
    answer: "Total prize pool exceeds ₹10 lakhs across all competitions. Prizes include cash awards, internship opportunities, mentorship programs, startup incubation support, and exclusive tech gadgets. Special recognition for innovative solutions.",
    category: "competitions",
    tags: ["prizes", "awards", "cash", "internship", "recognition"]
  },
  {
    id: "covid-safety",
    question: "What safety measures are in place?",
    answer: "We follow all local health guidelines and maintain high safety standards. Hand sanitizers are available throughout the venue, and we ensure proper ventilation. Virtual participation options are available for those who prefer remote attendance.",
    category: "security",
    tags: ["safety", "health", "covid", "guidelines"]
  },
  {
    id: "contact-support",
    question: "How can I get help or contact support?",
    answer: "Our support team is available 24/7 during the event. Contact us via email at support@titanium2025.com, WhatsApp at +91-XXXXXXXXX, or visit the help desk at the venue. We also have live chat support on our website.",
    category: "general",
    tags: ["support", "contact", "help", "assistance"]
  }
];

export default function FAQ() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const expandAll = () => {
    setOpenItems(new Set(filteredFAQs.map(faq => faq.id)));
  };

  const collapseAll = () => {
    setOpenItems(new Set());
  };

  const handleSearch = (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    // Simulate search delay for better UX
    setTimeout(() => setIsSearching(false), 300);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key to clear search
      if (event.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        setIsSearching(false);
      }
      
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
        searchInput?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate header
      gsap.fromTo(
        ".faq-header",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".faq-header",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Animate search and filters
      gsap.fromTo(
        ".faq-controls",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".faq-controls",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Animate FAQ items
      gsap.fromTo(
        ".faq-item",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".faq-list",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="relative py-32 bg-titanium-black overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-titanium-silver/30 rounded-full animate-pulse" />
      <div className="absolute top-40 right-20 w-1 h-1 bg-titanium-bright/40 rounded-full animate-pulse delay-1000" />
      <div className="absolute bottom-40 left-20 w-1.5 h-1.5 bg-titanium-metallic/30 rounded-full animate-pulse delay-2000" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="faq-header text-center mb-16">
          <span className="inline-block text-xs sm:text-sm font-mono text-titanium-metallic uppercase tracking-widest mb-4">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-titanium-gradient">Frequently Asked</span>
            <br />
            <span className="text-titanium-light">Questions</span>
          </h2>
          <p className="text-titanium-metallic text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about TITANIUM 2025. Can't find what you're looking for? 
            Our support team is here to help you 24/7.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="faq-controls mb-12">
          {/* Search Bar */}
          <div className="relative mb-8 max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-titanium-metallic" />
            </div>
            <input
              type="text"
              placeholder="Search questions, answers, or topics..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className={cn(
                "w-full pl-12 pr-20 py-4 bg-titanium-charcoal/50 border border-titanium-silver/20 rounded-2xl text-titanium-light placeholder-titanium-metallic focus:outline-none focus:border-titanium-silver/50 focus:bg-titanium-charcoal/70 transition-all duration-300",
                isSearching && "search-loading"
              )}
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-mono text-titanium-metallic bg-titanium-charcoal/50 border border-titanium-silver/20 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                selectedCategory === "all"
                  ? "bg-titanium-silver text-titanium-black"
                  : "bg-titanium-charcoal/30 border border-titanium-silver/20 text-titanium-light hover:border-titanium-silver/40"
              )}
            >
              All Questions
            </button>
            {faqCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2",
                  selectedCategory === category.id
                    ? "bg-titanium-silver text-titanium-black"
                    : "bg-titanium-charcoal/30 border border-titanium-silver/20 text-titanium-light hover:border-titanium-silver/40"
                )}
              >
                <category.icon size={16} />
                {category.label}
              </button>
            ))}
          </div>

          {/* Expand/Collapse Controls */}
          {filteredFAQs.length > 0 && (
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={expandAll}
                className="text-sm text-titanium-metallic hover:text-titanium-light transition-colors duration-300"
              >
                Expand All
              </button>
              <span className="text-titanium-silver/30">|</span>
              <button
                onClick={collapseAll}
                className="text-sm text-titanium-metallic hover:text-titanium-light transition-colors duration-300"
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {/* FAQ List */}
        <div className="faq-list max-w-4xl mx-auto">
          {/* Results Counter */}
          {(searchQuery || selectedCategory !== "all") && (
            <div className="mb-6 text-center">
              <p className="text-sm text-titanium-metallic">
                {filteredFAQs.length === 0 
                  ? "No questions found" 
                  : `Showing ${filteredFAQs.length} question${filteredFAQs.length !== 1 ? 's' : ''}`
                }
                {searchQuery && ` for "${searchQuery}"`}
                {selectedCategory !== "all" && ` in ${faqCategories.find(cat => cat.id === selectedCategory)?.label}`}
              </p>
            </div>
          )}

          {filteredFAQs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-titanium-charcoal/50 border border-titanium-silver/20 flex items-center justify-center">
                <Search className="w-8 h-8 text-titanium-metallic" />
              </div>
              <h3 className="text-xl font-semibold text-titanium-light mb-2">No questions found</h3>
              <p className="text-titanium-metallic">
                Try adjusting your search terms or browse different categories.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={faq.id}
                  className={cn(
                    "faq-item titanium-card rounded-2xl overflow-hidden transition-all duration-300",
                    styles.faqItem
                  )}
                >
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-titanium-charcoal/30 transition-colors duration-300"
                  >
                    <div className="flex-1 pr-4">
                      <h3 className="text-lg font-semibold text-titanium-light mb-2">
                        {faq.question}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {faq.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-1 rounded-full bg-titanium-silver/10 text-titanium-metallic"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "w-6 h-6 text-titanium-metallic transition-transform duration-300",
                        openItems.has(faq.id) && "rotate-180"
                      )}
                    />
                  </button>
                  
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      openItems.has(faq.id) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <div className="px-6 pb-6 border-t border-titanium-silver/10">
                      <div className="pt-4 text-titanium-metallic leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support Section */}
        <div className="mt-20 text-center">
          <div className="titanium-card rounded-3xl p-8 max-w-2xl mx-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-titanium-silver/20 to-titanium-metallic/20 flex items-center justify-center">
              <Zap className="w-8 h-8 text-titanium-silver" />
            </div>
            <h3 className="text-2xl font-bold text-titanium-light mb-4">
              Still have questions?
            </h3>
            <p className="text-titanium-metallic mb-6 leading-relaxed">
              Our support team is available 24/7 to help you with any queries about TITANIUM 2025.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn-primary px-6 py-3 rounded-xl font-semibold">
                Contact Support
              </button>
              <button className="btn-secondary px-6 py-3 rounded-xl font-semibold">
                Join Community
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-titanium-silver/20 to-transparent" />
    </section>
  );
}