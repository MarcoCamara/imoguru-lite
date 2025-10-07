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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      amenities: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      nearby_points: {
        Row: {
          category: string | null
          created_at: string | null
          distance: string | null
          id: string
          name: string
          property_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          distance?: string | null
          id?: string
          name: string
          property_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          distance?: string | null
          id?: string
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nearby_points_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          accepts_exchange: boolean | null
          bathrooms: number | null
          bedrooms: number | null
          cep: string | null
          city: string | null
          code: string | null
          complement: string | null
          condition: Database["public"]["Enums"]["property_condition"]
          condo_amenities: string[] | null
          condo_floors: number | null
          condo_name: string | null
          condo_price: number | null
          condo_units: number | null
          construction_year: number | null
          country: string | null
          created_at: string | null
          description: string | null
          exact_cep: string | null
          exact_complement: string | null
          exact_neighborhood: string | null
          exact_number: string | null
          exact_street: string | null
          id: string
          iptu_price: number | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          number: string | null
          owner_cpf_cnpj: string | null
          owner_email: string | null
          owner_name: string | null
          owner_phone: string | null
          parking_spaces: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          published: boolean | null
          published_on_portal: boolean | null
          purpose: Database["public"]["Enums"]["property_purpose"]
          rental_price: number | null
          sale_price: number | null
          state: string | null
          status: Database["public"]["Enums"]["property_status"]
          street: string | null
          suites: number | null
          title: string
          total_area: number | null
          updated_at: string | null
          useful_area: number | null
          user_id: string
        }
        Insert: {
          accepts_exchange?: boolean | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city?: string | null
          code?: string | null
          complement?: string | null
          condition: Database["public"]["Enums"]["property_condition"]
          condo_amenities?: string[] | null
          condo_floors?: number | null
          condo_name?: string | null
          condo_price?: number | null
          condo_units?: number | null
          construction_year?: number | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          exact_cep?: string | null
          exact_complement?: string | null
          exact_neighborhood?: string | null
          exact_number?: string | null
          exact_street?: string | null
          id?: string
          iptu_price?: number | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          owner_cpf_cnpj?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          parking_spaces?: number | null
          property_type: Database["public"]["Enums"]["property_type"]
          published?: boolean | null
          published_on_portal?: boolean | null
          purpose: Database["public"]["Enums"]["property_purpose"]
          rental_price?: number | null
          sale_price?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          street?: string | null
          suites?: number | null
          title: string
          total_area?: number | null
          updated_at?: string | null
          useful_area?: number | null
          user_id: string
        }
        Update: {
          accepts_exchange?: boolean | null
          bathrooms?: number | null
          bedrooms?: number | null
          cep?: string | null
          city?: string | null
          code?: string | null
          complement?: string | null
          condition?: Database["public"]["Enums"]["property_condition"]
          condo_amenities?: string[] | null
          condo_floors?: number | null
          condo_name?: string | null
          condo_price?: number | null
          condo_units?: number | null
          construction_year?: number | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          exact_cep?: string | null
          exact_complement?: string | null
          exact_neighborhood?: string | null
          exact_number?: string | null
          exact_street?: string | null
          id?: string
          iptu_price?: number | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          number?: string | null
          owner_cpf_cnpj?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          parking_spaces?: number | null
          property_type?: Database["public"]["Enums"]["property_type"]
          published?: boolean | null
          published_on_portal?: boolean | null
          purpose?: Database["public"]["Enums"]["property_purpose"]
          rental_price?: number | null
          sale_price?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          street?: string | null
          suites?: number | null
          title?: string
          total_area?: number | null
          updated_at?: string | null
          useful_area?: number | null
          user_id?: string
        }
        Relationships: []
      }
      property_amenities: {
        Row: {
          amenity_id: string
          property_id: string
        }
        Insert: {
          amenity_id: string
          property_id: string
        }
        Update: {
          amenity_id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_amenities_amenity_id_fkey"
            columns: ["amenity_id"]
            isOneToOne: false
            referencedRelation: "amenities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_amenities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string
          file_url: string
          id: string
          property_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name: string
          file_url: string
          id?: string
          property_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_images: {
        Row: {
          caption: string | null
          created_at: string | null
          display_order: number | null
          id: string
          is_cover: boolean | null
          property_id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_cover?: boolean | null
          property_id: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_cover?: boolean | null
          property_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_videos: {
        Row: {
          created_at: string | null
          id: string
          property_id: string
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id: string
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_videos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      share_templates: {
        Row: {
          created_at: string | null
          fields: Json
          id: string
          include_images: boolean | null
          is_default: boolean | null
          max_images: number | null
          message_format: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          fields: Json
          id?: string
          include_images?: boolean | null
          is_default?: boolean | null
          max_images?: number | null
          message_format?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          fields?: Json
          id?: string
          include_images?: boolean | null
          is_default?: boolean | null
          max_images?: number | null
          message_format?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      property_condition: "novo" | "usado"
      property_purpose: "venda" | "locacao" | "venda_locacao"
      property_status: "disponivel" | "reservado" | "vendido" | "alugado"
      property_type:
        | "apartamento"
        | "casa"
        | "sobrado"
        | "cobertura"
        | "kitnet"
        | "loft"
        | "terreno"
        | "comercial"
        | "rural"
        | "galpao"
        | "outro"
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
      app_role: ["admin", "user"],
      property_condition: ["novo", "usado"],
      property_purpose: ["venda", "locacao", "venda_locacao"],
      property_status: ["disponivel", "reservado", "vendido", "alugado"],
      property_type: [
        "apartamento",
        "casa",
        "sobrado",
        "cobertura",
        "kitnet",
        "loft",
        "terreno",
        "comercial",
        "rural",
        "galpao",
        "outro",
      ],
    },
  },
} as const
