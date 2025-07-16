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
    [$.binding_rest, $._expression],
    
    // Binding pattern vs lambda parameters vs expression
    [$._expression, $.binding_pattern, $.lambda_parameters],
    
    // Binding pattern vs lambda parameters
    [$.binding_pattern, $.lambda_parameters],
    
    // Range end vs system property
    [$._expression, $.system_property],
    
    // For statement range vs expression
    [$.for_statement, $._expression],
    
    // Range comprehension range vs expression
    [$.range_comprehension, $._expression],
  ],

  rules: {
    program: ($) => choice(
      // Object definition file (objdef format)
      $.object_definition,
      // Traditional MOO program (list of statements)
      repeat($._statement)
    ),

    // Flat statement structure - using hidden rule to avoid wrapper node
    _statement: ($) => choice(
      // Simple statements (require semicolon)
      $.expression_statement,
      $.assignment_statement,
      $.empty_statement,
      
      // Block statements (no semicolon)
      $.block_statement,
      $.if_statement,
      $.while_statement,
      $.for_statement,
      $.fork_statement,
      $.try_statement,
      $.function_statement,
    ),

    empty_statement: ($) => ";",

    expression_statement: ($) => seq(
      field("expression", $._expression),
      ";"
    ),

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
      field("expression", $._expression),
      ";"
    ),

    const_statement: ($) => seq(
      keyword("const"),
      field("target", choice($.identifier, $.binding_pattern)),
      "=",
      field("expression", $._expression),
      ";"
    ),

    global_statement: ($) => seq(
      keyword("global"),
      field("target", $.identifier),
      optional(seq("=", field("expression", $._expression))),
      ";"
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
      optional(field("value", $._expression))
    )),

    block_statement: ($) => seq(
      keyword("begin"),
      field("body", repeat($._statement)),
      keyword("end")
    ),

    if_statement: ($) => seq(
      keyword("if"),
      "(",
      field("condition", $._expression),
      ")",
      field("then_body", repeat($._statement)),
      field("elseif_clauses", repeat($.elseif_clause)),
      field("else_clause", optional($.else_clause)),
      keyword("endif")
    ),

    elseif_clause: ($) => seq(
      keyword("elseif"),
      "(",
      field("condition", $._expression),
      ")",
      field("body", repeat($._statement))
    ),

    else_clause: ($) => seq(
      keyword("else"),
      field("body", repeat($._statement))
    ),

    for_statement: ($) => seq(
      keyword("for"),
      field("variable", $.identifier),
      keyword("in"),
      field("iterable", choice($.range, $._expression)),
      field("body", repeat($._statement)),
      keyword("endfor")
    ),

    range: ($) => seq(
      "[",
      field("start", $._expression),
      "..",
      field("end", $._expression),
      "]"
    ),

    while_statement: ($) => seq(
      keyword("while"),
      optional(field("label", $.identifier)),
      "(",
      field("condition", $._expression),
      ")",
      field("body", repeat($._statement)),
      keyword("endwhile")
    ),

    fork_statement: ($) => seq(
      keyword("fork"),
      optional(field("label", $.identifier)),
      "(",
      field("expression", $._expression),
      ")",
      field("body", repeat($._statement)),
      keyword("endfork")
    ),

    try_statement: ($) => seq(
      keyword("try"),
      field("body", repeat1($._statement)),
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
      field("body", repeat($._statement))
    ),

    finally_clause: ($) => seq(
      keyword("finally"),
      field("body", repeat($._statement))
    ),

    try_expression: ($) => seq(
      "`",
      field("expression", $._expression),
      "!",
      field("codes", choice(
        keyword("ANY"),
        commaSep1($.error_code)
      )),
      optional(seq("=>", field("fallback", $._expression))),
      "'"
    ),

    // Flattened expression hierarchy
    _expression: ($) => choice(
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
      $.range,
      $.try_expression,
      $.pass_expression,
      
      // Parentheses (creates expression wrapper)
      seq("(", $._expression, ")"),
    ),

    assignment_operation: ($) => prec.right(1, seq(
      field("left", choice(
        $.identifier,
        $.binding_pattern,
        $.property_access,
        $.index_access,
        $.slice
      )),
      "=",
      field("right", $._expression)
    )),

    conditional_operation: ($) => prec.right(2, seq(
      field("condition", $._expression),
      "?",
      field("consequence", $._expression),
      "|",
      field("alternative", $._expression)
    )),

    // Table-driven binary operations
    binary_operation: ($) => choice(
      ...BINARY_OPERATORS.flatMap(([precedence, associativity, ops]) =>
        ops.map(op => {
          const rule = seq(
            field("left", $._expression),
            field("operator", op === 'in' ? keyword('in') : op),
            field("right", $._expression)
          );
          return associativity === 'left' 
            ? prec.left(precedence, rule)
            : prec.right(precedence, rule);
        })
      )
    ),

    unary_operation: ($) => prec.left(10, seq(
      field("operator", choice("!", "-")),
      field("operand", $._expression)
    )),

    property_access: ($) => prec.left(11, seq(
      field("object", $._expression),
      ".",
      field("property", choice(
        $.identifier,
        seq("(", $._expression, ")")
      ))
    )),

    method_call: ($) => prec.left(11, seq(
      field("object", $._expression),
      ":",
      field("method", choice(
        $.identifier,
        seq("(", $._expression, ")")
      )),
      "(",
      field("arguments", optional(commaSep(choice(
        $._expression,
        $.splat_argument
      )))),
      ")"
    )),

    index_access: ($) => prec.left(11, seq(
      field("object", $._expression),
      "[",
      field("index", $._expression),
      "]"
    )),

    slice: ($) => prec.left(11, seq(
      field("object", $._expression),
      "[",
      field("start", $._expression),
      "..",
      field("end", $._expression),
      "]"
    )),

    call: ($) => prec(12, seq(
      field("function", choice(
        $.identifier,
        seq("(", $._expression, ")")
      )),
      "(",
      field("arguments", optional(commaSep(choice(
        $._expression,
        $.splat_argument
      )))),
      ")"
    )),

    splat_argument: ($) => seq("@", field("expression", $._expression)),

    range_comprehension: ($) => seq(
      "{",
      field("expression", $._expression),
      keyword("for"),
      field("variable", $.identifier),
      keyword("in"),
      field("iterable", choice($.range, $._expression)),
      "}"
    ),

    pass_expression: ($) => seq(
      keyword("pass"),
      "(",
      field("arguments", optional(commaSep(choice(
        $._expression,
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
      optional(seq("=", field("default", $._expression)))
    ),

    binding_rest: ($) => seq("@", field("name", $.identifier)),

    list: ($) => prec(2, seq(
      "{",
      field("elements", commaSep(choice(
        $._expression,
        $.scatter_element
      ))),
      "}"
    )),

    scatter_element: ($) => seq("@", field("expression", $._expression)),

    map: ($) => seq(
      "[",
      field("entries", commaSep($.map_entry)),
      "]"
    ),

    map_entry: ($) => seq(
      field("key", $._expression),
      "->",
      field("value", $._expression)
    ),

    flyweight: ($) => prec(15, seq(
      "<",
      field("parent", $._expression),
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
      field("body", $._expression)
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
      field("body", repeat($._statement)),
      keyword("endfn")
    ),

    // Function statements
    function_statement: ($) => seq(
      keyword("fn"),
      field("name", $.identifier),
      "(",
      field("parameters", optional($.lambda_parameters)),
      ")",
      field("body", repeat($._statement)),
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
      field("number", seq(optional("-"), $.integer)),
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
      field("value", $._expression)
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
      field("value", $._expression),
      ";"
    ),

    property_attribute: ($) => seq(
      field("name", $.identifier),
      ":",
      field("value", $._expression)
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
      field("body", repeat($._statement)),
      keyword("endverb", 1)
    ),

    verb_attribute: ($) => prec(1, seq(
      field("name", $.identifier),
      ":",
      field("value", $._expression)
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