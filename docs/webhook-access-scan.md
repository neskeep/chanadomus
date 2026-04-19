# Webhook de Acceso — ChanaDomus

## Endpoint

```
POST https://chanadomus.com/api/webhook/access-scan
```

## Autenticacion

Cada dispositivo tiene un API Key unico. Debe enviarse en el header `X-Device-Key`:

```
X-Device-Key: <api-key-del-dispositivo>
```

El servidor valida el key contra un hash SHA-256 almacenado en la tabla `devices`. Si el key es invalido o el dispositivo esta inactivo, retorna `401`.

## Payload

```json
{
  "type": "qr",
  "value": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-19T14:30:00.000Z"
}
```

| Campo | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `type` | `"qr"` \| `"pin"` \| `"rfid"` | Si | Tipo de escaneo |
| `value` | `string` | Si | Token QR (UUID), PIN numerico, o RFID tag |
| `timestamp` | `string` (ISO 8601) | No | Hora del escaneo. Si no se envia, usa hora del servidor |

## Tipos de Escaneo

### QR (`type: "qr"`)

El valor debe ser el token UUID del codigo QR generado por un propietario.

**Flujo:**
1. Busca el token en la base de datos
2. Verifica si ya fue usado (`already_used`)
3. Verifica si expiro (`expired`)
4. Si es valido: marca como usado y registra acceso autorizado

**Respuestas:**

Acceso autorizado:
```json
{
  "data": {
    "id": "log-uuid",
    "entryType": "webhook",
    "result": "allowed",
    "visitorName": "Juan Perez",
    "visitorDocument": "V-12345678",
    "unitNumber": "R-042",
    "unitLabel": null,
    "notes": null,
    "createdAt": "2026-04-19T14:30:00.000Z"
  }
}
```

Token expirado:
```json
{
  "data": {
    "id": "log-uuid",
    "entryType": "webhook",
    "result": "expired",
    "visitorName": "Juan Perez",
    "visitorDocument": null,
    "unitNumber": "R-042",
    "unitLabel": null,
    "notes": null,
    "createdAt": "2026-04-19T14:30:00.000Z"
  }
}
```

Token ya usado:
```json
{
  "data": {
    "id": "log-uuid",
    "entryType": "webhook",
    "result": "already_used",
    ...
  }
}
```

Token no encontrado:
```json
{
  "data": {
    "id": "log-uuid",
    "entryType": "webhook",
    "result": "denied",
    "visitorName": null,
    ...
  }
}
```

### RFID (`type: "rfid"`)

Registra el acceso sin validacion de token. Reservado para expansion futura con tarjetas RFID.

```json
{
  "data": {
    "id": "log-uuid",
    "entryType": "webhook",
    "result": "allowed",
    "visitorName": null,
    "notes": "RFID scan",
    ...
  }
}
```

### PIN (`type: "pin"`)

No implementado aun. Retorna:

```json
{
  "data": {
    "status": "unsupported",
    "message": "PIN no implementado aun"
  }
}
```

## Codigos de Error

| HTTP Status | Causa |
|-------------|-------|
| 401 | `X-Device-Key` ausente, invalido, o dispositivo inactivo |
| 400 | `type` o `value` faltante o invalido |

## Configuracion en Hardware

### ZKTeco SpeedFace V5L QR

1. Ir a **Comunicacion > Webhook/HTTP Push**
2. URL: `https://chanadomus.com/api/webhook/access-scan`
3. Metodo: `POST`
4. Header personalizado: `X-Device-Key: <key-proporcionado>`
5. Formato de payload: JSON
6. Mapear campo de token QR a `value`, tipo fijo a `"qr"`

### Hikvision DS-K1T341BMI

1. Ir a **Configuration > Network > Integration Protocol > HTTP Listening**
2. URL: `https://chanadomus.com/api/webhook/access-scan`
3. Habilitar HTTPS
4. En la configuracion de eventos, agregar header `X-Device-Key`
5. Configurar el payload JSON para enviar `type` y `value`

> **Nota:** La configuracion exacta puede variar segun firmware. Contactar al proveedor para middleware de traduccion de payload si el formato nativo del dispositivo difiere del esperado.

## Registro de Dispositivos

Para registrar un nuevo dispositivo en el sistema:

1. Generar un API Key aleatorio (minimo 32 caracteres)
2. Calcular el hash SHA-256 del key
3. Insertar en la tabla `devices`:
   - `name`: nombre descriptivo (ej: "Alcabala Principal")
   - `device_key_hash`: el hash SHA-256
   - `tenant_id`: UUID del tenant (Ranchos de Chana)
   - `location`: ubicacion fisica (ej: "Entrada principal")
   - `status`: `active`

Ejemplo con Node.js:
```javascript
import { createHash } from 'node:crypto'

const apiKey = 'mi-api-key-secreto-de-32-chars-minimo'
const hash = createHash('sha256').update(apiKey).digest('hex')
// Usar este hash para device_key_hash en la DB
```
