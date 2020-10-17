# publish steps

/bin/bash ./scripts/gitChecker.sh
npm version patch
npm install
# webpack
microbundle
cp ./src/index.d.ts ./dist/index.d.ts
