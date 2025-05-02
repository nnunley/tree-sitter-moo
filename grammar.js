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
  ],

  rules: {
    program: ($) => repeat($._statement),

    _statement: ($) => choice(
      $._delimited_statement,
      $.block,
      $.if,
      $.while,
      $.for,
      $.fork,
      $.try,
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

    for_range_clause: ($) => seq("[", $._expr, "..", $._expr, "]"),
    for_in_clause: ($) => seq("(", $._expr, ")"),

    while: ($) => seq(
      "while",
      optional($.identifier),
      "(", $._expr, ")",
      repeat($._statement),
      "endwhile"
    ),

    fork: ($) => seq(
      "fork",
      optional($.identifier),
      "(", $._expr, ")",
      repeat($._statement),
      "endfork"
    ),

    try: ($) => seq(
      caseInsensitive("try"),
      field("body", repeat1($._statement)),
      field("except", repeat($.except)),
      field("finally", optional(seq(
       caseInsensitive( "finally"),
        repeat($._statement)
      ))),
      caseInsensitive("endtry")
    ),

    except: ($) => seq(
      caseInsensitive("except"),
        // Handler with identifier
      optional(
        $.identifier,
      ),
      // Handler with error codes
      seq(
        "(",
          $. _try_expr_codes,
         ")",
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
      intersperse($.ERR, ",")
    ),

    local_assignment: ($) => seq(
      caseInsensitive("let"),
      $.assign
    ),

    const_assignment: ($) => seq(
     caseInsensitive( "const"),
      $.assign
    ),

    global_assignment: ($) => seq(
      caseInsensitive("global"),
      $.identifier,
      optional(seq("=", $._expr))
    ),

    _expr: ($) => choice(
      $.break,
      $.continue,
      $.return,
      $.binary_expr,
      $.unary,
      $.list,
      $.map,
      $.flyweight,
      $.try_expr,
      $.pass,
      $.range_comprehension,
      $.property,
      $.verb,
      $.call,
      $.index_single,
      $.index_range,
      $.cond,
      $.assign,
      $.parens,
      // $.in,
      $._atom,
    ),

    // in: ($) => prec.left(1,seq(
    //   $._expr,
    //   "in",
    //   $._expr
    // )),

    parens: ($) => seq(
      "(",
      $._expr,
      ")"
    ),
    // range_comprehension: ($) => seq(

    range_comprehension: ($) => seq(
      "{",
      $._expr,
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

    property: ($) => prec.left(11, choice(
      seq("$", $.identifier),
      seq($._expr, '.',
                         choice($.identifier, seq('(', $._expr, ')'))))),

    verb: ($) => prec(11, seq(
      $._expr,
      ':',
        choice($.identifier, seq('(', $._expr, ')')),
        $.arglist
    )),

    call: ($) => prec(12, seq(
      choice($.identifier, seq('(', $._expr, ')')), $.arglist)),

    _index_expr: ($) => choice("$", $._expr),
    index_single: ($) => seq("[", $._index_expr, "]"),
    index_range: ($) => seq("[", field("from",$._index_expr), "..", field("to", $._index_expr), "]"),

    cond: ($) => seq("?", $._expr, "|", $._expr),

    assign: ($) => prec.right(1, seq(
      choice($.identifier, $.property, $.scatter_assign),
      "=",
      $._expr
    )),

    scatter_assign: ($) => seq(
      "{",
      $.scatter,
      "}",
      "="
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
      optional(seq("=", $._expr))
    ),

    scatter_target: ($) => $.identifier,
    scatter_rest: ($) => seq("@", $.identifier),

    unary: ($) => prec.left(10, choice(
       seq(field("operator", "!"), $._expr),
       seq(field("operator", "-"), $._expr)
    )),

    binary_expr: $ => {
      const operators = {
        1: [['=', 'right']],
        2: [['?'], ['|']],
        3: [['||'], ['&&']],
        4: [['=='], ['!='], ['<'], ['<='], ['>'], ['>='], ['in']],
        5: [['|.'], ['&.'], ['^.']],
        6: [['<<'], ['>>']],
        7: [['+'], ['-']],
        8: [['*'], ['/'], ['%']],
        9: [['^', 'right']]
      };

      const expr = choice(
        ...Object.entries(operators).flatMap(([precedence, ops]) =>
          ops.map(([op, assoc]) => {
            const prec_fn = assoc === 'right' ? prec.right : prec.left;
            const binary_expr = prec_fn(Number(precedence),
              seq(
                field('left', $._expr),
                field('operator', token(op)),
                field('right', $._expr)
              )
            );
            return binary_expr;
          })
        )
      )
      return expr;
    },

    list: ($) => seq(
      "{",
      optional(intersperse($._expr, ",")),
      "}"
    ),

    map: ($) => seq(
      "[",
      optional(intersperse($.pair, ",")),
      "]"
    ),

    pair: ($) => seq(
      $._expr,
      "->",
      $._expr
    ),

    flyweight: ($) => prec.left(12,seq(
      "<",
      field("parent", $._expr),
      field("slots", $.map),
      field("contents", $.list),
      ">"
    )),

    flyweight_slots: ($) => seq(
      "[",
      optional(seq(
        $.identifier,
        "->",
        $._expr,
        repeat(seq(",", $.identifier, "->", $._expr))
      )),
      "]"
    ),


    _expr_list: ($) => seq(
      $._expr,
      repeat(seq(",", $._expr))
    ),

    arglist: ($) => seq("(",
      optional(intersperse(seq(optional("@"), $._expr), ",",)),
      ")"),

    _atom: ($) => prec(0, choice(
      $.INTEGER,
      $.FLOAT,
      $.STRING,
      $.objid,
      $.symbol,
      $.boolean,
      $.ERR,
      $.identifier,
    )),

    range_end: ($) => "$",
    symbol: ($) => seq("'", $.identifier),
    boolean: ($) => choice("true", "false"),
    objid: ($) => seq("#", optional("-"), choice($.INTEGER, $.STRING)),

    identifier: ($) => token(/[A-Za-z_][A-Za-z0-9_]*/),
    INTEGER: ($) => token(/[+-]?[0-9]+/),
    FLOAT: ($) => {
      // Define a regex pattern that can properly handle all floating point formats
      // Including negatives and scientific notation
      return token(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    },

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

      return choice(...errorCodes.map(err => {
        // Create a case-insensitive regex for each error code
        return token(alias(caseInsensitive(err), err));
      }));
    },

    comment: ($) => choice(
      seq("//", /.*/),
      seq(
        "/*",
        /[^*]*\*+([^/*][^*]*\*+)*/,
        "/"
      )
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

function commaSep1(rule) {
  return intersperse(rule, ",");
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

