import { processOrder } from "../shared/domain";
export async function handler(event: unknown) {
  console.info("Evento recebido", JSON.stringify(event));
  try {
    return processOrder(event, (message) => console.info(message));
  } catch (error) {
    console.error(error);
    throw error;
  }
}
