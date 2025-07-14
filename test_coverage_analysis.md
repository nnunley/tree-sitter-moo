# Tree-Sitter MOO Test Coverage Analysis

## Current Test Coverage

### Covered Features:
1. **Binary Operations** (binops.txt) - 40 lines
   - Basic arithmetic and logical operators
   
2. **Error Handling** (error_handling.txt) - 186 lines
   - Try-except statements with various error codes
   - Try-finally statements
   
3. **Value Types** (value_types.txt) - 126 lines
   - Integers, floats, strings, object IDs, symbols, booleans
   
4. **Functions and Verbs** (functions_and_verbs.txt) - 34 lines
   - Function calls and verb invocations
   
5. **Property Access** (property_access.txt) - 13 lines
   - Basic property access syntax
   
6. **Flyweights** (flyweights.txt) - 73 lines
   - MOO extension feature for lightweight objects

## Missing Test Coverage

### Control Flow Statements:
- [ ] `while` loops (simple and labeled)
- [ ] `for` loops (range and in-expression)
- [ ] `fork` statements (simple and labeled)
- [ ] `begin`/`end` blocks
- [ ] `break` statements (with and without labels)
- [ ] `continue` statements (with and without labels)
- [ ] `return` statements (with expressions)

### Variable Declarations:
- [ ] `let` (local assignment)
- [ ] `const` (constant assignment)
- [ ] `global` (global assignment)
- [ ] Scatter assignment patterns

### Advanced Features:
- [ ] Range comprehensions `{expr for x in (range)}`
- [ ] Conditional expressions (`?` operator)
- [ ] Pass expressions
- [ ] System properties (`$property`)
- [ ] Index operations (single and range)
- [ ] Maps with `->` syntax
- [ ] Argument splicing with `@`

### Edge Cases:
- [ ] Comments (single-line `//` and multi-line `/* */`)
- [ ] Case-insensitive keywords
- [ ] Nested control structures
- [ ] Complex scatter patterns
- [ ] Scientific notation for floats
- [ ] String escape sequences
- [ ] Empty statements

### Operator Coverage Gaps:
- [ ] Bitwise operators (`|.`, `&.`, `^.`, `<<`, `>>`)
- [ ] Logical operators (`||`, `&&`)
- [ ] Unary operators (`!`, `-`, `~`)

## Recommendations

1. **Immediate Priority**: Add tests for all control flow statements as these are fundamental to MOO
2. **Secondary Priority**: Cover variable declarations and scoping features
3. **Third Priority**: Advanced features like comprehensions and scatter patterns
4. **Final Priority**: Edge cases and comprehensive operator coverage

## Test Organization Suggestions

Create new test files:
- `control_flow.txt` - for while, for, fork, begin/end
- `variables.txt` - for let, const, global declarations
- `operators.txt` - for comprehensive operator testing
- `advanced_features.txt` - for comprehensions, scatter, etc.
- `edge_cases.txt` - for comments, case sensitivity, etc.