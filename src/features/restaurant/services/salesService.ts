import { supabase } from '../../../infrastructure/supabase/client'
import { assertNoSupabaseError } from '../../../shared/services/supabaseErrors'
import type {
  DetalleVenta,
  DetalleVentaInput,
  EstadoVentaAction,
  Venta,
  VentaInput,
  VentaPago,
  VentaPagoInput,
} from '../types'

export async function saveVenta(input: VentaInput): Promise<Venta> {
  if (input.tipoConsumo === 'local' && !input.mesaId) {
    throw new Error('Selecciona una mesa para ventas de consumo en local')
  }

  const payload = {
    usuario_id: input.usuarioId,
    cliente_id: input.clienteId,
    mesa_id: input.tipoConsumo === 'local' ? input.mesaId : null,
    almacen_id: input.almacenId,
    tipo_consumo: input.tipoConsumo,
    estado: 'pendiente' as const,
    descuento_global: input.descuentoGlobal,
    impuesto_porcentaje: input.impuestoPorcentaje,
    observacion: input.observacion?.trim() || null,
    deleted_at: null,
  }

  const query = input.id
    ? supabase.from('ventas').update(payload).eq('id', input.id).select('*').single()
    : supabase.from('ventas').insert(payload).select('*').single()

  const { data, error } = await query
  assertNoSupabaseError(error)

  if (!data) {
    throw new Error('No se pudo guardar la venta')
  }

  return data
}

export async function deleteVenta(venta: Venta): Promise<void> {
  if (!['borrador', 'pendiente'].includes(venta.estado)) {
    throw new Error('Solo se puede eliminar una venta en borrador o pendiente')
  }

  const { error } = await supabase
    .from('ventas')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', venta.id)

  assertNoSupabaseError(error)
}

export async function cambiarEstadoVenta(
  ventaId: string,
  estado: EstadoVentaAction,
): Promise<void> {
  const { error } = await supabase.from('ventas').update({ estado }).eq('id', ventaId)
  assertNoSupabaseError(error)
}

export async function saveDetalleVenta(
  input: DetalleVentaInput,
): Promise<DetalleVenta> {
  const payload = {
    venta_id: input.ventaId,
    producto_id: input.productoId,
    cantidad: input.cantidad,
    precio_unitario: input.precioUnitario,
    descuento: input.descuento,
    deleted_at: null,
  }

  const query = input.id
    ? supabase
        .from('detalle_ventas')
        .update(payload)
        .eq('id', input.id)
        .select('*')
        .single()
    : supabase.from('detalle_ventas').insert(payload).select('*').single()

  const { data, error } = await query
  assertNoSupabaseError(error)

  if (!data) {
    throw new Error('No se pudo guardar el detalle')
  }

  return data
}

export async function deleteDetalleVenta(detalleId: string): Promise<void> {
  const { error } = await supabase.from('detalle_ventas').delete().eq('id', detalleId)
  assertNoSupabaseError(error)
}

export async function saveVentaPago(input: VentaPagoInput): Promise<VentaPago> {
  const payload = {
    venta_id: input.ventaId,
    metodo_pago_id: input.metodoPagoId,
    monto: input.monto,
    referencia: input.referencia?.trim() || null,
    deleted_at: null,
  }

  const query = input.id
    ? supabase.from('venta_pagos').update(payload).eq('id', input.id).select('*').single()
    : supabase.from('venta_pagos').insert(payload).select('*').single()

  const { data, error } = await query
  assertNoSupabaseError(error)

  if (!data) {
    throw new Error('No se pudo guardar el pago')
  }

  return data
}

export async function deleteVentaPago(pagoId: string): Promise<void> {
  const { error } = await supabase.from('venta_pagos').delete().eq('id', pagoId)
  assertNoSupabaseError(error)
}
