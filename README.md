# ALTAIR — Analog Location Telemetry Analysis & Intelligence Reporter

**Team Stalred / STRD — NASA Space Apps Challenge**

> *Select an Earth analog. Measure real NASA telemetry. Score its fidelity against the Moon or Mars.*

---

## Requisitos previos

Instala esto antes de empezar:

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| **Python** | 3.10+ | https://python.org/downloads |
| **Node.js** | 18+ | https://nodejs.org |
| **Git** | cualquiera | https://git-scm.com |

---

## Setup — Primera vez (clonar y configurar)

```bash
git clone https://github.com/tu-usuario/ALTAIR.git
cd ALTAIR
```

### 1. Backend (Python / FastAPI)

```bash
cd backend

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Copiar configuración
cp .env.template .env
```

### 2. Frontend (React / Vite)

```bash
cd frontend

# Instalar dependencias
npm install
```

---

## Ejecutar la aplicación

Necesitas **dos terminales abiertas al mismo tiempo**.

### Terminal 1 — Backend

```bash
cd backend
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

uvicorn main:app --reload --port 8000
```

✅ Listo cuando veas:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

📄 Swagger UI: **http://localhost:8000/api/docs**

---

### Terminal 2 — Frontend

```bash
cd frontend
npm run dev
```

✅ Listo cuando veas:
```
  VITE v6.x  ready

  ➜  Local:   http://localhost:5173/
```

🚀 Abre **http://localhost:5173** en tu navegador.

---

## Resumen rápido

```
Paso 1: cd backend  →  python -m venv .venv  →  pip install -r requirements.txt
Paso 2: cd frontend →  npm install
Paso 3: Terminal 1  →  uvicorn main:app --reload --port 8000
Paso 4: Terminal 2  →  npm run dev
Paso 5: Abre        →  http://localhost:5173
```

> ⚠️ Ambos servidores deben estar corriendo al mismo tiempo. El frontend llama al backend en `localhost:8000`.

---

## Estructura del proyecto

```
ALTAIR/
├── backend/                  ← Python FastAPI
│   ├── main.py               ← Servidor principal
│   ├── requirements.txt      ← Dependencias Python
│   ├── .env.template         ← Copiar a .env
│   └── app/
│       ├── services/         ← NASA POWER API + motor de fidelidad
│       └── api/endpoints/    ← /planets y /analysis
│
└── frontend/                 ← React + Vite
    ├── package.json          ← Dependencias Node
    └── src/
        ├── views/            ← Pantallas principales
        └── components/       ← Mapa, telemetría, paneles
```

---

## Datos y APIs utilizadas

| Fuente | Para qué |
|--------|----------|
| NASA POWER API | Temperatura, radiación solar, viento (en vivo) |
| Open-Elevation API | Elevación del terreno |
| NASA LRO Diviner | Parámetros reales de la Luna |
| Perseverance MEDA | Parámetros reales de Marte (Jezero Crater) |

> No se requiere ninguna API key — todas las fuentes son públicas.

---

*Team Stalred / STRD · NASA Space Apps Challenge · 2024*
