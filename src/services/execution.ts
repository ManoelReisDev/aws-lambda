import { processOrder, type OrderResult } from "../../shared/domain";
export type Mode = "simulation" | "aws";
export interface Execution {
  id: string;
  time: string;
  mode: Mode;
  event: unknown;
  result?: OrderResult;
  error?: string;
  errorStage?: "event" | "request" | "lambda";
  logs: string[];
  durationMs: number;
  requestId?: string;
  apiRequestId?: string;
}
export const pause = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
export async function execute(
  event: unknown,
  mode: Mode,
): Promise<Omit<Execution, "id" | "time">> {
  const start = performance.now();
  const logs: string[] = [];
  if (mode === "simulation") {
    try {
      const result = processOrder(event, (message) => logs.push(message));
      return {
        mode,
        event,
        result,
        logs,
        durationMs: performance.now() - start,
      };
    } catch (error) {
      return {
        mode,
        event,
        logs,
        errorStage: "lambda",
        error: error instanceof Error ? error.message : "Falha na simulação.",
        durationMs: performance.now() - start,
      };
    }
  }
  try {
    const response = await fetch("/api/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(35_000),
    });
    const data = await response.json();
    return {
      mode,
      event,
      logs: data.logs ?? [],
      durationMs: data.durationMs ?? performance.now() - start,
      requestId: data.requestId,
      apiRequestId: data.apiRequestId,
      result: response.ok ? data.result : undefined,
      errorStage: response.ok ? undefined : (data.errorStage ?? "request"),
      error: response.ok
        ? undefined
        : data.error || "Falha ao executar na AWS.",
    };
  } catch {
    return {
      mode,
      event,
      logs,
      errorStage: "request",
      durationMs: performance.now() - start,
      error:
        "Backend indisponível ou tempo limite excedido. Verifique se a API está em execução.",
    };
  }
}
