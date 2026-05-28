Proyecto: Visual Music Studio — Plan Técnico Completo

Visión General
Nombre tentativo: SonicCanvas / NovaBeat / AstroSync
Tipo: App web + desktop (Tauri/Electron)
Modelo de negocio: Licencias por tiempo (1/3/6/12 meses) + Free con watermark
Stack: Next.js · Node.js · MySQL · Three.js · FFmpeg · Remotion

1. Arquitectura General
┌─────────────────────────────────────────────────────────┐
│                        CLIENTE                          │
│  Next.js + React + Tailwind + Zustand                   │
│  Three.js + React Three Fiber + GLSL Shaders            │
│  Web Audio API + FFT Analysis                           │
│  Remotion Player (preview)                              │
│  FFmpeg.wasm (export en browser)                        │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST / WebSocket
┌──────────────────────────▼──────────────────────────────┐
│                        BACKEND                          │
│  Node.js + Fastify                                      │
│  Auth · Licencias · Proyectos · Assets · Renders        │
│  JWT firmados · Redis (sesiones) · MySQL (datos)        │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                      SERVICIOS                          │
│  FFmpeg (render server-side)                            │
│  Whisper / AssemblyAI (transcripción)                   │
│  Cloudflare R2 / S3 (almacenamiento)                    │
│  Stripe (pagos)                                         │
└─────────────────────────────────────────────────────────┘

2. Esquema de Base de Datos MySQL
Tabla: users
sqlCREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)        NOT NULL,
  email         VARCHAR(150)        NOT NULL UNIQUE,
  password_hash VARCHAR(255)        NOT NULL,
  avatar_url    VARCHAR(500)        DEFAULT NULL,
  role          ENUM('user','admin') DEFAULT 'user',
  status        ENUM('active','suspended','deleted') DEFAULT 'active',
  email_verified_at DATETIME        DEFAULT NULL,
  created_at    DATETIME            DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME            DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

Tabla: plans
sqlCREATE TABLE plans (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,        -- "Free", "1 Mes", "3 Meses", etc.
  slug          VARCHAR(50)   NOT NULL UNIQUE, -- "free", "1m", "3m", "6m", "12m"
  duration_days INT           NOT NULL,        -- 0 = free forever
  price_usd     DECIMAL(8,2)  NOT NULL DEFAULT 0.00,
  max_projects  INT           DEFAULT 1,
  max_export_resolution VARCHAR(10) DEFAULT '720p',
  watermark     TINYINT(1)    DEFAULT 1,
  max_tracks    INT           DEFAULT 2,
  max_devices   INT           DEFAULT 1,
  features_json JSON          DEFAULT NULL,    -- features extras como objeto
  is_active     TINYINT(1)    DEFAULT 1,
  created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP
);
Ejemplo de features_json:
json{
  "glb_limit": 5,
  "template_access": "premium",
  "ai_lyrics": true,
  "translation": true,
  "export_batch": false,
  "cloud_render": false,
  "commercial_use": true
}

Tabla: subscriptions
sqlCREATE TABLE subscriptions (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  plan_id       INT UNSIGNED NOT NULL,
  start_date    DATETIME     NOT NULL,
  end_date      DATETIME     NOT NULL,
  status        ENUM('active','expired','cancelled','paused') DEFAULT 'active',
  auto_renew    TINYINT(1)   DEFAULT 0,
  stripe_sub_id VARCHAR(200) DEFAULT NULL,
  payment_ref   VARCHAR(200) DEFAULT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

Tabla: devices
sqlCREATE TABLE devices (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  device_hash   VARCHAR(255) NOT NULL,         -- hash del hardware/navegador
  device_name   VARCHAR(200) DEFAULT NULL,     -- "MacBook Pro", "Chrome Windows"
  platform      VARCHAR(50)  DEFAULT NULL,     -- "web", "desktop-win", "desktop-mac"
  last_seen     DATETIME     DEFAULT NULL,
  is_active     TINYINT(1)   DEFAULT 1,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_device (user_id, device_hash)
);

Tabla: license_tokens
sqlCREATE TABLE license_tokens (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  device_id     INT UNSIGNED NOT NULL,
  token_hash    VARCHAR(512) NOT NULL,         -- hash del JWT firmado
  plan_snapshot JSON         NOT NULL,         -- copia del plan al momento de emitir
  issued_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME     NOT NULL,         -- cuándo vence el token offline
  last_verified DATETIME     DEFAULT NULL,     -- última vez que se verificó online
  revoked_at    DATETIME     DEFAULT NULL,
  is_valid      TINYINT(1)   DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (device_id) REFERENCES devices(id)
);

Tabla: login_sessions
sqlCREATE TABLE login_sessions (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             INT UNSIGNED NOT NULL,
  refresh_token_hash  VARCHAR(512) NOT NULL,
  expires_at          DATETIME     NOT NULL,
  ip_address          VARCHAR(45)  DEFAULT NULL,
  user_agent          TEXT         DEFAULT NULL,
  revoked_at          DATETIME     DEFAULT NULL,
  created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

Tabla: projects
sqlCREATE TABLE projects (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       INT UNSIGNED NOT NULL,
  title         VARCHAR(200) NOT NULL DEFAULT 'Sin título',
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  duration_sec  FLOAT        DEFAULT 0,
  template_id   VARCHAR(100) DEFAULT NULL,
  project_data  LONGBLOB     DEFAULT NULL,  -- JSON comprimido del estado completo
  audio_url     VARCHAR(500) DEFAULT NULL,
  status        ENUM('draft','published','archived') DEFAULT 'draft',
  is_public     TINYINT(1)   DEFAULT 0,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

Tabla: project_assets
sqlCREATE TABLE project_assets (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id    INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  asset_type    ENUM('audio','image','video','glb','font','other') NOT NULL,
  file_name     VARCHAR(300) NOT NULL,
  file_url      VARCHAR(500) NOT NULL,
  file_size_kb  INT          DEFAULT 0,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

Tabla: exports
sqlCREATE TABLE exports (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  project_id     INT UNSIGNED NOT NULL,
  resolution     VARCHAR(20)  NOT NULL,  -- "720p", "1080p", "4K"
  format         VARCHAR(10)  NOT NULL,  -- "mp4", "webm", "gif"
  status         ENUM('queued','processing','done','failed') DEFAULT 'queued',
  progress       TINYINT      DEFAULT 0,
  output_url     VARCHAR(500) DEFAULT NULL,
  watermark      TINYINT(1)   DEFAULT 1,
  duration_sec   FLOAT        DEFAULT 0,
  render_time_ms INT          DEFAULT 0,
  error_msg      TEXT         DEFAULT NULL,
  created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP,
  completed_at   DATETIME     DEFAULT NULL,
  FOREIGN KEY (user_id)    REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

Tabla: templates
sqlCREATE TABLE templates (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(100) NOT NULL UNIQUE,
  name          VARCHAR(200) NOT NULL,
  category      VARCHAR(100) DEFAULT NULL,   -- "neon", "space", "phonk", "anime"
  preview_url   VARCHAR(500) DEFAULT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  config_json   JSON         DEFAULT NULL,   -- configuración base del template
  is_premium    TINYINT(1)   DEFAULT 0,
  is_active     TINYINT(1)   DEFAULT 1,
  downloads     INT          DEFAULT 0,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP
);

Tabla: payments
sqlCREATE TABLE payments (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  plan_id         INT UNSIGNED NOT NULL,
  subscription_id INT UNSIGNED DEFAULT NULL,
  amount_usd      DECIMAL(8,2) NOT NULL,
  currency        VARCHAR(10)  DEFAULT 'USD',
  provider        ENUM('stripe','paypal','manual') DEFAULT 'stripe',
  provider_ref    VARCHAR(300) DEFAULT NULL,
  status          ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
  paid_at         DATETIME     DEFAULT NULL,
  created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);

3. Endpoints del Backend (Node.js + Fastify)
AUTH
POST   /api/auth/register          → Crear cuenta
POST   /api/auth/login             → Login, devuelve access_token + refresh_token
POST   /api/auth/logout            → Invalida sesión
POST   /api/auth/refresh           → Renueva access_token con refresh_token
POST   /api/auth/forgot-password   → Envía email de recuperación
POST   /api/auth/reset-password    → Cambia contraseña con token
GET    /api/auth/me                → Info del usuario actual

LICENCIAS
POST   /api/license/activate       → Activa licencia en dispositivo
POST   /api/license/verify         → Verifica y renueva token offline
POST   /api/license/revoke         → Revoca un dispositivo
GET    /api/license/devices        → Lista dispositivos activos del usuario
GET    /api/license/status         → Estado actual de la licencia del usuario
Flujo de activación:
1. Cliente manda: { device_hash, platform, device_name }
2. Servidor verifica: suscripción activa + límite de dispositivos
3. Genera JWT firmado con RS256:
   {
     sub: user_id,
     plan: "6m",
     features: { ... },
     device: device_hash,
     iat: ahora,
     exp: ahora + 7 días (offline grace)
   }
4. Guarda hash del token en license_tokens
5. Devuelve el token al cliente
6. Cliente lo guarda localmente cifrado

SUSCRIPCIONES Y PAGOS
GET    /api/plans                  → Lista de planes disponibles
POST   /api/subscription/checkout  → Crea sesión de pago (Stripe)
GET    /api/subscription/current   → Suscripción activa del usuario
POST   /api/subscription/cancel    → Cancela renovación automática
GET    /api/payments/history       → Historial de pagos
POST   /api/webhooks/stripe        → Webhook de Stripe

PROYECTOS
GET    /api/projects               → Listar proyectos del usuario
POST   /api/projects               → Crear proyecto nuevo
GET    /api/projects/:id           → Obtener proyecto por ID
PUT    /api/projects/:id           → Actualizar proyecto (autosave)
DELETE /api/projects/:id           → Eliminar proyecto
POST   /api/projects/:id/duplicate → Duplicar proyecto
GET    /api/projects/:id/export    → Estado de la última exportación

ASSETS
POST   /api/assets/upload          → Subir archivo (audio, imagen, GLB)
GET    /api/assets                 → Listar assets del usuario
DELETE /api/assets/:id             → Eliminar asset
GET    /api/assets/library         → Assets globales (GLB, efectos)

EXPORTACIÓN
POST   /api/exports                → Iniciar exportación
GET    /api/exports/:id            → Estado del render
GET    /api/exports/:id/download   → URL de descarga
GET    /api/exports/history        → Historial de exports del usuario

TEMPLATES
GET    /api/templates              → Listar todos los templates
GET    /api/templates/:slug        → Obtener template por slug
GET    /api/templates/categories   → Categorías disponibles

ADMIN
GET    /api/admin/users            → Listar usuarios
PUT    /api/admin/users/:id        → Editar usuario
POST   /api/admin/plans            → Crear plan
PUT    /api/admin/plans/:id        → Editar plan
GET    /api/admin/exports          → Cola de renders
GET    /api/admin/stats            → Estadísticas generales

4. Flujo de Licencia Online / Offline
╔══════════════════════════════════════════════════════════╗
║                   APP INICIA                             ║
╚════════════════════════════╤═════════════════════════════╝
                             │
                  ¿Hay token local?
                   /          \
                 NO            SÍ
                 │              │
          Ir a login    ¿Token expirado?
                          /         \
                        SÍ           NO
                        │             │
              ¿Hay internet?    ¿Hay internet?
               /       \          /        \
             SÍ         NO      SÍ          NO
             │           │       │           │
        Revalidar    Bloquear  Renovar    Usar token
        + renovar    o grace   token      cacheado
        token        period    online     (hasta que
                                          expire)
Grace period recomendado: 72 horas sin internet antes de exigir reconexión.

5. Estructura de Carpetas (Next.js)
soniccanvas/
│
├── apps/
│   ├── web/                         ← App Next.js principal
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── register/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (dashboard)/
│   │   │   │   ├── projects/
│   │   │   │   │   ├── page.tsx       ← Lista de proyectos
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx   ← Editor principal
│   │   │   │   │
│   │   │   │   ├── templates/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   └── billing/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx              ← Landing page
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                   ← Botones, inputs, modales
│   │   │   ├── editor/
│   │   │   │   ├── EditorCanvas.tsx  ← Canvas principal (Three.js)
│   │   │   │   ├── Timeline.tsx      ← Timeline de tracks
│   │   │   │   ├── LyricsPanel.tsx   ← Panel de letras
│   │   │   │   ├── AudioReactive.tsx ← Lógica FFT
│   │   │   │   ├── GLBLoader.tsx     ← Carga modelos 3D
│   │   │   │   ├── ParticleSystem.tsx
│   │   │   │   ├── EffectsPanel.tsx
│   │   │   │   ├── CameraControls.tsx
│   │   │   │   └── ExportModal.tsx
│   │   │   │
│   │   │   ├── templates/
│   │   │   │   ├── NeonLyrics.tsx
│   │   │   │   ├── SpaceVisualizer.tsx
│   │   │   │   ├── PhonkGlitch.tsx
│   │   │   │   ├── DarkCinematic.tsx
│   │   │   │   └── KaraokeClean.tsx
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Topbar.tsx
│   │   │       └── BottomBar.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts               ← Cliente HTTP
│   │   │   ├── auth.ts              ← Helpers de autenticación
│   │   │   ├── license.ts           ← Verificación de licencia local
│   │   │   ├── audioAnalyzer.ts     ← Web Audio API + FFT
│   │   │   ├── projectSerializer.ts ← Guardar/cargar proyecto
│   │   │   └── exportHelper.ts      ← Lógica de exportación
│   │   │
│   │   ├── store/
│   │   │   ├── editorStore.ts       ← Estado del editor (Zustand)
│   │   │   ├── projectStore.ts      ← Proyectos del usuario
│   │   │   ├── authStore.ts         ← Sesión y licencia
│   │   │   └── uiStore.ts           ← Estado de UI
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAudioReactive.ts  ← Hook FFT + beats
│   │   │   ├── useLicense.ts        ← Estado de licencia
│   │   │   ├── useProject.ts        ← CRUD de proyectos
│   │   │   ├── useExport.ts         ← Estado del render
│   │   │   └── useTimeline.ts       ← Control del timeline
│   │   │
│   │   ├── types/
│   │   │   ├── project.ts
│   │   │   ├── license.ts
│   │   │   ├── template.ts
│   │   │   └── user.ts
│   │   │
│   │   └── public/
│   │       ├── glb/                 ← Modelos 3D base
│   │       ├── fonts/               ← Fuentes para canvas
│   │       └── thumbnails/          ← Previews de templates
│   │
│   └── desktop/                     ← App Tauri (wrapper)
│       ├── src-tauri/
│       │   ├── src/
│       │   │   ├── main.rs
│       │   │   ├── license.rs       ← Licencia local (Rust)
│       │   │   └── ffmpeg.rs        ← Render local
│       │   └── tauri.conf.json
│       └── package.json
│
├── packages/
│   ├── database/                    ← Migraciones y seeds SQL
│   │   ├── migrations/
│   │   │   ├── 001_users.sql
│   │   │   ├── 002_plans.sql
│   │   │   ├── 003_subscriptions.sql
│   │   │   ├── 004_devices.sql
│   │   │   ├── 005_license_tokens.sql
│   │   │   ├── 006_projects.sql
│   │   │   ├── 007_exports.sql
│   │   │   └── 008_templates.sql
│   │   └── seeds/
│   │       ├── plans.sql
│   │       └── templates.sql
│   │
│   ├── shared/                      ← Tipos y utils compartidos
│   │   ├── types/
│   │   └── utils/
│   │
│   └── license-sdk/                 ← SDK de licencias reutilizable
│       ├── verify.ts
│       ├── generate.ts
│       └── constants.ts
│
├── server/                          ← Backend Node.js
│   ├── src/
│   │   ├── index.ts                 ← Entrada Fastify
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── license.ts
│   │   │   ├── plans.ts
│   │   │   ├── subscriptions.ts
│   │   │   ├── projects.ts
│   │   │   ├── assets.ts
│   │   │   ├── exports.ts
│   │   │   ├── templates.ts
│   │   │   └── admin.ts
│   │   │
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── licenseService.ts    ← Firma RS256, validación
│   │   │   ├── renderService.ts     ← Cola de renders FFmpeg
│   │   │   ├── storageService.ts    ← R2 / S3
│   │   │   ├── emailService.ts
│   │   │   ├── stripeService.ts
│   │   │   └── whisperService.ts    ← Transcripción IA
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts              ← Verificar JWT
│   │   │   ├── license.ts           ← Verificar plan activo
│   │   │   ├── rateLimit.ts
│   │   │   └── upload.ts
│   │   │
│   │   ├── db/
│   │   │   ├── connection.ts        ← Pool MySQL
│   │   │   └── queries/             ← Queries separadas por módulo
│   │   │
│   │   └── utils/
│   │       ├── crypto.ts
│   │       ├── jwt.ts
│   │       ├── deviceHash.ts
│   │       └── validators.ts
│   │
│   ├── keys/
│   │   ├── private.pem              ← Clave privada RS256 (NO en git)
│   │   └── public.pem               ← Clave pública
│   │
│   └── package.json
│
├── docker-compose.yml
├── .env.example
├── package.json                     ← Monorepo (pnpm workspaces)
└── README.md

6. Estado del Proyecto (Zustand)
typescript// store/editorStore.ts

interface EditorState {
  // Audio
  audioFile: File | null
  audioBuffer: AudioBuffer | null
  bpm: number
  duration: number
  currentTime: number
  isPlaying: boolean

  // Visual
  activeTemplate: string | null
  backgroundColor: string
  backgroundImageUrl: string | null
  backgroundVideoUrl: string | null

  // 3D
  glbObjects: GLBObject[]       // lista de modelos cargados
  particles: ParticleConfig[]
  lights: LightConfig[]
  cameraPath: CameraKeyframe[]

  // Audio Reactive
  audioReactive: {
    bass: number      // 0 - 1 en tiempo real
    mid: number
    treble: number
    kick: boolean
    beat: boolean
  }

  // Lyrics
  lyricsLines: LyricLine[]      // { start, end, text, translation? }
  activeLyricIndex: number
  lyricStyle: LyricStyle

  // Timeline
  tracks: Track[]
  keyframes: Keyframe[]
  playheadTime: number
  zoomLevel: number

  // Proyecto
  projectId: string | null
  isDirty: boolean
  lastSaved: Date | null

  // Acciones
  setAudioFile: (file: File) => void
  updateReactive: (data: AudioReactiveData) => void
  addGLB: (obj: GLBObject) => void
  updateLyricLine: (index: number, line: LyricLine) => void
  addKeyframe: (kf: Keyframe) => void
  saveProject: () => Promise<void>
  exportVideo: (options: ExportOptions) => Promise<void>
}

7. Lógica de Audio Reactivo
typescript// lib/audioAnalyzer.ts

export class AudioAnalyzer {
  private context: AudioContext
  private analyser: AnalyserNode
  private source: AudioBufferSourceNode | null = null
  private dataArray: Uint8Array

  constructor() {
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 2048
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
  }

  getFrequencyBands() {
    this.analyser.getByteFrequencyData(this.dataArray)

    const bass   = this.average(this.dataArray, 0, 10)    // 20-300 Hz
    const mid    = this.average(this.dataArray, 10, 100)   // 300-4000 Hz
    const treble = this.average(this.dataArray, 100, 512)  // 4000+ Hz

    const kickThreshold = 200
    const kick = bass > kickThreshold

    return {
      bass:   bass / 255,
      mid:    mid / 255,
      treble: treble / 255,
      kick,
      beat:   bass > 180
    }
  }

  private average(arr: Uint8Array, start: number, end: number) {
    let sum = 0
    for (let i = start; i < end; i++) sum += arr[i]
    return sum / (end - start)
  }
}

8. Estructura de un Proyecto Guardado (JSON)
json{
  "version": "1.0",
  "id": "proj_abc123",
  "title": "Mi video fonk",
  "template": "phonk-glitch",
  "duration": 210.5,
  "bpm": 138,
  "audio": {
    "url": "https://r2.soniccanvas.io/assets/track.mp3",
    "offset": 0
  },
  "background": {
    "type": "image",
    "url": "https://r2.soniccanvas.io/assets/bg.jpg",
    "blur": 0,
    "opacity": 1
  },
  "glbObjects": [
    {
      "id": "glb_1",
      "url": "/glb/skull.glb",
      "position": [0, 0, -2],
      "rotation": [0, 0, 0],
      "scale": 1,
      "audioReactive": {
        "bass": { "property": "scale", "multiplier": 0.3 },
        "kick": { "property": "position.y", "impulse": 0.5 }
      }
    }
  ],
  "lyrics": [
    { "start": 2.1, "end": 5.3, "text": "Primera línea", "translation": "First line" },
    { "start": 5.5, "end": 8.0, "text": "Segunda línea", "translation": "Second line" }
  ],
  "lyricStyle": {
    "fontFamily": "Bebas Neue",
    "fontSize": 64,
    "color": "#ffffff",
    "glow": true,
    "glowColor": "#ff00ff",
    "animation": "bounce",
    "translationColor": "#aaaaaa",
    "translationSize": 32
  },
  "particles": {
    "enabled": true,
    "count": 500,
    "reactTo": "treble",
    "color": "#ffffff",
    "size": 0.05
  },
  "camera": {
    "type": "orbit",
    "shakeOnBeat": true,
    "shakeIntensity": 0.1
  },
  "tracks": [
    {
      "id": "track_1",
      "name": "GLB Rotation",
      "targetId": "glb_1",
      "property": "rotation.y",
      "keyframes": [
        { "time": 0, "value": 0, "easing": "linear" },
        { "time": 210, "value": 6.28, "easing": "linear" }
      ]
    }
  ],
  "effects": {
    "bloom": { "enabled": true, "intensity": 1.5 },
    "glitch": { "enabled": true, "reactTo": "kick" },
    "colorGrade": { "hue": 0, "saturation": 1.2, "brightness": 1 }
  }
}

9. Planes Comerciales (Datos para plans)
sqlINSERT INTO plans VALUES
(1, 'Free',     'free', 0,   0.00, 1, '720p',  1, 2,  1, ...),
(2, '1 Mes',    '1m',   30,  9.99, 5, '1080p', 0, 4,  1, ...),
(3, '3 Meses',  '3m',   90,  24.99, 15, '1080p', 0, 6,  1, ...),
(4, '6 Meses',  '6m',   180, 44.99, 30, '2K',    0, 8,  2, ...),
(5, '12 Meses', '12m',  365, 79.99, -1, '4K',    0, -1, 3, ...);
PlanPrecioResoluciónProyectosDispositivosWatermarkFree$0720p11Sí1 mes$9.991080p51No3 meses$24.991080p151No6 meses$44.992K302No12 meses$79.994KIlimitado3No

10. MVP — Orden de Construcción
SPRINT 1 — BASE (2-3 semanas)
├── Login / registro
├── Gestión de planes (Free hardcoded)
├── Dashboard de proyectos
├── Subida de audio y imagen
└── Canvas básico (Three.js con fondo e imagen)

SPRINT 2 — CORE VISUAL (3-4 semanas)
├── Audio analyzer (FFT + beats)
├── Audio reactive básico (escala + glow)
├── Sistema de letras (import + timing manual)
├── 2-3 templates base
└── Export 720p con FFmpeg.wasm

SPRINT 3 — MONETIZACIÓN (2-3 semanas)
├── Sistema de licencias (servidor + tokens)
├── Integración Stripe
├── Planes activos / expiración
├── Export sin watermark para pagados
└── Límite de proyectos por plan

SPRINT 4 — 3D Y EFECTOS (3-4 semanas)
├── Carga de GLB
├── Partículas
├── Postprocessing (bloom, glitch)
├── Camera shake
└── 5-8 templates premium

SPRINT 5 — IA Y EXTRAS (4+ semanas)
├── Whisper para transcripción automática
├── Sincronización automática de lyrics
├── Traducción automática
├── Timeline con keyframes
└── Export 4K server-side

11. Variables de Entorno
bash# .env.example

# App
APP_URL=https://soniccanvas.io
APP_SECRET=secreto_muy_largo

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=soniccanvas
DB_USER=root
DB_PASS=password

# JWT
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d
LICENSE_TOKEN_EXPIRES=7d

# Claves RS256 (rutas a archivos .pem)
LICENSE_PRIVATE_KEY_PATH=./keys/private.pem
LICENSE_PUBLIC_KEY_PATH=./keys/public.pem

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=soniccanvas-assets
R2_PUBLIC_URL=https://assets.soniccanvas.io

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# IA
OPENAI_API_KEY=
ASSEMBLYAI_KEY=

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@soniccanvas.io

Este es el plan completo en texto. Cuando quieras empezamos con cualquier pieza específica: el servidor Node.js, el editor Three.js, el sistema de licencias, o el canvas de letras sincronizadas.Dijiste: Debe ser app de escritorio para mac Windows y LinuxDebe ser app de escritorio para mac Windows y Linux1:342 / 2Claude respondió: Visual Music Studio — Desktop App (Mac · Windows · Linux)Recalibró arquitectura técnica hacia framework multiplataformaRecalibró arquitectura técnica hacia framework multiplataformaVisual Music Studio — Desktop App (Mac · Windows · Linux)

Decisión de Framework
Tauri vs Electron
TauriElectronTamaño del instalador~10 MB~150 MBRAM en idle~50 MB~300 MBVelocidad de arranqueRápidoLentoAcceso a GPUSí (WebGPU/WebGL)SíAcceso a filesystemSí (Rust)Sí (Node)FFmpeg nativoSí, muy fácilSíSoporte Mac/Win/LinuxSíSíLenguaje backendRustNode.jsMadurezMedioAlto
Recomendación: Tauri 2.0
Porque para una app que hace:

render 3D pesado
exportación de video
audio analysis en tiempo real
gestión de archivos locales

...necesitas que el sistema operativo NO luche contra el framework.

Arquitectura General (Desktop)
┌─────────────────────────────────────────────────────────────┐
│                    APP TAURI (proceso principal)            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              WEBVIEW (frontend)                      │  │
│  │                                                      │  │
│  │  Next.js (exportado estático) / Vite + React        │  │
│  │  Three.js + React Three Fiber                       │  │
│  │  Web Audio API + FFT                                │  │
│  │  Zustand (estado global)                            │  │
│  │  Tailwind + Framer Motion                           │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │  invoke() / events                  │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │              RUST CORE (backend nativo)              │  │
│  │                                                      │  │
│  │  Gestión de archivos (filesystem)                   │  │
│  │  FFmpeg nativo (render / export)                    │  │
│  │  Licencias (verificación + cifrado local)           │  │
│  │  SQLite local (proyectos offline)                   │  │
│  │  HTTP client (sync con servidor)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
              Solo cuando hay internet
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  SERVIDOR REMOTO                            │
│                                                             │
│  Node.js + Fastify                                         │
│  MySQL (usuarios, licencias, pagos)                        │
│  Stripe (cobros)                                           │
│  Cloudflare R2 (assets premium, templates, GLB)           │
│  Whisper / AssemblyAI (IA lyrics)                          │
└─────────────────────────────────────────────────────────────┘

Stack Definitivo
Frontend (dentro del WebView de Tauri)
Vite + React + TypeScript
Tailwind CSS
Zustand (estado global)
Framer Motion (animaciones UI)
Three.js + React Three Fiber + Drei
@react-three/postprocessing
Web Audio API (FFT nativo del browser engine)
FFmpeg.wasm (export rápido en cliente)

Se usa Vite en lugar de Next.js porque en desktop no necesitas SSR.
Next.js estático funciona también, pero Vite es más rápido para apps desktop.


Backend Nativo (Rust en Tauri)
tauri 2.0
tauri-plugin-fs          → leer/escribir archivos
tauri-plugin-dialog      → file pickers nativos
tauri-plugin-shell       → ejecutar FFmpeg binario
tauri-plugin-http        → llamadas al servidor
tauri-plugin-store       → almacenamiento cifrado local
tauri-plugin-notification → notificaciones del sistema
rusqlite                 → SQLite local (proyectos)

Render / Exportación
FFmpeg binario embebido en la app
  → el usuario NO necesita instalar nada
  → funciona offline
  → acceso a GPU (NVENC / VideoToolbox / VAAPI)

Aceleración por plataforma:
  Mac    → VideoToolbox (H.264/HEVC nativo)
  Windows → NVENC (NVIDIA) / QuickSync (Intel)
  Linux  → VAAPI / NVENC

Estructura de Carpetas (Tauri + Vite + React)
soniccanvas-desktop/
│
├── src/                              ← Frontend React
│   │
│   ├── main.tsx                      ← Entry point
│   ├── App.tsx                       ← Router principal
│   │
│   ├── pages/
│   │   ├── Onboarding.tsx            ← Primera vez
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx             ← Lista de proyectos
│   │   ├── Editor.tsx                ← Editor principal
│   │   ├── Templates.tsx             ← Galería de templates
│   │   ├── Settings.tsx
│   │   └── Billing.tsx
│   │
│   ├── components/
│   │   │
│   │   ├── editor/
│   │   │   ├── EditorLayout.tsx      ← Layout del editor
│   │   │   ├── Viewport.tsx          ← Canvas Three.js principal
│   │   │   ├── Timeline.tsx          ← Timeline de tracks
│   │   │   ├── Toolbar.tsx           ← Herramientas superiores
│   │   │   ├── PropertiesPanel.tsx   ← Panel derecho propiedades
│   │   │   ├── LayersPanel.tsx       ← Panel izquierdo capas
│   │   │   └── ExportDialog.tsx
│   │   │
│   │   ├── canvas/
│   │   │   ├── SceneRoot.tsx         ← R3F Canvas raíz
│   │   │   ├── BackgroundLayer.tsx   ← Fondo (imagen/video/gradiente)
│   │   │   ├── GLBObject.tsx         ← Modelo 3D individual
│   │   │   ├── ParticleSystem.tsx    ← Sistema de partículas
│   │   │   ├── LyricsLayer.tsx       ← Renderizado de letras
│   │   │   ├── EffectsLayer.tsx      ← Postprocessing
│   │   │   ├── CameraRig.tsx         ← Control de cámara
│   │   │   └── LightingSetup.tsx
│   │   │
│   │   ├── audio/
│   │   │   ├── AudioEngine.tsx       ← Web Audio API
│   │   │   ├── WaveformDisplay.tsx   ← Forma de onda visual
│   │   │   └── BeatDetector.tsx      ← Detección de beats
│   │   │
│   │   ├── lyrics/
│   │   │   ├── LyricsEditor.tsx      ← Editar timing de letras
│   │   │   ├── LyricLine.tsx
│   │   │   └── LyricsImporter.tsx    ← Importar .lrc / .srt / texto
│   │   │
│   │   ├── templates/
│   │   │   ├── TemplateCard.tsx
│   │   │   ├── TemplatePreview.tsx
│   │   │   │
│   │   │   └── presets/
│   │   │       ├── NeonLyrics.ts     ← Config JSON del template
│   │   │       ├── SpaceVisualizer.ts
│   │   │       ├── PhonkGlitch.ts
│   │   │       ├── DarkCinematic.ts
│   │   │       ├── KaraokeClean.ts
│   │   │       ├── LoFiRain.ts
│   │   │       └── CyberpunkCity.ts
│   │   │
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Slider.tsx
│   │       ├── ColorPicker.tsx
│   │       ├── Modal.tsx
│   │       ├── Tooltip.tsx
│   │       ├── ContextMenu.tsx
│   │       └── FileDropZone.tsx
│   │
│   ├── store/
│   │   ├── editorStore.ts            ← Estado del editor (Zustand)
│   │   ├── projectStore.ts           ← Proyectos locales
│   │   ├── authStore.ts              ← Sesión + licencia
│   │   ├── audioStore.ts             ← Estado del audio
│   │   └── uiStore.ts                ← Paneles, modales, zoom
│   │
│   ├── hooks/
│   │   ├── useAudioReactive.ts       ← FFT en tiempo real
│   │   ├── useBeatDetection.ts
│   │   ├── useTimeline.ts
│   │   ├── useProject.ts             ← CRUD proyectos (SQLite)
│   │   ├── useLicense.ts             ← Estado de licencia
│   │   ├── useExport.ts              ← Control del render
│   │   ├── useFileSystem.ts          ← invoke() a Rust
│   │   └── useKeyboardShortcuts.ts
│   │
│   ├── lib/
│   │   ├── tauri/
│   │   │   ├── commands.ts           ← invoke() wrappers tipados
│   │   │   ├── events.ts             ← event listeners de Tauri
│   │   │   └── fs.ts                 ← helpers de filesystem
│   │   │
│   │   ├── audio/
│   │   │   ├── Analyzer.ts           ← FFT + frequency bands
│   │   │   ├── BeatTracker.ts        ← Detección BPM
│   │   │   └── Scheduler.ts          ← Sync de eventos al beat
│   │   │
│   │   ├── render/
│   │   │   ├── FrameCapture.ts       ← Canvas → frames
│   │   │   ├── FFmpegExporter.ts     ← wasm o nativo (según plan)
│   │   │   └── RenderQueue.ts
│   │   │
│   │   ├── license/
│   │   │   ├── LicenseManager.ts     ← Verificar / cachear licencia
│   │   │   └── DeviceHash.ts         ← Generar hash del dispositivo
│   │   │
│   │   ├── project/
│   │   │   ├── ProjectSerializer.ts  ← JSON ↔ estado Zustand
│   │   │   └── ProjectMigrator.ts    ← Migrar versiones antiguas
│   │   │
│   │   └── api/
│   │       ├── client.ts             ← HTTP client (fetch / tauri-http)
│   │       ├── auth.ts
│   │       ├── license.ts
│   │       └── assets.ts
│   │
│   ├── types/
│   │   ├── project.ts
│   │   ├── editor.ts
│   │   ├── license.ts
│   │   ├── audio.ts
│   │   └── tauri.ts                  ← Tipos de comandos Rust
│   │
│   └── assets/
│       ├── fonts/
│       ├── icons/
│       └── thumbnails/
│
├── src-tauri/                        ← Backend Rust
│   │
│   ├── src/
│   │   ├── main.rs                   ← Entry point Tauri
│   │   ├── lib.rs
│   │   │
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── file_system.rs        ← open/save/read archivos
│   │   │   ├── export.rs             ← llamar FFmpeg, progreso
│   │   │   ├── license.rs            ← verificar/guardar licencia
│   │   │   ├── database.rs           ← operaciones SQLite
│   │   │   ├── audio.rs              ← metadata de audio (duración, BPM)
│   │   │   └── system.rs             ← info del sistema, GPU
│   │   │
│   │   ├── services/
│   │   │   ├── ffmpeg.rs             ← wrapper de FFmpeg binario
│   │   │   ├── license_crypto.rs     ← verificar firma JWT offline
│   │   │   ├── sqlite.rs             ← pool de conexiones SQLite
│   │   │   └── device_id.rs          ← generar device hash único
│   │   │
│   │   └── models/
│   │       ├── project.rs
│   │       └── license.rs
│   │
│   ├── binaries/                     ← FFmpeg precompilado por plataforma
│   │   ├── ffmpeg-x86_64-apple-darwin
│   │   ├── ffmpeg-x86_64-pc-windows-msvc.exe
│   │   ├── ffmpeg-x86_64-unknown-linux-gnu
│   │   └── ffmpeg-aarch64-apple-darwin   ← Mac M1/M2/M3
│   │
│   ├── icons/                        ← Íconos de la app
│   │   ├── icon.icns                 ← Mac
│   │   ├── icon.ico                  ← Windows
│   │   └── icon.png                  ← Linux
│   │
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── public/
│   ├── glb/                          ← Modelos 3D base incluidos
│   │   ├── sphere.glb
│   │   ├── cube.glb
│   │   └── abstract_01.glb
│   │
│   └── shaders/                      ← GLSL shaders
│       ├── neon.glsl
│       ├── glitch.glsl
│       └── smoke.glsl
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env

Base de Datos Local (SQLite)
La app guarda proyectos y licencia completamente offline en SQLite.
sql-- Ruta: ~/Library/Application Support/SonicCanvas/data.db  (Mac)
--       %APPDATA%\SonicCanvas\data.db                       (Windows)
--       ~/.config/soniccanvas/data.db                       (Linux)

CREATE TABLE projects (
  id           TEXT PRIMARY KEY,       -- UUID
  title        TEXT    NOT NULL,
  thumbnail    BLOB    DEFAULT NULL,   -- PNG pequeño guardado inline
  audio_path   TEXT    DEFAULT NULL,   -- ruta local al archivo
  duration_sec REAL    DEFAULT 0,
  template_id  TEXT    DEFAULT NULL,
  project_json TEXT    NOT NULL,       -- estado completo serializado
  status       TEXT    DEFAULT 'draft',
  created_at   INTEGER DEFAULT (unixepoch()),
  updated_at   INTEGER DEFAULT (unixepoch())
);

CREATE TABLE assets (
  id           TEXT PRIMARY KEY,
  project_id   TEXT    NOT NULL,
  asset_type   TEXT    NOT NULL,       -- audio, image, glb, video
  file_name    TEXT    NOT NULL,
  file_path    TEXT    NOT NULL,       -- ruta absoluta local
  file_size    INTEGER DEFAULT 0,
  created_at   INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE exports (
  id           TEXT PRIMARY KEY,
  project_id   TEXT    NOT NULL,
  output_path  TEXT    DEFAULT NULL,
  resolution   TEXT    NOT NULL,
  format       TEXT    DEFAULT 'mp4',
  status       TEXT    DEFAULT 'queued', -- queued, processing, done, failed
  progress     INTEGER DEFAULT 0,
  watermark    INTEGER DEFAULT 1,
  created_at   INTEGER DEFAULT (unixepoch()),
  completed_at INTEGER DEFAULT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE license_cache (
  id           INTEGER PRIMARY KEY,
  token        TEXT    NOT NULL,       -- JWT cifrado
  user_email   TEXT    NOT NULL,
  plan_slug    TEXT    NOT NULL,
  plan_json    TEXT    NOT NULL,       -- features snapshot
  issued_at    INTEGER NOT NULL,
  expires_at   INTEGER NOT NULL,       -- offline grace
  device_hash  TEXT    NOT NULL,
  server_time  INTEGER DEFAULT NULL    -- última hora válida del servidor
);

CREATE TABLE app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

Comandos Rust (invoke desde React)
rust// src-tauri/src/commands/file_system.rs

#[tauri::command]
pub async fn open_file_dialog(filters: Vec<FileFilter>) 
    -> Result<Option<String>, String>

#[tauri::command]
pub async fn read_file_bytes(path: String) 
    -> Result<Vec<u8>, String>

#[tauri::command]
pub async fn save_project(id: String, json: String) 
    -> Result<(), String>

#[tauri::command]
pub async fn load_project(id: String) 
    -> Result<String, String>

#[tauri::command]
pub async fn list_projects() 
    -> Result<Vec<ProjectMeta>, String>

#[tauri::command]
pub async fn delete_project(id: String) 
    -> Result<(), String>
rust// src-tauri/src/commands/export.rs

#[tauri::command]
pub async fn start_export(
    app: AppHandle,
    project_json: String,
    output_path: String,
    resolution: String,        // "720p", "1080p", "2K", "4K"
    fps: u32,                  // 30 o 60
    format: String,            // "mp4", "webm"
    watermark: bool,
    use_gpu: bool,
) -> Result<String, String>    // devuelve export_id

#[tauri::command]
pub async fn get_export_progress(export_id: String) 
    -> Result<ExportStatus, String>

#[tauri::command]
pub async fn cancel_export(export_id: String) 
    -> Result<(), String>
rust// src-tauri/src/commands/license.rs

#[tauri::command]
pub async fn verify_license_online(
    email: String,
    password: String,
    device_name: String,
) -> Result<LicenseToken, String>

#[tauri::command]
pub async fn get_cached_license() 
    -> Result<Option<LicenseInfo>, String>

#[tauri::command]
pub async fn get_device_hash() 
    -> Result<String, String>

#[tauri::command]
pub async fn revoke_device() 
    -> Result<(), String>

Llamadas desde React a Rust
typescript// src/lib/tauri/commands.ts

import { invoke } from '@tauri-apps/api/core'

export const tauriCommands = {

  // Filesystem
  openFile: (filters: FileFilter[]) =>
    invoke<string | null>('open_file_dialog', { filters }),

  saveProject: (id: string, json: string) =>
    invoke<void>('save_project', { id, json }),

  loadProject: (id: string) =>
    invoke<string>('load_project', { id }),

  listProjects: () =>
    invoke<ProjectMeta[]>('list_projects'),

  // Export
  startExport: (options: ExportOptions) =>
    invoke<string>('start_export', options),

  getExportProgress: (exportId: string) =>
    invoke<ExportStatus>('get_export_progress', { exportId }),

  cancelExport: (exportId: string) =>
    invoke<void>('cancel_export', { exportId }),

  // Licencia
  verifyLicense: (email: string, password: string, deviceName: string) =>
    invoke<LicenseToken>('verify_license_online', { email, password, deviceName }),

  getCachedLicense: () =>
    invoke<LicenseInfo | null>('get_cached_license'),

  getDeviceHash: () =>
    invoke<string>('get_device_hash'),
}

Flujo de Exportación con FFmpeg Nativo
Usuario hace clic en "Exportar"
        │
        ▼
React captura frames del canvas (WebGL readPixels)
uno por uno al tempo del timeline
        │
        ▼
Frames enviados a Rust via invoke() como bytes
        │
        ▼
Rust llama al binario FFmpeg embebido:

  ffmpeg
    -framerate 30
    -i frame_%04d.png     ← frames temporales
    -i audio.mp3          ← audio original
    -vcodec h264_videotoolbox  ← GPU Mac
    -vcodec h264_nvenc         ← GPU NVIDIA Win/Linux
    -vcodec libx264            ← CPU fallback
    -crf 18
    -preset fast
    -pix_fmt yuv420p
    output.mp4
        │
        ▼
Rust emite eventos de progreso cada segundo:
  emit('export_progress', { percent: 45, eta_sec: 12 })
        │
        ▼
React escucha el evento y actualiza la barra
        │
        ▼
Rust emite 'export_done' con la ruta final
        │
        ▼
React abre el diálogo: "¿Abrir en Finder/Explorer?"

Distribución por Plataforma
Mac
├── soniccanvas_1.0.0_aarch64.dmg    ← Apple Silicon (M1/M2/M3/M4)
├── soniccanvas_1.0.0_x64.dmg        ← Intel Mac
└── Notarizado con Apple (obligatorio para distribuir sin warning)

Windows
├── soniccanvas_1.0.0_x64_en-US.msi  ← Instalador MSI
├── soniccanvas_1.0.0_x64-setup.exe  ← NSIS installer
└── Firmado con certificado EV (opcional, reduce alertas SmartScreen)

Linux
├── soniccanvas_1.0.0_amd64.deb      ← Ubuntu / Debian
├── soniccanvas_1.0.0_amd64.rpm      ← Fedora / RHEL
└── soniccanvas_1.0.0_amd64.AppImage ← Universal (sin instalación)
Build con GitHub Actions
yaml# .github/workflows/release.yml

name: Release Desktop App

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: macos-latest
            target: aarch64-apple-darwin      # M1/M2/M3
          - os: macos-latest
            target: x86_64-apple-darwin       # Intel
          - os: windows-latest
            target: x86_64-pc-windows-msvc
          - os: ubuntu-22.04
            target: x86_64-unknown-linux-gnu

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install deps
        run: npm install

      - name: Build Tauri
        uses: tauri-apps/tauri-action@v0
        env:
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_KEY }}
        with:
          tagName: v__VERSION__
          releaseName: SonicCanvas v__VERSION__
          args: --target ${{ matrix.target }}

Auto-Update
Tauri tiene sistema de auto-update nativo:
json// tauri.conf.json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://updates.soniccanvas.io/{{target}}/{{arch}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "tu_clave_publica_para_firmar_updates"
    }
  }
}
El servidor sirve un JSON de actualización:
json{
  "version": "1.2.0",
  "notes": "Nuevos templates + fix export Mac",
  "pub_date": "2025-01-15T00:00:00Z",
  "platforms": {
    "darwin-aarch64": { "url": "...", "signature": "..." },
    "darwin-x86_64":  { "url": "...", "signature": "..." },
    "windows-x86_64": { "url": "...", "signature": "..." },
    "linux-x86_64":   { "url": "...", "signature": "..." }
  }
}

Orden de Construcción (MVP Desktop)
SEMANA 1-2 — Setup base
├── Proyecto Tauri + Vite + React + TypeScript
├── Layout del editor (paneles, sidebar, toolbar)
├── FileDropZone para audio e imagen
└── Integración SQLite local

SEMANA 3-4 — Canvas y audio
├── Three.js scene básica (fondo + iluminación)
├── Web Audio API + FFT analyzer
├── Audio reactive: escala + glow reactivo al bass
└── Waveform display en timeline

SEMANA 5-6 — Letras y templates
├── LyricsEditor (importar texto + timing manual)
├── LyricsLayer en Three.js (texto 3D / canvas 2D)
├── 3 templates base (Neon, Space, Phonk)
└── Template switcher

SEMANA 7-8 — Export
├── Frame capture del WebGL canvas
├── FFmpeg nativo en Rust
├── Export MP4 720p funcional
├── Barra de progreso en tiempo real
└── Watermark para Free

SEMANA 9-10 — Licencias y pagos
├── Sistema de licencia JWT (servidor + Rust crypto)
├── Login online → cache offline
├── Planes: Free / 1m / 3m / 6m / 12m
├── Stripe integrado
└── Restricciones por plan (resolución, watermark)

SEMANA 11-12 — Pulir y distribuir
├── Builds Mac (Intel + Apple Silicon)
├── Build Windows
├── Build Linux (.deb + AppImage)
├── Auto-updater
└── Onboarding primera vez

Variables de Entorno (.env)
bash# Solo se usa para conectar al servidor de licencias y assets
VITE_API_URL=https://api.soniccanvas.io
VITE_ASSETS_URL=https://assets.soniccanvas.io
VITE_LICENSE_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...

# En desarrollo
VITE_API_URL=http://localhost:3001

Con este plan tienes todo lo necesario para arrancar. La parte más importante del MVP es: canvas funciona → audio reactivo → letras sincronizadas → export mp4. Todo lo demás viene después. ¿Por dónde quieres empezar?Dijiste: Primero dame una descripción del productoPrimero dame una descripción del producto2:15Claude respondió: SonicCanvasIdentificó solicitud de descripción de productoIdentificó solicitud de descripción de productoSonicCanvas
Crea videos musicales cinematográficos en minutos, sin ser editor profesional.

SonicCanvas es una aplicación de escritorio para Mac, Windows y Linux que convierte cualquier canción en un video musical listo para publicar. Sin timeline complicado, sin nodos, sin renders que tardan horas. Solo subes tu música, eliges un estilo visual, y la aplicación hace el resto.
El motor de audio reactivo analiza tu canción en tiempo real: detecta los bajos, los medios, el BPM y cada golpe de batería. Con esa información, las luces pulsan, los modelos 3D laten, las partículas explotan y la cámara tiembla exactamente cuando debe. Todo sincronizado automáticamente con la música, sin tocar un solo keyframe.
Las letras se sincronizan con la canción línea por línea. Puedes importarlas como texto simple, como archivo LRC o dejar que la inteligencia artificial las transcriba y las coloque sola. Aparecen con animaciones de karaoke, glow, bounce o stroke, en el idioma original o con traducción automática debajo.
La escena es completamente tridimensional. Puedes cargar modelos GLB, agregar sistemas de partículas, cambiar la iluminación y aplicar efectos de postprocessing como bloom, glitch o desenfoque de movimiento. Todo corre en tiempo real en tu GPU, sin esperar previews.
Cuando estás listo para exportar, SonicCanvas usa FFmpeg nativo con aceleración por hardware: VideoToolbox en Mac, NVENC en Windows con NVIDIA, VAAPI en Linux. El resultado es un archivo MP4 limpio, en la resolución que tu plan permite, listo para subir a TikTok, YouTube Shorts, Instagram Reels o Spotify Canvas.
Funciona completamente offline. Tus proyectos se guardan en tu computadora. No necesitas conexión para editar ni para exportar. La nube solo entra en juego cuando quieres sincronizar licencia, descargar templates premium o usar las funciones de inteligencia artificial.

Para quién es:
Artistas independientes que quieren un video para cada sencillo sin pagar a un editor. DJs que necesitan visualizers para sus sets y mezclas. Creadores de contenido que suben lyrics videos, AMVs o edits musicales. Canales de YouTube especializados en música. Agencias pequeñas que producen contenido musical para varios clientes a la vez.

Lo que lo hace diferente:
La mayoría de editores de video te dan herramientas y te dejan solo. SonicCanvas hace el trabajo pesado por ti. La sincronización con la música es automática. Los templates ya están diseñados para verse cinematográficos desde el primer segundo. Y el render usa tu GPU local, así que no dependes de servidores lentos ni de colas de espera.
No es After Effects. No intenta serlo. Es la herramienta que debería haber existido desde hace años para cualquiera que haga música y necesite un video que esté a la altura.


Tu música merece verse tan bien como suena.
