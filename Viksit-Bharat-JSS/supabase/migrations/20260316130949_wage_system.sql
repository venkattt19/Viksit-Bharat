-- Wage Configuration Table
CREATE TABLE IF NOT EXISTS wage_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  district text NOT NULL,
  daily_wage numeric(10,2) NOT NULL,
  effective_from date NOT NULL,
  set_by uuid REFERENCES officers(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  wage_id uuid REFERENCES wages(id) ON DELETE CASCADE NOT NULL,
  amount numeric(15,2) NOT NULL,
  payment_date date NOT NULL,
  reference_number text NOT NULL,
  status text DEFAULT 'completed',
  processed_by uuid REFERENCES officers(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE wage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Update these based on deeper structural needs if necessary)
CREATE POLICY "Anyone can view wage config" ON wage_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Officers can view payments" ON payments FOR SELECT TO authenticated USING (true);