import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./ClienteForm.vue', import.meta.url), 'utf8')

describe('ClienteForm textos do cadastro de alunos', () => {
  it('mantem os rótulos e ajudas em portugues correto sem mojibake', () => {
    assert.match(source, /Observação/)
    assert.match(source, /Nível\/Categoria/)
    assert.match(source, /Participa de competição/)
    assert.match(source, /Frequência semanal/)
    assert.match(source, /Observações esportivas/)
    assert.match(source, /prefere aulas pela manhã/)
    assert.match(source, /participar da rotina esportiva/)
    assert.doesNotMatch(source, /Ã[£§¡©ªóúí]|Â|�/)
  })

  it('preserva os campos Beach Tennis usados no contrato de API', () => {
    assert.match(source, /v-model="cliente\.observacoesBeachTennis"/)
    assert.match(source, /cliente\.observacao/)
  })
})
