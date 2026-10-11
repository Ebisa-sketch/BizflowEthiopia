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
  Sparkles,
  Barcode,
  PauseCircle,
  PlayCircle,
  AlertTriangle,
  UserPlus,
  ArrowLeft,
  X,
  Download,
  ShieldAlert,
  Loader2,
  Check,
  Percent,
} from "lucide-react";
import { formatMoney, roundMoney } from "@/lib/money";

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
  taxIncluded: boolean;
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

  // Core POS State
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["ALL"]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [userRole, setUserRole] = useState<string>("CASHIER");
  const [activeBusiness, setActiveBusiness] = useState<any>(null);

  // Cart & Pricing State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [discount, setDiscount] = useState<number>(0);
  const [applyVat, setApplyVat] = useState(false);
  const VAT_RATE = 0.15; // Standard 15% Ethiopian VAT

  // Customer State
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [recentCustomers, setRecentCustomers] = useState<string[]>(["Walk-in Customer"]);
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newCustomerInput, setNewCustomerInput] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TELEBIRR" | "CBE_BIRR" | "BANK_TRANSFER">("CASH");
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Modals & Drafts State
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [heldDrafts, setHeldDrafts] = useState<HeldDraft[]>([]);
  const [heldDraftsOpen, setHeldDraftsOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<CompletedReceipt | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Check discount permission
  const canApplyDiscount = userRole === "OWNER" || userRole === "MANAGER";

  // Load session & live catalog
  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoadingProducts(true);
        // Load User / Tenant Session
        const meRes = await fetch("/api/auth/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            setUserRole(meData.user.role || "CASHIER");
            setActiveBusiness(meData.user);
          }
        }

        // Load Products
        const prodRes = await fetch("/api/products");
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.products) {
            setProducts(prodData.products);
            const cats = Array.from(new Set(prodData.products.map((p: ProductItem) => p.category))) as string[];
            setCategories(["ALL", ...cats.filter(Boolean)]);
          }
        }

        // Load Customers
        const custRes = await fetch("/api/customers");
        if (custRes.ok) {
          const custData = await custRes.json();
          if (custData.customers) {
            setRecentCustomers(custData.customers);
          }
        }

        // Load held drafts from localStorage
        const storedDrafts = localStorage.getItem("bizflow_pos_held_drafts");
        if (storedDrafts) {
          try {
            setHeldDrafts(JSON.parse(storedDrafts));
          } catch {}
        }
      } catch (err) {
        console.error("Failed to load initial POS data:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadInitialData();
  }, []);

  // Save held drafts to localStorage
  useEffect(() => {
    localStorage.setItem("bizflow_pos_held_drafts", JSON.stringify(heldDrafts));
  }, [heldDrafts]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Focus Search
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      // F4: Clear Cart
      else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) setClearConfirmOpen(true);
      }
      // F8: Hold Sale
      else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) handleHoldSale();
      }
      // F9: Open Checkout / Pay
      else if (e.key === "F9") {
        e.preventDefault();
        if (cart.length > 0) openCheckoutModal();
      }
      // Escape: Close any open modal
      else if (e.key === "Escape") {
        setCheckoutModalOpen(false);
        setClearConfirmOpen(false);
        setHeldDraftsOpen(false);
        setNewCustomerModalOpen(false);
        if (completedReceipt) setCompletedReceipt(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, completedReceipt]);

  // Exact Decimal Calculations
  const subtotal = roundMoney(
    cart.reduce((sum, item) => sum + roundMoney(item.price * item.quantity), 0)
  );
  const safeDiscount = canApplyDiscount ? roundMoney(Math.min(subtotal, Math.max(0, discount))) : 0;
  const taxableBase = roundMoney(Math.max(0, subtotal - safeDiscount));
  const taxTotal = applyVat ? roundMoney(taxableBase * VAT_RATE) : 0;
  const grandTotal = roundMoney(taxableBase + taxTotal);

  // Sync cash tendered when modal opens or total changes
  useEffect(() => {
    if (cashTendered < grandTotal && paymentMethod === "CASH") {
      setCashTendered(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  const cashChange = roundMoney(Math.max(0, cashTendered - grandTotal));

  // Cart operations
  const addToCart = (product: ProductItem) => {
    if (product.stock <= 0) {
      alert(`'${product.name}' is currently out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Cannot add more than available inventory (${product.stock} in stock).`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock) {
              alert(`Cannot exceed available inventory (${item.stock} in stock).`);
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
    const validQty = Math.max(0, Math.floor(qty));
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            if (validQty > item.stock) {
              alert(`Only ${item.stock} units available in stock.`);
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
    setDiscount(0);
    setClearConfirmOpen(false);
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
      taxIncluded: applyVat,
    };
    setHeldDrafts((prev) => [newDraft, ...prev]);
    setCart([]);
    setDiscount(0);
    setCustomerName("Walk-in Customer");
  };

  // Resume Sale (with fresh stock revalidation!)
  const handleResumeSale = (draft: HeldDraft) => {
    // Re-verify items against current live products
    const revalidatedCart: CartItem[] = [];
    let outOfStockWarnings: string[] = [];

    for (const item of draft.items) {
      const liveProduct = products.find((p) => p.id === item.id);
      if (!liveProduct || liveProduct.stock <= 0) {
        outOfStockWarnings.push(`'${item.name}' is now out of stock and was removed.`);
      } else {
        const adjustedQty = Math.min(item.quantity, liveProduct.stock);
        if (adjustedQty < item.quantity) {
          outOfStockWarnings.push(
            `'${item.name}' quantity reduced from ${item.quantity} to ${adjustedQty} due to inventory changes.`
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
    setDiscount(draft.discount);
    setApplyVat(draft.taxIncluded);

    // Remove draft from held list
    setHeldDrafts((prev) => prev.filter((d) => d.id !== draft.id));
    setHeldDraftsOpen(false);
  };

  // Open checkout modal
  const openCheckoutModal = () => {
    if (cart.length === 0) return;
    setSubmitError(null);
    setCashTendered(grandTotal);
    setCheckoutModalOpen(true);
  };

  // Add new customer
  const handleAddNewCustomer = () => {
    const trimmed = newCustomerInput.trim();
    if (!trimmed) return;
    setRecentCustomers((prev) => [trimmed, ...prev.filter((c) => c !== trimmed)]);
    setCustomerName(trimmed);
    setNewCustomerInput("");
    setNewCustomerModalOpen(false);
  };

  // Execute Sale Submission with Idempotency Key
  const handleCompleteSale = async () => {
    if (cart.length === 0 || isSubmitting) return;

    if (paymentMethod === "CASH" && cashTendered < grandTotal) {
      setSubmitError(`Cash tendered (${cashTendered} ETB) is less than total due (${grandTotal} ETB).`);
      return;
    }

    if (paymentMethod !== "CASH" && (!paymentRef || paymentRef.trim().length < 3)) {
      setSubmitError(`A valid transaction confirmation reference is required for ${paymentMethod}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      // Generate a unique client idempotency key per checkout attempt
      const idempotencyKey = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const payload = {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        discountTotal: safeDiscount,
        taxTotal,
        customerName: customerName.trim(),
        payment: {
          paymentMethod,
          amount: grandTotal,
          reference: paymentMethod === "CASH" ? null : paymentRef.trim(),
          tendered: paymentMethod === "CASH" ? cashTendered : grandTotal,
        },
        idempotencyKey,
      };

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
        throw new Error(data.error || "Failed to process sale. Please check stock and retry.");
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
      setDiscount(0);
      setPaymentRef("");
      setCustomerName("Walk-in Customer");
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Products
  const filteredProducts = products.filter((product) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      product.name.toLowerCase().includes(q) ||
      product.sku.toLowerCase().includes(q) ||
      (product.barcode && product.barcode.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === "ALL" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
    txt += `DATE:    ${new Date(r.createdAt).toLocaleString()}\n`;
    txt += `CASHIER: ${r.cashier.name}\n`;
    txt += `CLIENT:  ${r.customerName}\n`;
    txt += `----------------------------------------\n`;
    r.items.forEach((item) => {
      txt += `${item.name.padEnd(24)} ${item.quantity}x ${item.unitPrice.toFixed(2)} = ${item.lineTotal.toFixed(2)}\n`;
    });
    txt += `----------------------------------------\n`;
    txt += `Subtotal:      ${r.subtotal.toFixed(2)} ${r.business.currency}\n`;
    if (r.discountTotal > 0) txt += `Discount:     -${r.discountTotal.toFixed(2)} ${r.business.currency}\n`;
    if (r.taxTotal > 0) txt += `VAT (15%):     ${r.taxTotal.toFixed(2)} ${r.business.currency}\n`;
    txt += `GRAND TOTAL:   ${r.grandTotal.toFixed(2)} ${r.business.currency}\n`;
    txt += `----------------------------------------\n`;
    txt += `Payment:       ${r.payment.method}\n`;
    if (r.payment.reference) txt += `Ref / Txn ID:  ${r.payment.reference}\n`;
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

  return (
    <div className="space-y-4">
      {/* Top Header Bar with Keyboard Quick Hints */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              POS Terminal
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                Live ETB
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">F2</kbd> Search •{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">F4</kbd> Clear •{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">F8</kbd> Hold •{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px]">F9</kbd> Pay
          </p>
        </div>

        {/* Action Buttons: Hold, Resume, Clear */}
        <div className="flex items-center gap-2 flex-wrap">
          {heldDrafts.length > 0 && (
            <button
              onClick={() => setHeldDraftsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition shadow-2xs"
            >
              <PlayCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>Resume Drafts ({heldDrafts.length})</span>
            </button>
          )}

          <button
            onClick={handleHoldSale}
            disabled={cart.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            title="Save draft for later (F8)"
          >
            <PauseCircle className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Hold Sale</span>
            <span className="text-[10px] text-slate-400 font-mono sm:hidden">Hold</span>
          </button>

          <button
            onClick={() => setClearConfirmOpen(true)}
            disabled={cart.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 disabled:opacity-40 transition"
            title="Clear current cart (F4)"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Clear Cart</span>
          </button>
        </div>
      </div>

      {/* POS Layout Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Product Search & Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search Box & Category Filters */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search name, SKU, or scan barcode (F2)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50/80 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
              />
              <Barcode className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full shrink-0 transition ${
                    selectedCategory === cat
                      ? "bg-slate-900 text-white shadow-2xs"
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
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
              <p className="text-sm">Loading store products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <Search className="h-8 w-8 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No matching products found</p>
              <p className="text-xs text-slate-400">Try searching a different keyword or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const inCart = cart.find((c) => c.id === p.id);
                const isOutOfStock = p.stock <= 0;
                const isLowStock = p.stock > 0 && p.stock <= p.reorderLevel;

                return (
                  <div
                    key={p.id}
                    onClick={() => !isOutOfStock && addToCart(p)}
                    className={`group relative bg-white border rounded-xl p-3 flex flex-col justify-between transition cursor-pointer select-none ${
                      isOutOfStock
                        ? "opacity-50 border-slate-200 cursor-not-allowed bg-slate-50"
                        : "border-slate-200 hover:border-blue-500 hover:shadow-md"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="text-slate-400 truncate max-w-[80px]">{p.sku}</span>
                        {isOutOfStock ? (
                          <span className="text-red-600 font-bold">Out of Stock</span>
                        ) : isLowStock ? (
                          <span className="text-amber-600 font-bold">{p.stock} left</span>
                        ) : (
                          <span className="text-slate-500 font-medium">{p.stock} in stock</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-blue-600 transition">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-sm">
                        {formatMoney(p.price)}
                      </span>
                      {inCart ? (
                        <span className="h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs">
                          {inCart.quantity}
                        </span>
                      ) : (
                        <span className="h-6 w-6 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center text-xs transition">
                          +
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Active Cart & Checkout Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-2xs p-4 flex flex-col justify-between">
          <div>
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Current Cart</h2>
                <span className="text-xs text-slate-400">
                  {cart.reduce((total, i) => total + i.quantity, 0)} total units
                </span>
              </div>

              {/* Customer Selector */}
              <div className="flex items-center gap-1.5">
                <select
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 max-w-[130px] truncate"
                >
                  {recentCustomers.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setNewCustomerModalOpen(true)}
                  className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                  title="Add New Customer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto my-2 pr-1">
              {cart.length === 0 ? (
                <div className="py-14 text-center text-slate-400 space-y-1">
                  <p className="text-sm font-medium">Cart is empty</p>
                  <p className="text-xs text-slate-400">Click products or scan barcodes to begin sale</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatMoney(item.price)} × {item.quantity} ={" "}
                        <span className="font-bold text-slate-800">
                          {formatMoney(roundMoney(item.price * item.quantity))}
                        </span>
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="h-6 w-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => setExplicitQuantity(item.id, Number(e.target.value))}
                        className="w-8 text-center text-xs font-bold text-slate-900 bg-transparent border-0 p-0 focus:ring-0"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        disabled={item.quantity >= item.stock}
                        className="h-6 w-6 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 flex items-center justify-center text-slate-600 transition"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="h-6 w-6 rounded text-red-500 hover:bg-red-50 flex items-center justify-center transition ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount & Tax Options */}
            {cart.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span>Discount (ETB):</span>
                    {!canApplyDiscount && (
                      <span className="text-[10px] text-amber-600 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Manager Required
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount || ""}
                    disabled={!canApplyDiscount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-24 text-right rounded-md border border-slate-200 px-2 py-1 font-mono disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                {/* Optional VAT (15%) Toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyVat}
                      onChange={(e) => setApplyVat(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-0"
                    />
                    <span>Apply 15% VAT Tax</span>
                  </label>
                  {applyVat && (
                    <span className="font-mono text-slate-600">+{formatMoney(taxTotal)}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Summary & Checkout Button */}
          <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono">{formatMoney(subtotal)}</span>
            </div>

            {safeDiscount > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-medium">
                <span>Discount:</span>
                <span className="font-mono">-{formatMoney(safeDiscount)}</span>
              </div>
            )}

            {taxTotal > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>VAT (15%):</span>
                <span className="font-mono">+{formatMoney(taxTotal)}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold text-slate-900 pt-1 border-t border-slate-100">
              <span>Grand Total:</span>
              <span className="text-blue-700 font-mono text-lg">{formatMoney(grandTotal)}</span>
            </div>

            <button
              onClick={openCheckoutModal}
              disabled={cart.length === 0}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/30 disabled:opacity-50 disabled:pointer-events-none transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Complete Sale (F9)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Checkout & Payment Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Checkout & Payment</h3>
                <p className="text-xs text-slate-500">Customer: {customerName}</p>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Total Due Banner */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Total Due:</span>
              <span className="text-2xl font-black text-blue-700 font-mono">
                {formatMoney(grandTotal)}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                    paymentMethod === "CASH"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <Banknote className="h-4 w-4 text-emerald-600" />
                  <span>Cash Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("TELEBIRR")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                    paymentMethod === "TELEBIRR"
                      ? "border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span>Telebirr</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("CBE_BIRR")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                    paymentMethod === "CBE_BIRR"
                      ? "border-purple-600 bg-purple-50 text-purple-800 ring-2 ring-purple-500/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span>CBE Birr</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <Building className="h-4 w-4 text-amber-600" />
                  <span>Bank Transfer</span>
                </button>
              </div>
            </div>

            {/* Payment Details */}
            {paymentMethod === "CASH" ? (
              <div className="space-y-3 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Cash Tendered (ETB)</label>
                  <div className="flex gap-1">
                    {[0, 50, 100, 200, 500].map((extra) => (
                      <button
                        key={extra}
                        type="button"
                        onClick={() =>
                          setCashTendered(
                            extra === 0 ? grandTotal : roundMoney(Math.ceil(grandTotal / 50) * 50 + extra)
                          )
                        }
                        className="px-2 py-0.5 text-[10px] font-bold rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        {extra === 0 ? "Exact" : `+${extra}`}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="number"
                  min={grandTotal}
                  value={cashTendered || ""}
                  onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                  className="w-full text-lg font-mono font-bold rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />

                {/* Change Display */}
                <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60">
                  <span className="text-xs font-bold text-slate-600">Change to Return:</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    {formatMoney(cashChange)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                <label className="text-xs font-bold text-slate-700 block">
                  {paymentMethod} Confirmation Reference Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TL-8921034 or CBE-99120"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full text-sm font-mono font-bold rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                />
                <p className="text-[11px] text-slate-500">
                  Enter the transaction ID shown on the customer's SMS receipt before finalizing.
                </p>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
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
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Printable Receipt Body */}
            <div id="pos-print-receipt" className="text-center font-mono text-xs space-y-2">
              <div className="border-b border-dashed border-slate-300 pb-3">
                <span className="inline-block p-1.5 bg-emerald-100 text-emerald-700 rounded-full mb-1">
                  <Check className="h-5 w-5" />
                </span>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {completedReceipt.business.name}
                </h2>
                {completedReceipt.business.address && (
                  <p className="text-[10px] text-slate-500">{completedReceipt.business.address}</p>
                )}
                {completedReceipt.business.phone && (
                  <p className="text-[10px] text-slate-500">Tel: {completedReceipt.business.phone}</p>
                )}
                {completedReceipt.business.taxNumber && (
                  <p className="text-[10px] text-slate-600 font-bold">
                    TIN: {completedReceipt.business.taxNumber}
                  </p>
                )}
                <p className="text-[11px] font-bold text-blue-700 mt-1">
                  {completedReceipt.saleNumber}
                </p>
                <p className="text-[10px] text-slate-400">
                  {new Date(completedReceipt.createdAt).toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-500">
                  Cashier: {completedReceipt.cashier.name} • Client: {completedReceipt.customerName}
                </p>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 text-left max-h-48 overflow-y-auto pr-1">
                {completedReceipt.items.map((item) => (
                  <div key={item.productId} className="py-1 flex justify-between text-[11px]">
                    <div className="truncate pr-2">
                      <span>{item.name}</span>
                      <div className="text-[9px] text-slate-400">
                        {item.quantity} × {item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <span className="font-bold shrink-0">{item.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-right text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatMoney(completedReceipt.subtotal)}</span>
                </div>
                {completedReceipt.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Discount:</span>
                    <span>-{formatMoney(completedReceipt.discountTotal)}</span>
                  </div>
                )}
                {completedReceipt.taxTotal > 0 && (
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>+{formatMoney(completedReceipt.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t">
                  <span>Grand Total:</span>
                  <span>{formatMoney(completedReceipt.grandTotal)}</span>
                </div>

                <div className="pt-1 text-[10px] text-slate-600 text-left border-t border-slate-100">
                  <div>
                    Payment: <span className="font-bold">{completedReceipt.payment.method}</span>
                  </div>
                  {completedReceipt.payment.reference && (
                    <div>Ref / Txn: {completedReceipt.payment.reference}</div>
                  )}
                  {completedReceipt.payment.method === "CASH" && (
                    <div className="flex justify-between pt-0.5">
                      <span>Tendered: {formatMoney(completedReceipt.payment.tendered)}</span>
                      <span className="font-bold text-emerald-700">
                        Change: {formatMoney(completedReceipt.payment.change)}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-[9px] text-slate-400 text-center pt-2">
                  *** Powered by BizFlow Ethiopia ***
                </p>
              </div>
            </div>

            {/* Receipt Modal Action Buttons */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadReceipt}
                className="py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-1 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Text</span>
              </button>

              <button
                onClick={() => setCompletedReceipt(null)}
                className="py-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white transition"
              >
                New Sale
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
                className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={clearCart}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs"
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
              <h3 className="font-bold text-slate-900 text-base">Held Sale Drafts</h3>
              <button
                onClick={() => setHeldDraftsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
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
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between gap-3 transition"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{draft.customerName}</h4>
                      <p className="text-[11px] text-slate-500">
                        {draft.items.length} items • Held at {draft.savedAt}
                      </p>
                      <span className="text-xs font-bold text-blue-700 font-mono">
                        {formatMoney(draftTotal)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleResumeSale(draft)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs"
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
              <h3 className="font-bold text-slate-900 text-base">Add New Customer</h3>
              <button
                onClick={() => setNewCustomerModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Customer Name or Shop</label>
              <input
                type="text"
                placeholder="e.g. Alazar Trading, Genet B."
                value={newCustomerInput}
                onChange={(e) => setNewCustomerInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNewCustomer()}
                autoFocus
                className="w-full text-sm rounded-lg border border-slate-300 p-2 text-slate-900"
              />
              <p className="text-[11px] text-slate-400">
                This customer will be linked to the current sale without losing any items in your cart.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setNewCustomerModalOpen(false)}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNewCustomer}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white shadow-xs"
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
