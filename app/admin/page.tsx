"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  perfumeCommerce,
  perfumeSlug,
  type PerfumeCommerce,
} from "@/lib/perfumes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SALES_STORAGE_KEY } from "@/lib/storage-keys";

const INVENTORY_STORAGE_KEY = "amaro_inventory_v1";
const BACKUP_VERSION = "amaro_backup_v1";
const LAST_SYNC_STORAGE_KEY = "amaro_last_sync_at";
const SYNC_TOKEN_STORAGE_KEY = "amaro_admin_sync_token";

type LineType = "tradicional" | "arabe";
type PaymentMethod = "dinheiro" | "pix" | "cartao" | "fiado";
type SaleStatus = "pago" | "pendente";
type SaleFilter = "todos" | "pagos" | "pendentes";

type Sale = {
  id: string;
  customerName: string;
  perfumeSlug: string;
  perfumeName: string;
  lineType: LineType;
  unitPrice: number;
  unitCost?: number;
  estimatedProfit?: number;
  quantity: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string;
  createdAt: string;
  paidAt?: string;
};

type SaleForm = {
  customerName: string;
  perfumeSlug: string;
  lineType: LineType;
  quantity: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string;
};

type InventoryItem = {
  perfumeSlug: string;
  perfumeName: string;
  lineType: LineType;
  stockQuantity: number;
  unitCost: number;
  salePrice: number;
  minimumStock: number;
  updatedAt: string;
};

type InventoryForm = {
  perfumeSlug: string;
  lineType: LineType;
  stockQuantity: number;
  unitCost: number;
  salePrice: number;
  minimumStock: number;
};

type BackupImport = {
  backupDate?: string;
  sales: Sale[];
  inventory: InventoryItem[];
};

type SyncStatus = {
  configured: boolean;
  salesCount?: number;
  inventoryCount?: number;
  message?: string;
};

type PulledSyncData = {
  sales: Sale[];
  inventory: InventoryItem[];
};

type SyncAction = "" | "status" | "push" | "pull" | "restore";

const lineOptions: { value: LineType; label: string; price: number }[] = [
  { value: "tradicional", label: "Tradicional", price: 80 },
  { value: "arabe", label: "Árabe Premium", price: 120 },
];

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "fiado", label: "Fiado / receber depois" },
];

const statusOptions: { value: SaleStatus; label: string }[] = [
  { value: "pago", label: "Pago" },
  { value: "pendente", label: "Pendente" },
];

const saleFilters: { value: SaleFilter; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "pagos", label: "Pagos" },
  { value: "pendentes", label: "Pendentes" },
];

const defaultPerfume = perfumeCommerce[0];

const initialSaleForm: SaleForm = {
  customerName: "",
  perfumeSlug: perfumeSlug(defaultPerfume),
  lineType: getSuggestedLineType(defaultPerfume),
  quantity: 1,
  paymentMethod: "pix",
  status: "pago",
  notes: "",
};

const initialInventoryForm: InventoryForm = {
  perfumeSlug: perfumeSlug(defaultPerfume),
  lineType: getSuggestedLineType(defaultPerfume),
  stockQuantity: 0,
  unitCost: getDefaultUnitCost(getSuggestedLineType(defaultPerfume)),
  salePrice: getLinePrice(getSuggestedLineType(defaultPerfume)),
  minimumStock: 2,
};

function getSuggestedLineType(perfume: PerfumeCommerce): LineType {
  return perfume.line === "arabic_premium" ? "arabe" : "tradicional";
}

function getLinePrice(lineType: LineType) {
  return lineType === "arabe" ? 120 : 80;
}

function getDefaultUnitCost(lineType: LineType) {
  return lineType === "arabe" ? 41.4 : 24.75;
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clampNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.max(0, numberValue);
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
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function escapeCsv(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeLineType(value: unknown): LineType {
  if (value === "arabe" || value === "arabic_premium") {
    return "arabe";
  }

  return "tradicional";
}

function normalizePaymentMethod(value: unknown): PaymentMethod {
  if (value === "dinheiro" || value === "pix" || value === "fiado") {
    return value;
  }

  return "cartao";
}

function normalizeStatus(value: unknown): SaleStatus {
  return value === "pendente" ? "pendente" : "pago";
}

function lineLabel(lineType: LineType) {
  return lineType === "arabe" ? "Árabe Premium" : "Tradicional";
}

function getInventoryStatus(item: InventoryItem) {
  if (item.stockQuantity <= 0) {
    return "Sem estoque";
  }

  if (item.stockQuantity <= item.minimumStock) {
    return "Baixo estoque";
  }

  return "Em estoque";
}

function inventoryStatusClass(status: string) {
  if (status === "Em estoque") {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "Baixo estoque") {
    return "border-gold/35 bg-gold/10 text-gold-light";
  }

  return "border-red-400/30 bg-red-400/10 text-red-300";
}

function getItemMargin(item: InventoryItem) {
  if (item.salePrice <= 0) {
    return 0;
  }

  return ((item.salePrice - item.unitCost) / item.salePrice) * 100;
}

function getSaleUnitCost(sale: Sale) {
  return sale.unitCost ?? getDefaultUnitCost(sale.lineType);
}

function getSaleEstimatedProfit(sale: Sale) {
  return (
    sale.estimatedProfit ??
    (sale.unitPrice - getSaleUnitCost(sale)) * sale.quantity
  );
}

function normalizeSale(value: unknown): Sale | null {
  if (!isRecord(value)) {
    return null;
  }

  const lineType = normalizeLineType(value.lineType);
  const fallbackPerfume = perfumeCommerce.find(
    (perfume) => perfumeSlug(perfume) === value.perfumeSlug
  );
  const quantity = Math.max(1, Number(value.quantity) || 1);
  const unitPrice = Number(value.unitPrice) || getLinePrice(lineType);
  const unitCost =
    value.unitCost === undefined
      ? getDefaultUnitCost(lineType)
      : clampNumber(value.unitCost, getDefaultUnitCost(lineType));
  const estimatedProfit =
    value.estimatedProfit === undefined
      ? (unitPrice - unitCost) * quantity
      : Number(value.estimatedProfit) || 0;
  const createdAt =
    typeof value.createdAt === "string"
      ? value.createdAt
      : new Date().toISOString();
  const paidAt = typeof value.paidAt === "string" ? value.paidAt : undefined;

  return {
    id: typeof value.id === "string" ? value.id : createId(),
    customerName:
      typeof value.customerName === "string" && value.customerName.trim()
        ? value.customerName.trim()
        : "Cliente sem nome",
    perfumeSlug:
      typeof value.perfumeSlug === "string" && value.perfumeSlug
        ? value.perfumeSlug
        : perfumeSlug(fallbackPerfume ?? defaultPerfume),
    perfumeName:
      typeof value.perfumeName === "string" && value.perfumeName.trim()
        ? value.perfumeName.trim()
        : fallbackPerfume?.name ?? defaultPerfume.name,
    lineType,
    unitPrice,
    unitCost,
    estimatedProfit,
    quantity,
    paymentMethod: normalizePaymentMethod(value.paymentMethod),
    status: normalizeStatus(value.status),
    notes: typeof value.notes === "string" ? value.notes : "",
    createdAt,
    paidAt,
  };
}

function normalizeInventoryItem(value: unknown): InventoryItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const fallbackPerfume = perfumeCommerce.find(
    (perfume) => perfumeSlug(perfume) === value.perfumeSlug
  );
  const lineType = normalizeLineType(
    value.lineType ?? (fallbackPerfume ? getSuggestedLineType(fallbackPerfume) : "")
  );
  const perfumeName =
    typeof value.perfumeName === "string" && value.perfumeName.trim()
      ? value.perfumeName.trim()
      : fallbackPerfume?.name ?? defaultPerfume.name;
  const itemSlug =
    typeof value.perfumeSlug === "string" && value.perfumeSlug
      ? value.perfumeSlug
      : perfumeSlug(fallbackPerfume ?? defaultPerfume);

  return {
    perfumeSlug: itemSlug,
    perfumeName,
    lineType,
    stockQuantity: Math.floor(clampNumber(value.stockQuantity, 0)),
    unitCost: clampNumber(value.unitCost, getDefaultUnitCost(lineType)),
    salePrice: clampNumber(value.salePrice, getLinePrice(lineType)),
    minimumStock: Math.floor(clampNumber(value.minimumStock, 2)),
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : new Date().toISOString(),
  };
}

function readSalesFromStorage() {
  const storedSales = window.localStorage.getItem(SALES_STORAGE_KEY);

  if (!storedSales) {
    return [];
  }

  try {
    const parsedSales = JSON.parse(storedSales) as unknown;

    if (!Array.isArray(parsedSales)) {
      return [];
    }

    return parsedSales
      .map((sale) => normalizeSale(sale))
      .filter((sale): sale is Sale => sale !== null);
  } catch {
    return [];
  }
}

function readInventoryFromStorage() {
  const storedInventory = window.localStorage.getItem(INVENTORY_STORAGE_KEY);

  if (!storedInventory) {
    return [];
  }

  try {
    const parsedInventory = JSON.parse(storedInventory) as unknown;

    if (!Array.isArray(parsedInventory)) {
      return [];
    }

    return parsedInventory
      .map((item) => normalizeInventoryItem(item))
      .filter((item): item is InventoryItem => item !== null);
  } catch {
    return [];
  }
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) => row.map((item) => escapeCsv(item)).join(","))
    .join("\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function normalizeBackup(value: unknown): BackupImport | null {
  if (!isRecord(value)) {
    return null;
  }

  const version = value.backupVersion ?? value.version;

  if (version !== BACKUP_VERSION) {
    return null;
  }

  if (!Array.isArray(value.sales) || !Array.isArray(value.inventory)) {
    return null;
  }

  const sales = value.sales
    .map((sale) => normalizeSale(sale))
    .filter((sale): sale is Sale => sale !== null);
  const inventory = value.inventory
    .map((item) => normalizeInventoryItem(item))
    .filter((item): item is InventoryItem => item !== null);
  const backupDate =
    typeof value.backupDate === "string"
      ? value.backupDate
      : typeof value.createdAt === "string"
        ? value.createdAt
        : undefined;

  return {
    backupDate,
    sales,
    inventory,
  };
}

async function copyTextToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");

  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export default function AdminPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [saleForm, setSaleForm] = useState<SaleForm>(initialSaleForm);
  const [inventoryForm, setInventoryForm] =
    useState<InventoryForm>(initialInventoryForm);
  const [filter, setFilter] = useState<SaleFilter>("todos");
  const [saleNotice, setSaleNotice] = useState("");
  const [backupImport, setBackupImport] = useState<BackupImport | null>(null);
  const [backupFileName, setBackupFileName] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");
  const [summaryCopyMessage, setSummaryCopyMessage] = useState("");
  const [syncToken, setSyncToken] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [pulledSyncData, setPulledSyncData] =
    useState<PulledSyncData | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState("");
  const [syncAction, setSyncAction] = useState<SyncAction>("");
  const [isSyncTokenLoaded, setIsSyncTokenLoaded] = useState(false);
  const [isSalesLoaded, setIsSalesLoaded] = useState(false);
  const [isInventoryLoaded, setIsInventoryLoaded] = useState(false);
  const supabaseConfigured = isSupabaseConfigured();

  const selectedSalePerfume = useMemo(
    () =>
      perfumeCommerce.find(
        (perfume) => perfumeSlug(perfume) === saleForm.perfumeSlug
      ) ?? defaultPerfume,
    [saleForm.perfumeSlug]
  );
  const selectedInventoryPerfume = useMemo(
    () =>
      perfumeCommerce.find(
        (perfume) => perfumeSlug(perfume) === inventoryForm.perfumeSlug
      ) ?? defaultPerfume,
    [inventoryForm.perfumeSlug]
  );
  const currentInventoryItem = useMemo(
    () => inventory.find((item) => item.perfumeSlug === saleForm.perfumeSlug),
    [inventory, saleForm.perfumeSlug]
  );
  const saleUnitPrice =
    currentInventoryItem?.lineType === saleForm.lineType
      ? currentInventoryItem.salePrice
      : getLinePrice(saleForm.lineType);
  const saleUnitCost =
    currentInventoryItem?.lineType === saleForm.lineType
      ? currentInventoryItem.unitCost
      : getDefaultUnitCost(saleForm.lineType);
  const inventoryUnitProfit = inventoryForm.salePrice - inventoryForm.unitCost;
  const inventoryMargin =
    inventoryForm.salePrice > 0
      ? (inventoryUnitProfit / inventoryForm.salePrice) * 100
      : 0;

  const summary = useMemo(() => {
    const salesSummary = sales.reduce(
      (totals, sale) => {
        const saleTotal = sale.unitPrice * sale.quantity;
        const saleCost = getSaleUnitCost(sale) * sale.quantity;

        totals.totalSold += saleTotal;
        totals.perfumeCount += sale.quantity;
        totals.estimatedCost += saleCost;
        totals.estimatedProfit += getSaleEstimatedProfit(sale);

        if (sale.status === "pago") {
          totals.totalReceived += saleTotal;
        } else {
          totals.totalPending += saleTotal;
        }

        return totals;
      },
      {
        totalSold: 0,
        totalReceived: 0,
        totalPending: 0,
        estimatedCost: 0,
        estimatedProfit: 0,
        saleCount: sales.length,
        perfumeCount: 0,
      }
    );
    const inventoryValue = inventory.reduce(
      (total, item) => total + item.stockQuantity * item.unitCost,
      0
    );
    const lowStockCount = inventory.filter(
      (item) => item.stockQuantity <= item.minimumStock
    ).length;

    return {
      ...salesSummary,
      inventoryValue,
      lowStockCount,
    };
  }, [inventory, sales]);

  const filteredSales = useMemo(() => {
    if (filter === "pagos") {
      return sales.filter((sale) => sale.status === "pago");
    }

    if (filter === "pendentes") {
      return sales.filter((sale) => sale.status === "pendente");
    }

    return sales;
  }, [filter, sales]);

  const sortedInventory = useMemo(
    () =>
      [...inventory].sort((first, second) =>
        first.perfumeName.localeCompare(second.perfumeName, "pt-BR")
      ),
    [inventory]
  );

  const lowStockItems = useMemo(
    () =>
      sortedInventory.filter((item) => item.stockQuantity <= item.minimumStock),
    [sortedInventory]
  );

  useEffect(() => {
    setSales(readSalesFromStorage());
    setIsSalesLoaded(true);
  }, []);

  useEffect(() => {
    setInventory(readInventoryFromStorage());
    setIsInventoryLoaded(true);
  }, []);

  useEffect(() => {
    setSyncToken(window.sessionStorage.getItem(SYNC_TOKEN_STORAGE_KEY) ?? "");
    setLastSyncAt(window.localStorage.getItem(LAST_SYNC_STORAGE_KEY) ?? "");
    setIsSyncTokenLoaded(true);
  }, []);

  useEffect(() => {
    if (!isSyncTokenLoaded) {
      return;
    }

    if (syncToken.trim()) {
      window.sessionStorage.setItem(SYNC_TOKEN_STORAGE_KEY, syncToken);
      return;
    }

    window.sessionStorage.removeItem(SYNC_TOKEN_STORAGE_KEY);
  }, [isSyncTokenLoaded, syncToken]);

  useEffect(() => {
    if (!isSalesLoaded) {
      return;
    }

    if (sales.length === 0) {
      window.localStorage.removeItem(SALES_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
  }, [isSalesLoaded, sales]);

  useEffect(() => {
    if (!isInventoryLoaded) {
      return;
    }

    if (inventory.length === 0) {
      window.localStorage.removeItem(INVENTORY_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
  }, [inventory, isInventoryLoaded]);

  function resetSaleForm() {
    setSaleForm(initialSaleForm);
  }

  function resetInventoryForm() {
    setInventoryForm(initialInventoryForm);
  }

  function handleSalePerfumeChange(perfumeValue: string) {
    const perfume =
      perfumeCommerce.find((item) => perfumeSlug(item) === perfumeValue) ??
      defaultPerfume;

    setSaleForm((current) => ({
      ...current,
      perfumeSlug: perfumeSlug(perfume),
      lineType: getSuggestedLineType(perfume),
    }));
  }

  function handleInventoryPerfumeChange(perfumeValue: string) {
    const perfume =
      perfumeCommerce.find((item) => perfumeSlug(item) === perfumeValue) ??
      defaultPerfume;
    const lineType = getSuggestedLineType(perfume);
    const storedItem = inventory.find(
      (item) => item.perfumeSlug === perfumeSlug(perfume)
    );

    if (storedItem) {
      setInventoryForm({
        perfumeSlug: storedItem.perfumeSlug,
        lineType: storedItem.lineType,
        stockQuantity: storedItem.stockQuantity,
        unitCost: storedItem.unitCost,
        salePrice: storedItem.salePrice,
        minimumStock: storedItem.minimumStock,
      });
      return;
    }

    setInventoryForm({
      perfumeSlug: perfumeSlug(perfume),
      lineType,
      stockQuantity: 0,
      unitCost: getDefaultUnitCost(lineType),
      salePrice: getLinePrice(lineType),
      minimumStock: 2,
    });
  }

  function handleInventoryLineChange(lineType: LineType) {
    setInventoryForm((current) => ({
      ...current,
      lineType,
      unitCost: getDefaultUnitCost(lineType),
      salePrice: getLinePrice(lineType),
    }));
  }

  function handlePaymentMethodChange(paymentMethod: PaymentMethod) {
    setSaleForm((current) => ({
      ...current,
      paymentMethod,
      status: paymentMethod === "fiado" ? "pendente" : current.status,
    }));
  }

  function registerSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const customerName = saleForm.customerName.trim();

    if (!customerName) {
      return;
    }

    const quantity = Math.max(1, Math.floor(Number(saleForm.quantity) || 1));
    const now = new Date().toISOString();
    const inventoryItem = inventory.find(
      (item) => item.perfumeSlug === perfumeSlug(selectedSalePerfume)
    );
    const unitCost =
      inventoryItem?.lineType === saleForm.lineType
        ? inventoryItem.unitCost
        : getDefaultUnitCost(saleForm.lineType);
    const unitPrice =
      inventoryItem?.lineType === saleForm.lineType
        ? inventoryItem.salePrice
        : getLinePrice(saleForm.lineType);
    const estimatedProfit = (unitPrice - unitCost) * quantity;
    const sale: Sale = {
      id: createId(),
      customerName,
      perfumeSlug: perfumeSlug(selectedSalePerfume),
      perfumeName: selectedSalePerfume.name,
      lineType: saleForm.lineType,
      unitPrice,
      unitCost,
      estimatedProfit,
      quantity,
      paymentMethod: saleForm.paymentMethod,
      status: saleForm.status,
      notes: saleForm.notes.trim(),
      createdAt: now,
      paidAt: saleForm.status === "pago" ? now : undefined,
    };

    setSales((currentSales) => [sale, ...currentSales]);

    if (inventoryItem) {
      setInventory((currentInventory) =>
        currentInventory.map((item) =>
          item.perfumeSlug === inventoryItem.perfumeSlug
            ? {
                ...item,
                stockQuantity: Math.max(0, item.stockQuantity - quantity),
                updatedAt: now,
              }
            : item
        )
      );
      setSaleNotice("");
    } else {
      setSaleNotice("Este perfume ainda não possui estoque cadastrado.");
    }

    resetSaleForm();
  }

  function saveInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const now = new Date().toISOString();
    const item: InventoryItem = {
      perfumeSlug: perfumeSlug(selectedInventoryPerfume),
      perfumeName: selectedInventoryPerfume.name,
      lineType: inventoryForm.lineType,
      stockQuantity: Math.max(
        0,
        Math.floor(Number(inventoryForm.stockQuantity) || 0)
      ),
      unitCost: clampNumber(inventoryForm.unitCost, getDefaultUnitCost(inventoryForm.lineType)),
      salePrice: clampNumber(inventoryForm.salePrice, getLinePrice(inventoryForm.lineType)),
      minimumStock: Math.max(
        0,
        Math.floor(Number(inventoryForm.minimumStock) || 0)
      ),
      updatedAt: now,
    };

    setInventory((currentInventory) => {
      const exists = currentInventory.some(
        (storedItem) => storedItem.perfumeSlug === item.perfumeSlug
      );

      if (!exists) {
        return [item, ...currentInventory];
      }

      return currentInventory.map((storedItem) =>
        storedItem.perfumeSlug === item.perfumeSlug ? item : storedItem
      );
    });
  }

  function editInventoryItem(item: InventoryItem) {
    setInventoryForm({
      perfumeSlug: item.perfumeSlug,
      lineType: item.lineType,
      stockQuantity: item.stockQuantity,
      unitCost: item.unitCost,
      salePrice: item.salePrice,
      minimumStock: item.minimumStock,
    });
  }

  function deleteInventoryItem(perfumeValue: string) {
    const confirmed = window.confirm("Excluir este item de estoque?");

    if (!confirmed) {
      return;
    }

    setInventory((currentInventory) =>
      currentInventory.filter((item) => item.perfumeSlug !== perfumeValue)
    );
  }

  function markAsPaid(saleId: string) {
    const now = new Date().toISOString();

    setSales((currentSales) =>
      currentSales.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              status: "pago",
              paidAt: sale.paidAt ?? now,
            }
          : sale
      )
    );
  }

  function deleteSale(saleId: string) {
    const confirmed = window.confirm("Excluir esta venda?");

    if (!confirmed) {
      return;
    }

    setSales((currentSales) => currentSales.filter((sale) => sale.id !== saleId));
  }

  function exportSalesCsv() {
    const today = new Date().toISOString().slice(0, 10);
    const rows = [
      [
        "ID",
        "Cliente",
        "Perfume",
        "Linha",
        "Preço unitário",
        "Custo unitário",
        "Quantidade",
        "Valor total",
        "Lucro estimado",
        "Forma de pagamento",
        "Status",
        "Data",
        "Pago em",
        "Observação",
      ],
      ...sales.map((sale) => [
        sale.id,
        sale.customerName,
        sale.perfumeName,
        lineLabel(sale.lineType),
        sale.unitPrice.toFixed(2),
        getSaleUnitCost(sale).toFixed(2),
        sale.quantity,
        (sale.unitPrice * sale.quantity).toFixed(2),
        getSaleEstimatedProfit(sale).toFixed(2),
        paymentOptions.find((option) => option.value === sale.paymentMethod)
          ?.label ?? sale.paymentMethod,
        statusOptions.find((option) => option.value === sale.status)?.label ??
          sale.status,
        sale.createdAt,
        sale.paidAt ?? "",
        sale.notes,
      ]),
    ];

    downloadCsv(`amaro-vendas-${today}.csv`, rows);
  }

  function exportInventoryCsv() {
    const today = new Date().toISOString().slice(0, 10);
    const rows = [
      [
        "Perfume",
        "Linha",
        "Estoque atual",
        "Custo unitário",
        "Preço de venda",
        "Lucro estimado por unidade",
        "Margem aproximada",
        "Estoque mínimo",
        "Status",
        "Atualizado em",
      ],
      ...sortedInventory.map((item) => [
        item.perfumeName,
        lineLabel(item.lineType),
        item.stockQuantity,
        item.unitCost.toFixed(2),
        item.salePrice.toFixed(2),
        (item.salePrice - item.unitCost).toFixed(2),
        formatPercent(getItemMargin(item)),
        item.minimumStock,
        getInventoryStatus(item),
        item.updatedAt,
      ]),
    ];

    downloadCsv(`amaro-estoque-${today}.csv`, rows);
  }

  function exportFullBackup() {
    const backupDate = new Date().toISOString();
    const today = backupDate.slice(0, 10);

    downloadJson(`amaro-dos-reis-backup-${today}.json`, {
      backupVersion: BACKUP_VERSION,
      version: BACKUP_VERSION,
      backupDate,
      storageKeys: {
        sales: SALES_STORAGE_KEY,
        inventory: INVENTORY_STORAGE_KEY,
      },
      sales,
      inventory,
    });

    setBackupError("");
    setBackupMessage("Backup completo exportado com sucesso.");
  }

  function handleBackupFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setBackupImport(null);
    setBackupMessage("");
    setBackupError("");

    if (!file) {
      setBackupFileName("");
      return;
    }

    setBackupFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const content = String(reader.result ?? "");
        const parsedBackup = JSON.parse(content) as unknown;
        const normalizedBackup = normalizeBackup(parsedBackup);

        if (!normalizedBackup) {
          throw new Error("Invalid backup");
        }

        setBackupImport(normalizedBackup);
        setBackupMessage("Backup carregado para conferência.");
      } catch {
        setBackupImport(null);
        setBackupError(
          "Arquivo inválido. Importe um JSON de backup amaro_backup_v1 com vendas e estoque."
        );
      }
    };

    reader.onerror = () => {
      setBackupImport(null);
      setBackupError("Não foi possível ler o arquivo selecionado.");
    };

    reader.readAsText(file);
  }

  function restoreBackup() {
    if (!backupImport) {
      setBackupError("Selecione um backup válido antes de restaurar.");
      return;
    }

    const confirmed = window.confirm(
      "Isso substituirá as vendas e o estoque salvos neste navegador. Deseja continuar?"
    );

    if (!confirmed) {
      return;
    }

    window.localStorage.setItem(
      SALES_STORAGE_KEY,
      JSON.stringify(backupImport.sales)
    );
    window.localStorage.setItem(
      INVENTORY_STORAGE_KEY,
      JSON.stringify(backupImport.inventory)
    );
    setSales(backupImport.sales);
    setInventory(backupImport.inventory);
    setBackupError("");
    setBackupMessage("Backup restaurado com sucesso.");
  }

  function getSyncTokenOrWarn() {
    const token = syncToken.trim();

    if (!token) {
      setSyncMessage("");
      setSyncError("Informe o token de sincronização.");
      return "";
    }

    return token;
  }

  function getPayloadMessage(
    payload: Record<string, unknown>,
    fallback: string
  ) {
    return typeof payload.message === "string" && payload.message.trim()
      ? payload.message
      : fallback;
  }

  async function readSyncPayload(response: Response) {
    const payload = (await response.json().catch(() => null)) as unknown;

    if (!isRecord(payload)) {
      throw new Error("Resposta inválida da sincronização.");
    }

    if (!response.ok) {
      throw new Error(
        getPayloadMessage(
          payload,
          response.status === 401
            ? "Token de sincronização inválido."
            : "Não foi possível concluir a sincronização."
        )
      );
    }

    return payload;
  }

  function saveLastSyncTimestamp() {
    const now = new Date().toISOString();

    window.localStorage.setItem(LAST_SYNC_STORAGE_KEY, now);
    setLastSyncAt(now);
  }

  async function checkPrivateConnection() {
    const token = getSyncTokenOrWarn();

    if (!token) {
      return;
    }

    setSyncAction("status");
    setSyncMessage("");
    setSyncError("");
    setSyncStatus(null);

    try {
      const response = await fetch("/api/admin/sync/status", {
        headers: {
          "x-amaro-admin-token": token,
        },
      });
      const payload = await readSyncPayload(response);
      const status: SyncStatus = {
        configured: payload.configured === true,
        salesCount:
          typeof payload.salesCount === "number" ? payload.salesCount : 0,
        inventoryCount:
          typeof payload.inventoryCount === "number"
            ? payload.inventoryCount
            : 0,
        message:
          typeof payload.message === "string" ? payload.message : undefined,
      };

      setSyncStatus(status);

      if (payload.ok === false) {
        throw new Error(
          getPayloadMessage(payload, "Supabase server-side não configurado.")
        );
      }

      setSyncMessage("Conexão privada verificada com sucesso.");
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Não foi possível verificar a conexão privada."
      );
    } finally {
      setSyncAction("");
    }
  }

  async function pushLocalDataToSupabase() {
    const token = getSyncTokenOrWarn();

    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      "Isso enviará suas vendas e estoque locais para o Supabase. Nenhum dado local será apagado. Continuar?"
    );

    if (!confirmed) {
      return;
    }

    setSyncAction("push");
    setSyncMessage("");
    setSyncError("");

    try {
      const response = await fetch("/api/admin/sync/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-amaro-admin-token": token,
        },
        body: JSON.stringify({ sales, inventory }),
      });
      const payload = await readSyncPayload(response);

      if (payload.ok === false) {
        throw new Error(
          getPayloadMessage(
            payload,
            "Não foi possível enviar os dados ao Supabase."
          )
        );
      }

      saveLastSyncTimestamp();
      setSyncMessage(
        getPayloadMessage(
          payload,
          "Dados locais enviados ao Supabase com sucesso."
        )
      );
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar os dados ao Supabase."
      );
    } finally {
      setSyncAction("");
    }
  }

  async function pullDataFromSupabase() {
    const token = getSyncTokenOrWarn();

    if (!token) {
      return;
    }

    setSyncAction("pull");
    setSyncMessage("");
    setSyncError("");

    try {
      const response = await fetch("/api/admin/sync/pull", {
        headers: {
          "x-amaro-admin-token": token,
        },
      });
      const payload = await readSyncPayload(response);

      if (payload.ok === false) {
        throw new Error(
          getPayloadMessage(
            payload,
            "Não foi possível buscar os dados do Supabase."
          )
        );
      }

      const downloadedSales = Array.isArray(payload.sales)
        ? payload.sales
            .map((sale) => normalizeSale(sale))
            .filter((sale): sale is Sale => sale !== null)
        : [];
      const downloadedInventory = Array.isArray(payload.inventory)
        ? payload.inventory
            .map((item) => normalizeInventoryItem(item))
            .filter((item): item is InventoryItem => item !== null)
        : [];

      setPulledSyncData({
        sales: downloadedSales,
        inventory: downloadedInventory,
      });
      setSyncMessage(
        `Dados baixados para prévia: ${downloadedSales.length} venda${
          downloadedSales.length === 1 ? "" : "s"
        } e ${downloadedInventory.length} item${
          downloadedInventory.length === 1 ? "" : "s"
        } de estoque.`
      );
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "Não foi possível buscar os dados do Supabase."
      );
    } finally {
      setSyncAction("");
    }
  }

  function restorePulledData() {
    if (!pulledSyncData) {
      setSyncMessage("");
      setSyncError("Busque os dados do Supabase antes de restaurar.");
      return;
    }

    const confirmed = window.confirm(
      "Isso substituirá os dados locais deste navegador pelos dados baixados do Supabase. Faça backup antes. Continuar?"
    );

    if (!confirmed) {
      return;
    }

    setSyncAction("restore");
    setSyncMessage("");
    setSyncError("");

    window.localStorage.setItem(
      SALES_STORAGE_KEY,
      JSON.stringify(pulledSyncData.sales)
    );
    window.localStorage.setItem(
      INVENTORY_STORAGE_KEY,
      JSON.stringify(pulledSyncData.inventory)
    );
    setSales(pulledSyncData.sales);
    setInventory(pulledSyncData.inventory);
    saveLastSyncTimestamp();
    setSyncAction("");
    setSyncMessage("Dados baixados do Supabase restaurados neste navegador.");
  }

  async function copyFinancialSummary() {
    const text = [
      "AMARO DOS REIS PARFUM - Resumo financeiro",
      `Total vendido: ${formatCurrency(summary.totalSold)}`,
      `Total recebido: ${formatCurrency(summary.totalReceived)}`,
      `Total pendente: ${formatCurrency(summary.totalPending)}`,
      `Lucro estimado total: ${formatCurrency(summary.estimatedProfit)}`,
      `Quantidade de vendas: ${summary.saleCount}`,
      `Quantidade de perfumes vendidos: ${summary.perfumeCount}`,
      `Valor em estoque: ${formatCurrency(summary.inventoryValue)}`,
    ].join("\n");

    try {
      await copyTextToClipboard(text);
      setSummaryCopyMessage("Resumo financeiro copiado.");
    } catch {
      setSummaryCopyMessage("Não foi possível copiar o resumo financeiro.");
    }
  }

  function clearAllSales() {
    const confirmed = window.confirm(
      "Tem certeza que deseja limpar todas as vendas deste navegador?"
    );

    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(SALES_STORAGE_KEY);
    setSales([]);
  }

  const isSyncBusy = syncAction !== "";

  const reportCards = [
    ["Total vendido", formatCurrency(summary.totalSold)],
    ["Total recebido", formatCurrency(summary.totalReceived)],
    ["Total pendente", formatCurrency(summary.totalPending)],
    ["Lucro estimado total", formatCurrency(summary.estimatedProfit)],
    ["Custo estimado total", formatCurrency(summary.estimatedCost)],
    ["Valor em estoque", formatCurrency(summary.inventoryValue)],
    ["Quantidade de vendas", String(summary.saleCount)],
    ["Perfumes vendidos", String(summary.perfumeCount)],
    ["Perfumes com baixo estoque", String(summary.lowStockCount)],
  ];

  return (
    <main className="min-h-screen bg-black text-stone-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-12">
        <div className="rounded-lg border border-gold/25 bg-gold/10 p-4 text-sm leading-6 text-gold-light">
          Versão local: os dados ficam salvos apenas neste navegador.
          Futuramente este painel será integrado ao Supabase.
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-stone-300">
          Os valores de custo e lucro são estimativas para controle interno.
          Ajuste os custos conforme seus fornecedores reais.
        </div>

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              Painel interno
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Controle de vendas, estoque e lucro
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">
              Registro local para vendas, fiados, pagamentos, custos e estoque
              da Amaro dos Reis Parfum.
            </p>
          </div>
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={exportSalesCsv}
                disabled={sales.length === 0}
                className="min-h-11 rounded-md border border-gold/45 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Exportar CSV
              </button>
              <button
                type="button"
                onClick={exportInventoryCsv}
                disabled={inventory.length === 0}
                className="min-h-11 rounded-md border border-gold/45 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Exportar estoque CSV
              </button>
              <button
                type="button"
                onClick={exportFullBackup}
                className="min-h-11 rounded-md border border-gold/45 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold hover:bg-gold/10"
              >
                Baixar backup antes de limpar
              </button>
              <button
                type="button"
                onClick={clearAllSales}
                disabled={sales.length === 0}
                className="min-h-11 rounded-md border border-red-400/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Limpar todas as vendas
              </button>
            </div>
            <p className="max-w-xl text-xs leading-5 text-stone-500">
              Antes de apagar informações, exporte um backup completo.
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 rounded-lg border border-gold/20 bg-white/[0.035] p-2">
          {[
            ["#vendas", "Vendas"],
            ["#estoque-e-custos", "Estoque e custos"],
            ["#relatorios", "Relatórios"],
            ["#backup", "Backup"],
            ["#sync", "Sincronização"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="min-h-10 rounded-md border border-transparent px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-300 transition hover:border-gold/40 hover:text-gold-light"
            >
              {label}
            </a>
          ))}
        </nav>

        <section id="relatorios" className="scroll-mt-28">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Relatórios
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Resumo financeiro
              </h2>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={copyFinancialSummary}
                className="min-h-11 rounded-md border border-gold/45 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold hover:bg-gold/10"
              >
                Copiar resumo financeiro
              </button>
              {summaryCopyMessage ? (
                <p className="text-xs text-gold-light">{summaryCopyMessage}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {reportCards.map(([label, value]) => (
              <article
                key={label}
                className="rounded-lg border border-gold/20 bg-white/[0.045] p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  {label}
                </p>
                <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                  Atenção de estoque
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Perfumes em baixo estoque
                </h3>
              </div>
              <p className="text-sm text-gold-light">
                {lowStockItems.length} item{lowStockItems.length === 1 ? "" : "s"}
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-stone-500">
                  Nenhum perfume com baixo estoque no momento.
                </p>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item.perfumeSlug}
                    className="flex flex-col justify-between gap-2 rounded-md border border-white/10 bg-black/35 p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.perfumeName}</p>
                      <p className="mt-1 text-sm text-stone-400">
                        {lineLabel(item.lineType)} • estoque {item.stockQuantity} •
                        mínimo {item.minimumStock}
                      </p>
                    </div>
                    <span
                      className={`w-fit rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${inventoryStatusClass(
                        getInventoryStatus(item)
                      )}`}
                    >
                      {getInventoryStatus(item)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section
          id="backup"
          className="scroll-mt-28 rounded-lg border border-gold/20 bg-white/[0.045] p-5 sm:p-6"
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Backup e segurança dos dados
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Proteja suas vendas e seu estoque
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-400">
                Enquanto o sistema ainda não estiver integrado ao Supabase, os
                dados ficam salvos apenas neste navegador. Faça backups
                regularmente para não perder suas vendas e estoque.
              </p>
              <p className="mt-3 text-sm leading-7 text-gold-light">
                Próxima fase planejada: sincronização com Supabase para acessar
                os dados em mais de um computador.
              </p>
            </div>
            <button
              type="button"
              onClick={exportFullBackup}
              className="min-h-11 rounded-md bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light"
            >
              Exportar backup completo
            </button>
          </div>

          <div className="mt-6 rounded-lg border border-gold/20 bg-black/35 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                  Status da futura integração
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  Supabase configurado: {supabaseConfigured ? "Sim" : "Não"}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-400">
                  {supabaseConfigured
                    ? "As variáveis do Supabase estão presentes. A conexão real será ativada em um pacote futuro."
                    : "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY quando chegar a fase de integração."}
                </p>
                <Link
                  href="/admin/supabase-status"
                  className="mt-4 inline-flex min-h-10 items-center rounded-md border border-gold/45 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-gold-light transition hover:border-gold hover:bg-gold/10"
                >
                  Ver status Supabase
                </Link>
              </div>
              <span
                className={`w-fit rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                  supabaseConfigured
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : "border-gold/35 bg-gold/10 text-gold-light"
                }`}
              >
                {supabaseConfigured ? "Pronto para próxima fase" : "Local ativo"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-lg border border-white/10 bg-black/35 p-5">
              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Importar arquivo JSON
                </span>
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleBackupFileChange}
                  className="mt-3 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-stone-300 file:mr-4 file:rounded-md file:border-0 file:bg-gold file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.12em] file:text-black"
                />
              </label>
              <p className="mt-3 text-xs leading-5 text-stone-500">
                O arquivo precisa ser um backup compatível com
                amaro_backup_v1 e conter vendas e estoque em listas.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/35 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Prévia do backup
              </p>
              {backupImport ? (
                <div className="mt-4 grid gap-3 text-sm text-stone-300">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                        Vendas
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {backupImport.sales.length}
                      </p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                        Estoque
                      </p>
                      <p className="mt-2 text-xl font-semibold text-white">
                        {backupImport.inventory.length}
                      </p>
                    </div>
                    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                        Data
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {backupImport.backupDate
                          ? formatDate(backupImport.backupDate)
                          : "Sem data"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-stone-500">
                    Arquivo selecionado: {backupFileName || "backup JSON"}
                  </p>
                  <button
                    type="button"
                    onClick={restoreBackup}
                    className="min-h-11 w-fit rounded-md border border-gold/45 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold hover:bg-gold/10"
                  >
                    Restaurar backup
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-stone-500">
                  Selecione um arquivo de backup para conferir a quantidade de
                  vendas, itens de estoque e data antes de restaurar.
                </p>
              )}
            </div>
          </div>

          {backupMessage ? (
            <p className="mt-5 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-300">
              {backupMessage}
            </p>
          ) : null}
          {backupError ? (
            <p className="mt-5 rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              {backupError}
            </p>
          ) : null}
        </section>

        <section
          id="sync"
          className="scroll-mt-28 rounded-lg border border-gold/20 bg-white/[0.045] p-5 sm:p-6"
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Sincronização com Supabase
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Envio e restauração manual
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-400">
                Antes de sincronizar, exporte um backup completo. A
                sincronização não apaga seus dados locais automaticamente.
              </p>
              <p className="mt-3 text-sm leading-7 text-stone-500">
                Use esta área apenas depois de aplicar a migração de sync no
                Supabase e configurar as variáveis privadas do servidor.
              </p>
            </div>
            <div className="rounded-md border border-gold/25 bg-black/35 px-4 py-3 text-sm text-gold-light">
              Última sincronização:{" "}
              <span className="font-semibold text-white">
                {lastSyncAt ? formatDate(lastSyncAt) : "Ainda não sincronizado"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-lg border border-white/10 bg-black/35 p-5">
              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Token de sincronização
                </span>
                <input
                  type="password"
                  value={syncToken}
                  placeholder="Token de sincronização"
                  autoComplete="off"
                  onChange={(event) => setSyncToken(event.target.value)}
                  className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-gold"
                />
              </label>
              <p className="mt-3 text-xs leading-5 text-stone-500">
                O token fica salvo apenas nesta sessão do navegador. A chave
                privada do Supabase permanece somente no servidor.
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={checkPrivateConnection}
                  disabled={isSyncBusy}
                  className="min-h-11 rounded-md border border-gold/45 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Verificar conexão privada
                </button>
                <button
                  type="button"
                  onClick={pushLocalDataToSupabase}
                  disabled={isSyncBusy}
                  className="min-h-11 rounded-md bg-gold px-4 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Enviar dados locais para Supabase
                </button>
                <button
                  type="button"
                  onClick={pullDataFromSupabase}
                  disabled={isSyncBusy}
                  className="min-h-11 rounded-md border border-gold/45 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Buscar dados do Supabase
                </button>
                <button
                  type="button"
                  onClick={restorePulledData}
                  disabled={isSyncBusy || !pulledSyncData}
                  className="min-h-11 rounded-md border border-red-400/35 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-red-200 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Restaurar dados baixados do Supabase
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/35 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Estado da sincronização
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                    Dados locais
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {sales.length} vendas / {inventory.length} estoque
                  </p>
                </div>
                <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-stone-500">
                    Prévia baixada
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {pulledSyncData
                      ? `${pulledSyncData.sales.length} vendas / ${pulledSyncData.inventory.length} estoque`
                      : "Nenhuma prévia"}
                  </p>
                </div>
              </div>

              {syncStatus ? (
                <div className="mt-4 rounded-md border border-gold/20 bg-gold/10 p-4 text-sm leading-6 text-gold-light">
                  <p>
                    Supabase privado:{" "}
                    <span className="font-semibold text-white">
                      {syncStatus.configured ? "Configurado" : "Não configurado"}
                    </span>
                  </p>
                  <p>
                    Vendas no Supabase:{" "}
                    <span className="font-semibold text-white">
                      {syncStatus.salesCount ?? 0}
                    </span>
                  </p>
                  <p>
                    Itens de estoque no Supabase:{" "}
                    <span className="font-semibold text-white">
                      {syncStatus.inventoryCount ?? 0}
                    </span>
                  </p>
                  {syncStatus.message ? <p>{syncStatus.message}</p> : null}
                </div>
              ) : null}

              {isSyncBusy ? (
                <p className="mt-4 text-sm text-stone-400">
                  Processando sincronização...
                </p>
              ) : null}

              {syncMessage ? (
                <p className="mt-4 rounded-md border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-300">
                  {syncMessage}
                </p>
              ) : null}
              {syncError ? (
                <p className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
                  {syncError}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section
          id="vendas"
          className="grid scroll-mt-28 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]"
        >
          <form
            onSubmit={registerSale}
            className="rounded-lg border border-gold/20 bg-white/[0.045] p-5 sm:p-6"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Vendas
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Registrar venda
              </h2>
            </div>

            <div className="mt-6 grid gap-4">
              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Nome do cliente
                </span>
                <input
                  value={saleForm.customerName}
                  onChange={(event) =>
                    setSaleForm((current) => ({
                      ...current,
                      customerName: event.target.value,
                    }))
                  }
                  required
                  className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                />
              </label>

              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Perfume vendido
                </span>
                <select
                  value={saleForm.perfumeSlug}
                  onChange={(event) => handleSalePerfumeChange(event.target.value)}
                  className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                >
                  {perfumeCommerce.map((perfume) => (
                    <option key={perfumeSlug(perfume)} value={perfumeSlug(perfume)}>
                      {perfume.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Tipo da linha
                  </span>
                  <select
                    value={saleForm.lineType}
                    onChange={(event) =>
                      setSaleForm((current) => ({
                        ...current,
                        lineType: event.target.value as LineType,
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                  >
                    {lineOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Preço de venda
                  </span>
                  <input
                    value={formatCurrency(saleUnitPrice)}
                    readOnly
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black/70 px-4 py-3 text-sm text-gold-light outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Quantidade
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={saleForm.quantity}
                    onChange={(event) =>
                      setSaleForm((current) => ({
                        ...current,
                        quantity: Math.max(1, Number(event.target.value) || 1),
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                  />
                </label>

                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Total da venda
                  </span>
                  <input
                    value={formatCurrency(saleUnitPrice * saleForm.quantity)}
                    readOnly
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black/70 px-4 py-3 text-sm text-gold-light outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Custo estimado
                  </span>
                  <input
                    value={formatCurrency(saleUnitCost * saleForm.quantity)}
                    readOnly
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black/70 px-4 py-3 text-sm text-gold-light outline-none"
                  />
                </label>

                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Lucro estimado
                  </span>
                  <input
                    value={formatCurrency(
                      (saleUnitPrice - saleUnitCost) * saleForm.quantity
                    )}
                    readOnly
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black/70 px-4 py-3 text-sm text-gold-light outline-none"
                  />
                </label>
              </div>

              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Forma de pagamento
                </span>
                <select
                  value={saleForm.paymentMethod}
                  onChange={(event) =>
                    handlePaymentMethodChange(event.target.value as PaymentMethod)
                  }
                  className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                >
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Status
                </span>
                <select
                  value={saleForm.status}
                  onChange={(event) =>
                    setSaleForm((current) => ({
                      ...current,
                      status: event.target.value as SaleStatus,
                    }))
                  }
                  className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Observação
                </span>
                <textarea
                  rows={4}
                  value={saleForm.notes}
                  onChange={(event) =>
                    setSaleForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="mt-2 w-full resize-none rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                />
              </label>

              {saleNotice ? (
                <p className="rounded-md border border-gold/30 bg-gold/10 p-3 text-sm text-gold-light">
                  {saleNotice}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="min-h-11 rounded-md bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light"
                >
                  Registrar venda
                </button>
                <button
                  type="button"
                  onClick={resetSaleForm}
                  className="min-h-11 rounded-md border border-gold/35 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold"
                >
                  Limpar formulário
                </button>
              </div>
            </div>
          </form>

          <section className="rounded-lg border border-gold/20 bg-white/[0.045] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Vendas registradas
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Lista de vendas
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {saleFilters.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={`min-h-10 rounded-md border px-4 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      filter === option.value
                        ? "border-gold bg-gold text-black"
                        : "border-gold/25 text-gold-light hover:border-gold"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-[1180px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gold/20 text-xs uppercase tracking-[0.16em] text-stone-500">
                    <th className="py-3 pr-4 font-semibold">Cliente</th>
                    <th className="py-3 pr-4 font-semibold">Perfume</th>
                    <th className="py-3 pr-4 font-semibold">Linha</th>
                    <th className="py-3 pr-4 font-semibold">Qtd.</th>
                    <th className="py-3 pr-4 font-semibold">Valor total</th>
                    <th className="py-3 pr-4 font-semibold">Custo</th>
                    <th className="py-3 pr-4 font-semibold">Lucro</th>
                    <th className="py-3 pr-4 font-semibold">Pagamento</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Data</th>
                    <th className="py-3 pr-4 font-semibold">Observação</th>
                    <th className="py-3 pr-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="py-10 text-center text-sm text-stone-500"
                      >
                        Nenhuma venda encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const total = sale.unitPrice * sale.quantity;
                      const saleCost = getSaleUnitCost(sale) * sale.quantity;
                      const profit = getSaleEstimatedProfit(sale);

                      return (
                        <tr
                          key={sale.id}
                          className="border-b border-white/10 align-top text-stone-300 last:border-0"
                        >
                          <td className="max-w-[150px] py-4 pr-4 font-medium text-white">
                            {sale.customerName}
                          </td>
                          <td className="max-w-[160px] py-4 pr-4">
                            {sale.perfumeName}
                          </td>
                          <td className="py-4 pr-4">
                            {lineLabel(sale.lineType)}
                          </td>
                          <td className="py-4 pr-4">{sale.quantity}</td>
                          <td className="py-4 pr-4 font-semibold text-gold-light">
                            {formatCurrency(total)}
                          </td>
                          <td className="py-4 pr-4 text-stone-400">
                            {formatCurrency(saleCost)}
                          </td>
                          <td className="py-4 pr-4 text-emerald-300">
                            {formatCurrency(profit)}
                          </td>
                          <td className="py-4 pr-4">
                            {paymentOptions.find(
                              (option) => option.value === sale.paymentMethod
                            )?.label ?? sale.paymentMethod}
                          </td>
                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${
                                sale.status === "pago"
                                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                                  : "border-gold/35 bg-gold/10 text-gold-light"
                              }`}
                            >
                              {sale.status === "pago" ? "Pago" : "Pendente"}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-stone-400">
                            {formatDate(sale.createdAt)}
                          </td>
                          <td className="max-w-[220px] py-4 pr-4 text-stone-400">
                            {sale.notes || "-"}
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => markAsPaid(sale.id)}
                                disabled={sale.status === "pago"}
                                className="min-h-9 rounded-md border border-emerald-400/30 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300 transition hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-45"
                              >
                                Marcar como pago
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteSale(sale.id)}
                                className="min-h-9 rounded-md border border-red-400/30 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-400/10"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <section
          id="estoque-e-custos"
          className="grid scroll-mt-28 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]"
        >
          <form
            onSubmit={saveInventory}
            className="rounded-lg border border-gold/20 bg-white/[0.045] p-5 sm:p-6"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                Estoque e custos
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Salvar estoque
              </h2>
            </div>

            <div className="mt-6 grid gap-4">
              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Perfume
                </span>
                <select
                  value={inventoryForm.perfumeSlug}
                  onChange={(event) =>
                    handleInventoryPerfumeChange(event.target.value)
                  }
                  className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                >
                  {perfumeCommerce.map((perfume) => (
                    <option key={perfumeSlug(perfume)} value={perfumeSlug(perfume)}>
                      {perfume.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Linha
                </span>
                <select
                  value={inventoryForm.lineType}
                  onChange={(event) =>
                    handleInventoryLineChange(event.target.value as LineType)
                  }
                  className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                >
                  {lineOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Quantidade em estoque
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={inventoryForm.stockQuantity}
                    onChange={(event) =>
                      setInventoryForm((current) => ({
                        ...current,
                        stockQuantity: Math.max(
                          0,
                          Math.floor(Number(event.target.value) || 0)
                        ),
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                  />
                </label>

                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Estoque mínimo
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={inventoryForm.minimumStock}
                    onChange={(event) =>
                      setInventoryForm((current) => ({
                        ...current,
                        minimumStock: Math.max(
                          0,
                          Math.floor(Number(event.target.value) || 0)
                        ),
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Custo unitário
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={inventoryForm.unitCost}
                    onChange={(event) =>
                      setInventoryForm((current) => ({
                        ...current,
                        unitCost: clampNumber(event.target.value, 0),
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                  />
                </label>

                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Preço de venda
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={inventoryForm.salePrice}
                    onChange={(event) =>
                      setInventoryForm((current) => ({
                        ...current,
                        salePrice: clampNumber(event.target.value, 0),
                      }))
                    }
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-gold"
                  />
                </label>
              </div>

              <div className="grid gap-4 rounded-lg border border-white/10 bg-black/35 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Lucro por unidade
                  </p>
                  <p className="mt-2 text-lg font-semibold text-emerald-300">
                    {formatCurrency(inventoryUnitProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Margem aproximada
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gold-light">
                    {formatPercent(inventoryMargin)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="min-h-11 rounded-md bg-gold px-5 text-xs font-semibold uppercase tracking-[0.16em] text-black transition hover:bg-gold-light"
                >
                  Salvar estoque
                </button>
                <button
                  type="button"
                  onClick={resetInventoryForm}
                  className="min-h-11 rounded-md border border-gold/35 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-light transition hover:border-gold"
                >
                  Limpar formulário
                </button>
              </div>
            </div>
          </form>

          <section className="rounded-lg border border-gold/20 bg-white/[0.045] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">
                  Controle de estoque e custos
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Lista de estoque
                </h2>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gold/20 text-xs uppercase tracking-[0.16em] text-stone-500">
                    <th className="py-3 pr-4 font-semibold">Perfume</th>
                    <th className="py-3 pr-4 font-semibold">Linha</th>
                    <th className="py-3 pr-4 font-semibold">Estoque atual</th>
                    <th className="py-3 pr-4 font-semibold">Custo unitário</th>
                    <th className="py-3 pr-4 font-semibold">Preço de venda</th>
                    <th className="py-3 pr-4 font-semibold">Lucro unidade</th>
                    <th className="py-3 pr-4 font-semibold">Margem</th>
                    <th className="py-3 pr-4 font-semibold">Estoque mínimo</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInventory.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="py-10 text-center text-sm text-stone-500"
                      >
                        Nenhum estoque cadastrado ainda.
                      </td>
                    </tr>
                  ) : (
                    sortedInventory.map((item) => {
                      const status = getInventoryStatus(item);
                      const unitProfit = item.salePrice - item.unitCost;

                      return (
                        <tr
                          key={item.perfumeSlug}
                          className="border-b border-white/10 align-top text-stone-300 last:border-0"
                        >
                          <td className="max-w-[180px] py-4 pr-4 font-medium text-white">
                            {item.perfumeName}
                          </td>
                          <td className="py-4 pr-4">{lineLabel(item.lineType)}</td>
                          <td className="py-4 pr-4">{item.stockQuantity}</td>
                          <td className="py-4 pr-4">
                            {formatCurrency(item.unitCost)}
                          </td>
                          <td className="py-4 pr-4 font-semibold text-gold-light">
                            {formatCurrency(item.salePrice)}
                          </td>
                          <td className="py-4 pr-4 text-emerald-300">
                            {formatCurrency(unitProfit)}
                          </td>
                          <td className="py-4 pr-4">
                            {formatPercent(getItemMargin(item))}
                          </td>
                          <td className="py-4 pr-4">{item.minimumStock}</td>
                          <td className="py-4 pr-4">
                            <span
                              className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${inventoryStatusClass(
                                status
                              )}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="py-4 pr-4">
                            <div className="flex flex-col gap-2">
                              <button
                                type="button"
                                onClick={() => editInventoryItem(item)}
                                className="min-h-9 rounded-md border border-gold/35 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-gold-light transition hover:border-gold"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteInventoryItem(item.perfumeSlug)}
                                className="min-h-9 rounded-md border border-red-400/30 px-3 text-xs font-semibold uppercase tracking-[0.12em] text-red-200 transition hover:bg-red-400/10"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-stone-400">
          Este painel é uma versão inicial para controle pessoal. Não use como
          sistema fiscal. Faça backup das informações exportando CSV
          regularmente.
        </div>
      </section>
    </main>
  );
}
