import Link from "next/link";
import Image from "next/image";
import { getDictionary } from "@/locales/dictionaries";
import { createClient } from "@/utils/supabase/server";
import EventCarousel from "@/components/EventCarousel";
import NewsSection from "@/components/NewsSection";
import InteractiveBackground from "@/components/InteractiveBackground";

export default async function Home() {
  const dict = await getDictionary();
  const supabase = await createClient();
  
  // Fetch upcoming events for carousel
  const { data: eventsData } = await supabase
    .from("events")
    .select("*")
    .eq("status", "upcoming")
    .gte("date_start", new Date().toISOString())
    .order("date_start", { ascending: true })
    .limit(5);

  // Fetch latest news with authors
  const { data: newsData } = await supabase
    .from("news")
    .select("*, members(first_name, last_name)")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(4);

  // Check if current user is Admin (BR or COM)
  const { data: { user } } = await supabase.auth.getUser();
  let isAdminNews = false;
  
  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("*, member_assignments(*)")
      .eq("auth_user_id", user.id)
      .single();

    if (member) {
      const isBR = member.category === "bureau_restreint" || 
                   ["president", "tresorier", "secretaire", "vp_general"].includes(member.role || "");
      
      const isInCOM = member.member_assignments?.some((a: any) => {
        // We'll define a fuzzy match or check specific IDs if we had them. 
        // For now, since COM is a standard pole, we'll check if the associated pole has COM in its name (just for safety or if we can fetch pole names)
        return true; // We'll need a better check after fetching poles
      });

      // Let's be more precise: fetch the COM pole ID
      const { data: comPole } = await supabase.from("poles").select("id").ilike("name", "%COM%").single();
      const isCOMMember = comPole && member.member_assignments?.some((a: any) => a.pole_id === comPole.id);

      isAdminNews = isBR || isCOMMember;
    }
  }

  const defaultEvents = [
    {
      id: "1",
      title: "The Midnight Masquerade",
      category: "Headline Event",
      description: "Our flagship event of the semester. Formal attire required. Identities optional.",
      date_start: new Date(new Date().setMonth(9, 31)).toISOString(),
      location: "Secret Location",
      image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Csx9XytUFcnaj9-80c3AdoLyoCl09Hn3cYIXr5zFwE_ng0vT6M2wAFHhctqlYN1VAPzzczxDCRLK-arIqeAhrl7KQZ6EdMY7phY3BBI3qFbCTGAZRhquIcoobJIMnWPs2KNoKSOUs6X7BxtPSxx1EpQMG7AaQr_pfHjC8D2bVCSeCbhM9jyRB4QdORjjmDC2qaKxx_1Q98m9QKoQ_sAvjzIVWd62gbclKgX6iboqT2XNRdc4SilmWwrPDw79aU8fUgqS4olL4k6q",
    },
    {
      id: "2",
      title: "Alumni Mixer",
      category: "Mixer",
      description: "Connect with past members in an intimate, low-light setting. Drinks provided.",
      date_start: new Date(new Date().setMonth(10, 12)).toISOString(),
      location: "CERI",
    }
  ];

  const upcomingEvents = eventsData && eventsData.length > 0 ? eventsData : defaultEvents;
  const secondaryEvent = upcomingEvents[1] || upcomingEvents[0];

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const formatTime = (isoStr: string) => {
    return new Date(isoStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  // Google Form Link (Placeholder as requested)
  const googleFormUrl = "https://forms.gle/placeholder";

  return (
    <>
      <section className="relative min-h-[921px] flex items-center justify-center overflow-hidden bg-surface">
        <div className="absolute inset-0 z-0">
          <InteractiveBackground />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-tertiary-container rounded-full mix-blend-screen filter blur-[120px] opacity-40"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between gap-16">
          <div className="w-full md:w-1/2 flex flex-col items-start space-y-8">
            <div className="inline-flex items-center space-x-2 bg-surface-container-lowest px-4 py-2 rounded-full ghost-border-bottom">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-ping"></span>
              <span className="text-xs font-label uppercase tracking-widest text-on-surface-variant">Unveiling the Semester</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-on-surface leading-tight tracking-[-0.02em]">
              {dict.home.welcome} <br />
              <span className="festive-gradient-text">BDE CERI</span>.
            </h1>
            <p className="text-lg md:text-xl font-body text-on-surface-variant max-w-lg leading-relaxed">
              {dict.home.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a 
                href={googleFormUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-tertiary text-on-tertiary px-8 py-4 rounded-lg font-label font-bold tracking-wide hover:shadow-[0_0_20px_rgba(123,208,255,0.3)] transition-all transform hover:-translate-y-1 text-center"
              >
                {dict.home.join_us}
              </a>
              <Link href="/evenement" className="glass-panel text-on-surface px-8 py-4 rounded-lg font-label font-medium tracking-wide border border-outline-variant/15 hover:bg-surface-variant/60 transition-all flex items-center justify-center">
                {dict.home.discover_events}
              </Link>
            </div>
          </div>
          <div className="w-full md:w-1/2 relative h-[500px] hidden md:block">
            <div className="absolute right-0 bottom-0 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-radial-gradient from-tertiary/10 to-transparent opacity-50 blur-3xl"></div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Event Carousel Widget */}
                <div className="w-full max-w-md transform rotate-2 hover:rotate-0 transition-transform duration-700">
                    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/20">
                         <div className="h-[400px] relative">
                             <img 
                                src={upcomingEvents[0]?.image_url || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000"} 
                                alt="Event" 
                                className="w-full h-full object-cover opacity-60"
                             />
                             <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest to-transparent"></div>
                             <div className="absolute bottom-6 left-6 right-6">
                                <span className="bg-tertiary text-on-tertiary text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-2 inline-block">Flash Event</span>
                                <h3 className="text-xl font-headline font-bold text-white mb-1">{upcomingEvents[0]?.title}</h3>
                                <p className="text-xs text-white/70 line-clamp-2">{upcomingEvents[0]?.description}</p>
                             </div>
                         </div>
                    </div>
                </div>
                
                <div className="absolute -left-12 top-1/4 w-64 p-6 glass-panel rounded-xl z-20 border border-outline-variant/15 shadow-[0_20px_40px_rgba(7,13,31,0.5)] transform -translate-x-4 hover:translate-x-0 transition-transform duration-500">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <div>
                      <p className="text-xs font-label text-on-surface-variant uppercase tracking-wider">Next Experience</p>
                      <p className="text-sm font-headline font-bold text-on-surface">Digital Horizons</p>
                    </div>
                  </div>
                  <p className="text-xs font-body text-on-surface-variant mb-4">Join us for a journey into the future of technology and human connection.</p>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary w-2/3 h-full rounded-full"></div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* News Section */}
      <NewsSection news={newsData || []} dict={dict} isAdmin={isAdminNews} />

      <section className="py-24 bg-surface relative overflow-hidden z-10">
        <div className="absolute inset-0 z-0">
           <InteractiveBackground />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-sm font-label uppercase tracking-[0.1em] text-on-surface-variant mb-2">The Roster</h2>
              <h3 className="text-4xl font-headline font-bold text-on-surface tracking-tight">{dict.home.discover_events}</h3>
            </div>
            <Link href="/evenement" className="text-sm font-label font-medium text-tertiary hover:text-white transition-colors flex items-center space-x-1">
              <span>View All Events</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EventCarousel events={upcomingEvents} dict={dict} />
            
            {/* Secondary Event Sidebar */}
            <div className="reveal-card rounded-xl p-6 relative flex flex-col justify-between min-h-[400px] border border-outline-variant/10 bg-surface-container-low/30">
              <div>
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center mb-6 ghost-border-bottom">
                  <span className="material-symbols-outlined text-primary">groups</span>
                </div>
                <h4 className="text-xl font-headline font-bold text-on-surface mb-2">{secondaryEvent.title}</h4>
                <p className="text-sm font-body text-on-surface-variant">{secondaryEvent.short_description || secondaryEvent.description}</p>
              </div>
              <div className="mt-8 space-y-3">
                <div className="flex items-center justify-between text-sm text-on-surface-variant bg-surface-container-lowest px-4 py-3 rounded-lg ghost-border-bottom">
                  <span>{formatDate(secondaryEvent.date_start)}</span>
                  <span>{formatTime(secondaryEvent.date_start)}</span>
                </div>
                <Link href={`/evenement/${secondaryEvent.id}`} className="block">
                  <button className="w-full py-3 rounded-lg border border-outline-variant/30 text-on-surface font-label text-sm hover:bg-tertiary hover:text-on-tertiary transition-all">
                    RSVP
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
