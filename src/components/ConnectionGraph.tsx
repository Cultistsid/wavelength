'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useWavelengthStore } from '@/lib/store';
import { strengthColor } from '@/lib/colors';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  color: string;
  activity: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  strength: number;
  topic: string;
}

// A sine wave drawn between two points: amplitude grows with strength, phase drifts with time.
function wavePath(ax: number, ay: number, bx: number, by: number, strength: number, t: number): string {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const amp = 3 + strength * 9;
  const cycles = Math.max(1, Math.round(len / 60));
  const steps = 32;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const fade = Math.sin(p * Math.PI); // taper at both ends so waves meet nodes cleanly
    const off = Math.sin(p * cycles * Math.PI * 2 - t * (1 + strength)) * amp * fade;
    const x = ax + dx * p + nx * off;
    const y = ay + dy * p + ny * off;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d;
}

export function ConnectionGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const users = useWavelengthStore((s) => s.users);
  const connections = useWavelengthStore((s) => s.connections);
  const messages = useWavelengthStore((s) => s.messages);
  const lastAnalysisAt = useWavelengthStore((s) => s.lastAnalysisAt);
  const simRef = useRef<d3.Simulation<Node, Link> | null>(null);
  const nodesRef = useRef<Map<string, Node>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const { width, height } = svgEl.getBoundingClientRect();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const counts = new Map<string, number>();
    for (const m of messages) counts.set(m.userId, (counts.get(m.userId) ?? 0) + 1);

    // Keep node positions across re-renders so the graph never jumps.
    const nodes: Node[] = users.map((u) => {
      const prev = nodesRef.current.get(u.id);
      const node: Node = prev ?? {
        id: u.id,
        name: u.name,
        color: u.color,
        activity: 0,
        x: width / 2 + (Math.random() - 0.5) * 80,
        y: height / 2 + (Math.random() - 0.5) * 80,
      };
      node.activity = counts.get(u.id) ?? 0;
      nodesRef.current.set(u.id, node);
      return node;
    });
    const byName = new Map(users.map((u) => [u.name, u.id]));
    const links: Link[] = connections
      .map((c) => ({
        source: byName.get(c.source) ?? '',
        target: byName.get(c.target) ?? '',
        strength: c.strength,
        topic: c.topics[0] ?? '',
      }))
      .filter((l) => l.source && l.target);

    svg.selectAll('*').remove();
    const defs = svg.append('defs');
    // Two-pass bloom: tight core glow plus a wide soft halo.
    const glow = defs.append('filter').attr('id', 'wl-glow').attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%');
    glow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 3).attr('result', 'b1');
    glow.append('feGaussianBlur').attr('in', 'SourceGraphic').attr('stdDeviation', 10).attr('result', 'b2');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'b2');
    merge.append('feMergeNode').attr('in', 'b1');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    svg.append('g').attr('class', 'pulse-layer');
    const linkG = svg.append('g');
    const nodeG = svg.append('g');

    const linkPath = linkG
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', (d) => strengthColor(d.strength))
      .attr('stroke-width', (d) => 1.5 + d.strength * 3)
      .attr('stroke-linecap', 'round')
      .attr('opacity', 0)
      .attr('filter', 'url(#wl-glow)');
    linkPath.transition().duration(600).attr('opacity', 0.9);

    const linkLabel = linkG
      .selectAll('text')
      .data(links.filter((l) => l.topic))
      .join('text')
      .text((d) => d.topic)
      .attr('text-anchor', 'middle')
      .attr('fill', (d) => strengthColor(d.strength))
      .attr('font-size', 11)
      .attr('font-weight', 500)
      .attr('opacity', 0)
      .style('pointer-events', 'none');
    linkLabel.transition().delay(300).duration(500).attr('opacity', 0.9);

    const radius = (d: Node) => 20 + Math.min(14, d.activity * 2);

    // The SVG is rebuilt on every update; only nodes seen for the first time get the pop-in.
    const isNew = (d: Node) => !seenRef.current.has(d.id);
    const node = nodeG
      .selectAll<SVGGElement, Node>('g')
      .data(nodes, (d) => d.id)
      .join((enter) => {
        const g = enter.append('g').style('cursor', 'grab');
        g.append('circle').attr('class', 'halo').attr('fill', (d) => d.color).attr('opacity', 0.18).attr('r', (d) => (isNew(d) ? 0 : radius(d) + 10));
        g.append('circle').attr('class', 'core').attr('fill', (d) => d.color).attr('stroke', 'rgba(255,255,255,0.85)').attr('stroke-width', 2).attr('r', (d) => (isNew(d) ? 0 : radius(d)));
        g.append('text')
          .text((d) => d.name)
          .attr('text-anchor', 'middle')
          .attr('fill', '#F3F5FA')
          .attr('font-size', 11)
          .attr('font-family', 'var(--font-pixel), monospace')
          .attr('letter-spacing', '0.08em')
          .attr('opacity', (d) => (isNew(d) ? 0 : 1))
          .style('pointer-events', 'none');
        return g;
      });

    node.select<SVGCircleElement>('.halo').transition().duration(500).ease(d3.easeBackOut).attr('r', (d) => radius(d) + 10);
    node.select<SVGCircleElement>('.core').transition().duration(500).ease(d3.easeBackOut).attr('r', radius);
    node.select<SVGTextElement>('text').attr('dy', (d) => radius(d) + 16).transition().duration(400).attr('opacity', 1);
    for (const n of nodes) seenRef.current.add(n.id);

    const sim = d3
      .forceSimulation<Node>(nodes)
      .force('link', d3.forceLink<Node, Link>(links).id((d) => d.id).distance((d) => 220 - d.strength * 90).strength((d) => 0.2 + d.strength * 0.5))
      .force('charge', d3.forceManyBody().strength(-420))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force('collide', d3.forceCollide<Node>().radius((d) => radius(d) + 28))
      .alphaDecay(0.04);
    simRef.current = sim;

    node.call(
      d3
        .drag<SVGGElement, Node>()
        .on('start', (ev, d) => {
          sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (ev, d) => {
          d.fx = ev.x;
          d.fy = ev.y;
        })
        .on('end', (ev, d) => {
          sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
    );

    let t = 0;
    let raf = 0;
    const draw = () => {
      t += reduceMotion ? 0 : 0.08;
      const pad = 40;
      for (const n of nodes) {
        n.x = Math.max(pad, Math.min(width - pad, n.x ?? 0));
        n.y = Math.max(pad, Math.min(height - pad, n.y ?? 0));
      }
      linkPath.attr('d', (d) => {
        const s = d.source as Node;
        const tg = d.target as Node;
        return wavePath(s.x!, s.y!, tg.x!, tg.y!, d.strength, t);
      });
      linkLabel
        .attr('x', (d) => ((d.source as Node).x! + (d.target as Node).x!) / 2)
        .attr('y', (d) => ((d.source as Node).y! + (d.target as Node).y!) / 2 - 8 - d.strength * 10);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      sim.stop();
    };
  }, [users, connections, messages]);

  // Analysis sweep: a ring expands from the centre and the links flash white before settling.
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !lastAnalysisAt) return;
    const svg = d3.select(svgEl);
    const { width, height } = svgEl.getBoundingClientRect();
    const layer = svg.select('.pulse-layer');
    for (const [delay, color] of [[0, '#f2e94e'], [140, '#2dd4bf']] as const) {
      layer
        .append('circle')
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', 0)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('opacity', 0.9)
        .attr('filter', 'url(#wl-glow)')
        .transition()
        .delay(delay)
        .duration(1100)
        .ease(d3.easeCubicOut)
        .attr('r', Math.hypot(width, height) / 2)
        .attr('opacity', 0)
        .remove();
    }
    svg
      .selectAll<SVGPathElement, Link>('path')
      .attr('stroke', '#ffffff')
      .transition()
      .delay(200)
      .duration(900)
      .attr('stroke', (d) => strengthColor(d.strength));
  }, [lastAnalysisAt]);

  return (
    <div className="relative w-full h-full min-h-[240px] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(242,233,78,0.06),transparent_60%)]" />
      <svg ref={svgRef} className="relative w-full h-full" />
      {users.length > 0 && connections.length === 0 && (
        <p className="absolute bottom-3 inset-x-0 text-center text-xs text-[var(--muted)]">
          Connections appear once the group starts talking.
        </p>
      )}
    </div>
  );
}
