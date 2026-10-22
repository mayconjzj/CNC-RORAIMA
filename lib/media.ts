const OPTIMIZABLE_IMAGE_HOSTS = [".public.blob.vercel-storage.com"];

export function shouldOptimizeImage(source: string): boolean {
  try {
    const url = new URL(source);
    return url.protocol === "https:" &&
      OPTIMIZABLE_IMAGE_HOSTS.some((suffix) => url.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}
