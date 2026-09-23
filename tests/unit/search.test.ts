import { describe, it, expect } from 'vitest'
import { normalizeSearchText, matchesSearch } from '~~/shared/utils/search'
import { buildSearchPattern, escapeLikePattern } from '~~/server/utils/search'

describe('normalizeSearchText', () => {
  it('quita acentos y pasa a minúsculas', () => {
    expect(normalizeSearchText('Víveres')).toBe('viveres')
    expect(normalizeSearchText('VÍVERES')).toBe('viveres')
    expect(normalizeSearchText('Electricísta')).toBe('electricista')
  })

  it('normaliza ñ, ü y ç', () => {
    expect(normalizeSearchText('Niñera')).toBe('ninera')
    expect(normalizeSearchText('Pingüino')).toBe('pinguino')
    expect(normalizeSearchText('Façade')).toBe('facade')
  })

  it('trata igual el texto precompuesto y el descompuesto', () => {
    expect(normalizeSearchText('é')).toBe(normalizeSearchText('é'))
  })

  it('deja intacto el texto sin acentos', () => {
    expect(normalizeSearchText('cisterna 24h')).toBe('cisterna 24h')
  })
})

describe('matchesSearch', () => {
  it('encuentra coincidencias ignorando acentos y mayúsculas', () => {
    expect(matchesSearch('Víveres y abastos', 'viveres')).toBe(true)
    expect(matchesSearch('Electricista', 'ELECTRICÍSTA')).toBe(true)
    expect(matchesSearch('Camión cisterna', 'cisterna')).toBe(true)
  })

  it('devuelve false si no hay coincidencia', () => {
    expect(matchesSearch('Plomero', 'elec')).toBe(false)
  })

  it('una consulta vacía coincide con todo', () => {
    expect(matchesSearch('Plomero', '   ')).toBe(true)
  })
})

describe('buildSearchPattern', () => {
  it('normaliza y envuelve en comodines', () => {
    expect(buildSearchPattern('  Víveres ')).toBe('%viveres%')
  })

  it('escapa los comodines de LIKE', () => {
    expect(escapeLikePattern('50%_a\\b')).toBe('50\\%\\_a\\\\b')
    expect(buildSearchPattern('100%')).toBe('%100\\%%')
  })
})
