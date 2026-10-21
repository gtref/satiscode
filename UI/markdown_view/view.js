import DOMPurify from '../../node_modules/dompurify/dist/purify.es.mjs';
import { marked } from '../../node_modules/marked/lib/marked.esm.js';

export class MarkdownView {
    constructor(containerEl) {
        this.containerEl = containerEl;
        this.article = containerEl?.querySelector('.md-view-content');
    }

    render(markdown = '') {
        if (!this.containerEl) return;

        if (!this.article) {
            this.article = this.containerEl.ownerDocument.createElement('article');
            this.article.className = 'md-view-content';
            this.containerEl.replaceChildren(this.article);
        }

        const renderer = new marked.Renderer();
        renderer.code = ({ text, lang }) => {
            const language = lang?.split(/\s+/)[0];
            const highlighted = language
                ? window.api.highlightCode(text, language) || escapeHtml(text)
                : escapeHtml(text);
            const languageClass = language ? ` language-${escapeHtml(language)}` : '';
            return `<pre><code class="hljs${languageClass}">${highlighted}</code></pre>`;
        };

        const html = marked.parse(markdown, { renderer });
        this.article.innerHTML = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    }
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[character]));
}
