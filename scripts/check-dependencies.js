const path = require('path');
const depcheck = require('depcheck');

const rootDir = path.join(__dirname, '..');

const options = {
  ignoreDirs: [
    'dist',
    'PythonLSP',
    'bin',
    'lib',
    'packages',
    'help',
    'docs',
    'node_modules'
  ],
  ignoreMatches: [
    // ESLint configs / plugins might be loaded dynamically
    'globals',
    '@eslint/js'
  ]
};

console.log('Running depcheck dependency health analysis...');

depcheck(rootDir, options)
  .then((unused) => {
    let hasMissing = false;

    // 1. Check for truly missing dependencies (code imports something not in package.json)
    const missingKeys = Object.keys(unused.missing || {});
    if (missingKeys.length > 0) {
      hasMissing = true;
      console.error('\n::error ::Missing dependencies detected!');
      console.error('The following dependencies are imported by files but not declared in package.json:');
      for (const [pkg, files] of Object.entries(unused.missing)) {
        console.error(`  - ${pkg}: imported in ${files.join(', ')}`);
      }
    }

    // 2. Report unused dependencies (informational only - do not fail build)
    const unusedDeps = unused.dependencies || [];
    const unusedDevDeps = unused.devDependencies || [];

    if (unusedDeps.length > 0 || unusedDevDeps.length > 0) {
      console.log('\nDependency health report (informational):');
      if (unusedDeps.length > 0) {
        console.log(`::notice ::Found ${unusedDeps.length} runtime dependencies not statically imported (e.g. Monaco / DOMPurify loaded via HTML/AMD):`);
        unusedDeps.forEach((dep) => console.log(`  - [unused/dynamic runtime] ${dep}`));
      }
      if (unusedDevDeps.length > 0) {
        console.log(`::notice ::Found ${unusedDevDeps.length} devDependencies not directly imported in JS files:`);
        unusedDevDeps.forEach((dep) => console.log(`  - [devDependency] ${dep}`));
      }
    } else {
      console.log('\nAll declared dependencies are actively referenced in static code!');
    }

    // 3. Exit with error ONLY if dependencies are truly missing
    if (hasMissing) {
      console.error('\nBuild failed: Missing dependencies must be added to package.json.');
      process.exit(1);
    }

    console.log('\nDependency health check passed (no missing dependencies).');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error executing depcheck:', err);
    process.exit(1);
  });
