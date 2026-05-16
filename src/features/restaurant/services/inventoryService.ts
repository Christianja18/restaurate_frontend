import { supabase } from '../../../infrastructure/supabase/client'
import { assertNoSupabaseError } from '../../../shared/services/supabaseErrors'
import type { AjusteStockInput, MovimientoCompraInput, TipoMovimiento } from '../types'

async function getTipoMovimientoId(codigo: string): Promise<string> {
  const { data, error } = await supabase
    .from('tipos_movimiento')
    .select('*')
    .eq('codigo', codigo)
    .single()

  assertNoSupabaseError(error)

  if (!data) {
    throw new Error(`No existe el tipo de movimiento ${codigo}`)
  }

  return (data satisfies TipoMovimiento).id
}

export async function registrarCompraStock(
  input: MovimientoCompraInput,
): Promise<void> {
  const tipoMovimientoId = await getTipoMovimientoId('INGRESO_COMPRA')
  const { error } = await supabase.from('movimientos_inventario').insert({
    almacen_id: input.almacenId,
    producto_id: input.productoId,
    tipo_movimiento_id: tipoMovimientoId,
    cantidad: input.cantidad,
    costo_unitario: input.costoUnitario,
    documento_origen: input.documentoOrigen.trim(),
    observacion: input.observacion?.trim() || null,
  })

  assertNoSupabaseError(error)
}

export async function registrarAjusteStock(input: AjusteStockInput): Promise<void> {
  const { error } = await supabase.from('ajustes_stock').insert({
    almacen_id: input.almacenId,
    producto_id: input.productoId,
    tipo: input.tipo,
    cantidad: input.cantidad,
    costo_unitario: input.tipo === 'positivo' ? input.costoUnitario : null,
    motivo: input.motivo.trim(),
  })

  assertNoSupabaseError(error)
}
