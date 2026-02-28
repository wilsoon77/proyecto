export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">Términos y Condiciones</h1>
      <p className="mb-6 text-gray-700">Última actualización: Noviembre 2025</p>

      <div className="prose prose-gray max-w-none">
        <h2>Uso de la plataforma</h2>
        <p>Al usar PanaderIA aceptas estos términos. Nos reservamos el derecho de actualizar este documento.</p>

        <h2>Pedidos</h2>
        <ul>
          <li>Los precios se muestran en Quetzales (GTQ).</li>
          <li>Los tiempos de preparación y entrega son estimados.</li>
          <li>Nos reservamos el derecho de cancelar pedidos por causas justificadas.</li>
        </ul>

        <h2>Pagos</h2>
        <p>El pago se realiza al momento de recoger el pedido en sucursal. Aceptamos efectivo y tarjeta.</p>

        <h2>Retiro de pedidos</h2>
        <p>Todos los pedidos se recogen en la sucursal seleccionada. El pedido mínimo es de Q15.</p>

        <h2>Devoluciones</h2>
        <p>Por tratarse de productos alimenticios, las devoluciones se evalúan caso por caso dentro del mismo día de compra.</p>

        <h2>Contacto</h2>
        <p>Para soporte, escríbenos a info@panaderia.gt.</p>
      </div>
    </div>
  )
}
