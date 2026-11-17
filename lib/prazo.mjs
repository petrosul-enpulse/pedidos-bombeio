// Regras de horário do BPMN (base Paulínia): pedido do cliente até 12h (horário de Brasília).
export const FUSO = "America/Sao_Paulo";

/** Retorna data (YYYY-MM-DD) e hora (HH:MM) locais de Brasília para um instante. */
export function horaLocal(instante = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(instante).map((x) => [x.type, x.value])
  );
  return { data: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

/** true se o envio aconteceu antes do horário de corte (padrão 12:00). */
export function dentroDoPrazo(instante = new Date(), corte = "12:00") {
  return horaLocal(instante).hora < corte;
}
