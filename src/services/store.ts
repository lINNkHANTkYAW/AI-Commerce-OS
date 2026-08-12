import { useState, useEffect } from 'react';
import {
  Organization,
  UserProfile,
  Product,
  CustomerProfile,
  Conversation,
  Message,
  Order,
  Campaign,
  ScheduledPost,
  ApprovalRequest,
  AIRecommendation,
  KnowledgeDoc,
  AuditLog,
  OrderStatus,
  CampaignStatus,
  ChannelType
} from '../types';
import {
  DEMO_ORGANIZATION,
  DEMO_USER,
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_CONVERSATIONS,
  INITIAL_MESSAGES,
  INITIAL_ORDERS,
  INITIAL_CAMPAIGNS,
  INITIAL_SCHEDULED_POSTS,
  INITIAL_APPROVALS,
  INITIAL_RECOMMENDATIONS,
  INITIAL_KNOWLEDGE,
  INITIAL_AUDIT_LOGS
} from '../data/seedData';

import {
  syncProductToSupabase,
  syncOrderToSupabase,
  syncApprovalToSupabase
} from './supabase';

const STORAGE_KEY = 'ai_commerce_os_state_v1';

export interface AppState {
  currentOrg: Organization;
  user: UserProfile;
  products: Product[];
  customers: CustomerProfile[];
  conversations: Conversation[];
  messages: Message[];
  orders: Order[];
  campaigns: Campaign[];
  scheduledPosts: ScheduledPost[];
  approvals: ApprovalRequest[];
  recommendations: AIRecommendation[];
  knowledgeDocs: KnowledgeDoc[];
  auditLogs: AuditLog[];
  language: 'en' | 'my'; // English or Myanmar Language
}

const getDefaultState = (): AppState => ({
  currentOrg: DEMO_ORGANIZATION,
  user: DEMO_USER,
  products: INITIAL_PRODUCTS,
  customers: INITIAL_CUSTOMERS,
  conversations: INITIAL_CONVERSATIONS,
  messages: INITIAL_MESSAGES,
  orders: INITIAL_ORDERS,
  campaigns: INITIAL_CAMPAIGNS,
  scheduledPosts: INITIAL_SCHEDULED_POSTS,
  approvals: INITIAL_APPROVALS,
  recommendations: INITIAL_RECOMMENDATIONS,
  knowledgeDocs: INITIAL_KNOWLEDGE,
  auditLogs: INITIAL_AUDIT_LOGS,
  language: 'en',
});

class StoreService {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): AppState {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...getDefaultState(),
            ...parsed,
          };
        }
      }
    } catch (e) {
      console.error('Failed to parse saved state from localStorage:', e);
    }
    return getDefaultState();
  }

  private saveState() {
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public getState(): AppState {
    return this.state;
  }

  public resetDemoData() {
    this.state = getDefaultState();
    this.saveState();
  }

  public setLanguage(lang: 'en' | 'my') {
    this.state.language = lang;
    this.saveState();
  }

  public setRole(role: UserProfile['role']) {
    this.state.user.role = role;
    this.saveState();
  }

  public switchOrganization(org: Organization) {
    this.state.currentOrg = org;
    this.saveState();
  }

  // --- Audit Log ---
  public logAction(actor: string, action: string, details: string) {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: this.state.currentOrg.id,
      actor,
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs = [log, ...this.state.auditLogs];
    this.saveState();
  }

  // --- Products & Inventory ---
  public addProduct(product: Omit<Product, 'id' | 'organizationId' | 'createdAt'>) {
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      organizationId: this.state.currentOrg.id,
      createdAt: new Date().toISOString(),
    };
    this.state.products.push(newProduct);
    this.logAction('User', 'addProduct', `Added product: ${newProduct.name} (SKU: ${newProduct.sku})`);
    this.saveState();
    syncProductToSupabase(newProduct);
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Product>) {
    this.state.products = this.state.products.map((p) => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        syncProductToSupabase(updated);
        return updated;
      }
      return p;
    });
    this.logAction('User', 'updateProduct', `Updated product ${id}`);
    this.saveState();
  }

  public adjustInventory(id: string, delta: number, reason: string) {
    const product = this.state.products.find((p) => p.id === id);
    if (product) {
      product.stockQuantity = Math.max(0, product.stockQuantity + delta);
      this.logAction('User', 'adjustInventory', `Adjusted inventory for ${product.name} by ${delta} (${reason})`);
      this.saveState();
      syncProductToSupabase(product);
    }
  }

  // --- Customers (CRM) ---
  public updateCustomer(id: string, updates: Partial<CustomerProfile>) {
    this.state.customers = this.state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.saveState();
  }

  public addCustomerNote(customerId: string, noteText: string) {
    const customer = this.state.customers.find((c) => c.id === customerId);
    if (customer) {
      customer.notes.push(noteText);
      this.logAction('AI Agent', 'addCustomerNote', `Added note to customer ${customer.name}: ${noteText}`);
      this.saveState();
    }
  }

  // --- Conversations & Messages ---
  public sendMessage(conversationId: string, sender: 'customer' | 'ai' | 'agent', text: string, senderName?: string, metadata?: any) {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      sender,
      senderName,
      text,
      channel: 'web_chat',
      metadata,
      createdAt: new Date().toISOString(),
    };

    this.state.messages.push(message);

    // Update conversation last message & timestamp
    const conv = this.state.conversations.find((c) => c.id === conversationId);
    if (conv) {
      conv.lastMessageText = text;
      conv.updatedAt = new Date().toISOString();
      if (sender === 'customer') {
        conv.unread = true;
      }
    }

    this.saveState();
    return message;
  }

  // --- Orders ---
  public createDraftOrder(orderData: Omit<Order, 'id' | 'organizationId' | 'createdAt'>): Order {
    const newOrder: Order = {
      ...orderData,
      id: `ord_${Math.floor(1000 + Math.random() * 9000)}`,
      organizationId: this.state.currentOrg.id,
      createdAt: new Date().toISOString(),
    };

    this.state.orders.unshift(newOrder);

    // Reserve stock
    newOrder.items.forEach((item) => {
      const prod = this.state.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.reservedQuantity += item.quantity;
        syncProductToSupabase(prod);
      }
    });

    this.logAction('AI Sales Agent', 'createDraftOrder', `Created draft order ${newOrder.id} for ${newOrder.customerName}`);
    this.saveState();
    syncOrderToSupabase(newOrder);
    return newOrder;
  }

  public updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const order = this.state.orders.find((o) => o.id === orderId);
    if (!order) return;

    const oldStatus = order.status;
    order.status = newStatus;

    // Deduct stock upon confirmation
    if ((oldStatus === 'draft' || oldStatus === 'awaiting_confirmation') && (newStatus === 'confirmed' || newStatus === 'processing')) {
      order.items.forEach((item) => {
        const prod = this.state.products.find((p) => p.id === item.productId);
        if (prod) {
          prod.reservedQuantity = Math.max(0, prod.reservedQuantity - item.quantity);
          prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
          syncProductToSupabase(prod);
        }
      });

      // Update customer total spending & lifetime value
      const customer = this.state.customers.find((c) => c.id === order.customerId);
      if (customer) {
        customer.totalOrders += 1;
        customer.totalSpentMMK += order.totalMMK;
        customer.averageOrderValueMMK = Math.round(customer.totalSpentMMK / customer.totalOrders);
        customer.lifecycleStage = customer.totalOrders > 1 ? 'repeat' : 'customer';
      }
    } else if (newStatus === 'cancelled' || newStatus === 'refunded') {
      // Release reservation if cancelled from draft
      if (oldStatus === 'draft' || oldStatus === 'awaiting_confirmation') {
        order.items.forEach((item) => {
          const prod = this.state.products.find((p) => p.id === item.productId);
          if (prod) {
            prod.reservedQuantity = Math.max(0, prod.reservedQuantity - item.quantity);
            syncProductToSupabase(prod);
          }
        });
      }
    }

    this.logAction('User', 'updateOrderStatus', `Changed Order ${order.id} status from ${oldStatus} to ${newStatus}`);
    this.saveState();
    syncOrderToSupabase(order);
  }

  // --- Campaigns & Posts ---
  public addCampaign(campaign: Omit<Campaign, 'id' | 'organizationId' | 'createdAt'>): Campaign {
    const newCamp: Campaign = {
      ...campaign,
      id: `camp_${Date.now()}`,
      organizationId: this.state.currentOrg.id,
      createdAt: new Date().toISOString(),
    };
    this.state.campaigns.unshift(newCamp);

    // Auto-create scheduled posts
    if (campaign.content.facebookCopy) {
      this.state.scheduledPosts.push({
        id: `post_${Date.now()}_fb`,
        organizationId: this.state.currentOrg.id,
        campaignId: newCamp.id,
        channel: 'facebook',
        content: campaign.content.facebookCopy,
        imageUrl: newCamp.creativeBrief.imagePrompt ? 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80' : undefined,
        scheduledAt: campaign.startDate,
        status: 'scheduled',
      });
    }

    if (campaign.content.instagramCaption) {
      this.state.scheduledPosts.push({
        id: `post_${Date.now()}_ig`,
        organizationId: this.state.currentOrg.id,
        campaignId: newCamp.id,
        channel: 'instagram',
        content: campaign.content.instagramCaption,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
        scheduledAt: campaign.startDate,
        status: 'scheduled',
      });
    }

    this.logAction('Campaign Autopilot', 'addCampaign', `Generated campaign "${newCamp.title}" with $${newCamp.budgetUSD} budget`);
    this.saveState();
    return newCamp;
  }

  public updateCampaignStatus(id: string, status: CampaignStatus) {
    const camp = this.state.campaigns.find((c) => c.id === id);
    if (camp) {
      camp.status = status;
      this.logAction('User', 'updateCampaignStatus', `Updated campaign "${camp.title}" status to ${status}`);
      this.saveState();
    }
  }

  // --- Approvals ---
  public handleApproval(approvalId: string, status: 'approved' | 'rejected', notes?: string) {
    const req = this.state.approvals.find((a) => a.id === approvalId);
    if (!req) return;

    req.status = status;
    req.reviewedBy = this.state.user.fullName;
    req.decisionNotes = notes || (status === 'approved' ? 'Approved by organization owner' : 'Rejected by owner');
    req.decidedAt = new Date().toISOString();

    if (status === 'approved' && req.type === 'publish_campaign') {
      const campId = req.payload?.campaignId;
      if (campId) {
        this.updateCampaignStatus(campId, 'approved');
      }
    } else if (status === 'approved' && req.type === 'apply_discount') {
      const custId = req.payload?.customerId;
      if (custId) {
        this.addCustomerNote(custId, `Approved ${req.payload?.discountMMK} MMK discount promo code.`);
      }
    }

    this.logAction('User', 'handleApproval', `${status.toUpperCase()} approval request: ${req.title}`);
    this.saveState();
    syncApprovalToSupabase(req);
  }

  public createApprovalRequest(request: Omit<ApprovalRequest, 'id' | 'organizationId' | 'createdAt' | 'status'>) {
    const newReq: ApprovalRequest = {
      ...request,
      id: `appr_${Date.now()}`,
      organizationId: this.state.currentOrg.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.state.approvals.unshift(newReq);
    this.saveState();
    syncApprovalToSupabase(newReq);
    return newReq;
  }

  // --- Recommendations ---
  public dismissRecommendation(id: string) {
    const rec = this.state.recommendations.find((r) => r.id === id);
    if (rec) {
      rec.dismissed = true;
      this.saveState();
    }
  }
}

export const store = new StoreService();

export function useAppStore() {
  const [state, setState] = useState<AppState>(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setState({ ...store.getState() });
    });
    return unsubscribe;
  }, []);

  return {
    state,
    resetDemoData: () => store.resetDemoData(),
    setLanguage: (lang: 'en' | 'my') => store.setLanguage(lang),
    setRole: (role: UserProfile['role']) => store.setRole(role),
    switchOrganization: (org: Organization) => store.switchOrganization(org),
    addProduct: (p: Parameters<typeof store.addProduct>[0]) => store.addProduct(p),
    updateProduct: (id: string, updates: Parameters<typeof store.updateProduct>[1]) => store.updateProduct(id, updates),
    adjustInventory: (id: string, delta: number, reason: string) => store.adjustInventory(id, delta, reason),
    updateCustomer: (id: string, updates: Parameters<typeof store.updateCustomer>[1]) => store.updateCustomer(id, updates),
    addCustomerNote: (id: string, note: string) => store.addCustomerNote(id, note),
    sendMessage: (...args: Parameters<typeof store.sendMessage>) => store.sendMessage(...args),
    createDraftOrder: (data: Parameters<typeof store.createDraftOrder>[0]) => store.createDraftOrder(data),
    updateOrderStatus: (id: string, status: OrderStatus) => store.updateOrderStatus(id, status),
    addCampaign: (c: Parameters<typeof store.addCampaign>[0]) => store.addCampaign(c),
    updateCampaignStatus: (id: string, status: CampaignStatus) => store.updateCampaignStatus(id, status),
    handleApproval: (id: string, status: 'approved' | 'rejected', notes?: string) => store.handleApproval(id, status, notes),
    createApprovalRequest: (req: Parameters<typeof store.createApprovalRequest>[0]) => store.createApprovalRequest(req),
    dismissRecommendation: (id: string) => store.dismissRecommendation(id),
    logAction: (actor: string, action: string, details: string) => store.logAction(actor, action, details),
  };
}
