-- Agregar una dirección de prueba para el usuario 3
INSERT INTO tbl_direcciones (
  direccion,
  referencia,
  latitud,
  longitud,
  es_predeterminada,
  activo,
  id_usuario,
  id_ciudad
) VALUES (
  'Calle Principal #123, Barrio Centro',
  'Casa blanca con portón negro',
  -12.0464,
  -77.0428,
  true,
  true,
  3, -- ID del usuario (ajusta según tu usuario actual)
  1  -- ID de ciudad (ajusta según tu base de datos)
)
ON CONFLICT DO NOTHING;
