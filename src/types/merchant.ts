
export type UserProfile = {
  username: string | null;
  phone_number?: string | null;
  is_merchant?: boolean;
  age?: number;
  gender?: string;
};

export type MerchantData = {
  id: string;
  business_name: string;
  business_address: string;
  business_email: string;
  business_phone: string;
  service_category: string;
  status?: string;
};

export type SlotData = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
};

export type BookingData = {
  id: string;
  user_id: string;
  slot_id: string;
  service_name: string;
  status: string;
  created_at: string;
  user_profile?: {
    username: string;
    phone_number?: string;
  } | null;
  slot?: {
    date: string;
    start_time: string;
    end_time: string;
  };
  merchant_id?: string;
};
