import { useAtom } from "jotai";
import { Link } from "react-router";
import { LayoutGrid, List as ListIcon } from "lucide-react";

import { formatDate, formatReadingTime, isoDate, prefetchEntry } from "@/lib/content";
import { listLayoutAtom } from "@/lib/atoms";
import { cn } from "@/lib/utils";
import { Picture } from "@/components/Media";

/**
 * The entry list, shared by all three sections.
 *
 * Hovering or focusing a link warms that entry's chunk, so by the time the
 * click lands the body is usually already parsed. It costs nothing on a miss
 * and removes the visible load on a hit.
 */
function useWarm(entry) {
  const warm = () => prefetchEntry(entry.section, entry.slug);
  return { onMouseEnter: warm, onFocus: warm, onTouchStart: warm };
}

function Row({ entry, to }) {
  const warm = useWarm(entry);

  return (
    <li>
      <Link to={to} {...warm} className="hover:bg-surface group -mx-4 flex flex-col gap-1 rounded-lg px-4 py-4 transition-colors sm:flex-row sm:items-baseline sm:gap-6">
        <div className="min-w-0 flex-1">
          <span className="group-hover:text-brand block font-medium transition-colors">{entry.title}</span>
          {entry.summary && <span className="text-muted-foreground mt-1 block text-sm">{entry.summary}</span>}
          {entry.tags?.length > 0 && (
            <span className="text-muted-foreground/70 mt-2 flex flex-wrap gap-2 font-mono text-xs">
              {entry.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </span>
          )}
        </div>

        <div className="text-muted-foreground shrink-0 font-mono text-xs sm:text-right">
          {entry.date && (
            <time dateTime={isoDate(entry.date)} className="block">
              {formatDate(entry.date)}
            </time>
          )}
          {entry.readingTime && <span className="mt-0.5 block opacity-70">{formatReadingTime(entry.readingTime)}</span>}
        </div>
      </Link>
    </li>
  );
}

function Card({ entry, to }) {
  const warm = useWarm(entry);

  return (
    <li>
      <Link to={to} {...warm} className="border-border hover:border-foreground/30 hover:bg-surface group flex h-full flex-col overflow-hidden rounded-lg border transition-colors">
        {entry.cover && <Picture image={entry.cover} alt="" sizes="(min-width: 768px) 340px, 100vw" className="aspect-[16/10] w-full" />}

        <div className="flex flex-1 flex-col p-4">
          <span className="group-hover:text-brand font-medium transition-colors">{entry.title}</span>
          {entry.summary && <span className="text-muted-foreground mt-1.5 line-clamp-3 text-sm">{entry.summary}</span>}
          <span className="text-muted-foreground/70 mt-auto pt-4 font-mono text-xs">{entry.date && <time dateTime={isoDate(entry.date)}>{formatDate(entry.date)}</time>}</span>
        </div>
      </Link>
    </li>
  );
}

export default function EntryList({ entries, section }) {
  const [layout, setLayout] = useAtom(listLayoutAtom);

  // Cards need images to justify themselves. If nothing in this section has a
  // cover, the grid is just a list with more whitespace, so it is not offered.
  const anyCovers = entries.some((entry) => entry.cover);
  const grid = anyCovers && layout === "grid";

  return (
    <div>
      {anyCovers && (
        <div className="mb-4 flex justify-end gap-1">
          {[
            { value: "list", Icon: ListIcon, label: "List view" },
            { value: "grid", Icon: LayoutGrid, label: "Grid view" },
          ].map(({ value, Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLayout(value)}
              aria-label={label}
              aria-pressed={layout === value}
              className={cn("rounded-md border p-1.5 transition-colors", layout === value ? "border-border bg-accent text-foreground" : "text-muted-foreground hover:text-foreground border-transparent")}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      <ul className={cn(grid ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "divide-hairline divide-y")}>
        {entries.map((entry) => {
          const to = `${section.path}/${entry.slug}`;
          return grid ? <Card key={entry.slug} entry={entry} to={to} /> : <Row key={entry.slug} entry={entry} to={to} />;
        })}
      </ul>
    </div>
  );
}
