import {
  ArrowRight,
  Braces,
  Check,
  CircleAlert,
  ShoppingBag,
} from "lucide-react";
export type StepState = "waiting" | "processing" | "done" | "error";
export function Flow({
  states,
  simulation,
}: {
  states: StepState[];
  simulation: boolean;
}) {
  const labels = ["Aguardando", "Processando", "Concluído", "Erro"];
  const mapping: Record<StepState, number> = {
    waiting: 0,
    processing: 1,
    done: 2,
    error: 3,
  };
  return (
    <div className="flow">
      {[
        { title: "Checkout", label: "Produtor", icon: <ShoppingBag /> },
        { title: "PedidoCriado", label: "Evento JSON", icon: <Braces /> },
        {
          title: "AWS Lambda",
          label: simulation ? "Execução simulada" : "Invocação síncrona",
          icon: <span className="lambda-symbol">λ</span>,
        },
        { title: "Resultado", label: "Resposta", icon: <Check /> },
      ].map((step, i) => (
        <div className="flow-fragment" key={step.title}>
          <div className={`flow-step ${states[i]}`}>
            <div className="flow-icon">
              {states[i] === "error" ? <CircleAlert /> : step.icon}
            </div>
            <span className="flow-kind">{step.label}</span>
            <strong>{step.title}</strong>
            <span className="step-state">
              <i />
              {labels[mapping[states[i]]]}
            </span>
          </div>
          {i < 3 && (
            <ArrowRight
              className={`flow-arrow ${states[i] === "done" ? "passed" : ""}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
