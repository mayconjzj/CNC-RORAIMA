"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type ArticleBackLinkProps = {
  slug: string;
};

export default function ArticleBackLink({ slug }: ArticleBackLinkProps) {
  const router = useRouter();

  useEffect(() => {
    // Next.js can preserve the previous scroll position during client navigation.
    // Each article slug should start at the top of its own page.
    window.scrollTo(0, 0);
  }, [slug]);

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/noticias");
  }

  return (
    <button
      type="button"
      onClick={goBack}
      style={{
        padding: 0,
        border: 0,
        background: "transparent",
        color: "#b90018",
        fontWeight: 700,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      ← Voltar
    </button>
  );
}
