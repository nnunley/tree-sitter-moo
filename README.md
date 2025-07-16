# tree-sitter-moo

A Tree-sitter grammar for the MOO programming language, supporting both traditional MOO syntax and modern extensions including object definitions, lambdas, and scatter assignments.

## Features

- Full MOO language support including:
  - Traditional MOO control structures (`if`/`endif`, `while`/`endwhile`, `for`/`endfor`, etc.)
  - Object-oriented programming with verb and property definitions
  - Modern extensions: lambdas, scatter assignments, range comprehensions
  - Object definition syntax (`object`/`endobject` or `endobj`)
  - Error handling with `try`/`except`/`finally`/`endtry`
  - Built-in error codes (E_TYPE, E_DIV, E_PERM, etc.)

## Installation

### Using npm

```bash
npm install tree-sitter-moo
```

### From source

```bash
git clone https://github.com/nnunley/tree-sitter-moo
cd tree-sitter-moo
npm install
```

## Usage

### Command Line

Test the parser on a MOO file:

```bash
tree-sitter parse examples/demo.moo
```

Test syntax highlighting:

```bash
tree-sitter highlight examples/test_highlight.moo
```

### In Your Application

```javascript
const Parser = require('tree-sitter');
const MOO = require('tree-sitter-moo');

const parser = new Parser();
parser.setLanguage(MOO);

const sourceCode = 'object TEST\n  name: "Test Object"\nendobject';
const tree = parser.parse(sourceCode);
console.log(tree.rootNode.toString());
```

## Development

### Building

```bash
npm run build
```

### Testing

Run the test suite:

```bash
npm test
```

Test specific corpus files:

```bash
tree-sitter test -f 'object definitions'
```

### Grammar Development

The grammar is defined in `grammar.js`. After making changes:

1. Regenerate the parser:
   ```bash
   tree-sitter generate
   ```

2. Run tests to ensure nothing broke:
   ```bash
   tree-sitter test
   ```

   If grammar changes affect the expected parse output, you can automatically update test expectations:
   ```bash
   tree-sitter test --update
   ```

3. Test highlighting:
   ```bash
   tree-sitter highlight examples/test_highlight.moo
   ```

## Examples

See the `examples/` directory for various MOO code samples demonstrating different language features:

- `demo.moo` - General MOO syntax examples
- `simple_object.moo` - Simple object definition example
- `test_highlight.moo` - Syntax highlighting test cases
- `test_injections.moo` - Language injection examples
- `test_new_features.moo` - Examples of newer MOO features
- `test_object.moo` - Object definition syntax
- `test_scatter.moo` - Scatter assignment examples
- `test_try.moo` - Exception handling

## Query Files

The `queries/` directory contains:

- `highlights.scm` - Syntax highlighting queries
- `locals.scm` - Scope and variable binding queries for enhanced highlighting
- `injections.scm` - Language injection queries for embedded SQL, regex, and other languages

## Documentation

Comprehensive documentation for the CST structure and API usage is available in the `docs/` directory:

- **[Complete Documentation Index](docs/README.md)** - Main documentation hub with navigation
- **[CST Reference](docs/CST_REFERENCE.md)** - Complete CST hierarchy and named fields
- **[Named Fields Guide](docs/NAMED_FIELDS.md)** - Programmatic access patterns and API examples
- **[Production Rules](docs/PRODUCTION_REFERENCE.md)** - Quick reference for all grammar rules
- **[CST Examples](docs/CST_EXAMPLES.md)** - Real parse tree examples for all language constructs

### Key Features

**Modern Binding System**: Unified parameter structure across assignments, lambdas, and functions:
```moo
let {a, ?b = 10, @rest} = data;           // Destructuring assignment
let handler = {a, ?b = 10, @rest} => ...;  // Lambda parameters  
fn process(a, ?b = 10, @rest) ... endfn    // Function parameters
```

**Flattened CST Structure**: Direct access to parameters without nested wrappers:
```javascript
// Easy programmatic access
const parameters = bindingNode.childrenForFieldName('parameters');
parameters.forEach(param => console.log(param.childForFieldName('name').text));
```

**Comprehensive Named Fields**: All 35+ named fields documented with examples and API patterns.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License - see LICENSE file for details