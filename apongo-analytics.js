(() => {
    const toggle = document.querySelector('#analyticsToggle');
    const status = document.querySelector('#analyticsStatus');
    const key = 'apongo-analytics';
    const page = document.body.dataset.analyticsPage;
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
            status.textContent = 'La medición no está disponible en este despliegue.';
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
                feedback.textContent = 'Enlace copiado.';
                track('copiar_guia');
            } catch {
                feedback.textContent = 'Puedes copiar el enlace desde la barra de direcciones.';
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
            status.textContent = 'El navegador no permite guardar tu elección.';
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
            track('abrir_guia');
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
