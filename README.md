# SonicCanvas 🎵

> **Convierte cualquier canción en un video musical cinematográfico en minutos.**

SonicCanvas es una aplicación de escritorio para **Mac, Windows y Linux** que analiza tu música en tiempo real y genera visuales 3D sincronizados automáticamente con el audio — sin saber edición de video, sin nodos, sin renders que tardan horas.

---

## ¿Qué hace?

### 🎧 Audio Reactivo
El motor analiza la canción cuadro a cuadro usando FFT (Fast Fourier Transform). Detecta bajos, medios, agudos y cada golpe de batería. Con esa información, la escena cobra vida sola:

- Los modelos 3D **laten** con el bass
- Las partículas **explotan** en cada kick
- La cámara **tiembla** en los drops
- Las luces **pulsan** al ritmo del BPM

```
Canción → FFT → bass / mid / treble / kick / beat → Escena 3D reactiva
```

---

### 📝 Letras Sincronizadas
Importa las letras de tu canción y SonicCanvas las muestra línea por línea sincronizadas con el audio.

**Métodos de importación:**
- Pegar texto plano y ajustar timing manualmente
- Importar archivo `.lrc` o `.srt` con timing ya incluido
- *(Premium)* Transcripción automática con IA (Whisper)
- *(Premium)* Traducción automática al inglés u otro idioma

**Estilos de animación disponibles:**
| Estilo | Descripción |
|--------|-------------|
| `fade` | Aparece y desaparece suavemente |
| `bounce` | Salta al ritmo del beat |
| `slide` | Entra desde abajo |
| `karaoke` | Relleno de color que avanza con la sílaba |

---

### 🌌 Escena 3D Completa

La escena corre en tu GPU en tiempo real usando Three.js:

- **Fondos**: color sólido, imagen, video, gradiente animado
- **Modelos 3D**: carga archivos `.glb` y hazlos reaccionar al audio
- **Partículas**: sistemas de partículas reactivas a los agudos
- **Postprocessing**: bloom, glitch, desenfoque de movimiento
- **Cámara**: orbit suave, shake en los beats, path animado

**Ejemplo de escena tipo "Phonk":**
```
Fondo negro con niebla morada
↓
Cráneo GLB que escala ×1.3 en cada kick
↓
500 partículas blancas que explotan en los agudos
↓
Glow verde neón en las letras con bounce
↓
Camera shake intensidad 0.2 en los drops
```

---

### 🎬 Templates Listos para Usar

Elige un template y en segundos tienes una escena completa configurada:

| Template | Estilo | Ideal para |
|----------|--------|------------|
| **Neon Lyrics** | Texto neón sobre fondo oscuro | Hip-hop, trap, rap |
| **Space Visualizer** | Galaxia de partículas + frecuencias | Electronic, ambient |
| **Phonk Glitch** | Glitch + grain + rojo/negro | Phonk, dark trap |
| **Dark Cinematic** | Cinematográfico con blur | Ballads, R&B |
| **Karaoke Clean** | Texto limpio centrado | Pop, J-pop, anime |
| **Lo-Fi Rain** | Lluvia + colores pasteles | Lo-fi, chill |
| **Cyberpunk City** | Ciudad futurista + neon | Synthwave, EDM |

---

### 📤 Exportación con Aceleración GPU

SonicCanvas usa **FFmpeg nativo** con el encoder de tu hardware:

| Plataforma | Encoder |
|------------|---------|
| Mac (Apple Silicon / Intel) | VideoToolbox |
| Windows + NVIDIA | NVENC |
| Linux | VAAPI / NVENC |
| Fallback universal | libx264 (CPU) |

**Resoluciones disponibles según plan:**

| Plan | Resolución | FPS | Watermark |
|------|-----------|-----|-----------|
| Free | 720p | 30 | Sí |
| 1 mes | 1080p | 60 | No |
| 3 meses | 1080p | 60 | No |
| 6 meses | 2K | 60 | No |
| 12 meses | 4K | 60 | No |

---

### 💾 Funciona 100% Offline

Tus proyectos se guardan localmente en SQLite. No necesitas internet para editar ni exportar. La conexión solo se requiere para:
- Activar o renovar licencia
- Descargar templates premium
- Usar funciones de IA (transcripción, traducción)

---

## Flujo de trabajo típico

```
1. Abrir SonicCanvas
2. Crear nuevo proyecto → "Mi sencillo - Enero"
3. Arrastrar el archivo de audio (.mp3 / .wav / .flac)
4. Elegir template → "Neon Lyrics"
5. Pegar las letras de la canción
6. Ajustar timing de cada línea en el timeline
7. Modificar color del glow, tamaño del texto, estilo de fondo
8. Preview en tiempo real → ajustar lo que no te guste
9. Clic en Exportar → MP4 1080p listo en ~2 minutos
10. Subir a YouTube / TikTok / Instagram / Spotify Canvas
```

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React + TypeScript + Vite |
| Estilos | Tailwind CSS + Framer Motion |
| 3D / Canvas | Three.js + React Three Fiber |
| Estado global | Zustand |
| Audio | Web Audio API + FFT |
| Render | FFmpeg nativo (binario embebido) |
| Desktop wrapper | Tauri 2.0 (Rust) |
| DB local | SQLite (proyectos offline) |
| Backend licencias | Node.js + Fastify + MySQL |
| Pagos | Stripe |
| Storage assets | Cloudflare R2 |
| IA lyrics | OpenAI Whisper / AssemblyAI |

---

## Planes

| | Free | 1 mes | 3 meses | 6 meses | 12 meses |
|-|------|-------|---------|---------|----------|
| **Precio** | $0 | $9.99 | $24.99 | $44.99 | $79.99 |
| **Proyectos** | 1 | 5 | 15 | 30 | Ilimitados |
| **Export** | 720p | 1080p | 1080p | 2K | 4K |
| **Watermark** | Sí | No | No | No | No |
| **Dispositivos** | 1 | 1 | 1 | 2 | 3 |
| **IA lyrics** | No | No | No | Sí | Sí |
| **Templates premium** | No | No | Sí | Sí | Sí |
| **Uso comercial** | No | Sí | Sí | Sí | Sí |

---

## Roadmap

- [x] **Sprint 1** — Login, Dashboard, Editor base, Canvas Three.js, Timeline
- [ ] **Sprint 2** — Audio analyzer FFT, audio reactive, letras, templates, export 720p
- [ ] **Sprint 3** — Licencias JWT, Stripe, planes, límites por plan
- [ ] **Sprint 4** — GLB loader, partículas, postprocessing, camera shake
- [ ] **Sprint 5** — IA lyrics, traducción, keyframes, export 4K server-side

---

*Tu música merece verse tan bien como suena.*
