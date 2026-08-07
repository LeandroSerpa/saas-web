export function criarNavegacaoCadastroAluno(turmaId) {
  const texto = String(turmaId ?? '').trim()
  if (!/^\d+$/.test(texto)) {
    return null
  }

  const id = Number(texto)
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null
  }

  return {
    name: 'beach-tennis-cadastro-alunos',
    query: { turmaId: String(id) },
    state: { origemTurmaId: id },
  }
}
