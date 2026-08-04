import React, { useEffect } from "react";
import { Article } from "../types";
import { getArticleUrl } from "../lib/slug";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  article?: Article | null;
  categoryName?: string;
  authorName?: string;
  pageTitle?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description,
  image,
  url,
  type = "website",
  article,
  categoryName,
  authorName,
  pageTitle,
  breadcrumbs
}) => {
  useEffect(() => {
    const siteName = "सारादेश";
    const defaultDomain = "https://saradesh.in";
    const defaultImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop";
    const defaultDescription = "सारादेश पर पढ़ें भारत, राज्य, दुनिया, राजनीति, खेल, व्यापार, मनोरंजन, टेक्नोलॉजी और अन्य श्रेणियों की ताज़ा और विश्वसनीय हिंदी खबरें।";

    let metaTitle = `${siteName} - ताज़ा हिंदी समाचार`;
    let metaDescription = defaultDescription;
    let metaImage = defaultImage;
    let currentUrl = defaultDomain;
    let isArticle = false;

    if (article && article.id) {
      isArticle = true;
      metaTitle = `${article.title || "समाचार"} - ${siteName}`;
      metaDescription = article.subtitle || (article.content ? article.content.substring(0, 160).replace(/\n/g, " ") + "..." : defaultDescription);
      metaImage = article.image || defaultImage;
      currentUrl = getArticleUrl(article, defaultDomain);
    } else if (categoryName) {
      metaTitle = `${categoryName} समाचार - ${siteName}`;
      metaDescription = `${categoryName} की सभी ताज़ा और प्रमुख खबरें पढ़ें केवल ${siteName} पर।`;
      currentUrl = `${defaultDomain}/?category=${encodeURIComponent(categoryName)}`;
    } else if (authorName) {
      metaTitle = `${authorName} (संवाददाता) - ${siteName}`;
      metaDescription = `${siteName} के वरिष्ठ संवाददाता ${authorName} की सभी रिपोर्ट और विश्लेषण पढ़ें।`;
      currentUrl = `${defaultDomain}/?author=${encodeURIComponent(authorName)}`;
    } else if (pageTitle) {
      metaTitle = `${pageTitle} - ${siteName}`;
      metaDescription = `${siteName} - ${pageTitle}`;
      currentUrl = `${defaultDomain}/?page=${encodeURIComponent(pageTitle)}`;
    } else if (title) {
      metaTitle = title.includes(siteName) ? title : `${title} - ${siteName}`;
    }

    if (description) metaDescription = description;
    if (image) metaImage = image;
    if (url) currentUrl = url;

    // 1. Update Document Title
    document.title = metaTitle;

    // Helper function to update or create meta tags
    const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Helper to update link tag
    const setLinkTag = (rel: string, href: string, id: string) => {
      let element = document.getElementById(id) as HTMLLinkElement | null;
      if (!element) {
        element = document.createElement("link");
        element.setAttribute("rel", rel);
        element.id = id;
        document.head.appendChild(element);
      }
      element.setAttribute("href", href);
    };

    // 2. Standard Meta Tags
    setMetaTag('meta[name="title"]', 'name', 'title', metaTitle);
    setMetaTag('meta[name="description"]', 'name', 'description', metaDescription);

    // 3. Google Discover & Robots Meta Tags
    setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('meta[name="googlebot"]', 'name', 'googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('meta[name="bingbot"]', 'name', 'bingbot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // 4. Open Graph Tags
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', isArticle ? 'article' : (type || 'website'));
    setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', siteName);
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', metaTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', metaDescription);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', metaImage);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', currentUrl);
    setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'hi_IN');

    // 5. Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMetaTag('meta[name="twitter:site"]', 'name', 'twitter:site', '@SaradeshNews');
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', metaTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', metaDescription);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', metaImage);

    // 6. Dynamic Canonical Link
    setLinkTag('canonical', currentUrl, 'canonical-url-link');

    // 7. Inject / Update Dynamic JSON-LD Schemas
    const injectJsonLd = (id: string, schemaObj: object) => {
      let script = document.getElementById(id) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = id;
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schemaObj, null, 2);
    };

    // Article NewsArticle JSON-LD
    if (article) {
      const pubDate = article.createdAt ? new Date(article.createdAt).toISOString() : new Date().toISOString();
      const newsArticleSchema = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": currentUrl
        },
        "headline": article.title,
        "image": [article.image || defaultImage],
        "datePublished": pubDate,
        "dateModified": pubDate,
        "author": {
          "@type": "Person",
          "name": article.author || "सम्पादकीय टीम",
          "url": `${defaultDomain}/?author=${encodeURIComponent(article.author || "सम्पादकीय टीम")}`
        },
        "publisher": {
          "@type": "NewsMediaOrganization",
          "name": "सारादेश",
          "url": defaultDomain,
          "logo": {
            "@type": "ImageObject",
            "url": defaultImage
          }
        },
        "description": article.subtitle || metaDescription,
        "articleBody": article.content,
        "inLanguage": "hi",
        "keywords": (article.tags || []).join(", ")
      };
      injectJsonLd("dynamic-article-jsonld", newsArticleSchema);
    } else {
      const existingArticleScript = document.getElementById("dynamic-article-jsonld");
      if (existingArticleScript) existingArticleScript.remove();
    }

    // BreadcrumbList JSON-LD
    const breadcrumbList = breadcrumbs || [
      { name: "होम", url: defaultDomain },
      ...(categoryName ? [{ name: categoryName, url: `${defaultDomain}/?category=${encodeURIComponent(categoryName)}` }] : []),
      ...(article ? [
        { name: article.category || "समाचार", url: `${defaultDomain}/?category=${encodeURIComponent(article.category || "all")}` },
        { name: article.title, url: currentUrl }
      ] : [])
    ];

    if (breadcrumbList.length > 0) {
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbList.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": item.name,
          "item": item.url
        }))
      };
      injectJsonLd("dynamic-breadcrumb-jsonld", breadcrumbSchema);
    }

  }, [title, description, image, url, type, article, categoryName, authorName, pageTitle, breadcrumbs]);

  return null;
};
