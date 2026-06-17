export type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type PerfumeRow = {
  id: string;
  slug: string;
  name: string;
  inspiration: string | null;
  collection: string | null;
  category: string | null;
  bottle_type: string | null;
  default_sale_price: number | string | null;
  default_unit_cost: number | string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type InventoryItemRow = {
  id: string;
  perfume_slug: string;
  perfume_name: string;
  line_type: string;
  stock_quantity: number;
  unit_cost: number | string;
  sale_price: number | string;
  minimum_stock: number;
  created_at: string | null;
  updated_at: string | null;
  synced_at?: string | null;
};

export type SaleRow = {
  id: string;
  local_id?: string | null;
  customer_name: string;
  customer_phone: string | null;
  perfume_slug: string;
  perfume_name: string;
  line_type: string;
  unit_price: number | string;
  unit_cost: number | string | null;
  quantity: number;
  payment_method: string;
  status: string;
  notes: string | null;
  estimated_profit: number | string | null;
  created_at: string | null;
  paid_at: string | null;
  synced_at?: string | null;
};
