BEGIN;

CREATE TABLE clientes (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    telefono text NOT NULL UNIQUE CHECK (telefono ~ '^\+[1-9][0-9]{6,14}$'),
    creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversaciones (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id integer NOT NULL UNIQUE REFERENCES clientes (id),
    creada_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mensajes (
    id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    conversacion_id integer NOT NULL REFERENCES conversaciones (id),
    texto text NOT NULL CHECK (char_length(btrim(texto)) BETWEEN 1 AND 1000),
    recibido_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mensajes_conversacion_id_idx ON mensajes (conversacion_id, id);

COMMIT;
