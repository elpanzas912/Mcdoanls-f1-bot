// f1_tracker.js

// Cargar variables de entorno
require('dotenv').config();

// --- CONFIGURACIÓN ---
// Las credenciales ahora se cargan desde variables de entorno (.env)

// 1. Configuración de Rappi
const RAPPI_URL = 'https://services.rappi.com.ar/api/web-gateway/web/restaurants-bus/products/toppings/114636/2113564293/';

// Verificar que las variables de entorno estén configuradas
if (!process.env.RAPPI_AUTH_TOKEN) {
    console.error('❌ ERROR: RAPPI_AUTH_TOKEN no está configurado en el archivo .env');
    process.exit(1);
}

const RAPPI_HEADERS = {
    'accept': 'application/json',
    'authorization': process.env.RAPPI_AUTH_TOKEN,
    'origin': 'https://www.rappi.com.ar',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    // Otros headers pueden ser necesarios si Rappi es estricto, pero estos son los clave.
};

// 2. Configuración de Telegram
if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ ERROR: TELEGRAM_BOT_TOKEN no está configurado en el archivo .env');
    process.exit(1);
}

if (!process.env.TELEGRAM_CHAT_ID) {
    console.error('❌ ERROR: TELEGRAM_CHAT_ID no está configurado en el archivo .env');
    process.exit(1);
}

// 3. Configuración del Tracker
const CHECK_INTERVAL_MINUTES = parseInt(process.env.CHECK_INTERVAL_MINUTES) || 15;
const CHECK_INTERVAL_MS = CHECK_INTERVAL_MINUTES * 60 * 1000;

// Variable para evitar notificar repetidamente si ya se encontró disponible.
let alreadyFound = false;

// --- FIN DE LA CONFIGURACIÓN ---


/**
 * Función para enviar un mensaje a Telegram.
 * Usa MarkdownV2 para un formato más bonito.
 * @param {string} text - El mensaje a enviar.
 */
async function sendTelegramMessage(text) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const body = {
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'MarkdownV2', // Permite usar negritas, cursivas, etc.
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await response.json();
        if (!data.ok) {
            console.error('Error al enviar mensaje a Telegram:', data.description);
        } else {
            console.log('Mensaje enviado a Telegram exitosamente.');
        }
    } catch (error) {
        console.error('Fallo en la comunicación con la API de Telegram:', error.message);
    }
}

/**
 * Función para escapar caracteres especiales de MarkdownV2.
 * @param {string} text - El texto a escapar.
 * @returns {string} - Texto seguro para MarkdownV2.
 */
function escapeMarkdown(text) {
    // Lista de caracteres a escapar en MarkdownV2
    const charsToEscape = '_*[]()~`>#+-=|{}.!';
    return text.replace(new RegExp(`[${charsToEscape.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}]`, 'g'), '\\$&');
}

/**
 * Función principal que revisa la disponibilidad del producto.
 */
async function checkAvailability() {
    if (alreadyFound) {
        console.log(`[${new Date().toLocaleString()}] El auto ya fue encontrado. Deteniendo revisiones.`);
        return; // Si ya lo encontramos, no hacemos nada más.
    }
    
    console.log(`[${new Date().toLocaleString()}] Iniciando revisión de disponibilidad...`);

    try {
        const response = await fetch(RAPPI_URL, {
            method: 'GET',
            headers: RAPPI_HEADERS,
        });

        // Si la respuesta no es OK (ej: 401 Unauthorized, 403 Forbidden, 500 Server Error)
        if (!response.ok) {
            throw new Error(`La API de Rappi devolvió un error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const autoCategory = data.categories.find(cat => cat.description === 'Auto f1');

        if (!autoCategory) {
            throw new Error('No se encontró la categoría "Auto f1" en la respuesta de la API. Rappi pudo haber cambiado la estructura.');
        }

        // Buscamos si hay alguna opción que NO sea "Sin auto" y que esté disponible.
        const autoDisponible = autoCategory.toppings.find(
            topping => topping.description.toLowerCase() !== 'sin auto' && topping.is_available
        );

        if (autoDisponible) {
            console.log('¡¡¡AUTO F1 DISPONIBLE!!! Notificando a Telegram...');
            const message = `🏎️💨 *¡HAY STOCK DEL AUTO DE F1 EN MCDONALD'S\\!* 💨🏎️\n\n` +
                          `La opción "*${escapeMarkdown(autoDisponible.description)}*" está disponible\\.\n\n` +
                          `Corre a Rappi para comprarlo\\! 🏁`;
            await sendTelegramMessage(message);
            alreadyFound = true; // Marcamos que ya lo encontramos.
            clearInterval(trackerInterval); // Detenemos las revisiones futuras.
        } else {
            console.log(`[${new Date().toLocaleString()}] Aún no hay stock. La única opción es "Sin auto". Próxima revisión en ${CHECK_INTERVAL_MINUTES} minutos.`);
        }

    } catch (error) {
        console.error('Ocurrió un error durante la revisión:', error.message);
        
        // Notificamos el error a Telegram para poder actuar (ej: actualizar el token)
        const errorMessage = `🚨 *ERROR EN EL TRACKER DE F1* 🚨\n\n` +
                             `No se pudo completar la revisión\\. Posiblemente el token de Rappi expiró\\.\n\n` +
                             `*Detalle del error:*\n` +
                             `\`${escapeMarkdown(error.message)}\``;
        await sendTelegramMessage(errorMessage);
    }
}

// --- EJECUCIÓN DEL SCRIPT ---

console.log("🚀 Tracker de McDonald's F1 iniciado.");
console.log(`Revisando cada ${CHECK_INTERVAL_MINUTES} minutos.`);
console.log(`Notificando al canal con ID: ${process.env.TELEGRAM_CHAT_ID}`);

// Hacemos una primera revisión inmediata al iniciar el script.
checkAvailability();

// Configuramos el intervalo para que se ejecute periódicamente.
const trackerInterval = setInterval(checkAvailability, CHECK_INTERVAL_MS);