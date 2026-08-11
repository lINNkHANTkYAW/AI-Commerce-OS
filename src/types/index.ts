export type OrganizationRole = 'owner' | 'manager' | 'marketing' | 'sales' | 'support';

export interface Organization {
  id: string;
  name: string;
  industry: string;
  country: string;
  currency: string; // e.g. "MMK" or "USD"
  timeZone: string;
  description: string;
  logoUrl?: string;
  brandColor?: string;
  toneOfVoice?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: OrganizationRole;
  organizationId: string;
}

export interface Product {
  id: string;
  organizationId: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  priceMMK: number;
  priceUSD: number;
  discountPriceMMK?: number;
  discountPriceUSD?: number;
  stockQuantity: number;
  lowStockThreshold: number;
  reservedQuantity: number;
  imageUrl: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  organizationId: string;
  productId: string;
  quantityChange: number;
  reason: 'sale' | 'restock' | 'adjustment' | 'return' | 'reservation';
  notes?: string;
  createdAt: string;
}

export type LifecycleStage = 'new' | 'lead' | 'qualified' | 'customer' | 'repeat' | 'at_risk' | 'inactive';

export interface CustomerProfile {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email?: string;
  country: string;
  language: 'en' | 'my' | 'myanglish';
  messagingHandles: {
    telegram?: string;
    facebook?: string;
    whatsapp?: string;
    instagram?: string;
  };
  lifecycleStage: LifecycleStage;
  tags: string[];
  notes: string[];
  totalOrders: number;
  totalSpentMMK: number;
  averageOrderValueMMK: number;
  productInterests: string[];
  buyingIntentScore: number; // 0-100
  priceSensitivity: 'low' | 'medium' | 'high';
  churnRisk: 'low' | 'medium' | 'high';
  aiSummary: string;
  recommendedFollowUp?: string;
  marketingConsent: boolean;
  createdAt: string;
  lastInteractionAt: string;
}

export type ChannelType = 'web_chat' | 'telegram' | 'facebook' | 'instagram' | 'whatsapp';

export interface Message {
  id: string;
  conversationId: string;
  sender: 'customer' | 'ai' | 'agent';
  senderName?: string;
  text: string;
  channel: ChannelType;
  metadata?: {
    suggestedProducts?: string[]; // Product IDs
    draftOrderId?: string;
    intentLabel?: string;
    toolCalls?: Array<{ tool: string; args: any; result: any }>;
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  organizationId: string;
  customerId: string;
  channel: ChannelType;
  assignedToRole?: OrganizationRole;
  assignedToUserId?: string;
  unread: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  leadTemperature: 'cold' | 'warm' | 'hot';
  aiConfidenceScore: number; // 0-100
  humanHandoffRequired: boolean;
  status: 'active' | 'resolved' | 'escalated';
  lastMessageText: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'draft'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refund_requested'
  | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceMMK: number;
  unitPriceUSD: number;
  totalMMK: number;
}

export interface Order {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  channel: ChannelType;
  items: OrderItem[];
  subtotalMMK: number;
  discountMMK: number;
  deliveryFeeMMK: number;
  totalMMK: number;
  totalUSD: number;
  status: OrderStatus;
  paymentMethod: 'cash_on_delivery' | 'kpay' | 'wave_pay' | 'bank_transfer' | 'credit_card';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  deliveryAddress: string;
  notes?: string;
  sourceCampaignId?: string;
  sourceConversationId?: string;
  createdViaAI: boolean;
  createdAt: string;
}

export type CampaignStatus = 'draft' | 'awaiting_approval' | 'approved' | 'scheduled' | 'active' | 'paused' | 'completed';

export interface Campaign {
  id: string;
  organizationId: string;
  title: string;
  objective: string;
  targetAudience: string;
  budgetUSD: number;
  recommendedProductIds: string[];
  valueProposition: string;
  offerDetails: string;
  channels: ChannelType[];
  content: {
    facebookCopy?: string;
    instagramCaption?: string;
    videoScript?: string;
    emailCopy?: string;
    smsCopy?: string;
  };
  creativeBrief: {
    visualConcept: string;
    brandColors: string[];
    imagePrompt: string;
    typographyGuide: string;
    ctaText: string;
    recommendedDimensions: string;
  };
  hashtags: string[];
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  kpis: {
    expectedInquiries: number;
    expectedOrders: number;
    targetRevenueUSD: number;
    actualInquiries?: number;
    actualOrders?: number;
    actualRevenueUSD?: number;
  };
  createdAt: string;
}

export interface ScheduledPost {
  id: string;
  organizationId: string;
  campaignId?: string;
  channel: ChannelType;
  content: string;
  imageUrl?: string;
  scheduledAt: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  externalPostId?: string;
  publishedAt?: string;
  errorMessage?: string;
}

export interface ApprovalRequest {
  id: string;
  organizationId: string;
  type: 'publish_campaign' | 'apply_discount' | 'cancel_order' | 'approve_refund' | 'sensitive_ai_action' | 'bulk_message';
  title: string;
  description: string;
  requestedBy: 'ai' | 'user';
  requesterName: string;
  riskLevel: 'low' | 'medium' | 'high';
  payload: any;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  decisionNotes?: string;
  createdAt: string;
  decidedAt?: string;
}

export interface AIRecommendation {
  id: string;
  organizationId: string;
  title: string;
  summary: string;
  supportingData: string;
  suggestedAction: string;
  actionType: 'follow_up' | 'restock' | 'adjust_campaign' | 'contact_high_intent' | 'optimize_pricing';
  payload?: any;
  confidenceScore: number;
  dismissed: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface KnowledgeDoc {
  id: string;
  organizationId: string;
  category: 'faq' | 'policy' | 'delivery' | 'payment' | 'product_guide';
  title: string;
  content: string;
  updatedAt: string;
}
