export function crearRepositorioPostgres(pool) {
  return {
    async comprobarEsquema() {
      await pool.query(`
        SELECT 1 FROM clientes LIMIT 0;
        SELECT 1 FROM conversaciones LIMIT 0;
        SELECT 1 FROM mensajes LIMIT 0;
      `);
    },

    async listarClientes() {
      const { rows } = await pool.query(
        'SELECT id, telefono, creado_en FROM clientes ORDER BY id',
      );
      return rows;
    },

    async listarConversaciones() {
      const { rows } = await pool.query(
        'SELECT id, cliente_id, creada_en FROM conversaciones ORDER BY id',
      );
      return rows;
    },

    async buscarMensajes(id) {
      const { rows } = await pool.query(
        `SELECT c.id AS conversacion_id, m.id, m.texto, m.recibido_en
         FROM conversaciones c
         LEFT JOIN mensajes m ON m.conversacion_id = c.id
         WHERE c.id = $1
         ORDER BY m.id`,
        [id],
      );
      return rows.length === 0 ? null : rows.filter((fila) => fila.id !== null);
    },

    async registrarRecepcion(telefono, mensaje) {
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
      return recibido;
    },
  };
}
