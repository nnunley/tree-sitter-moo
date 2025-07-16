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

module.exports = grammar({
  name: "moo",

  extras: ($) => [
    /\s/,
    $.comment
  ],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.scatter_target, $._atom],
    [$.parameter, $.scatter_element],
    [$.scatter_element, $.scatter_rest],
    [$.scatter_rest, $._atom],
    [$.list, $.lambda_expr],
    [$.scatter_pattern, $.lambda_params],
  ],

  rules: {
    program: ($) => choice(
      // Object definition file (objdef format)
      $.object_definition,
      // Traditional MOO program (list of statements)
      repeat($._statement)
    ),

    _statement: ($) => choice(
      $._delimited_statement,
      $.block,
      $.if,
      $.while,
      $.for,
      $.fork,
      $.try,
      $.fn_statement,
    ),

    _delimited_statement: ($) => seq(
      choice(
        $._expr,

        $.local_assignment,
        $.const_assignment,
        $.global_assignment
      ),
      ";"
    ),

    break: ($) => prec.right(1, seq("break", optional(field("label", $.identifier)))),
    continue: ($) => prec.right(1, seq("continue", optional(field("label", $.identifier)))),
    return: ($) => prec.right(1, seq(
      "return",
      optional(field("value", $._expr))
    )),
    block: ($) => seq("begin", field("body", repeat($._statement)), "end"),

    if: ($) => seq(
      "if",
      "(",
      field("condition", $._expr),
      ")",
      field("body", repeat($._statement)),
      field("elseif_clauses", repeat($._elseif)),
      field("else_clause", optional($._else)),
      "endif"
    ),

    _elseif: ($) => seq(
      "elseif",
      "(",
      field("condition", $._expr),
      ")",
      field("body", repeat($._statement))
    ),

    _else: ($) => seq(
      "else",
      field("body", repeat($._statement))
    ),

    for: ($) => seq(
      "for",
      field("variable", $.identifier),
      "in",
      field("iterable", $.for_iterable),
      field("body", repeat($._statement)),
      "endfor"
    ),

    for_iterable: ($) => choice(
      seq("[", field("start", $._expr), token(prec(1, "..")), field("end", $._expr), "]"),
      seq("(", field("expression", $._expr), ")")
    ),

    while: ($) => seq(
      "while",
      optional(field("label", $.identifier)),
      "(",
      field("condition", $._expr),
      ")",
      field("body", repeat($._statement)),
      "endwhile"
    ),

    fork: ($) => seq(
      "fork",
      optional(field("label", $.identifier)),
      "(",
      field("expression", $._expr),
      ")",
      field("body", repeat($._statement)),
      "endfork"
    ),

    try: ($) => seq(
      keyword("try"),
      field("body", repeat1($._statement)),
      field("except", repeat($.except)),
      field("finally", optional(seq(
        keyword("finally"),
        field("body", repeat($._statement))
      ))),
      keyword("endtry")
    ),

    except: ($) => seq(
      keyword("except"),
      choice(
        // Handler with identifier and codes
        seq(
          field("variable", $.identifier),
          "(",
          field("codes", $._try_expr_codes),
          ")"
        ),
        // Handler with just codes
        seq(
          "(",
          field("codes", $._try_expr_codes),
          ")"
        )
      ),
      field("body", repeat($._statement))
    ),

    try_expr: ($) => seq(
      "`",
      field("expression", $._expr),
      "!",
      field("codes", $._try_expr_codes),
      optional(seq("=>", field("fallback", $._expr))),
      "'"
    ),

    _try_expr_codes: ($) => choice(
      caseInsensitive("ANY"),
      seq($.ERR, repeat(seq(",", $.ERR)))
    ),

    local_assignment: ($) => seq(
      caseInsensitive("let"),
      field("target", choice($.identifier, $.scatter_pattern)),
      "=",
      field("value", $._expr)
    ),

    const_assignment: ($) => seq(
      caseInsensitive("const"),
      field("target", choice($.identifier, $.scatter_pattern)),
      "=",
      field("value", $._expr)
    ),

    global_assignment: ($) => seq(
      caseInsensitive("global"),
      field("name", $.identifier),
      optional(seq("=", field("value", $._expr)))
    ),

    _expr: ($) => choice(
      $.assignment_expr,
      $.conditional_expr,
      $.binary_expr,
      $.unary_expr,
      $.property_access,
      $.method_call,
      $.index_access,
      $.slice,
      $.call,
      $._primary_expr,
      $.break,
      $.continue,
      $.return,
    ),

    // Only create assignment_expr when there's actually an assignment
    assignment_expr: ($) => prec.right(1, seq(
      field("left", choice($.identifier, $.scatter_pattern)),
      "=",
      field("right", $._expr)
    )),

    // Only create conditional_expr for ternary operator
    conditional_expr: ($) => prec.right(2, seq(
      field("condition", $._expr),
      "?",
      field("consequence", $._expr),
      "|",
      field("alternative", $._expr)
    )),

    // Use precedence for binary operators instead of nesting
    binary_expr: ($) => choice(
      prec.left(3, seq(field("left", $._expr), field("operator", "||"), field("right", $._expr))),
      prec.left(3, seq(field("left", $._expr), field("operator", "&&"), field("right", $._expr))),
      prec.left(4, seq(field("left", $._expr), field("operator", choice("==", "!=")), field("right", $._expr))),
      prec.left(4, seq(field("left", $._expr), field("operator", choice("<", "<=", ">", ">=", "in")), field("right", $._expr))),
      prec.left(5, seq(field("left", $._expr), field("operator", choice("|.", "&.", "^.")), field("right", $._expr))),
      prec.left(6, seq(field("left", $._expr), field("operator", choice("<<", ">>")), field("right", $._expr))),
      prec.left(7, seq(field("left", $._expr), field("operator", choice("+", "-")), field("right", $._expr))),
      prec.left(8, seq(field("left", $._expr), field("operator", choice("*", "/", "%")), field("right", $._expr))),
      prec.right(9, seq(field("left", $._expr), field("operator", "^"), field("right", $._expr)))
    ),

    // Only create unary_expr when there's actually a unary operator
    unary_expr: ($) => prec.left(10, seq(
      field("operator", choice("!", "-")), 
      field("operand", $._expr)
    )),

    property_access: ($) => prec.left(11, seq(
      field("object", $._expr),
      ".",
      field("property", choice($.identifier, seq("(", $._expr, ")")))
    )),

    method_call: ($) => prec.left(11, seq(
      field("object", $._expr),
      ":",
      field("method", choice($.identifier, seq("(", $._expr, ")"))),
      field("arguments", $.arglist)
    )),

    index_access: ($) => prec.left(11, seq(
      field("object", $._expr),
      "[",
      field("index", $._index_expr),
      "]"
    )),

    slice: ($) => prec.left(11, seq(
      field("object", $._expr),
      "[",
      field("from", $._index_expr),
      token(prec(1, "..")),
      field("to", $._index_expr),
      "]"
    )),

    call: ($) => prec(12, seq(
      field("function", choice($.identifier, seq("(", $._expr, ")"))),
      field("arguments", $.arglist)
    )),

    _primary_expr: ($) => choice(
      $.flyweight,
      $._atom,
      $.list,
      $.map,
      $.try_expr,
      $.pass,
      $.lambda_expr,
      $.fn_expr,
      $.range_comprehension,
      $.sysprop,
      seq("(", $._expr, ")"),
    ),

    // in: ($) => prec.left(1,seq(
    //   $._expr,
    //   "in",
    //   $._expr
    // )),

    // range_comprehension: ($) => seq(

    range_comprehension: ($) => seq(
      "{",
      field("expression", $._expr),
      "for",
      field("variable", $.identifier),
      "in",
      field("iterable", $.for_iterable),
      "}"
    ),

    pass: ($) => seq(
      caseInsensitive("pass"),
      "(",
      field("arguments", optional(commaSep($.argument))),
      ")"
    ),

    _index_expr: ($) => choice("$", $._expr),

    scatter_pattern: ($) => seq(
      "{",
      field("parameters", $.parameter_list),
      "}"
    ),

    // Unified parameter list for both scatter patterns and lambda/function params
    parameter_list: ($) => seq(
      $.parameter,
      repeat(seq(",", $.parameter))
    ),

    parameter: ($) => choice(
      $.scatter_optional,
      $.scatter_target,
      $.scatter_rest
    ),

    scatter_optional: ($) => seq(
      "?",
      field("name", $.identifier),
      optional(seq("=", field("default", $._expr)))
    ),

    scatter_target: ($) => field("name", $.identifier),
    scatter_rest: ($) => seq("@", field("name", $.identifier)),



    list: ($) => prec(2, seq(
      "{",
      field("elements", commaSep($._list_element)),
      "}"
    )),

    _list_element: ($) => choice(
      $._expr,
      $.scatter_element
    ),

    scatter_element: ($) => seq("@", field("expression", $._expr)),

    map: ($) => seq(
      "[",
      field("entries", commaSep($.pair)),
      "]"
    ),

    pair: ($) => seq(
      field("key", $._expr),
      "->",
      field("value", $._expr)
    ),

    flyweight: ($) => prec(15, seq(
      token("<"),
      field("parent", $._expr),
      optional(seq(",", field("properties", $.map))),
      optional(seq(",", field("values", $.list))),
      token(">")
    )),


    _expr_list: ($) => seq(
      $._expr,
      repeat(seq(",", $._expr))
    ),

    arglist: ($) => seq(
      "(",
      field("arguments", optional(commaSep($.argument))),
      ")"
    ),

    argument: ($) => choice(
      field("value", $._expr),
      seq("@", field("splat", $._expr))
    ),

    _atom: ($) => prec(0, choice(
      $.INTEGER,
      $.FLOAT,
      $.STRING,
      $.objid,
      $.symbol,
      $.boolean,
      $.ERR,
      $.range_end,
      $.identifier,
    )),

    range_end: ($) => prec(1, "$"),
    symbol: ($) => seq("'", field("name", $.identifier)),
    boolean: ($) => choice("true", "false"),
    objid: ($) => seq("#", choice(
      field("number", seq(optional("-"), $.INTEGER)),
      field("symbol", $.identifier)
    )),
    sysprop: ($) => seq("$", field("name", $.identifier)),

    identifier: ($) => token(/[A-Za-z_][A-Za-z0-9_]*/),
    INTEGER: ($) => token(/[+-]?[0-9]+/),
    FLOAT: ($) => token(choice(
      // Scientific notation without decimal point
      /[+-]?\d+[eE][+-]?\d+/,
      // Decimal with digits after point
      /[+-]?\d+\.\d+(?:[eE][+-]?\d+)?/,
      // Leading decimal point
      /[+-]?\.\d+(?:[eE][+-]?\d+)?/
    )),

    STRING: ($) => /"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'/,

    ERR: ($) => {
      const errorCodes = [
        "E_NONE",
        "E_TYPE",
        "E_DIV",
        "E_PERM",
        "E_PROPNF",
        "E_VERBNF",
        "E_VARNF",
        "E_INVIND",
        "E_RECMOVE",
        "E_MAXREC",
        "E_RANGE",
        "E_ARGS",
        "E_NACC",
        "E_INVARG",
        "E_QUOTA",
        "E_FLOAT",
        "E_ASSERT",
      ];

      return choice(...errorCodes.map(err => keyword(err)));
    },

    comment: ($) => choice(
      seq("//", /.*/),
      seq(
        "/*",
        /[^*]*\*+([^/*][^*]*\*+)*/,
        "/"
      )
    ),

    // Object definition syntax extension
    object_definition: ($) => seq(
      keyword("object", 1),
      field("name", $.identifier),
      repeat($._object_member),
      optional(keyword("endobject", 1))
    ),

    _object_member: ($) => choice(
      $.object_property,
      $.property_definition,
      $.verb_definition
    ),

    object_property: ($) => prec.left(seq(
      field("name", $.identifier),
      ":",
      field("value", $._expr)
    )),

    property_definition: ($) => seq(
      token(prec(1, caseInsensitive("property"))),
      field("name", $.identifier),
      optional($.property_attrs),
      "=",
      field("value", $._expr),
      ";"
    ),

    property_attrs: ($) => seq(
      "(",
      commaSep1(seq(
        field("name", $.identifier),
        ":",
        field("value", $._expr)
      )),
      ")"
    ),

    verb_definition: ($) => seq(
      token(prec(1, caseInsensitive("verb"))),
      field("name", choice(
        $.identifier,
        $.STRING
      )),
      $.verb_args,
      repeat($.verb_attr),
      repeat($._statement),
      token(prec(1, caseInsensitive("endverb")))
    ),

    verb_args: ($) => seq(
      "(",
      field("dobj", $.identifier),
      field("prep", $.identifier),
      field("iobj", $.identifier),
      ")"
    ),

    verb_attr: ($) => prec(1, seq(
      field("name", $.identifier),
      ":",
      field("value", $._expr)
    )),

    // Lambda expressions: {x, y} => expr
    lambda_expr: ($) => prec.right(0, seq(
      "{",
      field("params", optional($.lambda_params)),
      "}",
      "=>",
      field("body", $._expr)
    )),

    lambda_params: ($) => $.parameter_list,

    // Function expressions: fn(params) statements endfn
    fn_expr: ($) => seq(
      "fn",
      "(",
      field("params", optional($.lambda_params)),
      ")",
      field("body", repeat($._statement)),
      "endfn"
    ),

    // Function statements: fn name(params) statements endfn
    fn_statement: ($) => seq(
      "fn",
      field("name", $.identifier),
      "(",
      field("params", optional($.lambda_params)),
      ")",
      field("body", repeat($._statement)),
      "endfn"
    ),


  }
});

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

