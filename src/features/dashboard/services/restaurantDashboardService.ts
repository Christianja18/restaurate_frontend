import { supabase } from '../../../infrastructure/supabase/client'
import type {
  KardexDetallado,
  Producto,
  RestaurantDashboard,
  StockCritico,
  ValorizacionInventario,
  VentaPorUsuario,
} from '../types'

function mapSupabaseError(error: { readonly message: string } | null): void {
  if (error) {
    throw new Error(error.message)
  }
}

export async function fetchRestaurantDashboard(): Promise<RestaurantDashboard> {
  const [
    productosResponse,
    stockCriticoResponse,
    valorizacionResponse,
    kardexResponse,
    ventasResponse,
  ] = await Promise.all([
    supabase
      .from('productos')
      .select('*')
      .is('deleted_at', null)
      .order('nombre', { ascending: true })
      .limit(20),
    supabase
      .from('v_stock_critico')
      .select('*')
      .order('producto', { ascending: true })
      .limit(20),
    supabase
      .from('v_valorizacion_inventario')
      .select('*')
      .order('valor_total', { ascending: false })
      .limit(20),
    supabase
      .from('v_kardex_detallado')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(20),
    supabase
      .from('v_ventas_por_usuario')
      .select('*')
      .order('dia', { ascending: false })
      .limit(20),
  ])

  mapSupabaseError(productosResponse.error)
  mapSupabaseError(stockCriticoResponse.error)
  mapSupabaseError(valorizacionResponse.error)
  mapSupabaseError(kardexResponse.error)
  mapSupabaseError(ventasResponse.error)

  return {
    productos: (productosResponse.data ?? []) satisfies readonly Producto[],
    stockCritico: (stockCriticoResponse.data ?? []) satisfies readonly StockCritico[],
    valorizacion: (valorizacionResponse.data ?? []) satisfies readonly ValorizacionInventario[],
    kardexReciente: (kardexResponse.data ?? []) satisfies readonly KardexDetallado[],
    ventasPorUsuario: (ventasResponse.data ?? []) satisfies readonly VentaPorUsuario[],
  }
}
