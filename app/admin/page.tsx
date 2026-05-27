"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  DEFAULT_COST_SETTINGS,
  calculateSaleProfit,
  getEstimatedUnitCost,
  type LineType,
} from "@/lib/costs";
import {
  lineLabels,
  perfumeCommerce,
  perfumeSlug,
  type PerfumeLine,
} from "@/lib/perfumes";
import { createSlugFromName, splitNotes } from "@/lib/perfume-utils";
import {
  BACKUP_INFO_STORAGE_KEY,
  CUSTOMERS_STORAGE_KEY,
  SALES_STORAGE_KEY,
  STOCK_STORAGE_KEY,
} from "@/lib/storage-keys";
import { isSupabaseConfigured, supabase } from "@/lib/supabase-browser";
import { createWhatsAppLink } from "@/lib/whatsapp";

type StoredPaymentMethod = "dinheiro" | "pix" | "cartao" | "cartão" | "fiado";
type PaymentMethod = "dinheiro" | "pix" | "cartão" | "fiado";
type SaleStatus = "pago" | "pendente";
type AdminTab = "overview" | "sales" | "perfumes" | "alerts";
type SaleFilter = "todos" | "pagos" | "pendentes";
type PaymentFilter = "todos" | PaymentMethod;
type CustomerFilter =
  | "todos"
  | "com_pendencia"
  | "sem_pendencia"
  | "com_telefone"
  | "sem_telefone";
type StockFilter =
  | "todos"
  | "em_estoque"
  | "poucas"
  | "sem_estoque"
  | "traditional"
  | "arabic_premium";

export type Sale = {
  id: string;
  customerName: string;
  perfumeSlug: string;
  perfumeName: string;
  lineType: PerfumeLine;
  unitPrice: number;
  quantity: number;
  paymentMethod: StoredPaymentMethod;
  status: SaleStatus;
  notes: string;
  createdAt: string;
  paidAt?: string;
  dueDate?: string;
  customerPhone?: string;
};

type StockItem = {
  perfumeSlug: string;
  quantity: number;
  minQuantity: number;
  updatedAt: string;
};

type Customer = {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};

type CustomerForm = {
  name: string;
  phone: string;
  notes: string;
};

type BackupInfo = {
  lastBackupAt: string;
};

type FullBackup = {
  app: "Amaro dos Reis Parfum";
  version: 1;
  createdAt: string;
  storageKeys: {
    sales: typeof SALES_STORAGE_KEY;
    stock: typeof STOCK_STORAGE_KEY;
    customers: typeof CUSTOMERS_STORAGE_KEY;
  };
  data: {
    sales: Sale[];
    stock: Record<string, StockItem>;
    customers: Customer[];
  };
};

type SaleForm = {
  customerId: string;
  customerName: string;
  perfumeSlug: string;
  lineType: PerfumeLine;
  quantity: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string;
  customerPhone: string;
  dueDate: string;
};

type PerfumeCategory = "masculino" | "feminino" | "unissex";
type BottleType = "tradicional" | "arabe";
type AvailabilityStatus = "available" | "limited" | "on_order";

type PerfumeForm = {
  name: string;
  inspiration: string;
  category: PerfumeCategory;
  collection: string;
  bottleType: BottleType;
  price: string;
  costPrice: string;
  stockQuantity: string;
  olfactiveFamily: string;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  shortDescription: string;
  longDescription: string;
  tags: string;
  imageUrl: string;
  availabilityStatus: AvailabilityStatus;
  isActive: boolean;
};

type AuthForm = {
  email: string;
  password: string;
};

type SupabaseSaleRow = {
  id: string;
  customer_name: string;
  perfume_slug: string;
  perfume_name: string;
  line_type: "tradicional" | "arabe";
  unit_price: number | string;
  cost_price: number | string;
  quantity: number;
  payment_method: "dinheiro" | "pix" | "cartao" | "fiado";
  status: SaleStatus;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  due_date: string | null;
  customer_phone: string | null;
};

type SupabasePerfumeRow = {
  id: string;
  slug: string;
  name: string;
  inspiration: string | null;
  category: PerfumeCategory;
  collection: string;
  bottle_type: BottleType;
  price: number | string;
  cost_price: number | string;
  stock_quantity: number;
  olfactive_family: string | null;
  top_notes: string | null;
  heart_notes: string | null;
  base_notes: string | null;
  short_description: string | null;
  long_description: string | null;
  tags: string[] | null;
  image_url: string | null;
  availability_status: AvailabilityStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const defaultPerfume = perfumeCommerce[0];

const initialForm: SaleForm = {
  customerId: "",
  customerName: "",
  perfumeSlug: perfumeSlug(defaultPerfume),
  lineType: defaultPerfume.line,
  quantity: 1,
  paymentMethod: "pix",
  status: "pago",
  notes: "",
  customerPhone: "",
  dueDate: "",
};

const initialPerfumeForm: PerfumeForm = {
  name: "",
  inspiration: "",
  category: "unissex",
  collection: "",
  bottleType: "tradicional",
  price: "80",
  costPrice: "0",
  stockQuantity: "0",
  olfactiveFamily: "",
  topNotes: "",
  heartNotes: "",
  baseNotes: "",
  shortDescription: "",
  longDescription: "",
  tags: "",
  imageUrl: "",
  availabilityStatus: "limited",
  isActive: true,
};

const initialCustomerForm: CustomerForm = {
  name: "",
  phone: "",
  notes: "",
};

const initialAuthForm: AuthForm = {
  email: "",
  password: "",
};

const paymentLabels: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartão: "Cartao",
  fiado: "Fiado / receber depois",
};

const statusLabels: Record<SaleStatus, string> = {
  pago: "Pago",
  pendente: "Pendente",
};

function getLinePrice(lineType: PerfumeLine) {
  return lineType === "arabic_premium" ? 120 : 80;
}

function toCostLine(lineType: PerfumeLine | string): LineType {
  return lineType === "arabic_premium" || lineType === "arabe"
    ? "arabe"
    : "tradicional";
}

function normalizePaymentMethod(method: StoredPaymentMethod): PaymentMethod {
  return method === "cartao" ? "cartão" : method;
}

function toSupabaseLine(lineType: PerfumeLine): "tradicional" | "arabe" {
  return lineType === "arabic_premium" ? "arabe" : "tradicional";
}

function fromSupabaseLine(lineType: "tradicional" | "arabe"): PerfumeLine {
  return lineType === "arabe" ? "arabic_premium" : "traditional";
}

function toSupabasePaymentMethod(method: PaymentMethod) {
  return method === "cartão" ? "cartao" : method;
}

function mapSupabaseSale(row: SupabaseSaleRow): Sale {
  return {
    id: row.id,
    customerName: row.customer_name,
    perfumeSlug: row.perfume_slug,
    perfumeName: row.perfume_name,
    lineType: fromSupabaseLine(row.line_type),
    unitPrice: Number(row.unit_price) || 0,
    quantity: Math.max(1, Number(row.quantity) || 1),
    paymentMethod: row.payment_method,
    status: row.status,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
    dueDate: row.due_date ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
  };
}

function mapPerfumeToForm(perfume: SupabasePerfumeRow): PerfumeForm {
  return {
    name: perfume.name,
    inspiration: perfume.inspiration ?? "",
    category: perfume.category,
    collection: perfume.collection,
    bottleType: perfume.bottle_type,
    price: String(Number(perfume.price) || 0),
    costPrice: String(Number(perfume.cost_price) || 0),
    stockQuantity: String(Number(perfume.stock_quantity) || 0),
    olfactiveFamily: perfume.olfactive_family ?? "",
    topNotes: perfume.top_notes ?? "",
    heartNotes: perfume.heart_notes ?? "",
    baseNotes: perfume.base_notes ?? "",
    shortDescription: perfume.short_description ?? "",
    longDescription: perfume.long_description ?? "",
    tags: (perfume.tags ?? []).join(", "),
    imageUrl: perfume.image_url ?? "",
    availabilityStatus: perfume.availability_status,
    isActive: perfume.is_active,
  };
}

function saleProfit(sale: {
  lineType: PerfumeLine | string;
  unitPrice: number;
  quantity: number;
  paymentMethod: StoredPaymentMethod;
}) {
  return calculateSaleProfit(
    {
      lineType: toCostLine(sale.lineType),
      unitPrice: Number(sale.unitPrice) || 0,
      quantity: Math.max(1, Number(sale.quantity) || 1),
      paymentMethod: normalizePaymentMethod(sale.paymentMethod),
    },
    DEFAULT_COST_SETTINGS
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value?: string) {
  if (!value) {
    return "Sem vencimento";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function daysBetweenDates(targetDate: string) {
  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const target = new Date(`${targetDate}T12:00:00`);
  const targetOnly = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  return Math.round(
    (targetOnly.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function describeDueDate(dueDate?: string) {
  if (!dueDate) {
    return "Sem vencimento definido";
  }

  const days = daysBetweenDates(dueDate);

  if (days < 0) {
    return `Venceu ha ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}`;
  }

  if (days === 0) {
    return "Vence hoje";
  }

  return `Faltam ${days} dia${days === 1 ? "" : "s"}`;
}

function createCustomerWhatsAppLink(phone: string, message: string) {
  const sanitizedPhone = phone.replace(/\D/g, "");

  if (sanitizedPhone.length < 10) {
    return "#";
  }

  return `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeCsv(value: string | number) {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function defaultStockItem(slug: string): StockItem {
  return {
    perfumeSlug: slug,
    quantity: 0,
    minQuantity: 2,
    updatedAt: "",
  };
}

function stockStatus(item: StockItem) {
  if (item.quantity <= 0) {
    return "Sem estoque";
  }

  if (item.quantity <= item.minQuantity) {
    return "Poucas unidades";
  }

  return "Em estoque";
}

function readLocalSales() {
  const storedSales = window.localStorage.getItem(SALES_STORAGE_KEY);

  if (!storedSales) {
    return [];
  }

  try {
    const parsedSales = JSON.parse(storedSales) as Sale[];
    return Array.isArray(parsedSales) ? parsedSales : [];
  } catch {
    return [];
  }
}

export default function AdminPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [form, setForm] = useState<SaleForm>(initialForm);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerForm, setCustomerForm] =
    useState<CustomerForm>(initialCustomerForm);
  const [customerMessage, setCustomerMessage] = useState("");
  const [customerFilter, setCustomerFilter] = useState<CustomerFilter>("todos");
  const [customerQuery, setCustomerQuery] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [backupMessage, setBackupMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleFilter>("todos");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("todos");
  const [stock, setStock] = useState<Record<string, StockItem>>({});
  const [stockFilter, setStockFilter] = useState<StockFilter>("todos");
  const [stockWarning, setStockWarning] = useState("");
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [isStockLoaded, setIsStockLoaded] = useState(false);
  const [isCustomersLoaded, setIsCustomersLoaded] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authForm, setAuthForm] = useState<AuthForm>(initialAuthForm);
  const [authMessage, setAuthMessage] = useState("");
  const [salesMessage, setSalesMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);
  const [salesSource, setSalesSource] = useState<"local" | "supabase">("local");
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [supabasePerfumes, setSupabasePerfumes] = useState<SupabasePerfumeRow[]>([]);
  const [perfumeForm, setPerfumeForm] =
    useState<PerfumeForm>(initialPerfumeForm);
  const [editingPerfumeId, setEditingPerfumeId] = useState<string | null>(null);
  const [perfumeMessage, setPerfumeMessage] = useState("");
  const [isPerfumeLoading, setIsPerfumeLoading] = useState(false);
  const unitPrice = getLinePrice(form.lineType);
  const isSupabaseMode = isSupabaseConfigured && Boolean(authUser);

  useEffect(() => {
    setSales(readLocalSales());
    setIsStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (isStorageLoaded && salesSource === "local") {
      window.localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    }
  }, [isStorageLoaded, sales, salesSource]);

  useEffect(() => {
    const storedStock = window.localStorage.getItem(STOCK_STORAGE_KEY);

    if (!storedStock) {
      setIsStockLoaded(true);
      return;
    }

    try {
      const parsedStock = JSON.parse(storedStock) as Record<string, StockItem>;
      setStock(parsedStock && typeof parsedStock === "object" ? parsedStock : {});
    } catch {
      setStock({});
    } finally {
      setIsStockLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isStockLoaded) {
      window.localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stock));
    }
  }, [isStockLoaded, stock]);

  useEffect(() => {
    const storedCustomers = window.localStorage.getItem(CUSTOMERS_STORAGE_KEY);

    if (!storedCustomers) {
      setIsCustomersLoaded(true);
      return;
    }

    try {
      const parsedCustomers = JSON.parse(storedCustomers) as Customer[];
      setCustomers(Array.isArray(parsedCustomers) ? parsedCustomers : []);
    } catch {
      setCustomers([]);
    } finally {
      setIsCustomersLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isCustomersLoaded) {
      window.localStorage.setItem(
        CUSTOMERS_STORAGE_KEY,
        JSON.stringify(customers)
      );
    }
  }, [customers, isCustomersLoaded]);

  useEffect(() => {
    const storedInfo = window.localStorage.getItem(BACKUP_INFO_STORAGE_KEY);

    if (!storedInfo) {
      return;
    }

    try {
      const parsedInfo = JSON.parse(storedInfo) as BackupInfo;

      if (parsedInfo?.lastBackupAt) {
        setBackupInfo(parsedInfo);
      }
    } catch {
      setBackupInfo(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) {
        setAuthUser(data.user);
        setIsAuthLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthMessage("");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isSupabaseMode) {
      loadSupabaseSales();
      loadSupabasePerfumes();
    }
  }, [isSupabaseMode]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const paymentMethod = normalizePaymentMethod(sale.paymentMethod);
      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "pagos" && sale.status === "pago") ||
        (statusFilter === "pendentes" && sale.status === "pendente");
      const matchesPayment =
        paymentFilter === "todos" || paymentMethod === paymentFilter;

      return matchesStatus && matchesPayment;
    });
  }, [paymentFilter, sales, statusFilter]);

  const summary = useMemo(() => {
    const totals = sales.reduce(
      (acc, sale) => {
        const profit = saleProfit(sale);

        acc.revenue += profit.revenue;
        acc.estimatedCost += profit.estimatedCost;
        acc.cardFees += profit.cardFee;
        acc.netProfit += profit.netProfit;
        acc.salesCount += 1;
        acc.itemsCount += Math.max(1, Number(sale.quantity) || 1);

        if (sale.status === "pago") {
          acc.totalReceived += profit.revenue;
        } else {
          acc.totalPending += profit.revenue;
        }

        return acc;
      },
      {
        revenue: 0,
        totalReceived: 0,
        totalPending: 0,
        estimatedCost: 0,
        cardFees: 0,
        netProfit: 0,
        salesCount: 0,
        itemsCount: 0,
      }
    );

    return {
      ...totals,
      averageMargin:
        totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0,
    };
  }, [sales]);

  const stockRows = useMemo(() => {
    return perfumeCommerce.map((perfume) => {
      const slug = perfumeSlug(perfume);
      const item = stock[slug] ?? defaultStockItem(slug);

      return {
        perfume,
        item,
        status: stockStatus(item),
      };
    });
  }, [stock]);

  const filteredStockRows = useMemo(() => {
    return stockRows.filter(({ perfume, item, status }) => {
      if (stockFilter === "todos") {
        return true;
      }

      if (stockFilter === "em_estoque") {
        return status === "Em estoque";
      }

      if (stockFilter === "poucas") {
        return status === "Poucas unidades";
      }

      if (stockFilter === "sem_estoque") {
        return status === "Sem estoque";
      }

      return perfume.line === stockFilter;
    });
  }, [stockFilter, stockRows]);

  const stockSummary = useMemo(() => {
    return stockRows.reduce(
      (acc, row) => {
        acc.totalUnits += row.item.quantity;

        if (row.status === "Poucas unidades") {
          acc.lowItems += 1;
        }

        if (row.status === "Sem estoque") {
          acc.emptyItems += 1;
        }

        return acc;
      },
      {
        differentPerfumes: stockRows.length,
        totalUnits: 0,
        lowItems: 0,
        emptyItems: 0,
      }
    );
  }, [stockRows]);

  const customerSummaries = useMemo(() => {
    const customerMap = new Map<
      string,
      {
        key: string;
        name: string;
        phone: string;
        notes: string;
        totalBought: number;
        totalReceived: number;
        totalPending: number;
        purchaseCount: number;
        lastPurchase: string;
        sales: Sale[];
      }
    >();

    customers.forEach((customer) => {
      const key = normalizeName(customer.name);
      customerMap.set(key, {
        key,
        name: customer.name,
        phone: customer.phone ?? "",
        notes: customer.notes ?? "",
        totalBought: 0,
        totalReceived: 0,
        totalPending: 0,
        purchaseCount: 0,
        lastPurchase: "",
        sales: [],
      });
    });

    sales.forEach((sale) => {
      const key = normalizeName(sale.customerName);
      const current =
        customerMap.get(key) ??
        {
          key,
          name: sale.customerName,
          phone: "",
          notes: "",
          totalBought: 0,
          totalReceived: 0,
          totalPending: 0,
          purchaseCount: 0,
          lastPurchase: "",
          sales: [],
        };
      const profit = saleProfit(sale);

      current.totalBought += profit.revenue;
      current.purchaseCount += 1;
      current.sales.push(sale);

      if (sale.status === "pago") {
        current.totalReceived += profit.revenue;
      } else {
        current.totalPending += profit.revenue;
      }

      if (!current.lastPurchase || sale.createdAt > current.lastPurchase) {
        current.lastPurchase = sale.createdAt;
      }

      customerMap.set(key, current);
    });

    return Array.from(customerMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [customers, sales]);

  const filteredCustomerSummaries = useMemo(() => {
    const query = normalizeName(customerQuery);

    return customerSummaries.filter((customer) => {
      const matchesQuery = !query || normalizeName(customer.name).includes(query);
      const matchesFilter =
        customerFilter === "todos" ||
        (customerFilter === "com_pendencia" && customer.totalPending > 0) ||
        (customerFilter === "sem_pendencia" && customer.totalPending <= 0) ||
        (customerFilter === "com_telefone" && Boolean(customer.phone)) ||
        (customerFilter === "sem_telefone" && !customer.phone);

      return matchesQuery && matchesFilter;
    });
  }, [customerFilter, customerQuery, customerSummaries]);

  const customerStats = useMemo(() => {
    return customerSummaries.reduce(
      (acc, customer) => {
        acc.totalPending += customer.totalPending;

        if (customer.totalPending > 0) {
          acc.withPending += 1;
        }

        if (customer.totalPending > acc.biggestPending) {
          acc.biggestPending = customer.totalPending;
        }

        return acc;
      },
      {
        registered: customers.length,
        withPending: 0,
        totalPending: 0,
        biggestPending: 0,
      }
    );
  }, [customerSummaries, customers.length]);

  const preview = useMemo(
    () =>
      calculateSaleProfit(
        {
          lineType: toCostLine(form.lineType),
          unitPrice,
          quantity: Math.max(1, Number(form.quantity) || 1),
          paymentMethod: form.paymentMethod,
        },
        DEFAULT_COST_SETTINGS
      ),
    [form.lineType, form.paymentMethod, form.quantity, unitPrice]
  );

  const pendingSales = useMemo(
    () => sales.filter((sale) => sale.status === "pendente"),
    [sales]
  );

  const alertGroups = useMemo(() => {
    return pendingSales.reduce(
      (acc, sale) => {
        if (!sale.dueDate) {
          acc.noDueDate.push(sale);
          return acc;
        }

        const days = daysBetweenDates(sale.dueDate);

        if (days < 0) {
          acc.overdue.push(sale);
        } else if (days === 0) {
          acc.today.push(sale);
        } else if (days <= 7) {
          acc.nextSevenDays.push(sale);
        }

        return acc;
      },
      {
        overdue: [] as Sale[],
        today: [] as Sale[],
        nextSevenDays: [] as Sale[],
        noDueDate: [] as Sale[],
      }
    );
  }, [pendingSales]);

  const pendingAlertTotal = useMemo(
    () =>
      pendingSales.reduce((total, sale) => total + saleProfit(sale).revenue, 0),
    [pendingSales]
  );

  const needsDueDate = form.paymentMethod === "fiado" || form.status === "pendente";

  const selectedStock = useMemo(() => {
    return stock[form.perfumeSlug] ?? defaultStockItem(form.perfumeSlug);
  }, [form.perfumeSlug, stock]);

  const selectedStockMessage = useMemo(() => {
    if (selectedStock.quantity <= 0) {
      return "Sem estoque registrado. Voce ainda pode lancar como encomenda.";
    }

    if (selectedStock.quantity <= selectedStock.minQuantity) {
      return "Poucas unidades disponiveis.";
    }

    return "Disponivel em estoque.";
  }, [selectedStock]);

  async function loadSupabaseSales() {
    if (!supabase || !authUser) {
      return;
    }

    setIsSupabaseLoading(true);
    setSalesMessage("");

    const { data, error } = await supabase
      .from("amaro_sales")
      .select(
        "id, customer_name, perfume_slug, perfume_name, line_type, unit_price, cost_price, quantity, payment_method, status, notes, created_at, paid_at, due_date, customer_phone"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setSalesMessage(
        "Nao foi possivel carregar as vendas do Supabase. Confira a migration e tente novamente."
      );
    } else {
      setSalesSource("supabase");
      setSales((data ?? []).map((row) => mapSupabaseSale(row as SupabaseSaleRow)));
      setSalesMessage("Dados atualizados pelo Supabase.");
    }

    setIsSupabaseLoading(false);
  }

  async function loadSupabasePerfumes() {
    if (!supabase || !authUser) {
      return;
    }

    setIsPerfumeLoading(true);
    setPerfumeMessage("");

    const { data, error } = await supabase
      .from("amaro_perfumes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setPerfumeMessage(
        "Nao foi possivel carregar os perfumes. Confira a migration do Pacote 11."
      );
    } else {
      setSupabasePerfumes((data ?? []) as SupabasePerfumeRow[]);
    }

    setIsPerfumeLoading(false);
  }

  function handlePerfumeChange(nextSlug: string) {
    const perfume = perfumeCommerce.find((item) => perfumeSlug(item) === nextSlug);

    setForm((current) => ({
      ...current,
      perfumeSlug: nextSlug,
      lineType: perfume?.line ?? current.lineType,
    }));
  }

  function handleCustomerSelect(customerId: string) {
    const customer = customers.find((item) => item.id === customerId);

    setForm((current) => ({
      ...current,
      customerId,
      customerName: customer?.name ?? current.customerName,
    }));
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    setIsAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email.trim(),
      password: authForm.password,
    });

    setIsAuthLoading(false);
    setAuthMessage(
      error ? "Nao foi possivel entrar. Confira email e senha." : "Login realizado."
    );
  }

  async function handleSignUp() {
    if (!supabase) {
      return;
    }

    setIsAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signUp({
      email: authForm.email.trim(),
      password: authForm.password,
    });

    setIsAuthLoading(false);
    setAuthMessage(
      error
        ? "Nao foi possivel criar o acesso. Confira os dados informados."
        : "Acesso criado. Se o Supabase pedir confirmacao, verifique o email antes de entrar."
    );
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    setSalesSource("local");
    setSales(readLocalSales());
    setSupabasePerfumes([]);
    setEditingPerfumeId(null);
    await supabase.auth.signOut();
    setAuthUser(null);
    setSalesMessage("Voce saiu do modo Supabase.");
  }

  function handleCustomerSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = customerForm.name.trim();

    if (!name) {
      return;
    }

    const alreadyExists = customers.some(
      (customer) => normalizeName(customer.name) === normalizeName(name)
    );

    if (alreadyExists) {
      setCustomerMessage("Cliente ja cadastrado com esse nome.");
      return;
    }

    const now = new Date().toISOString();
    const customer: Customer = {
      id: createId(),
      name,
      phone: customerForm.phone.trim() || undefined,
      notes: customerForm.notes.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    setCustomers((current) => [...current, customer]);
    setCustomerForm(initialCustomerForm);
    setCustomerMessage("Cliente salvo localmente.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const perfume = perfumeCommerce.find(
      (item) => perfumeSlug(item) === form.perfumeSlug
    );

    if (!perfume || !form.customerName.trim()) {
      return;
    }

    if (isSupabaseMode && supabase && authUser) {
      setIsSupabaseLoading(true);
      setSalesMessage("");

      const quantity = Math.max(1, Number(form.quantity) || 1);
      const paidAt = form.status === "pago" ? new Date().toISOString() : null;
      const { error } = await supabase.from("amaro_sales").insert({
        owner_id: authUser.id,
        customer_name: form.customerName.trim(),
        perfume_slug: form.perfumeSlug,
        perfume_name: perfume.name,
        line_type: toSupabaseLine(form.lineType),
        unit_price: unitPrice,
        cost_price: getEstimatedUnitCost(
          toCostLine(form.lineType),
          DEFAULT_COST_SETTINGS
        ),
        quantity,
        payment_method: toSupabasePaymentMethod(form.paymentMethod),
        status: form.status,
        notes: form.notes.trim() || null,
        customer_phone: form.customerPhone.trim() || null,
        due_date: form.dueDate || null,
        paid_at: paidAt,
      });

      if (error) {
        setSalesMessage(
          "Nao foi possivel registrar a venda no Supabase. Tente novamente."
        );
        setIsSupabaseLoading(false);
        return;
      }

      setForm(initialForm);
      await loadSupabaseSales();
      setSalesMessage("Venda registrada no Supabase.");
      return;
    }

    const sale: Sale = {
      id: createId(),
      customerName: form.customerName.trim(),
      perfumeSlug: form.perfumeSlug,
      perfumeName: perfume.name,
      lineType: form.lineType,
      unitPrice,
      quantity: Math.max(1, Number(form.quantity) || 1),
      paymentMethod: form.paymentMethod,
      status: form.status,
      notes: form.notes.trim(),
      customerPhone: form.customerPhone.trim() || undefined,
      dueDate: form.dueDate || undefined,
      createdAt: new Date().toISOString(),
      paidAt: form.status === "pago" ? new Date().toISOString() : undefined,
    };

    setSales((current) => [sale, ...current]);
    setStock((current) => {
      const item = current[sale.perfumeSlug] ?? defaultStockItem(sale.perfumeSlug);
      const nextQuantity = Math.max(0, item.quantity - sale.quantity);

      if (sale.quantity > item.quantity) {
        setStockWarning(
          "Venda registrada, mas o estoque ficou zerado. Confira se foi encomenda ou estoque manual."
        );
      } else {
        setStockWarning("");
      }

      return {
        ...current,
        [sale.perfumeSlug]: {
          ...item,
          quantity: nextQuantity,
          updatedAt: new Date().toISOString(),
        },
      };
    });
    setForm(initialForm);
  }

  async function handlePerfumeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !authUser) {
      setPerfumeMessage(
        "O cadastro dinamico de perfumes precisa do Supabase ativo."
      );
      return;
    }

    const name = perfumeForm.name.trim();
    const collection = perfumeForm.collection.trim();

    if (!name || !collection) {
      setPerfumeMessage("Informe nome autoral e colecao.");
      return;
    }

    setIsPerfumeLoading(true);
    setPerfumeMessage("");

    const payload = {
      owner_id: authUser.id,
      slug: createSlugFromName(name),
      name,
      inspiration: perfumeForm.inspiration.trim() || null,
      category: perfumeForm.category,
      collection,
      bottle_type: perfumeForm.bottleType,
      price: Number(perfumeForm.price) || 0,
      cost_price: Number(perfumeForm.costPrice) || 0,
      stock_quantity: Math.max(0, Number(perfumeForm.stockQuantity) || 0),
      olfactive_family: perfumeForm.olfactiveFamily.trim() || null,
      top_notes: perfumeForm.topNotes.trim() || null,
      heart_notes: perfumeForm.heartNotes.trim() || null,
      base_notes: perfumeForm.baseNotes.trim() || null,
      short_description: perfumeForm.shortDescription.trim() || null,
      long_description: perfumeForm.longDescription.trim() || null,
      tags: splitNotes(perfumeForm.tags),
      image_url: perfumeForm.imageUrl.trim() || null,
      availability_status: perfumeForm.availabilityStatus,
      is_active: perfumeForm.isActive,
    };

    const response = editingPerfumeId
      ? await supabase
          .from("amaro_perfumes")
          .update(payload)
          .eq("id", editingPerfumeId)
      : await supabase.from("amaro_perfumes").insert(payload);

    if (response.error) {
      setPerfumeMessage(
        "Nao foi possivel salvar o perfume. Verifique se o slug ja existe."
      );
      setIsPerfumeLoading(false);
      return;
    }

    setPerfumeForm(initialPerfumeForm);
    setEditingPerfumeId(null);
    await loadSupabasePerfumes();
    setPerfumeMessage(
      editingPerfumeId ? "Perfume atualizado." : "Perfume cadastrado."
    );
  }

  function editPerfume(perfume: SupabasePerfumeRow) {
    setEditingPerfumeId(perfume.id);
    setPerfumeForm(mapPerfumeToForm(perfume));
    setPerfumeMessage("Editando perfume selecionado.");
  }

  async function deletePerfume(id: string) {
    if (!supabase) {
      return;
    }

    const confirmed = window.confirm("Excluir este perfume cadastrado?");

    if (!confirmed) {
      return;
    }

    setIsPerfumeLoading(true);
    setPerfumeMessage("");

    const { error } = await supabase.from("amaro_perfumes").delete().eq("id", id);

    if (error) {
      setPerfumeMessage("Nao foi possivel excluir o perfume.");
      setIsPerfumeLoading(false);
      return;
    }

    await loadSupabasePerfumes();
    setPerfumeMessage("Perfume excluido.");
  }

  async function markAsPaid(id: string) {
    if (isSupabaseMode && supabase) {
      setIsSupabaseLoading(true);
      setSalesMessage("");

      const { error } = await supabase
        .from("amaro_sales")
        .update({ status: "pago", paid_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        setSalesMessage("Nao foi possivel marcar a venda como paga.");
        setIsSupabaseLoading(false);
        return;
      }

      await loadSupabaseSales();
      setSalesMessage("Venda marcada como paga no Supabase.");
      return;
    }

    setSales((current) =>
      current.map((sale) =>
        sale.id === id
          ? { ...sale, status: "pago", paidAt: new Date().toISOString() }
          : sale
      )
    );
  }

  async function markCustomerPendingAsPaid(customerName: string) {
    const confirmed = window.confirm(
      "Marcar todas as pendencias deste cliente como pagas?"
    );

    if (!confirmed) {
      return;
    }

    const key = normalizeName(customerName);

    if (isSupabaseMode && supabase) {
      setIsSupabaseLoading(true);
      setSalesMessage("");

      const { error } = await supabase
        .from("amaro_sales")
        .update({ status: "pago", paid_at: new Date().toISOString() })
        .eq("customer_name", customerName)
        .eq("status", "pendente");

      if (error) {
        setSalesMessage("Nao foi possivel marcar as pendencias como pagas.");
        setIsSupabaseLoading(false);
        return;
      }

      await loadSupabaseSales();
      setSalesMessage("Pendencias marcadas como pagas no Supabase.");
      return;
    }

    setSales((current) =>
      current.map((sale) =>
        normalizeName(sale.customerName) === key && sale.status === "pendente"
          ? { ...sale, status: "pago", paidAt: new Date().toISOString() }
          : sale
      )
    );
  }

  async function copyChargeMessage(customer: {
    name: string;
    totalPending: number;
  }) {
    const message =
      customer.totalPending > 0
        ? `Ola, ${customer.name}! Tudo bem? Passando para lembrar com carinho da pendencia referente aos perfumes da Amaro dos Reis Parfum. O valor em aberto e de ${formatCurrency(
            customer.totalPending
          )}. Quando puder, me avise a melhor forma de acertarmos. Muito obrigado!`
        : `Ola, ${customer.name}! Obrigado pela confianca na Amaro dos Reis Parfum. Sempre que quiser conhecer novas fragrancias, estou a disposicao!`;

    try {
      await navigator.clipboard.writeText(message);
      setCustomerMessage("Mensagem copiada.");
    } catch {
      window.alert(message);
    }
  }

  async function deleteSale(id: string) {
    const sale = sales.find((item) => item.id === id);

    if (!sale) {
      return;
    }

    if (isSupabaseMode && supabase) {
      const confirmed = window.confirm("Excluir esta venda do Supabase?");

      if (!confirmed) {
        return;
      }

      setIsSupabaseLoading(true);
      setSalesMessage("");

      const { error } = await supabase.from("amaro_sales").delete().eq("id", id);

      if (error) {
        setSalesMessage("Nao foi possivel excluir a venda no Supabase.");
        setIsSupabaseLoading(false);
        return;
      }

      await loadSupabaseSales();
      setSalesMessage("Venda excluida do Supabase.");
      return;
    }

    const shouldReturnStock = window.confirm(
      "Deseja devolver esta quantidade ao estoque?"
    );

    if (shouldReturnStock) {
      updateStockQuantity(sale.perfumeSlug, sale.quantity);
    }

    setSales((current) => current.filter((item) => item.id !== id));
  }

  function updateStockQuantity(slug: string, delta: number) {
    setStock((current) => {
      const item = current[slug] ?? defaultStockItem(slug);

      return {
        ...current,
        [slug]: {
          ...item,
          quantity: Math.max(0, item.quantity + delta),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  }

  function editStockQuantity(slug: string) {
    const item = stock[slug] ?? defaultStockItem(slug);
    const nextValue = window.prompt("Informe a quantidade em estoque:", String(item.quantity));

    if (nextValue === null) {
      return;
    }

    const quantity = Math.max(0, Number(nextValue) || 0);

    setStock((current) => ({
      ...current,
      [slug]: {
        ...(current[slug] ?? defaultStockItem(slug)),
        quantity,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function editMinQuantity(slug: string) {
    const item = stock[slug] ?? defaultStockItem(slug);
    const nextValue = window.prompt("Informe o estoque minimo:", String(item.minQuantity));

    if (nextValue === null) {
      return;
    }

    const minQuantity = Math.max(0, Number(nextValue) || 0);

    setStock((current) => ({
      ...current,
      [slug]: {
        ...(current[slug] ?? defaultStockItem(slug)),
        minQuantity,
        updatedAt: new Date().toISOString(),
      },
    }));
  }

  function exportCsv() {
    const header = [
      "cliente",
      "perfume",
      "linha",
      "preco_unitario",
      "quantidade",
      "total",
      "forma_pagamento",
      "status",
      "telefone_cliente",
      "vencimento",
      "data",
      "observacao",
      "custo_estimado",
      "taxa_cartao",
      "lucro_estimado",
      "margem_percentual",
    ];

    const rows = sales.map((sale) => {
      const profit = saleProfit(sale);
      const paymentMethod = normalizePaymentMethod(sale.paymentMethod);

      return [
        sale.customerName,
        sale.perfumeName,
        lineLabels[sale.lineType] ?? sale.lineType,
        sale.unitPrice,
        sale.quantity,
        profit.revenue,
        paymentLabels[paymentMethod],
        statusLabels[sale.status],
        sale.customerPhone ?? "",
        sale.dueDate ? formatDateOnly(sale.dueDate) : "",
        formatDate(sale.createdAt),
        sale.notes,
        profit.estimatedCost.toFixed(2),
        profit.cardFee.toFixed(2),
        profit.netProfit.toFixed(2),
        profit.marginPercent.toFixed(2),
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "amaro-vendas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportStockCsv() {
    const header = [
      "perfume",
      "colecao",
      "tipo",
      "preco",
      "quantidade",
      "estoque_minimo",
      "status",
      "atualizado_em",
    ];

    const rows = stockRows.map(({ perfume, item, status }) => [
      perfume.name,
      perfume.collection,
      lineLabels[perfume.line],
      getLinePrice(perfume.line),
      item.quantity,
      item.minQuantity,
      status,
      item.updatedAt ? formatDate(item.updatedAt) : "",
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "amaro-estoque.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportCustomersCsv() {
    const header = [
      "nome",
      "telefone",
      "total_comprado",
      "total_recebido",
      "total_pendente",
      "quantidade_compras",
      "ultima_compra",
      "observacao",
    ];
    const rows = customerSummaries.map((customer) => [
      customer.name,
      customer.phone,
      customer.totalBought.toFixed(2),
      customer.totalReceived.toFixed(2),
      customer.totalPending.toFixed(2),
      customer.purchaseCount,
      customer.lastPurchase ? formatDate(customer.lastPurchase) : "",
      customer.notes,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "amaro-clientes.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function createFullBackup(): FullBackup {
    return {
      app: "Amaro dos Reis Parfum",
      version: 1,
      createdAt: new Date().toISOString(),
      storageKeys: {
        sales: SALES_STORAGE_KEY,
        stock: STOCK_STORAGE_KEY,
        customers: CUSTOMERS_STORAGE_KEY,
      },
      data: {
        sales,
        stock,
        customers,
      },
    };
  }

  function exportFullBackup() {
    const backup = createFullBackup();
    const date = backup.createdAt.slice(0, 10);
    const nextBackupInfo = { lastBackupAt: backup.createdAt };

    downloadJson(`amaro-dos-reis-backup-${date}.json`, backup);
    window.localStorage.setItem(
      BACKUP_INFO_STORAGE_KEY,
      JSON.stringify(nextBackupInfo)
    );
    setBackupInfo(nextBackupInfo);
    setBackupMessage("Backup completo baixado com sucesso.");
  }

  function exportPartialBackup(kind: "sales" | "stock" | "customers") {
    const backup = {
      app: "Amaro dos Reis Parfum",
      version: 1,
      createdAt: new Date().toISOString(),
      storageKey:
        kind === "sales"
          ? SALES_STORAGE_KEY
          : kind === "stock"
            ? STOCK_STORAGE_KEY
            : CUSTOMERS_STORAGE_KEY,
      data: kind === "sales" ? sales : kind === "stock" ? stock : customers,
    };

    downloadJson(`amaro-${kind}-backup-${backup.createdAt.slice(0, 10)}.json`, backup);
    setBackupMessage("Backup parcial baixado com sucesso.");
  }

  function isValidFullBackup(value: unknown): value is FullBackup {
    if (!value || typeof value !== "object") {
      return false;
    }

    const backup = value as FullBackup;

    return (
      backup.app === "Amaro dos Reis Parfum" &&
      backup.version === 1 &&
      Boolean(backup.data) &&
      Array.isArray(backup.data.sales) &&
      Boolean(backup.data.stock) &&
      typeof backup.data.stock === "object" &&
      Array.isArray(backup.data.customers)
    );
  }

  function restoreBackupFile(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsedBackup = JSON.parse(String(reader.result));

        if (!isValidFullBackup(parsedBackup)) {
          throw new Error("Invalid backup");
        }

        const confirmed = window.confirm(
          "Esta acao vai substituir vendas, estoque e clientes salvos neste navegador. Deseja continuar?"
        );

        if (!confirmed) {
          return;
        }

        window.localStorage.setItem(
          SALES_STORAGE_KEY,
          JSON.stringify(parsedBackup.data.sales)
        );
        window.localStorage.setItem(
          STOCK_STORAGE_KEY,
          JSON.stringify(parsedBackup.data.stock)
        );
        window.localStorage.setItem(
          CUSTOMERS_STORAGE_KEY,
          JSON.stringify(parsedBackup.data.customers)
        );

        setSales(parsedBackup.data.sales);
        setStock(parsedBackup.data.stock);
        setCustomers(parsedBackup.data.customers);
        setBackupMessage("Backup restaurado com sucesso.");
      } catch {
        setBackupMessage(
          "Nao foi possivel restaurar este arquivo. Verifique se e um backup valido da Amaro dos Reis Parfum."
        );
      }
    };

    reader.readAsText(file);
  }

  const summaryCards = [
    ["Faturamento total", formatCurrency(summary.revenue)],
    ["Total recebido", formatCurrency(summary.totalReceived)],
    ["Total pendente", formatCurrency(summary.totalPending)],
    ["Custo estimado", formatCurrency(summary.estimatedCost)],
    ["Lucro liquido estimado", formatCurrency(summary.netProfit)],
    ["Margem media", formatPercent(summary.averageMargin)],
    ["Taxas de cartao estimadas", formatCurrency(summary.cardFees)],
    ["Perfumes vendidos", summary.itemsCount],
    ["Perfumes diferentes cadastrados", stockSummary.differentPerfumes],
    ["Unidades em estoque", stockSummary.totalUnits],
    ["Itens com poucas unidades", stockSummary.lowItems],
    ["Itens sem estoque", stockSummary.emptyItems],
    ["Clientes cadastrados", customerStats.registered],
    ["Clientes com pendencia", customerStats.withPending],
    ["Pendente por clientes", formatCurrency(customerStats.totalPending)],
    ["Maior pendencia individual", formatCurrency(customerStats.biggestPending)],
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-stone-100">
      <section className="premium-bg border-b border-gold/15 px-6 py-12 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-gold">
            {isSupabaseMode ? "Modo Supabase" : "Modo local"}
          </p>
          <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-5xl">
            Painel interno &mdash; Amaro dos Reis Parfum
          </h1>
          <p className="mt-5 max-w-3xl leading-8 text-stone-300">
            {isSupabaseMode
              ? "Banco Supabase ativo: vendas carregadas com login e protegidas por usuario."
              : "Modo local: os dados ficam salvos apenas neste navegador."}
          </p>
        </div>
      </section>

      <section className="px-6 py-10 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 premium-surface p-6">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                  {isSupabaseMode ? "Banco Supabase ativo" : "Modo local"}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {isSupabaseMode
                    ? "Vendas sincronizadas com Supabase"
                    : isSupabaseConfigured
                      ? "Entre para usar o banco Supabase"
                      : "Supabase ainda nao configurado"}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
                  {isSupabaseMode
                    ? `Logado como ${authUser?.email ?? "usuario autenticado"}.`
                    : isSupabaseConfigured
                      ? "Enquanto nao houver login, o painel continua usando o modo local deste navegador."
                      : "Supabase ainda nao configurado. Usando modo local neste navegador."}
                </p>
                {authMessage ? (
                  <p className="mt-3 text-sm leading-6 text-gold-light">
                    {authMessage}
                  </p>
                ) : null}
                {salesMessage ? (
                  <p className="mt-3 text-sm leading-6 text-gold-light">
                    {salesMessage}
                  </p>
                ) : null}
              </div>

              {isSupabaseConfigured ? (
                authUser ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={loadSupabaseSales}
                      disabled={isSupabaseLoading}
                      className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSupabaseLoading ? "Atualizando..." : "Atualizar dados"}
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-300 transition hover:border-gold/50 hover:text-gold-light"
                    >
                      Sair
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSignIn}
                    className="grid w-full gap-3 lg:max-w-xl"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                          Email
                        </span>
                        <input
                          type="email"
                          required
                          value={authForm.email}
                          onChange={(event) =>
                            setAuthForm((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                        />
                      </label>
                      <label>
                        <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                          Senha
                        </span>
                        <input
                          type="password"
                          required
                          value={authForm.password}
                          onChange={(event) =>
                            setAuthForm((current) => ({
                              ...current,
                              password: event.target.value,
                            }))
                          }
                          className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isAuthLoading}
                        className="min-h-10 rounded-full bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Entrar
                      </button>
                      <button
                        type="button"
                        onClick={handleSignUp}
                        disabled={isAuthLoading}
                        className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Criar acesso
                      </button>
                    </div>
                  </form>
                )
              ) : null}
            </div>
          </section>

          <div className="mb-8 flex flex-wrap gap-2">
            {[
              ["overview", "Visao geral"],
              ["sales", "Vendas"],
              ["perfumes", "Perfumes"],
              ["alerts", "Alertas"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value as AdminTab)}
                className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  activeTab === value
                    ? "border-gold bg-gold text-black"
                    : "border-gold/30 bg-gold/10 text-gold-light hover:border-gold-light"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "overview" ? (
            <>
              <div className="mb-4 grid gap-4 md:grid-cols-3">
                <article className="border border-red-400/30 bg-red-950/25 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-red-300">
                    Vencidas
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-red-200">
                    {alertGroups.overdue.length}
                  </p>
                </article>
                <article className="border border-gold/35 bg-gold/10 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-gold">
                    Vencem hoje
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-gold-light">
                    {alertGroups.today.length}
                  </p>
                </article>
                <article className="border border-white/10 bg-black/25 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                    Total pendente
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-gold-light">
                    {formatCurrency(pendingAlertTotal)} em {pendingSales.length} pendencia
                    {pendingSales.length === 1 ? "" : "s"}
                  </p>
                </article>
              </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {summaryCards.map(([label, value]) => (
              <article key={label} className="premium-surface p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-gold-light">
                  {value}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
            <section className="premium-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                Custos e margem
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <div className="border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    Custo estimado tradicional
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gold-light">
                    {formatCurrency(
                      getEstimatedUnitCost("tradicional", DEFAULT_COST_SETTINGS)
                    )}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    Custo estimado arabe
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gold-light">
                    {formatCurrency(
                      getEstimatedUnitCost("arabe", DEFAULT_COST_SETTINGS)
                    )}
                  </p>
                </div>
                <div className="border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                    Taxa de cartao configurada
                  </p>
                  <p className="mt-2 text-xl font-semibold text-gold-light">
                    {DEFAULT_COST_SETTINGS.cardFeePercent.toFixed(1).replace(".", ",")}%
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-stone-400">
                Os valores sao estimativas para controle interno e podem ser
                ajustados futuramente.
              </p>
            </section>

            <section className="premium-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                Como usar este painel
              </p>
              <div className="mt-5 grid gap-3 text-sm leading-7 text-stone-400 sm:grid-cols-2">
                <p>Registre toda venda no momento em que entregar o perfume.</p>
                <p>Use status pendente quando a pessoa for pagar depois.</p>
                <p>Marque como pago quando receber.</p>
                <p>Exporte CSV regularmente para backup.</p>
                <p className="sm:col-span-2">
                  Acompanhe lucro estimado para saber se a precificacao esta
                  saudavel.
                </p>
              </div>
            </section>
          </div>

            </>
          ) : null}

          {activeTab === "sales" ? (
            <>
          <div className="mt-8 grid gap-8 xl:grid-cols-[0.82fr_1.18fr]">
            <form onSubmit={handleSubmit} className="premium-surface p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                    Cadastro de venda
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    Registrar atendimento
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(initialForm)}
                  className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold"
                >
                  Limpar formulario
                </button>
              </div>

              <div className="mt-6 grid gap-4">
                <label>
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    Cliente cadastrado
                  </span>
                  <select
                    value={form.customerId}
                    onChange={(event) => handleCustomerSelect(event.target.value)}
                    className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                  >
                    <option value="">Venda para cliente nao cadastrado</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                        {customer.phone ? ` - ${customer.phone}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    Nome do cliente
                  </span>
                  <input
                    required
                    value={form.customerName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customerName: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Telefone do cliente
                    </span>
                    <input
                      value={form.customerPhone}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          customerPhone: event.target.value,
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    />
                  </label>

                  <label>
                    <span
                      className={`text-xs uppercase tracking-[0.22em] ${
                        needsDueDate ? "text-gold" : "text-stone-500"
                      }`}
                    >
                      Data de vencimento
                    </span>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          dueDate: event.target.value,
                        }))
                      }
                      className={`mt-2 min-h-11 w-full border bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold ${
                        needsDueDate ? "border-gold bg-gold/10" : "border-gold/25"
                      }`}
                    />
                  </label>
                </div>

                <label>
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    Perfume vendido
                  </span>
                  <select
                    value={form.perfumeSlug}
                    onChange={(event) => handlePerfumeChange(event.target.value)}
                    className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                  >
                    {perfumeCommerce.map((perfume) => (
                      <option key={perfume.name} value={perfumeSlug(perfume)}>
                        {perfume.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="border border-white/10 bg-black/25 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    Estoque atual
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gold-light">
                    {selectedStock.quantity} unidade
                    {selectedStock.quantity === 1 ? "" : "s"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-400">
                    {selectedStockMessage}
                  </p>
                  {stockWarning ? (
                    <p className="mt-3 text-sm leading-6 text-gold-light">
                      {stockWarning}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Tipo da linha
                    </span>
                    <select
                      value={form.lineType}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          lineType: event.target.value as PerfumeLine,
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    >
                      <option value="traditional">Tradicional</option>
                      <option value="arabic_premium">Arabe Premium</option>
                    </select>
                  </label>

                  <div>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Preco automatico
                    </span>
                    <div className="mt-2 flex min-h-11 items-center border border-gold/25 bg-gold/10 px-4 text-sm font-semibold text-gold-light">
                      {formatCurrency(unitPrice)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Quantidade
                    </span>
                    <input
                      min={1}
                      type="number"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          quantity: Number(event.target.value),
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    />
                  </label>

                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Pagamento
                    </span>
                    <select
                      value={form.paymentMethod}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          paymentMethod: event.target.value as PaymentMethod,
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">Pix</option>
                      <option value="cartão">Cartao</option>
                      <option value="fiado">Fiado / receber depois</option>
                    </select>
                  </label>

                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Status
                    </span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value as SaleStatus,
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    >
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                    </select>
                  </label>
                </div>

                <div className="border border-gold/20 bg-gold/10 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                    Resumo da venda
                  </p>
                  <div className="mt-4 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
                    <p>Valor total: {formatCurrency(preview.revenue)}</p>
                    <p>Custo estimado: {formatCurrency(preview.estimatedCost)}</p>
                    <p>Taxa cartao: {formatCurrency(preview.cardFee)}</p>
                    <p>Lucro estimado: {formatCurrency(preview.netProfit)}</p>
                  </div>
                </div>

                <label>
                  <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                    Observacao
                  </span>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    rows={4}
                    className="mt-2 w-full resize-none border border-gold/25 bg-black/45 px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                  />
                </label>

                <button
                  type="submit"
                  className="min-h-12 rounded-full bg-gold px-6 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-gold-light"
                >
                  Registrar venda
                </button>
              </div>
            </form>

            <section className="premium-surface p-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                    Vendas registradas
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    Clientes, fiados e pagamentos
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={exportCsv}
                  className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold"
                >
                  Exportar CSV
                </button>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Status
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ["todos", "Todos"],
                    ["pagos", "Pagos"],
                    ["pendentes", "Pendentes"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value as SaleFilter)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        statusFilter === value
                          ? "border-gold bg-gold text-black"
                          : "border-gold/30 bg-gold/10 text-gold-light hover:border-gold-light"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Forma de pagamento
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    ["todos", "Todos"],
                    ["dinheiro", "Dinheiro"],
                    ["pix", "Pix"],
                    ["cartão", "Cartao"],
                    ["fiado", "Fiado / receber depois"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPaymentFilter(value as PaymentFilter)}
                      className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                        paymentFilter === value
                          ? "border-gold bg-gold text-black"
                          : "border-gold/30 bg-gold/10 text-gold-light hover:border-gold-light"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {filteredSales.length === 0 ? (
                  <div className="border border-white/10 bg-black/25 p-6 text-center">
                    <p className="text-sm text-stone-500">
                      Nenhuma venda registrada neste filtro.
                    </p>
                  </div>
                ) : (
                  filteredSales.map((sale) => {
                    const profit = saleProfit(sale);
                    const isPaid = sale.status === "pago";
                    const paymentMethod = normalizePaymentMethod(sale.paymentMethod);

                    return (
                      <article
                        key={sale.id}
                        className="border border-white/10 bg-black/25 p-5"
                      >
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-semibold text-white">
                                {sale.customerName}
                              </h3>
                              <span
                                className={`border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                  isPaid
                                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                    : "border-gold/35 bg-gold/10 text-gold-light"
                                }`}
                              >
                                {statusLabels[sale.status]}
                              </span>
                            </div>
                            <p className="mt-3 text-sm text-stone-300">
                              {sale.perfumeName} &bull; {sale.quantity} un. &bull;{" "}
                              {formatCurrency(profit.revenue)}
                            </p>
                            <p className="mt-2 text-sm text-stone-500">
                              {paymentLabels[paymentMethod]} &bull;{" "}
                              {formatDate(sale.createdAt)}
                            </p>
                            {sale.customerPhone || sale.dueDate ? (
                              <p className="mt-2 text-sm text-gold-light">
                                {sale.customerPhone
                                  ? `WhatsApp: ${sale.customerPhone}`
                                  : "Sem telefone"}{" "}
                                &bull; Vencimento: {formatDateOnly(sale.dueDate)}
                              </p>
                            ) : null}

                            <div className="mt-4 grid gap-2 text-sm text-stone-300 sm:grid-cols-2">
                              <p>Venda: {formatCurrency(profit.revenue)}</p>
                              <p>Custo: {formatCurrency(profit.estimatedCost)}</p>
                              <p>
                                Taxa cartao: {formatCurrency(profit.cardFee)}
                              </p>
                              <p>
                                Lucro estimado:{" "}
                                {formatCurrency(profit.netProfit)}
                              </p>
                              <p>Margem: {formatPercent(profit.marginPercent)}</p>
                            </div>

                            {sale.notes ? (
                              <p className="mt-3 leading-7 text-stone-400">
                                {sale.notes}
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {!isPaid ? (
                              <button
                                type="button"
                                onClick={() => markAsPaid(sale.id)}
                                className="min-h-10 rounded-full border border-emerald-400/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-400/10"
                              >
                                Marcar como pago
                              </button>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => deleteSale(sale.id)}
                              className="min-h-10 rounded-full border border-red-400/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-400/10"
                            >
                              Excluir venda
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <section className="mt-8 premium-surface p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                  Clientes e pendencias
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Controle de fiados e recebimentos
                </h2>
              </div>
              <button
                type="button"
                onClick={exportCustomersCsv}
                className="min-h-10 w-fit rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold"
              >
                Exportar clientes CSV
              </button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[0.74fr_1.26fr]">
              <form
                onSubmit={handleCustomerSubmit}
                className="border border-white/10 bg-black/25 p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Cadastro rapido de cliente
                </p>
                <div className="mt-5 grid gap-4">
                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Nome do cliente
                    </span>
                    <input
                      value={customerForm.name}
                      onChange={(event) =>
                        setCustomerForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    />
                  </label>
                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Telefone/WhatsApp opcional
                    </span>
                    <input
                      value={customerForm.phone}
                      onChange={(event) =>
                        setCustomerForm((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    />
                  </label>
                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Observacao opcional
                    </span>
                    <textarea
                      rows={3}
                      value={customerForm.notes}
                      onChange={(event) =>
                        setCustomerForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      className="mt-2 w-full resize-none border border-gold/25 bg-black/45 px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                    />
                  </label>
                  {customerMessage ? (
                    <p className="text-sm text-gold-light">{customerMessage}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      className="min-h-10 rounded-full bg-gold px-4 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light"
                    >
                      Salvar cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerForm(initialCustomerForm);
                        setCustomerMessage("");
                      }}
                      className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold"
                    >
                      Limpar formulario
                    </button>
                  </div>
                </div>
              </form>

              <div>
                <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                  <label>
                    <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Buscar cliente
                    </span>
                    <input
                      value={customerQuery}
                      onChange={(event) => setCustomerQuery(event.target.value)}
                      className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                    />
                  </label>
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                      Filtros
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[
                        ["todos", "Todos"],
                        ["com_pendencia", "Com pendencia"],
                        ["sem_pendencia", "Sem pendencia"],
                        ["com_telefone", "Com telefone"],
                        ["sem_telefone", "Sem telefone"],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setCustomerFilter(value as CustomerFilter)
                          }
                          className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                            customerFilter === value
                              ? "border-gold bg-gold text-black"
                              : "border-gold/30 bg-gold/10 text-gold-light hover:border-gold-light"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {filteredCustomerSummaries.length === 0 ? (
                    <div className="border border-white/10 bg-black/25 p-6 text-center">
                      <p className="text-sm text-stone-500">
                        Nenhum cliente encontrado neste filtro.
                      </p>
                    </div>
                  ) : (
                    filteredCustomerSummaries.map((customer) => {
                      const hasPending = customer.totalPending > 0;
                      const isExpanded = expandedCustomer === customer.key;

                      return (
                        <article
                          key={customer.key}
                          className="border border-white/10 bg-black/25 p-5"
                        >
                          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-xl font-semibold text-white">
                                  {customer.name}
                                </h3>
                                <span
                                  className={`border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                                    hasPending
                                      ? "border-gold/35 bg-gold/10 text-gold-light"
                                      : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                  }`}
                                >
                                  {hasPending ? "Deve pagar" : "Sem pendencias"}
                                </span>
                              </div>
                              {customer.phone ? (
                                <p className="mt-2 text-sm text-stone-500">
                                  {customer.phone}
                                </p>
                              ) : null}
                              <div className="mt-4 grid gap-2 text-sm text-stone-300 sm:grid-cols-2 lg:grid-cols-3">
                                <p>
                                  Total comprado:{" "}
                                  {formatCurrency(customer.totalBought)}
                                </p>
                                <p>
                                  Recebido:{" "}
                                  {formatCurrency(customer.totalReceived)}
                                </p>
                                <p>
                                  Pendente:{" "}
                                  {formatCurrency(customer.totalPending)}
                                </p>
                                <p>Compras: {customer.purchaseCount}</p>
                                <p>
                                  Ultima compra:{" "}
                                  {customer.lastPurchase
                                    ? formatDate(customer.lastPurchase)
                                    : "Sem compras"}
                                </p>
                              </div>
                              {customer.notes ? (
                                <p className="mt-3 text-sm leading-6 text-stone-500">
                                  {customer.notes}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedCustomer(
                                    isExpanded ? null : customer.key
                                  )
                                }
                                className="min-h-10 rounded-full border border-white/15 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-300 transition hover:border-gold/50 hover:text-gold-light"
                              >
                                {isExpanded ? "Fechar historico" : "Ver historico"}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  markCustomerPendingAsPaid(customer.name)
                                }
                                className="min-h-10 rounded-full border border-emerald-400/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-400/10"
                              >
                                Marcar pendencias como pagas
                              </button>
                              <button
                                type="button"
                                onClick={() => copyChargeMessage(customer)}
                                className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold"
                              >
                                Copiar mensagem de cobranca
                              </button>
                            </div>
                          </div>

                          {isExpanded ? (
                            <div className="mt-5 grid gap-2 border-t border-white/10 pt-5">
                              {customer.sales.length === 0 ? (
                                <p className="text-sm text-stone-500">
                                  Cliente ainda sem compras registradas.
                                </p>
                              ) : (
                                customer.sales.map((sale) => {
                                  const profit = saleProfit(sale);
                                  const paymentMethod = normalizePaymentMethod(
                                    sale.paymentMethod
                                  );

                                  return (
                                    <div
                                      key={sale.id}
                                      className="border border-white/10 bg-black/25 p-4 text-sm text-stone-300"
                                    >
                                      <p className="font-semibold text-white">
                                        {sale.perfumeName}
                                      </p>
                                      <p className="mt-2 text-stone-500">
                                        {formatDate(sale.createdAt)} &bull;{" "}
                                        {sale.quantity} un. &bull;{" "}
                                        {formatCurrency(profit.revenue)} &bull;{" "}
                                        {statusLabels[sale.status]} &bull;{" "}
                                        {paymentLabels[paymentMethod]}
                                      </p>
                                      {sale.notes ? (
                                        <p className="mt-2 leading-6">
                                          {sale.notes}
                                        </p>
                                      ) : null}
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          ) : null}
                        </article>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 premium-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              Como controlar fiados
            </p>
            <div className="mt-5 grid gap-3 text-sm leading-7 text-stone-400 sm:grid-cols-2">
              <p>Cadastre clientes frequentes.</p>
              <p>Registre toda venda no momento da entrega.</p>
              <p>
                Use status pendente quando a pessoa for pagar depois.
              </p>
              <p>Quando receber, marque as pendencias como pagas.</p>
              <p>Exporte CSV regularmente para backup.</p>
              <p>Este controle e local e fica salvo apenas neste navegador.</p>
            </div>
          </section>

          <section className="mt-8 premium-surface p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                  Controle de estoque
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Perfumes, quantidades e alertas
                </h2>
              </div>
              <button
                type="button"
                onClick={exportStockCsv}
                className="min-h-10 w-fit rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold"
              >
                Exportar estoque CSV
              </button>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                ["todos", "Todos"],
                ["em_estoque", "Em estoque"],
                ["poucas", "Poucas unidades"],
                ["sem_estoque", "Sem estoque"],
                ["traditional", "Tradicional"],
                ["arabic_premium", "Arabe"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStockFilter(value as StockFilter)}
                  className={`min-h-10 rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    stockFilter === value
                      ? "border-gold bg-gold text-black"
                      : "border-gold/30 bg-gold/10 text-gold-light hover:border-gold-light"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredStockRows.map(({ perfume, item, status }) => {
                const slug = perfumeSlug(perfume);
                const statusClass =
                  status === "Em estoque"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : status === "Poucas unidades"
                      ? "border-gold/35 bg-gold/10 text-gold-light"
                      : "border-red-400/30 bg-red-400/10 text-red-300";

                return (
                  <article key={perfume.name} className="border border-white/10 bg-black/25 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-gold/80">
                          {perfume.collection}
                        </p>
                        <h3 className="mt-3 text-xl font-semibold uppercase tracking-[0.08em] text-white">
                          {perfume.name}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusClass}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm text-stone-300 sm:grid-cols-2">
                      <p>Tipo: {lineLabels[perfume.line]}</p>
                      <p>Preco: {formatCurrency(getLinePrice(perfume.line))}</p>
                      <p>Estoque atual: {item.quantity}</p>
                      <p>Estoque minimo: {item.minQuantity}</p>
                    </div>

                    <p className="mt-4 text-xs text-stone-500">
                      Atualizado: {item.updatedAt ? formatDate(item.updatedAt) : "Ainda nao alterado"}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateStockQuantity(slug, 1)}
                        className="min-h-9 rounded-full border border-gold/35 px-3 text-xs font-semibold text-gold-light transition hover:border-gold"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStockQuantity(slug, -1)}
                        className="min-h-9 rounded-full border border-gold/35 px-3 text-xs font-semibold text-gold-light transition hover:border-gold"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => editStockQuantity(slug)}
                        className="min-h-9 rounded-full border border-white/15 px-3 text-xs font-semibold text-stone-300 transition hover:border-gold/50 hover:text-gold-light"
                      >
                        Editar quantidade
                      </button>
                      <button
                        type="button"
                        onClick={() => editMinQuantity(slug)}
                        className="min-h-9 rounded-full border border-white/15 px-3 text-xs font-semibold text-stone-300 transition hover:border-gold/50 hover:text-gold-light"
                      >
                        Editar estoque minimo
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="mt-8 premium-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              Como usar o estoque
            </p>
            <div className="mt-5 grid gap-3 text-sm leading-7 text-stone-400 sm:grid-cols-2">
              <p>Atualize o estoque sempre que produzir novos perfumes.</p>
              <p>
                Ao registrar uma venda, o sistema baixa automaticamente a
                quantidade.
              </p>
              <p>Se vender sob encomenda, o estoque pode ficar zerado.</p>
              <p>Exporte CSV regularmente para backup.</p>
            </div>
          </section>

          <section className="mt-8 premium-surface p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                  Backup e seguranca dos dados
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                  Exporte e restaure os dados locais
                </h2>
              </div>
              <button
                type="button"
                onClick={exportFullBackup}
                className="min-h-10 w-fit rounded-full bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light"
              >
                Baixar backup completo
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <article className="border border-white/10 bg-black/25 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-stone-500">
                  Ultimo backup
                </p>
                <p className="mt-3 text-lg font-semibold text-gold-light">
                  {backupInfo?.lastBackupAt
                    ? formatDate(backupInfo.lastBackupAt)
                    : "Nenhum backup registrado neste navegador."}
                </p>
              </article>

              <article className="border border-white/10 bg-black/25 p-5 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Importante
                </p>
                <div className="mt-4 grid gap-2 text-sm leading-7 text-stone-400 sm:grid-cols-2">
                  <p>
                    Os dados deste painel ficam salvos apenas neste navegador.
                  </p>
                  <p>
                    Se limpar dados do navegador, trocar de computador ou
                    formatar a maquina, voce pode perder as informacoes.
                  </p>
                  <p>Baixe um backup completo regularmente.</p>
                  <p>
                    Guarde o arquivo em local seguro, como Google Drive,
                    pendrive ou pasta de documentos.
                  </p>
                </div>
              </article>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="border border-white/10 bg-black/25 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Exportacoes parciais
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => exportPartialBackup("sales")}
                    className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold"
                  >
                    Exportar apenas vendas
                  </button>
                  <button
                    type="button"
                    onClick={() => exportPartialBackup("stock")}
                    className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold"
                  >
                    Exportar apenas estoque
                  </button>
                  <button
                    type="button"
                    onClick={() => exportPartialBackup("customers")}
                    className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold"
                  >
                    Exportar apenas clientes
                  </button>
                </div>

                <label className="mt-6 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                    Restaurar backup
                  </span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        restoreBackupFile(file);
                        event.target.value = "";
                      }
                    }}
                    className="mt-3 block w-full text-sm text-stone-400 file:mr-4 file:min-h-10 file:rounded-full file:border-0 file:bg-gold file:px-4 file:text-xs file:font-semibold file:uppercase file:tracking-[0.14em] file:text-black"
                  />
                </label>

                {backupMessage ? (
                  <p className="mt-4 text-sm leading-6 text-gold-light">
                    {backupMessage}
                  </p>
                ) : null}
              </div>

              <div className="border border-white/10 bg-black/25 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Quando fazer backup?
                </p>
                <div className="mt-4 grid gap-2 text-sm leading-7 text-stone-400 sm:grid-cols-2">
                  <p>Ao final de cada semana.</p>
                  <p>Depois de registrar muitas vendas.</p>
                  <p>Antes de trocar de computador.</p>
                  <p>Antes de limpar navegador.</p>
                  <p className="sm:col-span-2">
                    Antes de grandes alteracoes no sistema.
                  </p>
                </div>
              </div>
            </div>
          </section>

            </>
          ) : null}

          {activeTab === "perfumes" ? (
            <section className="premium-surface p-6">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                    Perfumes
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">
                    Cadastro dinamico de perfumes
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-stone-400">
                    Futuro: carregar perfumes ativos do Supabase para catalogo publico.
                  </p>
                </div>
                {isSupabaseMode ? (
                  <button
                    type="button"
                    onClick={loadSupabasePerfumes}
                    disabled={isPerfumeLoading}
                    className="min-h-10 w-fit rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPerfumeLoading ? "Atualizando..." : "Atualizar perfumes"}
                  </button>
                ) : null}
              </div>

              {!isSupabaseMode ? (
                <div className="mt-6 border border-gold/25 bg-gold/10 p-5 text-sm leading-7 text-gold-light">
                  O cadastro dinamico de perfumes estara disponivel quando o Supabase estiver configurado e voce estiver logado.
                </div>
              ) : (
                <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                  <form
                    onSubmit={handlePerfumeSubmit}
                    className="border border-white/10 bg-black/25 p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                      {editingPerfumeId ? "Editar perfume" : "Novo perfume"}
                    </p>
                    <div className="mt-5 grid gap-4">
                      {[
                        ["Nome autoral", "name"],
                        ["Inspiracao olfativa", "inspiration"],
                        ["Colecao", "collection"],
                        ["Familia olfativa", "olfactiveFamily"],
                        ["Notas de topo", "topNotes"],
                        ["Notas de coracao", "heartNotes"],
                        ["Notas de fundo", "baseNotes"],
                        ["Descricao curta", "shortDescription"],
                        ["Tags separadas por virgula", "tags"],
                        ["URL da imagem", "imageUrl"],
                      ].map(([label, key]) => (
                        <label key={key}>
                          <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                            {label}
                          </span>
                          <input
                            required={key === "name" || key === "collection"}
                            value={String(perfumeForm[key as keyof PerfumeForm])}
                            onChange={(event) =>
                              setPerfumeForm((current) => ({
                                ...current,
                                [key]: event.target.value,
                              }))
                            }
                            className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                          />
                        </label>
                      ))}

                      <div className="grid gap-4 sm:grid-cols-3">
                        <label>
                          <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                            Categoria
                          </span>
                          <select
                            value={perfumeForm.category}
                            onChange={(event) =>
                              setPerfumeForm((current) => ({
                                ...current,
                                category: event.target.value as PerfumeCategory,
                              }))
                            }
                            className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                          >
                            <option value="masculino">Masculino</option>
                            <option value="feminino">Feminino</option>
                            <option value="unissex">Unissex</option>
                          </select>
                        </label>
                        <label>
                          <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                            Tipo da linha
                          </span>
                          <select
                            value={perfumeForm.bottleType}
                            onChange={(event) =>
                              setPerfumeForm((current) => ({
                                ...current,
                                bottleType: event.target.value as BottleType,
                              }))
                            }
                            className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                          >
                            <option value="tradicional">Tradicional</option>
                            <option value="arabe">Arabe</option>
                          </select>
                        </label>
                        <label>
                          <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                            Disponibilidade
                          </span>
                          <select
                            value={perfumeForm.availabilityStatus}
                            onChange={(event) =>
                              setPerfumeForm((current) => ({
                                ...current,
                                availabilityStatus: event.target.value as AvailabilityStatus,
                              }))
                            }
                            className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                          >
                            <option value="available">Disponivel</option>
                            <option value="limited">Poucas unidades</option>
                            <option value="on_order">Sob encomenda</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        {[
                          ["Preco", "price"],
                          ["Custo", "costPrice"],
                          ["Estoque", "stockQuantity"],
                        ].map(([label, key]) => (
                          <label key={key}>
                            <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                              {label}
                            </span>
                            <input
                              min={0}
                              step={key === "stockQuantity" ? 1 : 0.01}
                              type="number"
                              value={String(perfumeForm[key as keyof PerfumeForm])}
                              onChange={(event) =>
                                setPerfumeForm((current) => ({
                                  ...current,
                                  [key]: event.target.value,
                                }))
                              }
                              className="mt-2 min-h-11 w-full border border-gold/25 bg-black/45 px-4 text-sm text-white outline-none transition focus:border-gold"
                            />
                          </label>
                        ))}
                      </div>

                      <label>
                        <span className="text-xs uppercase tracking-[0.22em] text-stone-500">
                          Descricao longa
                        </span>
                        <textarea
                          rows={4}
                          value={perfumeForm.longDescription}
                          onChange={(event) =>
                            setPerfumeForm((current) => ({
                              ...current,
                              longDescription: event.target.value,
                            }))
                          }
                          className="mt-2 w-full resize-none border border-gold/25 bg-black/45 px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                        />
                      </label>

                      <label className="flex items-center gap-3 text-sm text-stone-300">
                        <input
                          type="checkbox"
                          checked={perfumeForm.isActive}
                          onChange={(event) =>
                            setPerfumeForm((current) => ({
                              ...current,
                              isActive: event.target.checked,
                            }))
                          }
                        />
                        Ativo no cadastro
                      </label>

                      {perfumeMessage ? (
                        <p className="text-sm leading-6 text-gold-light">
                          {perfumeMessage}
                        </p>
                      ) : null}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={isPerfumeLoading}
                          className="min-h-10 rounded-full bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {editingPerfumeId ? "Salvar edicao" : "Cadastrar perfume"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPerfumeForm(initialPerfumeForm);
                            setEditingPerfumeId(null);
                            setPerfumeMessage("");
                          }}
                          className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold"
                        >
                          Limpar
                        </button>
                      </div>
                    </div>
                  </form>

                  <div className="grid gap-3">
                    {supabasePerfumes.length === 0 ? (
                      <div className="border border-white/10 bg-black/25 p-6 text-center">
                        <p className="text-sm text-stone-500">
                          Nenhum perfume dinamico cadastrado ainda.
                        </p>
                      </div>
                    ) : (
                      supabasePerfumes.map((perfume) => (
                        <article
                          key={perfume.id}
                          className="border border-white/10 bg-black/25 p-5"
                        >
                          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                            <div>
                              <p className="text-xs uppercase tracking-[0.22em] text-gold/80">
                                {perfume.collection}
                              </p>
                              <h3 className="mt-2 text-xl font-semibold text-white">
                                {perfume.name}
                              </h3>
                              <p className="mt-2 text-sm text-stone-400">
                                {perfume.inspiration || "Sem inspiracao"} &bull; {formatCurrency(Number(perfume.price) || 0)} &bull; Estoque {perfume.stock_quantity}
                              </p>
                              <p className="mt-2 text-sm text-stone-500">
                                {perfume.availability_status} &bull; {perfume.is_active ? "Ativo" : "Inativo"}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => editPerfume(perfume)}
                                className="min-h-10 rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePerfume(perfume.id)}
                                className="min-h-10 rounded-full border border-red-400/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-red-300 transition hover:bg-red-400/10"
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "alerts" ? (
            <section className="premium-surface p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                Alertas
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white">
                Fiados e vendas pendentes
              </h2>
              <div className="mt-6 grid gap-6">
                {[
                  ["Vencidas", alertGroups.overdue],
                  ["Vencem hoje", alertGroups.today],
                  ["Proximos 7 dias", alertGroups.nextSevenDays],
                  ["Sem vencimento", alertGroups.noDueDate],
                ].map(([title, group]) => (
                  <div key={title as string}>
                    <h3 className="text-lg font-semibold text-gold-light">
                      {title as string}
                    </h3>
                    <div className="mt-3 grid gap-3">
                      {(group as Sale[]).length === 0 ? (
                        <div className="border border-white/10 bg-black/25 p-5 text-sm text-stone-500">
                          Nenhuma pendencia nesta categoria.
                        </div>
                      ) : (
                        (group as Sale[]).map((sale) => {
                          const total = saleProfit(sale).revenue;
                          const message = sale.customerPhone
                            ? `Ola, tudo bem? Passando para lembrar sobre o perfume ${sale.perfumeName} da Amaro dos Reis Parfum, no valor de ${formatCurrency(total)}, com vencimento em ${formatDateOnly(sale.dueDate)}.`
                            : `Lembrete: cliente ${sale.customerName} tem pagamento pendente do perfume ${sale.perfumeName}, valor ${formatCurrency(total)}, vencimento ${formatDateOnly(sale.dueDate)}.`;
                          const href = sale.customerPhone
                            ? createCustomerWhatsAppLink(sale.customerPhone, message)
                            : createWhatsAppLink(message);

                          return (
                            <article
                              key={sale.id}
                              className="border border-white/10 bg-black/25 p-5"
                            >
                              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                                <div>
                                  <h4 className="text-xl font-semibold text-white">
                                    {sale.customerName}
                                  </h4>
                                  <p className="mt-2 text-sm text-stone-300">
                                    {sale.perfumeName} &bull; {formatCurrency(total)}
                                  </p>
                                  <p className="mt-2 text-sm text-stone-500">
                                    {sale.customerPhone || "Sem telefone"} &bull; {formatDateOnly(sale.dueDate)} &bull; {describeDueDate(sale.dueDate)}
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => markAsPaid(sale.id)}
                                    className="min-h-10 rounded-full border border-emerald-400/30 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300 transition hover:bg-emerald-400/10"
                                  >
                                    Marcar como pago
                                  </button>
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex min-h-10 items-center rounded-full border border-gold/35 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold"
                                  >
                                    Abrir WhatsApp
                                  </a>
                                </div>
                              </div>
                            </article>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-8 premium-surface p-6">
            <p className="text-sm leading-7 text-stone-400">
              Este painel e uma versao inicial para controle pessoal. Nao use
              como sistema fiscal. Faca backup das informacoes exportando CSV
              regularmente.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
