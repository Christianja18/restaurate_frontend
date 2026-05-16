import { useMemo, useState } from 'react'
import type { FormEvent, JSX } from 'react'
import './App.css'
import { useAuthSession } from './features/auth/hooks/useAuthSession'
import {
  signInWithEmailPassword,
  signOut,
} from './features/auth/services/authService'
import { useRestaurantData } from './features/restaurant/hooks/useRestaurantData'
import {
  deleteCliente,
  deleteMesa,
  deleteProducto,
  saveAlmacen,
  saveCliente,
  saveMesa,
  saveProducto,
} from './features/restaurant/services/catalogService'
import { buildNextProductoSku } from './features/restaurant/services/productSku'
import {
  registrarAjusteStock,
  registrarCompraStock,
} from './features/restaurant/services/inventoryService'
import {
  cambiarEstadoVenta,
  deleteDetalleVenta,
  deleteVenta,
  deleteVentaPago,
  saveDetalleVenta,
  saveVenta,
  saveVentaPago,
} from './features/restaurant/services/salesService'
import type {
  Almacen,
  Cliente,
  DetalleVenta,
  Mesa,
  Producto,
  RestaurantData,
  Venta,
  VentaConRelaciones,
  VentaPago,
} from './features/restaurant/types'
import { toErrorMessage } from './shared/services/supabaseErrors'
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
} from './shared/utils/formatters'

type Frame = 'clientes' | 'mesas' | 'inventario' | 'ventas' | 'catalogo' | 'reportes'

const frames: readonly {
  readonly id: Frame
  readonly label: string
  readonly description: string
}[] = [
  {
    id: 'clientes',
    label: 'Clientes',
    description: 'Administra datos de clientes para ventas, comprobantes y atencion.',
  },
  {
    id: 'mesas',
    label: 'Mesas',
    description: 'Gestiona mesas, capacidad y estado operativo del salon.',
  },
  {
    id: 'inventario',
    label: 'Inventario',
    description: 'Registra compras, ajustes y mermas con Kardex FIFO.',
  },
  {
    id: 'ventas',
    label: 'Ventas',
    description: 'Registra pedidos, pagos y cobros con descuento automatico de stock.',
  },
  {
    id: 'catalogo',
    label: 'Catalogo',
    description: 'Mantiene productos, precios, almacenes y stock minimo.',
  },
  {
    id: 'reportes',
    label: 'Reportes',
    description: 'Consulta stock critico, valorizacion, Kardex y ventas.',
  },
]

function parseNumber(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim()
  return text.length > 0 ? text : null
}

function LoginPanel(): JSX.Element {
  const [email, setEmail] = useState('admin@restaurante.test')
  const [password, setPassword] = useState('Admin123456!')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await signInWithEmailPassword({ email, password })
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo iniciar sesion'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-panel" aria-labelledby="auth-title">
      <div className="auth-brand">
        <img alt="Don Cangrejo Restaurant Marino" src="/don-cangrejo-logo.svg" />
        <p className="eyebrow">Restaurant marino</p>
        <h1 id="auth-title">Don Cangrejo</h1>
        <p className="muted">
          Sistema POS e inventario para la operacion del restaurante.
        </p>
      </div>

      <form className="form-card" onSubmit={handleSubmit}>
        <label>
          Correo
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>
        <label>
          Contrasena
          <input
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Conectando...' : 'Ingresar'}
        </button>
      </form>
    </section>
  )
}

function EmptyRow({
  colSpan,
  label,
}: {
  readonly colSpan: number
  readonly label: string
}): JSX.Element {
  return (
    <tr>
      <td className="empty-cell" colSpan={colSpan}>
        {label}
      </td>
    </tr>
  )
}

function ProductForm({
  categorias,
  onSaved,
  producto,
  productos,
}: {
  readonly categorias: RestaurantData['categorias']
  readonly onSaved: () => void
  readonly producto: Producto | null
  readonly productos: RestaurantData['productos']
}): JSX.Element {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [nombre, setNombre] = useState(producto?.nombre ?? '')
  const nextSku = useMemo(() => {
    return buildNextProductoSku(
      nombre,
      productos.map((currentProducto) => currentProducto.sku),
    )
  }, [nombre, productos])

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    setIsSaving(true)
    setErrorMessage(null)
    const formData = new FormData(form)

    try {
      await saveProducto({
        id: producto?.id,
        categoriaId: parseText(formData.get('categoria_id')),
        nombre,
        sku: producto?.sku ?? nextSku,
        descripcion: parseText(formData.get('descripcion')),
        precioVenta: parseNumber(formData.get('precio_venta')),
        stockMinimo: parseNumber(formData.get('stock_minimo')),
        controlaStock: formData.get('controla_stock') === 'on',
      })
      setNombre('')
      form.reset()
      onSaved()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo guardar el producto'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="form-card compact-form" onSubmit={handleSubmit}>
      <h3>{producto ? 'Editar producto' : 'Nuevo producto'}</h3>
      <label>
        Categoria
        <select defaultValue={producto?.categoria_id ?? ''} name="categoria_id">
          <option value="">Sin categoria</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        Nombre
        <input
          name="nombre"
          onChange={(event) => setNombre(event.target.value)}
          required
          value={nombre}
        />
      </label>
      <label>
        SKU
        <input
          aria-describedby="sku-help"
          name="sku"
          readOnly
          value={producto?.sku ?? nextSku}
        />
        <small id="sku-help">
          Codigo interno generado automaticamente para inventario.
        </small>
      </label>
      <label>
        Descripcion
        <textarea defaultValue={producto?.descripcion ?? ''} name="descripcion" />
      </label>
      <div className="form-grid-2">
        <label>
          Precio venta
          <input
            defaultValue={producto?.precio_venta ?? 0}
            min="0"
            name="precio_venta"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label>
          Stock minimo
          <input
            defaultValue={producto?.stock_minimo ?? 0}
            min="0"
            name="stock_minimo"
            required
            step="0.01"
            type="number"
          />
        </label>
      </div>
      <label className="check-row">
        <input
          defaultChecked={producto?.controla_stock ?? true}
          name="controla_stock"
          type="checkbox"
        />
        Controla stock
      </label>
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      <button disabled={isSaving} type="submit">
        {isSaving ? 'Guardando...' : 'Guardar producto'}
      </button>
    </form>
  )
}

function CatalogFrame({
  data,
  reload,
}: {
  readonly data: RestaurantData
  readonly reload: () => void
}): JSX.Element {
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleDelete(producto: Producto): Promise<void> {
    setErrorMessage(null)
    try {
      await deleteProducto(producto.id)
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo eliminar el producto'))
    }
  }

  return (
    <section className="frame-grid">
      <ProductForm
        categorias={data.categorias}
        key={editingProduct?.id ?? 'nuevo-producto'}
        onSaved={() => {
          setEditingProduct(null)
          reload()
        }}
        producto={editingProduct}
        productos={data.productos}
      />

      <section className="panel panel-wide">
        <div className="panel-head">
          <h2>Productos inventariables</h2>
          <button className="secondary" onClick={() => setEditingProduct(null)} type="button">
            Nuevo
          </button>
        </div>
        {errorMessage ? <p className="banner-error">{errorMessage}</p> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Precio</th>
                <th>Stock min.</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.productos.length === 0 ? (
                <EmptyRow colSpan={6} label="Sin productos" />
              ) : (
                data.productos.map((producto) => (
                  <tr key={producto.id}>
                    <td>{producto.nombre}</td>
                    <td>{producto.sku ?? '-'}</td>
                    <td>{formatCurrency(producto.precio_venta)}</td>
                    <td>{formatNumber(producto.stock_minimo)}</td>
                    <td>{producto.controla_stock ? 'Si' : 'No'}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="secondary"
                          onClick={() => setEditingProduct(producto)}
                          type="button"
                        >
                          Editar
                        </button>
                        <button
                          className="danger"
                          onClick={() => void handleDelete(producto)}
                          type="button"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function ClientesFrame({
  data,
  reload,
}: {
  readonly data: RestaurantData
  readonly reload: () => void
}): JSX.Element {
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleClienteSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setErrorMessage(null)
    try {
      await saveCliente({
        id: editingCliente?.id,
        nombre: String(formData.get('nombre') ?? ''),
        documentoTipo: parseText(formData.get('documento_tipo')) as Cliente['documento_tipo'],
        documentoNumero: parseText(formData.get('documento_numero')),
        telefono: parseText(formData.get('telefono')),
        email: parseText(formData.get('email')),
        direccion: parseText(formData.get('direccion')),
      })
      setEditingCliente(null)
      form.reset()
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo guardar el cliente'))
    }
  }

  return (
    <section className="frame-grid">
      <form className="form-card compact-form" onSubmit={handleClienteSubmit}>
        <h3>{editingCliente ? 'Editar cliente' : 'Nuevo cliente'}</h3>
        <label>
          Nombre
          <input defaultValue={editingCliente?.nombre ?? ''} name="nombre" required />
        </label>
        <div className="form-grid-2">
          <label>
            Documento
            <select
              defaultValue={editingCliente?.documento_tipo ?? 'DNI'}
              name="documento_tipo"
            >
              <option value="DNI">DNI</option>
              <option value="RUC">RUC</option>
              <option value="CE">CE</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </label>
          <label>
            Numero
            <input
              defaultValue={editingCliente?.documento_numero ?? ''}
              name="documento_numero"
            />
          </label>
        </div>
        <label>
          Telefono
          <input defaultValue={editingCliente?.telefono ?? ''} name="telefono" />
        </label>
        <label>
          Email
          <input defaultValue={editingCliente?.email ?? ''} name="email" type="email" />
        </label>
        <label>
          Direccion
          <input defaultValue={editingCliente?.direccion ?? ''} name="direccion" />
        </label>
        <button type="submit">Guardar cliente</button>
      </form>

      {errorMessage ? <p className="banner-error panel-wide">{errorMessage}</p> : null}

      <section className="panel panel-wide">
        <h2>Clientes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Telefono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nombre}</td>
                  <td>
                    {cliente.documento_tipo ?? '-'} {cliente.documento_numero ?? ''}
                  </td>
                  <td>{cliente.telefono ?? '-'}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="secondary"
                        onClick={() => setEditingCliente(cliente)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          void deleteCliente(cliente.id).then(reload)
                        }}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function MesasFrame({
  data,
  reload,
}: {
  readonly data: RestaurantData
  readonly reload: () => void
}): JSX.Element {
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const nextMesaCodigo = useMemo(() => {
    const lastCode = data.mesas.reduce((maxCode, mesa) => {
      const numericCode = Number(mesa.codigo)
      return Number.isInteger(numericCode) ? Math.max(maxCode, numericCode) : maxCode
    }, 99)

    return String(lastCode + 1).padStart(3, '0')
  }, [data.mesas])

  async function handleMesaSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setErrorMessage(null)
    try {
      await saveMesa({
        id: editingMesa?.id,
        codigo: editingMesa?.codigo,
        capacidad: parseNumber(formData.get('capacidad'), 1),
        estadoMesaId: String(formData.get('estado_mesa_id') ?? ''),
      })
      setEditingMesa(null)
      form.reset()
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo guardar la mesa'))
    }
  }

  return (
    <section className="frame-grid">
      <form className="form-card compact-form" onSubmit={handleMesaSubmit}>
        <h3>{editingMesa ? 'Editar mesa' : 'Nueva mesa'}</h3>
        <label>
          Codigo
          <input
            name="codigo"
            readOnly
            value={editingMesa?.codigo ?? nextMesaCodigo}
          />
        </label>
        <label>
          Capacidad
          <input
            defaultValue={editingMesa?.capacidad ?? 2}
            min="1"
            name="capacidad"
            required
            type="number"
          />
        </label>
        <label>
          Estado
          <select
            defaultValue={editingMesa?.estado_mesa_id ?? data.estadosMesa[0]?.id ?? ''}
            name="estado_mesa_id"
            required
          >
            {data.estadosMesa.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Guardar mesa</button>
      </form>

      {errorMessage ? <p className="banner-error panel-wide">{errorMessage}</p> : null}

      <section className="panel panel-wide">
        <h2>Mesas</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Capacidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.mesas.map((mesa) => (
                <tr key={mesa.id}>
                  <td>{mesa.codigo}</td>
                  <td>{mesa.capacidad}</td>
                  <td>
                    {data.estadosMesa.find((estado) => estado.id === mesa.estado_mesa_id)
                      ?.nombre ?? '-'}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="secondary"
                        onClick={() => setEditingMesa(mesa)}
                        type="button"
                      >
                        Editar
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          void deleteMesa(mesa.id).then(reload)
                        }}
                        type="button"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function InventoryFrame({
  data,
  reload,
}: {
  readonly data: RestaurantData
  readonly reload: () => void
}): JSX.Element {
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleCompra(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setErrorMessage(null)
    try {
      await registrarCompraStock({
        almacenId: String(formData.get('almacen_id') ?? ''),
        productoId: String(formData.get('producto_id') ?? ''),
        cantidad: parseNumber(formData.get('cantidad')),
        costoUnitario: parseNumber(formData.get('costo_unitario')),
        documentoOrigen: String(formData.get('documento_origen') ?? ''),
        observacion: parseText(formData.get('observacion')),
      })
      form.reset()
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo registrar la compra'))
    }
  }

  async function handleAjuste(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setErrorMessage(null)
    try {
      await registrarAjusteStock({
        almacenId: String(formData.get('almacen_id') ?? ''),
        productoId: String(formData.get('producto_id') ?? ''),
        tipo: String(formData.get('tipo')) as 'positivo' | 'negativo' | 'merma',
        cantidad: parseNumber(formData.get('cantidad')),
        costoUnitario: parseNumber(formData.get('costo_unitario')),
        motivo: String(formData.get('motivo') ?? ''),
      })
      form.reset()
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo registrar el ajuste'))
    }
  }

  return (
    <section className="frame-grid">
      <form className="form-card compact-form" onSubmit={handleCompra}>
        <h3>Ingreso por compra</h3>
        <SelectAlmacen almacenes={data.almacenes} />
        <SelectProducto productos={data.productos} />
        <div className="form-grid-2">
          <label>
            Cantidad
            <input min="0.01" name="cantidad" required step="0.01" type="number" />
          </label>
          <label>
            Costo unitario
            <input min="0" name="costo_unitario" required step="0.01" type="number" />
          </label>
        </div>
        <label>
          Documento
          <input name="documento_origen" placeholder="Factura, boleta o guia" required />
        </label>
        <label>
          Observacion
          <textarea name="observacion" />
        </label>
        <button type="submit">Registrar compra</button>
      </form>

      <form className="form-card compact-form" onSubmit={handleAjuste}>
        <h3>Ajuste / merma</h3>
        <SelectAlmacen almacenes={data.almacenes} />
        <SelectProducto productos={data.productos} />
        <label>
          Tipo
          <select name="tipo">
            <option value="positivo">Ajuste positivo</option>
            <option value="negativo">Ajuste negativo</option>
            <option value="merma">Merma</option>
          </select>
        </label>
        <div className="form-grid-2">
          <label>
            Cantidad
            <input min="0.01" name="cantidad" required step="0.01" type="number" />
          </label>
          <label>
            Costo unitario
            <input min="0" name="costo_unitario" step="0.01" type="number" />
          </label>
        </div>
        <label>
          Motivo
          <textarea name="motivo" required />
        </label>
        <button type="submit">Registrar ajuste</button>
      </form>

      {errorMessage ? <p className="banner-error panel-wide">{errorMessage}</p> : null}

      <ReportTables data={data} />
    </section>
  )
}

function SelectAlmacen({
  almacenes,
  defaultValue,
  disabled = false,
}: {
  readonly almacenes: readonly Almacen[]
  readonly defaultValue?: string | null
  readonly disabled?: boolean
}): JSX.Element {
  return (
    <label>
      Almacen
      <select
        defaultValue={defaultValue ?? almacenes[0]?.id ?? ''}
        disabled={disabled}
        name="almacen_id"
        required
      >
        {almacenes.map((almacen) => (
          <option key={almacen.id} value={almacen.id}>
            {almacen.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}

function SelectProducto({
  defaultValue,
  disabled = false,
  onChange,
  productos,
  value,
}: {
  readonly defaultValue?: string | null
  readonly disabled?: boolean
  readonly onChange?: (productoId: string) => void
  readonly productos: readonly Producto[]
  readonly value?: string
}): JSX.Element {
  return (
    <label>
      Producto
      <select
        disabled={disabled}
        name="producto_id"
        onChange={(event) => onChange?.(event.target.value)}
        required
        {...(value === undefined
          ? { defaultValue: defaultValue ?? productos[0]?.id ?? '' }
          : { value })}
      >
        {productos.map((producto) => (
          <option key={producto.id} value={producto.id}>
            {producto.nombre}
          </option>
        ))}
      </select>
    </label>
  )
}

function buildVentas(data: RestaurantData): readonly VentaConRelaciones[] {
  return data.ventas.map((venta) => ({
    venta,
    cliente: data.clientes.find((cliente) => cliente.id === venta.cliente_id) ?? null,
    mesa: data.mesas.find((mesa) => mesa.id === venta.mesa_id) ?? null,
    almacen:
      data.almacenes.find((almacen) => almacen.id === venta.almacen_id) ?? null,
    detalles: data.detallesVenta.filter((detalle) => detalle.venta_id === venta.id),
    pagos: data.pagosVenta.filter((pago) => pago.venta_id === venta.id),
  }))
}

function SalesFrame({
  data,
  reload,
  userId,
}: {
  readonly data: RestaurantData
  readonly reload: () => void
  readonly userId: string
}): JSX.Element {
  const ventas = useMemo(() => buildVentas(data), [data])
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(
    data.ventas[0]?.id ?? null,
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const selectedVenta = selectedVentaId
    ? ventas.find((venta) => venta.venta.id === selectedVentaId) ?? null
    : null

  async function handleVentaSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const tipoConsumo = String(formData.get('tipo_consumo')) as
      | 'local'
      | 'delivery'
      | 'para_llevar'
    const mesaId = parseText(formData.get('mesa_id'))

    if (tipoConsumo === 'local' && !mesaId) {
      setErrorMessage('Selecciona una mesa para ventas de consumo en local')
      return
    }

    setErrorMessage(null)
    try {
      const venta = await saveVenta({
        id: selectedVenta?.venta.estado === 'pendiente' ? selectedVenta.venta.id : undefined,
        usuarioId: userId,
        clienteId: parseText(formData.get('cliente_id')),
        mesaId,
        almacenId: String(formData.get('almacen_id') ?? ''),
        tipoConsumo,
        descuentoGlobal: parseNumber(formData.get('descuento_global')),
        impuestoPorcentaje: parseNumber(formData.get('impuesto_porcentaje'), 18),
        observacion: parseText(formData.get('observacion')),
      })
      setSelectedVentaId(venta.id)
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo guardar la venta'))
    }
  }

  async function handleDetalleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    if (!selectedVenta) {
      setErrorMessage('Primero crea o selecciona una venta')
      return
    }
    const formData = new FormData(form)
    const productoId = String(formData.get('producto_id') ?? '')
    const producto = data.productos.find((item) => item.id === productoId)
    if (!producto) {
      setErrorMessage('Selecciona un producto valido')
      return
    }
    setErrorMessage(null)
    try {
      await saveDetalleVenta({
        ventaId: selectedVenta.venta.id,
        productoId,
        cantidad: Math.max(1, Math.trunc(parseNumber(formData.get('cantidad'), 1))),
        precioUnitario: producto.precio_venta,
        descuento: parseNumber(formData.get('descuento')),
      })
      form.reset()
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo agregar el detalle'))
    }
  }

  async function handlePagoSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    if (!selectedVenta) {
      setErrorMessage('Primero crea o selecciona una venta')
      return
    }
    const formData = new FormData(form)
    setErrorMessage(null)
    try {
      await saveVentaPago({
        ventaId: selectedVenta.venta.id,
        metodoPagoId: String(formData.get('metodo_pago_id') ?? ''),
        monto: parseNumber(formData.get('monto')),
        referencia: parseText(formData.get('referencia')),
      })
      form.reset()
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo registrar el pago'))
    }
  }

  async function handleEstado(venta: Venta, estado: 'pagada' | 'anulada'): Promise<void> {
    setErrorMessage(null)
    try {
      await cambiarEstadoVenta(venta.id, estado)
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo cambiar el estado'))
    }
  }

  async function handleDeleteVenta(venta: Venta): Promise<void> {
    setErrorMessage(null)
    try {
      await deleteVenta(venta)
      if (selectedVentaId === venta.id) {
        setSelectedVentaId(null)
      }
      reload()
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error, 'No se pudo eliminar la venta'))
    }
  }

  return (
    <section className="sales-layout">
      <section className="panel sales-list-panel">
        <div className="panel-head">
          <h2>Ventas</h2>
          <button className="secondary" onClick={() => setSelectedVentaId(null)} type="button">
            Nueva
          </button>
        </div>
        <div className="list-stack">
          {ventas.map((item) => (
            <button
              className={item.venta.id === selectedVentaId ? 'list-item active' : 'list-item'}
              key={item.venta.id}
              onClick={() => setSelectedVentaId(item.venta.id)}
              type="button"
            >
              <strong>{formatCurrency(item.venta.total)}</strong>
              <span>{item.cliente?.nombre ?? 'Cliente general'}</span>
              <small>
                {item.venta.estado} · {formatDateTime(item.venta.created_at)}
              </small>
            </button>
          ))}
        </div>
      </section>

      <div className="sales-workarea">
        {errorMessage ? <p className="banner-error">{errorMessage}</p> : null}

        <SaleEditor
          data={data}
          onDeleteDetalle={(detalle) => {
            void deleteDetalleVenta(detalle.id).then(reload)
          }}
          onDeletePago={(pago) => {
            void deleteVentaPago(pago.id).then(reload)
          }}
          onDeleteVenta={() => {
            if (selectedVenta) {
              void handleDeleteVenta(selectedVenta.venta)
            }
          }}
          onEstado={(estado) => {
            if (selectedVenta) {
              void handleEstado(selectedVenta.venta, estado)
            }
          }}
          onSubmitDetalle={handleDetalleSubmit}
          onSubmitPago={handlePagoSubmit}
          onSubmitVenta={handleVentaSubmit}
          venta={selectedVenta}
        />
      </div>
    </section>
  )
}

function SaleEditor({
  data,
  onDeleteDetalle,
  onDeletePago,
  onDeleteVenta,
  onEstado,
  onSubmitDetalle,
  onSubmitPago,
  onSubmitVenta,
  venta,
}: {
  readonly data: RestaurantData
  readonly onDeleteDetalle: (detalle: DetalleVenta) => void
  readonly onDeletePago: (pago: VentaPago) => void
  readonly onDeleteVenta: () => void
  readonly onEstado: (estado: 'pagada' | 'anulada') => void
  readonly onSubmitDetalle: (event: FormEvent<HTMLFormElement>) => void
  readonly onSubmitPago: (event: FormEvent<HTMLFormElement>) => void
  readonly onSubmitVenta: (event: FormEvent<HTMLFormElement>) => void
  readonly venta: VentaConRelaciones | null
}): JSX.Element {
  const canEdit = !venta || ['borrador', 'pendiente'].includes(venta.venta.estado)
  const totalPagado = venta?.pagos.reduce((total, pago) => total + pago.monto, 0) ?? 0
  const statusLabel = canEdit
    ? 'Editable'
    : 'Bloqueada por estado contable'
  const [selectedProductoId, setSelectedProductoId] = useState(
    data.productos[0]?.id ?? '',
  )
  const [cantidadDetalle, setCantidadDetalle] = useState('1')
  const [descuentoDetalle, setDescuentoDetalle] = useState('0')
  const selectedProducto =
    data.productos.find((producto) => producto.id === selectedProductoId) ??
    data.productos[0] ??
    null
  const cantidadNumber = parseNumber(cantidadDetalle, 1)
  const descuentoNumber = parseNumber(descuentoDetalle)
  const precioUnitario = selectedProducto?.precio_venta ?? 0
  const totalDetalle = Math.max(cantidadNumber * precioUnitario - descuentoNumber, 0)

  if (!venta) {
    return (
      <section className="panel panel-wide sale-editor">
        <div className="panel-head">
          <div>
            <h2>Nueva venta</h2>
            <p className="muted">
              Guarda los datos generales para habilitar productos y pagos.
            </p>
          </div>
          <span className="status-pill status-open">Editable</span>
        </div>

        <form
          className="form-card compact-form sale-data-form"
          key="nueva-venta"
          onSubmit={onSubmitVenta}
        >
          <h3>Datos de venta</h3>
          <div className="form-grid-2">
            <SelectAlmacen almacenes={data.almacenes} />
            <label>
              Cliente
              <select defaultValue="" name="cliente_id">
                <option value="">Cliente general</option>
                {data.clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo consumo
              <select defaultValue="para_llevar" name="tipo_consumo">
                <option value="local">Local</option>
                <option value="delivery">Delivery</option>
                <option value="para_llevar">Para llevar</option>
              </select>
            </label>
            <label>
              Mesa
              <select defaultValue="" name="mesa_id">
                <option value="">Sin mesa</option>
                {data.mesas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>
                    {mesa.codigo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Descuento
              <input defaultValue="0" min="0" name="descuento_global" step="0.01" type="number" />
            </label>
            <label>
              IGV %
              <input defaultValue="18" min="0" name="impuesto_porcentaje" step="0.01" type="number" />
            </label>
          </div>
          <label>
            Observacion
            <textarea name="observacion" />
          </label>
          <button type="submit">Guardar venta</button>
        </form>

        <p className="empty-state">
          Los productos y pagos apareceran aqui despues de guardar la venta.
        </p>
      </section>
    )
  }

  const montoPagoAutomatico = Math.max(venta.venta.total - totalPagado, 0)

  return (
    <section className="panel panel-wide sale-editor">
      <div className="panel-head">
        <div>
          <h2>Venta seleccionada</h2>
          <p className="muted">
            {venta.venta.estado} · Total {formatCurrency(venta.venta.total)} · Pagado{' '}
            {formatCurrency(totalPagado)}
          </p>
        </div>
        <span className={canEdit ? 'status-pill status-open' : 'status-pill status-locked'}>
          {statusLabel}
        </span>
        <div className="row-actions">
          <button
            disabled={!canEdit}
            onClick={() => onEstado('pagada')}
            type="button"
          >
            Cobrar
          </button>
          <button
            className="secondary"
            disabled={!['pagada', 'devuelta'].includes(venta.venta.estado)}
            onClick={() => onEstado('anulada')}
            type="button"
          >
            Anular
          </button>
          <button className="danger" disabled={!canEdit} onClick={onDeleteVenta} type="button">
            Eliminar
          </button>
        </div>
      </div>

      <section className="sale-summary-grid" aria-label="Resumen de venta">
        <article>
          <span>Total</span>
          <strong>{formatCurrency(venta.venta.total)}</strong>
        </article>
        <article>
          <span>Pagado</span>
          <strong>{formatCurrency(totalPagado)}</strong>
        </article>
        <article>
          <span>Saldo</span>
          <strong>{formatCurrency(montoPagoAutomatico)}</strong>
        </article>
      </section>

      <form
        className="form-card compact-form sale-data-form"
        key={venta.venta.id}
        onSubmit={onSubmitVenta}
      >
        <h3>Datos de venta</h3>
        <fieldset disabled={!canEdit}>
          <div className="form-grid-2">
            <SelectAlmacen
              almacenes={data.almacenes}
              defaultValue={venta.venta.almacen_id}
            />
            <label>
              Cliente
              <select defaultValue={venta.venta.cliente_id ?? ''} name="cliente_id">
                <option value="">Cliente general</option>
                {data.clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tipo consumo
              <select defaultValue={venta.venta.tipo_consumo} name="tipo_consumo">
                <option value="local">Local</option>
                <option value="delivery">Delivery</option>
                <option value="para_llevar">Para llevar</option>
              </select>
            </label>
            <label>
              Mesa
              <select defaultValue={venta.venta.mesa_id ?? ''} name="mesa_id">
                <option value="">Sin mesa</option>
                {data.mesas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>
                    {mesa.codigo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Descuento
              <input
                defaultValue={venta.venta.descuento_global}
                min="0"
                name="descuento_global"
                step="0.01"
                type="number"
              />
            </label>
            <label>
              IGV %
              <input
                defaultValue={venta.venta.impuesto_porcentaje}
                min="0"
                name="impuesto_porcentaje"
                step="0.01"
                type="number"
              />
            </label>
          </div>
          <label>
            Observacion
            <textarea defaultValue={venta.venta.observacion ?? ''} name="observacion" />
          </label>
          <button type="submit">Actualizar venta</button>
        </fieldset>
      </form>

      <div className="sale-columns">
        <form className="form-card compact-form" onSubmit={onSubmitDetalle}>
          <h3>Agregar producto</h3>
          <fieldset disabled={!canEdit}>
            <SelectProducto
              disabled={!canEdit}
              onChange={setSelectedProductoId}
              productos={data.productos}
              value={selectedProductoId}
            />
            <div className="form-grid-2">
              <label>
                Cantidad
                <input
                  inputMode="numeric"
                  min="1"
                  name="cantidad"
                  onChange={(event) => setCantidadDetalle(event.target.value)}
                  required
                  step="1"
                  type="number"
                  value={cantidadDetalle}
                />
              </label>
              <label>
                Precio unitario
                <input
                  min="0"
                  name="precio_unitario"
                  readOnly
                  step="0.01"
                  type="number"
                  value={precioUnitario}
                />
              </label>
            </div>
            <label>
              Descuento
              <input
                min="0"
                name="descuento"
                onChange={(event) => setDescuentoDetalle(event.target.value)}
                step="0.01"
                type="number"
                value={descuentoDetalle}
              />
            </label>
            <label>
              Total detalle
              <input readOnly value={formatCurrency(totalDetalle)} />
            </label>
            <button type="submit">Agregar detalle</button>
          </fieldset>
        </form>

        <form className="form-card compact-form" onSubmit={onSubmitPago}>
          <h3>Agregar pago</h3>
          <fieldset disabled={!canEdit}>
            <label>
              Metodo
              <select name="metodo_pago_id" required>
                {data.metodosPago.map((metodo) => (
                  <option key={metodo.id} value={metodo.id}>
                    {metodo.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Monto
              <input
                min="0.01"
                name="monto"
                readOnly
                required
                step="0.01"
                type="number"
                value={montoPagoAutomatico.toFixed(2)}
              />
            </label>
            <label>
              Referencia
              <input name="referencia" />
            </label>
            <button type="submit">Agregar pago</button>
          </fieldset>
        </form>
      </div>

      <div className="sale-columns">
        <section>
          <h3>Detalle</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Desc.</th>
                  <th>Costo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {venta.detalles.map((detalle) => {
                  const producto = data.productos.find((item) => item.id === detalle.producto_id)
                  return (
                    <tr key={detalle.id}>
                      <td>{producto?.nombre ?? '-'}</td>
                      <td>{formatNumber(detalle.cantidad)}</td>
                      <td>{formatCurrency(detalle.precio_unitario)}</td>
                      <td>{formatCurrency(detalle.descuento)}</td>
                      <td>{formatCurrency(detalle.costo_total)}</td>
                      <td>
                        <button
                          className="danger"
                          disabled={!canEdit}
                          onClick={() => onDeleteDetalle(detalle)}
                          type="button"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3>Pagos</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Metodo</th>
                  <th>Monto</th>
                  <th>Referencia</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {venta.pagos.map((pago) => {
                  const metodo = data.metodosPago.find((item) => item.id === pago.metodo_pago_id)
                  return (
                    <tr key={pago.id}>
                      <td>{metodo?.nombre ?? '-'}</td>
                      <td>{formatCurrency(pago.monto)}</td>
                      <td>{pago.referencia ?? '-'}</td>
                      <td>
                        <button
                          className="danger"
                          disabled={!canEdit}
                          onClick={() => onDeletePago(pago)}
                          type="button"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
  )
}

function ReportTables({ data }: { readonly data: RestaurantData }): JSX.Element {
  const totalInventario = data.valorizacion.reduce(
    (total, item) => total + item.valor_total,
    0,
  )

  return (
    <>
      <section className="metrics panel-wide" aria-label="Resumen">
        <article>
          <span>Productos</span>
          <strong>{data.productos.length}</strong>
        </article>
        <article>
          <span>Stock critico</span>
          <strong>{data.stockCritico.length}</strong>
        </article>
        <article>
          <span>Valor inventario</span>
          <strong>{formatCurrency(totalInventario)}</strong>
        </article>
      </section>

      <section className="panel">
        <h2>Valorizacion</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Almacen</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Costo prom.</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.valorizacion.map((item) => (
                <tr key={`${item.almacen_id}-${item.producto_id}`}>
                  <td>{item.almacen}</td>
                  <td>{item.producto}</td>
                  <td>{formatNumber(item.cantidad)}</td>
                  <td>{formatCurrency(item.costo_promedio)}</td>
                  <td>{formatCurrency(item.valor_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Stock critico</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Almacen</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Minimo</th>
              </tr>
            </thead>
            <tbody>
              {data.stockCritico.map((item) => (
                <tr key={`${item.almacen}-${item.producto}-${item.sku ?? ''}`}>
                  <td>{item.almacen}</td>
                  <td>{item.producto}</td>
                  <td>{formatNumber(item.cantidad)}</td>
                  <td>{formatNumber(item.stock_minimo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel panel-wide">
        <h2>Kardex reciente</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Almacen</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Saldo</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {data.kardexReciente.map((item, index) => (
                <tr key={`${item.fecha}-${item.almacen}-${item.producto}-${item.tipo_movimiento}-${index}`}>
                  <td>{formatDateTime(item.fecha)}</td>
                  <td>{item.almacen}</td>
                  <td>{item.producto}</td>
                  <td>{item.tipo_movimiento}</td>
                  <td>{formatNumber(item.cantidad_entrada)}</td>
                  <td>{formatNumber(item.cantidad_salida)}</td>
                  <td>{formatNumber(item.saldo_cantidad)}</td>
                  <td>{formatCurrency(item.saldo_valorizado)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

type PeriodoVenta = 'dia' | 'mes' | 'anio'

type VentaPeriodoReporte = Readonly<{
  periodo: string
  ventas: number
  total: number
}>

type ProductoVendidoReporte = Readonly<{
  producto: string
  cantidad: number
  total: number
}>

type ClienteVentaReporte = Readonly<{
  cliente: string
  ventas: number
  total: number
}>

function getVentaFechaReporte(venta: Venta): string {
  return venta.pagada_en ?? venta.created_at
}

function formatPeriodoVenta(fechaIso: string, periodo: PeriodoVenta): string {
  const fecha = new Date(fechaIso)

  if (periodo === 'anio') {
    return String(fecha.getFullYear())
  }

  if (periodo === 'mes') {
    return new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric',
    }).format(fecha)
  }

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
  }).format(fecha)
}

function getPeriodoVentaKey(fechaIso: string, periodo: PeriodoVenta): string {
  const fecha = new Date(fechaIso)
  const year = fecha.getFullYear()
  const month = String(fecha.getMonth() + 1).padStart(2, '0')
  const day = String(fecha.getDate()).padStart(2, '0')

  if (periodo === 'anio') {
    return String(year)
  }

  if (periodo === 'mes') {
    return `${year}-${month}`
  }

  return `${year}-${month}-${day}`
}

function buildVentasPorPeriodo(
  ventas: readonly Venta[],
  periodo: PeriodoVenta,
): readonly VentaPeriodoReporte[] {
  const grouped = new Map<string, { label: string; ventas: number; total: number }>()

  ventas
    .filter((venta) => venta.estado === 'pagada')
    .forEach((venta) => {
      const fecha = getVentaFechaReporte(venta)
      const key = getPeriodoVentaKey(fecha, periodo)
      const current = grouped.get(key) ?? {
        label: formatPeriodoVenta(fecha, periodo),
        ventas: 0,
        total: 0,
      }

      grouped.set(key, {
        label: current.label,
        ventas: current.ventas + 1,
        total: current.total + venta.total,
      })
    })

  return [...grouped.entries()]
    .sort(([leftKey], [rightKey]) => rightKey.localeCompare(leftKey))
    .map(([, value]) => ({
      periodo: value.label,
      ventas: value.ventas,
      total: value.total,
    }))
}

function buildProductosVendidos(
  ventas: readonly VentaConRelaciones[],
  productos: readonly Producto[],
): readonly ProductoVendidoReporte[] {
  const paidVentaIds = new Set(
    ventas
      .filter((venta) => venta.venta.estado === 'pagada')
      .map((venta) => venta.venta.id),
  )
  const grouped = new Map<string, ProductoVendidoReporte>()

  ventas
    .flatMap((venta) => venta.detalles)
    .filter((detalle) => paidVentaIds.has(detalle.venta_id))
    .forEach((detalle) => {
      const producto = productos.find((item) => item.id === detalle.producto_id)
      const key = detalle.producto_id
      const current = grouped.get(key) ?? {
        producto: producto?.nombre ?? 'Producto no encontrado',
        cantidad: 0,
        total: 0,
      }

      grouped.set(key, {
        producto: current.producto,
        cantidad: current.cantidad + detalle.cantidad,
        total:
          current.total +
          Math.max(detalle.cantidad * detalle.precio_unitario - detalle.descuento, 0),
      })
    })

  return [...grouped.values()].sort((left, right) => right.total - left.total)
}

function buildVentasPorCliente(
  ventas: readonly VentaConRelaciones[],
): readonly ClienteVentaReporte[] {
  const grouped = new Map<string, ClienteVentaReporte>()

  ventas
    .filter((venta) => venta.venta.estado === 'pagada')
    .forEach((venta) => {
      const key = venta.cliente?.id ?? 'cliente-general'
      const current = grouped.get(key) ?? {
        cliente: venta.cliente?.nombre ?? 'Cliente general',
        ventas: 0,
        total: 0,
      }

      grouped.set(key, {
        cliente: current.cliente,
        ventas: current.ventas + 1,
        total: current.total + venta.venta.total,
      })
    })

  return [...grouped.values()].sort((left, right) => right.total - left.total)
}

function SalesPeriodTable({
  items,
  title,
}: {
  readonly items: readonly VentaPeriodoReporte[]
  readonly title: string
}): JSX.Element {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Periodo</th>
              <th>Ventas</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <EmptyRow colSpan={3} label="Sin ventas cobradas" />
            ) : (
              items.map((item) => (
                <tr key={item.periodo}>
                  <td>{item.periodo}</td>
                  <td>{formatNumber(item.ventas)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ReportsFrame({ data }: { readonly data: RestaurantData }): JSX.Element {
  const ventas = useMemo(() => buildVentas(data), [data])
  const ventasPagadas = ventas.filter((venta) => venta.venta.estado === 'pagada')
  const productosVendidos = buildProductosVendidos(ventas, data.productos)
  const ventasPorCliente = buildVentasPorCliente(ventas)
  const ventasPorDia = buildVentasPorPeriodo(data.ventas, 'dia')
  const ventasPorMes = buildVentasPorPeriodo(data.ventas, 'mes')
  const ventasPorAnio = buildVentasPorPeriodo(data.ventas, 'anio')

  return (
    <section className="frame-grid">
      <section className="panel panel-wide">
        <h2>Ventas detalladas</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasPagadas.length === 0 ? (
                <EmptyRow colSpan={5} label="Sin ventas cobradas" />
              ) : (
                ventasPagadas.map((item) => (
                  <tr key={item.venta.id}>
                    <td>{formatDateTime(getVentaFechaReporte(item.venta))}</td>
                    <td>{item.cliente?.nombre ?? 'Cliente general'}</td>
                    <td>
                      {item.detalles
                        .map((detalle) => {
                          const producto = data.productos.find(
                            (currentProducto) => currentProducto.id === detalle.producto_id,
                          )
                          return `${formatNumber(detalle.cantidad)} x ${
                            producto?.nombre ?? 'Producto no encontrado'
                          }`
                        })
                        .join(', ') || '-'}
                    </td>
                    <td>{item.venta.estado}</td>
                    <td>{formatCurrency(item.venta.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Ventas por cliente</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Ventas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasPorCliente.length === 0 ? (
                <EmptyRow colSpan={3} label="Sin ventas cobradas" />
              ) : (
                ventasPorCliente.map((item) => (
                  <tr key={item.cliente}>
                    <td>{item.cliente}</td>
                    <td>{formatNumber(item.ventas)}</td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Productos vendidos</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {productosVendidos.length === 0 ? (
                <EmptyRow colSpan={3} label="Sin productos vendidos" />
              ) : (
                productosVendidos.map((item) => (
                  <tr key={item.producto}>
                    <td>{item.producto}</td>
                    <td>{formatNumber(item.cantidad)}</td>
                    <td>{formatCurrency(item.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <SalesPeriodTable items={ventasPorDia} title="Ventas por dia" />
      <SalesPeriodTable items={ventasPorMes} title="Ventas por mes" />
      <SalesPeriodTable items={ventasPorAnio} title="Ventas por anio" />

      <ReportTables data={data} />
      <section className="panel panel-wide">
        <h2>Ventas por usuario</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Dia</th>
                <th>Ventas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {data.ventasPorUsuario.map((item) => (
                <tr key={`${item.usuario_id}-${item.dia}`}>
                  <td>{item.usuario}</td>
                  <td>{formatDateTime(item.dia)}</td>
                  <td>{formatNumber(item.cantidad_ventas)}</td>
                  <td>{formatCurrency(item.total_vendido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function Dashboard({ userId }: { readonly userId: string }): JSX.Element {
  const { data, errorMessage, isLoading, reload } = useRestaurantData(true)
  const [activeFrame, setActiveFrame] = useState<Frame>('clientes')
  const activeFrameMeta = frames.find((frame) => frame.id === activeFrame) ?? frames[0]
  const ventasPendientes =
    data?.ventas.filter((venta) => venta.estado === 'pendiente').length ?? 0
  const stockCritico = data?.stockCritico.length ?? 0

  async function handleAlmacenSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    await saveAlmacen({
      nombre: String(formData.get('nombre') ?? ''),
      descripcion: parseText(formData.get('descripcion')),
      ubicacion: parseText(formData.get('ubicacion')),
    })
    form.reset()
    reload()
  }

  return (
    <main className="dashboard">
      <aside className="app-sidebar" aria-label="Navegacion principal">
        <div className="brand-block">
          <img alt="Don Cangrejo Restaurant Marino" src="/don-cangrejo-logo.svg" />
          <div>
            <p className="eyebrow">Restaurant marino</p>
            <strong>Don Cangrejo</strong>
            <span>POS e inventario</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="Modulos">
          {frames.map((frame) => (
            <button
              className={activeFrame === frame.id ? 'active' : ''}
              key={frame.id}
              onClick={() => setActiveFrame(frame.id)}
              type="button"
            >
              <span>{frame.label}</span>
              <small>{frame.description}</small>
            </button>
          ))}
        </nav>
        <div className="sidebar-summary">
          <span>Ventas pendientes</span>
          <strong>{ventasPendientes}</strong>
          <span>Stock critico</span>
          <strong>{stockCritico}</strong>
        </div>
      </aside>

      <section className="app-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Modulo</p>
            <h1>{activeFrameMeta.label}</h1>
            <p className="muted">{activeFrameMeta.description}</p>
          </div>
          <div className="topbar-actions">
            <button onClick={reload} type="button">
              Actualizar
            </button>
            <button className="secondary" onClick={() => void signOut()} type="button">
              Salir
            </button>
          </div>
        </header>

        <nav className="tabs" aria-label="Modulos secundarios">
          {frames.map((frame) => (
            <button
              className={activeFrame === frame.id ? 'active' : ''}
              key={frame.id}
              onClick={() => setActiveFrame(frame.id)}
              type="button"
            >
              {frame.label}
            </button>
          ))}
        </nav>

        {errorMessage ? <p className="banner-error">{errorMessage}</p> : null}
        {isLoading ? <p className="loading">Cargando datos...</p> : null}

        {data ? (
          <>
            {activeFrame === 'clientes' ? (
              <ClientesFrame data={data} reload={reload} />
            ) : null}
            {activeFrame === 'mesas' ? <MesasFrame data={data} reload={reload} /> : null}
            {activeFrame === 'inventario' ? <InventoryFrame data={data} reload={reload} /> : null}
            {activeFrame === 'ventas' ? (
              <SalesFrame data={data} reload={reload} userId={userId} />
            ) : null}
            {activeFrame === 'catalogo' ? (
              <section className="frame-grid">
                <form
                  className="form-card compact-form"
                  onSubmit={(event) => void handleAlmacenSubmit(event)}
                >
                  <h3>Nuevo almacen</h3>
                  <label>
                    Nombre
                    <input name="nombre" required />
                  </label>
                  <label>
                    Descripcion
                    <input name="descripcion" />
                  </label>
                  <label>
                    Ubicacion
                    <input name="ubicacion" />
                  </label>
                  <button type="submit">Guardar almacen</button>
                </form>
                <CatalogFrame data={data} reload={reload} />
              </section>
            ) : null}
            {activeFrame === 'reportes' ? <ReportsFrame data={data} /> : null}
          </>
        ) : null}
      </section>
    </main>
  )
}

function App(): JSX.Element {
  const { session, isLoading } = useAuthSession()

  if (isLoading) {
    return <p className="app-loading">Validando sesion...</p>
  }

  return session ? <Dashboard userId={session.user.id} /> : <LoginPanel />
}

export default App
