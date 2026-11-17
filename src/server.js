import express from 'express';
import pg from 'pg';
import { crearCasosDeUso } from './aplicacion.js';
import { crearRepositorioPostgres } from './postgres.js';
import { rutasClientes } from './clientes.js';
import { rutasConversaciones } from './conversaciones.js';

const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535 || !process.env.DATABASE_URL) {
  throw new Error('Configura PORT y DATABASE_URL en .env');
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 3000,
  statement_timeout: 5000,
});
pool.on('error', (error) => {
  console.error('Conexión inactiva de PostgreSQL:', error.code ?? error.name);
});

const aplicacion = crearCasosDeUso(crearRepositorioPostgres(pool));
const app = express();
app.use(express.json({ limit: '16kb' }));

app.get('/api/estado', async (_req, res) => {
  try {
    await aplicacion.comprobarEstado();
    res.json({ estado: 'ok', base_de_datos: 'disponible' });
  } catch (error) {
    console.error('Consulta de estado:', error.code ?? error.name);
    res.status(503).json({ estado: 'no_disponible', base_de_datos: 'no_disponible' });
  }
});

app.use('/api/clientes', rutasClientes(aplicacion));
app.use('/api/conversaciones', rutasConversaciones(aplicacion));
app.use((_req, res) => res.status(404).json({ error: 'Ruta inexistente' }));

app.use((error, _req, res, _next) => {
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo supera 16 KB' });
  }
  console.error('Error de operación:', error.code ?? error.name);
  res.status(500).json({ error: 'No se pudo completar la operación' });
});

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Módulo 4 disponible en http://127.0.0.1:${port}/api/estado`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => pool.end()));
}
