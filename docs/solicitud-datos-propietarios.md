# Solicitud de Datos — ChanaDomus v1.0.0

**Para:** Junta de Condominio, Ranchos de Chana
**De:** Zunami Corp — Equipo de Desarrollo
**Fecha:** 20 de abril de 2026
**Asunto:** Datos requeridos para la carga inicial de propietarios en la plataforma

---

## Contexto

La plataforma ChanaDomus esta lista para su lanzamiento. Para activar las cuentas de los 86 propietarios necesitamos los datos que se detallan a continuacion.

**Fecha limite de entrega: 25 de abril de 2026** (para garantizar el lanzamiento el 30 de abril).

Se recomienda entregar la informacion en un archivo Excel (.xlsx) o Google Sheets con las hojas/pestanas indicadas abajo.

---

## HOJA 1: Unidades (86 registros)

Listado de todas las unidades/ranchos del condominio.

| Columna | Descripcion | Obligatorio | Ejemplo |
|---------|-------------|:-----------:|---------|
| **Numero de Rancho** | Identificador oficial de la unidad | Si | `R-001` |
| **Etiqueta** | Nombre descriptivo (si aplica) | No | `Rancho La Ceiba` |

> **Nota:** Si los ranchos se identifican solo por numero (R-001 a R-086), confirmar el formato exacto.

---

## HOJA 2: Propietarios (86 registros — 1 por unidad)

Datos de la cuenta de cada propietario en la plataforma.

| Columna | Descripcion | Obligatorio | Ejemplo |
|---------|-------------|:-----------:|---------|
| **Numero de Rancho** | Debe coincidir con Hoja 1 | Si | `R-001` |
| **Nombre Completo** | Nombre y apellido del propietario | Si | `Maria Rodriguez` |
| **Correo Electronico** | Email unico (sera su usuario de acceso) | Si | `maria@email.com` |
| **Telefono** | Numero de contacto principal | No | `+58 414-1234567` |
| **Cedula de Identidad** | Documento de identificacion | No | `V-12345678` |

> **Importante:**
> - Cada correo electronico debe ser unico — no se puede repetir entre propietarios.
> - Si un propietario tiene mas de una unidad, incluirlo con su unidad principal. Las unidades adicionales se configuran despues.
> - La contrasena inicial sera generada por el sistema y enviada a cada propietario por correo.

---

## HOJA 3: Miembros del Hogar (opcional pero recomendado)

Personas adicionales que residen o frecuentan cada rancho (conyuges, hijos, inquilinos).

| Columna | Descripcion | Obligatorio | Ejemplo |
|---------|-------------|:-----------:|---------|
| **Numero de Rancho** | Debe coincidir con Hoja 1 | Si | `R-001` |
| **Nombre Completo** | Nombre del miembro | Si | `Carlos Rodriguez` |
| **Parentesco** | Relacion con el propietario | Si | `Conyuge` |
| **Cedula de Identidad** | Documento de identificacion | No | `V-23456789` |
| **Telefono** | Numero de contacto | No | `+58 424-9876543` |

**Valores validos para Parentesco:**
- `Propietario` — El titular de la unidad
- `Conyuge` — Pareja del propietario
- `Hijo/a` — Hijos
- `Inquilino` — Persona que alquila la unidad
- `Otro` — Cualquier otra relacion

---

## HOJA 4: Vehiculos (opcional pero recomendado)

Vehiculos registrados por unidad. Facilita el control de acceso vehicular.

| Columna | Descripcion | Obligatorio | Ejemplo |
|---------|-------------|:-----------:|---------|
| **Numero de Rancho** | Debe coincidir con Hoja 1 | Si | `R-001` |
| **Placa** | Numero de placa (unico) | Si | `ABC123` |
| **Marca** | Fabricante del vehiculo | Si | `Toyota` |
| **Modelo** | Modelo del vehiculo | Si | `Hilux` |
| **Color** | Color principal | Si | `Blanco` |

> **Nota:** Cada placa debe ser unica. Si dos personas comparten vehiculo, registrarlo una sola vez bajo la unidad principal.

---

## HOJA 5: Personal Operativo (opcional)

Personal de vigilancia, conserjeria y mantenimiento que tendra acceso al sistema.

| Columna | Descripcion | Obligatorio | Ejemplo |
|---------|-------------|:-----------:|---------|
| **Nombre Completo** | Nombre del empleado | Si | `Juan Perez` |
| **Cargo** | Rol en el condominio | Si | `Vigilancia` |
| **Cedula de Identidad** | Documento de identificacion | No | `V-34567890` |
| **Telefono** | Numero de contacto | No | `+58 412-5551234` |
| **Correo Electronico** | Solo si tendra acceso al sistema | No | `juan@email.com` |
| **Turno** | Horario de trabajo | No | `06:00 - 14:00` |

**Valores validos para Cargo:**
- `Vigilancia`
- `Conserje`
- `Mantenimiento`
- `Otro`

> **Nota:** Solo el personal que necesite acceder a la app requiere correo electronico.

---

## HOJA 6: Saldos Financieros (opcional)

Si desean migrar los saldos pendientes actuales de cada unidad.

| Columna | Descripcion | Obligatorio | Ejemplo |
|---------|-------------|:-----------:|---------|
| **Numero de Rancho** | Debe coincidir con Hoja 1 | Si | `R-001` |
| **Tipo** | Cargo o Abono | Si | `Cargo` |
| **Monto** | Cantidad en Bs. o USD | Si | `150.00` |
| **Descripcion** | Concepto del movimiento | Si | `Cuota marzo 2026` |
| **Fecha** | Fecha del movimiento | Si | `2026-03-01` |

> **Nota sobre moneda:** Confirmar si los montos son en Bolivares (Bs.) o Dolares (USD) para configurar la plataforma correctamente.

---

## HOJA 7: Dispositivos de Acceso (opcional)

Equipos fisicos (lectores QR, alcabalas) instalados en el condominio.

| Columna | Descripcion | Obligatorio | Ejemplo |
|---------|-------------|:-----------:|---------|
| **Nombre del Dispositivo** | Nombre identificador | Si | `Alcabala Principal` |
| **Ubicacion** | Donde esta instalado | No | `Entrada principal` |

---

## Resumen de Prioridades

| Hoja | Prioridad | Registros Esperados |
|------|:---------:|--------------------:|
| 1. Unidades | **Critica** | 86 |
| 2. Propietarios | **Critica** | 86 |
| 3. Miembros del Hogar | Alta | Variable |
| 4. Vehiculos | Alta | Variable |
| 5. Personal Operativo | Media | Variable |
| 6. Saldos Financieros | Media | Variable |
| 7. Dispositivos | Baja | 1-3 |

> **Minimo indispensable para el lanzamiento:** Hojas 1 y 2 (Unidades + Propietarios).
> Todo lo demas puede cargarse posteriormente desde la plataforma.

---

## Notas Importantes

1. **Privacidad:** Toda la informacion sera tratada de forma confidencial y almacenada de manera segura en servidores protegidos.
2. **Formato del archivo:** Preferiblemente Excel (.xlsx) o Google Sheets compartido. Evitar PDF o imagenes.
3. **Dudas:** Contactar a Zunami Corp para cualquier pregunta sobre los campos solicitados.
4. **Revision:** Una vez recibida la data, realizaremos una validacion y confirmaremos si hay campos faltantes o inconsistencias antes de la carga.

---

*Documento generado por ZunamiCorp para el proyecto ChanaDomus.*
*Version 1.0 — Abril 2026*
