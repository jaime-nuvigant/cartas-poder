/**
 * Receptor de cartas poder — Baja California 67, Roma Sur, CDMX.
 *
 * Guarda en una carpeta de Google Drive los PDF que envía index.html.
 * Ver README.md para los pasos de instalación y despliegue.
 */

// ---------------------------------------------------------------------
// CONFIGURACIÓN — cambia estos dos valores
// ---------------------------------------------------------------------

// ID de la carpeta de Drive donde se guardarán las cartas.
// Puedes DEJARLO VACÍO: en ese caso el script busca (o crea la primera vez)
// una carpeta llamada FOLDER_NAME en la raíz de tu Drive y recuerda su ID.
// Si prefieres una carpeta concreta, toma el ID de su URL:
// https://drive.google.com/drive/folders/ESTO_ES_EL_ID
var FOLDER_ID = '1cUd4jjyHO5VCCahXhPw_RLqRqrCXidei';

// Nombre de la carpeta que se crea sola cuando FOLDER_ID está vacío.
var FOLDER_NAME = 'Cartas Poder BC67';

// Palabra secreta compartida con config.js. Debe ser idéntica en ambos.
// No es seguridad real (viaja en el cliente), solo evita que un bot
// que tropiece con la URL pueda llenarte la carpeta de basura.
var TOKEN = 'bc67-cyIw1j0-VPF5';

// Tamaño máximo aceptado por carta, en bytes.
var MAX_BYTES = 12 * 1024 * 1024; // 12 MB

// Cuántas cartas poder puede recibir un mismo apoderado por asamblea.
var MAX_CARTAS_POR_APODERADO = 2;

// ---------------------------------------------------------------------

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responder({ ok: false, error: 'Petición vacía' });
    }

    var body = JSON.parse(e.postData.contents);

    if (body.token !== TOKEN) {
      return responder({ ok: false, error: 'Token inválido' });
    }
    if (!body.pdfBase64 || !body.filename) {
      return responder({ ok: false, error: 'Faltan pdfBase64 o filename' });
    }

    var bytes = Utilities.base64Decode(body.pdfBase64);
    if (bytes.length > MAX_BYTES) {
      return responder({ ok: false, error: 'El archivo excede el tamaño permitido' });
    }

    var nombre = limpiarNombre(body.filename);
    var blob = Utilities.newBlob(bytes, 'application/pdf', nombre);

    // Todo el bloque va bajo candado: contar, verificar el límite y crear el
    // archivo con su descripción tienen que ser una sola operación, o dos
    // envíos simultáneos podrían dejar tres cartas al mismo apoderado.
    var candado = LockService.getScriptLock();
    candado.waitLock(30000);
    var archivo, destino;
    try {
      destino = obtenerSubcarpeta(obtenerCarpeta(), body.fechaAsamblea);

      var apoderado = String(body.apoderado || '').trim();
      var yaTiene = contarCartas(destino)[normalizar(apoderado)] || 0;
      if (apoderado && yaTiene >= MAX_CARTAS_POR_APODERADO) {
        return responder({
          ok: false,
          limiteAlcanzado: true,
          error: apoderado + ' ya tiene ' + yaTiene + ' cartas poder para esta asamblea' +
                 ' (máximo ' + MAX_CARTAS_POR_APODERADO + '). Elige a otra persona.'
        });
      }

      archivo = destino.createFile(blob);

      // Descripción para poder buscar por otorgante/apoderado desde Drive.
      // También es lo que se lee para contar cartas por apoderado.
      archivo.setDescription(
        'Otorgante: ' + (body.otorgante || '-') +
        ' | Unidad: ' + (body.unidad || '-') +
        ' | Apoderado: ' + (apoderado || '-') +
        ' | Asamblea ' + (body.tipoAsamblea || '-') + ' del ' + (body.fechaAsamblea || '-')
      );
    } finally {
      candado.releaseLock();
    }

    return responder({
      ok: true,
      id: archivo.getId(),
      url: archivo.getUrl(),
      carpeta: destino.getName()
    });

  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

/**
 * Sin parámetros: permite verificar en el navegador que el despliegue está vivo.
 * Con ?accion=conteo&fecha=AAAA-MM-DD: devuelve cuántas cartas lleva cada
 * apoderado en esa asamblea, para que el formulario oculte a los que ya
 * llegaron al máximo.
 */
function doGet(e) {
  try {
    var p = (e && e.parameter) || {};

    if (p.accion === 'conteo') {
      // Sin una fecha con formato válido no hay carpeta de asamblea que contar;
      // se responde vacío en vez de contar la carpeta principal completa.
      var sub = /^\d{4}-\d{2}-\d{2}$/.test(String(p.fecha || ''))
        ? obtenerSubcarpeta(obtenerCarpeta(), p.fecha, false)
        : null;
      return responder({
        ok: true,
        fecha: p.fecha || '',
        limite: MAX_CARTAS_POR_APODERADO,
        conteo: contarCartas(sub)
      });
    }

    var carpeta = obtenerCarpeta();
    return responder({
      ok: true,
      servicio: 'Cartas poder BC67',
      listo: true,
      carpeta: carpeta.getName(),
      carpetaUrl: carpeta.getUrl()
    });
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

/**
 * Devuelve la carpeta destino. Si FOLDER_ID está vacío, reutiliza la que ya
 * se haya creado antes (guardada en las propiedades del script) o crea una
 * nueva llamada FOLDER_NAME. Así el sistema queda operativo sin configurar
 * nada a mano.
 */
function obtenerCarpeta() {
  if (FOLDER_ID) return DriveApp.getFolderById(FOLDER_ID);

  var props = PropertiesService.getScriptProperties();
  var guardado = props.getProperty('FOLDER_ID');
  if (guardado) {
    try {
      return DriveApp.getFolderById(guardado);
    } catch (err) {
      // La carpeta fue borrada o movida a la papelera: se recrea abajo.
      props.deleteProperty('FOLDER_ID');
    }
  }

  var existentes = DriveApp.getFoldersByName(FOLDER_NAME);
  var carpeta = existentes.hasNext() ? existentes.next() : DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', carpeta.getId());
  return carpeta;
}

/**
 * Devuelve la subcarpeta de la asamblea (una por fecha, en formato AAAA-MM-DD)
 * dentro de la carpeta principal, creándola la primera vez. Si la fecha no
 * viene o no tiene ese formato, guarda directo en la carpeta principal en vez
 * de inventar una subcarpeta con un nombre raro.
 *
 * Con crear=false devuelve null si la subcarpeta todavía no existe (nadie ha
 * mandado carta para esa asamblea); sirve para consultar sin ensuciar Drive.
 *
 * Quien llama para escribir debe tener tomado el candado del script: Drive
 * permite dos carpetas con el mismo nombre y las cartas quedarían repartidas.
 */
function obtenerSubcarpeta(padre, fechaAsamblea, crear) {
  var nombre = String(fechaAsamblea || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nombre)) return padre;

  var existentes = padre.getFoldersByName(nombre);
  if (existentes.hasNext()) return existentes.next();
  return crear === false ? null : padre.createFolder(nombre);
}

/**
 * Cuenta cuántas cartas tiene cada apoderado en una carpeta de asamblea,
 * leyendo la descripción que se escribe al guardar cada PDF.
 * Devuelve un objeto { nombreNormalizado: cantidad }.
 */
function contarCartas(carpeta) {
  var conteo = {};
  if (!carpeta) return conteo;

  var archivos = carpeta.getFiles();
  while (archivos.hasNext()) {
    var desc = archivos.next().getDescription() || '';
    var m = desc.match(/Apoderado:\s*([^|]*)/);
    if (!m) continue;
    var clave = normalizar(m[1]);
    if (!clave || clave === '-') continue;
    conteo[clave] = (conteo[clave] || 0) + 1;
  }
  return conteo;
}

/** Nombre comparable: sin acentos, sin dobles espacios y en minúsculas. */
function normalizar(nombre) {
  return String(nombre || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function limpiarNombre(nombre) {
  var limpio = String(nombre).replace(/[\/\\?%*:|"<>]/g, '-').slice(0, 180);
  if (limpio.slice(-4).toLowerCase() !== '.pdf') limpio += '.pdf';
  return limpio;
}

function responder(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
