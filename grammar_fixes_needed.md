# Grammar Fixes Needed

## Issues Found:

1. **While/Fork statements**: Grammar expects parentheses directly after `while`/`fork`, but labeled versions need identifier first
2. **Try-except**: Structure doesn't match expected output - needs to use different naming
3. **Flyweights**: Map and list should be wrapped properly
4. **Verbs**: Not matching expected structure with semicolons
5. **For loop range**: The `[1..10]` syntax is being parsed incorrectly as float
6. **Range end**: `$` needs to be a statement, not just an atom
7. **Index operations**: Need to be attached to expressions properly

## Key structural differences from Ryan's CST:
- MOO uses `catch` in the AST but tree-sitter test expects `except`
- Need proper precedence for all operators
- Statement delimiters are critical for proper parsing