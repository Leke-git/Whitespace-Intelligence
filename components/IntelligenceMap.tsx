'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize2, Minimize2, Info, AlertTriangle } from 'lucide-react';

interface IntelligenceMapProps {
  lgas: any[];
  onLgaSelect: (lga: any) => void;
  selectedLgaId?: string;
  mapMode?: 'gap' | 'funding';
}

export default function IntelligenceMap({ lgas, onLgaSelect, selectedLgaId, mapMode = 'gap' }: IntelligenceMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredLga, setHoveredLga] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous

    const g = svg.append('g');

    // Projection for Nigeria
    const projection = d3.geoMercator()
      .center([8.6753, 9.0820]) // Center of Nigeria
      .scale(width * 3.5)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Color scale for Gap Score (0 to 1)
    const gapColorScale = d3.scaleThreshold<number, string>()
      .domain([0.3, 0.6, 0.8, 0.9])
      .range(['#f1f5f9', '#dcfce7', '#fef08a', '#fed7aa', '#fee2e2']);

    // Color scale for Funding (USD)
    const fundingColorScale = d3.scaleThreshold<number, string>()
      .domain([10000, 100000, 500000, 1000000])
      .range(['#f1f5f9', '#dbeafe', '#60a5fa', '#2563eb', '#1e3a8a']);

    const colorScale = mapMode === 'gap' ? gapColorScale : fundingColorScale;
    const dataKey = mapMode === 'gap' ? 'gap_score' : 'total_funding_usd';

    // Fetch Nigeria TopoJSON
    fetch('https://raw.githubusercontent.com/deldersveld/topojson/master/countries/nigeria/nigeria-lga.json')
      .then(res => res.json())
      .then(topology => {
        const geoData = topojson.feature(topology, topology.objects.NGA_adm2) as any;

        // Map our database LGAs to the GeoJSON features
        // Note: In a real app, we'd have a mapping table for names
        const features = geoData.features.map((f: any) => {
          const lgaMatch = lgas.find(l => 
            l.name.toLowerCase() === f.properties.NAME_2.toLowerCase()
          );
          return {
            ...f,
            properties: {
              ...f.properties,
              gap_score: lgaMatch?.gap_score || 0,
              total_funding_usd: lgaMatch?.total_funding_usd || 0,
              db_data: lgaMatch
            }
          };
        });

        // Draw LGAs
        g.selectAll('path')
          .data(features)
          .enter()
          .append('path')
          .attr('d', (d: any) => path(d))
          .attr('fill', (d: any) => colorScale(d.properties[dataKey]))
          .attr('stroke', '#1e293b')
          .attr('stroke-width', 0.5)
          .attr('class', 'lga-path cursor-pointer transition-colors duration-200')
          .on('mouseenter', (event, d: any) => {
            d3.select(event.currentTarget)
              .attr('fill', '#0f172a')
              .attr('stroke-width', 1.5);
            setHoveredLga(d.properties);
          })
          .on('mouseleave', (event, d: any) => {
            d3.select(event.currentTarget)
              .attr('fill', colorScale(d.properties[dataKey]))
              .attr('stroke-width', 0.5);
            setHoveredLga(null);
          })
          .on('click', (event, d: any) => {
            if (d.properties.db_data) {
              onLgaSelect(d.properties.db_data);
            }
          });

        // Zoom behavior
        const zoom = d3.zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 8])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
            setZoomLevel(event.transform.k);
          });

        svg.call(zoom);
      });

  }, [lgas, onLgaSelect, mapMode]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#E4E3E0] overflow-hidden border border-[#141414]">
      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#141414 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

      <svg ref={svgRef} className="w-full h-full" />

      {/* UI Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <div className="bg-white border border-[#141414] p-2 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="text-[10px] font-mono uppercase tracking-tighter text-slate-500 mb-1">Zoom Level</div>
          <div className="text-sm font-mono font-bold">{zoomLevel.toFixed(1)}x</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white border border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
        <div className="text-[10px] font-mono uppercase tracking-tighter text-slate-500 mb-2">
          {mapMode === 'gap' ? 'Gap Score Intensity' : 'Donor Funding Density'}
        </div>
        <div className="flex items-center gap-1">
          {mapMode === 'gap' ? (
            [0, 0.3, 0.6, 0.8, 1].map((val, i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className="w-8 h-2 border border-[#141414]" 
                  style={{ backgroundColor: ['#f1f5f9', '#dcfce7', '#fef08a', '#fed7aa', '#fee2e2'][i] }} 
                />
                <span className="text-[8px] font-mono mt-1">{val}</span>
              </div>
            ))
          ) : (
            ['$0', '$10k', '$100k', '$500k', '$1M+'].map((val, i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className="w-8 h-2 border border-[#141414]" 
                  style={{ backgroundColor: ['#f1f5f9', '#dbeafe', '#60a5fa', '#2563eb', '#1e3a8a'][i] }} 
                />
                <span className="text-[8px] font-mono mt-1">{val}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Hover Info */}
      <AnimatePresence>
        {hoveredLga && (
          <motion.div
            key="intelligence-hover-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-4 right-4 w-64 bg-[#141414] text-[#E4E3E0] border border-[#E4E3E0] shadow-xl pointer-events-none overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={hoveredLga.NAME_2}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-serif italic text-lg">{hoveredLga.NAME_2}</h3>
                  <span className="text-[10px] font-mono bg-emerald-500 text-black px-1 uppercase">{hoveredLga.NAME_1}</span>
                </div>
                <div className="space-y-3">
                  {mapMode === 'gap' ? (
                    <>
                      <div>
                        <div className="text-[10px] font-mono uppercase opacity-50">Gap Score</div>
                        <div className="text-2xl font-mono tracking-tighter">{(hoveredLga.gap_score * 100).toFixed(1)}%</div>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${hoveredLga.gap_score * 100}%` }} 
                        />
                      </div>
                      {hoveredLga.gap_score > 0.8 && (
                        <div className="flex items-center gap-2 text-red-400 text-xs font-mono animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          CRITICAL GAP DETECTED
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-[10px] font-mono uppercase opacity-50">Donor Funding</div>
                        <div className="text-2xl font-mono tracking-tighter">
                          ${(hoveredLga.total_funding_usd || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${Math.min(100, (hoveredLga.total_funding_usd / 1000000) * 100)}%` }} 
                        />
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Technical Metadata */}
      <div className="absolute bottom-4 right-4 text-[9px] font-mono text-slate-500 text-right pointer-events-none">
        <div>PROJECTION: MERCATOR</div>
        <div>DATA_SOURCE: TOPJSON_NGA_ADM2</div>
        <div>COORD_SYSTEM: WGS84</div>
        <div>RENDER_ENGINE: D3_SVG_V7</div>
      </div>
    </div>
  );
}
