export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          access_notes: string | null
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string
          latitude: number | null
          line1: string
          line2: string | null
          longitude: number | null
          postcode: string | null
          service_area_id: number | null
          updated_at: string
        }
        Insert: {
          access_notes?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          line1: string
          line2?: string | null
          longitude?: number | null
          postcode?: string | null
          service_area_id?: number | null
          updated_at?: string
        }
        Update: {
          access_notes?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          line1?: string
          line2?: string | null
          longitude?: number | null
          postcode?: string | null
          service_area_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          meta: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          meta?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          meta?: Json
        }
        Relationships: []
      }
      booking_items: {
        Row: {
          booking_id: string
          description: string | null
          id: string
          line_total_sen: number | null
          quantity: number
          service_type_code: string
          unit_id: string
          unit_price_sen: number
        }
        Insert: {
          booking_id: string
          description?: string | null
          id?: string
          line_total_sen?: number | null
          quantity?: number
          service_type_code: string
          unit_id: string
          unit_price_sen?: number
        }
        Update: {
          booking_id?: string
          description?: string | null
          id?: string
          line_total_sen?: number | null
          quantity?: number
          service_type_code?: string
          unit_id?: string
          unit_price_sen?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_items_service_type_code_fkey"
            columns: ["service_type_code"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "booking_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accepted_at: string | null
          address_id: string | null
          address_snapshot: Json
          assigned_to: string | null
          auto_confirm_at: string | null
          booking_no: string
          call_out_fee_sen: number
          cancel_reason: string | null
          cancelled_at: string | null
          commission_bps: number | null
          company_id: string
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_id: string
          customer_notes: string | null
          fault_description: string | null
          id: string
          paid_at: string | null
          requested_start: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["booking_status"]
          subtotal_sen: number
          total_sen: number | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          address_id?: string | null
          address_snapshot?: Json
          assigned_to?: string | null
          auto_confirm_at?: string | null
          booking_no?: string
          call_out_fee_sen?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          commission_bps?: number | null
          company_id: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          customer_notes?: string | null
          fault_description?: string | null
          id?: string
          paid_at?: string | null
          requested_start?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_sen?: number
          total_sen?: number | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          address_id?: string | null
          address_snapshot?: Json
          assigned_to?: string | null
          auto_confirm_at?: string | null
          booking_no?: string
          call_out_fee_sen?: number
          cancel_reason?: string | null
          cancelled_at?: string | null
          commission_bps?: number | null
          company_id?: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          customer_notes?: string | null
          fault_description?: string | null
          id?: string
          paid_at?: string | null
          requested_start?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_sen?: number
          total_sen?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          legal_name: string
          logo_path: string | null
          name: string
          phone: string | null
          rating_avg: number
          rating_count: number
          slug: string | null
          ssm_number: string
          status: Database["public"]["Enums"]["company_status"]
          suspended_reason: string | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          legal_name: string
          logo_path?: string | null
          name: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string | null
          ssm_number: string
          status?: Database["public"]["Enums"]["company_status"]
          suspended_reason?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          legal_name?: string
          logo_path?: string | null
          name?: string
          phone?: string | null
          rating_avg?: number
          rating_count?: number
          slug?: string | null
          ssm_number?: string
          status?: Database["public"]["Enums"]["company_status"]
          suspended_reason?: string | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_documents: {
        Row: {
          company_id: string
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          expires_on: string | null
          id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["review_state"]
          storage_path: string
        }
        Insert: {
          company_id: string
          created_at?: string
          doc_type: Database["public"]["Enums"]["document_type"]
          expires_on?: string | null
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_state"]
          storage_path: string
        }
        Update: {
          company_id?: string
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          expires_on?: string | null
          id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["review_state"]
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          is_active: boolean
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_service_areas: {
        Row: {
          call_out_fee_sen: number
          company_id: string
          service_area_id: number
        }
        Insert: {
          call_out_fee_sen?: number
          company_id: string
          service_area_id: number
        }
        Update: {
          call_out_fee_sen?: number
          company_id?: string
          service_area_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_service_areas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_service_areas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_service_areas_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      company_services: {
        Row: {
          company_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_active: boolean
          price_sen: number | null
          service_type_code: string
          unit_type: Database["public"]["Enums"]["unit_type"] | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          price_sen?: number | null
          service_type_code: string
          unit_type?: Database["public"]["Enums"]["unit_type"] | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          price_sen?: number | null
          service_type_code?: string
          unit_type?: Database["public"]["Enums"]["unit_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_services_service_type_code_fkey"
            columns: ["service_type_code"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["code"]
          },
        ]
      }
      company_subscriptions: {
        Row: {
          cancelled_at: string | null
          company_id: string
          created_at: string
          current_period_end: string | null
          gateway_ref: string | null
          id: string
          plan_code: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
        }
        Insert: {
          cancelled_at?: string | null
          company_id: string
          created_at?: string
          current_period_end?: string | null
          gateway_ref?: string | null
          id?: string
          plan_code: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Update: {
          cancelled_at?: string | null
          company_id?: string
          created_at?: string
          current_period_end?: string | null
          gateway_ref?: string | null
          id?: string
          plan_code?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["code"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          attachment_paths: string[]
          author_id: string
          body: string
          created_at: string
          dispute_id: string
          id: string
        }
        Insert: {
          attachment_paths?: string[]
          author_id: string
          body: string
          created_at?: string
          dispute_id: string
          id?: string
        }
        Update: {
          attachment_paths?: string[]
          author_id?: string
          body?: string
          created_at?: string
          dispute_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_messages_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          raised_by: string
          reason: string
          refund_sen: number
          resolution_note: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          raised_by: string
          reason: string
          refund_sen?: number
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          raised_by?: string
          reason?: string
          refund_sen?: number
          resolution_note?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_report_parts: {
        Row: {
          description: string
          id: string
          job_report_id: string
          quantity: number
          unit_price_sen: number | null
        }
        Insert: {
          description: string
          id?: string
          job_report_id: string
          quantity?: number
          unit_price_sen?: number | null
        }
        Update: {
          description?: string
          id?: string
          job_report_id?: string
          quantity?: number
          unit_price_sen?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_report_parts_job_report_id_fkey"
            columns: ["job_report_id"]
            isOneToOne: false
            referencedRelation: "job_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_report_parts_job_report_id_fkey"
            columns: ["job_report_id"]
            isOneToOne: false
            referencedRelation: "unit_history"
            referencedColumns: ["report_id"]
          },
        ]
      }
      job_report_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          job_report_id: string
          kind: Database["public"]["Enums"]["photo_kind"]
          storage_path: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          job_report_id: string
          kind?: Database["public"]["Enums"]["photo_kind"]
          storage_path: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          job_report_id?: string
          kind?: Database["public"]["Enums"]["photo_kind"]
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_report_photos_job_report_id_fkey"
            columns: ["job_report_id"]
            isOneToOne: false
            referencedRelation: "job_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_report_photos_job_report_id_fkey"
            columns: ["job_report_id"]
            isOneToOne: false
            referencedRelation: "unit_history"
            referencedColumns: ["report_id"]
          },
        ]
      }
      job_reports: {
        Row: {
          author_id: string
          booking_id: string
          company_id: string
          created_at: string
          customer_signoff_at: string | null
          customer_signoff_name: string | null
          finalised_at: string | null
          findings: string | null
          gas_added_grams: number | null
          id: string
          readings: Json
          recommended_next_service_on: string | null
          refrigerant_type: string | null
          status: Database["public"]["Enums"]["report_status"]
          supersedes_id: string | null
          unit_id: string
          updated_at: string
          work_done: string
        }
        Insert: {
          author_id: string
          booking_id: string
          company_id: string
          created_at?: string
          customer_signoff_at?: string | null
          customer_signoff_name?: string | null
          finalised_at?: string | null
          findings?: string | null
          gas_added_grams?: number | null
          id?: string
          readings?: Json
          recommended_next_service_on?: string | null
          refrigerant_type?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          supersedes_id?: string | null
          unit_id: string
          updated_at?: string
          work_done: string
        }
        Update: {
          author_id?: string
          booking_id?: string
          company_id?: string
          created_at?: string
          customer_signoff_at?: string | null
          customer_signoff_name?: string | null
          finalised_at?: string | null
          findings?: string | null
          gas_added_grams?: number | null
          id?: string
          readings?: Json
          recommended_next_service_on?: string | null
          refrigerant_type?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          supersedes_id?: string | null
          unit_id?: string
          updated_at?: string
          work_done?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_reports_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "job_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "unit_history"
            referencedColumns: ["report_id"]
          },
          {
            foreignKeyName: "job_reports_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount_sen: number
          booking_id: string
          company_id: string | null
          created_at: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id: number
          memo: string | null
          payment_id: string | null
          payout_id: string | null
        }
        Insert: {
          amount_sen: number
          booking_id: string
          company_id?: string | null
          created_at?: string
          entry_type: Database["public"]["Enums"]["ledger_entry_type"]
          id?: never
          memo?: string | null
          payment_id?: string | null
          payout_id?: string | null
        }
        Update: {
          amount_sen?: number
          booking_id?: string
          company_id?: string | null
          created_at?: string
          entry_type?: Database["public"]["Enums"]["ledger_entry_type"]
          id?: never
          memo?: string | null
          payment_id?: string | null
          payout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          attempts: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          error: string | null
          id: string
          payload: Json
          read_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template: string
          user_id: string
        }
        Insert: {
          attempts?: number
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template: string
          user_id: string
        }
        Update: {
          attempts?: number
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          error?: string | null
          id?: string
          payload?: Json
          read_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_sen: number
          booking_id: string
          created_at: string
          customer_id: string
          gateway: string
          gateway_ref: string
          id: string
          method: Database["public"]["Enums"]["payment_method"] | null
          paid_at: string | null
          refunded_sen: number
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_sen: number
          booking_id: string
          created_at?: string
          customer_id: string
          gateway: string
          gateway_ref: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          refunded_sen?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_sen?: number
          booking_id?: string
          created_at?: string
          customer_id?: string
          gateway?: string
          gateway_ref?: string
          id?: string
          method?: Database["public"]["Enums"]["payment_method"] | null
          paid_at?: string | null
          refunded_sen?: number
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          booking_id: string
          commission_sen: number
          company_id: string
          created_at: string
          gateway_fee_sen: number
          gateway_ref: string | null
          gross_sen: number
          id: string
          net_sen: number
          paid_at: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          booking_id: string
          commission_sen: number
          company_id: string
          created_at?: string
          gateway_fee_sen?: number
          gateway_ref?: string | null
          gross_sen: number
          id?: string
          net_sen: number
          paid_at?: string | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          commission_sen?: number
          company_id?: string
          created_at?: string
          gateway_fee_sen?: number
          gateway_ref?: string | null
          gross_sen?: number
          id?: string
          net_sen?: number
          paid_at?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          locale: string
          notify_email: boolean
          notify_push: boolean
          notify_whatsapp: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          locale?: string
          notify_email?: boolean
          notify_push?: boolean
          notify_whatsapp?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          locale?: string
          notify_email?: boolean
          notify_push?: boolean
          notify_whatsapp?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quote_lines: {
        Row: {
          description: string
          id: string
          kind: Database["public"]["Enums"]["quote_line_kind"]
          line_total_sen: number | null
          quantity: number
          quote_id: string
          sort_order: number
          unit_price_sen: number
        }
        Insert: {
          description: string
          id?: string
          kind?: Database["public"]["Enums"]["quote_line_kind"]
          line_total_sen?: number | null
          quantity?: number
          quote_id: string
          sort_order?: number
          unit_price_sen: number
        }
        Update: {
          description?: string
          id?: string
          kind?: Database["public"]["Enums"]["quote_line_kind"]
          line_total_sen?: number | null
          quantity?: number
          quote_id?: string
          sort_order?: number
          unit_price_sen?: number
        }
        Relationships: [
          {
            foreignKeyName: "quote_lines_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          booking_id: string
          created_at: string
          created_by: string | null
          decided_at: string | null
          id: string
          note: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["quote_status"]
          valid_until: string | null
          version: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          id?: string
          note?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          valid_until?: string | null
          version?: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          id?: string
          note?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          valid_until?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          company_id: string
          company_reply: string | null
          created_at: string
          customer_id: string
          id: string
          rating: number
          removed_by: string | null
          removed_reason: string | null
          replied_at: string | null
          visibility: Database["public"]["Enums"]["review_visibility"]
        }
        Insert: {
          booking_id: string
          comment?: string | null
          company_id: string
          company_reply?: string | null
          created_at?: string
          customer_id: string
          id?: string
          rating: number
          removed_by?: string | null
          removed_reason?: string | null
          replied_at?: string | null
          visibility?: Database["public"]["Enums"]["review_visibility"]
        }
        Update: {
          booking_id?: string
          comment?: string | null
          company_id?: string
          company_reply?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          rating?: number
          removed_by?: string | null
          removed_reason?: string | null
          replied_at?: string | null
          visibility?: Database["public"]["Enums"]["review_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_removed_by_fkey"
            columns: ["removed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          district: string
          id: number
          is_active: boolean
          state: string
        }
        Insert: {
          district: string
          id?: never
          is_active?: boolean
          state: string
        }
        Update: {
          district?: string
          id?: never
          is_active?: boolean
          state?: string
        }
        Relationships: []
      }
      service_reminders: {
        Row: {
          created_at: string
          due_on: string
          id: string
          sent_at: string | null
          service_type_code: string
          source_report_id: string | null
          status: Database["public"]["Enums"]["reminder_status"]
          unit_id: string
        }
        Insert: {
          created_at?: string
          due_on: string
          id?: string
          sent_at?: string | null
          service_type_code: string
          source_report_id?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          unit_id: string
        }
        Update: {
          created_at?: string
          due_on?: string
          id?: string
          sent_at?: string | null
          service_type_code?: string
          source_report_id?: string | null
          status?: Database["public"]["Enums"]["reminder_status"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reminders_service_type_code_fkey"
            columns: ["service_type_code"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "service_reminders_source_report_id_fkey"
            columns: ["source_report_id"]
            isOneToOne: false
            referencedRelation: "job_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_source_report_id_fkey"
            columns: ["source_report_id"]
            isOneToOne: false
            referencedRelation: "unit_history"
            referencedColumns: ["report_id"]
          },
          {
            foreignKeyName: "service_reminders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          code: string
          default_interval_months: number | null
          description: string | null
          is_active: boolean
          name: string
          requires_quote: boolean
          sort_order: number
        }
        Insert: {
          code: string
          default_interval_months?: number | null
          description?: string | null
          is_active?: boolean
          name: string
          requires_quote?: boolean
          sort_order?: number
        }
        Update: {
          code?: string
          default_interval_months?: number | null
          description?: string | null
          is_active?: boolean
          name?: string
          requires_quote?: boolean
          sort_order?: number
        }
        Relationships: []
      }
      subscription_invoices: {
        Row: {
          amount_sen: number
          company_id: string
          created_at: string
          gateway_ref: string | null
          id: string
          paid_at: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string
        }
        Insert: {
          amount_sen: number
          company_id: string
          created_at?: string
          gateway_ref?: string | null
          id?: string
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id: string
        }
        Update: {
          amount_sen?: number
          company_id?: string
          created_at?: string
          gateway_ref?: string | null
          id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "company_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          code: string
          commission_bps: number
          features: Json
          is_available: boolean
          max_members: number | null
          monthly_fee_sen: number
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          commission_bps: number
          features?: Json
          is_available?: boolean
          max_members?: number | null
          monthly_fee_sen: number
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          commission_bps?: number
          features?: Json
          is_available?: boolean
          max_members?: number | null
          monthly_fee_sen?: number
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      unit_access_grants: {
        Row: {
          booking_id: string
          company_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          revoked_by: string | null
          unit_id: string
        }
        Insert: {
          booking_id: string
          company_id: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          unit_id: string
        }
        Update: {
          booking_id?: string
          company_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_access_grants_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_access_grants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_access_grants_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_access_grants_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_access_grants_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          address_id: string | null
          brand: string | null
          created_at: string
          customer_id: string
          horsepower: number | null
          id: string
          install_date: string | null
          is_archived: boolean
          location_in_property: string | null
          model: string | null
          nameplate_photo_path: string | null
          nickname: string | null
          notes: string | null
          refrigerant: string | null
          serial_number: string | null
          unit_type: Database["public"]["Enums"]["unit_type"]
          updated_at: string
          warranty_ends_on: string | null
        }
        Insert: {
          address_id?: string | null
          brand?: string | null
          created_at?: string
          customer_id: string
          horsepower?: number | null
          id?: string
          install_date?: string | null
          is_archived?: boolean
          location_in_property?: string | null
          model?: string | null
          nameplate_photo_path?: string | null
          nickname?: string | null
          notes?: string | null
          refrigerant?: string | null
          serial_number?: string | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          warranty_ends_on?: string | null
        }
        Update: {
          address_id?: string | null
          brand?: string | null
          created_at?: string
          customer_id?: string
          horsepower?: number | null
          id?: string
          install_date?: string | null
          is_archived?: boolean
          location_in_property?: string | null
          model?: string | null
          nameplate_photo_path?: string | null
          nickname?: string | null
          notes?: string | null
          refrigerant?: string | null
          serial_number?: string | null
          unit_type?: Database["public"]["Enums"]["unit_type"]
          updated_at?: string
          warranty_ends_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      payment_reconciliation: {
        Row: {
          amount_sen: number | null
          balanced: boolean | null
          booking_id: string | null
          gateway: string | null
          gateway_ref: string | null
          ledger_received_sen: number | null
          ledger_refunded_sen: number | null
          paid_at: string | null
          payment_id: string | null
          refunded_sen: number | null
          status: Database["public"]["Enums"]["payment_status"] | null
        }
        Relationships: []
      }
      booking_ledger_balance: {
        Row: {
          balance_sen: number | null
          booking_id: string | null
          entries: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      public_company_profiles: {
        Row: {
          description: string | null
          id: string | null
          logo_path: string | null
          name: string | null
          rating_avg: number | null
          rating_count: number | null
          service_areas: Json | null
          slug: string | null
          starting_price_sen: number | null
        }
        Insert: {
          description?: string | null
          id?: string | null
          logo_path?: string | null
          name?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          service_areas?: never
          slug?: string | null
          starting_price_sen?: never
        }
        Update: {
          description?: string | null
          id?: string | null
          logo_path?: string | null
          name?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          service_areas?: never
          slug?: string | null
          starting_price_sen?: never
        }
        Relationships: []
      }
      unit_history: {
        Row: {
          booking_id: string | null
          company_id: string | null
          company_name: string | null
          finalised_at: string | null
          findings: string | null
          gas_added_grams: number | null
          readings: Json | null
          recommended_next_service_on: string | null
          refrigerant_type: string | null
          report_id: string | null
          service_types: string[] | null
          supersedes_id: string | null
          unit_id: string | null
          work_done: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "job_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_reports_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "unit_history"
            referencedColumns: ["report_id"]
          },
          {
            foreignKeyName: "job_reports_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      start_payment: {
        Args: {
          p_booking: string
          p_gateway: string
          p_method: Database["public"]["Enums"]["payment_method"]
        }
        Returns: string
      }
      apply_payment_event: {
        Args: {
          p_amount_sen: number
          p_event_id: string
          p_gateway: string
          p_outcome: string
          p_payload?: Json
          p_reference: string
        }
        Returns: string
      }
      admin_mark_payouts_paid: {
        Args: { p_ids: string[]; p_reference: string }
        Returns: number
      }
      add_team_member: {
        Args: {
          p_company: string
          p_email: string
          p_role: Database["public"]["Enums"]["company_role"]
        }
        Returns: undefined
      }
      accept_quote: { Args: { p_quote: string }; Returns: undefined }
      admin_remove_review: {
        Args: { p_reason: string; p_review: string }
        Returns: undefined
      }
      admin_review_document: {
        Args: {
          p_document: string
          p_note?: string
          p_status: Database["public"]["Enums"]["review_state"]
        }
        Returns: undefined
      }
      admin_set_company_status: {
        Args: {
          p_company: string
          p_reason?: string
          p_status: Database["public"]["Enums"]["company_status"]
        }
        Returns: undefined
      }
      auto_close_completed_bookings: { Args: never; Returns: number }
      can_access_unit: { Args: { p_unit: string }; Returns: boolean }
      contractor_can_see_customer: {
        Args: { p_customer: string }
        Returns: boolean
      }
      create_company: {
        Args: {
          p_email?: string
          p_legal_name: string
          p_name: string
          p_phone?: string
          p_ssm_number: string
        }
        Returns: string
      }
      current_commission_bps: { Args: { p_company: string }; Returns: number }
      decide_dispute: {
        Args: {
          p_dispute: string
          p_note?: string
          p_outcome: string
          p_refund_sen?: number
        }
        Returns: undefined
      }
      decline_quote: { Args: { p_quote: string }; Returns: undefined }
      export_my_data: { Args: never; Returns: Json }
      is_booking_manager: { Args: { p_booking: string }; Returns: boolean }
      is_booking_party: { Args: { p_booking: string }; Returns: boolean }
      is_company_member: {
        Args: {
          p_company: string
          p_roles?: Database["public"]["Enums"]["company_role"][]
        }
        Returns: boolean
      }
      is_company_staff: { Args: { p_company: string }; Returns: boolean }
      is_platform_admin: { Args: never; Returns: boolean }
      log_unit_view: { Args: { p_unit: string }; Returns: undefined }
      my_company_ids: { Args: never; Returns: string[] }
      path_uuid: { Args: { p_segment: string }; Returns: string }
      queue_payout: {
        Args: { p_booking: string; p_gateway_fee_sen?: number }
        Returns: string
      }
      raise_dispute: {
        Args: { p_booking: string; p_reason: string }
        Returns: string
      }
      revoke_unit_access: {
        Args: { p_company: string; p_unit: string }
        Returns: number
      }
      send_quote: { Args: { p_quote: string }; Returns: undefined }
      setting_int: {
        Args: { p_default: number; p_key: string }
        Returns: number
      }
      transition_booking: {
        Args: {
          p_assigned_to?: string
          p_booking: string
          p_reason?: string
          p_scheduled_end?: string
          p_scheduled_start?: string
          p_to: Database["public"]["Enums"]["booking_status"]
        }
        Returns: Database["public"]["Enums"]["booking_status"]
      }
    }
    Enums: {
      booking_status:
        | "requested"
        | "quoted"
        | "awaiting_payment"
        | "paid"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "disputed"
        | "closed"
        | "cancelled"
        | "declined"
        | "refunded"
      company_role: "owner" | "dispatcher" | "technician"
      company_status: "pending" | "verified" | "suspended"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved_release"
        | "resolved_refund"
        | "resolved_partial"
        | "withdrawn"
      document_type:
        | "ssm_registration"
        | "business_licence"
        | "insurance"
        | "identity"
      invoice_status: "open" | "paid" | "void" | "failed"
      ledger_entry_type:
        | "payment_received"
        | "commission"
        | "gateway_fee"
        | "payout"
        | "refund"
      notification_channel: "whatsapp" | "push" | "email" | "in_app"
      notification_status: "queued" | "sent" | "failed"
      payment_method: "fpx" | "card" | "ewallet"
      payment_status:
        | "pending"
        | "held"
        | "released"
        | "refunded"
        | "partially_refunded"
        | "failed"
      payout_status: "queued" | "processing" | "paid" | "failed"
      photo_kind: "before" | "after" | "nameplate" | "fault" | "other"
      quote_line_kind: "labour" | "part" | "gas" | "call_out" | "other"
      quote_status: "draft" | "sent" | "accepted" | "declined" | "expired"
      reminder_status: "pending" | "sent" | "booked" | "dismissed"
      report_status: "draft" | "final"
      review_state: "pending" | "approved" | "rejected"
      review_visibility: "visible" | "removed"
      subscription_status: "active" | "past_due" | "cancelled"
      unit_type:
        | "wall_split"
        | "cassette"
        | "ceiling_concealed"
        | "ceiling_exposed"
        | "window"
        | "multi_split"
        | "portable"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "requested",
        "quoted",
        "awaiting_payment",
        "paid",
        "scheduled",
        "in_progress",
        "completed",
        "disputed",
        "closed",
        "cancelled",
        "declined",
        "refunded",
      ],
      company_role: ["owner", "dispatcher", "technician"],
      company_status: ["pending", "verified", "suspended"],
      dispute_status: [
        "open",
        "under_review",
        "resolved_release",
        "resolved_refund",
        "resolved_partial",
        "withdrawn",
      ],
      document_type: [
        "ssm_registration",
        "business_licence",
        "insurance",
        "identity",
      ],
      invoice_status: ["open", "paid", "void", "failed"],
      ledger_entry_type: [
        "payment_received",
        "commission",
        "gateway_fee",
        "payout",
        "refund",
      ],
      notification_channel: ["whatsapp", "push", "email", "in_app"],
      notification_status: ["queued", "sent", "failed"],
      payment_method: ["fpx", "card", "ewallet"],
      payment_status: [
        "pending",
        "held",
        "released",
        "refunded",
        "partially_refunded",
        "failed",
      ],
      payout_status: ["queued", "processing", "paid", "failed"],
      photo_kind: ["before", "after", "nameplate", "fault", "other"],
      quote_line_kind: ["labour", "part", "gas", "call_out", "other"],
      quote_status: ["draft", "sent", "accepted", "declined", "expired"],
      reminder_status: ["pending", "sent", "booked", "dismissed"],
      report_status: ["draft", "final"],
      review_state: ["pending", "approved", "rejected"],
      review_visibility: ["visible", "removed"],
      subscription_status: ["active", "past_due", "cancelled"],
      unit_type: [
        "wall_split",
        "cassette",
        "ceiling_concealed",
        "ceiling_exposed",
        "window",
        "multi_split",
        "portable",
        "other",
      ],
    },
  },
} as const
