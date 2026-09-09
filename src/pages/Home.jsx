import React from "react";
import { Link2, BadgeCheck, FlaskConical, Wind, Dumbbell, Dna, Piano, Drum, NotebookPen, FolderOpen, Briefcase, GraduationCap, MapPin, Mail, Camera, Languages, Guitar, Telescope, RadioTower, Motorbike, BriefcaseBusiness } from "lucide-react";
import { GitHubLight, LinkedIn } from "developer-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Lego from "@/lib/LegoSuit";
import { Link } from "react-router-dom";

const interestsData = [
  {
    id: "motorcycles",
    category: "hobbies",
    title: "Motorcycles",
    icon: Motorbike,
  },
  {
    id: "skydiving",
    category: "hobbies",
    title: "Skydiving",
    icon: Wind,
  },
  {
    id: "sports",
    category: "hobbies",
    title: "Sports & Athletics",
    icon: Dumbbell,
  },
  {
    id: "genetic-engineering",
    category: "hobbies",
    title: "Genetic Engineering",
    icon: Dna,
  },
  {
    id: "photography",
    category: "hobbies",
    title: "Photography",
    icon: Camera,
  },
  {
    id: "amateur-radio",
    category: "hobbies",
    title: "Amateur Radio",
    icon: RadioTower,
  },
  {
    id: "radio-astronomy",
    category: "hobbies",
    title: "Radio Astronomy",
    icon: Telescope,
  },
  {
    id: "piano",
    category: "music",
    title: "Piano",
    icon: Piano,
  },
  {
    id: "guitar",
    category: "music",
    title: "Guitar",
    icon: Guitar,
  },
  {
    id: "drums",
    category: "music",
    title: "Drums",
    icon: Drum,
  },
  {
    id: "turkish",
    category: "languages",
    title: "Turkish",
    icon: Languages,
  },
  {
    id: "english",
    category: "languages",
    title: "English",
    icon: Languages,
  },
  {
    id: "japanese",
    category: "languages",
    title: "Japanese",
    icon: Languages,
  },
  {
    id: "polish",
    category: "languages",
    title: "Polish",
    icon: Languages,
  },
];

export default function Home() {
  const categories = ["hobbies", "languages", "music"];

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-96 h-96 sm:w-2/3 sm:h-2/3 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-8 lg:gap-12 z-10 w-full max-w-6xl justify-center">
        {/* --- LEFT CARD --- */}
        <Card className="w-full max-w-lg flex flex-col shrink-0 overflow-hidden shadow-2xl border-border bg-card relative p-0">
          {/* Top Banner */}
          <div className="relative flex h-48 shrink-0 flex-col items-center justify-between overflow-hidden border-b-2 border-border/50 bg-gradient-to-b from-accent via-accent/60 to-card">
            {/* soft glow behind the subject */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_35%,var(--primary)/18%,transparent_70%)]" />

            {/* subtle top light */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/[0.04] to-transparent" />

            {/* Image container */}
            <div className="relative w-[85%] max-w-[18rem] sm:max-w-sm aspect-[7/4] -mt-[5%] mx-auto">
              <img src="/mike.webp" className="w-[66%] absolute -left-[8%] -top-[4%] brightness-90 object-contain rotate-10 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]" alt="Mike" />
              <img src="/patrick.webp" className="w-[66%] absolute -right-[8%] -top-[10%] object-contain -rotate-6 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]" alt="Patrick" />
            </div>

            {/* fade into the card body */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />

            <div className="absolute bottom-6 right-6 flex items-center gap-4">
              <a href="https://www.linkedin.com/in/orkunyigitcengiz/" className="group">
                <LinkedIn className="size-5 text-foreground group-hover:scale-95 transition-transform cursor-pointer" />
              </a>
              <a href="https://www.researchgate.net/scientific-contributions/Orkun-Yigit-Cengiz-2367882007" className="group">
                <div className="size-5 text-foreground invert group-hover:scale-95 transition-transform cursor-pointer">
                  <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <title>ResearchGate</title>
                    <path d="M19.586 0c-.818 0-1.508.19-2.073.565-.563.377-.97.936-1.213 1.68a3.193 3.193 0 0 0-.112.437 8.365 8.365 0 0 0-.078.53 9 9 0 0 0-.05.727c-.01.282-.013.621-.013 1.016a31.121 31.123 0 0 0 .014 1.017 9 9 0 0 0 .05.727 7.946 7.946 0 0 0 .077.53h-.005a3.334 3.334 0 0 0 .113.438c.245.743.65 1.303 1.214 1.68.565.376 1.256.564 2.075.564.8 0 1.536-.213 2.105-.603.57-.39.94-.916 1.175-1.65.076-.235.135-.558.177-.93a10.9 10.9 0 0 0 .043-1.207v-.82c0-.095-.047-.142-.14-.142h-3.064c-.094 0-.14.047-.14.141v.956c0 .094.046.14.14.14h1.666c.056 0 .084.03.084.086 0 .36 0 .62-.036.865-.038.244-.1.447-.147.606-.108.385-.348.664-.638.876-.29.212-.738.35-1.227.35-.545 0-.901-.15-1.21-.353-.306-.203-.517-.454-.67-.915a3.136 3.136 0 0 1-.147-.762 17.366 17.367 0 0 1-.034-.656c-.01-.26-.014-.572-.014-.939a26.401 26.403 0 0 1 .014-.938 15.821 15.822 0 0 1 .035-.656 3.19 3.19 0 0 1 .148-.76 1.89 1.89 0 0 1 .742-1.01c.344-.244.593-.352 1.137-.352.508 0 .815.096 1.144.303.33.207.528.492.764.925.047.094.111.118.198.07l1.044-.43c.075-.048.09-.115.042-.199a3.549 3.549 0 0 0-.466-.742 3 3 0 0 0-.679-.607 3.313 3.313 0 0 0-.903-.41A4.068 4.068 0 0 0 19.586 0zM8.217 5.836c-1.69 0-3.036.086-4.297.086-1.146 0-2.291 0-3.007-.029v.831l1.088.2c.744.144 1.174.488 1.174 2.264v11.288c0 1.777-.43 2.12-1.174 2.263l-1.088.2v.832c.773-.029 2.12-.086 3.465-.086 1.29 0 2.951.057 3.667.086v-.831l-1.49-.2c-.773-.115-1.174-.487-1.174-2.264v-4.784c.688.057 1.29.057 2.206.057 1.748 3.123 3.41 5.472 4.355 6.56.86 1.032 2.177 1.691 3.839 1.691.487 0 1.003-.086 1.318-.23v-.744c-1.031 0-2.063-.716-2.808-1.518-1.26-1.376-2.95-3.582-4.355-6.074 2.32-.545 4.04-2.722 4.04-4.9 0-3.208-2.492-4.698-5.758-4.698zm-.515 1.29c2.406 0 3.839 1.26 3.839 3.552 0 2.263-1.547 3.782-4.097 3.782-.974 0-1.404-.03-2.063-.086v-7.19c.66-.059 1.547-.059 2.32-.059z" />
                  </svg>
                </div>
              </a>
              <a href="https://github.com/OryCore" className="group">
                <GitHubLight className="size-5 text-foreground group-hover:scale-95 transition-transform cursor-pointer" />
              </a>
            </div>
          </div>

          {/* Profile Avatar */}
          <div className="absolute top-38 -translate-y-1/2 left-6 sm:left-8 size-38 rounded-3xl z-10 shadow-md border-4 border-card bg-muted overflow-hidden flex items-center justify-center">
            <img src="portrait.jpg" alt="Orkun Yiğit Cengiz" className="w-full h-full object-cover object-[0_-6px]" />
          </div>

          {/* Bottom Content */}
          <CardContent className="bg-card text-card-foreground p-6 sm:p-8 pt-16 flex flex-col flex-1 border-t-0">
            {/* Header & Bio */}
            <div className="flex flex-col gap-1 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                Orkun Yiğit Cengiz
                <BadgeCheck className="fill-blue-500 text-card" size={24} />
              </h1>
              <p className="text-muted-foreground text-sm font-medium">@professional dumbass</p>
            </div>
            <p className="text-foreground text-sm leading-relaxed mb-6">Hi, I am an Engineer and Scientist. Passionate about building robust systems and research.</p>

            {/* Info */}
            <div className="mb-8 divide-y divide-border/40 border-y border-border/40">
              <div className="flex gap-3.5 py-4">
                <BriefcaseBusiness className="mt-0.5 size-4.5 shrink-0 text-muted-foreground/80" />
                <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 leading-snug">
                  <span className="text-sm font-medium">CTO &amp; Co-Founder</span>
                  <span className="text-xs text-muted-foreground/60">at</span>
                  <a href="https://tradescove.com" target="_blank" className="text-sm hover:underline font-medium text-primary">
                    TradesCove
                  </a>
                  <span className="text-xs text-muted-foreground/60">&amp;</span>
                  <a href="https://briefcat.pl" target="_blank" className="text-sm hover:underline font-medium text-primary">
                    BriefCat
                  </a>
                </div>
              </div>

              <div className="flex gap-3.5 py-4">
                <GraduationCap className="mt-0.5 size-4.5 shrink-0 text-muted-foreground/80" />
                <div className="min-w-0 flex-1 leading-snug">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium">Politechnika Wrocławska</span>
                    <span className="text-[11px] text-muted-foreground/60 tabular-nums">2021 &ndash; 2026</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Electronics &amp; Computer Engineering</p>
                </div>
              </div>
            </div>

            {/* Dynamic Tabs for Personal Interests */}
            <Tabs defaultValue="hobbies" className="w-full mb-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="hobbies">Hobbies</TabsTrigger>
                <TabsTrigger value="languages">Languages</TabsTrigger>
                <TabsTrigger value="music">Music</TabsTrigger>
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-4 flex gap-2 flex-wrap">
                  {interestsData
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <Button variant="outline" size="sm" className="gap-2 rounded-full">
                        <item.icon className="size-3.5" />
                        {item.title}
                      </Button>
                    ))}
                </TabsContent>
              ))}
            </Tabs>

            <h3 className="w-full py-3 text-xl text-center font-semibold">Check out my work</h3>
            {/* Navigation & Links */}
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {[
                {
                  to: "/lab?tab=projects",
                  Icon: FolderOpen,
                  label: "Projects",
                  cls: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-400 hover:bg-sky-500/20",
                },
                {
                  to: "/lab?tab=research",
                  Icon: FlaskConical,
                  label: "Research",
                  cls: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20",
                },
                {
                  to: "/lab?tab=journal",
                  Icon: NotebookPen,
                  label: "Journal",
                  cls: "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-400 hover:bg-violet-500/20",
                },
              ].map(({ to, Icon, label, cls }) => (
                <Link key={to} to={to} className={`flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-3 transition-all duration-300 ${cls}`}>
                  <Icon className="size-5" strokeWidth={1.5} />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              ))}
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <a href="https://tradescove.com" target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                <Link2 className="size-3.5" />
                tradescove.com
              </a>
              <span className="text-muted-foreground/40">·</span>
              <a href="https://briefcat.pl" target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                <Link2 className="size-3.5" />
                briefcat.pl
              </a>
              <span className="text-muted-foreground/40">·</span>
              <a href="https://neurex.tradescove.com/" target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                <Link2 className="size-3.5" />
                neurex<sub>by TradesCove</sub>
              </a>
            </div>

            {/* Footer / Contact Section */}
            <div className="mt-auto pt-6 border-t border-border/50 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">© 2026 Orkun Yiğit Cengiz • 100% cookie-free.</p>
                <Button asChild className="rounded-full shadow-sm" size="sm">
                  <a className="flex items-center gap-2" href="mailto:orkuny.research@gmail.com">
                    <Mail className="size-4" />
                    Get in touch
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- RIGHT CARD --- */}
        <Card className="overflow-visible w-full min-w-[320px] max-w-[500px] rounded-radius border-2 border-border bg-card/40 shadow-sm p-0 relative flex items-center justify-center mt-6 sm:mt-0">
          <Lego className="w-full h-full object-contain opacity-80" />

          <div
            style={{
              fontFamily: "'Arial Black', sans-serif",
              boxShadow: "0 8px 12px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.6)",
            }}
            className="
      absolute z-50 pointer-events-none bg-linear-to-l text-[#1a1a1a] font-black
      from-lime-200 dark:from-lime-300 to-green-400 dark:to-green-500 
      border-3 border-green-500 dark:border-green-600 outline-dashed
      
      /* Mobile First: Smaller size, snapped inside the card to prevent overflow */
      -top-5 -right-3 
      text-sm px-3 py-3 rounded-xl 
      rotate-16 outline-2 outline-offset-2
      
      /* Tablet (sm): Medium size, starts pushing slightly outside */
      sm:-top-3 sm:-right-4 
      sm:text-base sm:px-4 sm:py-5 sm:rounded-2xl 
      sm:rotate-16 sm:outline-3 sm:outline-offset-3
      
      /* Desktop (md): Original large size, fully pushed out to -12% */
      md:top-[0%] md:-right-[12%] 
      md:text-[1.25rem] md:px-[1rem] md:py-[1.8rem] md:rounded-[1rem] 
      md:rotate-16 md:outline-4 md:outline-offset-4
    "
          >
            Move Me Around!
          </div>
        </Card>
      </div>
    </div>
  );
}
