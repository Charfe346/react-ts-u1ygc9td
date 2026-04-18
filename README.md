# react-ts-u1ygc9td

# 🌋 VolcanoCraft Pro

Interactive RNA-seq Volcano Plot Visualization & Comparison Tool.

Runs entirely in your browser. No installation. Your data stays on your computer.

**⚠️ Demo version – actively being improved.**

## 🔗 Live Demo

👉 https://react-ts-u1ygc9td.stackblitz.io/ *(link coming soon)*

Demo data (~5,000 genes) loads automatically — just open and explore!

## ✨ Features

### Visualization
- **Single & Compare mode** — unique dual-volcano with central gene corridor
- 4 plot styles: Classic, Heatmap, Bubble, Significance
- 5 themes including colorblind-safe and publication-ready
- Interactive tooltips, zoom/pan, gene search
- 600 DPI PNG export for publication figures

### Biology
- g:Profiler enrichment (GO, KEGG, Reactome) with volcano overlay
- GO Overlay & Replace display modes
- Auto-detection of common RNA-seq output formats
- CSV, TSV, TXT, XLSX support

### Statistics
- BH, Bonferroni, Holm, BY multiple testing corrections
- π₀ estimation (Storey 2002)
- Genomic inflation factor (λ_GC)
- KS uniformity test
- QQ, MA, Forest, Waterfall, π₀ curve plots

### Compare Mode
- Side-by-side volcanos with gene corridor
- Concordance: Pearson r, Spearman ρ, Cohen's κ
- Concordance scatter + Venn overlap
- Manual or automatic gene selection for corridor

## 📁 Input Format

**Accepted:** CSV, TSV, TXT, XLSX

**Required columns** (auto-detected):
| Column | Aliases |
|--------|---------|
| Gene | gene, gene_name, symbol, ID, SYMBOL... |
| log₂FC | log2FoldChange, logFC, LFC, FC... |
| P-value | pvalue, pval, PValue, P.Value... |
| Adjusted p *(optional)* | padj, FDR, qvalue, adj.P.Val... |
| Expression *(optional)* | baseMean, AveExpr, TPM... |

Tested with DESeq2 output from M. musculus RNA-seq data.

## ⚠️ Known Limitations

- CI in Forest Plot uses Wald test approximation
- SVG export is rasterized (PNG inside SVG)
- Performance tested up to ~5,000 genes
- π₀ estimation uses simplified Storey method (min instead of spline)

## 🛠️ Tech Stack

React · TypeScript · HTML5 Canvas · Vite

## 📜 References

- Benjamini & Hochberg (1995) — FDR correction
- Storey (2002) — π₀ estimation
- Raudvere et al. (2019) — g:Profiler API

## License

MIT
