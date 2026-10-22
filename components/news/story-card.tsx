import Image from "next/image";
import { Clock3 } from "lucide-react";
import type { ArticleSummary } from "@/lib/db";

type StoryCardProps = {
  story: ArticleSummary;
  compact?: boolean;
};

function formatPublishedDate(value: string | null, long = false) {
  if (!value) return "Atualizado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Atualizado";
  return date.toLocaleDateString("pt-BR", long
    ? { dateStyle: "long" }
    : { day: "2-digit", month: "short" });
}

export function StoryCard({ story, compact = false }: StoryCardProps) {
  const category = story.category_name || "NOTÍCIAS";

  return (
    <article className={`story-card${compact ? " compact" : ""}`}>
      <a className="story-image" href={`/noticias/${story.slug}`} aria-label={story.title}>
        {story.featured_image_url ? (
          <Image
            src={story.featured_image_url}
            alt=""
            fill
            sizes={compact ? "(max-width: 850px) 50vw, 25vw" : "(max-width: 560px) 100vw, (max-width: 850px) 50vw, 25vw"}
            unoptimized
            priority={!compact && story.is_featured}
          />
        ) : <span className="story-image-fallback" aria-hidden="true" />}
        <span className="category-tag">{category}</span>
      </a>
      <div className="story-copy">
        <h3><a href={`/noticias/${story.slug}`}>{story.title}</a></h3>
        <span className="story-time"><Clock3 size={13} aria-hidden="true" /> {formatPublishedDate(story.published_at)}</span>
      </div>
    </article>
  );
}
