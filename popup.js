// Controlar visibilidad del input personalizado
document.getElementById('periodFilter').addEventListener('change', (e) => {
    document.getElementById('customDaysContainer').style.display = e.target.value === 'custom' ? 'block' : 'none';
});

document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const results = document.getElementById('results');
    const outputContainer = document.getElementById('outputContainer');
    
    status.innerText = 'Analizando página...';
    outputContainer.style.display = 'none';
    results.style.display = 'block';

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab.url.includes('reddit.com')) {
            status.innerText = 'Error: Debes estar en reddit.com';
            return;
        }

        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        const data = injectionResults[0].result;
        
        if (!data || data.error) {
            status.innerText = data?.error || 'No se pudo extraer información.';
            return;
        }

        const period = document.getElementById('periodFilter').value;
        const customDays = parseInt(document.getElementById('customDays').value) || 0;
        let filteredPosts = data.posts;
        
        if (period !== 'all') {
            filteredPosts = data.posts.filter(p => {
                if (!p.time) return true; // fallback
                const t = p.time.toLowerCase();
                
                // Siempre incluir minutos y horas para rangos basados en días
                if (t.includes('min') || t.includes('hr')) return true;
                
                // Si la selección es estrictamente 24h, rechazar si llegó hasta aquí (no es min/hr)
                if (period === '24h') return false;

                // Extraer los días (1 day, 5 days, etc.)
                const dayMatch = t.match(/(\d+)\s*day/i);
                
                if (period === '48h') {
                    return dayMatch && parseInt(dayMatch[1]) <= 1;
                } else if (period === '72h') {
                    return dayMatch && parseInt(dayMatch[1]) <= 2;
                } else if (period === 'custom') {
                    // Rechazar si es meses o años
                    if (t.includes('month') || t.includes('year')) return false;
                    return dayMatch && parseInt(dayMatch[1]) <= customDays;
                }
                
                return false;
            });
        }

        // Filtrar por subreddit si se especifica y no es 'all'
        const subFilter = document.getElementById('subredditFilter').value.trim().toLowerCase();
        if (subFilter && subFilter !== 'all') {
            filteredPosts = filteredPosts.filter(p => {
                if (!p.subreddit) return false;
                const sub = p.subreddit.toLowerCase();
                const cleanSub = sub.startsWith('r/') ? sub.slice(2) : sub;
                const cleanFilter = subFilter.startsWith('r/') ? subFilter.slice(2) : subFilter;
                return cleanSub.includes(cleanFilter);
            });
        }

        status.innerText = `Éxito. Se analizaron ${filteredPosts.length} posts.`;

        // Función auxiliar para convertir "1.5K" o "17K" a números reales
        function parseViews(viewStr) {
            if (!viewStr || viewStr === 'N/A') return 0;
            let multiplier = 1;
            let cleanStr = viewStr.toUpperCase().replace(/,/g, '');
            if (cleanStr.includes('K')) {
                multiplier = 1000;
                cleanStr = cleanStr.replace('K', '');
            } else if (cleanStr.includes('M')) {
                multiplier = 1000000;
                cleanStr = cleanStr.replace('M', '');
            }
            return parseFloat(cleanStr) * multiplier || 0;
        }

        // Ordenar los posts por mayor cantidad de vistas
        filteredPosts.sort((a, b) => parseViews(b.views) - parseViews(a.views));

        let totalScore = 0;
        let totalViews = 0;
        let totalComments = 0;
        
        let listItems = "";
        let cardsHtml = "";
        filteredPosts.forEach((p, index) => {
            listItems += `${index + 1}. Title: ${p.title}, r: ${p.subreddit}, views: ${p.views}, votes: ${p.score}, coments: ${p.comments}, time: ${p.time}\n`;
            totalScore += parseInt(p.score) || 0;
            totalComments += parseInt(p.comments) || 0;
            totalViews += parseViews(p.views);

            const safeTitle = p.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            cardsHtml += `
                <div class="post-card">
                    <div class="post-title">${safeTitle}</div>
                    <div class="post-meta">
                        <span class="post-subreddit">${p.subreddit}</span>
                        <span>👁️ ${p.views}</span>
                        <span>👍 ${p.score}</span>
                        <span>💬 ${p.comments}</span>
                        <span>🕒 ${p.time}</span>
                    </div>
                </div>
            `;
        });

        // Renderizar estadísticas y tarjetas en el popup
        let popupHtmlContent = `
            <div class="stats-card">
                <h3>📊 Estadísticas Generales</h3>
                <div class="stats-grid">
                    <div><strong>Posts:</strong> ${filteredPosts.length}</div>
                    <div><strong>Vistas:</strong> ${totalViews.toLocaleString()}</div>
                    <div><strong>Votos:</strong> ${totalScore.toLocaleString()}</div>
                    <div><strong>Comentarios:</strong> ${totalComments.toLocaleString()}</div>
                </div>
            </div>
            <div style="font-weight: bold; margin-bottom: 10px; font-size: 13px; color: #fff;">📝 Desglose por Publicación</div>
            ${cardsHtml || '<div style="text-align: center; color: #818384; padding: 20px;">No se encontraron posts.</div>'}
        `;

        results.innerHTML = popupHtmlContent;
        document.getElementById('outputContainer').style.display = 'block';

    } catch (error) {
        status.innerText = 'Error: ' + error.message;
    }
});
