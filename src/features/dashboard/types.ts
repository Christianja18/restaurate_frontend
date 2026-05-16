import type { Database } from '../../infrastructure/supabase/database.types'

export type Producto =
  Database['public']['Tables']['productos']['Row']

export type StockCritico =
  Database['public']['Views']['v_stock_critico']['Row']

export type ValorizacionInventario =
  Database['public']['Views']['v_valorizacion_inventario']['Row']

export type KardexDetallado =
  Database['public']['Views']['v_kardex_detallado']['Row']

export type VentaPorUsuario =
  Database['public']['Views']['v_ventas_por_usuario']['Row']

export type RestaurantDashboard = Readonly<{
  productos: readonly Producto[]
  stockCritico: readonly StockCritico[]
  valorizacion: readonly ValorizacionInventario[]
  kardexReciente: readonly KardexDetallado[]
  ventasPorUsuario: readonly VentaPorUsuario[]
}>
