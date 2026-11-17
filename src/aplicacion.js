/**
 * Puerto de persistencia del servicio. Cada operación devuelve una promesa.
 * buscarMensajes devuelve null cuando la conversación no existe.
 * registrarRecepcion guarda el cliente, la conversación y el mensaje de forma atómica.
 *
 * @typedef {object} Repositorio
 * @property {() => Promise<void>} comprobarEsquema
 * @property {() => Promise<object[]>} listarClientes
 * @property {() => Promise<object[]>} listarConversaciones
 * @property {(id: number) => Promise<object[] | null>} buscarMensajes
 * @property {(telefono: string, texto: string) => Promise<object>} registrarRecepcion
 */

/** @param {Repositorio} repositorio */
export function crearCasosDeUso(repositorio) {
  return {
    comprobarEstado: () => repositorio.comprobarEsquema(),
    listarClientes: () => repositorio.listarClientes(),
    listarConversaciones: () => repositorio.listarConversaciones(),

    async consultarHistorial(id) {
      if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
        return { error: 'id_invalido' };
      }
      const mensajes = await repositorio.buscarMensajes(id);
      return mensajes === null ? { error: 'conversacion_inexistente' } : { mensajes };
    },

    async recibirMensaje(telefono, texto) {
      const mensaje = typeof texto === 'string' ? texto.trim() : '';
      if (typeof telefono !== 'string' || !/^\+[1-9][0-9]{6,14}$/.test(telefono)) {
        return { error: 'telefono_invalido' };
      }
      if (!mensaje || [...mensaje].length > 1000 || mensaje.includes('\u0000')) {
        return { error: 'texto_invalido' };
      }
      return { mensaje: await repositorio.registrarRecepcion(telefono, mensaje) };
    },
  };
}
