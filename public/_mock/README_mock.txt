Usage:
1) Unzip at your repo root.
   You should now have: public/_mock/index.json and public/_mock/experiments/*.json
2) Start dev server. Verify:
   - http://localhost:3000/_mock/index.json
   - http://localhost:3000/_mock/experiments/exp_001.json
3) If you have middleware, exclude '/_mock' from matching or auth redirects.
