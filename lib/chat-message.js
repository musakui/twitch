const actRegex = /^\x01ACTION (?<t>.+)\x01$/

const nul = (length) => Array.from({ length }, () => null)

const spliceArgs = (indexes, item) => {
  const [start, end] = indexes.split('-').map((d) => parseInt(d))
  return [start, 1 + end - start, ...nul(end - start), item]
}

const processSplices = (text, splices) => {
  if (!splices.length) return [text]

  const fragments = ['']
  const chars = [...text]
  for (const s of splices) {
    s[s.length - 1].text = chars.splice(...s).join('')
  }

  for (const c of chars) {
    if (c === null) continue
    if (c.text) {
      fragments.push(c, '')
    } else if (typeof c === 'string') {
      fragments.push(`${fragments.pop()}${c}`)
    }
  }

  return fragments.filter((i) => i)
}

function * parseEmotes (emotes) {
  if (!emotes) return
  for (const em of emotes.split('/')) {
    const [emote, ixs] = em.split(':')
    for (const ix of ixs.split(',')) yield spliceArgs(ix, { emote })
  }
}

function * parseFlags (flags) {
  if (!flags) return
  for (const flag of flags.split(',')) {
    const [ix, scores] = flag.split(':')
    if (scores) {
      yield spliceArgs(ix, { scores })
    }
  }
}

export const createCheerProcessor = (cheermotes) => {
  const cm = cheermotes.map(({ prefix, tiers }) => [
    new RegExp(`\\b${prefix}(\\d+)\\b`, 'ig'),
    tiers.sort((a, b) => b.min_bits - a.min_bits),
  ])

  function * parseBits (text) {
    for (const [regex, tiers] of cm) {
      for (const m of text.matchAll(regex)) {
        const bits = parseInt(m[1])
        if (!bits) continue
        const c = m[0].length
        const { color, images } = tiers.find((t) => bits >= t.min_bits)
        yield [m.index, c, ...nul(c - 1), { bits, color, images }]
      }
    }
  }

  return (fragments) => fragments.flatMap((i) => {
    return i.text
      ? [i]
      : processSplices(i, [...parseBits(i)])
  })
}

export const getFragments = ({ text, tags }) => {
  if (!text) return { fragments: [] }

  const action = text[0] === '\x01'
  const pt = action ? text.match(actRegex).groups.t : text
  const fragments = processSplices(pt, [
    ...parseFlags(tags?.flags),
    ...parseEmotes(tags?.emotes),
  ])

  return {
    action,
    fragments,
  }
}
