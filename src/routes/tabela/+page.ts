import type { TableData } from '$lib/types';

export async function load({ fetch }) {
  const response = await fetch('/table/kiepscy_tabela.json');
  const data: TableData = await response.json();
  return { tableData: data };
} 