/**
 * ══════════════════════════════════════════════
 *  CONFIGURACIÓN DEL RESTAURANTE
 *  Edita este archivo para cambiar los datos
 *  del restaurante sin tocar el resto del código.
 * ══════════════════════════════════════════════
 */

const RESTAURANT = {

  /* ── Identidad ── */
  name:      'Cocina y Parrilla San José',   // Nombre completo
  shortName: 'San José',                      // Nombre corto (PWA, footer)
  tagline:   'Cocina Tradicional & Parrilla', // Slogan debajo del logo

  /* ── Logo ──
     Pon el archivo en la raíz del proyecto (mismo lugar que index.html).
     Si logo es null muestra el nombre en texto como fallback.            */
  logo: 'logo.jpeg',   // null  →  muestra nombre en texto

  /* ── Contacto ── */
  phone:        '50683108026',                 // Con código de país, sin + ni espacios
  phoneDisplay: '+(506) 8310-8026',            // Formato visible en el footer
  address:      'San José de Trojas',

  /* ── Horario ── */
  hours: 'Jueves a Domingo: 7:00 AM – 9:00 PM',

  /* ── IVA ──
     true  = aplica IVA 10% en pedidos de mesa
     false = sin IVA                                                       */
  ivaEnabled: true,
  ivaPct:     10,

  /* ── Envío a domicilio ──
     Se muestra como nota informativa, no se suma al total
     porque varía según la zona del cliente.                */
  deliveryFeeMin: 500,
  deliveryFeeMax: 1000,

};
