export const FUSO: string;
export function horaLocal(instante?: Date, fuso?: string): { data: string; hora: string };
export function dentroDoPrazo(instante?: Date, corte?: string, fuso?: string): boolean;
