import { store } from './store';
import { FunctionDeclaration, Type } from '@google/genai';

export const AI_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'search_products',
    description: 'Search the organization product catalogue by keyword, category, price range, or tags.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Search keyword like "laptop", "mouse", "design", "gaming"' },
        category: { type: Type.STRING, description: 'Category filter e.g. "Laptops", "Accessories", "Audio"' },
        maxPriceMMK: { type: Type.NUMBER, description: 'Maximum budget in MMK' },
      },
    },
  },
  {
    name: 'get_product_details',
    description: 'Retrieve detailed specs, pricing, and stock for a specific product by ID or SKU.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: { type: Type.STRING, description: 'Product ID or SKU' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'check_inventory',
    description: 'Check available and reserved stock for one or more products.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productIds: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of Product IDs to check',
        },
      },
      required: ['productIds'],
    },
  },
  {
    name: 'get_customer_profile',
    description: 'Retrieve customer CRM profile, lifecycle stage, past orders, and notes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'update_customer_profile',
    description: 'Update customer CRM tags, buying intent score, or preferences.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID' },
        tagsToAdd: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Tags to add to customer' },
        buyingIntentScore: { type: Type.NUMBER, description: 'Updated buying intent score 0-100' },
      },
      required: ['customerId'],
    },
  },
  {
    name: 'add_customer_note',
    description: 'Add an internal note or memory record to a customer profile.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID' },
        noteText: { type: Type.STRING, description: 'Note content describing preference or inquiry' },
      },
      required: ['customerId', 'noteText'],
    },
  },
  {
    name: 'create_draft_order',
    description: 'Create a draft order for a customer. Does NOT charge payment automatically.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        customerId: { type: Type.STRING, description: 'Customer ID' },
        customerName: { type: Type.STRING, description: 'Customer Name' },
        customerPhone: { type: Type.STRING, description: 'Customer Phone Number' },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
            },
            required: ['productId', 'quantity'],
          },
        },
        deliveryAddress: { type: Type.STRING, description: 'Delivery address in Myanmar/ASEAN' },
        paymentMethod: { type: Type.STRING, description: 'cash_on_delivery | kpay | wave_pay | bank_transfer' },
      },
      required: ['customerId', 'customerName', 'customerPhone', 'items'],
    },
  },
  {
    name: 'calculate_order_total',
    description: 'Calculate order subtotal, delivery fee, and total in MMK and USD.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
            },
            required: ['productId', 'quantity'],
          },
        },
        discountMMK: { type: Type.NUMBER, description: 'Optional discount in MMK' },
        deliveryCity: { type: Type.STRING, description: 'Yangon, Mandalay, or Other' },
      },
      required: ['items'],
    },
  },
  {
    name: 'request_approval',
    description: 'Request human owner approval for sensitive actions like special discounts, order cancellations, or refunds.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING, description: 'apply_discount | cancel_order | approve_refund | publish_campaign' },
        title: { type: Type.STRING, description: 'Brief approval request title' },
        description: { type: Type.STRING, description: 'Reason and supporting details for approval' },
        payload: { type: Type.OBJECT, description: 'JSON payload associated with the action' },
      },
      required: ['type', 'title', 'description'],
    },
  },
  {
    name: 'search_business_knowledge',
    description: 'Search business policies, FAQs, payment methods, delivery times, and warranty terms.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Topic or query e.g. "payment", "delivery", "warranty", "refund"' },
      },
      required: ['query'],
    },
  },
];

export async function executeAITool(toolName: string, args: any): Promise<any> {
  const state = store.getState();

  switch (toolName) {
    case 'search_products': {
      const { query, category, maxPriceMMK } = args;
      const lower = (query || '').toLowerCase();
      const results = state.products.filter((p) => {
        if (!p.isActive) return false;
        if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
        if (maxPriceMMK && p.priceMMK > maxPriceMMK) return false;
        if (!lower) return true;
        return (
          p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower) ||
          p.category.toLowerCase().includes(lower) ||
          p.tags.some((t) => t.toLowerCase().includes(lower))
        );
      });
      store.logAction('AI Agent', 'search_products', `Searched catalogue for: "${query || 'all'}" -> Found ${results.length} items`);
      return { count: results.length, products: results };
    }

    case 'get_product_details': {
      const prod = state.products.find((p) => p.id === args.productId || p.sku === args.productId);
      if (!prod) return { error: `Product with ID/SKU ${args.productId} not found.` };
      store.logAction('AI Agent', 'get_product_details', `Retrieved details for ${prod.name}`);
      return prod;
    }

    case 'check_inventory': {
      const ids: string[] = args.productIds || [];
      const stockInfo = state.products
        .filter((p) => ids.includes(p.id))
        .map((p) => ({
          id: p.id,
          name: p.name,
          stockQuantity: p.stockQuantity,
          reservedQuantity: p.reservedQuantity,
          availableStock: Math.max(0, p.stockQuantity - p.reservedQuantity),
          isLowStock: p.stockQuantity <= p.lowStockThreshold,
        }));
      store.logAction('AI Agent', 'check_inventory', `Checked stock for ${ids.length} products`);
      return { inventory: stockInfo };
    }

    case 'get_customer_profile': {
      const cust = state.customers.find((c) => c.id === args.customerId);
      if (!cust) return { error: `Customer with ID ${args.customerId} not found.` };
      store.logAction('AI Agent', 'get_customer_profile', `Accessed CRM profile for ${cust.name}`);
      return cust;
    }

    case 'update_customer_profile': {
      const { customerId, tagsToAdd, buyingIntentScore } = args;
      const cust = state.customers.find((c) => c.id === customerId);
      if (!cust) return { error: 'Customer not found' };

      const updatedTags = Array.from(new Set([...cust.tags, ...(tagsToAdd || [])]));
      store.updateCustomer(customerId, {
        tags: updatedTags,
        buyingIntentScore: buyingIntentScore !== undefined ? buyingIntentScore : cust.buyingIntentScore,
      });
      store.logAction('AI Agent', 'update_customer_profile', `Updated tags/intent for customer ${cust.name}`);
      return { success: true, customerId, updatedTags };
    }

    case 'add_customer_note': {
      store.addCustomerNote(args.customerId, args.noteText);
      return { success: true, message: 'Note added to customer profile.' };
    }

    case 'calculate_order_total': {
      const { items, discountMMK = 0, deliveryCity = 'Yangon' } = args;
      let subtotalMMK = 0;
      const orderItems = [];

      for (const item of items) {
        const prod = state.products.find((p) => p.id === item.productId);
        if (prod) {
          const unitPrice = prod.discountPriceMMK || prod.priceMMK;
          const total = unitPrice * item.quantity;
          subtotalMMK += total;
          orderItems.push({
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            quantity: item.quantity,
            unitPriceMMK: unitPrice,
            unitPriceUSD: prod.priceUSD,
            totalMMK: total,
          });
        }
      }

      const deliveryFeeMMK = deliveryCity.toLowerCase() === 'yangon' || deliveryCity.toLowerCase() === 'mandalay' ? 3000 : 5000;
      const totalMMK = Math.max(0, subtotalMMK + deliveryFeeMMK - discountMMK);
      const totalUSD = Math.round(totalMMK / 1900); // approx conversion for UI display

      return {
        subtotalMMK,
        deliveryFeeMMK,
        discountMMK,
        totalMMK,
        totalUSD,
        items: orderItems,
      };
    }

    case 'create_draft_order': {
      const { customerId, customerName, customerPhone, items, deliveryAddress, paymentMethod } = args;

      // Calculate totals using application code
      let subtotalMMK = 0;
      const orderItems = [];

      for (const item of items) {
        const prod = state.products.find((p) => p.id === item.productId);
        if (prod) {
          const unitPrice = prod.discountPriceMMK || prod.priceMMK;
          const lineTotal = unitPrice * item.quantity;
          subtotalMMK += lineTotal;
          orderItems.push({
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            quantity: item.quantity,
            unitPriceMMK: unitPrice,
            unitPriceUSD: prod.priceUSD,
            totalMMK: lineTotal,
          });
        }
      }

      const deliveryFeeMMK = 3000;
      const totalMMK = subtotalMMK + deliveryFeeMMK;
      const totalUSD = Math.round(totalMMK / 1900);

      const draftOrder = store.createDraftOrder({
        customerId,
        customerName,
        customerPhone,
        channel: 'web_chat',
        items: orderItems,
        subtotalMMK,
        discountMMK: 0,
        deliveryFeeMMK,
        totalMMK,
        totalUSD,
        status: 'draft',
        paymentMethod: (paymentMethod as any) || 'kpay',
        paymentStatus: 'pending',
        deliveryAddress: deliveryAddress || 'Yangon, Myanmar',
        createdViaAI: true,
      });

      return {
        success: true,
        orderId: draftOrder.id,
        order: draftOrder,
        message: `Draft order ${draftOrder.id} successfully created. Pending owner confirmation.`,
      };
    }

    case 'request_approval': {
      const req = store.createApprovalRequest({
        type: args.type || 'sensitive_ai_action',
        title: args.title,
        description: args.description,
        requestedBy: 'ai',
        requesterName: 'AI Sales Agent',
        riskLevel: 'medium',
        payload: args.payload || {},
      });
      return { success: true, approvalId: req.id, message: `Approval request created for owner review.` };
    }

    case 'search_business_knowledge': {
      const q = (args.query || '').toLowerCase();
      const matches = state.knowledgeDocs.filter(
        (k) => k.title.toLowerCase().includes(q) || k.content.toLowerCase().includes(q) || k.category.toLowerCase().includes(q)
      );
      store.logAction('AI Agent', 'search_business_knowledge', `Searched knowledge base for "${q}" -> ${matches.length} docs`);
      return { matches };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

export async function runAIAgentPipeline(
  conv: any,
  products: any[],
  currentOrg: any
): Promise<{ replyText: string; executedTools?: any[]; draftOrder?: any }> {
  try {
    const res = await fetch('/api/ai/agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conv.messages || [],
        customerId: conv.customerId,
        conversationId: conv.id,
        channel: conv.channel || 'telegram',
        orgId: currentOrg?.id,
      }),
    });
    const data = await res.json();
    if (data.text) {
      return {
        replyText: data.text,
        executedTools: data.executedTools || [],
        draftOrder: data.draftOrder || null,
      };
    }
  } catch (err) {
    console.error('runAIAgentPipeline error:', err);
  }

  // Fallback demo response
  const lastUserMsg = (conv.messages && conv.messages[conv.messages.length - 1]?.text) || 'Inquiry';
  const matchedProd = products.find(p => p.name.toLowerCase().includes('asus') || p.name.toLowerCase().includes('laptop') || p.name.toLowerCase().includes('phone'));
  
  const searchResult = await executeAITool('search_products', { query: lastUserMsg });
  const replyText = matchedProd
    ? `Hello! We have ${matchedProd.name} in stock for ${matchedProd.priceMMK.toLocaleString()} MMK. Would you like me to reserve one for you with Cash on Delivery or KBZPay?`
    : `Hello ${conv.customerName || 'Customer'}, thank you for contacting us! I have searched our store database. How can I assist you with your purchase today?`;

  return {
    replyText,
    executedTools: [{ tool: 'search_products', result: searchResult }],
  };
}

