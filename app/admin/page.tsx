"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
import {
  BACKUP_INFO_STORAGE_KEY,
  CUSTOMERS_STORAGE_KEY,
  SALES_STORAGE_KEY,
  STOCK_STORAGE_KEY,
} from "@/lib/storage-keys";

type StoredPaymentMethod = "dinheiro" | "pix" | "cartao" | "cartão" | "fiado";
type PaymentMethod = "dinheiro" | "pix" | "cartão" | "fiado";
type SaleStatus = "pago" | "pendente";
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
};

const initialCustomerForm: CustomerForm = {
  name: "",
  phone: "",
  notes: "",
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
  const unitPrice = getLinePrice(form.lineType);

  useEffect(() => {
    const storedSales = window.localStorage.getItem(SALES_STORAGE_KEY);

    if (!storedSales) {
      setIsStorageLoaded(true);
      return;
    }

    try {
      const parsedSales = JSON.parse(storedSales) as Sale[];
      setSales(Array.isArray(parsedSales) ? parsedSales : []);
    } catch {
      setSales([]);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isStorageLoaded) {
      window.localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    }
  }, [isStorageLoaded, sales]);

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const perfume = perfumeCommerce.find(
      (item) => perfumeSlug(item) === form.perfumeSlug
    );

    if (!perfume || !form.customerName.trim()) {
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

  function markAsPaid(id: string) {
    setSales((current) =>
      current.map((sale) =>
        sale.id === id
          ? { ...sale, status: "pago", paidAt: new Date().toISOString() }
          : sale
      )
    );
  }

  function markCustomerPendingAsPaid(customerName: string) {
    const confirmed = window.confirm(
      "Marcar todas as pendencias deste cliente como pagas?"
    );

    if (!confirmed) {
      return;
    }

    const key = normalizeName(customerName);

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

  function deleteSale(id: string) {
    const sale = sales.find((item) => item.id === id);

    if (!sale) {
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
            Controle local
          </p>
          <h1 className="mt-5 text-4xl font-semibold uppercase leading-tight text-white sm:text-5xl">
            Painel interno &mdash; Amaro dos Reis Parfum
          </h1>
          <p className="mt-5 max-w-3xl leading-8 text-stone-300">
            Versao local: os dados ficam salvos apenas neste navegador.
            Futuramente sera integrado ao Supabase.
          </p>
        </div>
      </section>

      <section className="px-6 py-10 sm:px-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
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
