// CNPJ numérico e alfanumérico (IN RFB 2.229/2024, emissão a partir de jul/2026).
// Formato: 12 caracteres [0-9A-Z] + 2 dígitos verificadores. Valor de cada caractere = código ASCII - 48.

const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

/** Remove máscara e deixa maiúsculo: "12.ABC.345/01DE-35" -> "12ABC34501DE35" */
export function limparCnpj(valor) {
  return String(valor ?? "").toUpperCase().replace(/[^0-9A-Z]/g, "");
}

/** Aplica a máscara 00.000.000/0000-00 conforme o usuário digita. */
export function mascararCnpj(valor) {
  const c = limparCnpj(valor)
    .split("")
    // posições 0-11 aceitam letra ou número; 12-13 (DV) só número
    .filter((ch, i) => (i < 12 ? /[0-9A-Z]/.test(ch) : /[0-9]/.test(ch)))
    .join("")
    .slice(0, 14);
  let out = c.slice(0, 2);
  if (c.length > 2) out += "." + c.slice(2, 5);
  if (c.length > 5) out += "." + c.slice(5, 8);
  if (c.length > 8) out += "/" + c.slice(8, 12);
  if (c.length > 12) out += "-" + c.slice(12, 14);
  return out;
}

function calcDv(base, pesos) {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) soma += (base.charCodeAt(i) - 48) * pesos[i];
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** true se o CNPJ (com ou sem máscara) é válido. */
export function validarCnpj(valor) {
  const c = limparCnpj(valor);
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return false;
  if (/^(.)\1{13}$/.test(c)) return false; // 00000000000000, 111..., etc.
  const dv1 = calcDv(c.slice(0, 12), PESOS_DV1);
  const dv2 = calcDv(c.slice(0, 12) + dv1, PESOS_DV2);
  return c.slice(12) === `${dv1}${dv2}`;
}
