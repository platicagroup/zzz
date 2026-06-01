# Reddit Profile Analyzer by Platica Group 📊

Una extensión de Google Chrome/Brave ligera y potente para extraer estadísticas reales de publicaciones de perfiles de Reddit (especialmente útil para sortear los agresivos bloqueos anti-bot de Cloudflare y Reddit Data API). 

## 🚀 Características
- **Extracción de Vistas reales (Insights):** Capaz de detectar el "View Count" exacto (incluyendo formato 1.2K o 17K) al ejecutarse directamente dentro del contexto visual del navegador de un usuario autenticado.
- **Evade Anti-Bots:** Al ser una extensión que analiza el DOM directamente desde la sesión del usuario, jamás recibirá un CAPTCHA 403 Forbidden o bloqueos de IPs (problema común en Playwright/Puppeteer).
- **Filtro de Periodo Inteligente:**
  - Extraer todo el historial visible.
  - Extraer solo las **Últimas 24 horas** (Filtra de forma inteligente aquellos que dicen `min. ago` y `hr. ago`, excluyendo todo lo demás, incluyendo el estricto `1 day ago`).
- **Exportación en Markdown:** Con un clic genera un `.md` hermosamente formateado, perfecto para usar en Obsidian, Notion o repositorios de GitHub.
- **Métricas autocalculadas:** Sumatoria total de votos, comentarios y estimación matemática de vistas.

---

## 🛠️ Cómo Instalar (Modo Desarrollador)

Como esta extensión es de uso privado o local (no está en la Chrome Web Store), debes cargarla manualmente:

1. Clona o descarga esta carpeta (`reddit-extractor-extension`) a tu computadora.
2. Abre Google Chrome, Brave o Edge.
3. Ve a la barra de direcciones y escribe: `chrome://extensions/`
4. En la esquina superior derecha, **activa** el switch que dice **"Modo de desarrollador"** (Developer mode).
5. En el nuevo menú superior izquierdo que aparecerá, haz clic en **"Cargar descomprimida"** (Load unpacked).
6. Selecciona esta carpeta (`reddit-extractor-extension`).
7. ¡La extensión ya estará instalada y activa! (Aparecerá el ícono de una pieza de rompecabezas en tu barra superior, fíjalo para tener acceso rápido).

---

## 📖 Cómo Usarla

1. Dirígete a la página de **tu perfil de Reddit** (ej. `https://www.reddit.com/user/TuUsuario/`).
   *Nota: Tienes que estar en tu propio perfil para que Reddit te renderice el conteo de vistas privado de los posts.*
2. **Haz scroll hacia abajo** hasta que Reddit cargue todas las publicaciones que deseas que sean incluidas en el reporte (el scroll infinito debe mostrar los elementos en pantalla para que la extensión los pueda escanear).
3. Haz clic en el ícono de la extensión en la barra de Chrome.
4. Selecciona el rango de tiempo en el menú desplegable (Todo o 24 Horas).
5. Haz clic en **Analizar Posts Visibles**.
6. Usa el botón **📋 Copiar** para enviarlo al portapapeles o **⬇️ Descargar MD** para guardarlo instantáneamente como archivo.

---

## 📂 Archivos y Estructura
- `manifest.json` - Permisos de V3 para el navegador.
- `popup.html` - Interfaz limpia y con dark-mode.
- `popup.js` - Lógica de los botones, filtrado de 24h, matemáticas y exportación.
- `content.js` - El "araña" inteligente (scraper) que lee las etiquetas de "Shreddit" (el nuevo frontend de Reddit) en vivo sin sobrecargar la red.
