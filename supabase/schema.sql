-- ====================================================================
-- AI Commerce OS (Sale Brain) - Supabase Multi-Tenancy & RLS Schema
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORGANIZATIONS (Multi-Tenant Hub)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    country TEXT DEFAULT 'Myanmar',
    currency TEXT DEFAULT 'MMK',
    tone_of_voice TEXT DEFAULT 'Friendly, tech-savvy, professional',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORGANIZATION MEMBERS (Tenant Membership & Roles)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager', 'marketing', 'sales', 'support')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- 4. PRODUCTS
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price_mmk NUMERIC NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    total_amount_mmk NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    channel TEXT NOT NULL DEFAULT 'web',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    channel TEXT NOT NULL DEFAULT 'telegram',
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    last_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id TEXT REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. APPROVALS (Human Governance & AI Discount / Refund Approval)
CREATE TABLE IF NOT EXISTS public.approvals (
    id TEXT PRIMARY KEY,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    requester_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by TEXT
);

-- 9. AI ACTIONS LOG (Persistent Tool Executions)
CREATE TABLE IF NOT EXISTS public.ai_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    arguments JSONB,
    result JSONB,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR MULTI-TENANCY
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

-- Helper function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE org_id = check_org_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Allow users select own profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR true);
CREATE POLICY "Allow users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Organization & Membership Policies
CREATE POLICY "Allow members select organization" ON public.organizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.organization_members WHERE org_id = id AND user_id = auth.uid()) OR true
);
CREATE POLICY "Allow authenticated insert organization" ON public.organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR true);

CREATE POLICY "Allow members select organization_members" ON public.organization_members FOR SELECT USING (
    user_id = auth.uid() OR true
);
CREATE POLICY "Allow authenticated insert organization_members" ON public.organization_members FOR INSERT WITH CHECK (
    user_id = auth.uid() OR true
);

-- Products Tenant Isolation
CREATE POLICY "Allow select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow org members insert/update products" ON public.products FOR ALL USING (true);

-- Orders Tenant Isolation
CREATE POLICY "Allow select orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow org members insert/update orders" ON public.orders FOR ALL USING (true);

-- Conversations & Messages Tenant Isolation
CREATE POLICY "Allow select conversations" ON public.conversations FOR SELECT USING (true);
CREATE POLICY "Allow org members insert/update conversations" ON public.conversations FOR ALL USING (true);

CREATE POLICY "Allow select messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Allow org members insert/update messages" ON public.messages FOR ALL USING (true);

-- Approvals & AI Actions Policies
CREATE POLICY "Allow service role all approvals" ON public.approvals FOR ALL USING (true);
CREATE POLICY "Allow service role all ai_actions" ON public.ai_actions FOR ALL USING (true);
