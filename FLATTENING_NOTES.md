# Grammar Flattening Analysis

## Current Nesting Issues

1. **Expression Nesting**: Every expression creates a wrapper node
   - `1 + 2` becomes: expression → binary_operation → expression(1) + expression(2)
   - Deep nesting for complex expressions like `a + b * c`

2. **Statement Lists**: Each statement in a block is a separate node
   - Makes traversal more complex

3. **Access Patterns**: Property/method/index access all wrap objects in expressions

## Why Complete Flattening is Challenging

1. **Type Consistency**: Tree-sitter requires consistent node types for fields
2. **Parser Ambiguity**: Flattening can create ambiguous grammars
3. **Backward Compatibility**: Tests expect certain node structures

## Practical Flattening Strategies

### 1. Direct Value Nodes
Instead of wrapping every literal in an expression, we already have them as direct children:
- ✓ Literals are already direct (identifier, integer, float, etc.)
- ✓ This avoids one level of nesting

### 2. Inline Simple Expressions
For simple cases, we could create specialized rules:
```javascript
// Instead of: expression → identifier
// Could have: direct identifier reference in certain contexts
```

### 3. Flatten Statement Sequences
The statement sequence work we did with semicolons as separators already helps here.

### 4. Reduce Field Wrapping
Where possible, avoid wrapping in field() calls that create extra nodes.

## Recommended Approach

The current grammar is already reasonably flat for a Tree-sitter parser:
1. Literals are direct children of expressions
2. Binary operations are single nodes with left/right fields
3. Statement sequences don't create extra wrapper nodes

Further flattening would require significant restructuring and could break compatibility.

## Impact on CST to AST Conversion

The current structure is actually good for AST conversion because:
1. Expression nodes provide consistent types
2. Field names make traversal clear
3. The structure maps well to semantic meaning

The key is to write the AST converter to handle the expression wrappers efficiently,
potentially skipping single-child expression nodes during conversion.