import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { EvaluationResponse } from '../types/business'

type Node = { id: string; label: string; type: 'Derived' | 'Rule' | 'Obligation'; x: number; y: number }
type Link = { source: string; target: string }

function wrapText(
  selection: d3.Selection<SVGTextElement, any, any, any>,
  maxWidth: number,
  maxLines = 3
) {
  selection.each(function () {
    const textSel = d3.select<SVGTextElement, any>(this)
    const words = (textSel.text() || '').split(/\s+/).filter(Boolean)

    textSel.text(null)
    let line: string[] = []
    let lineNumber = 0
    const lineHeight = 1.1
    const x = Number(textSel.attr('x') || 0)
    const y = Number(textSel.attr('y') || 0)

    let tspan = textSel.append('tspan').attr('x', x).attr('y', y).attr('dy', '0em')

    for (let i = 0; i < words.length; i++) {
      line.push(words[i])
      tspan.text(line.join(' '))
      const tooWide = (tspan.node() as SVGTextContentElement).getComputedTextLength() > maxWidth
      if (tooWide) {
        line.pop()
        tspan.text(line.join(' '))
        line = [words[i]]
        lineNumber += 1

        if (lineNumber >= maxLines - 1) {
          textSel.append('tspan')
            .attr('x', x).attr('y', y)
            .attr('dy', `${lineNumber * lineHeight}em`)
            .text(words.slice(i).join(' ') + '…')
          break
        } else {
          tspan = textSel.append('tspan')
            .attr('x', x).attr('y', y)
            .attr('dy', `${lineNumber * lineHeight}em`)
            .text(words[i])
        }
      }
    }
  })
}

const ruleTitle = (h: any) => h?.title ?? h?.ruleId ?? ''
const obligationLabel = (o: any) =>
  (o?.ruleTitle && String(o.ruleTitle).length ? o.ruleTitle : undefined) ??
  o?.title ?? o?.action ?? o?.ruleId ?? ''

export default function VizGraph({ result }: { result: EvaluationResponse | null }) {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const svg = d3.select(el)
    svg.selectAll('*').remove()

    const parent = el.parentElement!
    const width = parent.clientWidth || 900
    const height = 420
    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('preserveAspectRatio', 'xMidYMid meet')

    // ---- symmetric margins and an inner group ----
    const margin = { top: 56, right: 36, bottom: 24, left: 36 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    // Empty state
    if (!result) {
      g.append('text').attr('x', 8).attr('y', 16).attr('fill', '#6b7280').text('No data')
      return
    }

    // ---------- Build columns ----------
    const ruleTitleById = new Map<string, string>()
    ;(result.hits || []).forEach(h => ruleTitleById.set(h.ruleId, ruleTitle(h)))
    const ruleIds = Array.from(ruleTitleById.keys()).sort()

    const obligationsByRule = new Map<string, { id: string; label: string }[]>()
    for (const o of (result.obligations || [])) {
      const arr = obligationsByRule.get(o.ruleId) || []
      const obId = `${o.ruleId}::ob:${(o as any).action ? String((o as any).action).slice(0, 32) : 'x'}`
      const obLabel = obligationLabel(o)
      arr.push({ id: obId, label: obLabel })
      obligationsByRule.set(o.ruleId, arr)
    }

    const derivedEntries = Object.entries((result as any).derived || {}).sort((a, b) => a[0].localeCompare(b[0]))
    const DERIVED_LIMIT = 20
    const derivedKeys = derivedEntries.slice(0, DERIVED_LIMIT).map(([k]) => k)

    // Column X positions INSIDE the inner group (0..innerW)
    const colX = [0, 0.5, 1].map(t => t * innerW)

    // Y helpers
    const space = (count: number) => {
      const top = 12, bottom = innerH - 12
      const span = Math.max(1, count - 1)
      return (i: number) => (count === 1 ? (top + bottom) / 2 : top + (i * (bottom - top)) / span)
    }
    const yForDerived = space(derivedKeys.length)
    const yForRules   = space(ruleIds.length)

    const nodes: Node[] = []
    const links: Link[] = []

    // Derived
    derivedKeys.forEach((k, i) => {
      nodes.push({
        id: `derived:${k}`,
        label: k.replace(/_/g, ' ').replace(/\b([a-z])/g, s => s.toUpperCase()),
        type: 'Derived',
        x: colX[0],
        y: yForDerived(i),
      })
    })

    // Rules + Obligations
    ruleIds.forEach((rid, i) => {
      const rY = yForRules(i)
      nodes.push({ id: rid, label: ruleTitleById.get(rid) || rid, type: 'Rule', x: colX[1], y: rY })

      const obs = (obligationsByRule.get(rid) || []).slice(0, 10)
      const gap = 20
      obs.forEach((ob, j) => {
        nodes.push({
          id: ob.id, label: ob.label, type: 'Obligation',
          x: colX[2],
          y: rY + (j - (obs.length - 1) / 2) * gap,
        })
        links.push({ source: rid, target: ob.id })
      })
    })

    // Derived → Rule links
    if (ruleIds.length > 0) {
      derivedKeys.forEach((k, i) => {
        links.push({ source: `derived:${k}`, target: ruleIds[i % ruleIds.length] })
      })
    }

    // ---------- Render ----------
    const idToNode = new Map(nodes.map(n => [n.id, n]))
    const path = (s: Node, t: Node) => {
      const mx = (s.x + t.x) / 2
      return `M${s.x},${s.y} C${mx},${s.y} ${mx},${t.y} ${t.x},${t.y}`
    }

    // links (no magic insets; perfectly symmetric)
    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1.2)
      .selectAll('path')
      .data(links)
      .enter()
      .append('path')
      .attr('d', d => {
        const s = idToNode.get(d.source)!
        const t = idToNode.get(d.target)!
        return path(s, t)
      })

    // nodes
    const node = g.append('g').selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x},${d.y})`)

    const color = (t: Node['type']) => (t === 'Rule' ? '#1aa2ff' : t === 'Obligation' ? '#10b981' : '#fb923c')

    node.append('circle')
      .attr('r', 9)
      .attr('fill', d => color(d.type))
      .attr('stroke', '#111827')
      .attr('stroke-width', 0.5)

    const label = node.append('text')
      .text(d => d.label)
      .attr('x', 12)
      .attr('y', 4)
      .attr('font-size', 10)
      .attr('fill', '#374151')

    label.each(function(d: any) {
      const maxW = d.type === 'Obligation' ? 180 : d.type === 'Rule' ? 160 : 140
      wrapText(d3.select(this) as any, maxW, 3)
    })

    node.append('title').text(d => d.label)

    // headers (aligned to columns, symmetric)
    const header = (x: number, txt: string, anchor: 'start'|'middle'|'end') =>
      g.append('text')
        .attr('x', x)
        .attr('y', -20)
        .attr('text-anchor', anchor)
        .attr('font-size', 12)
        .attr('fill', '#6b7280')
        .text(txt)

    header(colX[0], 'Derived facts', 'start')
    header(colX[1], 'Rules',         'middle')
    header(colX[2], 'Obligations',   'end')
  }, [result])

  return (
    <div className="section-card">
      <div className="section-title mb-2">Rules → Obligations → Derived (diagram)</div>
      <svg ref={ref} className="w-full h-[420px]" />
    </div>
  )
}
