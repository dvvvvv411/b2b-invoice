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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      anwaltskanzleien: {
        Row: {
          created_at: string
          email: string | null
          fax: string | null
          id: string
          is_default: boolean | null
          logo_url: string | null
          name: string
          plz: string | null
          rechtsanwalt: string | null
          register_nr: string | null
          registergericht: string | null
          stadt: string | null
          strasse: string | null
          telefon: string | null
          updated_at: string
          user_id: string
          ust_id: string | null
          website: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          fax?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          plz?: string | null
          rechtsanwalt?: string | null
          register_nr?: string | null
          registergericht?: string | null
          stadt?: string | null
          strasse?: string | null
          telefon?: string | null
          updated_at?: string
          user_id: string
          ust_id?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          fax?: string | null
          id?: string
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          plz?: string | null
          rechtsanwalt?: string | null
          register_nr?: string | null
          registergericht?: string | null
          stadt?: string | null
          strasse?: string | null
          telefon?: string | null
          updated_at?: string
          user_id?: string
          ust_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      autos: {
        Row: {
          created_at: string
          dekra_bericht_nr: string | null
          einzelpreis_netto: number | null
          erstzulassung: string | null
          fahrgestell_nr: string | null
          id: string
          kilometer: number | null
          marke: string | null
          modell: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dekra_bericht_nr?: string | null
          einzelpreis_netto?: number | null
          erstzulassung?: string | null
          fahrgestell_nr?: string | null
          id?: string
          kilometer?: number | null
          marke?: string | null
          modell?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dekra_bericht_nr?: string | null
          einzelpreis_netto?: number | null
          erstzulassung?: string | null
          fahrgestell_nr?: string | null
          id?: string
          kilometer?: number | null
          marke?: string | null
          modell?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bankkonten: {
        Row: {
          bankname: string | null
          bic: string | null
          created_at: string
          iban: string | null
          id: string
          kontoinhaber: string | null
          kontoname: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bankname?: string | null
          bic?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          kontoinhaber?: string | null
          kontoname?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bankname?: string | null
          bic?: string | null
          created_at?: string
          iban?: string | null
          id?: string
          kontoinhaber?: string | null
          kontoname?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
          is_active: boolean | null
          name: string
          template_type: Database["public"]["Enums"]["template_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
          is_active?: boolean | null
          name: string
          template_type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
          is_active?: boolean | null
          name?: string
          template_type?: Database["public"]["Enums"]["template_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      insolvente_unternehmen: {
        Row: {
          adresse: string | null
          aktenzeichen: string | null
          amtsgericht: string | null
          created_at: string
          handelsregister: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adresse?: string | null
          aktenzeichen?: string | null
          amtsgericht?: string | null
          created_at?: string
          handelsregister?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adresse?: string | null
          aktenzeichen?: string | null
          amtsgericht?: string | null
          created_at?: string
          handelsregister?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kunden: {
        Row: {
          adresse: string | null
          created_at: string
          geschaeftsfuehrer: string | null
          id: string
          name: string
          plz: string | null
          stadt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          geschaeftsfuehrer?: string | null
          id?: string
          name: string
          plz?: string | null
          stadt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          geschaeftsfuehrer?: string | null
          id?: string
          name?: string
          plz?: string | null
          stadt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pdf_templates: {
        Row: {
          created_at: string | null
          footer_html: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
          template_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          footer_html?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          template_type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          footer_html?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          template_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rechnungsnummern: {
        Row: {
          created_at: string | null
          id: string
          letzte_nummer: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          letzte_nummer?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          letzte_nummer?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      speditionen: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          plz_stadt: string | null
          strasse: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          plz_stadt?: string | null
          strasse?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          plz_stadt?: string | null
          strasse?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slug: {
        Args: { input_text: string }
        Returns: string
      }
    }
    Enums: {
      template_type: "rechnung" | "angebot" | "mahnung" | "sonstiges"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      template_type: ["rechnung", "angebot", "mahnung", "sonstiges"],
    },
  },
} as const
