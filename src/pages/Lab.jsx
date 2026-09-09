// src/pages/Lab.jsx
import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Calendar, ExternalLink, Search, ChevronLeft, ChevronRight, FileText, User, Copy, Check, BookOpen } from "lucide-react";
import { GitHubDark } from "developer-icons";
import { Button } from "@/components/ui/button";
import { AsciiObject } from "@/components/AsciiObject";
import { createMarkdown } from "@/lib/marktheme";

const ITEMS_PER_PAGE = 4; // Restored to original spacious count

// --- Dynamic Content Loader ---
const rawModules = import.meta.glob("/content/*/*/entry.md", { query: "?raw", import: "default", eager: true });
const mediaModules = import.meta.glob("/content/*/*/*.{webp,webm,mp4,png,jpg,jpeg,gif,avif}", { eager: true, import: "default" });

const loadEntries = () => {
  return Object.entries(rawModules).map(([path, content]) => {
    const parts = path.split("/");
    const category = parts[2];
    const id = parts[3];
    const folderPath = `/content/${category}/${id}/`;

    const meta = {};
    const match = content.match(/---\r?\n([\s\S]*?)\r?\n---/);

    if (match) {
      const lines = match[1].split(/\r?\n/);
      let currentKey = null;
      let currentVal = "";

      lines.forEach((line) => {
        const keyMatch = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
        if (keyMatch) {
          if (currentKey) meta[currentKey] = cleanValue(currentVal);
          currentKey = keyMatch[1].toLowerCase();
          currentVal = keyMatch[2];
        } else if (currentKey && line.trim()) {
          currentVal += " " + line.trim();
        }
      });
      if (currentKey) meta[currentKey] = cleanValue(currentVal);
    }

    function cleanValue(val) {
      let v = val.trim();
      if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
      if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
      if (v.startsWith("[") && v.endsWith("]")) {
        return v
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
      }
      return v;
    }

    meta.tags = Array.isArray(meta.tags)
      ? meta.tags
      : meta.tags
        ? String(meta.tags)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    let cleanContent = match ? content.replace(/---\r?\n[\s\S]*?\r?\n---/, "") : content;

    cleanContent = cleanContent.replace(/\]\(([^)]+\.(webp|webm|mp4|png|jpg|jpeg|gif|avif))\)/gi, (fullMatch, filename) => {
      const cleanName = filename.replace(/^\.\//, "");
      const resolvedUrl = mediaModules[`${folderPath}${cleanName}`];
      return resolvedUrl ? `](${resolvedUrl})` : fullMatch;
    });

    const badgeUrl = mediaModules[`${folderPath}badge.webp`] || null;

    return { id, category, meta, content: cleanContent, badgeUrl };
  });
};

const ANCHOR_CSS = `
  .md :is(h1, h2, h3, h4, h5, h6)[id] { scroll-margin-top: 10rem; }
  .md [id^="fn-"] { scroll-margin-top: 1.5rem; }
  .md [id^="ref-"] { scroll-margin-top: 10rem; }
  @media (prefers-reduced-motion: no-preference) {
    html { scroll-behavior: smooth; }
  }
`;
/** DOIs may be bare (`10.1000/xyz`) or already a URL. */
const doiUrl = (raw) => {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  if (/^https?:/i.test(v)) return v;
  return `https://doi.org/${v.replace(/^doi:\s*/i, "")}`;
};

const DoiIcon = (props) => (
  <div className="grayscale">
    <svg role="img" viewBox="0 0 24 24" fill="#FAB70C" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>DOI</title>
      <path d="M24 12c0 6.633-5.367 12-12 12S0 18.633 0 12 5.367 0 12 0s12 5.367 12 12ZM7.588 6.097v4.471c-.663-.925-1.403-1.373-2.406-1.373-2.046 0-3.244 1.441-3.244 3.847 0 2.357 1.325 3.848 3.166 3.848 1.12 0 1.88-.4 2.445-1.325l-.039 1.042h2.045V6.097Zm-1.763 8.942c-1.12 0-1.802-.76-1.802-2.045 0-1.325.682-2.085 1.802-2.085 1.081 0 1.802.76 1.802 2.085 0 1.285-.672 2.045-1.802 2.045Zm12.253-1.948c0-2.172-1.578-3.789-3.906-3.789-2.328 0-3.945 1.695-3.945 3.789 0 2.133 1.578 3.789 3.945 3.789 2.289 0 3.906-1.656 3.906-3.789Zm-2.094-.01c0 1.14-.711 1.89-1.851 1.89-1.139 0-1.851-.75-1.851-1.89 0-1.139.712-1.89 1.851-1.89 1.149 0 1.861.751 1.851 1.89Zm2.6-5.795c0 .633.517 1.227 1.189 1.227.633 0 1.188-.555 1.188-1.227a1.17 1.17 0 0 0-1.188-1.189c-.672 0-1.179.556-1.189 1.189Zm.166 9.341h2.055V9.604H18.75Z" />
    </svg>
  </div>
);

const ResearchGateIcon = (props) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
    <title>ResearchGate</title>
    <path d="M19.586 0c-.818 0-1.508.19-2.073.565-.563.377-.97.936-1.213 1.68a3.193 3.193 0 0 0-.112.437 8.365 8.365 0 0 0-.078.53 9 9 0 0 0-.05.727c-.01.282-.013.621-.013 1.016a31.121 31.123 0 0 0 .014 1.017 9 9 0 0 0 .05.727 7.946 7.946 0 0 0 .077.53h-.005a3.334 3.334 0 0 0 .113.438c.245.743.65 1.303 1.214 1.68.565.376 1.256.564 2.075.564.8 0 1.536-.213 2.105-.603.57-.39.94-.916 1.175-1.65.076-.235.135-.558.177-.93a10.9 10.9 0 0 0 .043-1.207v-.82c0-.095-.047-.142-.14-.142h-3.064c-.094 0-.14.047-.14.141v.956c0 .094.046.14.14.14h1.666c.056 0 .084.03.084.086 0 .36 0 .62-.036.865-.038.244-.1.447-.147.606-.108.385-.348.664-.638.876-.29.212-.738.35-1.227.35-.545 0-.901-.15-1.21-.353-.306-.203-.517-.454-.67-.915a3.136 3.136 0 0 1-.147-.762 17.366 17.367 0 0 1-.034-.656c-.01-.26-.014-.572-.014-.939a26.401 26.403 0 0 1 .014-.938 15.821 15.822 0 0 1 .035-.656 3.19 3.19 0 0 1 .148-.76 1.89 1.89 0 0 1 .742-1.01c.344-.244.593-.352 1.137-.352.508 0 .815.096 1.144.303.33.207.528.492.764.925.047.094.111.118.198.07l1.044-.43c.075-.048.09-.115.042-.199a3.549 3.549 0 0 0-.466-.742 3 3 0 0 0-.679-.607 3.313 3.313 0 0 0-.903-.41A4.068 4.068 0 0 0 19.586 0zM8.217 5.836c-1.69 0-3.036.086-4.297.086-1.146 0-2.291 0-3.007-.029v.831l1.088.2c.744.144 1.174.488 1.174 2.264v11.288c0 1.777-.43 2.12-1.174 2.263l-1.088.2v.832c.773-.029 2.12-.086 3.465-.086 1.29 0 2.951.057 3.667.086v-.831l-1.49-.2c-.773-.115-1.174-.487-1.174-2.264v-4.784c.688.057 1.29.057 2.206.057 1.748 3.123 3.41 5.472 4.355 6.56.86 1.032 2.177 1.691 3.839 1.691.487 0 1.003-.086 1.318-.23v-.744c-1.031 0-2.063-.716-2.808-1.518-1.26-1.376-2.95-3.582-4.355-6.074 2.32-.545 4.04-2.722 4.04-4.9 0-3.208-2.492-4.698-5.758-4.698zm-.515 1.29c2.406 0 3.839 1.26 3.839 3.552 0 2.263-1.547 3.782-4.097 3.782-.974 0-1.404-.03-2.063-.086v-7.19c.66-.059 1.547-.059 2.32-.059z" />
  </svg>
);

const ENTRY_LINKS = [
  { key: "githuburl", label: "View Source", Icon: GitHubDark, iconClass: "size-4 dark:invert" },
  { key: "demourl", label: "Live Demo", Icon: ExternalLink },
  { key: "paperurl", label: "Read Paper", Icon: BookOpen },
  { key: "researchgateurl", label: "ResearchGate", Icon: ResearchGateIcon },
  { key: "doi", label: "DOI", Icon: DoiIcon, resolve: doiUrl },
];
function useHeadings(containerRef, html) {
  const [headings, setHeadings] = useState([]);

  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const label = (node) => {
      const clone = node.cloneNode(true);
      clone.querySelectorAll("a").forEach((a) => {
        const text = (a.textContent || "").trim();
        const isMarker = !text || /^[#¶§🔗]+$/.test(text) || /anchor|permalink|headerlink/i.test(a.getAttribute("class") || "");
        if (isMarker) a.remove();
      });
      const stripped = (clone.textContent || "").replace(/\s+/g, " ").trim();
      if (stripped) return stripped;
      return (node.textContent || "")
        .replace(/[#¶§🔗]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const used = new Set();
    const found = [...root.querySelectorAll("h2, h3")]
      .filter((node) => !node.closest(".footnotes"))
      .map((node, index) => {
        const text = label(node) || `Section ${index + 1}`;
        let id = node.id;
        if (!id || used.has(id)) {
          const base =
            text
              .toLowerCase()
              .replace(/[^\w\u00C0-\u024F]+/g, "-")
              .replace(/^-+|-+$/g, "") || "section";
          id = base;
          let n = 1;
          while (used.has(id)) id = `${base}-${n++}`;
          node.id = id;
        }
        used.add(id);
        return { id, text, level: node.tagName === "H3" ? 3 : 2 };
      });

    setHeadings(found);
  }, [containerRef, html]);

  return headings;
}

// --- Detail Pane Reading View ---
const ReadingView = ({ entry, onBack }) => {
  const [copied, setCopied] = useState(false);
  const proseRef = useRef(null);

  const handleCopyBibtex = () => {
    if (entry.meta.bibtex) {
      navigator.clipboard.writeText(entry.meta.bibtex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const md = useMemo(() => {
    try {
      return createMarkdown({ theme: "petrol", darkTheme: "inherit", prefix: "md" });
    } catch (e) {
      return { css: "", render: () => ({ html: "<p>Theme error</p>", headings: [] }) };
    }
  }, []);

  const parsed = useMemo(() => {
    try {
      let result = md.render(String(entry.content));
      if (result && result.html) {
        result.html = result.html.replace(/<img[^>]+src=["']([^"']+\.(webm|mp4))["'][^>]*>/gi, (match, url, ext) => {
          return `<video width="100%" controls controlslist="nodownload noplaybackrate noremoteplayback" disablePictureInPicture disableRemotePlayback playsInline oncontextmenu="return false;" style="border-radius: 12px; margin: 2rem 0; border: 1px solid var(--border); box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1);"><source src="${url}" type="video/${ext}" /></video>`;
        });
      }
      return result;
    } catch (err) {
      return { html: `<p class="text-destructive">Error parsing markdown.</p>`, headings: [] };
    }
  }, [entry.content, md]);

  const headings = useHeadings(proseRef, parsed.html);

  useLayoutEffect(() => {
    const parentPane = document.getElementById("right-scroll-pane");
    if (parentPane) parentPane.scrollTo(0, 0);
  }, [entry.id]);

  return (
    <div className="w-full h-full flex flex-col items-center animate-in fade-in duration-500 pb-[30vh]">
      {md.css && <style dangerouslySetInnerHTML={{ __html: String(md.css) }} />}
      <style dangerouslySetInnerHTML={{ __html: ANCHOR_CSS }} />

      <div className="w-full max-w-[80rem] px-6 lg:px-12 py-12 lg:py-16">
        {/* Mobile Back Button */}
        <Button variant="ghost" onClick={onBack} className="lg:hidden mb-10 gap-2 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to Lab
        </Button>

        {/* --- HEADER SECTION --- */}
        <div className="w-full max-w-5xl mb-12 pb-10 border-b border-border/30">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-tight max-w-5xl">{entry.meta.title || entry.id}</h1>
            {entry.badgeUrl && <img src={entry.badgeUrl} alt={`${entry.id} badge`} className="size-20 sm:size-24 object-contain drop-shadow-xl shrink-0" />}
          </div>

          {entry.meta.description && <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-4xl leading-relaxed">{entry.meta.description}</p>}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-mono uppercase tracking-wider text-muted-foreground mb-8">
            {entry.category && <span className="text-primary font-bold">{entry.category}</span>}
            {entry.meta.date && (
              <span className="flex items-center gap-2">
                <Calendar className="size-4" /> {entry.meta.date}
              </span>
            )}
            {(entry.meta.author || entry.meta.role) && (
              <span className="flex items-center gap-2">
                <User className="size-4" /> {entry.meta.author || entry.meta.role}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            {ENTRY_LINKS.map(({ key, label, Icon, iconClass, resolve }) => {
              const href = resolve ? resolve(entry.meta[key]) : entry.meta[key];
              if (!href) return null;
              return (
                <Button key={key} variant="outline" className="gap-2 rounded-full border-border/40 hover:bg-muted/30" onClick={() => window.open(href, "_blank", "noopener,noreferrer")}>
                  <Icon className={iconClass || "size-4"} /> {label}
                </Button>
              );
            })}
            {entry.category === "research" && entry.meta.bibtex && (
              <Button variant="outline" className="gap-2 rounded-full border-border/40 hover:bg-muted/30" onClick={handleCopyBibtex}>
                {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                {copied ? "Copied to Clipboard" : "Cite (BibTeX)"}
              </Button>
            )}
          </div>
        </div>

        {/* --- CONTENT & TOC SECTION --- */}
        <div className="w-full max-w-5xl flex flex-col xl:flex-row gap-12 relative items-start">
          <div className="flex-1 w-full min-w-0">
            {headings.length > 0 && (
              <details className="xl:hidden mb-10 rounded-2xl border border-border/40 bg-muted/10 px-5 py-4">
                <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-muted-foreground">On this page</summary>
                <nav className="mt-4 flex flex-col gap-3 border-l border-border/40 pl-4">
                  {headings.map((h) => (
                    <a key={h.id} href={`#${h.id}`} className={`block break-words text-sm leading-snug text-muted-foreground ${h.level === 2 ? "font-medium" : "ml-3"}`}>
                      {h.text}
                    </a>
                  ))}
                </nav>
              </details>
            )}

            <div ref={proseRef} className="md prose prose-neutral dark:prose-invert w-full prose-headings:tracking-tight prose-a:text-primary" style={{ maxWidth: "none" }} dangerouslySetInnerHTML={{ __html: parsed.html || "" }} />
          </div>

          {/* Right Sticky TOC */}
          <div className="hidden xl:block w-64 shrink-0 min-w-0 sticky top-12 self-start">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">On this page</h4>
            <nav className="md-toc flex flex-col gap-3 border-l border-border/40 pl-5 pr-1 max-h-[calc(100vh-9rem)] overflow-y-auto overscroll-contain">
              {headings.length > 0 ? (
                headings.map((h) => (
                  <a key={h.id} href={`#${h.id}`} className={`block break-words text-sm leading-snug text-muted-foreground transition-colors hover:text-foreground ${h.level === 2 ? "font-medium mt-2" : "ml-3"}`}>
                    {h.text}
                  </a>
                ))
              ) : (
                <span className="text-sm text-muted-foreground/50">No sections found.</span>
              )}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Lab() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [entries, setEntries] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLight, setIsLight] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsLight(!root.classList.contains("dark"));
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const activeTab = searchParams.get("tab") || "research";

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const handleTabChange = (value) => {
    setSearchParams({ tab: value });
    setSelectedEntry(null); // Reset detail view on tab switch
  };

  const filteredEntries = useMemo(() => {
    let result = entries.filter((entry) => entry.category === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((entry) => {
        const titleMatch = (entry.meta.title || "").toLowerCase().includes(q);
        const descMatch = (entry.meta.description || "").toLowerCase().includes(q);
        const tagMatch = (entry.meta.tags || []).some((t) => String(t).toLowerCase().includes(q));
        return titleMatch || descMatch || tagMatch;
      });
    }
    return result;
  }, [entries, activeTab, searchQuery]);

  const totalPages = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-background overflow-hidden animate-in fade-in duration-700">
      {/* --- LEFT SIDEBAR (Original Spacious Layout) --- */}
      <div className={`w-full lg:w-[480px] xl:w-[550px] shrink-0 border-r border-border/30 flex flex-col h-full bg-background relative z-20 transition-all ${selectedEntry ? "hidden lg:flex" : "flex"}`}>
        {/* Header Controls */}
        <div className="p-8 lg:p-10 border-b border-border/30 shrink-0 flex flex-col gap-8">
          <Button variant="ghost" size="sm" className="w-fit gap-2 text-muted-foreground hover:text-foreground -ml-4" onClick={() => navigate("/")}>
            <ArrowLeft className="size-4" /> Home
          </Button>

          {/* Underlined Tabs */}
          <div className="flex items-center gap-6 border-b border-border/20 pb-1">
            {["research", "projects", "journal"].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`text-sm font-medium tracking-wide uppercase transition-all duration-300 pb-2 border-b-2 relative top-[1px] ${
                    isActive ? "text-foreground border-foreground" : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Rounded Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
            <input
              type="text"
              placeholder={`Search...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-full border border-border/40 bg-muted/10 text-sm focus:outline-none focus:border-primary/50 focus:bg-muted/20 transition-all placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Spacious List */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {paginatedEntries.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40 gap-4 min-h-[300px]">
              <FileText className="size-12 stroke-1" />
              <p className="text-sm font-medium">Nothing found matching your criteria.</p>
            </div>
          ) : (
            paginatedEntries.map((entry) => {
              const isSelected = selectedEntry?.id === entry.id;
              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`group cursor-pointer py-10 px-8 lg:px-10 border-b border-border/20 transition-all duration-300 flex flex-col gap-4 ${isSelected ? "bg-muted/30" : "hover:bg-muted/10"}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
                    {/* Title & Badge Row */}
                    <div className="flex items-center gap-3">
                      <h3 className={`font-bold text-2xl tracking-tight transition-colors duration-300 ${isSelected ? "text-primary" : "text-foreground/90 group-hover:text-primary"}`}>{entry.meta.title || entry.id}</h3>
                      {entry.badgeUrl && <img src={entry.badgeUrl} alt="Badge" className="size-8 object-contain drop-shadow-sm shrink-0" />}
                    </div>

                    {entry.meta.date && <span className="text-sm font-mono text-muted-foreground/60 shrink-0">{entry.meta.date}</span>}
                  </div>

                  <p className="text-base leading-relaxed text-muted-foreground/80 max-w-md line-clamp-2">{entry.meta.description || "No description provided."}</p>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <div className="flex flex-wrap gap-2">
                      {entry.meta.tags?.map((tag) => (
                        <span key={tag} className="text-[11px] px-3 py-1 rounded-full font-mono uppercase tracking-widest text-muted-foreground/80 bg-muted/30 border border-border/30 group-hover:border-border/60 transition-colors">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-muted-foreground/60">
                      {ENTRY_LINKS.map(({ key, label, Icon, iconClass, resolve }) => {
                        const href = resolve ? resolve(entry.meta[key]) : entry.meta[key];
                        if (!href) return null;
                        return (
                          <Icon
                            key={key}
                            aria-label={label}
                            className={`${iconClass || "size-5"} opacity-60 hover:opacity-100 hover:text-foreground transition-all cursor-pointer`}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(href, "_blank", "noopener,noreferrer");
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Elegant Pagination */}
        {totalPages > 1 && (
          <div className="p-6 lg:p-8 border-t border-border/30 shrink-0 flex items-center justify-between bg-background">
            <span className="text-sm font-mono text-muted-foreground/60">
              Page <span className="text-foreground">{currentPage}</span> of <span className="text-foreground">{totalPages}</span>
            </span>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-full size-10 text-muted-foreground hover:text-foreground hover:bg-muted/30">
                <ChevronLeft className="size-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-full size-10 text-muted-foreground hover:text-foreground hover:bg-muted/30">
                <ChevronRight className="size-5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* --- RIGHT CONTENT PANE (Hero or Detail) --- */}
      <div id="right-scroll-pane" className={`flex-1 h-full overflow-y-auto relative bg-background/50 ${!selectedEntry ? "hidden lg:block" : "block"}`}>
        {!selectedEntry ? (
          <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
            {/* Original Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Original Massive ASCII Object */}
            <div className="rotate-6 w-[500px] h-[600px] xl:w-[600px] xl:h-[700px] relative z-20 pointer-events-none flex items-center justify-center">
              <AsciiObject src="/models/Flask.glb" colored={true} invertColor={isLight} autoRotate={true} autoRotateSpeed={1.0} scale={3.8} className="w-full h-full opacity-80 drop-shadow-xl mix-blend-screen" />
            </div>
          </div>
        ) : (
          <ReadingView entry={selectedEntry} onBack={() => setSelectedEntry(null)} />
        )}
      </div>
    </div>
  );
}
