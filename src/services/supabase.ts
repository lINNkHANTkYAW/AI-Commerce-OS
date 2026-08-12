import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Order, ApprovalRequest } from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://nkpscafspmndmqyfgwzw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || '';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || '';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

// Public client for client-side / RLS operations
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  return supabaseClient;
}

// Server-side admin client bypassing RLS when required
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminClient;
}

/**
 * Persist or update product in Supabase DB
 */
export async function syncProductToSupabase(product: Product): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      organization_id: product.organizationId,
      name: product.name,
      category: product.category,
      price_mmk: product.priceMMK,
      stock_quantity: product.stockQuantity,
      image_url: product.imageUrl,
      description: product.description,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[Supabase Sync Product Error]:', error.message);
    return !error;
  } catch (e) {
    console.warn('[Supabase Product Exception]:', e);
    return false;
  }
}

/**
 * Persist order to Supabase DB
 */
export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      organization_id: order.organizationId,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      shipping_address: order.deliveryAddress,
      total_amount_mmk: order.totalMMK,
      status: order.status,
      items: JSON.stringify(order.items),
      channel: order.channel,
      created_at: order.createdAt,
    });
    if (error) console.warn('[Supabase Sync Order Error]:', error.message);
    return !error;
  } catch (e) {
    console.warn('[Supabase Order Exception]:', e);
    return false;
  }
}

/**
 * Persist human approval request to Supabase DB
 */
export async function syncApprovalToSupabase(approval: ApprovalRequest): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('approvals').upsert({
      id: approval.id,
      organization_id: approval.organizationId,
      title: approval.title,
      description: approval.description,
      risk_level: approval.riskLevel,
      requester_name: approval.requestedBy,
      status: approval.status,
      created_at: approval.createdAt,
      reviewed_by: approval.reviewedBy,
    });
    if (error) console.warn('[Supabase Sync Approval Error]:', error.message);
    return !error;
  } catch (e) {
    console.warn('[Supabase Approval Exception]:', e);
    return false;
  }
}

/**
 * Sync conversation to Supabase DB
 */
export async function syncConversationToSupabase(conv: {
  id: string;
  orgId?: string;
  channel: string;
  customerId: string;
  customerName: string;
  status?: string;
  lastMessage?: string;
}): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('conversations').upsert({
      id: conv.id,
      org_id: conv.orgId || null,
      channel: conv.channel,
      customer_id: conv.customerId,
      customer_name: conv.customerName,
      status: conv.status || 'active',
      last_message: conv.lastMessage || '',
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn('[Supabase Sync Conversation Error]:', error.message);
    return !error;
  } catch (e) {
    console.warn('[Supabase Conversation Exception]:', e);
    return false;
  }
}

/**
 * Sync message to Supabase DB
 */
export async function syncMessageToSupabase(msg: {
  conversationId: string;
  sender: 'customer' | 'ai' | 'agent';
  text: string;
}): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('messages').insert({
      conversation_id: msg.conversationId,
      sender: msg.sender,
      text: msg.text,
      timestamp: new Date().toISOString(),
    });
    if (error) console.warn('[Supabase Sync Message Error]:', error.message);
    return !error;
  } catch (e) {
    console.warn('[Supabase Message Exception]:', e);
    return false;
  }
}

/**
 * Fetch conversations from Supabase
 */
export async function fetchConversationsFromSupabase(): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .order('updated_at', { ascending: false });
    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}

/**
 * Fetch latest persistent logs from Supabase
 */
export async function fetchAIActionsFromSupabase(limit = 20): Promise<any[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('ai_actions')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
}

