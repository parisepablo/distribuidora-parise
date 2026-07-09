-- 1. Price history per product (config table)
CREATE TABLE precios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  producto text NOT NULL CHECK (producto IN ('bidon_12', 'bidon_20', 'cajon_soda')),
  precio_costo numeric(10,2) NOT NULL,   -- what dad pays the factory
  precio_venta numeric(10,2) NOT NULL,   -- what dad charges customers
  vigente_desde date NOT NULL DEFAULT CURRENT_DATE
);

-- 2. One row per delivery day (the main daily log)
CREATE TABLE registros_diarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  fecha date NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  total_cobrado numeric(10,2) NOT NULL DEFAULT 0,  -- total cash collected that day
  notas text
);

-- 3. Optional product breakdown per day (up to 3 rows per registro)
CREATE TABLE ventas_diarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registro_id uuid NOT NULL REFERENCES registros_diarios(id) ON DELETE CASCADE,
  producto text NOT NULL CHECK (producto IN ('bidon_12', 'bidon_20', 'cajon_soda')),
  cantidad int NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL,  -- snapshot of precio_venta at time of save
  subtotal numeric(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  UNIQUE(registro_id, producto)
);

-- 4. Factory refill purchases (independent of daily log)
CREATE TABLE recargas_fabrica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  producto text NOT NULL CHECK (producto IN ('bidon_12', 'bidon_20', 'cajon_soda')),
  cantidad int NOT NULL CHECK (cantidad > 0),
  costo_unitario numeric(10,2) NOT NULL,  -- snapshot of precio_costo at time of save
  total numeric(10,2) GENERATED ALWAYS AS (cantidad * costo_unitario) STORED,
  notas text
);

-- 5. Other expenses (fuel, maintenance, etc.)
CREATE TABLE gastos_otros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  descripcion text NOT NULL,
  monto numeric(10,2) NOT NULL,
  categoria text NOT NULL DEFAULT 'otros' CHECK (categoria IN ('combustible', 'mantenimiento', 'insumos', 'otros'))
);

-- 6. Customer address book (optional module)
CREATE TABLE clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  nombre text NOT NULL,
  telefono text,
  direccion text,
  lat float8,
  lng float8,
  notas text,
  activo boolean DEFAULT true
);

-- 7. Per-customer tab transactions (optional module)
CREATE TABLE transacciones_clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrega', 'pago')),
  producto text CHECK (producto IN ('bidon_12', 'bidon_20', 'cajon_soda')),
  cantidad int,
  monto numeric(10,2) NOT NULL,
  precio_unitario numeric(10,2),
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  notas text
);

-- Enable Row Level Security and allow all operations for authenticated users
ALTER TABLE precios ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_diarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE recargas_fabrica ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_otros ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_clientes ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated user can do everything (single-owner app)
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['precios','registros_diarios','ventas_diarias','recargas_fabrica','gastos_otros','clientes','transacciones_clientes'] LOOP
    EXECUTE format('CREATE POLICY "owner_all" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Helper function — get active price for a product on a given date
CREATE OR REPLACE FUNCTION precio_activo(p_producto text, p_fecha date)
RETURNS TABLE(precio_costo numeric, precio_venta numeric) AS $$
  SELECT precio_costo, precio_venta FROM precios
  WHERE producto = p_producto AND vigente_desde <= p_fecha
  ORDER BY vigente_desde DESC LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Seed initial prices (dad will update these via the app later)
INSERT INTO precios (producto, precio_costo, precio_venta, vigente_desde) VALUES
  ('bidon_12',  0, 0, '2020-01-01'),
  ('bidon_20',  0, 0, '2020-01-01'),
  ('cajon_soda', 0, 0, '2020-01-01');
