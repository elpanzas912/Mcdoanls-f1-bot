# 🏎️ Tracker de McDonald's F1

Tracker automatizado para detectar cuando el auto de F1 de McDonald's está disponible en Rappi.

## 🚀 Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `env.example` a `.env` y configura tus credenciales:

```bash
cp env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# Configuración de Rappi
RAPPI_AUTH_TOKEN=Bearer tu_token_aqui

# Configuración de Telegram
TELEGRAM_BOT_TOKEN=tu_bot_token_aqui
TELEGRAM_CHAT_ID=tu_chat_id_aqui

# Configuración del Tracker
CHECK_INTERVAL_MINUTES=15
```

### 3. Obtener credenciales

#### Token de Rappi
1. Ve a [Rappi Argentina](https://www.rappi.com.ar)
2. Abre las herramientas de desarrollador (F12)
3. Ve a la pestaña Network
4. Busca una petición a la API de Rappi
5. Copia el token de autorización del header

#### Bot de Telegram
1. Crea un bot con [@BotFather](https://t.me/botfather)
2. Obtén el token del bot
3. Agrega el bot a tu canal/grupo
4. Obtén el ID del chat (puedes usar [@userinfobot](https://t.me/userinfobot))

## 🏃‍♂️ Uso

```bash
npm start
```

El script revisará la disponibilidad cada 15 minutos (configurable) y enviará una notificación a Telegram cuando encuentre el auto disponible.

## 🔒 Seguridad

- Las credenciales sensibles están en el archivo `.env` que NO se sube al repositorio
- El archivo `.env` está incluido en `.gitignore`
- Nunca compartas tu archivo `.env` o tus tokens

## 📝 Notas

- El token de Rappi expira periódicamente. Si recibes errores 401, necesitarás obtener un nuevo token
- El script se detiene automáticamente cuando encuentra el auto disponible
- Los errores se notifican a Telegram para que puedas actuar rápidamente 