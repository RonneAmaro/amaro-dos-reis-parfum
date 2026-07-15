"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  perfumeCommerce,
  perfumeSlug,
  type PerfumeCommerce,
} from "@/lib/perfumes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SALES_STORAGE_KEY } from "@/lib/storage-keys";
import {
  createCollectionMessage,
  createWhatsAppCollectionUrl,
  expectedPaymentMethodLabel,
  formatReceivableDate,
  nextDayOfMonth,
  toLocalDateInput,
  type ExpectedPaymentMethod,
} from "@/lib/admin/receivables";
import {
  calculateFlexibleSale,
  createFlexibleItem,
  getRemainingAmount,
  getSaleItems,
  getSaleTotal,
  itemTypeLabel,
  summarizeSaleItems,
  type FlexibleSaleItem,
  type SaleItemType,
} from "@/lib/admin/flexibleSales";
import { parseSalesAssistant } from "@/lib/admin/salesAssistant";
import {
  interpretAdminCommand,
  paymentUpdateForAction,
  type AdminAssistantPreview,
} from "@/lib/admin/adminAssistant";
import { AdminIcon, AdminQuickActions, AdminSummaryCards, type SummaryCard } from "./AdminDashboardVisuals";

const INVENTORY_STORAGE_KEY = "amaro_inventory_v1";
const BACKUP_VERSION = "amaro_backup_v1";
const LAST_SYNC_STORAGE_KEY = "amaro_last_sync_at";
const SYNC_TOKEN_STORAGE_KEY = "amaro_admin_sync_token";

type LineType = "tradicional" | "arabe";
type PaymentMethod = "dinheiro" | "pix" | "cartao" | "fiado";
type SaleStatus = "pago" | "pendente" | "fiado" | "partial";
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
  customerPhone?: string;
  expectedPaymentDate?: string;
  expectedPaymentMethod?: ExpectedPaymentMethod;
  collectionNote?: string;
  items?: FlexibleSaleItem[];
  subtotal?: number;
  discountValue?: number;
  totalAmount?: number;
  amountPaid?: number;
  remainingAmount?: number;
  googleCalendarEventId?: string;
  googleCalendarEventLink?: string;
  googleCalendarSyncedAt?: string;
  googleCalendarStatus?: string;
};

type SaleForm = {
  customerName: string;
  perfumeSlug: string;
  lineType: LineType;
  quantity: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes: string;
  customerPhone: string;
  expectedPaymentDate: string;
  expectedPaymentMethod: ExpectedPaymentMethod;
  collectionNote: string;
  manualUnitPrice: number;
  itemDiscountValue: number;
  itemType: SaleItemType;
  amountPaid: number;
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
type GoogleCalendarStatus = { connected: boolean; connectedEmail?: string; calendarId?: string; lastSync?: string };

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
  { value: "fiado", label: "Fiado" },
  { value: "partial", label: "Parcialmente pago" },
];

const expectedPaymentOptions: { value: ExpectedPaymentMethod; label: string }[] = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão" },
  { value: "salario", label: "Salário / próximo pagamento" },
  { value: "outro", label: "Outro" },
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
  customerPhone: "",
  expectedPaymentDate: "",
  expectedPaymentMethod: "pix",
  collectionNote: "",
  manualUnitPrice: getLinePrice(getSuggestedLineType(defaultPerfume)),
  itemDiscountValue: 0,
  itemType: "sale",
  amountPaid: 0,
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
  return value === "pendente" || value === "fiado" || value === "partial" ? value : "pago";
}

function normalizeExpectedPaymentMethod(value: unknown): ExpectedPaymentMethod | undefined {
  return value === "pix" || value === "dinheiro" || value === "cartao" || value === "salario" || value === "outro"
    ? value
    : undefined;
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
  if (sale.items?.length) {
    return calculateFlexibleSale(sale.items, sale.amountPaid).estimatedProfit;
  }
  return (
    sale.estimatedProfit ??
    (sale.unitPrice - getSaleUnitCost(sale)) * sale.quantity
  );
}

function normalizeSaleItem(value: unknown): FlexibleSaleItem | null {
  if (!isRecord(value) || typeof value.perfumeName !== "string") return null;
  const itemType: SaleItemType = value.itemType === "gift" || value.itemType === "personal_use" || value.itemType === "sample" || value.itemType === "exchange" ? value.itemType : "sale";
  const lineType = value.lineType === "arabe" || value.lineType === "outro" ? value.lineType : "tradicional";
  return createFlexibleItem({
    id: typeof value.id === "string" ? value.id : createId(),
    perfumeSlug: typeof value.perfumeSlug === "string" ? value.perfumeSlug : undefined,
    perfumeName: value.perfumeName,
    lineType,
    quantity: Number(value.quantity) || 1,
    unitPrice: Number(value.unitPrice) || 0,
    originalUnitPrice: Number(value.originalUnitPrice) || Number(value.unitPrice) || 0,
    unitCost: Number(value.unitCost) || 0,
    discountValue: Number(value.discountValue) || 0,
    itemType,
    notes: typeof value.notes === "string" ? value.notes : undefined,
  });
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
  const items = Array.isArray(value.items)
    ? value.items.map(normalizeSaleItem).filter((item): item is FlexibleSaleItem => item !== null)
    : undefined;

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
    customerPhone: typeof value.customerPhone === "string" ? value.customerPhone : undefined,
    expectedPaymentDate: typeof value.expectedPaymentDate === "string" ? value.expectedPaymentDate : undefined,
    expectedPaymentMethod: normalizeExpectedPaymentMethod(value.expectedPaymentMethod),
    collectionNote: typeof value.collectionNote === "string" ? value.collectionNote : undefined,
    items: items?.length ? items : undefined,
    subtotal: typeof value.subtotal === "number" ? value.subtotal : undefined,
    discountValue: typeof value.discountValue === "number" ? value.discountValue : undefined,
    totalAmount: typeof value.totalAmount === "number" ? value.totalAmount : undefined,
    amountPaid: typeof value.amountPaid === "number" ? value.amountPaid : undefined,
    remainingAmount: typeof value.remainingAmount === "number" ? value.remainingAmount : undefined,
    googleCalendarEventId: typeof value.googleCalendarEventId === "string" ? value.googleCalendarEventId : undefined,
    googleCalendarEventLink: typeof value.googleCalendarEventLink === "string" ? value.googleCalendarEventLink : undefined,
    googleCalendarSyncedAt: typeof value.googleCalendarSyncedAt === "string" ? value.googleCalendarSyncedAt : undefined,
    googleCalendarStatus: typeof value.googleCalendarStatus === "string" ? value.googleCalendarStatus : undefined,
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
  const [saleCart, setSaleCart] = useState<FlexibleSaleItem[]>([]);
  const [assistantText, setAssistantText] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [adminAssistantText, setAdminAssistantText] = useState("");
  const [adminAssistantPreview, setAdminAssistantPreview] = useState<AdminAssistantPreview | null>(null);
  const [adminAssistantResult, setAdminAssistantResult] = useState("");
  const [adminAssistantSaleId, setAdminAssistantSaleId] = useState("");
  const [isAdminAssistantListening, setIsAdminAssistantListening] = useState(false);
  const [adminAssistantSyncGoogle, setAdminAssistantSyncGoogle] = useState(true);
  const adminRecognitionRef = useRef<{ stop(): void; abort(): void } | null>(null);
  const adminVoiceTranscriptRef = useRef("");
  const adminVoiceFinalTranscriptRef = useRef("");
  const isAdminListeningManuallyRef = useRef(false);
  const adminVoiceRestartTimerRef = useRef<number | null>(null);
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarStatus>({ connected: false });
  const [googleMessage, setGoogleMessage] = useState("");
  const [googleBusy, setGoogleBusy] = useState(false);
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
  const cartTotals = useMemo(
    () => calculateFlexibleSale(saleCart, saleForm.amountPaid),
    [saleCart, saleForm.amountPaid]
  );
  const inventoryUnitProfit = inventoryForm.salePrice - inventoryForm.unitCost;
  const inventoryMargin =
    inventoryForm.salePrice > 0
      ? (inventoryUnitProfit / inventoryForm.salePrice) * 100
      : 0;

  const summary = useMemo(() => {
    const salesSummary = sales.reduce(
      (totals, sale) => {
        const saleTotal = getSaleTotal(sale);
        const saleCost = sale.items?.length
          ? sale.items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)
          : getSaleUnitCost(sale) * sale.quantity;

        totals.totalSold += saleTotal;
        totals.perfumeCount += getSaleItems(sale).reduce((sum, item) => sum + item.quantity, 0);
        totals.estimatedCost += saleCost;
        totals.estimatedProfit += getSaleEstimatedProfit(sale);

        if (sale.status === "pago") {
          totals.totalReceived += saleTotal;
        } else {
          totals.totalPending += getRemainingAmount(sale);
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
      return sales.filter((sale) => sale.status !== "pago");
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

  const receivables = useMemo(() => {
    const today = toLocalDateInput();
    const dateInSevenDays = new Date();
    dateInSevenDays.setDate(dateInSevenDays.getDate() + 7);
    const sevenDaysAhead = toLocalDateInput(dateInSevenDays);
    const currentMonth = today.slice(0, 7);
    const pending = sales.filter((sale) => sale.status !== "pago");
    const groups = {
      atrasados: pending.filter((sale) => sale.expectedPaymentDate && sale.expectedPaymentDate < today),
      hoje: pending.filter((sale) => sale.expectedPaymentDate === today),
      proximos: pending.filter((sale) => sale.expectedPaymentDate && sale.expectedPaymentDate > today && sale.expectedPaymentDate <= sevenDaysAhead),
      pagamento: pending.filter((sale) => sale.expectedPaymentDate && sale.expectedPaymentDate > sevenDaysAhead),
      semData: pending.filter((sale) => !sale.expectedPaymentDate),
      recebidos: sales.filter((sale) => sale.status === "pago"),
    };
    const total = (items: Sale[]) => items.reduce((sum, sale) => sum + (sale.status === "pago" ? getSaleTotal(sale) : getRemainingAmount(sale)), 0);
    return {
      groups,
      summary: {
        totalPending: total(pending),
        today: total(groups.hoje),
        nextSevenDays: total(groups.proximos),
        overdue: total(groups.atrasados),
        receivedThisMonth: total(groups.recebidos.filter((sale) => sale.paidAt?.slice(0, 7) === currentMonth)),
        pendingCustomers: new Set(pending.map((sale) => sale.customerName.toLocaleLowerCase("pt-BR"))).size,
      },
    };
  }, [sales]);

  useEffect(() => {
    setSales(readSalesFromStorage());
    setIsSalesLoaded(true);
  }, []);

  useEffect(() => {
    fetch("/api/admin/google-calendar/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: GoogleCalendarStatus & { message?: string }) => {
        setGoogleStatus({ connected: Boolean(data.connected), connectedEmail: data.connectedEmail, calendarId: data.calendarId, lastSync: data.lastSync });
        if (data.message && !data.connected) setGoogleMessage(data.message);
      })
      .catch(() => setGoogleMessage("Não foi possível consultar o Google Agenda."));
  }, []);

  useEffect(() => () => {
    isAdminListeningManuallyRef.current = false;
    if (adminVoiceRestartTimerRef.current) window.clearTimeout(adminVoiceRestartTimerRef.current);
    adminRecognitionRef.current?.abort();
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
    setSaleCart([]);
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
      manualUnitPrice: getLinePrice(getSuggestedLineType(perfume)),
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
      status: paymentMethod === "fiado" ? "fiado" : current.status,
    }));
  }

  function addItemToCart() {
    const inventoryItem = inventory.find((item) => item.perfumeSlug === saleForm.perfumeSlug);
    if (!inventoryItem && !window.confirm("Este perfume não possui estoque cadastrado. Adicionar mesmo assim?")) return;
    setSaleCart((current) => [...current, createFlexibleItem({
      id: createId(), perfumeSlug: perfumeSlug(selectedSalePerfume), perfumeName: selectedSalePerfume.name,
      lineType: saleForm.lineType, quantity: saleForm.quantity,
      unitPrice: saleForm.manualUnitPrice, originalUnitPrice: saleUnitPrice,
      unitCost: saleUnitCost, discountValue: saleForm.itemDiscountValue,
      itemType: saleForm.itemType,
    })]);
    setSaleForm((current) => ({ ...current, quantity: 1, itemDiscountValue: 0, itemType: "sale" }));
  }

  function applyAssistantPreview() {
    const result = parseSalesAssistant(assistantText, perfumeCommerce.map((perfume) => {
      const slug = perfumeSlug(perfume);
      const stored = inventory.find((item) => item.perfumeSlug === slug);
      const lineType = getSuggestedLineType(perfume);
      return { slug, name: perfume.name, lineType, unitPrice: stored?.salePrice ?? getLinePrice(lineType), unitCost: stored?.unitCost ?? getDefaultUnitCost(lineType) };
    }));
    if (!result.items.length) { setAssistantMessage(result.notes.join(" ")); return; }
    setSaleCart(result.items);
    setSaleForm((current) => ({ ...current, customerName: result.customerName,
      paymentMethod: result.paymentMethod, status: result.status,
      expectedPaymentDate: result.expectedPaymentDate ?? "",
      expectedPaymentMethod: result.expectedPaymentMethod ?? current.expectedPaymentMethod,
      amountPaid: result.amountPaid ?? 0 }));
    setAssistantMessage(`Prévia criada com ${result.items.length} item(ns). Revise antes de registrar.`);
  }

  function startVoiceInput() {
    type SpeechRecognitionInstance = { lang: string; interimResults: boolean; start(): void;
      onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
      onend: (() => void) | null; onerror: (() => void) | null };
    type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setAssistantMessage("Reconhecimento de voz não disponível neste navegador. Digite a venda no campo de texto."); return; }
    const recognition = new Recognition(); recognition.lang = "pt-BR"; recognition.interimResults = false;
    recognition.onresult = (event) => setAssistantText(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false); recognition.onerror = () => setIsListening(false);
    setIsListening(true); recognition.start();
  }

  function interpretAdministrativeCommand(text = adminAssistantText) {
    const result = interpretAdminCommand(
      text,
      sales,
      perfumeCommerce.map((perfume) => ({ slug: perfumeSlug(perfume), name: perfume.name }))
    );
    setAdminAssistantPreview(result.preview);
    setAdminAssistantSaleId(result.preview.action?.saleId ?? "");
    setAdminAssistantSyncGoogle(result.preview.intent !== "registrar_vendas_lote");
    setAdminAssistantResult("");
  }

  function startAdminAssistantVoice() {
    type RecognitionInstance = {
      lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; abort(): void;
      onresult: ((event: { resultIndex: number; results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
      onend: (() => void) | null; onerror: ((event: { error?: string }) => void) | null;
    };
    type RecognitionConstructor = new () => RecognitionInstance;
    const speechWindow = window as typeof window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setAdminAssistantResult("Reconhecimento de voz não disponível neste navegador. Digite o comando no campo de texto.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      let interim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const text = event.results[index][0].transcript.trim();
        if (event.results[index].isFinal) adminVoiceFinalTranscriptRef.current = `${adminVoiceFinalTranscriptRef.current} ${text}`.trim();
        else interim = `${interim} ${text}`.trim();
      }
      const transcript = `${adminVoiceFinalTranscriptRef.current} ${interim}`.trim();
      adminVoiceTranscriptRef.current = transcript;
      setAdminAssistantText(transcript);
    };
    recognition.onend = () => {
      if (isAdminListeningManuallyRef.current) {
        adminVoiceFinalTranscriptRef.current = adminVoiceTranscriptRef.current;
        adminVoiceRestartTimerRef.current = window.setTimeout(() => {
          if (!isAdminListeningManuallyRef.current) return;
          try { recognition.start(); } catch { /* o navegador ainda está encerrando a sessão anterior */ }
        }, 250);
        return;
      }
      setIsAdminAssistantListening(false);
      adminRecognitionRef.current = null;
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        isAdminListeningManuallyRef.current = false;
        setIsAdminAssistantListening(false);
        adminRecognitionRef.current = null;
        setAdminAssistantResult("Permissão de microfone bloqueada. Libere o acesso ou digite o comando.");
      }
    };
    adminRecognitionRef.current = recognition;
    adminVoiceTranscriptRef.current = "";
    adminVoiceFinalTranscriptRef.current = "";
    isAdminListeningManuallyRef.current = true;
    setAdminAssistantResult("");
    setIsAdminAssistantListening(true);
    recognition.start();
  }

  function cancelAdminAssistantVoice() {
    isAdminListeningManuallyRef.current = false;
    if (adminVoiceRestartTimerRef.current) window.clearTimeout(adminVoiceRestartTimerRef.current);
    adminRecognitionRef.current?.abort();
    adminRecognitionRef.current = null;
    setIsAdminAssistantListening(false);
    setAdminAssistantText("");
    adminVoiceTranscriptRef.current = "";
    adminVoiceFinalTranscriptRef.current = "";
    setAdminAssistantPreview(null);
    setAdminAssistantResult("Comando de voz cancelado.");
  }

  function finishAdminAssistantVoice() {
    isAdminListeningManuallyRef.current = false;
    if (adminVoiceRestartTimerRef.current) window.clearTimeout(adminVoiceRestartTimerRef.current);
    adminRecognitionRef.current?.stop();
    adminRecognitionRef.current = null;
    setIsAdminAssistantListening(false);
    const transcript = adminVoiceTranscriptRef.current || adminAssistantText;
    window.setTimeout(() => interpretAdministrativeCommand(transcript), 0);
  }

  async function removeAssistantGoogleEvent(sale: Sale) {
    if (!sale.googleCalendarEventId) return true;
    try {
      const response = await fetch("/api/admin/google-calendar/remove-event", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: sale.googleCalendarEventId }),
      });
      if (!response.ok) throw new Error();
      setSales((current) => current.map((item) => item.id === sale.id ? {
        ...item, googleCalendarStatus: "removed", googleCalendarEventId: undefined,
        googleCalendarEventLink: undefined,
      } : item));
      return true;
    } catch {
      setGoogleMessage("A alteração foi salva, mas o lembrete não pôde ser removido do Google Agenda.");
      return false;
    }
  }

  async function confirmAdministrativeAction() {
    const action = adminAssistantPreview?.action;
    if (!action) return;
    const saleId = action.saleId ?? adminAssistantSaleId;

    if (action.type === "registrar_vendas_lote") {
      const batch = action.batchSales ?? [];
      if (!batch.length || batch.some((item) => !item.customerName || !item.perfumeSlug || item.unitPrice <= 0)) {
        setAdminAssistantResult("O lote possui vendas incompletas. Corrija o comando antes de confirmar.");
        return;
      }
      const requestedStock = batch.reduce((totals, item) => totals.set(item.perfumeSlug, (totals.get(item.perfumeSlug) ?? 0) + item.quantity), new Map<string, number>());
      const insufficient = [...requestedStock].find(([slug, quantity]) => (inventory.find((item) => item.perfumeSlug === slug)?.stockQuantity ?? 0) < quantity);
      if (insufficient) {
        const perfume = batch.find((item) => item.perfumeSlug === insufficient[0]);
        setAdminAssistantResult(`Estoque insuficiente para ${perfume?.perfumeName ?? "um dos perfumes"}. Nenhuma venda foi criada.`);
        return;
      }
      const createdSales: Sale[] = batch.map((batchSale) => {
        const perfume = perfumeCommerce.find((item) => perfumeSlug(item) === batchSale.perfumeSlug)!;
        const stored = inventory.find((item) => item.perfumeSlug === batchSale.perfumeSlug)!;
        const lineType = stored?.lineType ?? getSuggestedLineType(perfume);
        const item = createFlexibleItem({ id: createId(), perfumeSlug: batchSale.perfumeSlug, perfumeName: batchSale.perfumeName,
          lineType, quantity: batchSale.quantity, unitPrice: batchSale.unitPrice, originalUnitPrice: batchSale.unitPrice,
          unitCost: stored?.unitCost ?? getDefaultUnitCost(lineType), discountValue: 0, itemType: "sale" });
        const total = item.total;
        const paid = batchSale.status === "pago";
        return { id: createId(), customerName: batchSale.customerName, perfumeSlug: batchSale.perfumeSlug,
          perfumeName: batchSale.perfumeName, lineType, unitPrice: batchSale.unitPrice, unitCost: item.unitCost,
          estimatedProfit: total - item.unitCost * batchSale.quantity, quantity: batchSale.quantity,
          paymentMethod: paid && (batchSale.paymentMethod === "pix" || batchSale.paymentMethod === "dinheiro" || batchSale.paymentMethod === "cartao") ? batchSale.paymentMethod : "fiado",
          status: paid ? "pago" : "pendente", notes: [batchSale.identification, "Venda informada por comando do Assistente Administrativo"].filter(Boolean).join(" · "),
          collectionNote: batchSale.identification, createdAt: `${batchSale.saleDate}T12:00:00.000Z`, paidAt: paid ? batchSale.paidAt : undefined,
          expectedPaymentDate: paid ? undefined : batchSale.expectedPaymentDate, items: [item], subtotal: item.subtotal,
          discountValue: 0, totalAmount: total, amountPaid: paid ? total : 0, remainingAmount: paid ? 0 : total };
      });
      const now = new Date().toISOString();
      setSales((current) => [...createdSales, ...current]);
      setInventory((current) => current.map((item) => ({ ...item,
        stockQuantity: item.stockQuantity - (requestedStock.get(item.perfumeSlug) ?? 0),
        updatedAt: requestedStock.has(item.perfumeSlug) ? now : item.updatedAt })));
      setAdminAssistantResult(`${createdSales.length} venda(s) criada(s) com sucesso.`);
      setAdminAssistantPreview(null);
      if (adminAssistantSyncGoogle && googleStatus.connected) {
        for (const sale of createdSales.filter((item) => item.status !== "pago" && item.expectedPaymentDate)) await syncSaleWithGoogle(sale);
      }
      return;
    }

    if (action.candidateSaleIds?.length && !saleId) {
      setAdminAssistantResult("Escolha uma venda antes de confirmar.");
      return;
    }

    if (action.type === "registrar_uso_pessoal" || action.type === "registrar_brinde") {
      const perfume = perfumeCommerce.find((item) => perfumeSlug(item) === action.perfumeSlug);
      if (!perfume || !action.perfumeSlug || !action.perfumeName) {
        setAdminAssistantResult("Não foi possível localizar o perfume para registrar a retirada.");
        return;
      }
      const quantity = Math.max(1, action.quantity ?? 1);
      const stored = inventory.find((item) => item.perfumeSlug === action.perfumeSlug);
      if (!stored || stored.stockQuantity < quantity) {
        setAdminAssistantResult(`Estoque insuficiente para retirar ${quantity}x ${action.perfumeName}. Nenhum dado foi alterado.`);
        return;
      }
      const lineType = stored?.lineType ?? getSuggestedLineType(perfume);
      const now = new Date().toISOString();
      const item = createFlexibleItem({
        id: createId(), perfumeSlug: action.perfumeSlug, perfumeName: action.perfumeName,
        lineType, quantity, unitPrice: stored?.salePrice ?? getLinePrice(lineType),
        originalUnitPrice: stored?.salePrice ?? getLinePrice(lineType),
        unitCost: stored?.unitCost ?? getDefaultUnitCost(lineType), discountValue: 0,
        itemType: action.type === "registrar_brinde" ? "gift" : "personal_use",
      });
      const sale: Sale = {
        id: createId(), customerName: action.customerName || "Uso pessoal",
        perfumeSlug: action.perfumeSlug, perfumeName: action.perfumeName, lineType,
        unitPrice: item.unitPrice, unitCost: item.unitCost, estimatedProfit: -item.unitCost * quantity,
        quantity, paymentMethod: "pix", status: "pago",
        notes: action.type === "registrar_brinde" ? "Brinde registrado pelo Assistente Administrativo" : "Uso pessoal registrado pelo Assistente Administrativo",
        createdAt: now, paidAt: now, items: [item], subtotal: item.subtotal,
        discountValue: item.discountValue, totalAmount: 0, amountPaid: 0, remainingAmount: 0,
      };
      setSales((current) => [sale, ...current]);
      setInventory((current) => current.map((inventoryItem) => inventoryItem.perfumeSlug === action.perfumeSlug
        ? { ...inventoryItem, stockQuantity: Math.max(0, inventoryItem.stockQuantity - quantity), updatedAt: now }
        : inventoryItem));
      setAdminAssistantResult(`${quantity}x ${action.perfumeName} registrado como ${action.type === "registrar_brinde" ? "brinde" : "uso pessoal"}.`);
      setAdminAssistantPreview(null);
      return;
    }

    const selected = sales.find((sale) => sale.id === saleId);
    if (!selected) {
      setAdminAssistantResult("A venda escolhida não foi encontrada. Interprete o comando novamente.");
      return;
    }

    if (action.type === "remarcar_cobranca") {
      const updated = { ...selected, expectedPaymentDate: action.date };
      setSales((current) => current.map((sale) => sale.id === selected.id ? updated : sale));
      setAdminAssistantResult(`Cobrança de ${selected.customerName} remarcada para ${action.date}.`);
      if (adminAssistantSyncGoogle && selected.googleCalendarEventId && googleStatus.connected) await syncSaleWithGoogle(updated);
      setAdminAssistantPreview(null);
      return;
    }

    if (action.type === "registrar_pagamento") {
      const update = paymentUpdateForAction(selected, action);
      if (update.paidNow > getRemainingAmount(selected)) {
        setAdminAssistantResult("Valor pago maior que o saldo pendente. Corrija o comando antes de confirmar.");
        return;
      }
      const paidAt = `${action.date ?? toLocalDateInput()}T12:00:00.000Z`;
      const updated: Sale = {
        ...selected, status: update.status, amountPaid: update.amountPaid,
        remainingAmount: update.remainingAmount,
        paidAt,
        expectedPaymentDate: update.status === "pago" ? undefined : action.expectedPaymentDate ?? selected.expectedPaymentDate,
        paymentMethod: action.paymentMethod === "pix" || action.paymentMethod === "dinheiro" || action.paymentMethod === "cartao"
          ? action.paymentMethod : selected.paymentMethod,
        expectedPaymentMethod: update.status === "pago" ? selected.expectedPaymentMethod : action.paymentMethod ?? selected.expectedPaymentMethod,
      };
      setSales((current) => current.map((sale) => sale.id === selected.id ? updated : sale));
      setAdminAssistantResult(update.status === "pago"
        ? `Pagamento confirmado. A venda de ${selected.customerName} foi quitada.`
        : `Pagamento parcial confirmado. Saldo atual: ${formatCurrency(update.remainingAmount)}.`);
      if (adminAssistantSyncGoogle && selected.googleCalendarEventId) {
        if (update.status === "pago") await removeAssistantGoogleEvent(selected);
        else if (googleStatus.connected && updated.expectedPaymentDate) await syncSaleWithGoogle(updated);
      }
      setAdminAssistantPreview(null);
      return;
    }

    if (action.resolution === "remove_reminder") {
      const updated: Sale = { ...selected, expectedPaymentDate: undefined };
      setSales((current) => current.map((sale) => sale.id === selected.id ? updated : sale));
      setAdminAssistantResult(`O lembrete de cobrança de ${selected.customerName} foi cancelado. A venda continua pendente.`);
      if (adminAssistantSyncGoogle && selected.googleCalendarEventId) await removeAssistantGoogleEvent(selected);
      setAdminAssistantPreview(null);
      return;
    }

    const total = getSaleTotal(selected);
    const updated: Sale = { ...selected, status: "pago", paidAt: `${action.date ?? toLocalDateInput()}T12:00:00.000Z`, amountPaid: total, remainingAmount: 0, expectedPaymentDate: undefined };
    setSales((current) => current.map((sale) => sale.id === selected.id ? updated : sale));
    setAdminAssistantResult(`A cobrança de ${selected.customerName} foi marcada como recebida.`);
    if (adminAssistantSyncGoogle && selected.googleCalendarEventId) await removeAssistantGoogleEvent(selected);
    setAdminAssistantPreview(null);
  }

  function registerSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const customerName = saleForm.customerName.trim();

    if (!customerName) {
      return;
    }

    if (saleCart.length === 0) {
      setSaleNotice("Adicione pelo menos um perfume ao carrinho antes de registrar.");
      return;
    }
    const now = new Date().toISOString();
    const requestedPaid = saleForm.status === "pago" ? cartTotals.totalAmount : saleForm.amountPaid;
    const totals = calculateFlexibleSale(saleCart, requestedPaid);
    const status: SaleStatus = totals.remainingAmount <= 0 ? "pago"
      : totals.amountPaid > 0 ? "partial" : saleForm.status === "fiado" ? "fiado" : "pendente";
    const firstItem = saleCart[0];
    const sale: Sale = {
      id: createId(),
      customerName,
      perfumeSlug: firstItem.perfumeSlug ?? "",
      perfumeName: firstItem.perfumeName,
      lineType: firstItem.lineType === "outro" ? "tradicional" : firstItem.lineType,
      unitPrice: firstItem.unitPrice,
      unitCost: firstItem.unitCost,
      estimatedProfit: totals.estimatedProfit,
      quantity: totals.totalQuantity,
      paymentMethod: saleForm.paymentMethod,
      status,
      notes: saleForm.notes.trim(),
      createdAt: now,
      paidAt: status === "pago" ? now : undefined,
      customerPhone: saleForm.customerPhone.trim() || undefined,
      expectedPaymentDate: saleForm.expectedPaymentDate || undefined,
      expectedPaymentMethod: saleForm.expectedPaymentMethod,
      collectionNote: saleForm.collectionNote.trim() || undefined,
      items: saleCart,
      subtotal: totals.subtotal,
      discountValue: totals.discountValue,
      totalAmount: totals.totalAmount,
      amountPaid: totals.amountPaid,
      remainingAmount: totals.remainingAmount,
    };

    setSales((currentSales) => [sale, ...currentSales]);

    const consumedBySlug = saleCart.reduce<Record<string, number>>((result, item) => {
      if (item.perfumeSlug) result[item.perfumeSlug] = (result[item.perfumeSlug] ?? 0) + item.quantity;
      return result;
    }, {});
    setInventory((currentInventory) => currentInventory.map((item) => consumedBySlug[item.perfumeSlug]
      ? { ...item, stockQuantity: Math.max(0, item.stockQuantity - consumedBySlug[item.perfumeSlug]), updatedAt: now }
      : item));
    setSaleNotice("");

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

  async function syncSaleWithGoogle(sale: Sale) {
    setGoogleBusy(true); setGoogleMessage("");
    try {
      const response = await fetch("/api/admin/google-calendar/sync-sale", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sale }) });
      const data = await response.json() as { ok?: boolean; message?: string; eventId?: string; eventLink?: string; syncedAt?: string; status?: string };
      if (!response.ok || !data.ok) throw new Error(data.message || "Não foi possível criar o lembrete.");
      setSales((current) => current.map((item) => item.id === sale.id ? { ...item,
        googleCalendarEventId: data.eventId, googleCalendarEventLink: data.eventLink,
        googleCalendarSyncedAt: data.syncedAt, googleCalendarStatus: data.status } : item));
      setGoogleMessage("Lembrete sincronizado com o Google Agenda.");
    } catch (error) { setGoogleMessage(error instanceof Error ? error.message : "Falha ao sincronizar lembrete."); }
    finally { setGoogleBusy(false); }
  }

  async function syncPendingWithGoogle() {
    setGoogleBusy(true); setGoogleMessage("");
    try {
      const response = await fetch("/api/admin/google-calendar/sync-pending", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sales }) });
      const data = await response.json() as { ok?: boolean; message?: string; results?: Array<{ saleId: string; eventId?: string; eventLink?: string; syncedAt?: string; status?: string; error?: string }> };
      if (!response.ok || !data.ok) throw new Error(data.message || "Não foi possível sincronizar cobranças.");
      const byId = new Map((data.results ?? []).filter((item) => !item.error).map((item) => [item.saleId, item]));
      setSales((current) => current.map((sale) => { const result = byId.get(sale.id); return result ? { ...sale,
        googleCalendarEventId: result.eventId, googleCalendarEventLink: result.eventLink,
        googleCalendarSyncedAt: result.syncedAt, googleCalendarStatus: result.status } : sale; }));
      const failures = (data.results ?? []).filter((item) => item.error).length;
      setGoogleMessage(`${byId.size} lembrete(s) sincronizado(s)${failures ? `; ${failures} falharam` : ""}.`);
    } catch (error) { setGoogleMessage(error instanceof Error ? error.message : "Falha ao sincronizar cobranças."); }
    finally { setGoogleBusy(false); }
  }

  async function disconnectGoogle() {
    if (!window.confirm("Desconectar a conta Google Agenda?")) return;
    setGoogleBusy(true);
    try { const response = await fetch("/api/admin/google-calendar/disconnect", { method: "POST" }); if (!response.ok) throw new Error();
      setGoogleStatus({ connected: false }); setGoogleMessage("Google Agenda desconectado."); }
    catch { setGoogleMessage("Não foi possível desconectar o Google Agenda."); }
    finally { setGoogleBusy(false); }
  }

  async function markAsPaid(saleId: string) {
    const now = new Date().toISOString();
    const selected = sales.find((sale) => sale.id === saleId);

    setSales((currentSales) =>
      currentSales.map((sale) =>
        sale.id === saleId
          ? {
              ...sale,
              status: "pago",
              paidAt: sale.paidAt ?? now,
              amountPaid: getSaleTotal(sale),
              remainingAmount: 0,
            }
          : sale
      )
    );
    if (selected?.googleCalendarEventId && window.confirm("Remover também o lembrete do Google Agenda?")) {
      try { const response = await fetch("/api/admin/google-calendar/remove-event", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: selected.googleCalendarEventId }) });
        if (!response.ok) throw new Error("Falha ao remover evento");
        setSales((current) => current.map((sale) => sale.id === saleId ? { ...sale, googleCalendarStatus: "removed", googleCalendarEventId: undefined, googleCalendarEventLink: undefined } : sale));
      } catch { setGoogleMessage("Venda recebida, mas o lembrete não pôde ser removido."); }
    }
  }

  function editExpectedPaymentDate(sale: Sale) {
    const value = window.prompt(
      "Nova data prevista (AAAA-MM-DD). Deixe vazio para remover:",
      sale.expectedPaymentDate ?? ""
    );
    if (value === null) return;
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      window.alert("Use uma data válida no formato AAAA-MM-DD.");
      return;
    }
    setSales((current) => current.map((item) =>
      item.id === sale.id ? { ...item, expectedPaymentDate: value || undefined } : item
    ));
  }

  async function openCollectionMessage(sale: Sale) {
    if (sale.customerPhone) {
      window.open(createWhatsAppCollectionUrl(sale), "_blank", "noopener,noreferrer");
      return;
    }
    await copyTextToClipboard(createCollectionMessage(sale));
    window.alert("Mensagem copiada. Cadastre um telefone para abrir o WhatsApp diretamente.");
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
      ["ID", "Cliente", "Resumo dos itens", "Quantidade total", "Subtotal",
        "Desconto", "Total", "Pago", "Pendente", "Forma de pagamento", "Status",
        "Data", "Pago em", "Data prevista", "Telefone", "Observação", "Observação de cobrança"],
      ...sales.map((sale) => [
        sale.id,
        sale.customerName,
        summarizeSaleItems(sale),
        getSaleItems(sale).reduce((sum, item) => sum + item.quantity, 0),
        (sale.subtotal ?? getSaleTotal(sale)).toFixed(2),
        (sale.discountValue ?? 0).toFixed(2),
        getSaleTotal(sale).toFixed(2),
        (sale.amountPaid ?? (sale.status === "pago" ? getSaleTotal(sale) : 0)).toFixed(2),
        getRemainingAmount(sale).toFixed(2),
        paymentOptions.find((option) => option.value === sale.paymentMethod)
          ?.label ?? sale.paymentMethod,
        statusOptions.find((option) => option.value === sale.status)?.label ??
          sale.status,
        sale.createdAt,
        sale.paidAt ?? "",
        sale.expectedPaymentDate ?? "",
        sale.customerPhone ?? "",
        sale.notes,
        sale.collectionNote ?? "",
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
  const totalForDate = (date: string) => sales
    .filter((sale) => sale.status !== "pago" && sale.expectedPaymentDate === date)
    .reduce((total, sale) => total + getRemainingAmount(sale), 0);
  const dashboardCards: SummaryCard[] = [
    { label: "Recebido", value: formatCurrency(summary.totalReceived), icon: "paid", tone: "emerald" },
    { label: "Pendente", value: formatCurrency(summary.totalPending), icon: "pending", tone: "gold" },
    { label: "Atrasado", value: formatCurrency(receivables.summary.overdue), icon: "overdue", tone: "red" },
    { label: "Próximo dia 5", value: formatCurrency(totalForDate(nextDayOfMonth(5))), icon: "calendar", tone: "blue" },
    { label: "Próximo dia 15", value: formatCurrency(totalForDate(nextDayOfMonth(15))), icon: "calendar", tone: "blue" },
    { label: "Estoque total", value: String(inventory.reduce((total, item) => total + item.stockQuantity, 0)), icon: "stock", tone: "gold" },
    { label: "Lucro estimado", value: formatCurrency(summary.estimatedProfit), icon: "profit", tone: "emerald" },
  ];
  const intentLabels: Record<string, string> = {
    registrar_vendas_lote: "Vendas em lote",
    registrar_pagamento: "Pagamento", consultar_pendencias: "Consulta", consultar_cobrancas_por_data: "Cobrança",
    remarcar_cobranca: "Remarcação", cancelar_cobranca_ou_marcar_recebido: "Lembrete",
    registrar_uso_pessoal: "Uso pessoal", registrar_brinde: "Brinde", ajuda: "Ajuda", desconhecido: "Revisar comando",
  };

  return (
    <main className="min-h-screen scroll-smooth bg-[radial-gradient(circle_at_top,_rgba(196,154,68,0.10),_transparent_32rem)] text-stone-100">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-8 sm:py-8 lg:px-12">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-emerald-200">● Dados locais ativos</span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-stone-400">Custos e lucros estimados</span>
          <span className={`rounded-full border px-3 py-2 ${googleStatus.connected ? "border-blue-400/20 bg-blue-400/10 text-blue-200" : "border-white/10 bg-white/[0.04] text-stone-400"}`}>{googleStatus.connected ? "● Google conectado" : "Google desconectado"}</span>
        </div>

        <header className="flex flex-col justify-between gap-5 rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/10 via-white/[0.035] to-transparent p-5 sm:p-7 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">
              AMARO DOS REIS · Painel interno
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-5xl">
              Seu centro de comando
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-stone-400 sm:text-base">
              Vendas, recebimentos e estoque em uma visão rápida.
            </p>
            <a href="#assistente-administrativo" className="mt-5 inline-flex min-h-12 items-center gap-3 rounded-xl bg-gold px-5 text-sm font-bold text-black transition hover:bg-gold-light">
              <AdminIcon name="assistant" /> Abrir Assistente Administrativo
            </a>
          </div>
          <div className="grid gap-3 lg:justify-items-end">
            <form action="/api/admin/logout" method="post">
              <button type="submit" className="min-h-11 rounded-xl border border-white/20 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-stone-300 transition hover:border-gold/45 hover:text-gold-light">Sair do painel</button>
            </form>
            <details className="group w-full rounded-xl border border-white/10 bg-black/30 p-3 lg:max-w-md">
              <summary className="cursor-pointer list-none text-xs font-semibold text-stone-300">Dados, exportações e segurança <span className="float-right text-gold group-open:rotate-180">⌄</span></summary>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
            </details>
            <p className="max-w-xl text-xs leading-5 text-stone-500 lg:text-right">
              Antes de apagar informações, exporte um backup completo.
            </p>
          </div>
        </header>

        <section aria-labelledby="acoes-rapidas-title">
          <div className="mb-3 flex items-center justify-between"><h2 id="acoes-rapidas-title" className="text-sm font-semibold text-white">Ações rápidas</h2><span className="text-xs text-stone-500">Toque para navegar</span></div>
          <AdminQuickActions />
        </section>

        <AdminSummaryCards cards={dashboardCards} />

        <section id="google-agenda" className="scroll-mt-24 rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-black/50 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">Lembretes no celular</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Google Agenda</h2>
              <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-stone-400 sm:block">
                {googleStatus.connected ? `Conectado${googleStatus.connectedEmail ? ` como ${googleStatus.connectedEmail}` : ""}.` : "Nenhuma conta Google conectada."}
                {" "}As notificações aparecerão no celular quando estiverem ativadas no aplicativo Google Agenda.
              </p>
            </div>
            <div className="grid gap-2 sm:flex sm:flex-wrap">
              {!googleStatus.connected ? (
                <a href="/api/admin/google-calendar/connect" className="inline-flex min-h-12 items-center justify-center rounded-md bg-blue-400 px-5 text-xs font-bold uppercase tracking-[0.14em] text-black">Conectar Google Agenda</a>
              ) : (
                <>
                  <button type="button" onClick={() => void syncPendingWithGoogle()} disabled={googleBusy} className="min-h-12 rounded-md bg-blue-400 px-5 text-xs font-bold uppercase tracking-[0.14em] text-black disabled:opacity-50">Sincronizar cobranças pendentes</button>
                  <button type="button" onClick={() => void disconnectGoogle()} disabled={googleBusy} className="min-h-12 rounded-md border border-red-400/30 px-5 text-xs font-bold uppercase tracking-[0.14em] text-red-200 disabled:opacity-50">Desconectar</button>
                </>
              )}
            </div>
          </div>
          {googleMessage ? <p className="mt-4 rounded-md border border-white/10 bg-black/40 p-3 text-sm text-stone-300">{googleMessage}</p> : null}
        </section>

        <section id="assistente-administrativo" className="relative scroll-mt-24 overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-400/[0.14] via-white/[0.035] to-black p-5 shadow-2xl shadow-emerald-950/30 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-300 text-black"><AdminIcon name="assistant" className="h-6 w-6" /></span>
            <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">Centro de comando · local e seguro</p>
              <h2 className="mt-1 text-2xl font-semibold text-white sm:text-4xl">Assistente Administrativo</h2>
              <p className="mt-2 text-sm text-stone-400">Fale ou digite. Você sempre revisa antes de salvar.</p></div>
          </div>
          <textarea
            value={adminAssistantText}
            onChange={(event) => { setAdminAssistantText(event.target.value); setAdminAssistantPreview(null); setAdminAssistantResult(""); }}
            rows={3}
            placeholder="Ex.: Caique pagou ontem via Pix os 24 reais que estava devendo"
            className="relative mt-6 min-h-28 w-full resize-none rounded-2xl border border-emerald-400/25 bg-black/70 px-5 py-4 text-base text-white shadow-inner outline-none transition placeholder:text-stone-600 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-400/10"
          />
          {!isAdminAssistantListening ? <div className="mt-3 grid grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={startAdminAssistantVoice} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-5 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/20"><AdminIcon name="mic" /> Falar</button>
            <button type="button" onClick={() => interpretAdministrativeCommand()} disabled={!adminAssistantText.trim()}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 text-sm font-bold text-black transition hover:bg-emerald-200 disabled:opacity-40"><AdminIcon name="check" /> Interpretar</button>
          </div> : (
            <div role="status" aria-live="polite" className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-300/35 bg-black/80 p-3 shadow-xl shadow-black/40">
              <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-300 text-black"><span className="absolute inset-0 animate-ping rounded-full bg-emerald-300/30"/><AdminIcon name="mic" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-white">Ouvindo…</p><p className="truncate text-xs text-stone-400">Pode pausar e continuar. Termine quando quiser.</p></div>
              <button type="button" onClick={cancelAdminAssistantVoice} aria-label="Cancelar comando de voz" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-red-400/35 text-red-200 transition hover:bg-red-400/15"><AdminIcon name="close" /></button>
              <button type="button" onClick={finishAdminAssistantVoice} aria-label="Concluir e interpretar comando de voz" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-300 text-black transition hover:bg-emerald-200"><AdminIcon name="check" /></button>
            </div>
          )}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap">
            {["Quem está me devendo?", "Quem tenho que cobrar hoje?", "Caique pagou 24 no Pix ontem", "Remarca a cobrança da Suzana para dia 15"].map((example) => (
              <button key={example} type="button" onClick={() => { setAdminAssistantText(example); interpretAdministrativeCommand(example); }}
                className="min-h-10 shrink-0 rounded-full border border-white/15 bg-white/[0.035] px-3 text-xs text-stone-300 hover:border-emerald-400/40">
                {example}
              </button>
            ))}
          </div>

          {adminAssistantPreview ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/60 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-300 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-black">{intentLabels[adminAssistantPreview.intent]}</span><h3 className="font-semibold text-white">{adminAssistantPreview.title}</h3></div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${adminAssistantPreview.confidence === "alta" ? "border-emerald-400/30 text-emerald-300" : adminAssistantPreview.confidence === "media" ? "border-amber-400/30 text-amber-200" : "border-red-400/30 text-red-200"}`}>
                  Confiança {adminAssistantPreview.confidence}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-300">{adminAssistantPreview.message}</p>
              {adminAssistantPreview.action?.batchSales?.length ? (
                <div className="mt-5 grid gap-3 lg:grid-cols-2">
                  {adminAssistantPreview.action.batchSales.map((sale, index) => (
                    <article key={`${sale.customerName}-${sale.perfumeSlug}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex items-center justify-between gap-3"><p className="font-semibold text-white">Venda {index + 1} · {sale.customerName}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${sale.status === "pago" ? "bg-emerald-400/15 text-emerald-300" : "bg-gold/15 text-gold-light"}`}>{sale.status}</span></div>
                      {sale.identification ? <p className="mt-1 text-xs text-blue-200">{sale.identification}</p> : null}
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div><p className="text-xs text-stone-500">Perfume</p><p className="mt-1 text-stone-200">{sale.quantity}x {sale.perfumeName}</p></div>
                        <div><p className="text-xs text-stone-500">Valor</p><p className="mt-1 font-semibold text-gold-light">{formatCurrency(sale.unitPrice * sale.quantity)}</p></div>
                        <div><p className="text-xs text-stone-500">Data da venda</p><p className="mt-1 text-stone-200">{formatReceivableDate(sale.saleDate)}</p></div>
                        <div><p className="text-xs text-stone-500">Recebimento</p><p className="mt-1 text-stone-200">{sale.status === "pago" ? `À vista · ${sale.paymentMethod ?? "outro"}` : formatReceivableDate(sale.expectedPaymentDate)}</p></div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
              {adminAssistantPreview.warnings.map((warning) => (
                <p key={warning} className="mt-3 rounded-md border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100">{warning}</p>
              ))}
              {adminAssistantPreview.action?.candidateSaleIds && adminAssistantPreview.action.candidateSaleIds.length > 1 ? (
                <label className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Escolha a venda</span>
                  <select value={adminAssistantSaleId} onChange={(event) => setAdminAssistantSaleId(event.target.value)}
                    className="mt-2 w-full rounded-md border border-emerald-400/25 bg-black px-4 py-3 text-sm text-white outline-none">
                    <option value="">Selecione a pendência correta</option>
                    {adminAssistantPreview.matches.map((sale) => (
                      <option key={sale.id} value={sale.id}>
                        {new Date(sale.createdAt).toLocaleDateString("pt-BR")} — {summarizeSaleItems(sale)} — {formatCurrency(getRemainingAmount(sale))}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {adminAssistantPreview.intent === "registrar_vendas_lote" && googleStatus.connected
                && adminAssistantPreview.action?.batchSales?.some((sale) => sale.status !== "pago" && sale.expectedPaymentDate) ? (
                <label className="mt-4 flex items-center gap-3 rounded-md border border-blue-400/20 bg-blue-400/10 p-3 text-sm text-blue-100">
                  <input type="checkbox" checked={adminAssistantSyncGoogle} onChange={(event) => setAdminAssistantSyncGoogle(event.target.checked)} />
                  Criar lembretes das vendas pendentes no Google Agenda
                </label>
              ) : null}
              {adminAssistantPreview.requiresConfirmation && (() => {
                const selected = sales.find((sale) => sale.id === (adminAssistantPreview.action?.saleId ?? adminAssistantSaleId));
                if (!selected?.googleCalendarEventId) return null;
                const label = adminAssistantPreview.intent === "remarcar_cobranca" || (adminAssistantPreview.intent === "registrar_pagamento" && adminAssistantPreview.action?.remainingAfter !== undefined)
                  ? "Atualizar lembrete no Google Agenda" : "Remover lembrete do Google Agenda";
                return (
                  <label className="mt-4 flex items-center gap-3 rounded-md border border-blue-400/20 bg-blue-400/10 p-3 text-sm text-blue-100">
                    <input type="checkbox" checked={adminAssistantSyncGoogle} onChange={(event) => setAdminAssistantSyncGoogle(event.target.checked)} />
                    {label}
                  </label>
                );
              })()}
              {adminAssistantPreview.requiresConfirmation ? (
                <div className="mt-5 grid grid-cols-2 gap-2 sm:flex">
                  <button type="button" onClick={() => { setAdminAssistantPreview(null); setAdminAssistantResult("Ação cancelada. Nenhum dado foi alterado."); }}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-xs font-bold uppercase tracking-[0.12em] text-stone-300"><AdminIcon name="close" /> Cancelar
                  </button>
                  <button type="button" onClick={() => void confirmAdministrativeAction()}
                    disabled={Boolean(adminAssistantPreview.action?.candidateSaleIds?.length && !adminAssistantPreview.action.saleId && !adminAssistantSaleId)}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-300 px-5 text-xs font-bold uppercase tracking-[0.12em] text-black disabled:opacity-40"><AdminIcon name="check" /> {adminAssistantPreview.intent === "registrar_vendas_lote" ? "Confirmar criação das vendas" : "Confirmar ação"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {adminAssistantResult ? <p className="mt-4 rounded-md border border-emerald-400/20 bg-black/40 p-3 text-sm text-emerald-100">{adminAssistantResult}</p> : null}
        </section>

        <section id="agenda-recebimentos" className="scroll-mt-28 rounded-xl border border-gold/25 bg-white/[0.04] p-5 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-gold">Controle de cobranças</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Agenda de Recebimentos</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-400">Acompanhe pagamentos, atrasos e próximos recebimentos sem sair do painel.</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              ["Total a receber", formatCurrency(receivables.summary.totalPending)],
              ["Recebimentos de hoje", formatCurrency(receivables.summary.today)],
              ["Próximos 7 dias", formatCurrency(receivables.summary.nextSevenDays)],
              ["Atrasados", formatCurrency(receivables.summary.overdue)],
              ["Recebidos no mês", formatCurrency(receivables.summary.receivedThisMonth)],
              ["Clientes pendentes", String(receivables.summary.pendingCustomers)],
            ].map(([label, value]) => (
              <article key={label} className="rounded-lg border border-gold/15 bg-black/45 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-500">{label}</p>
                <p className="mt-3 text-xl font-semibold text-gold-light">{value}</p>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-7">
            {([
              ["Atrasados", receivables.groups.atrasados, "text-red-300"],
              ["Hoje", receivables.groups.hoje, "text-gold-light"],
              ["Próximos 7 dias", receivables.groups.proximos, "text-gold-light"],
              ["Próximo pagamento", receivables.groups.pagamento, "text-stone-200"],
              ["Sem data definida", receivables.groups.semData, "text-stone-300"],
              ["Recebidos", receivables.groups.recebidos, "text-emerald-300"],
            ] as [string, Sale[], string][]).map(([title, items, titleClass]) => (
              <div key={title}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className={`text-xl font-semibold ${titleClass}`}>{title}</h3>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-400">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-white/10 p-5 text-sm text-stone-500">Nenhum recebimento neste grupo.</p>
                ) : (
                  <div className="mt-3 grid gap-4 lg:grid-cols-2">
                    {items.map((sale) => (
                      <article key={`${title}-${sale.id}`} className="rounded-xl border border-white/10 bg-black/55 p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                          <div>
                            <p className="text-lg font-semibold text-white">{sale.customerName}</p>
                            <p className="mt-1 text-sm text-stone-400">{summarizeSaleItems(sale)}</p>
                          </div>
                          <span className={`w-fit rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] ${sale.status === "pago" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : sale.status === "fiado" ? "border-orange-400/30 bg-orange-400/10 text-orange-200" : "border-gold/30 bg-gold/10 text-gold-light"}`}>
                            {sale.status}
                          </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                          <div><p className="text-xs text-stone-500">{sale.status === "pago" ? "Valor total" : "Valor pendente"}</p><p className="mt-1 font-semibold text-gold-light">{formatCurrency(sale.status === "pago" ? getSaleTotal(sale) : getRemainingAmount(sale))}</p></div>
                          <div><p className="text-xs text-stone-500">Data prevista</p><p className="mt-1 text-stone-200">{formatReceivableDate(sale.expectedPaymentDate)}</p></div>
                          <div><p className="text-xs text-stone-500">Forma prevista</p><p className="mt-1 text-stone-200">{expectedPaymentMethodLabel(sale.expectedPaymentMethod)}</p></div>
                          <div><p className="text-xs text-stone-500">Telefone</p><p className="mt-1 text-stone-200">{sale.customerPhone || "Não informado"}</p></div>
                        </div>
                        {sale.collectionNote || sale.notes ? <p className="mt-4 rounded-md bg-white/[0.04] p-3 text-sm leading-6 text-stone-400">{sale.collectionNote || sale.notes}</p> : null}
                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <button type="button" disabled={sale.status === "pago"} onClick={() => markAsPaid(sale.id)} className="min-h-11 rounded-md border border-emerald-400/30 px-3 text-xs font-semibold text-emerald-300 disabled:opacity-40">Marcar como recebido</button>
                          <button type="button" onClick={() => editExpectedPaymentDate(sale)} className="min-h-11 rounded-md border border-gold/30 px-3 text-xs font-semibold text-gold-light">Editar data</button>
                          <button type="button" onClick={() => void openCollectionMessage(sale)} className="min-h-11 rounded-md border border-emerald-400/30 px-3 text-xs font-semibold text-emerald-300">Mensagem WhatsApp</button>
                          <button type="button" disabled={!googleStatus.connected || googleBusy || sale.status === "pago" || !sale.expectedPaymentDate} onClick={() => void syncSaleWithGoogle(sale)} className="min-h-11 rounded-md border border-blue-400/30 px-3 text-xs font-semibold text-blue-200 disabled:opacity-40">{sale.googleCalendarEventId ? "Atualizar lembrete no Google Agenda" : "Criar lembrete no Google Agenda"}</button>
                        </div>
                        {sale.googleCalendarEventId ? <div className="mt-3 flex flex-wrap items-center gap-3 text-xs"><span className="text-emerald-300">Lembrete criado</span>{sale.googleCalendarEventLink ? <a href={sale.googleCalendarEventLink} target="_blank" rel="noreferrer" className="text-blue-300 underline">Abrir no Google Agenda</a> : null}</div> : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

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

        <section className="rounded-xl border border-gold/25 bg-gradient-to-br from-gold/10 to-black/40 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">Cadastro por texto ou voz</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Assistente rápido de venda</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-400">Descreva a venda. O assistente monta apenas uma prévia no carrinho para você revisar.</p>
          <textarea value={assistantText} onChange={(event) => setAssistantText(event.target.value)} rows={3}
            placeholder="Vendi para Fábio 1 Sultan Noir pago no pix e 1 Moon Candy fiado para dia 15"
            className="mt-5 w-full resize-none rounded-lg border border-gold/25 bg-black/70 px-4 py-3 text-white outline-none focus:border-gold" />
          <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap">
            <button type="button" onClick={applyAssistantPreview} disabled={!assistantText.trim()} className="min-h-12 rounded-md bg-gold px-5 text-xs font-bold uppercase tracking-[0.15em] text-black disabled:opacity-40">Montar prévia</button>
            <button type="button" onClick={startVoiceInput} disabled={isListening} className="min-h-12 rounded-md border border-gold/40 px-5 text-xs font-bold uppercase tracking-[0.15em] text-gold-light disabled:opacity-50">{isListening ? "Ouvindo..." : "Falar venda"}</button>
          </div>
          {assistantMessage ? <p className="mt-4 rounded-md border border-white/10 bg-black/40 p-3 text-sm text-stone-300">{assistantMessage}</p> : null}
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
                  Telefone do cliente (opcional)
                </span>
                <input
                  type="tel"
                  value={saleForm.customerPhone}
                  onChange={(event) => setSaleForm((current) => ({ ...current, customerPhone: event.target.value }))}
                  placeholder="5592999999999"
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
                        manualUnitPrice: getLinePrice(event.target.value as LineType),
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
                    Preço unitário (editável)
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={saleForm.manualUnitPrice}
                    onChange={(event) => setSaleForm((current) => ({ ...current, manualUnitPrice: clampNumber(event.target.value, saleUnitPrice) }))}
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-gold-light outline-none focus:border-gold"
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
                    value={formatCurrency(Math.max(0, saleForm.manualUnitPrice * saleForm.quantity - saleForm.itemDiscountValue))}
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
                      Math.max(0, saleForm.manualUnitPrice * saleForm.quantity - saleForm.itemDiscountValue) - saleUnitCost * saleForm.quantity
                    )}
                    readOnly
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black/70 px-4 py-3 text-sm text-gold-light outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Desconto deste item (R$)</span>
                  <input type="number" min={0} step="0.01" value={saleForm.itemDiscountValue}
                    onChange={(event) => setSaleForm((current) => ({ ...current, itemDiscountValue: clampNumber(event.target.value) }))}
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none focus:border-gold" />
                </label>
                <label>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Tipo do item</span>
                  <select value={saleForm.itemType} onChange={(event) => setSaleForm((current) => ({ ...current, itemType: event.target.value as SaleItemType }))}
                    className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none focus:border-gold">
                    {(["sale", "gift", "personal_use", "sample", "exchange"] as SaleItemType[]).map((type) => <option key={type} value={type}>{itemTypeLabel(type)}</option>)}
                  </select>
                </label>
              </div>

              <button type="button" onClick={addItemToCart} className="min-h-12 rounded-md border border-gold/45 bg-gold/10 px-5 text-xs font-bold uppercase tracking-[0.16em] text-gold-light">
                Adicionar perfume ao carrinho
              </button>

              <div className="rounded-lg border border-gold/20 bg-black/40 p-4">
                <div className="flex items-center justify-between"><h3 className="font-semibold text-white">Carrinho da venda</h3><span className="text-xs text-stone-400">{saleCart.length} item(ns)</span></div>
                <div className="mt-3 grid gap-2">
                  {saleCart.length === 0 ? <p className="text-sm text-stone-500">Adicione um ou mais perfumes antes de registrar.</p> : saleCart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-white/10 p-3">
                      <div><p className="text-sm font-semibold text-white">{item.quantity}x {item.perfumeName}</p><p className="mt-1 text-xs text-stone-400">{itemTypeLabel(item.itemType)} · {formatCurrency(item.total)}{item.discountValue ? ` · desconto ${formatCurrency(item.discountValue)}` : ""}</p></div>
                      <button type="button" onClick={() => setSaleCart((current) => current.filter((stored) => stored.id !== item.id))} className="min-h-10 rounded-md border border-red-400/30 px-3 text-xs text-red-200">Remover</button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div><p className="text-xs text-stone-500">Subtotal</p><p className="mt-1 text-white">{formatCurrency(cartTotals.subtotal)}</p></div>
                  <div><p className="text-xs text-stone-500">Desconto</p><p className="mt-1 text-white">{formatCurrency(cartTotals.discountValue)}</p></div>
                  <div><p className="text-xs text-stone-500">Total final</p><p className="mt-1 font-semibold text-gold-light">{formatCurrency(cartTotals.totalAmount)}</p></div>
                  <div><p className="text-xs text-stone-500">Custo / lucro</p><p className="mt-1 text-white">{formatCurrency(cartTotals.estimatedCost)} / {formatCurrency(cartTotals.estimatedProfit)}</p></div>
                  <div><p className="text-xs text-stone-500">Perfumes</p><p className="mt-1 text-white">{cartTotals.totalQuantity}</p></div>
                  <div><p className="text-xs text-stone-500">Itens</p><p className="mt-1 text-white">{cartTotals.itemCount}</p></div>
                </div>
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
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Valor pago agora</span>
                <input type="number" min={0} step="0.01" value={saleForm.status === "pago" ? cartTotals.totalAmount : saleForm.amountPaid}
                  disabled={saleForm.status === "pago"}
                  onChange={(event) => setSaleForm((current) => ({ ...current, amountPaid: clampNumber(event.target.value) }))}
                  className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none focus:border-gold disabled:text-emerald-300" />
                <p className="mt-2 text-xs text-stone-500">Restante calculado: {formatCurrency(saleForm.status === "pago" ? 0 : calculateFlexibleSale(saleCart, saleForm.amountPaid).remainingAmount)}</p>
              </label>

              <div className="rounded-lg border border-gold/20 bg-black/35 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                  Planejamento do recebimento
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Data prevista</span>
                    <input
                      type="date"
                      value={saleForm.expectedPaymentDate}
                      onChange={(event) => setSaleForm((current) => ({ ...current, expectedPaymentDate: event.target.value }))}
                      className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none focus:border-gold"
                    />
                  </label>
                  <label>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Forma prevista</span>
                    <select
                      value={saleForm.expectedPaymentMethod}
                      onChange={(event) => setSaleForm((current) => ({ ...current, expectedPaymentMethod: event.target.value as ExpectedPaymentMethod }))}
                      className="mt-2 w-full rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none focus:border-gold"
                    >
                      {expectedPaymentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </label>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {[
                    ["Hoje", toLocalDateInput()],
                    ["Dia 5 — próximo pagamento", nextDayOfMonth(5)],
                    ["Dia 15", nextDayOfMonth(15)],
                  ].map(([label, value]) => (
                    <button key={label} type="button" onClick={() => setSaleForm((current) => ({ ...current, expectedPaymentDate: value, expectedPaymentMethod: label.includes("pagamento") ? "salario" : current.expectedPaymentMethod }))} className="min-h-11 rounded-md border border-gold/30 px-3 text-xs font-semibold text-gold-light transition hover:border-gold">
                      {label}
                    </button>
                  ))}
                  <button type="button" onClick={() => document.querySelector<HTMLInputElement>('input[type="date"]')?.showPicker?.()} className="min-h-11 rounded-md border border-white/15 px-3 text-xs font-semibold text-stone-300">
                    Escolher data manualmente
                  </button>
                </div>
                <label className="mt-4 block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Observação de cobrança</span>
                  <textarea rows={3} value={saleForm.collectionNote} onChange={(event) => setSaleForm((current) => ({ ...current, collectionNote: event.target.value }))} className="mt-2 w-full resize-none rounded-md border border-gold/20 bg-black px-4 py-3 text-sm text-white outline-none focus:border-gold" />
                </label>
              </div>

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
                      const total = getSaleTotal(sale);
                      const saleCost = getSaleItems(sale).reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
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
                            {summarizeSaleItems(sale)}
                          </td>
                          <td className="py-4 pr-4">
                            {lineLabel(sale.lineType)}
                          </td>
                          <td className="py-4 pr-4">{getSaleItems(sale).reduce((sum, item) => sum + item.quantity, 0)}</td>
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
                              {statusOptions.find((option) => option.value === sale.status)?.label ?? sale.status}
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
