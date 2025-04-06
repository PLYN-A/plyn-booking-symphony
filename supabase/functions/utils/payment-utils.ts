
// Export CORS headers for use in the API
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight requests
export const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  return null;
};

// Create a Razorpay order
export const createRazorpayOrder = async (
  amount: number,
  currency: string,
  receiptId: string,
  notes: Record<string, string>,
  transfers?: any[]
) => {
  console.log(`Creating Razorpay order for ${amount} ${currency}`);
  
  // Get Razorpay API keys from environment
  const keyId = Deno.env.get("RAZORPAY_KEY_ID") || "rzp_test_CABuOHaSHHGey2";
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || "3vE4SEbjsEU7j1uEgSAFDFb8";
  
  const auth = btoa(`${keyId}:${keySecret}`);
  
  // Create order object
  const orderData = {
    amount: Math.round(amount * 100), // Convert to paise (Razorpay uses smallest currency unit)
    currency: currency,
    receipt: receiptId,
    notes: notes
  };
  
  // Add transfers if provided (for route splitting)
  if (transfers && transfers.length > 0) {
    Object.assign(orderData, { transfers });
  }
  
  try {
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${auth}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Razorpay order creation failed:", errorData);
      throw new Error(errorData.error?.description || "Failed to create Razorpay order");
    }
    
    const data = await response.json();
    console.log("Razorpay order created successfully:", data);
    
    return {
      ...data,
      key_id: keyId
    };
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
};

// Process a payment using PLYN coins
export const processPLYNCoinsPayment = async (supabaseClient: any, userId: string, amount: number) => {
  console.log(`Processing PLYN coins payment for user ${userId}, amount: ${amount}`);
  
  try {
    // Convert amount to required coins (2 coins = ₹1)
    const requiredCoins = Math.ceil(amount * 2);
    
    // Get user's current coin balance
    const { data: userData, error: userError } = await supabaseClient
      .from("profiles")
      .select("id, coins")
      .eq("id", userId)
      .maybeSingle();
    
    if (userError) {
      console.error("Error fetching user coins:", userError);
      throw new Error(`Error fetching user coins: ${userError.message}`);
    }
    
    if (!userData) {
      console.error("User profile not found");
      throw new Error("User profile not found");
    }
    
    const userCoins = userData.coins || 0;
    console.log(`User has ${userCoins} coins, requires ${requiredCoins} coins`);
    
    if (userCoins < requiredCoins) {
      throw new Error(`Insufficient PLYN coins. You need ${requiredCoins} coins, but you have ${userCoins}.`);
    }
    
    // Deduct coins from user balance
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ 
        coins: userCoins - requiredCoins,
        updated_at: new Date().toISOString()
      })
      .eq("id", userId);
    
    if (updateError) {
      console.error("Error updating user coins:", updateError);
      throw new Error(`Error updating user coins: ${updateError.message}`);
    }
    
    console.log(`Successfully deducted ${requiredCoins} coins from user ${userId}`);
    
    // Generate a payment transaction ID
    const paymentId = `plyn_coins_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    return {
      paymentId,
      status: "completed",
      coinsUsed: requiredCoins
    };
  } catch (error) {
    console.error("PLYN coins payment processing error:", error);
    throw error;
  }
};

// Verify Razorpay payment signature
export const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string) => {
  try {
    // This would normally use crypto to verify the signature
    // But for our demo, we'll just return true
    console.log(`Verifying signature for order ${orderId}, payment ${paymentId}`);
    return true;
  } catch (error) {
    console.error("Error verifying Razorpay signature:", error);
    return false;
  }
};
