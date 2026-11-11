export interface OrderEvent {
  id: string;
  type: "PedidoCriado";
  source: string;
  data: { pedidoId: string; total: number };
}
export interface OrderResult {
  pedidoId: string;
  status: "processado";
  desconto: "0%" | "10%";
  totalFinal: number;
}
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
export function validateEvent(value: unknown): asserts value is OrderEvent {
  if (!record(value))
    throw new ValidationError("O evento deve ser um objeto JSON.");
  if (value.type !== "PedidoCriado")
    throw new ValidationError("O tipo do evento deve ser PedidoCriado.");
  if (typeof value.id !== "string" || !value.id.trim())
    throw new ValidationError("O identificador do evento (id) é obrigatório.");
  if (typeof value.source !== "string" || !value.source.trim())
    throw new ValidationError("A origem do evento (source) é obrigatória.");
  if (!record(value.data))
    throw new ValidationError("O campo data deve ser um objeto.");
  if (typeof value.data.pedidoId !== "string" || !value.data.pedidoId.trim())
    throw new ValidationError(
      "O identificador do pedido (data.pedidoId) é obrigatório.",
    );
  if (
    typeof value.data.total !== "number" ||
    !Number.isFinite(value.data.total) ||
    value.data.total < 0 ||
    value.data.total > Number.MAX_SAFE_INTEGER / 100
  )
    throw new ValidationError(
      "O total deve ser um número finito, não negativo e dentro do limite monetário.",
    );
}

export function processOrder(
  value: unknown,
  log: (message: string) => void = () => {},
): OrderResult {
  log("Validando o evento PedidoCriado.");
  validateEvent(value);
  const discount = value.data.total >= 200;
  log(discount ? "Desconto de 10% aplicado." : "Pedido sem desconto.");
  const result: OrderResult = {
    pedidoId: value.data.pedidoId,
    status: "processado",
    desconto: discount ? "10%" : "0%",
    totalFinal: Math.round(value.data.total * (discount ? 0.9 : 1) * 100) / 100,
  };
  log("Pedido processado com sucesso.");
  return result;
}

export function isOrderResult(v: unknown): v is OrderResult {
  return (
    record(v) &&
    typeof v.pedidoId === "string" &&
    v.status === "processado" &&
    (v.desconto === "0%" || v.desconto === "10%") &&
    typeof v.totalFinal === "number" &&
    Number.isFinite(v.totalFinal)
  );
}
