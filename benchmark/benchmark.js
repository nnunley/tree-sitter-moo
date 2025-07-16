const Parser = require('tree-sitter');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Function to compile and load a grammar
async function loadGrammar(grammarPath) {
  const oldGrammarPath = path.join(__dirname, '..', 'grammar.js');
  const originalContent = fs.readFileSync(oldGrammarPath, 'utf8');
  
  try {
    // Temporarily replace grammar.js
    fs.copyFileSync(grammarPath, oldGrammarPath);
    
    // Build the grammar
    const { execSync } = require('child_process');
    execSync('npx tree-sitter generate', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe' 
    });
    
    // Load the language
    const Language = require(path.join(__dirname, '..', 'bindings/node'));
    return Language;
  } finally {
    // Restore original grammar
    fs.writeFileSync(oldGrammarPath, originalContent);
  }
}

// Function to run benchmark on a file
function benchmarkFile(parser, filePath, iterations = 1000) {
  const code = fs.readFileSync(filePath, 'utf8');
  const times = [];
  
  // Warm up
  for (let i = 0; i < 10; i++) {
    parser.parse(code);
  }
  
  // Actual benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const tree = parser.parse(code);
    const end = performance.now();
    times.push(end - start);
    
    // Verify parsing succeeded
    if (tree.rootNode.hasError) {
      throw new Error(`Parsing error in ${filePath}`);
    }
  }
  
  // Calculate statistics
  times.sort((a, b) => a - b);
  const mean = times.reduce((a, b) => a + b) / times.length;
  const median = times[Math.floor(times.length / 2)];
  const min = times[0];
  const max = times[times.length - 1];
  const p95 = times[Math.floor(times.length * 0.95)];
  
  return { mean, median, min, max, p95 };
}

// Function to count nodes in AST
function countNodes(node) {
  let count = 1;
  for (let i = 0; i < node.childCount; i++) {
    count += countNodes(node.child(i));
  }
  return count;
}

// Main benchmark function
async function runBenchmark() {
  console.log('Loading grammars...');
  const wrappedLanguage = await loadGrammar(path.join(__dirname, 'grammar_wrapped.js'));
  const flattenedLanguage = await loadGrammar(path.join(__dirname, 'grammar_flattened.js'));
  
  const wrappedParser = new Parser();
  wrappedParser.setLanguage(wrappedLanguage);
  
  const flattenedParser = new Parser();
  flattenedParser.setLanguage(flattenedLanguage);
  
  const testFiles = [
    'simple.moo'
  ];
  
  console.log('\n=== PARSING PERFORMANCE BENCHMARK ===\n');
  
  for (const file of testFiles) {
    const filePath = path.join(__dirname, 'test_files', file);
    const code = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\nFile: ${file} (${code.length} bytes, ${code.split('\n').length} lines)`);
    console.log('─'.repeat(60));
    
    // Benchmark wrapped grammar
    const wrappedStats = benchmarkFile(wrappedParser, filePath);
    const wrappedTree = wrappedParser.parse(code);
    const wrappedNodeCount = countNodes(wrappedTree.rootNode);
    
    // Benchmark flattened grammar
    const flattenedStats = benchmarkFile(flattenedParser, filePath);
    const flattenedTree = flattenedParser.parse(code);
    const flattenedNodeCount = countNodes(flattenedTree.rootNode);
    
    // Display results
    console.log('Grammar Type    | Mean (ms) | Median | Min   | Max   | P95   | Nodes');
    console.log('─'.repeat(76));
    console.log(`Wrapped nodes   | ${wrappedStats.mean.toFixed(3).padEnd(9)} | ${wrappedStats.median.toFixed(3).padEnd(6)} | ${wrappedStats.min.toFixed(3).padEnd(5)} | ${wrappedStats.max.toFixed(3).padEnd(5)} | ${wrappedStats.p95.toFixed(3).padEnd(5)} | ${wrappedNodeCount}`);
    console.log(`Flattened nodes | ${flattenedStats.mean.toFixed(3).padEnd(9)} | ${flattenedStats.median.toFixed(3).padEnd(6)} | ${flattenedStats.min.toFixed(3).padEnd(5)} | ${flattenedStats.max.toFixed(3).padEnd(5)} | ${flattenedStats.p95.toFixed(3).padEnd(5)} | ${flattenedNodeCount}`);
    
    // Calculate differences
    const meanDiff = ((wrappedStats.mean - flattenedStats.mean) / flattenedStats.mean * 100).toFixed(1);
    const medianDiff = ((wrappedStats.median - flattenedStats.median) / flattenedStats.median * 100).toFixed(1);
    const nodeDiff = ((wrappedNodeCount - flattenedNodeCount) / flattenedNodeCount * 100).toFixed(1);
    
    console.log('\nPerformance Impact:');
    console.log(`  Mean time difference: ${meanDiff > 0 ? '+' : ''}${meanDiff}%`);
    console.log(`  Median time difference: ${medianDiff > 0 ? '+' : ''}${medianDiff}%`);
    console.log(`  Node count difference: ${nodeDiff > 0 ? '+' : ''}${nodeDiff}%`);
  }
  
  // Memory usage comparison
  console.log('\n\n=== MEMORY USAGE COMPARISON ===\n');
  
  const memoryTestFile = path.join(__dirname, 'test_files', 'simple.moo');
  const code = fs.readFileSync(memoryTestFile, 'utf8');
  
  // Test wrapped grammar memory
  global.gc && global.gc();
  const wrappedMemBefore = process.memoryUsage().heapUsed;
  const wrappedTrees = [];
  for (let i = 0; i < 100; i++) {
    wrappedTrees.push(wrappedParser.parse(code));
  }
  const wrappedMemAfter = process.memoryUsage().heapUsed;
  const wrappedMemUsed = (wrappedMemAfter - wrappedMemBefore) / 1024 / 1024;
  
  // Clear trees
  wrappedTrees.length = 0;
  global.gc && global.gc();
  
  // Test flattened grammar memory
  const flattenedMemBefore = process.memoryUsage().heapUsed;
  const flattenedTrees = [];
  for (let i = 0; i < 100; i++) {
    flattenedTrees.push(flattenedParser.parse(code));
  }
  const flattenedMemAfter = process.memoryUsage().heapUsed;
  const flattenedMemUsed = (flattenedMemAfter - flattenedMemBefore) / 1024 / 1024;
  
  console.log(`Wrapped grammar: ${wrappedMemUsed.toFixed(2)} MB for 100 parse trees`);
  console.log(`Flattened grammar: ${flattenedMemUsed.toFixed(2)} MB for 100 parse trees`);
  console.log(`Memory difference: ${((wrappedMemUsed - flattenedMemUsed) / flattenedMemUsed * 100).toFixed(1)}%`);
}

// Run the benchmark
runBenchmark().catch(console.error);