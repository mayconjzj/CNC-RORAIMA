import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { ArticleSummary } from "@/lib/db";
import { shouldOptimizeImage } from "@/lib/media";
import { formatNewsDate } from "@/lib/news-date";

type StoryCardProps = {
  story: ArticleSummary;
  compact?: boolean;
};

export function StoryCard({ story, compact = false }: StoryCardProps) {
  const category = story.category_name || "NOTÍCIAS";

  return (
    <article className={`story-card${compact ? " compact" : ""}`}>
      <Link className="story-image" href={`/noticias/${story.slug}`} aria-label={story.title}>
        {story.featured_image_url ? (
          <Image
            src={story.featured_image_url}
            alt=""
            fill
            sizes={compact ? "(max-width: 850px) 50vw, 25vw" : "(max-width: 560px) 100vw, (max-width: 850px) 50vw, 25vw"}
            unoptimized={!shouldOptimizeImage(story.featured_image_url)}
            priority={!compact && story.is_featured}
            loading={!compact && story.is_featured ? undefined : "lazy"}
          />
        ) : <span className="story-image-fallback" aria-hidden="true" />}
        <span className="category-tag">{category}</span>
      </Link>
      <div className="story-copy">
        <h3><Link href={`/noticias/${story.slug}`}>{story.title}</Link></h3>
        <span className="story-time"><Clock3 size={13} aria-hidden="true" /> {formatNewsDate(story.published_at)}</span>
      </div>
    </article>
  );
}
