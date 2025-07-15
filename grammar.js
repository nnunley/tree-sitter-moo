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
    [$.list, $.lambda_expr],
    [$.list, $.range_comprehension],
    [$._scatter_item, $.lambda_param],
    [$.conditional_expr],
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

    break: ($) => prec.right(1, seq("break", optional($.identifier))),
    continue: ($) => prec.right(1, seq("continue", optional($.identifier))),
    return: ($) => prec.right(1, seq(
      "return",
      optional($._expr)
    )),
    block: ($) => seq("begin", repeat($._statement), "end"),

    if: ($) => seq(
      "if",
      "(", $._expr, ")",
      repeat($._statement),
      repeat($._elseif),
      optional($._else),
      "endif"
    ),

    _elseif: ($) => seq(
      "elseif",
      "(", $._expr, ")",
      repeat($._statement)
    ),

    _else: ($) => seq(
      "else",
      repeat($._statement)
    ),

    for: ($) => seq(
      "for",
      $.identifier,
      "in",
      choice(
        $.for_range_clause,
        $.for_in_clause
      ),
      repeat($._statement),
      "endfor"
    ),

    for_range_clause: ($) => seq("[", $._expr, token(prec(1, "..")), $._expr, "]"),
    for_in_clause: ($) => seq("(", $._expr, ")"),

    while: ($) => seq(
      "while",
      optional(field("label", $.identifier)),
      "(", $._expr, ")",
      repeat($._statement),
      "endwhile"
    ),

    fork: ($) => seq(
      "fork",
      optional(field("label", $.identifier)),
      "(", $._expr, ")",
      repeat($._statement),
      "endfork"
    ),

    try: ($) => seq(
      keyword("try"),
      field("body", repeat1($._statement)),
      field("except", repeat($.except)),
      field("finally", optional(seq(
        keyword("finally"),
        repeat($._statement)
      ))),
      keyword("endtry")
    ),

    except: ($) => seq(
      keyword("except"),
      choice(
        // Handler with identifier and codes
        seq(
          $.identifier,
          "(",
          $._try_expr_codes,
          ")"
        ),
        // Handler with just codes
        seq(
          "(",
          $._try_expr_codes,
          ")"
        )
      ),
      repeat($._statement)
    ),

    try_expr: ($) => seq(
      "`",
      $._expr,
      "!",
      $._try_expr_codes,
      optional(seq("=>", $._expr)),
      "'"
    ),

    _try_expr_codes: ($) => choice(
      caseInsensitive("ANY"),
      seq($.ERR, repeat(seq(",", $.ERR)))
    ),

    local_assignment: ($) => seq(
      caseInsensitive("let"),
      choice($.identifier, $.scatter_pattern),
      "=",
      $.assignment_expr
    ),

    const_assignment: ($) => seq(
      caseInsensitive("const"), 
      choice($.identifier, $.scatter_pattern),
      "=",
      $.assignment_expr
    ),

    global_assignment: ($) => seq(
      caseInsensitive("global"),
      $.identifier,
      optional(seq("=", $.assignment_expr))
    ),

    _expr: ($) => choice(
      $.assignment_expr,
      $.break,
      $.continue,
      $.return,
    ),

    assignment_expr: ($) => choice(
      $.conditional_expr,
      prec.right(1, seq(
        choice($.identifier, $.scatter_pattern),
        "=",
        $.assignment_expr
      ))
    ),

    conditional_expr: ($) => choice(
      $.binary_expr,
      $.unary_expr,
      prec.right(0, seq($.binary_expr, "?", $.assignment_expr, "|", $.conditional_expr))
    ),

    binary_expr: ($) => choice(
      prec.left(3, seq(field("left", choice($.binary_expr, $.unary_expr)), field("operator", "||"), field("right", choice($.binary_expr, $.unary_expr)))),
      prec.left(3, seq(field("left", choice($.binary_expr, $.unary_expr)), field("operator", "&&"), field("right", choice($.binary_expr, $.unary_expr)))),
      prec.left(4, seq(field("left", choice($.binary_expr, $.unary_expr)), field("operator", choice("==", "!=")), field("right", choice($.binary_expr, $.unary_expr)))),
      prec.left(4, seq(field("left", choice($.binary_expr, $.unary_expr)), field("operator", choice("<", "<=", ">", ">=", "in")), field("right", choice($.binary_expr, $.unary_expr)))),
      prec.left(5, seq(field("left", choice($.binary_expr, $.unary_expr)), field("operator", choice("|.", "&.", "^.")), field("right", choice($.binary_expr, $.unary_expr)))),
      prec.left(6, seq(field("left", choice($.binary_expr, $.unary_expr)), field("operator", choice("<<", ">>")), field("right", choice($.binary_expr, $.unary_expr)))),
      prec.left(7, seq(field("left", choice($.binary_expr, $.unary_expr)), field("operator", choice("+", "-")), field("right", choice($.binary_expr, $.unary_expr)))),
      prec.left(8, seq(field("left", choice($.binary_expr, $.unary_expr)), field("operator", choice("*", "/", "%")), field("right", choice($.binary_expr, $.unary_expr)))),
      prec.right(9, seq(field("left", choice($.binary_expr, $.unary_expr)), field("operator", "^"), field("right", choice($.binary_expr, $.unary_expr))))
    ),

    unary_expr: ($) => choice(
      $.postfix_expr,
      prec.left(10, seq(field("operator", choice("!", "-")), field("operand", $.unary_expr)))
    ),

    postfix_expr: ($) => choice(
      $.primary_expr,
      prec.left(11, seq($.postfix_expr, ".", choice($.identifier, seq("(", $.assignment_expr, ")")))),
      prec.left(11, seq($.postfix_expr, ":", choice($.identifier, seq("(", $.assignment_expr, ")")), $.arglist)),
      prec.left(11, seq($.postfix_expr, "[", $._index_expr, "]")),
      prec.left(11, seq($.postfix_expr, "[", field("from", $._index_expr), token(prec(1, "..")), field("to", $._index_expr), "]")),
      prec(12, seq(choice($.identifier, seq("(", $.assignment_expr, ")")), $.arglist))
    ),

    primary_expr: ($) => choice(
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
      $.parens,
    ),

    // in: ($) => prec.left(1,seq(
    //   $._expr,
    //   "in",
    //   $._expr
    // )),

    parens: ($) => seq(
      "(",
      $.assignment_expr,
      ")"
    ),
    // range_comprehension: ($) => seq(

    range_comprehension: ($) => seq(
      "{",
      $.assignment_expr,
      "for",
      $.identifier,
      "in",
      choice($.for_range_clause, $.for_in_clause),
      "}"
    ),

    pass: ($) => seq(
      caseInsensitive("pass"),
      "(",
      optional($._expr_list),
      ")"
    ),

    _index_expr: ($) => choice("$", $.assignment_expr),

    scatter_pattern: ($) => seq(
      "{",
      $.scatter,
      "}"
    ),

    scatter: ($) => seq(
      $._scatter_item,
      repeat(seq(",", $._scatter_item))
    ),

    _scatter_item: ($) => choice(
      $.scatter_optional,
      $.scatter_target,
      $.scatter_rest
    ),

    scatter_optional: ($) => seq(
      "?",
      $.identifier,
      optional(seq("=", $.assignment_expr))
    ),

    scatter_target: ($) => $.identifier,
    scatter_rest: ($) => seq("@", $.identifier),



    list: ($) => seq(
      "{",
      optional(intersperse($.assignment_expr, ",")),
      "}"
    ),

    map: ($) => seq(
      "[",
      optional(intersperse($.pair, ",")),
      "]"
    ),

    pair: ($) => seq(
      $.assignment_expr,
      "->",
      $.assignment_expr
    ),

    flyweight: ($) => prec(15, seq(
      token("<"),
      field("parent", $.unary_expr),
      optional(seq(",", $.map)),
      optional(seq(",", $.list)),
      token(">")
    )),


    _expr_list: ($) => seq(
      $.assignment_expr,
      repeat(seq(",", $.assignment_expr))
    ),

    arglist: ($) => seq("(",
      optional(intersperse(seq(optional("@"), $.assignment_expr), ",",)),
      ")"),

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
    symbol: ($) => seq("'", $.identifier),
    boolean: ($) => choice("true", "false"),
    objid: ($) => seq("#", optional("-"), choice($.INTEGER, $.STRING)),
    sysprop: ($) => seq("$", $.identifier),

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
        $.identifier,
        ":",
        $._expr
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
      $.identifier,
      ":",
      $._expr
    )),

    // Lambda expressions: {x, y} => expr
    lambda_expr: ($) => prec.right(13, seq(
      "{",
      field("params", optional($.lambda_params)),
      "}",
      "=>",
      field("body", $.assignment_expr)
    )),

    lambda_params: ($) => seq(
      $.lambda_param,
      repeat(seq(",", $.lambda_param))
    ),

    lambda_param: ($) => choice(
      $.scatter_target,
      $.scatter_optional,
      $.scatter_rest
    ),

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
function intersperse(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

// Helper to create an aliased case-insensitive keyword
function keyword(word, precedence = null) {
  const pattern = caseInsensitive(word);
  const token_pattern = precedence !== null ? token(prec(precedence, pattern)) : pattern;
  return alias(token_pattern, word);
}

function commaSep1(rule) {
  return intersperse(rule, ",");
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

