import { Router } from 'express';

export function rutasConversaciones(pool) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const { rows } = await pool.query(
      'SELECT id, cliente_id, creada_en FROM conversaciones ORDER BY id',
    );
    res.json(rows);
  });

  router.get('/:id/mensajes', async (req, res) => {
    const { id } = req.params;
    if (!/^[1-9][0-9]{0,9}$/.test(id) || Number(id) > 2147483647) {
      return res.status(400).json({ error: 'ID de conversación inválido' });
    }

    const { rows } = await pool.query(
      `SELECT c.id AS conversacion_id, m.id, m.texto, m.recibido_en
       FROM conversaciones c
       LEFT JOIN mensajes m ON m.conversacion_id = c.id
       WHERE c.id = $1
       ORDER BY m.id`,
      [id],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Conversación inexistente' });
    }

    res.json(rows.filter((fila) => fila.id !== null));
  });

  router.post('/recepcion-simulada', async (req, res) => {
    const { telefono, texto } = req.body ?? {};
    const mensaje = typeof texto === 'string' ? texto.trim() : '';

    if (typeof telefono !== 'string' || !/^\+[1-9][0-9]{6,14}$/.test(telefono)) {
      return res.status(400).json({ error: 'Teléfono inválido. Usa + y de 7 a 15 dígitos' });
    }
    if (!mensaje || [...mensaje].length > 1000 || mensaje.includes('\u0000')) {
      return res.status(400).json({ error: 'El texto debe contener entre 1 y 1000 caracteres válidos' });
    }

    const { rows: [recibido] } = await pool.query(
      `WITH cliente AS (
         INSERT INTO clientes (telefono) VALUES ($1)
         ON CONFLICT (telefono) DO UPDATE SET telefono = EXCLUDED.telefono
         RETURNING id
       ), conversacion AS (
         INSERT INTO conversaciones (cliente_id) SELECT id FROM cliente
         ON CONFLICT (cliente_id) DO UPDATE SET cliente_id = EXCLUDED.cliente_id
         RETURNING id, cliente_id
       ), mensaje AS (
         INSERT INTO mensajes (conversacion_id, texto)
         SELECT id, $2::text FROM conversacion
         RETURNING id, conversacion_id, texto, recibido_en
       )
       SELECT mensaje.*, conversacion.cliente_id
       FROM mensaje JOIN conversacion ON conversacion.id = mensaje.conversacion_id`,
      [telefono, mensaje],
    );

    res.status(201).json(recibido);
  });

  return router;
}
