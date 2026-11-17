import { Router } from 'express';

export function rutasClientes(pool) {
  const router = Router();

  router.get('/', async (_req, res) => {
    const { rows } = await pool.query(
      'SELECT id, telefono, creado_en FROM clientes ORDER BY id',
    );
    res.json(rows);
  });

  return router;
}
