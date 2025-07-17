/// <reference types="tree-sitter-cli/dsl" />
// @ts-nocheck

/** Original Yacc grammar

%right  '='                           1
%nonassoc '?' '|'                     2
%left   tOR tAND                      3
%left   tEQ tNE '<' tLE '>' tGE tIN   4
%left   tBITOR tBITAND tBITXOR        5
%left   tBITSHL tBITSHR               6
%left   '+' '-'                       7
%left   '*' '/' '%'                   8
%right  '^'                           9
%left   '!' '~' tUNARYMINUS           10
%nonassoc '.' ':' '[' '$'             11

%%
**/

// Binary operator table for cleaner grammar
const BINARY_OPERATORS = [
  [3, 'left',  ['||', '&&']],
  [4, 'left',  ['==', '!=', '<', '<=', '>', '>=', 'in']],
  [5, 'left',  ['|.', '&.', '^.']],
  [6, 'left',  ['<<', '>>']],
  [7, 'left',  ['+', '-']],
  [8, 'left',  ['*', '/', '%']],
  [9, 'right', ['^']]
];

module.exports = grammar({
  name: "moo",

  extras: ($) => [
    /\s/,
    $.comment
  ],

  word: ($) => $.identifier,

  conflicts: ($) => [
    // Binding patterns vs expressions in lists
    [$.binding_rest, $.expression],
    
    // Binding pattern vs lambda parameters vs expression
    [$.expression, $.binding_pattern, $.lambda_parameters],
    
    // Binding pattern vs lambda parameters
    [$.binding_pattern, $.lambda_parameters],
    
    // Range end vs system property
    [$.expression, $.system_property],
  ],

  rules: {
    program: ($) => choice(
      // Object definition file (objdef format)
      $.object_definition,
      // Traditional MOO program (list of statements)
      repeat($.statement)
    ),

    // Flat statement structure
    statement: ($) => choice(
      // Simple statements (require semicolon)
      $.expression_statement,
      $.assignment_statement,
      
      // Block statements (no semicolon)
      $.block_statement,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.fork_statement,
      $.try_statement,
      $.function_statement,
    ),

    expression_statement: ($) => prec.right(seq(
      field("expression", $.expression),
      optional(";")
    )),

    // Assignment statements
    assignment_statement: ($) => choice(
      $.let_statement,
      $.const_statement,
      $.global_statement
    ),

    let_statement: ($) => seq(
      keyword("let"),
      field("target", choice($.identifier, $.binding_pattern)),
      "=",
      field("expression", $.expression),
      optional(";")
    ),

    const_statement: ($) => seq(
      keyword("const"),
      field("target", choice($.identifier, $.binding_pattern)),
      "=",
      field("expression", $.expression),
      optional(";")
    ),

    global_statement: ($) => seq(
      keyword("global"),
      field("target", $.identifier),
      optional(seq("=", field("expression", $.expression))),
      optional(";")
    ),

    // Control flow as expressions (MOO allows this)
    break_expression: ($) => prec.right(1, seq(
      keyword("break"),
      optional(field("label", $.identifier))
    )),

    continue_expression: ($) => prec.right(1, seq(
      keyword("continue"),
      optional(field("label", $.identifier))
    )),

    return_expression: ($) => prec.right(1, seq(
      keyword("return"),
      optional(field("value", $.expression))
    )),

    block_statement: ($) => seq(
      keyword("begin"),
      field("body", repeat($.statement)),
      keyword("end")
    ),

    if_statement: ($) => seq(
      keyword("if"),
      "(",
      field("condition", $.expression),
      ")",
      field("then_body", repeat($.statement)),
      field("elseif_clauses", repeat($.elseif_clause)),
      field("else_clause", optional($.else_clause)),
      keyword("endif")
    ),

    elseif_clause: ($) => seq(
      keyword("elseif"),
      "(",
      field("condition", $.expression),
      ")",
      field("body", repeat($.statement))
    ),

    else_clause: ($) => seq(
      keyword("else"),
      field("body", repeat($.statement))
    ),

    for_statement: ($) => seq(
      keyword("for"),
      field("variable", $.identifier),
      keyword("in"),
      field("iterable", choice(
        $.range,
        $.expression  // Direct expression instead of wrapper
      )),
      field("body", repeat($.statement)),
      keyword("endfor")
    ),

    range: ($) => seq(
      "[",
      field("start", $.expression),
      "..",
      field("end", $.expression),
      "]"
    ),

    while_statement: ($) => seq(
      keyword("while"),
      optional(field("label", $.identifier)),
      "(",
      field("condition", $.expression),
      ")",
      field("body", repeat($.statement)),
      keyword("endwhile")
    ),

    fork_statement: ($) => seq(
      keyword("fork"),
      optional(field("label", $.identifier)),
      "(",
      field("expression", $.expression),
      ")",
      field("body", repeat($.statement)),
      keyword("endfork")
    ),

    try_statement: ($) => seq(
      keyword("try"),
      field("body", repeat1($.statement)),
      field("handlers", repeat($.except_clause)),
      field("finally", optional($.finally_clause)),
      keyword("endtry")
    ),

    except_clause: ($) => seq(
      keyword("except"),
      optional(field("variable", $.identifier)),
      "(",
      field("codes", choice(
        keyword("ANY"),
        commaSep1($.error_code)
      )),
      ")",
      field("body", repeat($.statement))
    ),

    finally_clause: ($) => seq(
      keyword("finally"),
      field("body", repeat($.statement))
    ),

    try_expression: ($) => seq(
      "`",
      field("expression", $.expression),
      "!",
      field("codes", choice(
        keyword("ANY"),
        commaSep1($.error_code)
      )),
      optional(seq("=>", field("fallback", $.expression))),
      "'"
    ),

    // Flattened expression hierarchy
    expression: ($) => choice(
      // Literals (no wrapper needed)
      $.identifier,
      $.integer,
      $.float,
      $.string,
      $.boolean,
      $.error_code,
      $.object_id,
      $.system_property,
      $.symbol,
      alias("$", "range_end"),  // Range end marker
      
      // Operations
      $.assignment_operation,
      $.conditional_operation,
      $.binary_operation,
      $.unary_operation,
      
      // Control flow expressions
      $.break_expression,
      $.continue_expression,
      $.return_expression,
      
      // Access patterns
      $.property_access,
      $.method_call,
      $.index_access,
      $.slice,
      $.call,
      
      // Compound expressions
      $.list,
      $.map,
      $.flyweight,
      $.lambda,
      $.function_expression,
      $.range_comprehension,
      $.try_expression,
      $.pass_expression,
      
      // Parentheses (just for precedence, no node)
      seq("(", $.expression, ")"),
    ),

    assignment_operation: ($) => prec.right(1, seq(
      field("left", choice($.identifier, $.binding_pattern)),
      "=",
      field("right", $.expression)
    )),

    conditional_operation: ($) => prec.right(2, seq(
      field("condition", $.expression),
      "?",
      field("consequence", $.expression),
      "|",
      field("alternative", $.expression)
    )),

    // Table-driven binary operations
    binary_operation: ($) => choice(
      ...BINARY_OPERATORS.flatMap(([precedence, associativity, ops]) =>
        ops.map(op => {
          const rule = seq(
            field("left", $.expression),
            field("operator", op === 'in' ? keyword('in') : op),
            field("right", $.expression)
          );
          return associativity === 'left' 
            ? prec.left(precedence, rule)
            : prec.right(precedence, rule);
        })
      )
    ),

    unary_operation: ($) => prec.left(10, seq(
      field("operator", choice("!", "-")),
      field("operand", $.expression)
    )),

    property_access: ($) => prec.left(11, seq(
      field("object", $.expression),
      ".",
      field("property", choice(
        $.identifier,
        seq("(", $.expression, ")")
      ))
    )),

    method_call: ($) => prec.left(11, seq(
      field("object", $.expression),
      ":",
      field("method", choice(
        $.identifier,
        seq("(", $.expression, ")")
      )),
      "(",
      field("arguments", optional(commaSep(choice(
        $.expression,
        $.splat_argument
      )))),
      ")"
    )),

    index_access: ($) => prec.left(11, seq(
      field("object", $.expression),
      "[",
      field("index", $.expression),
      "]"
    )),

    slice: ($) => prec.left(11, seq(
      field("object", $.expression),
      "[",
      field("start", $.expression),
      "..",
      field("end", $.expression),
      "]"
    )),

    call: ($) => prec(12, seq(
      field("function", choice(
        $.identifier,
        seq("(", $.expression, ")")
      )),
      "(",
      field("arguments", optional(commaSep(choice(
        $.expression,
        $.splat_argument
      )))),
      ")"
    )),

    splat_argument: ($) => seq("@", field("expression", $.expression)),

    range_comprehension: ($) => seq(
      "{",
      field("expression", $.expression),
      keyword("for"),
      field("variable", $.identifier),
      keyword("in"),
      field("iterable", choice(
        $.range,
        $.expression
      )),
      "}"
    ),

    pass_expression: ($) => seq(
      keyword("pass"),
      "(",
      field("arguments", optional(commaSep(choice(
        $.expression,
        $.splat_argument
      )))),
      ")"
    ),

    binding_pattern: ($) => seq(
      "{",
      commaSep(choice(
        field("name", $.identifier), // Direct identifier for simple bindings
        $.binding_optional,
        $.binding_rest
      )),
      "}"
    ),


    binding_optional: ($) => seq(
      "?",
      field("name", $.identifier),
      optional(seq("=", field("default", $.expression)))
    ),

    binding_rest: ($) => seq("@", field("name", $.identifier)),

    list: ($) => prec(2, seq(
      "{",
      field("elements", commaSep(choice(
        $.expression,
        $.scatter_element
      ))),
      "}"
    )),

    scatter_element: ($) => seq("@", field("expression", $.expression)),

    map: ($) => seq(
      "[",
      field("entries", commaSep($.map_entry)),
      "]"
    ),

    map_entry: ($) => seq(
      field("key", $.expression),
      "->",
      field("value", $.expression)
    ),

    flyweight: ($) => prec(15, seq(
      "<",
      field("parent", $.expression),
      optional(seq(",", field("properties", $.map))),
      optional(seq(",", field("values", $.list))),
      ">"
    )),

    // Lambda expressions
    lambda: ($) => prec.right(0, seq(
      "{",
      field("parameters", optional($.lambda_parameters)),
      "}",
      "=>",
      field("body", $.expression)
    )),

    lambda_parameters: ($) => commaSep1(choice(
      $.identifier, // Direct identifier for simple parameters
      $.binding_optional,
      $.binding_rest
    )),

    // Function expressions
    function_expression: ($) => seq(
      keyword("fn"),
      "(",
      field("parameters", optional($.lambda_parameters)),
      ")",
      field("body", repeat($.statement)),
      keyword("endfn")
    ),

    // Function statements
    function_statement: ($) => seq(
      keyword("fn"),
      field("name", $.identifier),
      "(",
      field("parameters", optional($.lambda_parameters)),
      ")",
      field("body", repeat($.statement)),
      keyword("endfn")
    ),

    // Literals
    identifier: ($) => token(/[A-Za-z_][A-Za-z0-9_]*/),
    integer: ($) => token(/[+-]?[0-9]+/),
    float: ($) => token(choice(
      // Scientific notation without decimal point
      /[+-]?\d+[eE][+-]?\d+/,
      // Decimal with digits after point
      /[+-]?\d+\.\d+(?:[eE][+-]?\d+)?/,
      // Leading decimal point
      /[+-]?\.\d+(?:[eE][+-]?\d+)?/
    )),
    string: ($) => /\"[^\"\\]*(?:\\.[^\"\\]*)*\"|'[^'\\]*(?:\\.[^'\\]*)*'/,
    boolean: ($) => choice(keyword("true"), keyword("false")),
    symbol: ($) => seq("'", field("name", $.identifier)),
    object_id: ($) => seq("#", choice(
      field("number", seq(optional("-"), /\d+/)),
      field("name", $.identifier)
    )),
    system_property: ($) => seq("$", field("name", $.identifier)),

    error_code: ($) => {
      const errorCodes = [
        "E_NONE", "E_TYPE", "E_DIV", "E_PERM", "E_PROPNF", "E_VERBNF",
        "E_VARNF", "E_INVIND", "E_RECMOVE", "E_MAXREC", "E_RANGE",
        "E_ARGS", "E_NACC", "E_INVARG", "E_QUOTA", "E_FLOAT", "E_ASSERT",
      ];
      return choice(...errorCodes.map(err => keyword(err)));
    },

    comment: ($) => choice(
      seq("//", /.*/),
      seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/")
    ),

    // Object definition syntax
    object_definition: ($) => seq(
      keyword("object", 1),
      field("name", $.identifier),
      repeat($.object_member),
      optional(keyword("endobject", 1))
    ),

    object_member: ($) => choice(
      $.object_property,
      $.property_definition,
      $.verb_definition
    ),

    object_property: ($) => prec.left(seq(
      field("name", $.identifier),
      ":",
      field("value", $.expression)
    )),

    property_definition: ($) => seq(
      keyword("property", 1),
      field("name", $.identifier),
      optional(seq(
        "(",
        field("attributes", commaSep1($.property_attribute)),
        ")"
      )),
      "=",
      field("value", $.expression),
      optional(";")
    ),

    property_attribute: ($) => seq(
      field("name", $.identifier),
      ":",
      field("value", $.expression)
    ),

    verb_definition: ($) => seq(
      keyword("verb", 1),
      field("name", choice($.identifier, $.string)),
      "(",
      field("direct_object", $.identifier),
      field("preposition", $.identifier),
      field("indirect_object", $.identifier),
      ")",
      repeat($.verb_attribute),
      field("body", repeat($.statement)),
      keyword("endverb", 1)
    ),

    verb_attribute: ($) => prec(1, seq(
      field("name", $.identifier),
      ":",
      field("value", $.expression)
    )),
  }
});

// Helper functions
function toCaseInsensitive(a) {
  const ca = a.charCodeAt(0);
  if (ca>=97 && ca<=122) return `[${a}${a.toUpperCase()}]`;
  if (ca>=65 && ca<= 90) return `[${a.toLowerCase()}${a}]`;
  return a;
}

function caseInsensitive (keyword) {
  return new RegExp(keyword
    .split('')
    .map(toCaseInsensitive)
    .join('')
  )
}

// Helper function for comma-separated lists with at least one element
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

// Helper to create an aliased case-insensitive keyword
function keyword(word, precedence = null) {
  const pattern = caseInsensitive(word);
  const token_pattern = precedence !== null ? token(prec(precedence, pattern)) : pattern;
  return alias(token_pattern, word);
}

// Helper function for optional comma-separated lists
function commaSep(rule) {
  return optional(commaSep1(rule));
}