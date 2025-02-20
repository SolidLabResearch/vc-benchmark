# Benchmark

## Usage

```bash
npm install
```

Benchmark the different crypto suite implementations over N (configured in [`./src/index.ts`](src/index.ts)) runs, in parallel, as follows:

```bash
./execute-credentialSetupSubsets-parallel.sh
```

## Configuration

The experiments that need to be run are configured in [`./src/index.ts`](./src/index.ts).
Relevant parameters are:

- `experimentConstructors`: Classnames of the crypto suite experiments that will be evaluated in the experiment.
- `credentialSetupKeys`: the keys of the credential setups that will be used for the experiment.  
- `nExperimentIterations`: the number of iterations.

## Results

The performance records will be stored in [`./data`](./data).

Since the runs are executed in parallel, the resulting performance records need to be combined into a single file. This can be done using [this data-prep Notebook](./data-prep.ipynb).


Data analysis can be found in [this Jupyter Notebook](./data-analysis-v2-0-0.ipynb).
