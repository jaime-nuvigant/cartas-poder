# Sistema de Cartas Poder — Baja California 67, Roma Sur

Generador de cartas poder para asambleas de condóminos del inmueble ubicado en
**Baja California 67, Col. Roma Sur, Alcaldía Cuauhtémoc, Ciudad de México**.

Sin login, sin base de datos, sin servidor propio. El condómino llena tres datos,
firma con el dedo o el mouse, y con un solo botón —**Guardar**— el PDF queda en
una carpeta de Google Drive del condominio.

---

## Estado actual (ya desplegado y verificado)

| | |
|---|---|
| Script | `1878kZaKfJQGtA5Cu_NTM70GQSdY4yikC4G_EdgVd_y3QP4KpoS98fpIK` |
| Despliegue | `AKfycbyL4zYHGLjeH1j1ObskbaDfjTZCqLpYlOW24HrgOlJOj3_T8Ax345nQXKI7daJKBzpqxw` |
| Carpeta de Drive | `CartasPoder` — <https://drive.google.com/drive/folders/1cUd4jjyHO5VCCahXhPw_RLqRqrCXidei> |
| Cuenta dueña | `jaime.calmat@gmail.com` |

`config.js` ya apunta a ese despliegue. Para actualizar el código conservando la
misma URL:

```bash
npm run as:push
npx clasp create-version "qué cambió"          # imprime "Created version N"
npm run as:redeploy -- -V N -d "qué cambió"    # apunta la URL viva a esa versión
```

El despliegue está fijado a una versión concreta, no a `HEAD`: si sólo haces
`as:push`, la URL sigue sirviendo el código anterior.

---

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | La aplicación completa: formulario, documento en vivo, firma y guardado |
| `config.js` | URL y token del Apps Script, más la fecha de la asamblea y la lista de apoderados |
| `apps-script/Codigo.gs` | Código que se pega en Google Apps Script; recibe los PDF y los deja en Drive |
| `vendor/` | jsPDF y html2canvas incluidos en el repo (no se descargan de ningún CDN) |

---

## Modo local

Abre `index.html` con doble clic: el formulario y la vista previa del documento
funcionan sin configurar nada. El botón **Guardar** aparece desactivado hasta que
`config.js` tenga la URL y el token del Apps Script (paso siguiente), porque es
lo único que hace el botón: subir el PDF a Drive.

---

## Activar el guardado en Google Drive

Tiempo aproximado: 10 minutos. Se hace una sola vez.

### 1. La carpeta en Drive

Ya está fija en `FOLDER_ID`: la carpeta `CartasPoder`
(`1cUd4jjyHO5VCCahXhPw_RLqRqrCXidei`).

Si dejas `FOLDER_ID` vacío, el script busca o crea solo una carpeta llamada
`Cartas Poder BC67` en la raíz del Drive y recuerda su ID en las propiedades del
proyecto. Para usar otra carpeta concreta, copia el ID de su URL:

```
https://drive.google.com/drive/folders/1A2b3C4d5E6f7G8h9I0jK
                                        └──────── esto es el ID ────────┘
```

Dentro de esa carpeta, cada carta cae en una **subcarpeta por asamblea**,
nombrada con la fecha en formato `AAAA-MM-DD`, que el script crea la primera vez
que se guarda una carta de esa fecha:

```
CartasPoder/
├── 2026-08-20/
│   ├── Carta-Poder_2026-08-20_Maria-Lopez_a_Jaime-Calderon-Matar.pdf
│   └── Carta-Poder_2026-08-20_Ana-Ruiz_a_Jaime-Calderon-Matar.pdf
└── 2026-11-15/
```

La fecha es la que envía la página desde `FECHA_ASAMBLEA`. Si llegara vacía o
con otro formato, la carta se guarda en la carpeta principal en lugar de crear
una subcarpeta con un nombre inservible.

### 2. Crear el Apps Script

1. Entra a <https://script.google.com> → **Nuevo proyecto**.
2. Borra el contenido del editor y pega **todo** `apps-script/Codigo.gs`.
3. Guarda (💾).

El `TOKEN` ya viene generado y sincronizado entre `Codigo.gs` y `config.js`.
Si lo cambias, cámbialo en **los dos** archivos.

### 3. Desplegar

1. **Implementar → Nueva implementación** → tipo **Aplicación web**.
2. Configura exactamente así:
   - *Ejecutar como:* **Yo** (tu cuenta)
   - *Quién tiene acceso:* **Cualquier usuario**
3. **Implementar**. Google pedirá autorizar el acceso a tu Drive: acepta.
   En la pantalla de "Google no ha verificado esta aplicación" entra a
   *Configuración avanzada → Ir a (nombre del proyecto)*. Es tu propio script,
   es normal que aparezca esa advertencia.
4. Copia la **URL de la aplicación web**. Termina en `/exec`.

Para comprobar que quedó bien, abre esa URL en el navegador. Debe responder algo
como:

```json
{"ok":true,"servicio":"Cartas poder BC67","listo":true,
 "carpeta":"Cartas Poder BC67","carpetaUrl":"https://drive.google.com/..."}
```

Ese `carpetaUrl` es la carpeta donde van a caer las cartas — ábrela y guárdala
en marcadores.

### 4. Conectar la página

Abre `config.js` y pega los dos valores:

```js
window.CARTA_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfy..../exec",
  TOKEN: "bc67-asamblea-2026"   // idéntico al TOKEN del Codigo.gs
};
```

Recarga la página: el botón **Guardar** queda activo.

---

## Datos de cada asamblea (`config.js`)

Dos cosas más viven en `config.js` porque cambian de asamblea en asamblea y no
deben quedar a criterio de quien llena la carta:

```js
  FECHA_ASAMBLEA: "2026-08-20",   // AAAA-MM-DD
  HORA_ASAMBLEA: "",              // "19:00" o "" si la convocatoria no la señala
  APODERADOS: [
    "Jaime Calderón Mátar"
  ]
```

- **`FECHA_ASAMBLEA` / `HORA_ASAMBLEA`**: no aparecen en el formulario, sólo en
  el documento — se escriben tanto en la fecha de la asamblea como en la fecha
  de firma de la carta, que es el mismo día. Actualízalas cuando se convoque una
  nueva asamblea.
- **`APODERADOS`**: la lista de la que se elige quién recibe el poder. En la
  página aparece como menú desplegable, no como texto libre, para que nadie
  escriba un nombre distinto ni con errores. Con un solo nombre queda
  preseleccionado; con dos o más se agrega la opción «— Selecciona —».

## Límite de dos cartas por apoderado

Un mismo apoderado no puede representar a más de **dos** condóminos en la misma
asamblea. El control funciona así:

- Al abrir la página, el formulario le pregunta al Apps Script
  (`?accion=conteo&fecha=AAAA-MM-DD`) cuántas cartas lleva cada apoderado en la
  carpeta de esa asamblea, y **oculta de la lista** a quienes ya llegaron a dos.
  Si todos están llenos, el botón «Guardar» queda desactivado.
- Al guardar, el Apps Script vuelve a contar y **rechaza** la carta si el
  apoderado ya tiene dos. Esta es la validación que cuenta: la lista del
  formulario es sólo una comodidad y podría estar desactualizada si dos personas
  llenan la carta al mismo tiempo.
- El conteo sale de la descripción que se le pone a cada PDF al guardarlo
  (`… | Apoderado: Nombre | …`), así que si borras una carta de Drive el
  apoderado recupera el lugar automáticamente. Cambiar esa descripción a mano
  descuadra el conteo.
- El tope se cambia en dos lugares, y deben coincidir:
  `MAX_CARTAS_POR_APODERADO` en `apps-script/Codigo.gs` y `MAX_CARTAS` en
  `index.html`.

Como el conteo es por carpeta de asamblea, el límite se reinicia solo cada vez
que cambias `FECHA_ASAMBLEA`.

Una carta ya guardada tampoco se puede volver a guardar: el botón queda
desactivado y en su lugar aparece **«Llenar otra carta»**, que limpia otorgante,
unidad, identificación y firma para empezar una nueva. Así un segundo clic no
deja dos PDF idénticos en Drive gastándole al apoderado sus dos cartas.

---

## Alternativa: subir el código con `clasp` en vez de copiar y pegar

`clasp` es el CLI oficial de Google para Apps Script. Permite mantener el
`Codigo.gs` versionado en git y publicarlo con un comando, sin volver a entrar
al editor web.

**Ojo con la expectativa:** git no habla directo con Apps Script. El repo es tu
fuente de verdad y `clasp push` es el paso que empuja lo que está en git hacia
Google. No existe un `git push` a script.google.com.

### Preparación (una sola vez)

```bash
npm install                                   # instala clasp local
npx clasp login                               # abre el navegador para autorizar
```

Antes del `login`, activa la API de Apps Script en tu cuenta:
<https://script.google.com/home/usersettings> → *API de Apps Script: Activado*.
Sin esto, `clasp push` falla con un error de permisos.

**El proyecto ya está vinculado.** El archivo `.clasp.json` apunta al script
existente, así que no hace falta crear nada:

```json
{ "scriptId": "1878kZaKfJQGtA5Cu_NTM70GQSdY4yikC4G_EdgVd_y3QP4KpoS98fpIK",
  "rootDir": "apps-script" }
```

Si algún día necesitas crear un proyecto nuevo desde cero, borra `.clasp.json`
y corre `npm run as:create`.

> El tipo es `standalone`. La ayuda de `clasp --help` menciona un tipo "web app",
> pero no existe: cualquier `--type` distinto de `standalone`, `docs`, `sheets`,
> `slides` o `forms` falla con *"Invalid container file type"*. Lo que convierte
> al script en aplicación web es el bloque `webapp` del `appsscript.json`, no el
> tipo con el que se crea.

### Ciclo de trabajo

```bash
npm run as:push          # sube apps-script/ al proyecto remoto
npm run as:deploy        # publica una versión nueva como aplicación web
npm run as:list          # muestra los deployment IDs
```

La URL del web app es `https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec`,
que es lo que va en `config.js`.

**Detalle importante:** `as:deploy` crea un despliegue **nuevo**, con URL nueva,
y tendrías que actualizar `config.js` cada vez. Para conservar la misma URL,
actualiza el despliegue existente:

```bash
npm run as:redeploy -- <DEPLOYMENT_ID>
```

Ese es el comando del día a día una vez que el enlace ya está repartido entre
los condóminos.

### Qué queda configurado en código

`apps-script/appsscript.json` fija los ajustes del web app, así que ya no hay
que elegirlos en los menús al desplegar:

```json
"webapp": { "executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS" }
```

`ANYONE_ANONYMOUS` es justamente el "cualquier usuario, sin iniciar sesión" que
necesita el sistema.

### Cuidado con las credenciales

`clasp login` guarda un token OAuth con acceso a tu Drive en `~/.clasprc.json`.
El `.gitignore` ya bloquea cualquier `.clasprc.json` dentro del proyecto, pero
**nunca lo pegues en el repo ni lo compartas**. `.clasp.json` (que solo contiene
el ID del script) también está ignorado; si el condominio va a compartir un
único script, puedes quitar esa línea del `.gitignore` y versionarlo.

Nota aparte: `config.js` sí se versiona con su token dentro. No es una fuga
nueva —ese token viaja al navegador de todos modos, como explica la sección
anterior— pero tenlo presente si el repo llega a ser público.

---

## Publicar la página para los condóminos

Abrirla desde `file://` funciona, pero para repartir el enlace conviene
publicarla. Cualquier hosting estático sirve, arrastrando la carpeta completa
(`index.html`, `config.js`, `vendor/`): Netlify Drop, Cloudflare Pages, GitHub
Pages o Vercel.

---

## Qué tan seguro es esto

Conviene tenerlo claro antes de repartir el enlace:

- **El `TOKEN` es público.** Viaja dentro de `config.js`, que cualquiera puede
  leer con "Ver código fuente". No es una contraseña: solo evita que un bot que
  tropiece con la URL del script te llene la carpeta de basura.
- **El script solo puede crear archivos.** No lista, no lee y no borra lo que ya
  está en la carpeta. En el peor caso alguien sube PDFs no deseados; no puede ver
  ni destruir las cartas legítimas.
- **Hay un límite de 12 MB por carta** (`MAX_BYTES` en el `Codigo.gs`). Una carta
  normal pesa unos 400 KB.
- Si en algún momento se abusa del enlace, cambia el `TOKEN` en los dos archivos,
  o crea una implementación nueva del Apps Script y actualiza `config.js`.

Si eso no es aceptable para el condominio, la alternativa es mover el guardado a
un backend real (una API route con el token del lado del servidor), pero eso
implica desplegar un proyecto en vez de repartir un archivo estático.

---

## Notas sobre el documento

- El poder está redactado como **especial y limitado**: vale únicamente para la
  asamblea indicada, sus prórrogas y continuaciones, y para la segunda o ulterior
  convocatoria si la primera no se celebra por falta de quórum.
- La asamblea es siempre **Ordinaria**, el documento va dirigido «A quien
  corresponda» y la carta se firma el mismo día de la asamblea. Nada de eso es
  editable en el formulario: se toma de `config.js` o está fijo en el texto.
- El formulario pide sólo lo que cambia en cada carta: quién otorga el poder, su
  unidad, su identificación opcional, a quién se lo otorga y la firma.
- El diseño está ajustado para caber en **una sola hoja tamaño carta**.
- La firma trazada en pantalla se incrusta en el documento. Aun así, conviene
  imprimir y firmar de puño y letra si el reglamento interno del condominio lo
  exige: algunos reglamentos piden firma autógrafa en original, testigos
  obligatorios o limitan cuántas cartas poder puede acumular una misma persona.
  **Revisa el reglamento antes de repartir el enlace.**
# cartas-poder
