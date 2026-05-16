import { supabase } from '../../../infrastructure/supabase/client'
import { assertNoSupabaseError } from '../../../shared/services/supabaseErrors'
import type {
  Almacen,
  Cliente,
  ClienteInput,
  Mesa,
  MesaInput,
  Producto,
  ProductoInput,
} from '../types'
import { buildNextProductoSku } from './productSku'

export async function saveProducto(input: ProductoInput): Promise<Producto> {
  const sku =
    input.id && input.sku ? input.sku.trim() : await getNextProductoSku(input.nombre)
  const payload = {
    categoria_id: input.categoriaId,
    nombre: input.nombre.trim(),
    sku,
    descripcion: input.descripcion?.trim() || null,
    precio_venta: input.precioVenta,
    stock_minimo: input.stockMinimo,
    activo: true,
    controla_stock: input.controlaStock,
    deleted_at: null,
  }

  const query = input.id
    ? supabase.from('productos').update(payload).eq('id', input.id).select('*').single()
    : supabase.from('productos').insert(payload).select('*').single()

  const { data, error } = await query
  assertNoSupabaseError(error)

  if (!data) {
    throw new Error('No se pudo guardar el producto')
  }

  return data
}

async function getNextProductoSku(nombre: string): Promise<string> {
  const { data, error } = await supabase
    .from('productos')
    .select('sku')
    .is('deleted_at', null)

  assertNoSupabaseError(error)

  return buildNextProductoSku(
    nombre,
    (data ?? []).map((producto) => producto.sku),
  )
}

export async function deleteProducto(productoId: string): Promise<void> {
  const { error } = await supabase
    .from('productos')
    .update({ activo: false, deleted_at: new Date().toISOString() })
    .eq('id', productoId)

  assertNoSupabaseError(error)
}

export async function saveCliente(input: ClienteInput): Promise<Cliente> {
  const payload = {
    nombre: input.nombre.trim(),
    documento_tipo: input.documentoTipo,
    documento_numero: input.documentoNumero?.trim() || null,
    telefono: input.telefono?.trim() || null,
    email: input.email?.trim() || null,
    direccion: input.direccion?.trim() || null,
    deleted_at: null,
  }

  const query = input.id
    ? supabase.from('clientes').update(payload).eq('id', input.id).select('*').single()
    : supabase.from('clientes').insert(payload).select('*').single()

  const { data, error } = await query
  assertNoSupabaseError(error)

  if (!data) {
    throw new Error('No se pudo guardar el cliente')
  }

  return data
}

export async function deleteCliente(clienteId: string): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', clienteId)

  assertNoSupabaseError(error)
}

export async function saveMesa(input: MesaInput): Promise<Mesa> {
  const codigo = input.id ? input.codigo?.trim() : await getNextMesaCodigo()

  if (!codigo) {
    throw new Error('No se pudo generar el codigo de mesa')
  }

  const payload = {
    codigo,
    capacidad: input.capacidad,
    estado_mesa_id: input.estadoMesaId,
    activo: true,
    deleted_at: null,
  }

  const query = input.id
    ? supabase.from('mesas').update(payload).eq('id', input.id).select('*').single()
    : supabase.from('mesas').insert(payload).select('*').single()

  const { data, error } = await query
  assertNoSupabaseError(error)

  if (!data) {
    throw new Error('No se pudo guardar la mesa')
  }

  return data
}

async function getNextMesaCodigo(): Promise<string> {
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .is('deleted_at', null)

  assertNoSupabaseError(error)

  const lastCode = (data ?? []).reduce((maxCode, mesa) => {
    const numericCode = Number(mesa.codigo)
    return Number.isInteger(numericCode) ? Math.max(maxCode, numericCode) : maxCode
  }, 99)

  return String(lastCode + 1).padStart(3, '0')
}

export async function deleteMesa(mesaId: string): Promise<void> {
  const { error } = await supabase
    .from('mesas')
    .update({ activo: false, deleted_at: new Date().toISOString() })
    .eq('id', mesaId)

  assertNoSupabaseError(error)
}

export async function saveAlmacen(
  input: Readonly<{
    id?: string
    nombre: string
    descripcion: string | null
    ubicacion: string | null
  }>,
): Promise<Almacen> {
  const payload = {
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() || null,
    ubicacion: input.ubicacion?.trim() || null,
    activo: true,
    deleted_at: null,
  }

  const query = input.id
    ? supabase.from('almacenes').update(payload).eq('id', input.id).select('*').single()
    : supabase.from('almacenes').insert(payload).select('*').single()

  const { data, error } = await query
  assertNoSupabaseError(error)

  if (!data) {
    throw new Error('No se pudo guardar el almacen')
  }

  return data
}
