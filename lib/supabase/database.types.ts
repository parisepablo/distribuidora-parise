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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          activo: boolean | null
          created_at: string | null
          dias: string[] | null
          direccion: string | null
          id: string
          lat: number | null
          lng: number | null
          nombre: string
          notas: string | null
          telefono: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          dias?: string[] | null
          direccion?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nombre: string
          notas?: string | null
          telefono?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          dias?: string[] | null
          direccion?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          nombre?: string
          notas?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      gastos_otros: {
        Row: {
          categoria: string
          created_at: string | null
          descripcion: string
          fecha: string
          id: string
          monto: number
        }
        Insert: {
          categoria?: string
          created_at?: string | null
          descripcion: string
          fecha?: string
          id?: string
          monto: number
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descripcion?: string
          fecha?: string
          id?: string
          monto?: number
        }
        Relationships: []
      }
      precios: {
        Row: {
          created_at: string | null
          id: string
          precio_costo: number
          precio_venta: number
          producto: string
          vigente_desde: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          precio_costo: number
          precio_venta: number
          producto: string
          vigente_desde?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          precio_costo?: number
          precio_venta?: number
          producto?: string
          vigente_desde?: string
        }
        Relationships: []
      }
      recargas_fabrica: {
        Row: {
          cantidad: number
          costo_unitario: number
          created_at: string | null
          fecha: string
          id: string
          notas: string | null
          producto: string
          total: number | null
        }
        Insert: {
          cantidad: number
          costo_unitario: number
          created_at?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          producto: string
          total?: number | null
        }
        Update: {
          cantidad?: number
          costo_unitario?: number
          created_at?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          producto?: string
          total?: number | null
        }
        Relationships: []
      }
      registros_diarios: {
        Row: {
          created_at: string | null
          fecha: string
          id: string
          notas: string | null
          total_cobrado: number
        }
        Insert: {
          created_at?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          total_cobrado?: number
        }
        Update: {
          created_at?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          total_cobrado?: number
        }
        Relationships: []
      }
      transacciones_clientes: {
        Row: {
          cantidad: number | null
          cliente_id: string
          created_at: string | null
          fecha: string
          id: string
          monto: number
          notas: string | null
          precio_unitario: number | null
          producto: string | null
          tipo: string
        }
        Insert: {
          cantidad?: number | null
          cliente_id: string
          created_at?: string | null
          fecha?: string
          id?: string
          monto: number
          notas?: string | null
          precio_unitario?: number | null
          producto?: string | null
          tipo: string
        }
        Update: {
          cantidad?: number | null
          cliente_id?: string
          created_at?: string | null
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          precio_unitario?: number | null
          producto?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "transacciones_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas_diarias: {
        Row: {
          cantidad: number
          id: string
          precio_unitario: number
          producto: string
          registro_id: string
          subtotal: number | null
        }
        Insert: {
          cantidad: number
          id?: string
          precio_unitario: number
          producto: string
          registro_id: string
          subtotal?: number | null
        }
        Update: {
          cantidad?: number
          id?: string
          precio_unitario?: number
          producto?: string
          registro_id?: string
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_diarias_registro_id_fkey"
            columns: ["registro_id"]
            isOneToOne: false
            referencedRelation: "registros_diarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      precio_activo: {
        Args: { p_fecha: string; p_producto: string }
        Returns: {
          precio_costo: number
          precio_venta: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
