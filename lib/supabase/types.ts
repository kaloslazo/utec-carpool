export type UserRole = "passenger" | "driver" | "both";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";
export type TripDirection = "to_utec" | "from_utec";
export type TripStatus = "open" | "full" | "cancelled";
export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          gender: Gender;
          age: number;
          career: string;
          cycle: number;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      driver_profiles: {
        Row: {
          id: string;
          license_photo_url: string | null;
          license_number: string;
          plate: string;
          car_brand: string;
          car_model: string;
          car_color: string;
          car_year: number;
          yape_qr_url: string | null;
          search_radius_km: number;
          preferred_routes: Record<string, unknown>;
          is_verified: boolean;
        };
        Insert: Database["public"]["Tables"]["driver_profiles"]["Row"];
        Update: Partial<Database["public"]["Tables"]["driver_profiles"]["Row"]>;
      };
      locations: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          lat: number;
          lng: number;
          address: string;
          is_home: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["locations"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
      };
      schedules: {
        Row: {
          id: string;
          user_id: string;
          day_of_week: number;
          departure_time: string;
          direction: TripDirection;
          google_calendar_event_id: string | null;
          is_active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["schedules"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["schedules"]["Insert"]>;
      };
      trips: {
        Row: {
          id: string;
          driver_id: string;
          schedule_id: string;
          available_seats: number;
          status: TripStatus;
          estimated_price_soles: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trips"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["trips"]["Insert"]>;
      };
      trip_requests: {
        Row: {
          id: string;
          trip_id: string;
          passenger_id: string;
          pickup_lat: number;
          pickup_lng: number;
          pickup_address: string;
          status: RequestStatus;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["trip_requests"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["trip_requests"]["Insert"]>;
      };
    };
  };
}
