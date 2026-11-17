import { Router } from 'express';

export function rutasClientes(aplicacion) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await aplicacion.listarClientes());
  });

  return router;
}
