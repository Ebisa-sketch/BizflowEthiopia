"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  RotateCcw,
  Barcode,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  UserPlus,
  ArrowLeft,
  X,
  Download,
  Loader2,
  Check,
  Percent,
  BookOpen,
  KeyRound,
  ShieldCheck,
  ShoppingCart,
  ChevronRight,
  Receipt,
  Phone,
  User,
  Info,
  Keyboard,
  QrCode,
} from "lucide-react";
import { formatMoney, roundMoney } from "@/lib/money";
import {
  calculatePosTotals,
  formatPosReceiptDateTime,
  POS_VAT_RATE,
} from "@/lib/sales/pos-pricing";

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  status: string;
}

interface CartItem extends ProductItem {
  quantity: number;
}

interface HeldDraft {
  id: string;
  customerName: string;
  savedAt: string;
  items: CartItem[];
  discount: number;
  applyVat?: boolean;
  taxIncluded?: boolean;
}

interface CompletedReceipt {
  saleId: string;
  saleNumber: string;
  createdAt: string;
  business: {
    name: string;
    phone: string | null;
    address: string | null;
    taxNumber: string | null;
    currency: string;
  };
  cashier: {
    name: string;
  };
  customerName: string;
  items: {
    productId: string;
    name: string;
    sku: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  payment: {
    method: string;
    amount: number;
    reference: string | null;
    tendered: number;
    change: number;
  };
}

export default function PosCheckoutPage() {
  const router = useRouter();

  // Core Catalog & Session State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["ALL"]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("CASHIER");
  const [activeBusiness, setActiveBusiness] = useState<any>(null);

  // Cart & Pricing State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [discountType, setDiscountType] = useState<"AMOUNT" | "PERCENT">("AMOUNT");
  const [applyVat, setApplyVat] = useState(false);
  const VAT_RATE = POS_VAT_RATE;

  // Responsive Mobile Tab: "catalog" or "cart"
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  // Customer State
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [recentCustomers, setRecentCustomers] = useState<string[]>(["Walk-in Customer"]);
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newCustomerInput, setNewCustomerInput] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TELEBIRR" | "CBE_BIRR" | "BANK_TRANSFER" | "OTHER">("CASH");
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentManuallyConfirmed, setPaymentManuallyConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Hardware Barcode Scanner & Toast Feedback
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Manager Approval for Cashier Discounts
  const [managerAuthorizationModalOpen, setManagerAuthorizationModalOpen] = useState(false);
  const [managerEmail, setManagerEmail] = useState("");
  const [managerPassword, setManagerPassword] = useState("");
  const [managerAuthorizationError, setManagerAuthorizationError] = useState<string | null>(null);
  const [isManagerApproved, setIsManagerApproved] = useState(false);
  const [managerApprovalToken, setManagerApprovalToken] = useState<string | null>(null);
  const [isVerifyingManager, setIsVerifyingManager] = useState(false);
  const [pendingActionAfterApproval, setPendingActionAfterApproval] = useState<(() => void) | null>(null);

  // Modals & Drafts State
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [heldDrafts, setHeldDrafts] = useState<HeldDraft[]>([]);
  const [isDraftsInitialized, setIsDraftsInitialized] = useState(false);
  const [heldDraftsOpen, setHeldDraftsOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<CompletedReceipt | null>(null);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const checkoutAttemptRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const scanFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check discount permission (Owner, Manager, or server-verified supervisor grant)
  const canApplyDiscount = userRole === "OWNER" || userRole === "MANAGER" || isManagerApproved;

  // Web Audio API Synthesizer for instant POS scan confirmation
  const playBeepSound = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz crisp beep
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {
      // Audio autoplay restrictions or headless environment
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setScanFeedback(message);
    if (scanFeedbackTimeoutRef.current) {
      clearTimeout(scanFeedbackTimeoutRef.current);
    }
    scanFeedbackTimeoutRef.current = setTimeout(() => {
      setScanFeedback(null);
    }, 3200);
  }, []);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.products)) {
        throw new Error(data.error || "Unable to load products.");
      }
      setProducts(data.products);
      const cats = Array.from(
        new Set(data.products.map((product: ProductItem) => product.category))
      ) as string[];
      setCategories(["ALL", ...cats.filter(Boolean)]);
    } catch (error) {
      setProductsError(
        error instanceof Error ? error.message : "Unable to load products."
      );
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  const loadRecentCustomers = useCallback(async () => {
    setCustomersError(null);
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.customers)) {
        throw new Error(data.error || "Unable to load recent customers.");
      }
      setRecentCustomers(data.customers);
    } catch (error) {
      setCustomersError(
        error instanceof Error ? error.message : "Unable to load recent customers."
      );
    }
  }, []);

  // Load session, catalog, customers, and held drafts
  useEffect(() => {
    async function loadInitialData() {
      const storedDrafts = localStorage.getItem("bizflow_pos_held_drafts");
      if (storedDrafts) {
        try {
          setHeldDrafts(JSON.parse(storedDrafts));
        } catch {
          localStorage.removeItem("bizflow_pos_held_drafts");
          showToast("Saved drafts were corrupted and have been reset.");
        }
      }
      setIsDraftsInitialized(true);

      const meRes = await fetch("/api/auth/me");
      if (!meRes.ok) {
        throw new Error("Your session could not be verified. Refresh or sign in again.");
      }
      const meData = await meRes.json();
      if (meData.authenticated && meData.user) {
        setUserRole(meData.user.role || "CASHIER");
        setActiveBusiness(meData.user);
      }

      await loadProducts();
      await loadRecentCustomers();
    }

    loadInitialData().catch((error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Unable to initialize the POS session.";
      setProductsError(message);
      setIsLoadingProducts(false);
      showToast(message);
    });
  }, [loadProducts, loadRecentCustomers, showToast]);

  // Persist held drafts to localStorage
  useEffect(() => {
    if (!isDraftsInitialized) return;
    localStorage.setItem("bizflow_pos_held_drafts", JSON.stringify(heldDrafts));
  }, [heldDrafts, isDraftsInitialized]);

  // Cart operations
  const addToCart = useCallback((product: ProductItem) => {
    if (product.stock <= 0) {
      showToast(`'${product.name}' is out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          showToast(`Only ${product.stock} units of '${product.name}' available in stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [showToast]);

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              showToast(`Only ${item.stock} units of '${item.name}' available.`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setExplicitQuantity = (id: string, qty: number) => {
    if (!Number.isFinite(qty)) return;
    const validQty = Math.max(0, Math.round(qty * 100) / 100);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            if (validQty > item.stock) {
              showToast(`Only ${item.stock} units of '${item.name}' available.`);
              return { ...item, quantity: item.stock };
            }
            return validQty > 0 ? { ...item, quantity: validQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setClearConfirmOpen(false);
  };

  // Global Hardware Barcode Wedge Listener
  useEffect(() => {
    let buffer = "";
    let lastKeyTime = Date.now();

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // When Enter or Tab arrives from a hardware scanner:
      if (e.key === "Enter" || e.key === "Tab") {
        if (buffer.length >= 2 && (timeDiff < 70 || !isInput)) {
          const scannedCode = buffer.trim().toLowerCase();
          buffer = "";

          const matchedProduct = products.find(
            (p) =>
              p.barcode?.trim().toLowerCase() === scannedCode ||
              p.sku.trim().toLowerCase() === scannedCode
          );

          if (matchedProduct) {
            e.preventDefault();
            addToCart(matchedProduct);
            playBeepSound();
            showToast(`Scanned: ${matchedProduct.name} · ${formatMoney(matchedProduct.price)}`);
            return;
          } else if (!isInput) {
            showToast(`No product found for scanned barcode: "${scannedCode}"`);
          }
        }
        buffer = "";
        return;
      }

      if (e.key.length === 1) {
        if (timeDiff > 120 && !isInput) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [products, addToCart, playBeepSound, showToast]);

  // Pricing & Exact Decimal Calculations
  const subtotal = roundMoney(
    cart.reduce((sum, item) => sum + roundMoney(item.price * item.quantity), 0)
  );

  const rawDiscount =
    discountType === "PERCENT"
      ? roundMoney((subtotal * Math.min(100, Math.max(0, discountValue))) / 100)
      : roundMoney(Math.max(0, discountValue));

  const safeDiscount = canApplyDiscount
    ? roundMoney(Math.min(subtotal, Math.max(0, rawDiscount)))
    : 0;

  const totals = calculatePosTotals(
    cart.map((item) => ({ unitPrice: item.price, quantity: item.quantity })),
    safeDiscount,
    applyVat,
    false // Tax-exclusive prices: VAT is calculated on taxable subtotal
  );

  const taxTotal = totals.taxTotal;
  const grandTotal = totals.grandTotal;

  // Global Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        (target instanceof HTMLInputElement &&
          target.type !== "button" &&
          target.type !== "submit" &&
          target.type !== "checkbox") ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      // Escape closes whichever modal is open
      if (e.key === "Escape") {
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
          return;
        }
        if (completedReceipt) {
          setCompletedReceipt(null);
          return;
        }
        if (checkoutModalOpen) {
          setCheckoutModalOpen(false);
          return;
        }
        if (clearConfirmOpen) {
          setClearConfirmOpen(false);
          return;
        }
        if (heldDraftsOpen) {
          setHeldDraftsOpen(false);
          return;
        }
        if (newCustomerModalOpen) {
          setNewCustomerModalOpen(false);
          return;
        }
        if (managerAuthorizationModalOpen) {
          setManagerAuthorizationModalOpen(false);
          return;
        }
        return;
      }

      // F1 or ? toggles Shortcuts Guide (when not editing an input)
      if (e.key === "F1" || (e.key === "?" && !isInput)) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Hotkeys when Receipt Modal is active
      if (completedReceipt) {
        if ((e.key === "p" || e.key === "P" || (e.ctrlKey && e.key === "p")) && !isInput) {
          e.preventDefault();
          window.print();
          return;
        }
        if ((e.key === "t" || e.key === "T") && !isInput) {
          e.preventDefault();
          handleDownloadReceipt();
          return;
        }
        if ((e.key === " " || e.key === "Enter") && !isInput) {
          e.preventDefault();
          setCompletedReceipt(null);
          return;
        }
        return;
      }

      // Hotkeys when Checkout Modal is active
      if (checkoutModalOpen) {
        // Quick payment method switch with numbers 1 - 5 when not typing in an input
        if (!isInput) {
          if (e.key === "1") {
            e.preventDefault();
            setPaymentMethod("CASH");
            return;
          }
          if (e.key === "2") {
            e.preventDefault();
            setPaymentMethod("TELEBIRR");
            return;
          }
          if (e.key === "3") {
            e.preventDefault();
            setPaymentMethod("CBE_BIRR");
            return;
          }
          if (e.key === "4") {
            e.preventDefault();
            setPaymentMethod("BANK_TRANSFER");
            return;
          }
          if (e.key === "5") {
            e.preventDefault();
            setPaymentMethod("OTHER");
            if (!paymentRef) {
              setPaymentRef(`IDDA: Store Credit - ${customerName}`);
            }
            return;
          }
        }

        // Enter submits sale (if not in a multiline textarea)
        if (e.key === "Enter" && !e.shiftKey) {
          if (target instanceof HTMLTextAreaElement) return;
          e.preventDefault();
          void handleCompleteSale();
          return;
        }
        return;
      }

      // If other secondary modals are open or cashier is typing in an input, ignore general shortcuts
      if (
        isInput ||
        clearConfirmOpen ||
        heldDraftsOpen ||
        newCustomerModalOpen ||
        managerAuthorizationModalOpen ||
        shortcutsModalOpen
      ) {
        return;
      }

      // F2: Focus Search / Barcode Box
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // F4: Clear Cart Confirmation
      else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) setClearConfirmOpen(true);
      }
      // F8: Hold Current Sale
      else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) handleHoldSale();
      }
      // F9: Open Checkout Modal
      else if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0) openCheckoutModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cart,
    completedReceipt,
    checkoutModalOpen,
    clearConfirmOpen,
    heldDraftsOpen,
    newCustomerModalOpen,
    managerAuthorizationModalOpen,
    shortcutsModalOpen,
    paymentMethod,
    cashTendered,
    grandTotal,
    paymentRef,
    customerName,
    paymentManuallyConfirmed,
    isSubmitting,
    safeDiscount,
    applyVat,
    managerApprovalToken,
  ]);


  // Auto-sync cash tendered when modal opens or total changes
  useEffect(() => {
    if (cashTendered < grandTotal && paymentMethod === "CASH") {
      setCashTendered(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  useEffect(() => {
    setPaymentManuallyConfirmed(false);
  }, [grandTotal]);

  const cashChange = roundMoney(Math.max(0, cashTendered - grandTotal));

  // Manager Approval Handlers
  const requestManagerAuth = (action: () => void, renewApproval = false) => {
    if (
      userRole === "OWNER" ||
      userRole === "MANAGER" ||
      (isManagerApproved && !renewApproval)
    ) {
      action();
      return;
    }
    setManagerAuthorizationError(null);
    setManagerEmail("");
    setManagerPassword("");
    setPendingActionAfterApproval(() => action);
    setManagerAuthorizationModalOpen(true);
  };

  const verifyManagerCredentials = async () => {
    if (!managerEmail.trim() || !managerPassword) {
      setManagerAuthorizationError("Enter the manager's email and password.");
      return;
    }

    try {
      setIsVerifyingManager(true);
      setManagerAuthorizationError(null);
      const response = await fetch("/api/sales/authorize-discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: managerEmail.trim(),
          password: managerPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.authorizationToken) {
        throw new Error(data.error || "Manager authorization failed.");
      }

      setManagerApprovalToken(data.authorizationToken);
      setIsManagerApproved(true);
      setManagerPassword("");
      setManagerAuthorizationModalOpen(false);
      setManagerAuthorizationError(null);
      showToast("Manager approval verified for 5 minutes.");
      if (pendingActionAfterApproval) {
        pendingActionAfterApproval();
        setPendingActionAfterApproval(null);
      }
    } catch (error) {
      setManagerPassword("");
      setManagerAuthorizationError(
        error instanceof Error ? error.message : "Manager authorization failed."
      );
    } finally {
      setIsVerifyingManager(false);
    }
  };

  // Hold Sale
  const handleHoldSale = () => {
    if (cart.length === 0) return;
    const newDraft: HeldDraft = {
      id: `draft_${Date.now()}`,
      customerName,
      savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      items: [...cart],
      discount: safeDiscount,
      applyVat,
    };
    setHeldDrafts((prev) => [newDraft, ...prev]);
    setCart([]);
    setDiscountValue(0);
    setCustomerName("Walk-in Customer");
    showToast(`Sale held as draft for ${customerName}`);
  };

  // Resume Sale (with fresh inventory revalidation)
  const handleResumeSale = (draft: HeldDraft) => {
    const revalidatedCart: CartItem[] = [];
    const outOfStockWarnings: string[] = [];

    for (const item of draft.items) {
      const liveProduct = products.find((p) => p.id === item.id);
      if (!liveProduct || liveProduct.stock <= 0) {
        outOfStockWarnings.push(`'${item.name}' is now out of stock and was removed.`);
      } else {
        const adjustedQty = Math.min(item.quantity, liveProduct.stock);
        if (adjustedQty < item.quantity) {
          outOfStockWarnings.push(
            `'${item.name}' quantity reduced from ${item.quantity} to ${adjustedQty} due to live stock.`
          );
        }
        revalidatedCart.push({
          ...item,
          price: liveProduct.price,
          stock: liveProduct.stock,
          quantity: adjustedQty,
        });
      }
    }

    if (outOfStockWarnings.length > 0) {
      alert("Draft Revalidation Notice:\n" + outOfStockWarnings.join("\n"));
    }

    setCart(revalidatedCart);
    setCustomerName(draft.customerName);
    setDiscountValue(draft.discount);
    setDiscountType("AMOUNT");
    setApplyVat(draft.applyVat ?? draft.taxIncluded ?? false);

    setHeldDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    setHeldDraftsOpen(false);
    showToast(`Resumed draft for ${draft.customerName}`);
  };

  // Open checkout modal
  const openCheckoutModal = () => {
    if (cart.length === 0) return;
    setSubmitError(null);
    setCashTendered(grandTotal);
    setCheckoutModalOpen(true);
  };

  // Add new customer with optional phone number
  const handleAddNewCustomer = () => {
    const trimmed = newCustomerInput.trim();
    if (!trimmed) return;
    const phone = newCustomerPhone.trim();
    const formatted = phone ? `${trimmed} (${phone})` : trimmed;
    setRecentCustomers((prev) => [formatted, ...prev.filter((c) => c !== formatted)]);
    setCustomerName(formatted);
    setNewCustomerInput("");
    setNewCustomerPhone("");
    setNewCustomerModalOpen(false);
    showToast(`Selected customer: ${formatted}`);
  };

  // Execute Sale Submission with Idempotency Key
  const handleCompleteSale = async () => {
    if (cart.length === 0 || isSubmitting) return;

    if (paymentMethod === "CASH" && cashTendered < grandTotal) {
      setSubmitError(`Cash tendered (${cashTendered} ETB) is less than total due (${grandTotal} ETB).`);
      return;
    }

    // Special validation for Store Credit (Idda / ዕዳ)
    if (paymentMethod === "OTHER") {
      if (customerName === "Walk-in Customer") {
        setSubmitError("Store Credit (Idda / ዕዳ) requires a registered customer with a phone number. Please select or add a named customer.");
        return;
      }
    } else if (paymentMethod !== "CASH" && (!paymentRef || paymentRef.trim().length < 3)) {
      setSubmitError(`A valid transaction confirmation reference is required for ${paymentMethod}.`);
      return;
    }

    if (
      paymentMethod !== "CASH" &&
      paymentMethod !== "OTHER" &&
      !paymentManuallyConfirmed
    ) {
      setSubmitError("Please confirm that you verified payment receipt in the provider's official channel.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const effectiveRef =
        paymentMethod === "CASH"
          ? null
          : paymentMethod === "OTHER"
          ? paymentRef.trim() || `IDDA: Store Credit - ${customerName}`
          : paymentRef.trim();

      const payloadWithoutKey = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        discountTotal: safeDiscount,
        applyVat,
        customerName: customerName.trim(),
        payment: {
          paymentMethod,
          amount: grandTotal,
          reference: effectiveRef,
          tendered: paymentMethod === "CASH" ? cashTendered : grandTotal,
        },
        managerApprovalToken,
      };

      const fingerprint = JSON.stringify(payloadWithoutKey);
      if (checkoutAttemptRef.current?.fingerprint !== fingerprint) {
        checkoutAttemptRef.current = {
          fingerprint,
          key:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `pos_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`,
        };
      }
      const idempotencyKey = checkoutAttemptRef.current.key;
      const payload = { ...payloadWithoutKey, idempotencyKey };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process sale. Please check inventory and retry.");
      }

      // Success! Update local stock immediately
      const purchasedMap = new Map(cart.map((c) => [c.id, c.quantity]));
      setProducts((prev) =>
        prev.map((p) => {
          const qtyBought = purchasedMap.get(p.id);
          return qtyBought ? { ...p, stock: Math.max(0, p.stock - qtyBought) } : p;
        })
      );

      // Save completed receipt and clear cart
      setCompletedReceipt(data.receipt);
      setCheckoutModalOpen(false);
      setCart([]);
      setDiscountValue(0);
      setManagerApprovalToken(null);
      setIsManagerApproved(false);
      setPaymentRef("");
      setPaymentManuallyConfirmed(false);
      checkoutAttemptRef.current = null;
      setCustomerName("Walk-in Customer");
      showToast(`Sale completed: #${data.receipt.saleNumber}`);
      if (autoPrintReceipt) {
        setTimeout(() => {
          window.print();
        }, 300);
      }
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during checkout.");
      if (err.message?.includes("Manager approval is invalid or expired")) {
        setManagerApprovalToken(null);
        setIsManagerApproved(false);
      }
      if (/inventory|stock|product.*available/i.test(err.message || "")) {
        void loadProducts();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((product) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) {
      return selectedCategory === "ALL" || product.category === selectedCategory;
    }
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      (product.barcode && product.barcode.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === "ALL" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBarcodeSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    const code = searchTerm.trim().toLowerCase();
    if (!code) return;

    // Check exact SKU or barcode match first
    const exactMatch = products.find(
      (product) =>
        product.barcode?.trim().toLowerCase() === code ||
        product.sku.trim().toLowerCase() === code
    );

    if (exactMatch) {
      event.preventDefault();
      addToCart(exactMatch);
      playBeepSound();
      showToast(`Added ${exactMatch.name} · ${formatMoney(exactMatch.price)}`);
      setSearchTerm("");
      return;
    }

    // If search filtered down to exactly 1 product, pressing Enter adds it!
    if (filteredProducts.length === 1) {
      event.preventDefault();
      const singleProduct = filteredProducts[0];
      addToCart(singleProduct);
      playBeepSound();
      showToast(`Added ${singleProduct.name} · ${formatMoney(singleProduct.price)}`);
      setSearchTerm("");
      return;
    }

    showToast(`No exact match for "${searchTerm.trim()}". Try selecting from the grid.`);
  };

  // Download Receipt as Text
  const handleDownloadReceipt = () => {
    if (!completedReceipt) return;
    const r = completedReceipt;
    let txt = `========================================\n`;
    txt += `       ${r.business.name.toUpperCase()}\n`;
    if (r.business.address) txt += `       ${r.business.address}\n`;
    if (r.business.phone) txt += `       Tel: ${r.business.phone}\n`;
    if (r.business.taxNumber) txt += `       TIN: ${r.business.taxNumber}\n`;
    txt += `========================================\n`;
    txt += `INVOICE: ${r.saleNumber}\n`;
    txt += `DATE:    ${formatPosReceiptDateTime(r.createdAt)} EAT\n`;
    txt += `CASHIER: ${r.cashier.name}\n`;
    txt += `CLIENT:  ${r.customerName}\n`;
    txt += `----------------------------------------\n`;
    r.items.forEach((item) => {
      txt += `${item.name.padEnd(22)} ${item.quantity}x ${item.unitPrice.toFixed(2)} = ${item.lineTotal.toFixed(2)}\n`;
    });
    txt += `----------------------------------------\n`;
    txt += `Subtotal:      ${r.subtotal.toFixed(2)} ${r.business.currency}\n`;
    if (r.discountTotal > 0) txt += `Discount:     -${r.discountTotal.toFixed(2)} ${r.business.currency}\n`;
    if (r.taxTotal > 0) txt += `VAT (15% added): ${r.taxTotal.toFixed(2)} ${r.business.currency}\n`;
    txt += `GRAND TOTAL:   ${r.grandTotal.toFixed(2)} ${r.business.currency}\n`;
    txt += `----------------------------------------\n`;
    txt += `Payment:       ${r.payment.method}\n`;
    if (r.payment.reference) txt += `Ref / Txn ID:  ${r.payment.reference}\n`;
    if (r.payment.method !== "CASH" && r.payment.method !== "OTHER") {
      txt += `Payment reference recorded by cashier; not gateway-verified.\n`;
    }
    if (r.payment.method === "CASH") {
      txt += `Tendered:      ${r.payment.tendered.toFixed(2)} ${r.business.currency}\n`;
      txt += `Change:        ${r.payment.change.toFixed(2)} ${r.business.currency}\n`;
    }
    txt += `========================================\n`;
    txt += `     THANK YOU FOR SHOPPING WITH US!    \n`;
    txt += `       POWERED BY BIZFLOW ETHIOPIA      \n`;
    txt += `========================================\n`;

    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.saleNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCartUnits = cart.reduce((total, i) => total + i.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Header Bar with Status Badges and Keyboard Quick Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              POS Terminal
              <span className="text-[11px] bg-[#DCEFE7] text-[#0D9668] font-black px-2 py-0.5 rounded-full border border-[#0D9668]/30">
                Live ETB
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick barcode scanning & cash register checkout
          </p>
        </div>

        {/* Action Controls: Shortcuts, Hold, Resume, Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShortcutsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Shortcuts</span>
          </button>

          {heldDrafts.length > 0 && (
            <button
              onClick={() => setHeldDraftsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition shadow-2xs"
            >
              <PlayCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>Resume Drafts ({heldDrafts.length})</span>
            </button>
          )}

          <button
            onClick={handleHoldSale}
            disabled={cart.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition shadow-2xs"
            title="Save draft for later (F8)"
          >
            <PauseCircle className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Hold Sale</span>
            <span className="text-[10px] text-slate-400 font-mono sm:hidden">Hold</span>
          </button>

          <button
            onClick={() => setClearConfirmOpen(true)}
            disabled={cart.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 disabled:opacity-40 transition shadow-2xs"
            title="Clear current cart (F4)"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Clear Cart</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMobileTab("catalog")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
            mobileTab === "catalog"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Product Catalog ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("cart")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
            mobileTab === "cart"
              ? "bg-[#0F172A] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          <span>Cart ({cart.length}) · {formatMoney(grandTotal)}</span>
        </button>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Search & Grid (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === "cart" ? "hidden md:block" : "block"}`}>
          {/* Search Box & Category Filters */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <label className="sr-only" htmlFor="pos-product-search">
                Search products or scan SKU/barcode
              </label>
              <input
                id="pos-product-search"
                ref={searchInputRef}
                type="text"
                placeholder="Search products or scan SKU/barcode (Press F2)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleBarcodeSearchKeyDown}
                aria-label="Search products or enter a scanned SKU or barcode"
                className="w-full rounded-xl border border-slate-300 bg-slate-50/80 pl-10 pr-20 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#0D9668] focus:ring-2 focus:ring-[#0D9668]/20 transition"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                    title="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <Barcode className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  aria-pressed={selectedCategory === cat}
                  className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 transition ${
                    selectedCategory === cat
                      ? "bg-[#0F172A] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 bg-white p-3 space-y-2 animate-pulse"
                >
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                  <div className="h-8 w-full bg-slate-200 rounded" />
                  <div className="h-4 w-20 bg-slate-200 rounded mt-2" />
                </div>
              ))}
            </div>
          ) : productsError ? (
            <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-2" role="alert">
              <AlertTriangle className="h-8 w-8 mx-auto text-red-600" />
              <p className="text-sm font-bold text-slate-800">Products could not be loaded</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">{productsError}</p>
              <button
                type="button"
                onClick={() => void loadProducts()}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Retry loading products</span>
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <Search className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No matching products found</p>
              <p className="text-xs text-slate-400">
                {products.length === 0
                  ? "Add products to your catalog before starting a sale."
                  : "Try searching with a different name, SKU, or category."}
              </p>
              {products.length === 0 ? (
                <Link href="/products" className="inline-block mt-2 text-xs font-bold text-[#0D9668] hover:underline">
                  Open product catalog
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("ALL");
                  }}
                  className="mt-2 text-xs font-bold text-[#0D9668] hover:underline"
                >
                  Clear search and filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((p) => {
                const inCart = cart.find((c) => c.id === p.id);
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.reorderLevel;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    aria-label={`${p.name}, ${formatMoney(p.price)}, ${
                      isOutOfStock ? "out of stock" : `${p.stock} in stock`
                    }`}
                    className={`group relative min-w-0 bg-white border rounded-2xl p-3 flex flex-col justify-between text-left transition select-none ${
                      isOutOfStock
                        ? "border-red-200 bg-red-50/50 text-slate-400 cursor-not-allowed opacity-75"
                        : isLowStock
                        ? "border-amber-300 hover:border-amber-500 hover:shadow-sm"
                        : "border-slate-200 hover:border-[#0D9668] hover:shadow-xs"
                    }`}
                  >
                    <div>
                      {/* SKU & Stock Badge */}
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono mb-1.5">
                        <span className="text-slate-400 truncate max-w-[80px]">{p.sku || "No SKU"}</span>
                        {isOutOfStock ? (
                          <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-red-800 font-bold shrink-0">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-amber-900 font-bold shrink-0">
                            {p.stock} left
                          </span>
                        ) : (
                          <span className="rounded-md bg-[#DCEFE7] text-[#0D9668] px-1.5 py-0.5 font-bold shrink-0">
                            {p.stock} in
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-[#0D9668] transition min-h-8">
                        {p.name}
                      </h3>
                    </div>

                    {/* Price and Cart Addition indicator */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <span className="font-black text-slate-900 text-xs sm:text-sm font-mono">
                        {formatMoney(p.price)}
                      </span>
                      {inCart ? (
                        <span className="h-6 w-6 rounded-full bg-[#0D9668] text-white text-xs font-black flex items-center justify-center shadow-xs">
                          {inCart.quantity}
                        </span>
                      ) : (
                        <span className="h-6 w-6 rounded-full bg-slate-100 group-hover:bg-[#0F172A] group-hover:text-white text-slate-600 flex items-center justify-center text-xs font-bold transition">
                          +
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Cart & Checkout Panel (5 cols) */}
        <div className={`lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-2xs p-4 flex flex-col justify-between ${mobileTab === "catalog" ? "hidden md:flex" : "flex"}`}>
          <div>
            {/* Cart Header & Customer Selector */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <span>Current Cart</span>
                  {cart.length > 0 && (
                    <span className="rounded-full bg-[#DCEFE7] text-[#0D9668] text-[10px] font-bold px-2 py-0.5">
                      {totalCartUnits} units
                    </span>
                  )}
                </h2>
                <span className="text-xs text-slate-400">
                  {cart.length} unique item{cart.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Customer Selector with Suggestions */}
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    aria-label="Select customer"
                    list="pos-customer-suggestions"
                    placeholder="Customer name"
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 w-32 sm:w-40 font-semibold focus:bg-white focus:border-[#0D9668] focus:ring-1 focus:ring-[#0D9668]"
                  />
                  <datalist id="pos-customer-suggestions">
                    {recentCustomers.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <button
                  type="button"
                  onClick={() => setNewCustomerModalOpen(true)}
                  aria-label="Add customer"
                  className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  title="Add New Customer"
                >
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {customersError && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-amber-50 px-2.5 py-2 text-[10px] text-amber-900" role="status">
                <span>Customer list unavailable. You can still enter a name manually.</span>
                <button
                  type="button"
                  onClick={() => void loadRecentCustomers()}
                  className="shrink-0 font-bold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Cart Items List */}
            <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto my-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-14 text-center text-slate-400 space-y-2">
                  <ShoppingCart className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">Cart is empty</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Click products in the catalog or scan barcodes with your handheld scanner to begin sale.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatMoney(item.price)} × {item.quantity} ={" "}
                        <span className="font-bold text-slate-900">
                          {formatMoney(roundMoney(item.price * item.quantity))}
                        </span>
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label={`Decrease ${item.name} quantity`}
                        className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="0.01"
                        max={item.stock}
                        step="0.01"
                        aria-label={`Quantity for ${item.name}`}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) {
                            setExplicitQuantity(item.id, val);
                          }
                        }}
                        className="w-14 h-8 text-center text-xs font-bold text-slate-900 bg-transparent border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0D9668]/30 focus:border-[#0D9668]"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= item.stock}
                        aria-label={`Increase ${item.name} quantity`}
                        className="h-8 w-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center text-slate-700 transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center transition ml-0.5"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount & Tax Controls */}
            {cart.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                {/* Discount Control with Amount / Percent Toggle */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <span>Discount:</span>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setDiscountType("AMOUNT")}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          discountType === "AMOUNT" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                        }`}
                      >
                        ETB
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType("PERCENT")}
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          discountType === "PERCENT" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500"
                        }`}
                      >
                        %
                      </button>
                    </div>

                    {!canApplyDiscount ? (
                      <button
                        type="button"
                        onClick={() => requestManagerAuth(() => {})}
                        className="text-[10px] text-amber-800 font-bold bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1 transition"
                        title="Request manager authorization"
                      >
                        <KeyRound className="h-2.5 w-2.5" />
                        <span>Manager Approval</span>
                      </button>
                    ) : isManagerApproved ? (
                      <button
                        type="button"
                        onClick={() => requestManagerAuth(() => {}, true)}
                        className="text-[10px] text-[#0D9668] font-bold bg-[#DCEFE7] px-1.5 py-0.5 rounded-lg border border-[#0D9668]/30 flex items-center gap-1"
                        title="Supervisor grant verified for 5 minutes"
                      >
                        <ShieldCheck className="h-2.5 w-2.5" />
                        <span>Approved (5m)</span>
                      </button>
                    ) : null}
                  </div>

                  <input
                    type="number"
                    min="0"
                    max={discountType === "PERCENT" ? 100 : subtotal}
                    step="0.01"
                    aria-label="Discount value"
                    value={discountValue || ""}
                    disabled={!canApplyDiscount}
                    onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-24 text-right rounded-xl border border-slate-200 px-2.5 py-1 font-mono font-bold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:border-[#0D9668]"
                  />
                </div>

                {/* VAT (15%) Toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-slate-700 font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={applyVat}
                      onChange={(e) => setApplyVat(e.target.checked)}
                      className="rounded text-[#0D9668] focus:ring-[#0D9668] h-4 w-4"
                    />
                    <span>Apply 15% VAT (Exclusive: added to total)</span>
                  </label>
                  {applyVat && (
                    <span className="font-mono font-bold text-slate-700">+{formatMoney(taxTotal)}</span>
                  )}
                </div>
                <p className="pl-6 text-[10px] text-slate-400">
                  Catalog product prices are VAT-exclusive. When enabled, 15% VAT is calculated on the taxable subtotal.
                </p>
              </div>
            )}
          </div>

          {/* Pricing Summary & Checkout Button */}
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">{formatMoney(subtotal)}</span>
            </div>

            {safeDiscount > 0 && (
              <div className="flex justify-between text-xs text-[#0D9668] font-bold">
                <span>Discount:</span>
                <span className="font-mono">-{formatMoney(safeDiscount)}</span>
              </div>
            )}

            {taxTotal > 0 && (
              <div className="flex justify-between text-xs text-slate-600 font-semibold">
                <span>VAT (15% added):</span>
                <span className="font-mono">+{formatMoney(taxTotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-black text-slate-900 pt-1.5 border-t border-slate-100">
              <span>Grand Total:</span>
              <span className="text-[#0D9668] font-mono text-xl">{formatMoney(grandTotal)}</span>
            </div>

            <button
              onClick={openCheckoutModal}
              disabled={cart.length === 0}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0D9668] hover:bg-[#097852] active:scale-[0.99] text-white font-extrabold text-sm shadow-md shadow-[#0D9668]/30 disabled:opacity-50 disabled:pointer-events-none transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Complete Sale (F9)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Mobile Checkout Bar */}
      {cart.length > 0 && mobileTab === "catalog" && (
        <div className="fixed bottom-16 left-3 right-3 z-30 md:hidden bg-[#0F172A] text-white p-3 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
          <div>
            <div className="text-[11px] text-slate-400">{totalCartUnits} items in cart</div>
            <div className="text-base font-black text-[#0D9668] font-mono">{formatMoney(grandTotal)}</div>
          </div>
          <button
            type="button"
            onClick={() => setMobileTab("cart")}
            className="bg-[#0D9668] hover:bg-[#097852] px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5"
          >
            <span>Review & Pay</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* MODAL 1: Checkout & Payment Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-checkout-heading"
            className="mx-auto my-4 max-h-[calc(100dvh-2rem)] max-w-lg w-full overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 id="pos-checkout-heading" className="text-lg font-black text-slate-900">Checkout & Payment</h3>
                <p className="text-xs text-slate-500">Customer: <span className="font-bold text-slate-800">{customerName}</span></p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Total Due Banner */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-600">Total Due:</span>
              <span className="text-2xl font-black text-[#0D9668] font-mono">
                {formatMoney(grandTotal)}
              </span>
            </div>

            {/* Payment Method Selector with 1-5 Hotkeys */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">Select Payment Method</label>
                <span className="text-[10px] text-slate-400 font-mono">Press 1-5 to switch</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("CASH");
                    setPaymentManuallyConfirmed(false);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    paymentMethod === "CASH"
                      ? "border-[#0D9668] bg-[#DCEFE7]/50 text-emerald-900 ring-2 ring-[#0D9668]/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-[#0D9668]" />
                    <span>Cash</span>
                  </div>
                  <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-200/60 font-mono font-bold text-slate-600">1</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("TELEBIRR");
                    setPaymentManuallyConfirmed(false);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    paymentMethod === "TELEBIRR"
                      ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <span>Telebirr</span>
                  </div>
                  <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-200/60 font-mono font-bold text-slate-600">2</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("CBE_BIRR");
                    setPaymentManuallyConfirmed(false);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    paymentMethod === "CBE_BIRR"
                      ? "border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    <span>CBE Birr</span>
                  </div>
                  <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-200/60 font-mono font-bold text-slate-600">3</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("BANK_TRANSFER");
                    setPaymentManuallyConfirmed(false);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-amber-600" />
                    <span>Bank Transfer</span>
                  </div>
                  <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-200/60 font-mono font-bold text-slate-600">4</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("OTHER");
                    setPaymentManuallyConfirmed(false);
                    if (!paymentRef) {
                      setPaymentRef(`IDDA: Store Credit - ${customerName}`);
                    }
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-between transition col-span-2 cursor-pointer ${
                    paymentMethod === "OTHER"
                      ? "border-orange-600 bg-orange-50 text-orange-950 ring-2 ring-orange-500/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 text-left">
                    <BookOpen className="h-4 w-4 text-orange-600 shrink-0" />
                    <div>
                      <span className="font-bold">Store Credit (ዕዳ / Idda)</span>
                      <span className="block text-[10px] text-orange-700 font-normal">Customer balance ledger • Settle later</span>
                    </div>
                  </div>
                  <kbd className="text-[9px] px-1 py-0.5 rounded bg-slate-200/60 font-mono font-bold text-slate-600">5</kbd>
                </button>
              </div>
            </div>

            {/* Payment Details Container */}
            {paymentMethod === "CASH" ? (
              <div className="space-y-3 bg-[#DCEFE7]/30 p-4 rounded-2xl border border-emerald-200/60">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Cash Tendered (ETB)</label>
                    <button
                      type="button"
                      onClick={() => setCashTendered(grandTotal)}
                      className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-[#0D9668] text-white hover:bg-emerald-700 shadow-2xs cursor-pointer"
                    >
                      Exact ({formatMoney(grandTotal)})
                    </button>
                  </div>

                  {/* Ethiopian Birr Note Denominations Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 mr-0.5">Bills:</span>
                    {[
                      { label: "100 Br", val: Math.max(100, Math.ceil(grandTotal / 100) * 100) },
                      { label: "200 Br", val: Math.max(200, Math.ceil(grandTotal / 200) * 200) },
                      { label: "500 Br", val: Math.max(500, Math.ceil(grandTotal / 500) * 500) },
                      { label: "1,000 Br", val: Math.max(1000, Math.ceil(grandTotal / 1000) * 1000) },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setCashTendered(item.val)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                          cashTendered === item.val
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {item.val} Br
                      </button>
                    ))}
                  </div>

                  {/* Quick Add Increment Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 mr-0.5">Add:</span>
                    {[50, 100, 200, 500, 1000].map((extra) => (
                      <button
                        key={extra}
                        type="button"
                        onClick={() => setCashTendered((prev) => roundMoney((prev || grandTotal) + extra))}
                        className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs cursor-pointer"
                      >
                        +{extra}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min={grandTotal}
                    value={cashTendered || ""}
                    onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                    aria-label="Cash tendered"
                    step="0.01"
                    className="w-full text-xl font-mono font-black rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-[#0D9668] focus:ring-2 focus:ring-[#0D9668]/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                    ETB
                  </span>
                </div>

                {/* Change Calculation Display */}
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                  <span className="text-xs font-bold text-slate-600">Change to Return:</span>
                  <span className="text-xl font-black text-[#0D9668] font-mono">
                    {formatMoney(cashChange)}
                  </span>
                </div>
              </div>
            ) : paymentMethod === "OTHER" ? (
              <div className="space-y-2.5 bg-orange-50/70 p-4 rounded-2xl border border-orange-200">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Customer Credit Ledger (*Idda*)</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5 leading-tight">
                      This transaction of <strong>{formatMoney(grandTotal)}</strong> will be added to the credit ledger of <strong>{customerName}</strong>.
                    </p>
                    {customerName === "Walk-in Customer" && (
                      <p className="text-red-600 text-xs font-bold mt-1.5 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Cannot issue store credit to "Walk-in Customer". Select or register a named customer first.</span>
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Credit Memo / Terms (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Due within 15 days, approved by owner"
                    value={paymentRef}
                    onChange={(e) => {
                      setPaymentRef(e.target.value);
                      setPaymentManuallyConfirmed(false);
                    }}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2 text-slate-900 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <label className="text-xs font-bold text-slate-700 block">
                  {paymentMethod} Confirmation Reference Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TL-8921034 or CBE-99120"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  aria-label={`${paymentMethod} payment reference`}
                  className="w-full text-sm font-mono font-bold rounded-xl border border-slate-300 p-2.5 text-slate-900 bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  Notice: Transaction reference is recorded for bookkeeping only. BizFlow does not connect to banking/telco APIs to verify receipt.
                </p>
                <label className="flex items-start gap-2 text-[11px] font-bold text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={paymentManuallyConfirmed}
                    onChange={(event) => setPaymentManuallyConfirmed(event.target.checked)}
                    className="mt-0.5 rounded text-[#0D9668] focus:ring-[#0D9668]"
                  />
                  <span>I verified the payment receipt in the provider's official SMS or app.</span>
                </label>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 transition"
              >
                Back to Cart
              </button>
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[#0D9668] hover:bg-[#097852] text-white font-black text-xs shadow-md shadow-[#0D9668]/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Confirm & Print</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Completed Sale Thermal Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Printable Thermal Receipt (80mm standard format) */}
            <div id="pos-print-receipt" className="text-center font-mono text-xs space-y-2 bg-white text-black p-1">
              <div className="border-b border-dashed border-slate-400 pb-3">
                <span className="inline-block p-1.5 bg-[#DCEFE7] text-[#0D9668] rounded-full mb-1">
                  <Check className="h-5 w-5" />
                </span>
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  የጥሬ ገንዘብ ሽያጭ ደረሰኝ
                </div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">
                  CASH SALES INVOICE
                </div>
                <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">
                  {completedReceipt.business.name}
                </h2>
                {completedReceipt.business.address && (
                  <p className="text-[10px] text-slate-600">{completedReceipt.business.address}</p>
                )}
                {completedReceipt.business.phone && (
                  <p className="text-[10px] text-slate-600">Tel: {completedReceipt.business.phone}</p>
                )}
                {completedReceipt.business.taxNumber && (
                  <p className="text-[10px] text-slate-800 font-bold">
                    TIN: {completedReceipt.business.taxNumber}
                  </p>
                )}
                <div className="mt-1 pt-1 border-t border-dotted border-slate-300 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-[#0D9668]">#{completedReceipt.saleNumber}</span>
                  <span className="text-slate-500">{formatPosReceiptDateTime(completedReceipt.createdAt)} EAT</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-600 pt-0.5">
                  <span>Cashier: {completedReceipt.cashier.name}</span>
                  <span className="truncate max-w-[130px]">Client: {completedReceipt.customerName}</span>
                </div>
              </div>

              {/* Items Table Headers */}
              <div className="grid grid-cols-12 text-[10px] font-bold border-b border-slate-300 pb-1 text-slate-600 uppercase">
                <span className="col-span-6 text-left">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-4 text-right">Total</span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-dotted divide-slate-200 text-left max-h-48 overflow-y-auto pr-1">
                {completedReceipt.items.map((item) => (
                  <div key={item.productId} className="py-1 grid grid-cols-12 text-[11px] items-baseline">
                    <div className="col-span-6 truncate pr-1">
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <div className="text-[9px] text-slate-500">
                        @{item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-slate-600 font-bold">
                      {item.quantity}
                    </div>
                    <div className="col-span-4 text-right font-bold text-slate-900">
                      {item.lineTotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-dashed border-slate-400 space-y-1 text-right text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatMoney(completedReceipt.subtotal)}</span>
                </div>
                {completedReceipt.discountTotal > 0 && (
                  <div className="flex justify-between text-[#0D9668] font-bold">
                    <span>Discount:</span>
                    <span>-{formatMoney(completedReceipt.discountTotal)}</span>
                  </div>
                )}
                {completedReceipt.taxTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT (15%):</span>
                    <span>+{formatMoney(completedReceipt.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1.5 border-t border-slate-300">
                  <span>GRAND TOTAL:</span>
                  <span>{formatMoney(completedReceipt.grandTotal)}</span>
                </div>

                {/* Payment Breakdown */}
                <div className="pt-1 text-[10px] text-slate-700 text-left border-t border-dotted border-slate-300 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-bold">
                      {completedReceipt.payment.method === "OTHER" && completedReceipt.payment.reference?.includes("IDDA")
                        ? "Store Credit (ዕዳ / Idda)"
                        : completedReceipt.payment.method}
                    </span>
                  </div>
                  {completedReceipt.payment.reference && (
                    <div className="text-[9px] text-slate-500 truncate">
                      Ref: {completedReceipt.payment.reference}
                    </div>
                  )}
                  {completedReceipt.payment.method === "CASH" && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Tendered:</span>
                        <span>{formatMoney(completedReceipt.payment.tendered)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#0D9668]">
                        <span>Change:</span>
                        <span>{formatMoney(completedReceipt.payment.change)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Simulated Barcode Strip */}
                <div className="pt-2 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-[2px] h-7 w-48 overflow-hidden opacity-85">
                    {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 3, 1, 4, 1, 2, 3, 2, 1, 3, 2, 4, 1, 2].map(
                      (w, idx) => (
                        <span
                          key={idx}
                          className="bg-black inline-block h-full"
                          style={{ width: `${w}px` }}
                        />
                      )
                    )}
                  </div>
                  <span className="text-[9px] font-mono tracking-widest text-slate-500 mt-0.5">
                    *{completedReceipt.saleNumber}*
                  </span>
                </div>

                {/* Policy Footer */}
                <div className="pt-1.5 text-center text-[9px] text-slate-500 space-y-0.5 border-t border-dotted border-slate-300">
                  <p className="font-semibold text-slate-700">ዕቃዎች ከተሸጡ በኋላ አይመለሱም!</p>
                  <p>Goods once sold are not returnable without receipt.</p>
                  <p className="font-bold text-[#0D9668] pt-0.5">★ አመሰግናለሁ • Thank You! ★</p>
                  <p className="text-[8px] text-slate-400">Powered by BizFlow Ethiopia</p>
                </div>
              </div>
            </div>

            {/* Receipt Modal Action Buttons with Hotkeys */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 rounded-xl bg-[#0D9668] hover:bg-emerald-700 font-bold text-xs text-white flex flex-col items-center justify-center gap-0.5 transition shadow-xs cursor-pointer"
                  title="Print Thermal Receipt (Press Enter or P)"
                >
                  <div className="flex items-center gap-1.5">
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print</span>
                  </div>
                  <span className="text-[9px] opacity-80 font-mono">Enter / P</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
                  title="Download receipt text file (Press T)"
                >
                  <div className="flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    <span>Save Text</span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono">T</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompletedReceipt(null)}
                  className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-xs text-white flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
                  title="Close receipt and start next sale (Press Space or Esc)"
                >
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Next Sale</span>
                  </div>
                  <span className="text-[9px] opacity-80 font-mono">Space</span>
                </button>
              </div>

              {/* Auto-print next time toggle */}
              <label className="flex items-center justify-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer pt-1 select-none">
                <input
                  type="checkbox"
                  checked={autoPrintReceipt}
                  onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                  className="rounded text-[#0D9668] focus:ring-[#0D9668]"
                />
                <span>Automatically trigger print dialog on future sales</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: POS Keyboard Shortcuts Cheat Sheet (F1 or ?) */}
      {shortcutsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#DCEFE7] text-[#0D9668] flex items-center justify-center">
                  <Keyboard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    POS Keyboard Shortcuts
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-speed hotkeys designed for retail cashiers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Category 1: Navigation & Scanning */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Cart & Navigation
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Search / Barcode</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">F2</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Clear Cart</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">F4</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Hold Sale (Draft)</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">F8</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Open Payment</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0D9668] text-white border border-[#0D9668] font-mono font-bold">F9</kbd>
                  </div>
                </div>
              </div>

              {/* Category 2: Checkout Payment Switcher */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  In Payment Modal
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Cash</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">1</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Telebirr</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">2</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">CBE Birr</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">3</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Bank Transfer</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">4</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Store Credit (Idda)</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">5</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Submit Sale</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#0D9668] text-white font-mono font-bold">Enter</kbd>
                  </div>
                </div>
              </div>

              {/* Category 3: Hardware Barcode Scanners */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Barcode Scanners
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  USB & Bluetooth barcode wedges work automatically anywhere on this page without needing to focus the search box.
                </p>
                <div className="pt-1 flex items-center gap-2 text-[11px] text-[#0D9668] font-bold">
                  <Check className="h-3.5 w-3.5" />
                  <span>Hardware Wedge & Audio Beep Active</span>
                </div>
              </div>

              {/* Category 4: Receipt Modal Actions */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                  Thermal Receipt Screen
                </h4>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Print Receipt</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">Enter / P</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Download Text Invoice</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">T</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Next Customer / Dismiss</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono font-bold">Space / Esc</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShortcutsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Clear Cart Confirmation */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Clear Current Cart?</h3>
                <p className="text-xs text-slate-500">
                  This will remove all {cart.length} item(s) from the current sale.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={clearCart}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs"
              >
                Yes, Clear Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Resume Held Drafts Drawer */}
      {heldDraftsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Held Sale Drafts</h3>
              <button
                onClick={() => setHeldDraftsOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {heldDrafts.map((draft) => {
                const draftTotal = draft.items.reduce(
                  (sum, i) => sum + i.price * i.quantity,
                  0
                );
                return (
                  <div
                    key={draft.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between gap-3 transition"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{draft.customerName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {draft.items.length} items • Held at {draft.savedAt}
                      </p>
                      <span className="text-xs font-bold text-[#0D9668] font-mono">
                        {formatMoney(draftTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleResumeSale(draft)}
                        className="px-3 py-1.5 rounded-xl bg-[#0D9668] hover:bg-[#097852] text-white font-bold text-xs shadow-2xs"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() =>
                          setHeldDrafts((prev) => prev.filter((d) => d.id !== draft.id))
                        }
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                        title="Delete draft"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Quick Add Customer Modal */}
      {newCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Add New Customer</h3>
              <button
                onClick={() => setNewCustomerModalOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Customer Name or Business *</label>
                <input
                  type="text"
                  placeholder="e.g. Alazar Trading, Genet B."
                  value={newCustomerInput}
                  onChange={(e) => setNewCustomerInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNewCustomer()}
                  autoFocus
                  className="w-full text-sm rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:border-[#0D9668] focus:ring-1 focus:ring-[#0D9668]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (For Idda/Credit Tracking)</label>
                <input
                  type="tel"
                  placeholder="e.g. 0911223344 or 0712345678"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddNewCustomer()}
                  className="w-full text-sm rounded-xl border border-slate-300 p-2.5 text-slate-900 font-mono focus:border-[#0D9668] focus:ring-1 focus:ring-[#0D9668]"
                />
              </div>

              <p className="text-[11px] text-slate-400">
                This customer will be linked to the current sale without losing any items in your cart.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setNewCustomerModalOpen(false)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewCustomer}
                className="flex-1 py-2 rounded-xl bg-[#0D9668] hover:bg-[#097852] text-xs font-bold text-white shadow-xs"
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Manager Discount Authorization Modal */}
      {managerAuthorizationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Manager Authorization</h3>
                  <p className="text-[11px] text-slate-500">Supervisor approval required</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setManagerAuthorizationModalOpen(false);
                  setManagerAuthorizationError(null);
                  setManagerPassword("");
                  setPendingActionAfterApproval(null);
                }}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              An active Owner or Manager must verify their business account to approve discounts. Approval expires after five minutes.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Manager email</label>
              <input
                type="email"
                autoComplete="username"
                value={managerEmail}
                onChange={(e) => {
                  setManagerEmail(e.target.value);
                  setManagerAuthorizationError(null);
                }}
                placeholder="manager@business.com"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9668]/30 focus:border-[#0D9668]"
              />
              <label className="text-xs font-bold text-slate-700 block">Manager password</label>
              <input
                type="password"
                autoComplete="current-password"
                autoFocus
                value={managerPassword}
                onChange={(e) => {
                  setManagerPassword(e.target.value);
                  setManagerAuthorizationError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && void verifyManagerCredentials()}
                placeholder="Manager password"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9668]/30 focus:border-[#0D9668]"
              />

              {managerAuthorizationError && (
                <p className="text-xs text-red-600 font-bold text-center mt-1">
                  {managerAuthorizationError}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setManagerAuthorizationModalOpen(false);
                  setManagerAuthorizationError(null);
                  setManagerPassword("");
                  setPendingActionAfterApproval(null);
                }}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void verifyManagerCredentials()}
                disabled={isVerifyingManager}
                className="flex-1 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-xs font-bold text-white shadow-xs disabled:cursor-wait disabled:opacity-60"
              >
                {isVerifyingManager ? "Verifying…" : "Verify & Authorize"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Barcode Scanner Feedback Toast Banner */}
      {scanFeedback && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:bottom-8 md:right-8 z-50 bg-[#0F172A] text-white px-4 py-3 rounded-2xl shadow-2xl border border-[#0D9668] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-150"
        >
          <div className="h-7 w-7 rounded-xl bg-[#0D9668] text-white flex items-center justify-center shrink-0">
            <Barcode className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold">{scanFeedback}</span>
        </div>
      )}
    </div>
  );
}
