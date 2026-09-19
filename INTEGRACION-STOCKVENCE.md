# Integración con StockVence

Esta lista de precios se sincroniza sola con la app StockVence, de dos formas:

- **`stock.json`**: un robot de GitHub Actions corre cada 1 hora (y también
  cuando lo dispares a mano), lee el stock desde Firestore y actualiza este
  archivo. La página lo cruza contra `productos.csv` por **código de
  barra** y, si un producto está en 0, muestra "Sin stock" en vez del botón
  de agregar al pedido.
- **Fotos (`img/`)**: la app StockVence sube la foto directo a este
  repositorio al dar de alta un producto — no hay ningún paso intermedio ni
  robot involucrado para esto. Llega nombrada como `{códigoDeBarra}.jpg`,
  que es exactamente el nombre que el botón "Ver" de esta página ya
  buscaba. Sacás la foto en la app y en segundos está acá.

Si un producto todavía no se cargó en StockVence (o no tiene código de
barra), esta página lo sigue mostrando como disponible — nunca se oculta
nada por las dudas.

> **Nota sobre Firebase Storage:** decidimos NO usarlo para las fotos,
> porque desde septiembre de 2024 Google exige el plan de pago Blaze para
> poder usarlo (antes era gratis). Para evitar eso, la app sube la foto
> directo acá, a GitHub, con un token de acceso — así todo esto sigue
> siendo 100% gratis. `stock.json` sí sigue usando Firestore (la base de
> datos), que no tuvo ese cambio y sigue gratis en el plan Spark.

## Configuración (una sola vez)

### 1. Cuenta de servicio de Firebase — para `stock.json`

En la [consola de Firebase](https://console.firebase.google.com) del
proyecto de StockVence: **⚙️ Configuración del proyecto → Cuentas de
servicio → Generar nueva clave privada**. Descarga un archivo `.json` —
**no lo subas nunca al repositorio**, va como secreto de GitHub (paso 3).
Esto solo necesita leer Firestore, no toca Storage para nada.

### 2. Token de GitHub — para las fotos (lo usa la app, no este repo)

Este paso no es para GitHub Actions, es para que la app StockVence pueda
subir fotos acá. Se hace una sola vez, desde la cuenta de GitHub que
administra este repositorio:

1. [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)
2. **Repository access:** "Only select repositories" → elegí este repo
   (`Lista-de-precios-Pranavita`).
3. **Permissions → Repository permissions → Contents:** ponelo en
   "Read and write". Dejá todo lo demás sin tocar.
4. Generá el token y copialo — **solo se muestra una vez**.
5. Pegalo en el archivo `local.properties` del proyecto StockVence (no en
   este repositorio). Ver el README de StockVence, sección de
   configuración del token de GitHub.

Si en algún momento cambian de celular o quieren invalidar el acceso,
simplemente borran ese token desde GitHub (Settings → Developer settings →
Personal access tokens) y generan uno nuevo.

### 3. Secretos en GitHub (este repositorio) — para `stock.json`

En este repositorio: **Settings → Secrets and variables → Actions → New
repository secret**. Creá uno solo:

- `FIREBASE_SERVICE_ACCOUNT`: pegá el **contenido completo** del `.json`
  del paso 1.

### 4. Activar el workflow

Andá a la pestaña **Actions** de este repositorio. Si GitHub pregunta si
querés habilitar los workflows, aceptá. El workflow
`Sincronizar stock y fotos desde StockVence` va a correr solo cada hora;
también podés tocar **Run workflow** ahí mismo para probarlo ya.

## Cómo probarlo

1. Desde StockVence, dá de alta un producto nuevo, sacale una foto y
   cargá algo de stock.
2. La foto debería aparecer en este repositorio, en `img/{código}.jpg`,
   en cuestión de segundos (mirá el historial de commits del repo).
3. En GitHub, andá a Actions → "Sincronizar stock desde StockVence" →
   **Run workflow**, esperá que termine (menos de un minuto).
4. Recargá la lista de precios y tocá "Ver" en ese producto — debería
   aparecer la foto. Si el stock de ese producto llega a 0, la próxima
   sincronización lo va a marcar "Sin stock" automáticamente.
