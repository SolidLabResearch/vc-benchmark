# benchmark

```bash
npm install
```

Benchmark the different crypto suite implementations over N (configured in [`./src/index.ts`](src/index.ts)) runs as follows:

```bash
npm run start:v2:dev
```
- [ ] CLEANUP: package.json scripts

The experiments that need to be run are configured in [`./src/index.ts`](./src/index.ts)).
Relevant parameters are:

- `experimentConstructors`: Classnames of the crypto suite experiments that will be evaluated in the experiment.
- `credentialSetupKeys`: the keys of the credential setups that will be used for the experiment.  
- `nExperimentIterations`: the number of iterations.

The performance records will be stored in [`./data`](./data).
Note that every time you run the experiments (`npm run start:v2`),
the logged performance records will be written `./data/records.json`,
which is configured to be ignored by Git (cfr., [`.gitignore`](./.gitignore)). 
To commit the performance records resulting from a particular experiment setup (configured in )  are deemed 

Data analysis can be found in [this Jupyter Notebook](./data-analysis-v2-0-0.ipynb).
