/* =====================================================================
   Configuración del guardado en Google Drive.
   Llena estos dos valores siguiendo los pasos del README.md.
   Si APPS_SCRIPT_URL queda vacío, el botón "Guardar" se desactiva:
   la página sigue mostrando la vista previa del documento, pero no
   hay a dónde subir el PDF.
   ===================================================================== */
window.CARTA_CONFIG = {

  // URL del despliegue del Apps Script.
  // Termina en /exec  —  ej. "https://script.google.com/macros/s/AKfy.../exec"
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyL4zYHGLjeH1j1ObskbaDfjTZCqLpYlOW24HrgOlJOj3_T8Ax345nQXKI7daJKBzpqxw/exec",

  // Debe ser IDÉNTICO al TOKEN definido dentro de apps-script/Codigo.gs
  TOKEN: "bc67-cyIw1j0-VPF5",

  // Fecha de la próxima asamblea, en formato AAAA-MM-DD.
  // Cámbiala cada vez que se convoque una nueva asamblea.
  FECHA_ASAMBLEA: "2026-08-20",

  // Hora de la asamblea en formato HH:MM (24 h). Déjala vacía ("")
  // si la convocatoria no señala hora.
  HORA_ASAMBLEA: "",

  // Personas que pueden recibir el poder (apoderados).
  // Agrega o quita nombres de esta lista según convenga.
  APODERADOS: [
    "Jaime Calderón Mátar"
    ,"Egon Peter Warner Salazar"
    ,"Patricia Margarita Hernández Martínez"
    ,"Claudia Sofía Curiel Rentería"
    ,"Luis Reyes Galván"
    ,"Isidoro Sarfati Dultzin"
    ,"Héctor Ricardez Mendez"
  ]

};
