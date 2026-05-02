import { useEffect } from 'react';

/**
 * Custom hook to update document metadata for SEO
 * @param {Object} options - SEO options
 * @param {string} options.title - Page title
 * @param {string} options.description - Meta description
 * @param {string[]} [options.keywords] - Meta keywords
 * @param {Object} [options.og] - Open Graph tags
 * @param {string} [options.canonical] - Canonical URL
 */
export default function useSEO({ title, description, keywords, og = {}, canonical }) {
    useEffect(() => {
        if (!title) return;

        const previousTitle = document.title;
        document.title = title.includes('Uvero') ? title : `${title} | Uvero`;

        // Helper to upsert meta tags
        const upsertMeta = (selector, name, content, attr = 'name') => {
            if (!content) return;
            let el = document.querySelector(selector);
            if (!el) {
                el = document.createElement('meta');
                el.setAttribute(attr, name);
                document.head.appendChild(el);
            }
            el.setAttribute('content', content);
        };

        upsertMeta('meta[name="description"]', 'description', description);
        
        if (keywords) {
            upsertMeta('meta[name="keywords"]', 'keywords', Array.isArray(keywords) ? keywords.join(', ') : keywords);
        }

        // Open Graph
        upsertMeta('meta[property="og:title"]', 'og:title', og.title || title, 'property');
        upsertMeta('meta[property="og:description"]', 'og:description', og.description || description, 'property');
        if (og.image) {
            upsertMeta('meta[property="og:image"]', 'og:image', og.image, 'property');
        }

        // Canonical
        if (canonical) {
            let link = document.querySelector('link[rel="canonical"]');
            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }
            link.setAttribute('href', canonical);
        }

        return () => {
            document.title = previousTitle;
        };
    }, [title, description, keywords, og, canonical]);
}
