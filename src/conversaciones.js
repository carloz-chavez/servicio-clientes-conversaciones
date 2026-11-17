import { Router } from 'express';

export function rutasConversaciones(aplicacion) {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await aplicacion.listarConversaciones());
  });

  router.get('/:id/mensajes', async (req, res) => {
    const id = /^[1-9][0-9]{0,9}$/.test(req.params.id) ? Number(req.params.id) : NaN;
    const resultado = await aplicacion.consultarHistorial(id);

    if (resultado.error === 'id_invalido') {
      return res.status(400).json({ error: 'ID de conversación inválido' });
    }
    if (resultado.error === 'conversacion_inexistente') {
      return res.status(404).json({ error: 'Conversación inexistente' });
    }

    res.json(resultado.mensajes);
  });

  router.post('/recepcion-simulada', async (req, res) => {
    const { telefono, texto } = req.body ?? {};
    const resultado = await aplicacion.recibirMensaje(telefono, texto);

    if (resultado.error === 'telefono_invalido') {
      return res.status(400).json({ error: 'Teléfono inválido. Usa + y de 7 a 15 dígitos' });
    }
    if (resultado.error === 'texto_invalido') {
      return res.status(400).json({ error: 'El texto debe contener entre 1 y 1000 caracteres válidos' });
    }

    res.status(201).json(resultado.mensaje);
  });

  return router;
}
