import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { 
  corsHeaders, 
  handleCors,
  createRazorpayOrder,
  processPLYNCoinsPayment
} from "../utils/payment-utils.ts";

serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log("Handle payment request received");
    
    // Get request body
    const requestBody = await req.json();
    const { paymentMethod, amount, currency = "INR", booking = {}, isLiveMode = true } = requestBody;
    
    console.log(`Payment details: method=${paymentMethod}, amount=${amount}, currency=${currency}, mode=${isLiveMode ? 'LIVE' : 'TEST'}`);
    console.log("Booking details:", JSON.stringify(booking));
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      throw new Error("Not authenticated");
    }

    console.log(`Authenticated user: ${user.id}`);
    console.log(`Processing payment for method: ${paymentMethod}, amount: ${amount}`);

    // Handle different payment methods
    let paymentResponse;
    
    if (paymentMethod === "razorpay") {
      console.log(`Creating Razorpay order in ${isLiveMode ? 'LIVE' : 'TEST'} mode`);
      
      // Generate a random receipt ID
      const receiptId = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      // Set up notes for the order
      const notes = {
        booking_id: booking.id || "",
        user_id: user.id,
        salon_name: booking.salonName || "Salon Booking",
        mode: isLiveMode ? "live" : "test"
      };
      
      console.log("Creating Razorpay order with notes:", JSON.stringify(notes));
      
      // Create order in Razorpay
      const orderData = await createRazorpayOrder(amount, currency, receiptId, notes);
      console.log("Razorpay order created:", JSON.stringify(orderData));
      
      paymentResponse = { 
        paymentId: orderData.id,
        status: "pending",
        orderId: orderData.id,
        amount: amount,
        keyId: orderData.key_id,
        isLiveMode: isLiveMode
      };
    } 
    else if (paymentMethod === "plyn_coins") {
      console.log("Processing PLYN Coins payment");
      
      // Process PLYN Coins payment
      const coinsPayment = await processPLYNCoinsPayment(supabaseClient, user.id, amount);
      
      // Create payment record
      paymentResponse = {
        paymentId: coinsPayment.paymentId,
        status: coinsPayment.status,
        amount: amount,
        coinsUsed: coinsPayment.coinsUsed
      };
    } 
    else {
      throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }
    
    // Record payment in database
    console.log("Recording payment in database:", JSON.stringify(paymentResponse));
    
    const paymentData = {
      user_id: user.id,
      payment_method: paymentMethod,
      amount: amount,
      payment_status: paymentResponse.status,
      transaction_id: paymentResponse.paymentId,
      coins_used: paymentResponse.coinsUsed || 0
    };
    
    if (booking.id) {
      paymentData.booking_id = booking.id;
    }
    
    try {
      const { data: paymentRecord, error: paymentError } = await supabaseClient
        .from("payments")
        .insert(paymentData)
        .select()
        .single();
      
      if (paymentError) {
        console.error("Error recording payment:", paymentError);
        throw new Error(`Failed to record payment: ${paymentError.message}`);
      }
      
      console.log("Payment recorded successfully:", paymentRecord.id);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          payment: {
            ...paymentResponse,
            dbId: paymentRecord.id
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Payment processing failed" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
