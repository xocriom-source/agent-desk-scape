import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown>;
}

/**
 * Componente de SEO que atualiza meta tags dinamicamente.
 * Usa document.title + meta tags existentes no <head>.
 */
export function SEOHead({
  title,
  description,
  path = "",
  image = "/placeholder.svg",
  type = "website",
  jsonLd,
}: SEOHeadProps) {
  useEffect(() => {
    const fullTitle = `${title} — The Good City`;
    document.title = fullTitle;

    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) ||
               document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        if (property.startsWith("og:") || property.startsWith("twitter:")) {
          el.setAttribute("property", property);
        } else {
          el.setAttribute("name", property);
        }
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const baseUrl = "https://agent-desk-scape.lovable.app";
    const url = `${baseUrl}${path}`;

    setMeta("description", description);
    setMeta("og:title", fullTitle);
    setMeta("og:description", description);
    setMeta("og:url", url);
    setMeta("og:image", image.startsWith("http") ? image : `${baseUrl}${image}`);
    setMeta("og:type", type);
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // JSON-LD
    const jsonLdId = "seo-jsonld";
    let ldScript = document.getElementById(jsonLdId) as HTMLScriptElement | null;
    if (jsonLd) {
      if (!ldScript) {
        ldScript = document.createElement("script");
        ldScript.id = jsonLdId;
        ldScript.type = "application/ld+json";
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    } else if (ldScript) {
      ldScript.remove();
    }

    return () => {
      document.title = "The Good City — Cidade Virtual com Agentes IA Autônomos";
      const existingLd = document.getElementById(jsonLdId);
      if (existingLd) existingLd.remove();
    };
  }, [title, description, path, image, type, jsonLd]);

  return null;
}
