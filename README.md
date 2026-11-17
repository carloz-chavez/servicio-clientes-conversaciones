# PC3 · Módulo 4 CHAVEZ

Prototipo local de Clientes y Conversaciones para el ERP de ventas por WhatsApp. Una petición HTTP con datos ficticios simula la recepción de un mensaje entrante.

## Requisitos

- Node.js 22 o posterior y npm.
- PostgreSQL en ejecución y acceso a `psql`. El ejemplo usa el puerto 5432.
- Una base de datos local vacía para este prototipo.

## Puesta en marcha en Windows

Abre PowerShell en la carpeta de este README. Desde una cuenta administradora local de PostgreSQL crea un rol de pruebas y asígnale una contraseña cuando se solicite. Si tu usuario administrador se llama de otra forma, sustituye `postgres`.

```powershell
createuser -h 127.0.0.1 -U postgres --pwprompt modulo4
createdb -h 127.0.0.1 -U postgres -O modulo4 pc3_modulo4
psql -h 127.0.0.1 -U modulo4 -d pc3_modulo4 -v ON_ERROR_STOP=1 -f .\sql\esquema.sql
Copy-Item .env.example .env
notepad .env
```

En `.env`, sustituye `cambiar_clave_local` por la contraseña del rol. Si contiene caracteres reservados de URL, codifícalos (por ejemplo, `@` se escribe `%40`). El esquema se aplica una sola vez sobre la base vacía y crea las tres tablas en una transacción.

Guarda el archivo y ejecuta estos comandos. El servidor escucha en `127.0.0.1`.

```powershell
npm.cmd ci
npm.cmd start
```

## Endpoints

| Método y ruta | Resultado esperado |
| --- | --- |
| `GET /api/estado` | 200 si se pueden consultar las tres tablas y 503 si la comprobación falla. |
| `GET /api/clientes` | 200 y lista de clientes. |
| `GET /api/conversaciones` | 200 y lista de conversaciones con su `cliente_id`. |
| `POST /api/conversaciones/recepcion-simulada` | 201 y mensaje registrado con sus identificadores. 400 si el teléfono o el texto son inválidos. |
| `GET /api/conversaciones/:id/mensajes` | 200 e historial en orden de ID, 400 ante un ID inválido y 404 si la conversación no existe. |

## Prueba del flujo

En otra ventana de PowerShell ejecuta lo siguiente. Ajusta el puerto si cambiaste `PORT`.

```powershell
$api = 'http://127.0.0.1:3000/api'
Invoke-RestMethod "$api/estado"

$recepcion = "$api/conversaciones/recepcion-simulada"
$datos = @{ telefono = '+12025550123'; texto = 'Tienen stock?' }
$primero = Invoke-RestMethod $recepcion -Method Post -ContentType 'application/json' -Body ($datos | ConvertTo-Json)
$datos.texto = 'Gracias'
$segundo = Invoke-RestMethod $recepcion -Method Post -ContentType 'application/json' -Body ($datos | ConvertTo-Json)
$primero
$segundo

Invoke-RestMethod "$api/clientes"
Invoke-RestMethod "$api/conversaciones"
Invoke-RestMethod "$api/conversaciones/$($primero.conversacion_id)/mensajes"
```

El estado debe ser `ok`. En una base recién creada, las listas deben contener un cliente, una conversación vinculada al cliente y dos mensajes en esa conversación. Los dos POST deben devolver los mismos `cliente_id` y `conversacion_id`, y distintos `id` de mensaje. Cada ejecución adicional agrega dos mensajes al mismo historial.

```powershell
$invalido = @{ telefono = '123'; texto = 'Hola' } | ConvertTo-Json
try {
    Invoke-RestMethod $recepcion -Method Post -ContentType 'application/json' -Body $invalido
} catch {
    [int]$_.Exception.Response.StatusCode
}
try {
    Invoke-RestMethod "$api/conversaciones/2147483647/mensajes"
} catch {
    [int]$_.Exception.Response.StatusCode
}
```

En una base de demostración, se espera 400 para el teléfono inválido y 404 para el ID inexistente.
