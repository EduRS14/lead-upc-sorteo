# Rifa LEAD UPC · Sorteador

Aplicación web para la rifa de la Familia LEAD UPC (sorteo del **22 · 11 · 2026**).
Lee las respuestas de un Google Form, calcula los tickets de cada persona y hace el
sorteo en vivo con un **reel ponderado por tickets**, listo para transmitir por
Instagram Live en vertical (9:16) o en horizontal (16:9).

## Inicio rápido

```bash
npm install
cp .env.example .env.local   # configura la hoja real (opcional en desarrollo)
npm run dev                  # http://localhost:5173
npm test                     # 17 pruebas del motor de datos y sorteo
npm run build                # verifica tipos y genera dist/
```

En Windows/PowerShell: `Copy-Item .env.example .env.local`.

Requiere Node 20 o superior (probado con Node 24).

## Flujo de uso

1. **Datos** — la app lee la hoja configurada por variables de entorno al abrirse.
   Verás un resumen compacto con personas y tickets totales, y un botón
   **Actualizar** para volver a leer. Si en desarrollo no hay hoja configurada,
   carga una nómina ficticia de 165 personas y lo indica con la etiqueta
   **Datos de prueba**.
2. **Premios y reglas** — elige el escenario (6, 9 o 10 premios), ajusta nombres y
   cantidad de ganadores por premio, y define la política de repetición.
3. **Iniciar sorteo** — congela la nómina y entra directo
   al sorteo. Si quieres revisar antes personas, tickets y alertas, usa
   **Revisar nómina**.
4. **Sorteo** — pulsa **Girar** (o la barra espaciadora). El reel es literalmente el
   bombo de tickets: cada ticket es una fila con el nombre, y toda la tira va
   desplegada al azar (sin agrupar nombres). Se detiene en el ganador y aparece la
   tarjeta con su nombre completo.
5. **Ganadores** — lista final agrupada por premio. Exporta **CSV** para compartir y
   **JSON** con la auditoría completa (hash, nómina, premios y cada elección).

El progreso se guarda en `localStorage`: si se recarga la página a mitad del sorteo,
se retoma donde quedó. No borres los datos del sitio durante el evento.

## Cómo se cuentan los tickets

La hoja puede tener una fila por envío o las filas multiplicadas por un colaborador.
El conteo es inmune a esa multiplicación porque trabaja por **envío** (misma marca de
tiempo + misma persona) y no por fila suelta:

| Caso en la hoja | Tickets que cuenta |
| --- | --- |
| Declaró 3 tickets (1 fila o 3 filas repetidas) | 3 |
| Declaró 1 ticket y la fila está repetida 3 veces | 3 (una por fila del envío) |
| Dejó el campo vacío | 1 por fila del envío |
| Compró en dos momentos distintos | suma de ambos envíos |
| Escribió `"2 tickets"` | 2 |
| Nombres con o sin tildes (`José` / `JOSE`) | se unifican |

Regla central: **si declaró 2 o más, se respeta lo declarado**; si declaró 1 o dejó
vacío, se cuentan las filas de ese envío.

### Alertas (no bloquean el sorteo)

- **Sin consentimiento** — respondió «No» a la autorización de datos. Se excluye del
  sorteo si la opción está activa (recomendado).
- **Tickets vacío** — no indicó cantidad.
- **Tickets alto** — declaró más de 50 tickets.
- **Filas no coinciden** — la cantidad de filas no coincide con lo declarado.
- **Operación repetida** — el mismo N.° de operación aparece en personas distintas.
  Puede ser legítimo (alguien pagó por varias); revísalo con Finanzas.

## Cómo funciona el sorteo

- Cada persona pesa según sus tickets (no es uniforme entre personas): en el bombo
  aporta una fila por ticket, y todas las filas se mezclan entre sí.
- El número aleatorio se genera con `crypto.getRandomValues` y rechazo de sesgo.
- Políticas de repetición:
  - **Nadie gana dos veces** (por defecto): al ganar, sale del sorteo.
  - **Puede ganar varias veces**: conserva sus tickets restantes.
  - **Solo si ya ganaron todos**: se permite repetir cuando ya ganó alguien.
- La nómina se congela al iniciar. El JSON de auditoría guarda una huella SHA-256 de
  la lista congelada para verificarla después; esa huella no se muestra en pantalla.
- Puedes configurar varios ganadores por premio; el botón dirá «Siguiente ganador»
  hasta completar ese premio.

## Configuración de la hoja (variables de entorno)

La app **no** escribe en la hoja del formulario: solo lee. La conexión no se
configura desde la interfaz; se define por variables de entorno en el build.

Crea `.env.local` a partir de `.env.example`:

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `VITE_SHEET_URL` | Sí (producción) | URL de la aplicación web de Apps Script, debe terminar en `/exec`. |
| `VITE_SHEET_TOKEN` | Sí | Token que valida el script antes de devolver datos. |
| `VITE_USE_MOCK` | No | `true` fuerza los datos de prueba (útil para ensayos del build). |

```bash
VITE_SHEET_URL=https://script.google.com/macros/s/XXXX/exec
VITE_SHEET_TOKEN=lead-rifa-2026-...
```

El acceso se hace a través de una **Aplicación web de Apps Script** publicada en tu
propio Drive, que devuelve JSON con esta forma:

```json
{
  "generatedAt": "2026-11-20T18:00:00.000Z",
  "sheet": "Respuestas de formulario 1",
  "count": 2,
  "rows": [
    {
      "ts": "18/11/2026 10:42:11",
      "nombres": "María",
      "apellidos": "Pérez Rojas",
      "area": "Marketing",
      "tickets": "3",
      "operacion": "OP123456",
      "disponible": "Sí",
      "consent": "Sí, autorizo el uso de mis datos"
    }
  ]
}
```

Notas importantes:

- La URL debe terminar en `/exec`. La app agrega el token como query param
  (`?token=...`) automáticamente.
- Si Google abre la URL con `/macros/u/1/`, la app lo corrige sola. Si el endpoint
  responde un 404 de Drive, vuelve a copiar la URL desde **Implementar → Gestionar
  implementaciones** (sin el `/u/1/`).
- El script valida el token antes de devolver datos. No se expone teléfono ni correo:
  solo nombre, área, tickets y las marcas necesarias para auditar.
- No cambies la implementación a «Ejecutar como: yo / acceso: cualquiera» sin token;
  mantén el token como única llave.
- Las variables `VITE_*` se incluyen en el bundle del navegador: usa un token
  exclusivo para este endpoint y rótalo si deja de ser privado.
- En desarrollo, sin `VITE_SHEET_URL`, la app usa datos de prueba y lo muestra en
  pantalla. En producción, si falta la variable, la app no deja iniciar el sorteo.

## Publicar en GitHub

Esta carpeta ya está lista para subirse: incluye el código, `package-lock.json`,
`.gitignore`, `.env.example` y un repositorio Git inicializado en `main` (sin
`node_modules`, `dist` ni archivos `.env.local`).

```bash
# 1. Crea el repositorio vacío en GitHub (sin README ni .gitignore)
# 2. Conéctalo y sube:
git remote add origin https://github.com/<usuario>/<repositorio>.git
git push -u origin main
```

Si prefieres subirlo desde GitHub Desktop: **File → Add local repository**,
selecciona esta carpeta, pulsa **Publish repository**.

El repositorio incluye un workflow de GitHub Actions
(`.github/workflows/ci.yml`) que instala con `npm ci`, corre las pruebas y compila
en cada push a `main`.

## Despliegue en Vercel

1. En Vercel, **Add New → Project** e importa el repositorio que acabas de subir.
2. Configuración detectada automáticamente (no hay que tocar nada):
   - Framework: **Vite**
   - Install command: `npm install` (usa el `package-lock.json`)
   - Build command: `npm run build`
   - Output directory: `dist`
3. En **Settings → Environment Variables** agrega `VITE_SHEET_URL` y
   `VITE_SHEET_TOKEN` (Production y Preview), y opcionalmente `VITE_USE_MOCK=false`.
4. Deploy. Si cambias una variable, vuelve a desplegar para recompilar el bundle.

También puedes desplegar con `npx vercel` desde la carpeta del proyecto.

## Checklist para el día del evento

- [ ] `npm run build` pasa sin errores.
- [ ] Variables `VITE_SHEET_URL` y `VITE_SHEET_TOKEN` configuradas en el entorno.
- [ ] La app carga la hoja real (sin etiqueta «Datos de prueba») y muestra el
      resumen esperado de personas y tickets.
- [ ] Nómina revisada: personas, tickets y alertas.
- [ ] Escenario de premios elegido y cantidad de ganadores por premio confirmada.
- [ ] Política de repetición acordada con el equipo.
- [ ] Ensayo completo con datos de prueba (6 premios, sin repeticiones).
- [ ] OBS/transmisión configurado: 1080 × 1920 (vertical) y 1920 × 1080 (horizontal).
- [ ] Recarga de la página probada: el sorteo se retoma desde `localStorage`.
- [ ] Exportar CSV y JSON al terminar; guardar el JSON como respaldo de auditoría.
- [ ] No borrar datos del navegador ni usar modo incógnito durante el sorteo.

## Estructura

```
src/
  lib/            motor de datos, sorteo, RNG, hash, sesión y exportaciones
  screens/        Setup, Roster, Draw y Winners
  visuals/        Reel y confeti
  components/     piezas de interfaz reutilizables
  index.css       sistema de diseño (paleta y componentes)
```

## Privacidad

- Los datos viven en tu hoja y en el navegador que hace el sorteo.
- La app no envía información a terceros ni usa analítica.
- El token del endpoint viaja en el bundle porque Vite inyecta las variables
  `VITE_*`; no reutilices secretos de otros sistemas.
- El JSON de auditoría incluye nombres y tickets: trátalo como dato interno.

---

LEAD UPC · Learn. Explore. Aspire. Discover.
