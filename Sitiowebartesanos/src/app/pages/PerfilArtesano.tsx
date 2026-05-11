import { useState, useEffect, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import {
  getCategorias, createCategoria, deleteCategoria,
  getProductos,  createProducto,  deleteProducto,
  getKardex,     createKardex,
  type Categoria, type Producto, type Kardex,
} from '../data/artesanoApi';
 
const ARTESANO_ID: number = Number(localStorage.getItem('usuario_id') ?? 1);
 
// ── UI helpers ───────────────────────────────────────────────────────────────
const Badge = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{children}</span>
);
 
const Alert = ({ msg, type }: { msg: string; type: 'success' | 'info' | 'error' }) => {
  const colors = { success: 'bg-green-100 text-green-800 border-green-200', info: 'bg-blue-100 text-blue-800 border-blue-200', error: 'bg-red-100 text-red-800 border-red-200' };
  return <div className={`mb-4 p-3 rounded-lg border text-sm font-medium ${colors[type]}`}>{msg}</div>;
};
 
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
    <label className="text-xs font-semibold uppercase tracking-wider text-amber-900/70">{label}</label>
    {children}
  </div>
);
 
const inputCls = 'px-3 py-2 rounded-lg border border-amber-200 bg-amber-50 text-sm text-stone-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition';
 
// ── Stock badge ──────────────────────────────────────────────────────────────
function StockBadge({ p }: { p: Producto }) {
  if (p.estado_stock === 'bajo' || p.cantidad <= p.stock_minimo)
    return <Badge color="bg-red-100 text-red-700">⚠️ {p.cantidad} (bajo)</Badge>;
  if (p.stock_maximo > 0 && p.cantidad >= p.stock_maximo)
    return <Badge color="bg-blue-100 text-blue-700">📦 {p.cantidad} (máx)</Badge>;
  return <Badge color="bg-green-100 text-green-700">{p.cantidad}</Badge>;
}
 
// ════════════════════════════════════════════════════════════════════════════
// MÓDULO CATÁLOGO
// ════════════════════════════════════════════════════════════════════════════
function ModuloCatalogo({ productos }: { productos: Producto[] }) {
  const [archivos, setArchivos] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
 
  return (
    <div className="space-y-5">
      {saved && <Alert msg="✓ Catálogo guardado correctamente" type="success" />}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-xl text-amber-800 mb-4">📂 Subir Catálogo</h2>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-xl p-8 cursor-pointer hover:bg-amber-50 transition text-stone-500">
          <span className="text-4xl mb-2">🖼️</span>
          <p className="text-sm">Arrastra imágenes o haz clic para seleccionar</p>
          <span className="text-xs opacity-60 mt-1">JPG, PNG, PDF — máx. 10 MB</span>
          <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={e => setArchivos(Array.from(e.target.files ?? []).map(f => f.name))} />
        </label>
        {archivos.length > 0 && (
          <div className="mt-4 space-y-2">
            {archivos.map((f, i) => <div key={i} className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-sm"><span>📄</span>{f}</div>)}
          </div>
        )}
        <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}
          className="mt-4 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-semibold shadow hover:shadow-md transition">
          Guardar catálogo
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-xl text-amber-800 mb-4">📋 Productos en catálogo</h2>
        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
              <tr>{['Código','Lote','Producto','Categoría','Precio neto','IVA','Desc.','Stock'].map(h => <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id} className="border-t border-amber-50 hover:bg-amber-50/50 transition">
                  <td className="px-3 py-3 font-mono text-xs">{p.codigo_barra || '—'}</td>
                  <td className="px-3 py-3 text-xs">{p.lote || '—'}</td>
                  <td className="px-3 py-3 font-semibold">{p.nombre}</td>
                  <td className="px-3 py-3"><Badge color="bg-amber-100 text-amber-800">{p.categoria_nombre ?? '—'}</Badge></td>
                  <td className="px-3 py-3">${Number(p.precio_neto).toLocaleString()}</td>
                  <td className="px-3 py-3">{p.iva}%</td>
                  <td className="px-3 py-3">{p.descuento ? <Badge color="bg-green-100 text-green-700">Sí</Badge> : '—'}</td>
                  <td className="px-3 py-3"><StockBadge p={p} /></td>
                </tr>
              ))}
              {productos.length === 0 && <tr><td colSpan={8} className="px-4 py-6 text-center text-stone-400">Sin productos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
 
// ════════════════════════════════════════════════════════════════════════════
// MÓDULO CONTABLE
// ════════════════════════════════════════════════════════════════════════════
function ModuloContable({ productos }: { productos: Producto[] }) {
  const [selId, setSelId] = useState<number>(productos[0]?.id ?? 0);
  const producto = productos.find(p => p.id === selId);
 
  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-xl text-amber-800 mb-5">🧾 Detalle de Artículo</h2>
        <Field label="Seleccionar artículo">
          <select className={inputCls} value={selId} onChange={e => setSelId(Number(e.target.value))}>
            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </Field>
        {producto && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Código de barra', value: producto.codigo_barra || '—' },
                { label: 'Lote', value: producto.lote || '—' },
                { label: 'Nombre', value: producto.nombre },
                { label: 'Categoría', value: producto.categoria_nombre ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 min-w-[130px] bg-amber-50 rounded-xl px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-amber-900/60 font-semibold mb-1">{label}</div>
                  <div className="text-sm font-semibold text-stone-800 font-mono">{value}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Stock actual', value: `${producto.cantidad} uds`, color: producto.cantidad <= producto.stock_minimo ? 'text-red-600' : 'text-green-700' },
                { label: 'Stock mínimo', value: `${producto.stock_minimo} uds`, color: 'text-stone-800' },
                { label: 'Stock máximo', value: `${producto.stock_maximo} uds`, color: 'text-stone-800' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex-1 min-w-[120px] bg-amber-50 rounded-xl px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-amber-900/60 font-semibold mb-1">{label}</div>
                  <div className={`text-sm font-bold ${color}`}>{value}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Precio Neto', value: `$${Number(producto.precio_neto).toLocaleString()}` },
                { label: 'IVA', value: `${producto.iva}%` },
                { label: '¿Descuento?', value: producto.descuento ? 'Sí (10%)' : 'No' },
              ].map(({ label, value }) => (
                <div key={label} className="flex-1 min-w-[120px] bg-amber-50 rounded-xl px-4 py-3">
                  <div className="text-xs uppercase tracking-wider text-amber-900/60 font-semibold mb-1">{label}</div>
                  <div className="text-sm font-semibold text-stone-800">{value}</div>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-amber-700 to-amber-500 rounded-2xl p-5 text-white">
              <div className="text-xs uppercase tracking-wider opacity-70 font-semibold mb-3">Resumen de precios</div>
              <div className="flex gap-8 flex-wrap">
                <div>
                  <div className="text-xs opacity-70">Precio + IVA</div>
                  <div className="text-2xl font-serif font-bold">${(producto.precio_con_iva ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
                {producto.descuento && (
                  <div>
                    <div className="text-xs opacity-70">Con descuento (10%)</div>
                    <div className="text-2xl font-serif font-bold text-green-200">${(producto.precio_final ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {productos.length === 0 && <p className="text-sm text-stone-400 mt-4">No hay productos registrados.</p>}
      </div>
    </div>
  );
}
 
// ════════════════════════════════════════════════════════════════════════════
// MÓDULO PRODUCTOS + CATEGORÍAS
// ════════════════════════════════════════════════════════════════════════════
// Genera código correlativo basado en productos existentes
function generarCodigo(productos: Producto[]): string {
  const ultimo = productos
    .map(p => p.codigo_barra)
    .filter(c => c?.startsWith('PROD-'))
    .map(c => parseInt(c!.replace('PROD-', '')) || 0)
    .sort((a, b) => b - a)[0] ?? 0;
  return `PROD-${String(ultimo + 1).padStart(4, '0')}`;
}
 
function ModuloProductos({ productos, setProductos, categorias, setCategorias }: {
  productos: Producto[];   setProductos: React.Dispatch<React.SetStateAction<Producto[]>>;
  categorias: Categoria[]; setCategorias: React.Dispatch<React.SetStateAction<Categoria[]>>;
}) {
  // FIX 1: Variables declaradas dentro de la función, no fuera
  const [tabLocal, setTabLocal] = useState<'producto' | 'categoria' | 'lista'>('categoria');
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
 
  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500);
  };
 
  const [prod, setProd] = useState<Omit<Producto, 'id'>>(() => {
    const codigo = generarCodigo(productos);
    return {
      codigo_barra: codigo, lote: codigo,
      nombre: '', categoria: null,
      precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0,
      cantidad: 0, stock_minimo: 0, stock_maximo: 0,
      artesano: ARTESANO_ID,
    };
  });
 
  const handleAddProducto = async () => {
    if (!prod.nombre || !prod.precio_neto)
      return showAlert('Nombre y precio son obligatorios', 'error');
    if (prod.cantidad < 0 || prod.stock_minimo < 0 || prod.stock_maximo < 0)
      return showAlert('Los valores de stock no pueden ser negativos', 'error');
    if (prod.stock_maximo > 0 && prod.stock_minimo > prod.stock_maximo)
      return showAlert('El stock mínimo no puede ser mayor al máximo', 'error');
    if (prod.descuento && (prod.valor_descuento ?? 0) <= 0)
      return showAlert('El porcentaje de descuento debe ser mayor a 0', 'error');
    if (prod.descuento && (prod.valor_descuento ?? 0) >= 100)
      return showAlert('El descuento no puede ser 100% o más', 'error');
    setLoading(true);
 
    try {
      // FIX 2: createProducto primero, luego generar el nuevo código con el resultado
      const nuevo = await createProducto(prod);
      setProductos(prev => [...prev, nuevo]);
 
      // FIX 3: setProd solo una vez, después de tener el nuevo producto
      const nuevoCodigo = generarCodigo([...productos, nuevo]);
      setProd({
        codigo_barra: nuevoCodigo, lote: nuevoCodigo,
        nombre: '', categoria: null,
        precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0,
        cantidad: 0, stock_minimo: 0, stock_maximo: 0,
        artesano: ARTESANO_ID,
      });
      showAlert('✓ Producto creado correctamente');
    } catch { showAlert('Error al guardar el producto', 'error'); }
    finally { setLoading(false); }
  };
 
  const handleDeleteProducto = async (id: number) => {
    await deleteProducto(id);
    setProductos(prev => prev.filter(p => p.id !== id));
    showAlert('Producto eliminado');
  };
 
  const [cat, setCat] = useState({ nombre: '', descripcion: '' });
 
  const handleAddCategoria = async () => {
    if (!cat.nombre) return showAlert('El nombre es obligatorio', 'error');
    setLoading(true);
    try {
      const nueva = await createCategoria({ ...cat, artesano: ARTESANO_ID });
      setCategorias(prev => [...prev, nueva]);
      setCat({ nombre: '', descripcion: '' });
      showAlert('✓ Categoría creada correctamente');
    } catch { showAlert('Error al guardar la categoría', 'error'); }
    finally { setLoading(false); }
  };
 
  const handleDeleteCategoria = async (id: number) => {
    await deleteCategoria(id);
    setCategorias(prev => prev.filter(c => c.id !== id));
  };
 
  // FIX 6: 'categoria' (con i) en lugar de 'categora'
  const tabCls = (t: string) => `px-4 py-2 rounded-xl text-sm font-semibold transition ${tabLocal === t ? 'bg-amber-700 text-white shadow' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`;
 
  return (
    <div className="space-y-5">
      {alert && <Alert msg={alert.msg} type={alert.type} />}
      <div className="flex gap-3 flex-wrap">
        <button className={tabCls('categoria')} onClick={() => setTabLocal('categoria')}>🏷️ Nueva Categoría</button>
        <button className={tabCls('producto')} onClick={() => setTabLocal('producto')}>➕ Nuevo Producto</button>
        <button className={tabCls('lista')}     onClick={() => setTabLocal('lista')}>📋 Ver todo</button>
      </div>
 
      {tabLocal === 'producto' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-serif text-xl text-amber-800 mb-5">➕ Crear Producto</h2>
          <div className="space-y-4">
            {/* Identificación */}
            {/* FIX 5: div de identificación correctamente cerrado */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">🔖 Identificación</p>
              <div className="flex flex-wrap gap-4">
                <Field label="Código de barra / QR">
                  <input className={`${inputCls} bg-amber-100 cursor-not-allowed`}
                    value={prod.codigo_barra || ''} readOnly />
                </Field>
                <Field label="Lote">
                  <input className={`${inputCls} bg-amber-100 cursor-not-allowed`}
                    value={prod.lote || ''} readOnly />
                </Field>
              </div>
            </div>
 
            {/* Información básica */}
            <div className="flex flex-wrap gap-4">
              <Field label="Nombre *">
                <input className={inputCls} value={prod.nombre} onChange={e => setProd({ ...prod, nombre: e.target.value })} placeholder="Ej: Mochila wayuu" />
              </Field>
              <Field label="Categoría">
                <select className={inputCls} value={prod.categoria ?? ''} onChange={e => setProd({ ...prod, categoria: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">— Seleccionar —</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </Field>
            </div>
 
            {/* Precio */}
            <div className="flex flex-wrap gap-4">
              <Field label="Precio neto *">
                <input className={inputCls} type="number" min="0" value={prod.precio_neto || ''} onChange={e => setProd({ ...prod, precio_neto: Number(e.target.value) })} placeholder="0" />
              </Field>
              <Field label="IVA (%)">
                <select className={inputCls} value={prod.iva} onChange={e => setProd({ ...prod, iva: Number(e.target.value) })}>
                  <option value={0}>0% — Excluido</option>
                  <option value={5}>5%</option>
                  <option value={19}>19%</option>
                </select>
              </Field>
            </div>
 
            {/* Stock */}
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">📦 Control de Stock</p>
              <div className="flex flex-wrap gap-4">
                <Field label="Cantidad inicial">
                  <input className={inputCls} type="number" min="0" value={prod.cantidad || ''} onChange={e => setProd({ ...prod, cantidad: Number(e.target.value) })} placeholder="0" />
                </Field>
                <Field label="Stock mínimo">
                  <input className={inputCls} type="number" min="0" value={prod.stock_minimo || ''} onChange={e => setProd({ ...prod, stock_minimo: Number(e.target.value) })} placeholder="0" />
                </Field>
                <Field label="Stock máximo">
                  <input className={inputCls} type="number" min="0" value={prod.stock_maximo || ''} onChange={e => setProd({ ...prod, stock_maximo: Number(e.target.value) })} placeholder="0" />
                </Field>
              </div>
              <p className="text-xs text-stone-400 mt-2">⚠️ Recibirás alerta cuando el stock baje del mínimo</p>
            </div>
 
            {/* Descuento */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={prod.descuento}
                  onChange={e => setProd({ ...prod, descuento: e.target.checked, valor_descuento: 0 })}
                  className="w-4 h-4 accent-orange-600" />
                <span>¿Obtiene descuento?</span>
              </label>
 
              {prod.descuento && (
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-3">
                  <Field label="Porcentaje de descuento (%) *">
                    <input
                      className={inputCls}
                      type="number" min="1" max="99"
                      value={prod.valor_descuento || ''}
                      onChange={e => setProd({ ...prod, valor_descuento: Number(e.target.value) })}
                      placeholder="Ej: 10"
                    />
                  </Field>
 
                  {/* Preview de precios */}
                  {prod.precio_neto > 0 && (prod.valor_descuento ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-4 mt-2">
                      <div className="flex-1 min-w-[130px] bg-white rounded-xl px-4 py-3 border border-orange-100">
                        <div className="text-xs uppercase tracking-wider text-orange-700/70 font-semibold mb-1">Precio neto</div>
                        <div className="text-lg font-bold text-stone-800">
                          ${Number(prod.precio_neto).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex-1 min-w-[130px] bg-white rounded-xl px-4 py-3 border border-orange-100">
                        <div className="text-xs uppercase tracking-wider text-orange-700/70 font-semibold mb-1">
                          Precio con {prod.valor_descuento}% descuento
                        </div>
                        <div className="text-lg font-bold text-green-600">
                          ${Math.round(prod.precio_neto * (1 - (prod.valor_descuento ?? 0) / 100)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
 
            {/* FIX 4: comilla simple sobrante eliminada al cerrar el bloque */}
            <div className="flex gap-3 mt-2">
              <button onClick={handleAddProducto} disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-semibold shadow hover:shadow-md transition disabled:opacity-60">
                {loading ? 'Guardando...' : 'Guardar producto'}
              </button>
              <button onClick={() => {
                const codigo = generarCodigo(productos);
                setProd({ codigo_barra: codigo, lote: codigo, nombre: '', categoria: null, precio_neto: 0, iva: 0, descuento: false, valor_descuento: 0, cantidad: 0, stock_minimo: 0, stock_maximo: 0, artesano: ARTESANO_ID });
              }}
                className="px-5 py-2 rounded-xl bg-amber-100 text-amber-800 text-sm font-semibold hover:bg-amber-200 transition">
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}
 
      {tabLocal === 'categoria' && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-serif text-xl text-amber-800 mb-5">🏷️ Crear Categoría</h2>
          <div className="space-y-4">
            <Field label="Nombre *">
              <input className={inputCls} value={cat.nombre} onChange={e => setCat({ ...cat, nombre: e.target.value })} placeholder="Ej: Bisutería" />
            </Field>
            <Field label="Descripción">
              <textarea className={`${inputCls} min-h-[80px] resize-y`} value={cat.descripcion} onChange={e => setCat({ ...cat, descripcion: e.target.value })} placeholder="Descripción breve..." />
            </Field>
            <button onClick={handleAddCategoria} disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-700 to-amber-500 text-white text-sm font-semibold shadow hover:shadow-md transition disabled:opacity-60">
              {loading ? 'Guardando...' : 'Guardar categoría'}
            </button>
          </div>
        </div>
      )}
 
      {tabLocal === 'lista' && (
        <>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-serif text-xl text-amber-800 mb-4">📦 Productos registrados</h2>
            <div className="overflow-x-auto rounded-xl border border-amber-100">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                  <tr>{['Código','Lote','Nombre','Categoría','Precio','IVA','Desc.','Stock','Min','Max',''].map(h => <th key={h} className="px-3 py-3 text-left font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {productos.map(p => (
                    <tr key={p.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                      <td className="px-3 py-3 font-mono text-xs">{p.codigo_barra || '—'}</td>
                      <td className="px-3 py-3 text-xs">{p.lote || '—'}</td>
                      <td className="px-3 py-3 font-semibold">{p.nombre}</td>
                      <td className="px-3 py-3"><Badge color="bg-amber-100 text-amber-800">{p.categoria_nombre ?? '—'}</Badge></td>
                      <td className="px-3 py-3">${Number(p.precio_neto).toLocaleString()}</td>
                      <td className="px-3 py-3">{p.iva}%</td>
                      <td className="px-3 py-3">{p.descuento ? <Badge color="bg-green-100 text-green-700">Sí</Badge> : '—'}</td>
                      <td className="px-3 py-3"><StockBadge p={p} /></td>
                      <td className="px-3 py-3 text-xs text-stone-400">{p.stock_minimo}</td>
                      <td className="px-3 py-3 text-xs text-stone-400">{p.stock_maximo}</td>
                      <td className="px-3 py-3">
                        <button onClick={() => handleDeleteProducto(p.id!)} className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {productos.length === 0 && <tr><td colSpan={11} className="px-4 py-6 text-center text-stone-400">Sin productos</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-serif text-xl text-amber-800 mb-4">🏷️ Categorías</h2>
            <div className="overflow-x-auto rounded-xl border border-amber-100">
              <table className="w-full text-sm">
                <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
                  <tr>{['Nombre','Descripción',''].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {categorias.map(c => (
                    <tr key={c.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                      <td className="px-4 py-3 font-semibold">{c.nombre}</td>
                      <td className="px-4 py-3 text-stone-500">{c.descripcion || '—'}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteCategoria(c.id!)} className="px-3 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {categorias.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-stone-400">Sin categorías</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
 
// ════════════════════════════════════════════════════════════════════════════
// MÓDULO INVENTARIO (Kardex)
// ════════════════════════════════════════════════════════════════════════════
function ModuloInventario({ productos, kardex, setKardex }: {
  productos: Producto[]; kardex: Kardex[]; setKardex: React.Dispatch<React.SetStateAction<Kardex[]>>;
}) {
  const [form, setForm] = useState<Omit<Kardex, 'id'>>({ producto: productos[0]?.id ?? 0, tipo: 'Entrada', cantidad: 0, fecha: '', nota: '' });
  const [alert, setAlert] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
 
  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => { setAlert({ msg, type }); setTimeout(() => setAlert(null), 3500); };
 
  const totalEntradas = kardex.filter(k => k.tipo === 'Entrada').reduce((s, k) => s + k.cantidad, 0);
  const totalSalidas  = kardex.filter(k => k.tipo === 'Salida').reduce((s,  k) => s + k.cantidad, 0);
 
  // Alertas de stock bajo
  const productosBajoStock = productos.filter(p => p.stock_minimo > 0 && p.cantidad <= p.stock_minimo);
 
  const handleAdd = async () => {
    if (!form.producto || !form.cantidad || !form.fecha) return showAlert('Producto, cantidad y fecha son obligatorios', 'error');
    setLoading(true);
    try {
      const nuevo = await createKardex(form);
      setKardex(prev => [nuevo, ...prev]);
      setForm({ producto: productos[0]?.id ?? 0, tipo: 'Entrada', cantidad: 0, fecha: '', nota: '' });
      showAlert('✓ Movimiento registrado en Inventario');
    } catch { showAlert('Error al registrar el movimiento', 'error'); }
    finally { setLoading(false); }
  };
 
  return (
    <div className="space-y-5">
      {productosBajoStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-bold text-red-700 mb-2">⚠️ Productos con stock bajo:</p>
          {productosBajoStock.map(p => (
            <p key={p.id} className="text-xs text-red-600">• {p.nombre} — stock actual: {p.cantidad} (mínimo: {p.stock_minimo})</p>
          ))}
        </div>
      )}
 
      {alert && <Alert msg={alert.msg} type={alert.type} />}
 
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total entradas', val: `+${totalEntradas}`, color: 'text-green-700' },
          { label: 'Total salidas',  val: `-${totalSalidas}`,  color: 'text-red-600'   },
          { label: 'Balance neto',   val: `${totalEntradas - totalSalidas}`, color: 'text-amber-800' },
          { label: 'Movimientos',    val: `${kardex.length}`,  color: 'text-stone-700' },
        ].map(({ label, val, color }) => (
          <div key={label} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">{label}</div>
            <div className={`font-serif text-2xl font-bold ${color}`}>{val}</div>
          </div>
        ))}
      </div>
 
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-xl text-amber-800 mb-5">📝 Registrar movimiento</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Field label="Producto">
              <select className={inputCls} value={form.producto} onChange={e => setForm({ ...form, producto: Number(e.target.value) })}>
                {productos.map(p => <option key={p.id} value={p.id}>{p.nombre} {p.codigo_barra ? `[${p.codigo_barra}]` : ''}</option>)}
              </select>
            </Field>
            <Field label="Tipo de movimiento">
              <select className={inputCls} value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as 'Entrada' | 'Salida' })}>
                <option value="Entrada">📥 Entrada (producción / compra)</option>
                <option value="Salida">📤 Salida (venta / pérdida)</option>
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-4">
            <Field label="Cantidad *">
              <input className={inputCls} type="number" value={form.cantidad || ''} onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })} placeholder="0" />
            </Field>
            <Field label="Fecha *">
              <input className={inputCls} type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
            </Field>
          </div>
          <Field label="Nota u observación">
            <input className={inputCls} value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} placeholder="Ej: venta feria artesanal" />
          </Field>
          <button onClick={handleAdd} disabled={loading}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-700 to-green-500 text-white text-sm font-semibold shadow hover:shadow-md transition disabled:opacity-60">
            {loading ? 'Registrando...' : 'Registrar movimiento'}
          </button>
        </div>
      </div>
 
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-serif text-xl text-amber-800 mb-4">📊 Historial de movimientos</h2>
        <div className="overflow-x-auto rounded-xl border border-amber-100">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 text-xs uppercase tracking-wider text-amber-900/60">
              <tr>{['Producto','Tipo','Cantidad','Fecha','Nota'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {kardex.map(k => (
                <tr key={k.id} className="border-t border-amber-50 hover:bg-amber-50/50">
                  <td className="px-4 py-3 font-semibold">{k.producto_nombre}</td>
                  <td className="px-4 py-3"><Badge color={k.tipo === 'Entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{k.tipo === 'Entrada' ? '📥' : '📤'} {k.tipo}</Badge></td>
                  <td className={`px-4 py-3 font-bold ${k.tipo === 'Entrada' ? 'text-green-700' : 'text-red-600'}`}>{k.tipo === 'Entrada' ? '+' : '-'}{k.cantidad}</td>
                  <td className="px-4 py-3 text-stone-500">{k.fecha || '—'}</td>
                  <td className="px-4 py-3 text-stone-400">{k.nota || '—'}</td>
                </tr>
              ))}
              {kardex.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-stone-400">Sin movimientos</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
 
// ════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════
export default function PerfilArtesano() {
  const [tab, setTab] = useState<'catalogo' | 'contable' | 'productos' | 'inventario'>('catalogo');
  const [productos,  setProductos]  = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [kardex,     setKardex]     = useState<Kardex[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, cats, kard] = await Promise.all([
        getProductos(ARTESANO_ID),
        getCategorias(ARTESANO_ID),
        getKardex(),
      ]);
      setProductos(prods);
      setCategorias(cats);
      setKardex(kard);
    } catch {
      setError('No se pudo conectar con el servidor. Verifica que Django esté corriendo en localhost:8000');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  return (
    <div className="min-h-screen bg-amber-50/60 font-sans">
      <Navbar activeTab={tab} onTabChange={setTab} />

      <div className="max-w-5xl mx-auto px-4 py-7">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-amber-700 text-sm gap-3">
            <span className="animate-spin text-xl">⏳</span> Cargando datos del servidor...
          </div>
        ) : error ? (
          <Alert msg={error} type="error" />
        ) : (
          <>
            {tab === 'catalogo'   && <ModuloCatalogo   productos={productos} />}
            {tab === 'contable'   && <ModuloContable   productos={productos} />}
            {tab === 'productos'  && <ModuloProductos  productos={productos} setProductos={setProductos} categorias={categorias} setCategorias={setCategorias} />}
            {tab === 'inventario' && <ModuloInventario productos={productos} kardex={kardex} setKardex={setKardex} />}
          </>
        )}
      </div>
    </div>
  );
}
 