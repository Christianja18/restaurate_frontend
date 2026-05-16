import type {
  Database,
  EstadoVenta,
  TipoAjusteStock,
  TipoConsumo,
} from '../../infrastructure/supabase/database.types'

export type Almacen = Database['public']['Tables']['almacenes']['Row']
export type CategoriaProducto =
  Database['public']['Tables']['categorias_productos']['Row']
export type Producto = Database['public']['Tables']['productos']['Row']
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type EstadoMesa = Database['public']['Tables']['estados_mesa']['Row']
export type Mesa = Database['public']['Tables']['mesas']['Row']
export type MetodoPago = Database['public']['Tables']['metodos_pago']['Row']
export type Usuario = Database['public']['Tables']['usuarios']['Row']
export type Venta = Database['public']['Tables']['ventas']['Row']
export type DetalleVenta = Database['public']['Tables']['detalle_ventas']['Row']
export type VentaPago = Database['public']['Tables']['venta_pagos']['Row']
export type TipoMovimiento = Database['public']['Tables']['tipos_movimiento']['Row']

export type StockCritico = Database['public']['Views']['v_stock_critico']['Row']
export type ValorizacionInventario =
  Database['public']['Views']['v_valorizacion_inventario']['Row']
export type KardexDetallado =
  Database['public']['Views']['v_kardex_detallado']['Row']
export type VentaPorUsuario =
  Database['public']['Views']['v_ventas_por_usuario']['Row']

export type ProductoInput = Readonly<{
  id?: string
  categoriaId: string | null
  nombre: string
  sku: string | null
  descripcion: string | null
  precioVenta: number
  stockMinimo: number
  controlaStock: boolean
}>

export type ClienteInput = Readonly<{
  id?: string
  nombre: string
  documentoTipo: Cliente['documento_tipo']
  documentoNumero: string | null
  telefono: string | null
  email: string | null
  direccion: string | null
}>

export type MesaInput = Readonly<{
  id?: string
  codigo?: string
  capacidad: number
  estadoMesaId: string
}>

export type VentaInput = Readonly<{
  id?: string
  usuarioId: string
  clienteId: string | null
  mesaId: string | null
  almacenId: string
  tipoConsumo: TipoConsumo
  descuentoGlobal: number
  impuestoPorcentaje: number
  observacion: string | null
}>

export type DetalleVentaInput = Readonly<{
  id?: string
  ventaId: string
  productoId: string
  cantidad: number
  precioUnitario: number
  descuento: number
}>

export type VentaPagoInput = Readonly<{
  id?: string
  ventaId: string
  metodoPagoId: string
  monto: number
  referencia: string | null
}>

export type MovimientoCompraInput = Readonly<{
  almacenId: string
  productoId: string
  cantidad: number
  costoUnitario: number
  documentoOrigen: string
  observacion: string | null
}>

export type AjusteStockInput = Readonly<{
  almacenId: string
  productoId: string
  tipo: TipoAjusteStock
  cantidad: number
  costoUnitario: number | null
  motivo: string
}>

export type RestaurantData = Readonly<{
  almacenes: readonly Almacen[]
  categorias: readonly CategoriaProducto[]
  productos: readonly Producto[]
  clientes: readonly Cliente[]
  estadosMesa: readonly EstadoMesa[]
  mesas: readonly Mesa[]
  metodosPago: readonly MetodoPago[]
  ventas: readonly Venta[]
  detallesVenta: readonly DetalleVenta[]
  pagosVenta: readonly VentaPago[]
  stockCritico: readonly StockCritico[]
  valorizacion: readonly ValorizacionInventario[]
  kardexReciente: readonly KardexDetallado[]
  ventasPorUsuario: readonly VentaPorUsuario[]
}>

export type VentaConRelaciones = Readonly<{
  venta: Venta
  cliente: Cliente | null
  mesa: Mesa | null
  almacen: Almacen | null
  detalles: readonly DetalleVenta[]
  pagos: readonly VentaPago[]
}>

export type EstadoVentaAction = Extract<EstadoVenta, 'pendiente' | 'pagada' | 'anulada'>
