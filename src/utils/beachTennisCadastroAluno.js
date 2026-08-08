function normalizarIdInteiroPositivo(valor) {
  const texto = String(valor ?? '').trim()
  if (!/^\d+$/.test(texto)) {
    return null
  }

  const id = Number(texto)
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null
  }

  return id
}

export function criarNavegacaoCadastroAluno(turmaId) {
  const id = normalizarIdInteiroPositivo(turmaId)
  if (!id) {
    return null
  }

  return {
    path: '/beach-tennis/cadastro-alunos',
    query: { turmaId: String(id) },
    state: { origemTurmaId: id },
  }
}

export function criarNavegacaoRetornoTurmaAlunos(turmaId, novoAlunoId, novoAlunoCriado) {
  const turma = normalizarIdInteiroPositivo(turmaId)
  const aluno = normalizarIdInteiroPositivo(novoAlunoId)

  if (!turma || !aluno || !novoAlunoCriado || typeof novoAlunoCriado !== 'object') {
    return null
  }

  return {
    path: '/beach-tennis/alunos',
    query: { turmaId: String(turma) },
    state: {
      origemTurmaId: turma,
      novoAlunoId: aluno,
      novoAlunoCriado,
    },
  }
}
