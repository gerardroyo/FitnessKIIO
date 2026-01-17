# FitnessKIIO - Gym Tracker PWA

Una aplicación web progresiva (PWA) "mobile-first" diseñada para registrar entrenamientos de forma rápida y eficiente, inspirada en una estética Dark Emerald premium.

## Características Principales
*   **Registro Ultra-Rápido**: Chips de peso, control de repeticiones y auto-temporizador de descanso.
*   **Offline First**: Funciona sin internet usando IndexedDB (Dexie.js).
*   **Visualización Premium**: Tema oscuro optimizado para baterías OLED y baja fatiga visual.
*   **Estadísticas**: Gráficas de progresión de 1RM y Volumen usando Recharts.
*   **PWA Instalable**: Se siente como una app nativa en iOS y Android.

## Setup & Desarrollo

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Iniciar servidor de desarrollo**:
    ```bash
    npm run dev
    ```
    Visita `http://localhost:3000`.

3.  **Construir para producción**:
    ```bash
    npm run build
    npm start
    ```

## Despliegue en Vercel

1.  Sube este repositorio a GitHub.
2.  Importa el proyecto en [Vercel](https://vercel.com).
3.  Despliega (no requiere configuración de entorno adicional).

## Instalación en Móvil (PWA)

1.  Abre la web desplegada en Safari (iOS) o Chrome (Android).
2.  Toca el botón "Compartir" (iOS) o Menú (Android).
3.  Selecciona **"Añadir a pantalla de inicio"**.
4.  La app aparecerá en tu home como una app nativa.

## Stack Tecnológico
*   Next.js 15 (App Router)
*   Tailwind CSS v4
*   Dexie.js (IndexedDB)
*   Recharts
*   Lucide React (Iconos)
