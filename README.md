# benchmark

```bash
npm install
```

Benchmark the different crypto suite implementations over N (configured in [`./src/index.ts`](src/index.ts)) runs as follows:

```bash
npm run start:v2:dev
```
- [ ] CLEANUP: package.json scripts

The performance records will be stored in [`./data`](./data) (note: these performance records are not tracked by Git).

- [ ] CLEANUP: safely delete the old notebook (SHARCS-perf-analysis.ipynb)

Data analysis can be found in [this Jupyter Notebook](./SHARCS-perf-analysis-Copy1.ipynb).
