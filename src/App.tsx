import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Braces,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Cloud,
  Code2,
  Copy,
  FlaskConical,
  History,
  Info,
  LoaderCircle,
  Play,
  Radio,
  RotateCcw,
  Terminal,
  Trash2,
} from "lucide-react";
import { Flow, type StepState } from "./components/Flow";
import {
  execute,
  pause,
  type Execution,
  type Mode,
} from "./services/execution";
const json = (v: unknown) => JSON.stringify(v, null, 2);
const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const scenarios = [
  {
    title: "Pedido simples",
    subtitle: "R$ 150,00 · sem desconto",
    order: "P-001",
    total: 150,
  },
  {
    title: "Com desconto",
    subtitle: "R$ 300,00 · desconto de 10%",
    order: "P-002",
    total: 300,
  },
  {
    title: "Pedido inválido",
    subtitle: "Sem identificador · erro esperado",
    order: "",
    total: 150,
  },
];
const initialEvent = {
  id: "evt-001",
  type: "PedidoCriado",
  source: "loja.checkout",
  data: { pedidoId: "P-001", total: 150 },
};
const waiting: StepState[] = ["waiting", "waiting", "waiting", "waiting"];
function executionStates(entry: Execution): StepState[] {
  if (!entry.error) return ["done", "done", "done", "done"];
  if (entry.errorStage === "event")
    return ["done", "error", "waiting", "waiting"];
  return [
    "done",
    "done",
    "error",
    entry.errorStage === "request" ? "waiting" : "error",
  ];
}
export default function App() {
  const [mode, setMode] = useState<Mode>("simulation");
  const [health, setHealth] = useState<{
    configured: boolean;
    region: string | null;
  } | null>(null);
  const [healthError, setHealthError] = useState(false);
  const [scenario, setScenario] = useState(0);
  const [order, setOrder] = useState("P-001");
  const [total, setTotal] = useState("150");
  const [payload, setPayload] = useState(json(initialEvent));
  const [states, setStates] = useState<StepState[]>(waiting);
  const [running, setRunning] = useState(false);
  const lock = useRef(false);
  const [history, setHistory] = useState<Execution[]>([]);
  const [selected, setSelected] = useState<Execution | null>(null);
  const [tab, setTab] = useState<"result" | "payload" | "logs">("result");
  const [editorMessage, setEditorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  async function refreshHealth() {
    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw Error();
      setHealth(await response.json());
      setHealthError(false);
    } catch {
      setHealth(null);
      setHealthError(true);
    }
  }
  useEffect(() => {
    void refreshHealth();
  }, []);
  function generate(index = scenario, newOrder = order, newTotal = total) {
    const value = Number(newTotal);
    if (!newTotal.trim() || !Number.isFinite(value) || value < 0) {
      setEditorMessage("Informe um total não negativo antes de gerar o JSON.");
      return;
    }
    setPayload(
      json({
        id: `evt-${String(index + 1).padStart(3, "0")}`,
        type: "PedidoCriado",
        source: "loja.checkout",
        data: {
          ...(newOrder.trim() ? { pedidoId: newOrder.trim() } : {}),
          total: value,
        },
      }),
    );
    setEditorMessage("JSON atualizado com os campos do formulário.");
  }
  function choose(index: number) {
    const s = scenarios[index];
    setScenario(index);
    setOrder(s.order);
    setTotal(String(s.total));
    generate(index, s.order, String(s.total));
    setStates(waiting);
  }
  async function run() {
    if (lock.current) return;
    lock.current = true;
    setRunning(true);
    setEditorMessage("");
    setSelected(null);
    setTab("result");
    let event: unknown;
    try {
      event = JSON.parse(payload);
    } catch {
      const entry: Execution = {
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
        mode,
        event: payload,
        errorStage: "event",
        error: "JSON inválido. Revise aspas, vírgulas e chaves no editor.",
        logs: [],
        durationMs: 0,
      };
      setSelected(entry);
      setHistory((h) => [entry, ...h].slice(0, 50));
      setStates(["done", "error", "waiting", "waiting"]);
      setRunning(false);
      lock.current = false;
      return;
    }
    try {
      if (mode === "simulation") {
        setStates(["processing", "waiting", "waiting", "waiting"]);
        await pause(250);
        setStates(["done", "processing", "waiting", "waiting"]);
        await pause(300);
        setStates(["done", "done", "processing", "waiting"]);
        await pause(450);
      } else setStates(["done", "done", "processing", "waiting"]);
      const outcome = await execute(event, mode);
      const entry: Execution = {
        ...outcome,
        id: crypto.randomUUID(),
        time: new Date().toISOString(),
      };
      setSelected(entry);
      setHistory((h) => [entry, ...h].slice(0, 50));
      setStates(executionStates(entry));
    } finally {
      setRunning(false);
      lock.current = false;
    }
  }
  function selectExecution(entry: Execution) {
    setSelected(entry);
    setTab("result");
    setStates(executionStates(entry));
  }
  const successCount = history.filter((h) => !h.error).length;
  const display = tab === "payload" ? selected?.event : selected?.result;
  async function copy() {
    try {
      await navigator.clipboard.writeText(
        tab === "logs" ? selected?.logs.join("\n") || "" : json(display ?? {}),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setEditorMessage(
        "Não foi possível copiar. Selecione o texto manualmente.",
      );
    }
  }
  return (
    <>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Lambda Event Lab início">
          <span className="brand-mark">λ</span>
          <span>
            Lambda <b>Event Lab</b>
            <small>ARQUITETURA ORIENTADA A EVENTOS</small>
          </span>
        </a>
        <div className="header-right">
          <span className="seminar">Laboratório interativo</span>
          <span className="local-badge">
            <i />
            Ambiente local
          </span>
        </div>
      </header>
      <main>
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              <FlaskConical size={14} /> DO CHECKOUT À FUNÇÃO
            </div>
            <h1>
              Um evento. <span>Veja o que acontece.</span>
            </h1>
            <p>
              Crie um pedido, acompanhe o fluxo e explore o processamento com
              AWS Lambda.
            </p>
          </div>
          <a
            className="docs-link"
            href="https://docs.aws.amazon.com/pt_br/lambda/latest/dg/welcome.html"
            target="_blank"
            rel="noreferrer"
          >
            Conheça o AWS Lambda <ArrowUpRight size={16} />
          </a>
        </div>
        <section className="mode-bar" aria-label="Modo de execução">
          <div className="mode-switch">
            <button
              disabled={running}
              className={mode === "simulation" ? "active" : ""}
              onClick={() => {
                setMode("simulation");
                setSelected(null);
                setStates(waiting);
              }}
            >
              <FlaskConical size={16} /> Simulação
            </button>
            <button
              disabled={running}
              className={mode === "aws" ? "active" : ""}
              onClick={() => {
                setMode("aws");
                setSelected(null);
                setStates(waiting);
                void refreshHealth();
              }}
            >
              <Cloud size={16} /> AWS real
            </button>
          </div>
          <span className="mode-description">
            {mode === "simulation"
              ? "Execução local · nenhuma chamada à AWS"
              : "Invocação síncrona · backend → Lambda → resposta"}
          </span>
          <span className={`mode-tag ${mode}`}>
            {mode === "simulation"
              ? "SEM CREDENCIAIS"
              : health?.configured
                ? "CONFIGURADA"
                : "NÃO CONFIGURADA"}
          </span>
        </section>
        {mode === "aws" && (
          <div className="aws-notice">
            <Info size={18} />
            <span>
              {health?.configured
                ? `Região ${health.region}. Configuração presente; credenciais e acesso serão verificados ao executar. Esta invocação não utiliza filas nem EventBridge.`
                : healthError
                  ? "API indisponível. Inicie o backend ou continue no modo Simulação."
                  : "Defina AWS_REGION e LAMBDA_FUNCTION_NAME no arquivo .env do backend. Você pode continuar no modo Simulação."}
            </span>
            <button onClick={() => void refreshHealth()}>Verificar</button>
          </div>
        )}
        <div className="workspace">
          <section className="panel simulator">
            <div className="panel-heading">
              <div className="heading-icon">
                <ShoppingIcon />
              </div>
              <div>
                <h2>Simulador de pedidos</h2>
                <p>O ponto de partida do seu evento</p>
              </div>
              <span className="section-number">01</span>
            </div>
            <div className="simulator-body">
              <label className="field-label">Escolha um cenário</label>
              <div className="scenarios">
                {scenarios.map((s, i) => (
                  <button
                    key={s.title}
                    disabled={running}
                    className={`scenario ${scenario === i ? "selected" : ""}`}
                    onClick={() => choose(i)}
                  >
                    <span className={`scenario-icon s${i}`}>
                      {i === 2 ? (
                        <CircleAlert size={17} />
                      ) : i === 1 ? (
                        <span>%</span>
                      ) : (
                        <Braces size={17} />
                      )}
                    </span>
                    <span>
                      <strong>{s.title}</strong>
                      <small>{s.subtitle}</small>
                    </span>
                    <span className="radio-dot">{scenario === i && <i />}</span>
                  </button>
                ))}
              </div>
              <div className="form-fields">
                <label>
                  Identificador do pedido
                  <input
                    value={order}
                    placeholder="Ex.: P-001"
                    disabled={running}
                    onChange={(e) => setOrder(e.target.value)}
                  />
                </label>
                <label>
                  Valor total (R$)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={total}
                    disabled={running}
                    onChange={(e) => setTotal(e.target.value)}
                  />
                </label>
              </div>
              <button
                className="generate"
                disabled={running}
                onClick={() => generate()}
              >
                <RotateCcw size={14} /> Gerar JSON com os campos
              </button>
              <div className="editor-heading">
                <label htmlFor="event-editor">
                  <Code2 size={14} /> Evento JSON
                </label>
                <span>EDITÁVEL</span>
              </div>
              <textarea
                id="event-editor"
                spellCheck={false}
                value={payload}
                disabled={running}
                onChange={(e) => {
                  setPayload(e.target.value);
                  setEditorMessage("");
                }}
                aria-describedby="editor-help"
              />
              <p id="editor-help" className="editor-help">
                {editorMessage ||
                  "Edite o JSON livremente. O envio usa o conteúdo do editor."}
              </p>
              <button
                className="run-button"
                onClick={() => void run()}
                disabled={running || (mode === "aws" && !health?.configured)}
              >
                {running ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Play size={17} fill="currentColor" />
                )}
                {running ? "Processando evento…" : "Enviar evento"}
                <span>{mode === "simulation" ? "SIMULAR" : "INVOCAR"}</span>
              </button>
            </div>
          </section>
          <div className="right-column">
            <section className="panel flow-panel">
              <div className="panel-heading">
                <div className="heading-icon">
                  <Radio size={19} />
                </div>
                <div>
                  <h2>Fluxo do evento</h2>
                  <p>Do produtor ao resultado, passo a passo</p>
                </div>
                <span className="section-number">02</span>
              </div>
              <div className="flow-caption">
                <span className={`live-pill ${running ? "running" : ""}`}>
                  <i />
                  {running ? "EM EXECUÇÃO" : "PRONTO PARA EXECUTAR"}
                </span>
                <span>
                  {mode === "simulation"
                    ? "Visualização simulada"
                    : "Envio e resposta confirmados"}
                </span>
              </div>
              <Flow states={states} simulation={mode === "simulation"} />
              <div className="flow-note">
                <Info size={15} />
                <span>
                  {mode === "simulation"
                    ? "As etapas são ilustrativas. A regra de negócio é executada localmente."
                    : "Durante a chamada, aguardamos a resposta. Erros de integração não confirmam execução. Etapas internas não são rastreadas."}
                </span>
              </div>
            </section>
            <section className="console-panel" aria-label="Console de execução">
              <div className="console-title">
                <Terminal size={18} />
                <h2>Console de execução</h2>
                <span
                  className={
                    selected?.error ? "console-status error" : "console-status"
                  }
                >
                  {running
                    ? "PROCESSANDO"
                    : selected
                      ? selected.error
                        ? "ERRO"
                        : "CONCLUÍDO"
                      : "AGUARDANDO"}
                </span>
              </div>
              <div
                className="console-tabs"
                role="tablist"
                aria-label="Conteúdo do console"
              >
                {[
                  { key: "result", text: "Resultado" },
                  { key: "payload", text: "Payload enviado" },
                  { key: "logs", text: "Registros" },
                ].map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key as typeof tab)}
                  >
                    {t.text}
                    {t.key === "logs" && selected && (
                      <small>{selected.logs.length}</small>
                    )}
                  </button>
                ))}
                <button
                  className="copy"
                  onClick={() => void copy()}
                  disabled={!selected}
                  aria-label="Copiar conteúdo"
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
              <div
                className="console-content"
                role="tabpanel"
                aria-live="polite"
              >
                {running ? (
                  <div className="console-empty">
                    <LoaderCircle className="spin" size={28} />
                    <strong>Aguardando o processamento</strong>
                    <p>
                      {mode === "simulation"
                        ? "Percorrendo as etapas da demonstração…"
                        : "Aguardando resposta do backend e da AWS…"}
                    </p>
                  </div>
                ) : !selected ? (
                  <div className="console-empty">
                    <span className="terminal-box">
                      <Terminal size={26} />
                    </span>
                    <strong>Seu próximo evento começa aqui.</strong>
                    <p>
                      Selecione um cenário e envie o evento
                      <br />
                      para acompanhar o resultado da execução.
                    </p>
                    <span className="empty-command">
                      <ChevronRight size={14} /> aguardando evento_
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="execution-origin">
                      {selected.mode === "simulation"
                        ? "SIMULAÇÃO LOCAL"
                        : "AWS LAMBDA · REQUEST RESPONSE"}
                      <span>
                        {new Date(selected.time).toLocaleTimeString("pt-BR")}
                      </span>
                    </div>
                    {tab === "logs" ? (
                      <>
                        <p className="log-origin">
                          {selected.mode === "simulation"
                            ? "Registros locais da regra de negócio. Não são logs do CloudWatch."
                            : "Trecho real de logs retornado por Lambda LogType: Tail (até 4 KB)."}
                        </p>
                        {selected.logs.length ? (
                          selected.logs.map((line, i) => (
                            <div className="log-line" key={i}>
                              <span>{String(i + 1).padStart(2, "0")}</span>
                              {line}
                            </div>
                          ))
                        ) : (
                          <p className="log-origin">
                            Nenhum registro retornado.
                          </p>
                        )}
                      </>
                    ) : tab === "result" && selected.error ? (
                      <div className="error-result">
                        <CircleAlert size={22} />
                        <strong>Falha no processamento</strong>
                        <p>{selected.error}</p>
                      </div>
                    ) : (
                      <pre>
                        {display === undefined
                          ? "Nenhum resultado disponível."
                          : json(display)}
                      </pre>
                    )}
                    {tab === "result" && selected.result && (
                      <div className="result-summary">
                        <CheckCircle2 size={16} />
                        <span>{selected.result.pedidoId} processado</span>
                        <b>{money(selected.result.totalFinal)}</b>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="console-footer">
                <span>
                  <i />
                  {selected
                    ? selected.mode === "simulation"
                      ? "Runtime local"
                      : "AWS Lambda"
                    : "Console pronto"}
                </span>
                <span>
                  {selected
                    ? `${selected.durationMs.toFixed(2)} ms · ${selected.mode === "simulation" ? "lógica local" : "ida e volta"}`
                    : "Nenhuma execução"}
                </span>
              </div>
              {selected?.requestId && (
                <div className="request-id">
                  Lambda RequestId: {selected.requestId}
                </div>
              )}
              {selected?.apiRequestId && (
                <div className="request-id">
                  API RequestId: {selected.apiRequestId}
                </div>
              )}
            </section>
          </div>
        </div>
        <section className="panel history-panel">
          <div className="history-heading">
            <History size={19} />
            <h2>Histórico da sessão</h2>
            <span className="count">{history.length}</span>
            <span className="history-summary">
              {successCount} sucesso · {history.length - successCount} erro
            </span>
            <button
              disabled={!history.length || running}
              onClick={() => {
                setHistory([]);
                setSelected(null);
                setStates(waiting);
              }}
            >
              <Trash2 size={14} /> Limpar
            </button>
          </div>
          {history.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Evento / pedido</th>
                    <th>Modo</th>
                    <th>Horário</th>
                    <th>Duração</th>
                    <th>Status</th>
                    <th>
                      <span className="sr-only">Detalhes</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry) => (
                    <tr
                      key={entry.id}
                      className={selected?.id === entry.id ? "chosen" : ""}
                    >
                      <td>
                        <strong>PedidoCriado</strong>
                        <small>{entry.result?.pedidoId || "Ver payload"}</small>
                      </td>
                      <td>
                        {entry.mode === "simulation" ? "Simulação" : "AWS real"}
                      </td>
                      <td>
                        {new Date(entry.time).toLocaleTimeString("pt-BR")}
                      </td>
                      <td>{entry.durationMs.toFixed(2)} ms</td>
                      <td>
                        <span
                          className={`table-status ${entry.error ? "failed" : ""}`}
                        >
                          {entry.error ? "Erro" : "Sucesso"}
                        </span>
                      </td>
                      <td>
                        <button
                          disabled={running}
                          aria-label={`Ver execução das ${new Date(entry.time).toLocaleTimeString("pt-BR")}`}
                          onClick={() => selectExecution(entry)}
                        >
                          Ver <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="history-empty">
              <ArrowDown size={16} />
              <span>
                As execuções aparecerão aqui. O histórico é mantido nesta sessão
                (até 50 eventos).
              </span>
            </div>
          )}
        </section>
        <footer>
          <span>
            <span className="footer-lambda">λ</span> AWS Lambda Event Lab <i />{" "}
            Aprenda observando os eventos.
          </span>
          <span>
            Produtor <ChevronRight size={12} /> Evento{" "}
            <ChevronRight size={12} /> Consumidor
          </span>
        </footer>
      </main>
    </>
  );
}
function ShoppingIcon() {
  return <Braces size={19} />;
}
