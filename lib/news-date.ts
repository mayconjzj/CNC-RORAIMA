const BOA_VISTA_TIME_ZONE = "America/Boa_Vista";

export function formatNewsDate(value: string | Date | null): string {
  if (!value) return "Data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";

  const elapsedSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (elapsedSeconds < 0) {
    const minutes = Math.ceil(Math.abs(elapsedSeconds) / 60);
    return minutes < 60 ? `em ${minutes} min` : "em breve";
  }
  if (elapsedSeconds < 60) return "há menos de um minuto";
  if (elapsedSeconds < 3600) return `há ${Math.floor(elapsedSeconds / 60)} min`;
  if (elapsedSeconds < 86400) {
    const hours = Math.floor(elapsedSeconds / 3600);
    return hours === 1 ? "há 1 hora" : `há ${hours} horas`;
  }

  return date.toLocaleString("pt-BR", {
    timeZone: BOA_VISTA_TIME_ZONE,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hasArticleBeenUpdated(publishedAt: string | Date | null, updatedAt: string | Date | null): boolean {
  if (!publishedAt || !updatedAt) return false;
  const published = new Date(publishedAt).getTime();
  const updated = new Date(updatedAt).getTime();
  return Number.isFinite(published) && Number.isFinite(updated) && updated - published > 60_000;
}

export function formatArticleTimestamp(value: string | Date, action: "Publicado" | "Atualizado"): string {
  const formatted = formatNewsDate(value);
  return formatted.startsWith("há ") || formatted.startsWith("em ")
    ? `${action} ${formatted}`
    : `${action} em ${formatted}`;
}
