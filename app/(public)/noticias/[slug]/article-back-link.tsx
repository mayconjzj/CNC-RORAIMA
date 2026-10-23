"use client";

import { useRouter } from "next/navigation";

export default function ArticleBackLink() {
  const router = useRouter();

  function goBack() {
    const hasInternalReferrer = (() => {
      try {
        return Boolean(
          document.referrer &&
            new URL(document.referrer).origin === window.location.origin,
        );
      } catch {
        return false;
      }
    })();

    if (window.history.length > 1 && hasInternalReferrer) {
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
