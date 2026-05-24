import { useParams, Navigate, useSearchParams } from 'react-router-dom';
import { getToolById } from '../tools';
import { useEffect } from 'react';
import ToolPageShell, { buildToolFaqs } from '../components/ToolPageShell';
import { requiresRuntimeVerification } from '../core/toolMetadata';
import useToolRuntimeStatus from '../core/useToolRuntimeStatus';

function upsertMeta(selector, createElement) {
    let element = document.querySelector(selector);
    if (!element) {
        element = createElement();
        document.head.appendChild(element);
    }
    return element;
}

function buildFaqStructuredData(tool) {
    const faqs = buildToolFaqs(tool);
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

/**
 * Generic Tool Page Component
 * Dynamically loads the correct tool based on the route
 */
export default function ToolPage() {
    const { toolId } = useParams();
    const [searchParams] = useSearchParams();
    const tool = getToolById(toolId);
    const isUnifiedPdfTool = tool?.workspace === 'pdf-tools';
    const shouldVerifyRuntime = Boolean(tool && !isUnifiedPdfTool && requiresRuntimeVerification(toolId));
    const runtimeStatus = useToolRuntimeStatus(toolId, { enabled: shouldVerifyRuntime });

    // Scroll to top when tool changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [toolId]);

    // Update document metadata for SEO
    useEffect(() => {
        if (tool && !isUnifiedPdfTool && tool.seo) {
            document.title = tool.seo.title;

            // Update meta description
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.name = 'description';
                document.head.appendChild(metaDescription);
            }
            metaDescription.content = tool.seo.description;

            // Update Open Graph tags
            let ogTitle = document.querySelector('meta[property="og:title"]');
            if (!ogTitle) {
                ogTitle = document.createElement('meta');
                ogTitle.setAttribute('property', 'og:title');
                document.head.appendChild(ogTitle);
            }
            ogTitle.content = tool.seo.ogTitle || tool.seo.title;

            let ogDescription = document.querySelector('meta[property="og:description"]');
            if (!ogDescription) {
                ogDescription = document.createElement('meta');
                ogDescription.setAttribute('property', 'og:description');
                document.head.appendChild(ogDescription);
            }
            ogDescription.content = tool.seo.ogDescription || tool.seo.description;

            const metaKeywords = upsertMeta('meta[name="keywords"]', () => {
                const element = document.createElement('meta');
                element.name = 'keywords';
                return element;
            });
            metaKeywords.content = Array.isArray(tool.seo.keywords)
                ? tool.seo.keywords.join(', ')
                : (tool.seo.keywords || '');

            const canonicalLink = upsertMeta('link[rel="canonical"]', () => {
                const element = document.createElement('link');
                element.rel = 'canonical';
                return element;
            });
            canonicalLink.href = tool.seo.canonical || `https://uvero.app/${tool.id}`;

            const baseSchema = upsertMeta('script[data-tool-schema="base"]', () => {
                const element = document.createElement('script');
                element.type = 'application/ld+json';
                element.dataset.toolSchema = 'base';
                return element;
            });

            const fallbackStructuredData = {
                '@context': 'https://schema.org',
                '@type': 'WebApplication',
                name: tool.name,
                description: tool.seo.description || tool.description,
                applicationCategory: 'UtilityApplication',
                offers: {
                    '@type': 'Offer',
                    price: '0',
                },
            };
            baseSchema.textContent = JSON.stringify(tool.seo.structuredData || fallbackStructuredData);

            const faqSchema = upsertMeta('script[data-tool-schema="faq"]', () => {
                const element = document.createElement('script');
                element.type = 'application/ld+json';
                element.dataset.toolSchema = 'faq';
                return element;
            });
            faqSchema.textContent = JSON.stringify(buildFaqStructuredData(tool));
        }

        // Cleanup
        return () => {
            document.title = 'Uvero Toolbox';
        };
    }, [tool, isUnifiedPdfTool]);

    // Tool not found - redirect to home
    if (!tool) {
        return <Navigate to="/" replace />;
    }

    if (isUnifiedPdfTool) {
        return <Navigate to={`/toolbox?to=${tool.id}`} replace />;
    }

    const queryParams = Object.fromEntries([...searchParams]);
    const ToolComponent = tool.component;
    const isRuntimeUnavailable = shouldVerifyRuntime && !runtimeStatus.isLoading && !runtimeStatus.isAvailable;

    return (
        <ToolPageShell tool={tool}>
            {isRuntimeUnavailable ? (
                <div className="max-w-3xl mx-auto">
                    <div className="rounded-[2rem] border border-gray-200/80 bg-white p-8 text-center shadow-xl shadow-gray-100/60 dark:border-white/[0.08] dark:bg-gray-900/40 dark:shadow-none sm:p-10">
                        <div className="text-7xl mb-6">{tool.icon}</div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{tool.name}</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">{tool.description}</p>
                        <div className="rounded-[1.5rem] border-2 border-orange-200 bg-orange-50 p-8 dark:border-orange-500/20 dark:bg-orange-500/10">
                            <p className="text-orange-800 dark:text-orange-400 font-bold mb-4">
                                Server runtime unavailable
                            </p>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                {runtimeStatus.note || 'This tool requires a server runtime that is not available.'}
                            </p>
                            {tool.availabilityNote && (
                                <p className="mt-4 text-sm text-orange-700 dark:text-orange-300">
                                    {tool.availabilityNote}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <ToolComponent {...queryParams} toolRuntimeStatus={runtimeStatus} />
            )}
        </ToolPageShell>
    );
}
