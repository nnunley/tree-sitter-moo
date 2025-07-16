const Parser = require('tree-sitter');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { execSync } = require('child_process');

// Generate large MOO file for initial load testing
function generateLargeMOOFile() {
  let code = '// Large MOO file for initial load testing\n\n';
  
  // Generate 1000 functions with various patterns
  for (let i = 0; i < 1000; i++) {
    code += `fn process_${i}(data)\n`;
    code += `    result = data + ${i};\n`;
    code += `    if (result > 100)\n`;
    code += `        result = result / 2;\n`;
    code += `    endif\n`;
    code += `    return result;\n`;
    code += `endfn\n\n`;
  }
  
  // Generate object definitions
  for (let i = 0; i < 100; i++) {
    code += `object $object_${i}\n`;
    code += `    property value = ${i}\n`;
    code += `    property name = "object_${i}"\n`;
    code += `    verb test(this none this)\n`;
    code += `        return this.value * 2;\n`;
    code += `    endverb\n`;
    code += `endobject\n\n`;
  }
  
  // Generate complex expressions
  for (let i = 0; i < 500; i++) {
    code += `value_${i} = ((a_${i} + b_${i}) * c_${i}) / (d_${i} || 1);\n`;
    code += `{x_${i}, y_${i}, @rest_${i}} = process_data({1, 2, 3, 4, 5});\n`;
  }
  
  return code;
}

// Test initial load performance
async function testInitialLoad() {
  console.log('=== TREE-SITTER-MOO INITIAL LOAD PERFORMANCE TEST ===\n');
  
  // Generate large file
  const largeCode = generateLargeMOOFile();
  const fileSize = largeCode.length;
  const lineCount = largeCode.split('\n').length;
  
  console.log(`Test file: ${fileSize} bytes, ${lineCount} lines\n`);
  
  // Test current grammar
  console.log('Testing current grammar (with wrappers)...');
  const TreeSitterMoo = require(path.join(__dirname, '..', 'bindings/node'));
  const currentParser = new Parser();
  currentParser.setLanguage(TreeSitterMoo);
  
  // Warm up
  currentParser.parse(largeCode);
  
  // Measure parse time
  const currentTimes = [];
  for (let i = 0; i < 10; i++) {
    const start = performance.now();
    const tree = currentParser.parse(largeCode);
    const end = performance.now();
    currentTimes.push(end - start);
  }
  
  const currentAvg = currentTimes.reduce((a, b) => a + b) / currentTimes.length;
  const currentMin = Math.min(...currentTimes);
  const currentMax = Math.max(...currentTimes);
  
  console.log(`Current grammar:`);
  console.log(`  Average: ${currentAvg.toFixed(2)}ms`);
  console.log(`  Min: ${currentMin.toFixed(2)}ms`);
  console.log(`  Max: ${currentMax.toFixed(2)}ms`);
  
  // Test optimized grammar
  console.log('\nBuilding optimized grammar...');
  const originalGrammar = fs.readFileSync(path.join(__dirname, '..', 'grammar.js'), 'utf8');
  
  try {
    // Replace with optimized grammar
    fs.copyFileSync(
      path.join(__dirname, '..', 'grammar_optimized.js'),
      path.join(__dirname, '..', 'grammar.js')
    );
    
    // Rebuild
    execSync('npx tree-sitter generate', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    // Test optimized version
    console.log('Testing optimized grammar...');
    // Clear require cache to reload the module
    delete require.cache[require.resolve(path.join(__dirname, '..', 'bindings/node'))];
    const OptimizedMoo = require(path.join(__dirname, '..', 'bindings/node'));
    const optimizedParser = new Parser();
    optimizedParser.setLanguage(OptimizedMoo);
    
    // Warm up
    optimizedParser.parse(largeCode);
    
    // Measure parse time
    const optimizedTimes = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      const tree = optimizedParser.parse(largeCode);
      const end = performance.now();
      optimizedTimes.push(end - start);
    }
    
    const optimizedAvg = optimizedTimes.reduce((a, b) => a + b) / optimizedTimes.length;
    const optimizedMin = Math.min(...optimizedTimes);
    const optimizedMax = Math.max(...optimizedTimes);
    
    console.log(`Optimized grammar:`);
    console.log(`  Average: ${optimizedAvg.toFixed(2)}ms`);
    console.log(`  Min: ${optimizedMin.toFixed(2)}ms`);
    console.log(`  Max: ${optimizedMax.toFixed(2)}ms`);
    
    // Calculate improvement
    const improvement = ((currentAvg - optimizedAvg) / currentAvg * 100).toFixed(1);
    console.log(`\nPerformance improvement: ${improvement}%`);
    console.log(`Speed increase: ${(currentAvg / optimizedAvg).toFixed(2)}x`);
    
    // Test memory usage
    console.log('\n=== MEMORY USAGE COMPARISON ===\n');
    
    // Current grammar memory
    global.gc && global.gc();
    const currentMemBefore = process.memoryUsage().heapUsed;
    const currentTree = currentParser.parse(largeCode);
    const currentMemAfter = process.memoryUsage().heapUsed;
    const currentMemUsed = (currentMemAfter - currentMemBefore) / 1024 / 1024;
    
    // Optimized grammar memory
    global.gc && global.gc();
    const optimizedMemBefore = process.memoryUsage().heapUsed;
    const optimizedTree = optimizedParser.parse(largeCode);
    const optimizedMemAfter = process.memoryUsage().heapUsed;
    const optimizedMemUsed = (optimizedMemAfter - optimizedMemBefore) / 1024 / 1024;
    
    console.log(`Current grammar: ${currentMemUsed.toFixed(2)} MB`);
    console.log(`Optimized grammar: ${optimizedMemUsed.toFixed(2)} MB`);
    console.log(`Memory reduction: ${((currentMemUsed - optimizedMemUsed) / currentMemUsed * 100).toFixed(1)}%`);
    
  } finally {
    // Restore original grammar
    fs.writeFileSync(path.join(__dirname, '..', 'grammar.js'), originalGrammar);
    execSync('npx tree-sitter generate', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
  }
}

testInitialLoad().catch(console.error);