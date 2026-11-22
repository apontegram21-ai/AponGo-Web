(() => {
    const toggle = document.querySelector('#analyticsToggle');
    const status = document.querySelector('#analyticsStatus');
    const key = 'apongo-analytics';
    const page = document.body.dataset.analyticsPage;
    const english = document.documentElement.lang === 'en';
    const copy = english ? {
        unavailable: 'Analytics are unavailable on this deployment.',
        copied: 'Link copied.',
        clipboard: 'You can copy the link from the address bar.',
        storage: 'Your browser could not save your choice.'
    } : {
        unavailable: 'La medición no está disponible en este despliegue.',
        copied: 'Enlace copiado.',
        clipboard: 'Puedes copiar el enlace desde la barra de direcciones.',
        storage: 'El navegador no permite guardar tu elección.'
    };
    let enabled = false;

    function track(name, data = {}) {
        if (enabled) window.va('event', { name, data: { pagina: page, ...data } });
    }

    function startAnalytics() {
        window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
        window.va('beforeSend', event => {
            const url = new URL(event.url, location.origin);
            return { ...event, url: url.origin + url.pathname };
        });
        const script = document.createElement('script');
        script.src = '/_vercel/insights/script.js';
        script.addEventListener('error', () => {
            status.textContent = copy.unavailable;
        });
        document.head.append(script);
    }

    const share = document.querySelector('#shareGuide');
    if (share && navigator.clipboard?.writeText) {
        share.hidden = false;
        share.addEventListener('click', async () => {
            const feedback = document.querySelector('#shareStatus');
            try {
                await navigator.clipboard.writeText(location.origin + location.pathname);
                feedback.textContent = copy.copied;
                track('copiar_guia');
            } catch {
                feedback.textContent = copy.clipboard;
            }
        });
    }

    if (location.protocol !== 'https:') return;
    try { enabled = sessionStorage.getItem(key) === 'on'; } catch {}
    toggle.hidden = false;
    toggle.setAttribute('aria-pressed', enabled);
    if (enabled) startAnalytics();

    toggle.addEventListener('click', () => {
        try {
            sessionStorage.setItem(key, enabled ? 'off' : 'on');
        } catch {
            status.textContent = copy.storage;
            return;
        }
        if (enabled) {
            enabled = false;
            location.reload();
            return;
        }
        enabled = true;
        toggle.setAttribute('aria-pressed', 'true');
        startAnalytics();
    });

    document.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (!link) return;
        if (link.hasAttribute('data-guide-link')) {
            track('abrir_guia', { guia: link.pathname });
            return;
        }
        const category = link.closest('.card[data-category]')?.dataset.category;
        if (category && link.classList.contains('partner-pill')) {
            track('clic_proveedor', { proveedor: link.hostname, categoria: category });
        }
    });

    document.querySelector('#searchForm')?.addEventListener('submit', () => {
        if (!document.querySelector('#searchInput').value.trim()) return;
        track('buscar_servicio', { con_resultados: document.querySelector('#empty').hidden });
    });
})();
