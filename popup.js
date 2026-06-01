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

        // Filtrar por subreddit si se especifica
        const subFilter = document.getElementById('subredditFilter').value.trim().toLowerCase();
        if (subFilter) {
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
        filteredPosts.forEach((p, index) => {
            listItems += `${index + 1}. Title: ${p.title}, r: ${p.subreddit}, views: ${p.views}, votes: ${p.score}, coments: ${p.comments}, time: ${p.time}\n`;
            totalScore += parseInt(p.score) || 0;
            totalComments += parseInt(p.comments) || 0;
            totalViews += parseViews(p.views);
        });

        // Formatear el nuevo Markdown mejorado
        let md = `# Análisis de Perfil de Reddit\n\n`;
        md += `### 📊 Estadísticas Generales\n`;
        md += `- **Posts analizados:** ${filteredPosts.length}\n`;
        md += `- **Vistas totales (aprox):** ${totalViews.toLocaleString()}\n`;
        md += `- **Votos totales:** ${totalScore.toLocaleString()}\n`;
        md += `- **Comentarios totales:** ${totalComments.toLocaleString()}\n\n`;
        
        md += `### 📝 Desglose por Publicación (Top Vistas)\n\n`;
        md += listItems;

        results.innerText = md;
        document.getElementById('outputContainer').style.display = 'block';

        // Lógica para botón Copiar
        document.getElementById('copyBtn').onclick = () => {
            navigator.clipboard.writeText(md).then(() => {
                const btn = document.getElementById('copyBtn');
                btn.innerText = '✅ Copiado';
                setTimeout(() => btn.innerText = '📋 Copiar', 2000);
            });
        };

        // Lógica para botón Descargar
        document.getElementById('downloadBtn').onclick = () => {
            const blob = new Blob([md], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reddit_analysis.md';
            a.click();
            URL.revokeObjectURL(url);
        };

    } catch (error) {
        status.innerText = 'Error: ' + error.message;
    }
});
