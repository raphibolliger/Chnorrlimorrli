
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "order_events": {
                  Row: {
                    "created_at": string,"detail": string | null,"id": string,"kind": string,"order_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"detail"?: string | null,"id"?: string,"kind": string,"order_id": string
                  }
                  Update: {
                    "created_at"?: string,"detail"?: string | null,"id"?: string,"kind"?: string,"order_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_events_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    }
                  ]
                },"order_items": {
                  Row: {
                    "id": string,"line_total_rappen": number,"options": NonNullable<Json>,"order_id": string,"product_id": string | null,"product_name": string,"quantity": number,"sku": string | null,"unit_price_rappen": number
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"line_total_rappen": number,"options"?: NonNullable<Json>,"order_id": string,"product_id"?: string | null,"product_name": string,"quantity": number,"sku"?: string | null,"unit_price_rappen": number
                  }
                  Update: {
                    "id"?: string,"line_total_rappen"?: number,"options"?: NonNullable<Json>,"order_id"?: string,"product_id"?: string | null,"product_name"?: string,"quantity"?: number,"sku"?: string | null,"unit_price_rappen"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "order_items_order_id_fkey"
      columns: ["order_id"]
isOneToOne: false
      referencedRelation: "orders"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "order_items_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"orders": {
                  Row: {
                    "access_token": string,"cancelled_at": string | null,"city": string | null,"confirmed_at": string | null,"country": string,"created_at": string,"customer_note": string | null,"email": string,"first_name": string,"fulfillment_status": Database["public"]['Enums']["fulfillment_status"],"id": string,"last_name": string,"order_number": number,"paid_at": string | null,"payment_method": string | null,"payment_status": Database["public"]['Enums']["payment_status"],"phone": string | null,"postal_code": string | null,"refunded_at": string | null,"shipping_kind": Database["public"]['Enums']["shipping_kind"],"shipping_method_id": string | null,"shipping_name": string,"shipping_rappen": number,"street": string | null,"stripe_checkout_session_id": string | null,"stripe_payment_intent_id": string | null,"subtotal_rappen": number,"terms_accepted_at": string,"total_rappen": number,"tracking_number": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "access_token"?: string,"cancelled_at"?: string | null,"city"?: string | null,"confirmed_at"?: string | null,"country"?: string,"created_at"?: string,"customer_note"?: string | null,"email": string,"first_name": string,"fulfillment_status"?: Database["public"]['Enums']["fulfillment_status"],"id"?: string,"last_name": string,"order_number"?: number,"paid_at"?: string | null,"payment_method"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"phone"?: string | null,"postal_code"?: string | null,"refunded_at"?: string | null,"shipping_kind": Database["public"]['Enums']["shipping_kind"],"shipping_method_id"?: string | null,"shipping_name": string,"shipping_rappen": number,"street"?: string | null,"stripe_checkout_session_id"?: string | null,"stripe_payment_intent_id"?: string | null,"subtotal_rappen": number,"terms_accepted_at": string,"total_rappen": number,"tracking_number"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "access_token"?: string,"cancelled_at"?: string | null,"city"?: string | null,"confirmed_at"?: string | null,"country"?: string,"created_at"?: string,"customer_note"?: string | null,"email"?: string,"first_name"?: string,"fulfillment_status"?: Database["public"]['Enums']["fulfillment_status"],"id"?: string,"last_name"?: string,"order_number"?: number,"paid_at"?: string | null,"payment_method"?: string | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"phone"?: string | null,"postal_code"?: string | null,"refunded_at"?: string | null,"shipping_kind"?: Database["public"]['Enums']["shipping_kind"],"shipping_method_id"?: string | null,"shipping_name"?: string,"shipping_rappen"?: number,"street"?: string | null,"stripe_checkout_session_id"?: string | null,"stripe_payment_intent_id"?: string | null,"subtotal_rappen"?: number,"terms_accepted_at"?: string,"total_rappen"?: number,"tracking_number"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "orders_shipping_method_id_fkey"
      columns: ["shipping_method_id"]
isOneToOne: false
      referencedRelation: "shipping_methods"
      referencedColumns: ["id"]
    }
                  ]
                },"product_images": {
                  Row: {
                    "alt": string | null,"created_at": string,"id": string,"product_id": string,"sort_order": number,"storage_path": string
                  }
                  ComputedFields: never
                  Insert: {
                    "alt"?: string | null,"created_at"?: string,"id"?: string,"product_id": string,"sort_order"?: number,"storage_path": string
                  }
                  Update: {
                    "alt"?: string | null,"created_at"?: string,"id"?: string,"product_id"?: string,"sort_order"?: number,"storage_path"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_images_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"product_options": {
                  Row: {
                    "choices": (string)[],"id": string,"name": string,"product_id": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "choices": (string)[],"id"?: string,"name": string,"product_id": string,"sort_order"?: number
                  }
                  Update: {
                    "choices"?: (string)[],"id"?: string,"name"?: string,"product_id"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "product_options_product_id_fkey"
      columns: ["product_id"]
isOneToOne: false
      referencedRelation: "products"
      referencedColumns: ["id"]
    }
                  ]
                },"products": {
                  Row: {
                    "active": boolean,"created_at": string,"description": string | null,"id": string,"name": string,"price_rappen": number,"short_description": string | null,"sku": string | null,"slug": string,"sort_order": number,"stock": number | null,"track_stock": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"description"?: string | null,"id"?: string,"name": string,"price_rappen": number,"short_description"?: string | null,"sku"?: string | null,"slug": string,"sort_order"?: number,"stock"?: number | null,"track_stock"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"description"?: string | null,"id"?: string,"name"?: string,"price_rappen"?: number,"short_description"?: string | null,"sku"?: string | null,"slug"?: string,"sort_order"?: number,"stock"?: number | null,"track_stock"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"shipping_methods": {
                  Row: {
                    "active": boolean,"created_at": string,"description": string | null,"id": string,"kind": Database["public"]['Enums']["shipping_kind"],"name": string,"pickup_hours": string | null,"pickup_location": string | null,"postal_codes": (string)[],"sort_order": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"description"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["shipping_kind"],"name": string,"pickup_hours"?: string | null,"pickup_location"?: string | null,"postal_codes"?: (string)[],"sort_order"?: number,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"description"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["shipping_kind"],"name"?: string,"pickup_hours"?: string | null,"pickup_location"?: string | null,"postal_codes"?: (string)[],"sort_order"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"shipping_rates": {
                  Row: {
                    "from_subtotal_rappen": number,"id": string,"price_rappen": number,"shipping_method_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "from_subtotal_rappen": number,"id"?: string,"price_rappen": number,"shipping_method_id": string
                  }
                  Update: {
                    "from_subtotal_rappen"?: number,"id"?: string,"price_rappen"?: number,"shipping_method_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "shipping_rates_shipping_method_id_fkey"
      columns: ["shipping_method_id"]
isOneToOne: false
      referencedRelation: "shipping_methods"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "attach_checkout_session":
{ Args: { "p_order_id": string,"p_session_id": string }; Returns: undefined
                           },
"cancel_order":
{ Args: { "p_order_id": string,"p_refunded": boolean }; Returns: {
              "access_token": string,
"cancelled_at": string | null,
"city": string | null,
"confirmed_at": string | null,
"country": string,
"created_at": string,
"customer_note": string | null,
"email": string,
"first_name": string,
"fulfillment_status": Database["public"]['Enums']["fulfillment_status"],
"id": string,
"last_name": string,
"order_number": number,
"paid_at": string | null,
"payment_method": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"phone": string | null,
"postal_code": string | null,
"refunded_at": string | null,
"shipping_kind": Database["public"]['Enums']["shipping_kind"],
"shipping_method_id": string | null,
"shipping_name": string,
"shipping_rappen": number,
"street": string | null,
"stripe_checkout_session_id": string | null,
"stripe_payment_intent_id": string | null,
"subtotal_rappen": number,
"terms_accepted_at": string,
"total_rappen": number,
"tracking_number": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"create_order":
{ Args: { "p_items": Json,"p_order": Json }; Returns: {
              "access_token": string,
"cancelled_at": string | null,
"city": string | null,
"confirmed_at": string | null,
"country": string,
"created_at": string,
"customer_note": string | null,
"email": string,
"first_name": string,
"fulfillment_status": Database["public"]['Enums']["fulfillment_status"],
"id": string,
"last_name": string,
"order_number": number,
"paid_at": string | null,
"payment_method": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"phone": string | null,
"postal_code": string | null,
"refunded_at": string | null,
"shipping_kind": Database["public"]['Enums']["shipping_kind"],
"shipping_method_id": string | null,
"shipping_name": string,
"shipping_rappen": number,
"street": string | null,
"stripe_checkout_session_id": string | null,
"stripe_payment_intent_id": string | null,
"subtotal_rappen": number,
"terms_accepted_at": string,
"total_rappen": number,
"tracking_number": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"log_order_event":
{ Args: { "p_detail": string,"p_kind": string,"p_order_id": string }; Returns: undefined
                           },
"mark_order_paid":
{ Args: { "p_payment_intent_id": string,"p_payment_method": string,"p_session_id": string }; Returns: {
              "access_token": string,
"cancelled_at": string | null,
"city": string | null,
"confirmed_at": string | null,
"country": string,
"created_at": string,
"customer_note": string | null,
"email": string,
"first_name": string,
"fulfillment_status": Database["public"]['Enums']["fulfillment_status"],
"id": string,
"last_name": string,
"order_number": number,
"paid_at": string | null,
"payment_method": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"phone": string | null,
"postal_code": string | null,
"refunded_at": string | null,
"shipping_kind": Database["public"]['Enums']["shipping_kind"],
"shipping_method_id": string | null,
"shipping_name": string,
"shipping_rappen": number,
"street": string | null,
"stripe_checkout_session_id": string | null,
"stripe_payment_intent_id": string | null,
"subtotal_rappen": number,
"terms_accepted_at": string,
"total_rappen": number,
"tracking_number": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"mark_order_refunded":
{ Args: { "p_payment_intent_id": string }; Returns: {
              "access_token": string,
"cancelled_at": string | null,
"city": string | null,
"confirmed_at": string | null,
"country": string,
"created_at": string,
"customer_note": string | null,
"email": string,
"first_name": string,
"fulfillment_status": Database["public"]['Enums']["fulfillment_status"],
"id": string,
"last_name": string,
"order_number": number,
"paid_at": string | null,
"payment_method": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"phone": string | null,
"postal_code": string | null,
"refunded_at": string | null,
"shipping_kind": Database["public"]['Enums']["shipping_kind"],
"shipping_method_id": string | null,
"shipping_name": string,
"shipping_rappen": number,
"street": string | null,
"stripe_checkout_session_id": string | null,
"stripe_payment_intent_id": string | null,
"subtotal_rappen": number,
"terms_accepted_at": string,
"total_rappen": number,
"tracking_number": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"mark_order_unpaid":
{ Args: { "p_session_id": string,"p_status": Database["public"]['Enums']["payment_status"] }; Returns: {
              "access_token": string,
"cancelled_at": string | null,
"city": string | null,
"confirmed_at": string | null,
"country": string,
"created_at": string,
"customer_note": string | null,
"email": string,
"first_name": string,
"fulfillment_status": Database["public"]['Enums']["fulfillment_status"],
"id": string,
"last_name": string,
"order_number": number,
"paid_at": string | null,
"payment_method": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"phone": string | null,
"postal_code": string | null,
"refunded_at": string | null,
"shipping_kind": Database["public"]['Enums']["shipping_kind"],
"shipping_method_id": string | null,
"shipping_name": string,
"shipping_rappen": number,
"street": string | null,
"stripe_checkout_session_id": string | null,
"stripe_payment_intent_id": string | null,
"subtotal_rappen": number,
"terms_accepted_at": string,
"total_rappen": number,
"tracking_number": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } },
"save_product":
{ Args: { "p_id"?: string,"p_options": Json,"p_product": Json }; Returns: string
                           },
"save_shipping_method":
{ Args: { "p_id": string,"p_method": Json,"p_rates": Json }; Returns: undefined
                           },
"set_fulfillment_status":
{ Args: { "p_order_id": string,"p_status": Database["public"]['Enums']["fulfillment_status"],"p_tracking_number": string }; Returns: {
              "access_token": string,
"cancelled_at": string | null,
"city": string | null,
"confirmed_at": string | null,
"country": string,
"created_at": string,
"customer_note": string | null,
"email": string,
"first_name": string,
"fulfillment_status": Database["public"]['Enums']["fulfillment_status"],
"id": string,
"last_name": string,
"order_number": number,
"paid_at": string | null,
"payment_method": string | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"phone": string | null,
"postal_code": string | null,
"refunded_at": string | null,
"shipping_kind": Database["public"]['Enums']["shipping_kind"],
"shipping_method_id": string | null,
"shipping_name": string,
"shipping_rappen": number,
"street": string | null,
"stripe_checkout_session_id": string | null,
"stripe_payment_intent_id": string | null,
"subtotal_rappen": number,
"terms_accepted_at": string,
"total_rappen": number,
"tracking_number": string | null,
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "orders"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "fulfillment_status": "new"|"processing"|"ready_for_pickup"|"shipped"|"delivered"|"cancelled","payment_status": "pending"|"paid"|"failed"|"expired"|"refunded"|"due","shipping_kind": "pickup"|"postal"|"local_delivery"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "fulfillment_status": ["new", "processing", "ready_for_pickup", "shipped", "delivered", "cancelled"],"payment_status": ["pending", "paid", "failed", "expired", "refunded", "due"],"shipping_kind": ["pickup", "postal", "local_delivery"]
          }
        }
} as const
