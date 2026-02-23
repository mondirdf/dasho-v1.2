import { useEffect } from "react";
import { BRAND, STRUCTURED_DATA } from "@/config/site";

interface SEOHeadProps {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
}

const SEOHead = ({ title, description, path = "/", noindex = false }: SEOHeadProps) => {
  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const url = `${BRAND.url}${path}`;

    setMeta("description", description);
    if (noindex) setMeta("robots", "noindex, nofollow");
    else setMeta("robots", "index, follow");

    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", url, "property");
    setMeta("og:image", BRAND.ogImage, "property");
    setMeta("og:type", "website", "property");

    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", description, "name");
    setMeta("twitter:image", BRAND.ogImage, "name");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    // JSON-LD
    let ld = document.getElementById("json-ld-seo") as HTMLScriptElement | null;
    if (!ld) {
      ld = document.createElement("script");
      ld.id = "json-ld-seo";
      ld.type = "application/ld+json";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify(STRUCTURED_DATA);
  }, [title, description, path, noindex]);

  return null;
};

export default SEOHead;
