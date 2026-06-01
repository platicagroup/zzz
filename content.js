function extractRedditData() {
    try {
        // En Reddit moderno (shreddit), los posts usan la etiqueta <shreddit-post>
        const postElements = document.querySelectorAll('shreddit-post');
        
        if (postElements.length === 0) {
            // Fallback para Reddit antiguo si es necesario
            const oldPosts = document.querySelectorAll('.Post');
            if (oldPosts.length === 0) {
                return { error: 'No se detectaron posts en esta vista. Haz scroll o asegúrate de estar en un perfil/subreddit.' };
            }
        }

        const posts = [];

        postElements.forEach(post => {
            const title = post.getAttribute('post-title') || 'Desconocido';
            const subreddit = post.getAttribute('subreddit-prefixed-name') || 'Desconocido';
            const score = post.getAttribute('score') || '0';
            const comments = post.getAttribute('comment-count') || '0';
            
            // Extraer las vistas buscando en todo el texto del post
            let views = post.getAttribute('view-count');
            if (!views) {
                // Como vemos en la imagen, dice "1.4K views", buscaremos ese patrón en el texto completo
                const text = post.innerText || post.textContent || '';
                const viewsMatch = text.match(/([\d,\.]+[kKmM]?)\s*views/i);
                
                if (viewsMatch && viewsMatch[1]) {
                    views = viewsMatch[1].toUpperCase();
                } else {
                    views = 'N/A';
                }
            }

            // Limpiar títulos para que no rompan la tabla markdown
            const cleanTitle = title.replace(/\|/g, '-').replace(/\n/g, ' ').trim();

            // Extraer el tiempo (ej. "1 day ago", "5 hr. ago")
            let timeStr = 'Desconocido';
            const timeMatch = (post.innerText || post.textContent || '').match(/(\d+\s*(min|hr|day|month|year)s?\.?\s*ago)/i);
            if (timeMatch) {
                timeStr = timeMatch[1].toLowerCase();
            }

            posts.push({
                title: cleanTitle,
                subreddit: subreddit,
                views: views,
                score: score,
                comments: comments,
                time: timeStr
            });
        });

        return { posts };
    } catch (e) {
        return { error: 'Error en el script de contenido: ' + e.message };
    }
}

// Retornar directamente la ejecución de la función para que popup.js la reciba
extractRedditData();
