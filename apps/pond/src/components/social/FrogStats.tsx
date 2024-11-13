import React, { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma";
import ReactModal from "react-modal";
import { useLocation } from "wouter";
import forceAtlas2 from "graphology-layout-forceatlas2";
import circular from "graphology-layout/circular";
import { trpc } from "../../trpc";
import { FROG_LEVELS, frogScoreToLevel } from "../shared/Frog";

function FrogStats() {
  const { data: frogConnections } = trpc.admin.dumpFrogConnections.useQuery(
    undefined,
    {
      retry: false,
    }
  );

  const [_, setLocation] = useLocation();
  const graphRef = useRef(new Graph());
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma>();

  useEffect(() => {
    if (!frogConnections) return;
    if (!containerRef.current) return;
    if (!sigmaRef.current) {
      sigmaRef.current = new Sigma(graphRef.current, containerRef.current);
    }

    const graph = graphRef.current;
    graph.clear();

    const nodes = frogConnections.reduce<Record<string, number>>(
      (acc, curr) => {
        acc[curr.party1] = (acc[curr.party1] ?? 0) + 1;
        acc[curr.party2] = (acc[curr.party2] ?? 0) + 1;
        return acc;
      },
      {}
    );

    Object.entries(nodes).forEach(([party, count]) => {
      graph.addNode(party, {
        label: party,
        size: count,
        color: frogScoreToLevel(count).curr.className.split("-")[1] ?? "black",
        x: Math.random(),
        y: Math.random(),
      });
    });

    frogConnections.forEach(({ party1, party2 }) => {
      graph.addEdge(party1, party2, {
        size: 1,
      });
    });

    circular.assign(graph);
    const settings = forceAtlas2.inferSettings(graph);
    forceAtlas2.assign(graph, { settings, iterations: 600 });

    sigmaRef.current.refresh();
  }, [frogConnections]);

  return (
    <ReactModal
      isOpen
      onRequestClose={() => {
        setLocation("/");
      }}
      portalClassName="h-100vh w-100vw"
    >
      <div className="h-full w-full" ref={containerRef} />
    </ReactModal>
  );
}

export default FrogStats;
