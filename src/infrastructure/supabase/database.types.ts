export type Json =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: Json | undefined }
  | readonly Json[]

type PublicTable<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

type PublicView<Row> = {
  Row: Row
  Relationships: []
}

type BaseRow = {
  id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type TipoConsumo = 'local' | 'delivery' | 'para_llevar'
export type EstadoVenta = 'borrador' | 'pendiente' | 'pagada' | 'anulada' | 'devuelta'
export type DocumentoTipo = 'DNI' | 'RUC' | 'CE' | 'PASAPORTE'
export type TipoAjusteStock = 'positivo' | 'negativo' | 'merma'

export type Database = {
  public: {
    Tables: {
      almacenes: PublicTable<
        BaseRow & {
          nombre: string
          descripcion: string | null
          ubicacion: string | null
          activo: boolean
        }
      >
      categorias_productos: PublicTable<
        BaseRow & {
          nombre: string
          activo: boolean
        }
      >
      productos: PublicTable<
        BaseRow & {
          categoria_id: string | null
          nombre: string
          sku: string | null
          descripcion: string | null
          precio_venta: number
          stock_minimo: number
          activo: boolean
          controla_stock: boolean
        }
      >
      clientes: PublicTable<
        BaseRow & {
          nombre: string
          documento_tipo: DocumentoTipo | null
          documento_numero: string | null
          telefono: string | null
          email: string | null
          direccion: string | null
        }
      >
      estados_mesa: PublicTable<
        BaseRow & {
          nombre: string
        }
      >
      mesas: PublicTable<
        BaseRow & {
          codigo: string
          capacidad: number
          estado_mesa_id: string
          activo: boolean
        }
      >
      metodos_pago: PublicTable<
        BaseRow & {
          nombre: string
          requiere_referencia: boolean
          activo: boolean
        }
      >
      usuarios: PublicTable<
        BaseRow & {
          nombre: string
          apellido: string | null
          email: string
          telefono: string | null
          activo: boolean
        }
      >
      ventas: PublicTable<
        BaseRow & {
          usuario_id: string
          cliente_id: string | null
          mesa_id: string | null
          almacen_id: string
          turno_caja_id: string | null
          comprobante_id: string | null
          tipo_consumo: TipoConsumo
          estado: EstadoVenta
          subtotal: number
          descuento_global: number
          impuesto_porcentaje: number
          impuesto_total: number
          total: number
          observacion: string | null
          pagada_en: string | null
          anulada_en: string | null
        }
      >
      detalle_ventas: PublicTable<
        BaseRow & {
          venta_id: string
          producto_id: string
          cantidad: number
          precio_unitario: number
          descuento: number
          costo_unitario: number
          costo_total: number
        }
      >
      venta_pagos: PublicTable<
        BaseRow & {
          venta_id: string
          metodo_pago_id: string
          monto: number
          referencia: string | null
        }
      >
      movimientos_inventario: PublicTable<
        BaseRow & {
          almacen_id: string
          producto_id: string
          tipo_movimiento_id: string
          proveedor_id: string | null
          usuario_id: string | null
          cantidad: number
          costo_unitario: number | null
          documento_origen: string | null
          referencia_tabla: string | null
          referencia_id: string | null
          observacion: string | null
        }
      >
      ajustes_stock: PublicTable<
        BaseRow & {
          almacen_id: string
          producto_id: string
          usuario_id: string | null
          tipo: TipoAjusteStock
          cantidad: number
          costo_unitario: number | null
          motivo: string
          movimiento_id: string | null
        }
      >
      tipos_movimiento: PublicTable<
        BaseRow & {
          codigo: string
          nombre: string
          signo: -1 | 1
          descripcion: string | null
        }
      >
    }
    Views: {
      v_stock_critico: PublicView<{
        almacen: string
        producto: string
        sku: string | null
        cantidad: number
        stock_minimo: number
        costo_promedio: number
        valor_total: number
      }>
      v_valorizacion_inventario: PublicView<{
        almacen_id: string
        almacen: string
        producto_id: string
        producto: string
        sku: string | null
        cantidad: number
        costo_promedio: number
        valor_total: number
      }>
      v_kardex_detallado: PublicView<{
        fecha: string
        almacen: string
        producto: string
        sku: string | null
        tipo_movimiento: string
        documento_origen: string | null
        cantidad_entrada: number
        costo_entrada: number
        cantidad_salida: number
        costo_salida: number
        saldo_cantidad: number
        saldo_valorizado: number
      }>
      v_ventas_por_usuario: PublicView<{
        usuario_id: string
        usuario: string
        dia: string
        cantidad_ventas: number
        total_vendido: number
      }>
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
