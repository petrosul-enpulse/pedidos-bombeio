import { test } from "node:test";
import assert from "node:assert/strict";
import { validarCnpj, mascararCnpj, limparCnpj } from "./cnpj.mjs";
import { dentroDoPrazo, horaLocal } from "./prazo.mjs";

test("CNPJ numérico válido e inválido", () => {
  assert.equal(validarCnpj("11.222.333/0001-81"), true);
  assert.equal(validarCnpj("11222333000181"), true);
  assert.equal(validarCnpj("11.222.333/0001-82"), false);
  assert.equal(validarCnpj("00.000.000/0000-00"), false);
  assert.equal(validarCnpj("1122233300018"), false);
});

test("CNPJ alfanumérico (exemplo oficial da Receita)", () => {
  assert.equal(validarCnpj("12.ABC.345/01DE-35"), true);
  assert.equal(validarCnpj("12.ABC.345/01DE-36"), false);
});

test("máscara", () => {
  assert.equal(mascararCnpj("11222333000181"), "11.222.333/0001-81");
  assert.equal(mascararCnpj("12abc34501de35"), "12.ABC.345/01DE-35");
  assert.equal(mascararCnpj("1122"), "11.22");
  assert.equal(mascararCnpj("11222333000AB1"), "11.222.333/000A-1"); // letra no DV é ignorada
  assert.equal(limparCnpj("12.ABC.345/01DE-35"), "12ABC34501DE35");
});

test("corte das 12h em horário de Brasília", () => {
  assert.equal(dentroDoPrazo(new Date("2026-11-17T14:59:00Z")), true);  // 11:59 BRT
  assert.equal(dentroDoPrazo(new Date("2026-11-17T15:00:00Z")), false); // 12:00 BRT
  assert.deepEqual(horaLocal(new Date("2026-11-18T02:30:00Z")), { data: "2026-11-17", hora: "23:30" });
});
