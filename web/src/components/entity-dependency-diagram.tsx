"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import type { EChartsOption } from "echarts";
import { EChart } from "@/components/charts/echart";
import { useTheme } from "@/providers/theme-provider";

interface EntityNode {
  id: string;
  key: string;
  title: string;
  titleAr: string | null;
  formula: string | null;
  entityType: { code: string; name: string; nameAr: string | null };
  dependencies: EntityNode[];
}

interface EntityDependencyDiagramProps {
  tree: EntityNode | null;
  locale: string;
  loading?: boolean;
}

export function EntityDependencyDiagram({ tree, locale, loading }: EntityDependencyDiagramProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const graph = useMemo(() => {
    if (!tree) return null;

    const nodesById = new Map<string, EntityNode>();
    const links: Array<{ source: string; target: string }> = [];
    const edgeSet = new Set<string>();

    const walk = (node: EntityNode) => {
      nodesById.set(node.id, node);
      for (const dep of node.dependencies ?? []) {
        nodesById.set(dep.id, dep);
        const edgeKey = `${node.id}=>${dep.id}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          links.push({ source: node.id, target: dep.id });
        }
        walk(dep);
      }
    };

    walk(tree);

    const categories = Array.from(
      new Set(
        Array.from(nodesById.values()).map((n) => String(n.entityType?.code ?? ""))
      )
    ).map((name) => ({ name }));
    const categoryIndex = new Map<string, number>();
    categories.forEach((c, i) => categoryIndex.set(c.name, i));

    const nodes = Array.from(nodesById.values()).map((n) => {
      const title = locale === "ar" && n.titleAr ? n.titleAr : n.title;
      const typeLabel = locale === "ar" && n.entityType?.nameAr ? n.entityType.nameAr : n.entityType?.name;
      const tooltipName = [String(title ?? ""), String(typeLabel ?? "")].filter(Boolean).join(" · ");
      const displayLabel = String(title ?? "");
      const categoryName = String(n.entityType?.code ?? "");
      const isRoot = n.id === tree.id;

      return {
        id: n.id,
        name: tooltipName,
        category: categoryIndex.get(categoryName) ?? 0,
        symbolSize: isRoot ? 62 : 38,
        value: n.key,
        label: {
          show: true,
          formatter: displayLabel.length > 16 ? displayLabel.slice(0, 16) + "…" : displayLabel,
        },
        itemStyle: isRoot ? { borderWidth: 3, borderColor: "rgba(255,255,255,0.55)" } : {},
      };
    });

    return { nodes, links, categories };
  }, [locale, tree]);

  const bgColor      = isDark ? "#0d1117" : "#f1f5f9";
  const dotColor     = isDark ? "#1e293b" : "#cbd5e1";
  const labelColor   = isDark ? "#e2e8f0" : "#1e293b";
  const legendColor  = isDark ? "rgba(226,232,240,0.85)" : "rgba(15,23,42,0.75)";
  const lineColor    = isDark ? "rgba(148,163,184,0.35)" : "rgba(100,116,139,0.40)";
  const tooltipBg    = isDark ? "rgba(2,6,23,0.95)" : "rgba(255,255,255,0.97)";
  const tooltipBorder= isDark ? "rgba(255,255,255,0.12)" : "rgba(2,6,23,0.10)";
  const tooltipText  = isDark ? "rgba(226,232,240,0.92)" : "rgba(15,23,42,0.92)";

  const option = useMemo<EChartsOption>(() => {
    if (!graph || !tree) {
      return { tooltip: { show: false } };
    }

    return {
      tooltip: {
        trigger: "item",
        confine: true,
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText, fontSize: 12 },
        extraCssText: "border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.18); padding: 8px 12px;",
      },
      legend: graph.categories.length
        ? [
            {
              data: graph.categories.map((c) => c.name),
              type: "scroll",
              bottom: 0,
              textStyle: { color: legendColor },
            },
          ]
        : [],
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          draggable: true,
          focusNodeAdjacency: true,
          data: graph.nodes,
          links: graph.links,
          categories: graph.categories,
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: [0, 8],
          lineStyle: {
            width: 1.5,
            opacity: 0.55,
            curveness: 0.32,
            color: lineColor,
          },
          label: {
            show: true,
            position: "right",
            distance: 6,
            color: labelColor,
            fontSize: 11,
            fontWeight: "normal",
          },
          emphasis: {
            focus: "adjacency",
            label: { show: true, fontWeight: "bold" },
            lineStyle: { width: 3, opacity: 0.85 },
          },
          force: {
            repulsion: 1400,
            edgeLength: [130, 200],
            gravity: 0.08,
            layoutAnimation: true,
          },
        },
      ],
    };
  }, [graph, tree, tooltipBg, tooltipBorder, tooltipText, legendColor, lineColor, labelColor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        {locale === "ar" ? "لا توجد اعتماديات لعرضها." : "No dependencies to display."}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-border overflow-hidden"
      style={{
        backgroundColor: bgColor,
        backgroundImage: `radial-gradient(circle, ${dotColor} 1.2px, transparent 1.2px)`,
        backgroundSize: "22px 22px",
      }}
    >
      <EChart option={option} height={520} />
    </div>
  );
}
