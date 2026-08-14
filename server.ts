import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { AI_TOOL_DECLARATIONS, executeAITool } from './src/services/aiTools';
import { getSupabaseAdmin, getSupabaseClient, syncConversationToSupabase, syncMessageToSupabase, toValidUuid } from './src/services/supabase';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client with required header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || 'demo_key';
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Helper: Log AI Action to Supabase
async function logAIActionToSupabase(toolName: string, args: any, result: any, orgId?: string) {
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('ai_actions').insert({
      org_id: toValidUuid(orgId),
      tool_name: toolName,
      arguments: args,
      result: result,
      executed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase Log Warning] Could not persist AI action to Supabase:', err);
  }
}

// -------------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------------

// Health check with Supabase connection check
app.get('/api/health', async (req: Request, res: Response) => {
  let supabaseConnected = false;
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('organizations').select('count').limit(1);
    if (!error) supabaseConnected = true;
  } catch (e) {
    supabaseConnected = false;
  }

  res.json({
    status: 'ok',
    appName: 'AI Commerce OS (Sale Brain)',
    database: {
      provider: 'Supabase',
      url: process.env.SUPABASE_URL || 'https://nkpscafspmndmqyfgwzw.supabase.co',
      connected: supabaseConnected,
      rlsEnabled: true,
      multiTenancy: true,
    },
    timestamp: new Date().toISOString(),
  });
});

// Supabase Status & Schema Migration Info
app.get('/api/supabase/status', async (req: Request, res: Response) => {
  try {
    const supabase = getSupabaseAdmin();
    const { data: orgs, error: orgErr } = await supabase.from('organizations').select('*');
    res.json({
      configured: true,
      url: process.env.SUPABASE_URL || 'https://nkpscafspmndmqyfgwzw.supabase.co',
      organizationsCount: orgs ? orgs.length : 0,
      schemaReady: !orgErr,
      error: orgErr ? orgErr.message : null,
    });
  } catch (err: any) {
    res.json({
      configured: true,
      error: err?.message || 'Failed to connect to Supabase',
    });
  }
});

// 1. AI Sales & Support Agent with Tool Calling & Supabase Persistence
app.post('/api/ai/agent', async (req: Request, res: Response) => {
  try {
    const { messages, customerId, conversationId, channel, orgId, orgName = 'NovaTech Myanmar' } = req.body;

    const ai = getGeminiClient();

    const systemInstruction = `You are the Action-Taking AI Sales & Support Agent for "${orgName}".
Your primary role is to assist ASEAN and Myanmar customers with product inquiries, recommendations, order creation, and support questions.

RULES:
1. ALWAYS use the provided tools (e.g. search_products, get_product_details, check_inventory, calculate_order_total, create_draft_order, get_customer_profile, search_business_knowledge) to verify products, prices, stock, and policies.
2. NEVER invent non-existent products, prices, or false stock quantities.
3. Prices are in MMK (Myanmar Kyat) or local currency.
4. When a customer expresses interest in a product with a budget, use search_products to find exact matches.
5. When customer confirms wanting to order, collect Name, Phone, and Address, then call create_draft_order.
6. Be friendly, polite, clear, professional, and helpful. You can speak English and acknowledge local Myanmar phrases politely.`;

    // Format message history
    const contents = (messages || []).map((m: any) => ({
      role: m.sender === 'customer' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

    if (contents.length === 0) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    // Call Gemini with tools enabled
    let response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: AI_TOOL_DECLARATIONS }],
      },
    });

    const executedTools: Array<{ tool: string; args: any; result: any }> = [];

    // Loop for tool execution if Gemini triggers function calls
    let loopCount = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && loopCount < 5) {
      loopCount++;
      const call = response.functionCalls[0];
      const toolName = call.name;
      const toolArgs = call.args;

      console.log(`[AI Tool Execution] Calling tool: ${toolName}`, toolArgs);
      const toolResult = await executeAITool(toolName, toolArgs);
      executedTools.push({ tool: toolName, args: toolArgs, result: toolResult });

      // Persist AI tool action asynchronously to Supabase
      logAIActionToSupabase(toolName, toolArgs, toolResult, orgId);

      // Follow up call with tool result
      const previousCandidate = response.candidates?.[0]?.content;
      contents.push(previousCandidate as any);
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: toolName,
              response: { result: toolResult },
            },
          },
        ],
      } as any);

      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: AI_TOOL_DECLARATIONS }],
        },
      });
    }

    const replyText = response.text || 'I have checked our systems and updated your request.';

    res.json({
      text: replyText,
      executedTools,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/agent:', error);
    res.status(500).json({
      error: 'AI Agent error',
      message: error?.message || 'Failed to process AI conversation.',
    });
  }
});

// 2. AI Campaign Autopilot Generator
app.post('/api/ai/campaign', async (req: Request, res: Response) => {
  try {
    const { prompt, budgetUSD = 100, orgName = 'NovaTech Store', brandVoice = 'Friendly, professional', productsContext } = req.body;

    const ai = getGeminiClient();

    const systemInstruction = `You are the AI Campaign Autopilot for "${orgName}".
Tone of Voice: ${brandVoice}.
Product Catalogue Context: ${productsContext || 'Electronics, Products, Accessories'}.

Generate a comprehensive, ready-to-launch marketing campaign based on the business owner's request.
Your output MUST be a valid JSON object matching the requested schema exactly.
Primary Currency: MMK (Myanmar Kyat) with USD equivalent.`;

    const campaignSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        objective: { type: Type.STRING },
        targetAudience: { type: Type.STRING },
        valueProposition: { type: Type.STRING },
        offerDetails: { type: Type.STRING },
        content: {
          type: Type.OBJECT,
          properties: {
            facebookCopy: { type: Type.STRING },
            instagramCaption: { type: Type.STRING },
            videoScript: { type: Type.STRING },
            emailCopy: { type: Type.STRING },
            smsCopy: { type: Type.STRING },
          },
          required: ['facebookCopy', 'instagramCaption', 'videoScript'],
        },
        creativeBrief: {
          type: Type.OBJECT,
          properties: {
            visualConcept: { type: Type.STRING },
            brandColors: { type: Type.ARRAY, items: { type: Type.STRING } },
            imagePrompt: { type: Type.STRING },
            typographyGuide: { type: Type.STRING },
            ctaText: { type: Type.STRING },
            recommendedDimensions: { type: Type.STRING },
          },
          required: ['visualConcept', 'imagePrompt', 'ctaText'],
        },
        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
        kpis: {
          type: Type.OBJECT,
          properties: {
            expectedInquiries: { type: Type.NUMBER },
            expectedOrders: { type: Type.NUMBER },
            targetRevenueUSD: { type: Type.NUMBER },
          },
          required: ['expectedInquiries', 'expectedOrders', 'targetRevenueUSD'],
        },
      },
      required: ['title', 'objective', 'targetAudience', 'valueProposition', 'content', 'creativeBrief', 'hashtags', 'kpis'],
    };

    const userPrompt = `Create a complete marketing campaign strategy and copy for the following prompt: "${prompt}". Budget allocated: $${budgetUSD}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: campaignSchema,
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const campaignData = JSON.parse(jsonText);

    res.json({
      success: true,
      campaign: campaignData,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/campaign:', error);
    res.status(500).json({
      error: 'Campaign generation failed',
      message: error?.message || 'Failed to generate campaign.',
    });
  }
});

// 3. AI Business Copilot Assistant Query
app.post('/api/ai/copilot', async (req: Request, res: Response) => {
  try {
    const { query, storeContext } = req.body;

    const ai = getGeminiClient();

    const orgName = storeContext?.orgName || 'your business';
    const systemInstruction = `You are Sale Brain AI Business Copilot for the business owner of "${orgName}".
You analyze live database metrics, orders, stock levels, and marketing performance to answer business questions clearly with actionable advice.`;

    const contextPrompt = `Live Store Database Context:
- Organization Name: ${orgName}
- Active Products: ${storeContext?.productsCount || 0}
- Products Catalogue: ${storeContext?.productsList || 'N/A'}
- Total Orders Count: ${storeContext?.ordersCount || 0}
- Total Revenue (MMK): ${storeContext?.totalRevenueMMK ? storeContext.totalRevenueMMK.toLocaleString() : '0'} MMK
- Pending Orders: ${storeContext?.pendingOrdersCount || 0}
- Total Customer Leads: ${storeContext?.leadsCount || 0}
- Low Stock Items: ${Array.isArray(storeContext?.lowStockProducts) ? storeContext.lowStockProducts.join(', ') : storeContext?.lowStockProducts || 'None'}
- Top Intent Customers: ${Array.isArray(storeContext?.topIntentCustomers) ? storeContext.topIntentCustomers.join(', ') : 'None'}

User Query: "${query}"

Provide a direct, insightful response based strictly on these live database numbers, with clear root cause analysis if relevant, and 2 concrete next steps.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contextPrompt,
      config: {
        systemInstruction,
      },
    });

    res.json({
      answer: response.text || `Analysis complete for ${orgName}. Total revenue is ${storeContext?.totalRevenueMMK ? storeContext.totalRevenueMMK.toLocaleString() : '0'} MMK across ${storeContext?.ordersCount || 0} orders.`,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/copilot:', error);
    res.status(500).json({ error: 'Copilot query failed' });
  }
});

// 4. Multi-Channel Webhook Handlers (Telegram, Messenger, Viber, Web)
async function processChannelWebhook(req: Request, res: Response, channelName: string) {
  try {
    const {
      messageText,
      customerId = 'cust_anon',
      customerName = 'Customer',
      conversationId = `conv_${channelName}_${Date.now()}`,
      orgId
    } = req.body;

    if (!messageText) {
      return res.status(400).json({ error: 'messageText is required' });
    }

    // 1. Sync Conversation & Incoming Customer Message to Supabase
    await syncConversationToSupabase({
      id: conversationId,
      orgId,
      channel: channelName,
      customerId,
      customerName,
      status: 'active',
      lastMessage: messageText,
    });

    await syncMessageToSupabase({
      conversationId,
      sender: 'customer',
      text: messageText,
    });

    // 2. Invoke Gemini Sales & Support AI Agent
    const ai = getGeminiClient();
    const systemInstruction = `You are the Action-Taking AI Sales & Support Agent for NovaTech Myanmar.
You are processing an incoming message from channel: ${channelName.toUpperCase()} for customer "${customerName}".
Your goal is to answer inquiries, search products, calculate order totals, and create draft orders using available tools.`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: messageText }],
      },
    ];

    let response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: AI_TOOL_DECLARATIONS }],
      },
    });

    const executedTools: Array<{ tool: string; args: any; result: any }> = [];

    // Process tool execution loop
    let loopCount = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && loopCount < 5) {
      loopCount++;
      const call = response.functionCalls[0];
      const toolName = call.name;
      const toolArgs = call.args;

      console.log(`[Webhook AI Tool] Channel ${channelName} execute: ${toolName}`, toolArgs);
      const toolResult = await executeAITool(toolName, toolArgs);
      executedTools.push({ tool: toolName, args: toolArgs, result: toolResult });

      // Persist AI tool action asynchronously to Supabase
      logAIActionToSupabase(toolName, toolArgs, toolResult, orgId);

      const previousCandidate = response.candidates?.[0]?.content;
      contents.push(previousCandidate as any);
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name: toolName,
              response: { result: toolResult },
            },
          },
        ],
      } as any);

      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: AI_TOOL_DECLARATIONS }],
        },
      });
    }

    const aiReplyText = response.text || 'Thank you for reaching out to NovaTech Myanmar! How else can I assist you today?';

    // 3. Sync AI Reply Message to Supabase
    await syncMessageToSupabase({
      conversationId,
      sender: 'ai',
      text: aiReplyText,
    });

    // Update conversation lastMessage
    await syncConversationToSupabase({
      id: conversationId,
      orgId,
      channel: channelName,
      customerId,
      customerName,
      status: 'active',
      lastMessage: aiReplyText,
    });

    res.json({
      status: 'processed',
      channel: channelName,
      conversationId,
      customerName,
      incomingMessage: messageText,
      aiReply: aiReplyText,
      executedTools,
      persistedToSupabase: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`Error in channel webhook (${channelName}):`, error);
    res.status(500).json({
      error: 'Webhook processing error',
      message: error?.message || 'Failed to process channel message',
    });
  }
}

// Unified & Channel-Specific Webhook Routes
app.post('/api/webhooks/channel', (req: Request, res: Response) => {
  const channel = req.body.channel || 'telegram';
  processChannelWebhook(req, res, channel);
});

app.post('/api/webhooks/telegram', (req: Request, res: Response) => processChannelWebhook(req, res, 'telegram'));
app.post('/api/webhooks/messenger', (req: Request, res: Response) => processChannelWebhook(req, res, 'messenger'));
app.post('/api/webhooks/viber', (req: Request, res: Response) => processChannelWebhook(req, res, 'viber'));
app.post('/api/webhooks/web', (req: Request, res: Response) => processChannelWebhook(req, res, 'web'));

// Legacy simulation backward compatibility
app.post('/api/telegram/simulate', (req: Request, res: Response) => processChannelWebhook(req, res, 'telegram'));

// -------------------------------------------------------------------
// VITE OR STATIC SERVER SETUP
// -------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Commerce OS (Sale Brain) running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
