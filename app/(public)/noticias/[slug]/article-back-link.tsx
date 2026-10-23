"use client";

import { useRouter } from "next/navigation";

export default function ArticleBackLink() {
  const router = useRouter();

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
