import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Product, Order, ApprovalRequest, Organization } from '../types';

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
 * 1. PERSISTENCE WRITES TO SUPABASE (Using correct org_id column)
 */

export async function syncProductToSupabase(product: Product): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('products').upsert({
      id: product.id,
      org_id: product.organizationId || null,
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

export async function syncOrderToSupabase(order: Order): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('orders').upsert({
      id: order.id,
      org_id: order.organizationId || null,
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

export async function syncApprovalToSupabase(approval: ApprovalRequest): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('approvals').upsert({
      id: approval.id,
      org_id: approval.organizationId || null,
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
 * 2. FETCH DATA FROM SUPABASE (Source of Truth)
 */

export async function fetchProductsFromSupabase(): Promise<Product[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('products').select('*');
    if (error || !data || data.length === 0) return [];

    return data.map((row: any) => ({
      id: row.id,
      sku: row.id,
      name: row.name,
      category: row.category,
      priceMMK: Number(row.price_mmk) || 0,
      priceUSD: Math.round((Number(row.price_mmk) || 0) / 1900),
      stockQuantity: row.stock_quantity || 0,
      reservedQuantity: 0,
      lowStockThreshold: 3,
      imageUrl: row.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      description: row.description || '',
      isActive: true,
      tags: [row.category],
      organizationId: row.org_id || 'org_01',
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('[Supabase Fetch Products Exception]:', e);
    return [];
  }
}

export async function fetchOrdersFromSupabase(): Promise<Order[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('orders').select('*');
    if (error || !data || data.length === 0) return [];

    return data.map((row: any) => {
      let items = [];
      try {
        items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items;
      } catch (e) {
        items = [];
      }
      return {
        id: row.id,
        organizationId: row.org_id || 'org_01',
        customerId: `cust_${row.customer_phone || 'anon'}`,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        channel: row.channel || 'web',
        items,
        subtotalMMK: Number(row.total_amount_mmk) || 0,
        discountMMK: 0,
        deliveryFeeMMK: 0,
        totalMMK: Number(row.total_amount_mmk) || 0,
        totalUSD: Math.round((Number(row.total_amount_mmk) || 0) / 1900),
        status: row.status || 'draft',
        paymentMethod: 'kpay',
        paymentStatus: 'pending',
        deliveryAddress: row.shipping_address || '',
        createdAt: row.created_at || new Date().toISOString(),
        createdViaAI: true,
      };
    });
  } catch (e) {
    console.warn('[Supabase Fetch Orders Exception]:', e);
    return [];
  }
}

export async function fetchConversationsFromSupabase(): Promise<any[]> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('conversations')
      .select('*, messages(*)')
      .order('updated_at', { ascending: false });
    if (error || !data) return [];
    return data;
  } catch (e) {
    console.warn('[Supabase Fetch Conversations Exception]:', e);
    return [];
  }
}

export async function fetchAIActionsFromSupabase(limit = 20): Promise<any[]> {
  try {
    const supabase = getSupabaseAdmin();
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

/**
 * 3. SUPABASE AUTH & TENANT IDENTITY HELPERS
 */

export async function signUpWithEmail(email: string, pass: string, fullName?: string) {
  try {
    const supabase = getSupabaseClient();
    const res = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName || '',
        },
      },
    });

    if (res.data?.user) {
      try {
        const admin = getSupabaseAdmin();
        await admin.from('profiles').upsert({
          id: res.data.user.id,
          email: res.data.user.email,
          full_name: fullName || '',
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[Profile Upsert Notice]:', e);
      }
    }

    return res;
  } catch (err: any) {
    console.warn('[signUpWithEmail Exception]:', err);
    return { data: { user: null, session: null }, error: { message: err.message || 'Account creation error' } };
  }
}

export async function signInWithEmail(email: string, pass: string) {
  try {
    const supabase = getSupabaseClient();
    const res = await supabase.auth.signInWithPassword({ email, password: pass });
    return res;
  } catch (err: any) {
    console.warn('[signInWithEmail Exception]:', err);
    return { data: { user: null, session: null }, error: { message: err.message || 'Sign in failed' } };
  }
}

export async function signOutUser() {
  try {
    const supabase = getSupabaseClient();
    return await supabase.auth.signOut();
  } catch (e) {
    return { error: null };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getUser();
    return data?.user || null;
  } catch (e) {
    return null;
  }
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    const admin = getSupabaseAdmin();
    const { data: members, error: memErr } = await admin
      .from('organization_members')
      .select('org_id, role, organizations(*)')
      .eq('user_id', userId);

    if (memErr || !members) return [];

    return members
      .filter((m: any) => m.organizations)
      .map((m: any) => ({
        id: m.organizations.id,
        name: m.organizations.name,
        industry: 'Retail & Electronics',
        country: m.organizations.country || 'Myanmar',
        currency: m.organizations.currency || 'MMK',
        timeZone: 'Asia/Yangon',
        description: 'Multi-channel AI store',
        toneOfVoice: m.organizations.tone_of_voice || 'Friendly',
        createdAt: m.organizations.created_at || new Date().toISOString(),
      }));
  } catch (e) {
    console.warn('[Supabase getUserOrganizations Exception]:', e);
    return [];
  }
}

export async function createOrganizationForUser(
  userId: string,
  org: { name: string; country?: string; currency?: string; toneOfVoice?: string }
): Promise<Organization | null> {
  try {
    const admin = getSupabaseAdmin();
    const { data: createdOrg, error: orgErr } = await admin
      .from('organizations')
      .insert({
        name: org.name,
        country: org.country || 'Myanmar',
        currency: org.currency || 'MMK',
        tone_of_voice: org.toneOfVoice || 'Friendly, professional',
      })
      .select()
      .single();

    if (orgErr || !createdOrg) {
      console.warn('[createOrganizationForUser Error]:', orgErr?.message);
      return null;
    }

    // Add membership
    await admin.from('organization_members').insert({
      org_id: createdOrg.id,
      user_id: userId,
      role: 'owner',
    });

    return {
      id: createdOrg.id,
      name: createdOrg.name,
      industry: 'Retail & Electronics',
      country: createdOrg.country || 'Myanmar',
      currency: createdOrg.currency || 'MMK',
      timeZone: 'Asia/Yangon',
      description: 'Multi-channel AI store',
      toneOfVoice: createdOrg.tone_of_voice || 'Friendly',
      createdAt: createdOrg.created_at || new Date().toISOString(),
    };
  } catch (e) {
    console.warn('[createOrganizationForUser Exception]:', e);
    return null;
  }
}

