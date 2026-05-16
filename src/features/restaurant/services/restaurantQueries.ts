import { supabase } from '../../../infrastructure/supabase/client'
import { assertNoSupabaseError } from '../../../shared/services/supabaseErrors'
import type {
  Almacen,
  CategoriaProducto,
  Cliente,
  DetalleVenta,
  EstadoMesa,
  KardexDetallado,
  Mesa,
  MetodoPago,
  Producto,
  RestaurantData,
  StockCritico,
  ValorizacionInventario,
  Venta,
  VentaPago,
  VentaPorUsuario,
} from '../types'

export async function fetchRestaurantData(): Promise<RestaurantData> {
  const [
    almacenes,
    categorias,
    productos,
    clientes,
    estadosMesa,
    mesas,
    metodosPago,
    ventas,
    detallesVenta,
    pagosVenta,
    stockCritico,
    valorizacion,
    kardexReciente,
    ventasPorUsuario,
  ] = await Promise.all([
    supabase.from('almacenes').select('*').is('deleted_at', null).order('nombre'),
    supabase
      .from('categorias_productos')
      .select('*')
      .is('deleted_at', null)
      .order('nombre'),
    supabase.from('productos').select('*').is('deleted_at', null).order('nombre'),
    supabase.from('clientes').select('*').is('deleted_at', null).order('nombre'),
    supabase.from('estados_mesa').select('*').is('deleted_at', null).order('nombre'),
    supabase.from('mesas').select('*').is('deleted_at', null).order('codigo'),
    supabase.from('metodos_pago').select('*').is('deleted_at', null).order('nombre'),
    supabase
      .from('ventas')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase
      .from('detalle_ventas')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('venta_pagos')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('v_stock_critico')
      .select('*')
      .order('producto', { ascending: true }),
    supabase
      .from('v_valorizacion_inventario')
      .select('*')
      .order('valor_total', { ascending: false }),
    supabase
      .from('v_kardex_detallado')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(80),
    supabase
      .from('v_ventas_por_usuario')
      .select('*')
      .order('dia', { ascending: false }),
  ])

  const responses = [
    almacenes,
    categorias,
    productos,
    clientes,
    estadosMesa,
    mesas,
    metodosPago,
    ventas,
    detallesVenta,
    pagosVenta,
    stockCritico,
    valorizacion,
    kardexReciente,
    ventasPorUsuario,
  ]

  responses.forEach((response) => assertNoSupabaseError(response.error))

  return {
    almacenes: (almacenes.data ?? []) satisfies readonly Almacen[],
    categorias: (categorias.data ?? []) satisfies readonly CategoriaProducto[],
    productos: (productos.data ?? []) satisfies readonly Producto[],
    clientes: (clientes.data ?? []) satisfies readonly Cliente[],
    estadosMesa: (estadosMesa.data ?? []) satisfies readonly EstadoMesa[],
    mesas: (mesas.data ?? []) satisfies readonly Mesa[],
    metodosPago: (metodosPago.data ?? []) satisfies readonly MetodoPago[],
    ventas: (ventas.data ?? []) satisfies readonly Venta[],
    detallesVenta: (detallesVenta.data ?? []) satisfies readonly DetalleVenta[],
    pagosVenta: (pagosVenta.data ?? []) satisfies readonly VentaPago[],
    stockCritico: (stockCritico.data ?? []) satisfies readonly StockCritico[],
    valorizacion: (valorizacion.data ?? []) satisfies readonly ValorizacionInventario[],
    kardexReciente: (kardexReciente.data ?? []) satisfies readonly KardexDetallado[],
    ventasPorUsuario: (ventasPorUsuario.data ?? []) satisfies readonly VentaPorUsuario[],
  }
}
