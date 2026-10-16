export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ListingStatus = 'draft' | 'active' | 'reserved' | 'rented';
export type GenderPreference = 'any' | 'female_only' | 'male_only';
export type PaymentStatus = 'pending' | 'paid';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone_number: string | null
          whatsapp_number: string | null
          is_verified: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          whatsapp_number?: string | null
          is_verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          phone_number?: string | null
          whatsapp_number?: string | null
          is_verified?: boolean
          created_at?: string
        }
      }
      listings: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          city: string
          address: string
          location: unknown | null // PostGIS Geography(Point, 4326)
          monthly_rent_pln: number
          utilities_pln: number
          deposit_pln: number
          gender_preference: GenderPreference
          is_cesja: boolean
          available_from: string
          contract_end_date: string
          meldunek_friendly: boolean
          status: ListingStatus
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          city: string
          address: string
          location?: unknown | null
          monthly_rent_pln: number
          utilities_pln?: number
          deposit_pln: number
          gender_preference?: GenderPreference
          is_cesja?: boolean
          available_from: string
          contract_end_date: string
          meldunek_friendly?: boolean
          status?: ListingStatus
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          city?: string
          address?: string
          location?: unknown | null
          monthly_rent_pln?: number
          utilities_pln?: number
          deposit_pln?: number
          gender_preference?: GenderPreference
          is_cesja?: boolean
          available_from?: string
          contract_end_date?: string
          meldunek_friendly?: boolean
          status?: ListingStatus
          created_at?: string
        }
      }
      listing_images: {
        Row: {
          id: string
          listing_id: string
          image_url: string
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          image_url: string
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          image_url?: string
          display_order?: number
          created_at?: string
        }
      }
      matches_and_inquiries: {
        Row: {
          id: string
          listing_id: string
          student_user_id: string
          admin_notes: string | null
          payment_status: PaymentStatus
          match_fee_pln: number
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          student_user_id: string
          admin_notes?: string | null
          payment_status?: PaymentStatus
          match_fee_pln?: number
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          student_user_id?: string
          admin_notes?: string | null
          payment_status?: PaymentStatus
          match_fee_pln?: number
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          listing_id: string
          sender_id: string
          recipient_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          listing_id: string
          sender_id: string
          recipient_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          listing_id?: string
          sender_id?: string
          recipient_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}
