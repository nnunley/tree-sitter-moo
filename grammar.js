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
    [$.prop, $.verb],
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
        $.break,
        $.continue,
        $.return,
        $.local_assignment,
        $.const_assignment,
        $.global_assignment
      ),
      ";"
    ),

    break: ($) => seq("break", optional($.identifier)),
    continue: ($) => seq("continue", optional($.identifier)),
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
      "try",
      field("body", repeat1($._statement)),
      field("excepts", repeat($.except)),
      field("finally", optional(seq(
        "finally",
        repeat1($._statement)
      ))),
      "endtry"
    ),

    except: ($) => seq(
      "except",
      choice(
        // Handler with identifier
        seq(
          $.identifier,
        ),
        // Handler with error codes
        seq(
          "(",
          choice("ANY", repeat($.error_codes)),
          ")",
        ),
        seq(
          repeat1($._statement)
        )
      )
    ),

    error_codes: ($) => choice(
      "any",
      commaSep1($.ERR)
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
      "ANY",
      seq(
        $._expr_list
      )
    ),

    local_assignment: ($) => seq(
      "let",
      choice(
        $.local_assign_scatter,
        $.local_assign_single
      )
    ),

    local_assign_single: ($) => seq(
      $.identifier,
      optional(seq("=", $._expr))
    ),

    local_assign_scatter: ($) => seq(
      $.scatter_assign,
      $._expr
    ),

    const_assignment: ($) => seq(
      "const",
      choice(
        $.const_assign_scatter,
        $.const_assign_single
      )
    ),

    const_assign_single: ($) => seq(
      $.identifier,
      optional(seq("=", $._expr))
    ),

    const_assign_scatter: ($) => seq(
      $.scatter_assign,
      $._expr
    ),

    global_assignment: ($) => seq(
      "global",
      $.identifier,
      optional(seq("=", $._expr))
    ),

    _expr: ($) => choice(
      $._atom,
      $.binary_expr,
      $.unary,
      $.list,
      $.map,
      $.flyweight,
      $.try_expr,
      $.pass,
      $.range_comprehension,
      $.prop,
      $.verb,
      $.index_single,
      $.index_range,
      $.cond,
      $.assign,
    ),

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
      "pass",
      "(",
      optional($._expr_list),
      ")"
    ),

    prop: ($) => choice(
      seq(".", $.identifier),
      seq(".", "(", $._expr, ")")
    ),

    verb: ($) => prec(11, seq(
      ":",
      choice(
        $.identifier,
        seq("(", $._expr, ")")
      ),
      $.arglist
    )),

    index_single: ($) => seq("[", $._expr, "]"),
    index_range: ($) => seq("[", $._expr, "..", $._expr, "]"),
    cond: ($) => seq("?", $._expr, "|", $._expr),

    assign: ($) => prec.right(1, seq(
      choice($.identifier, $.prop, $.scatter_assign),
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

    unary: ($) => choice(
      prec(10, seq("!", $._expr)),
      prec(10, seq("-", $._expr))
    ),

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

      return choice(
        ...Object.entries(operators).flatMap(([precedence, ops]) =>
          ops.map(([op, associativity]) => {
            const prec_fn = associativity === 'right' ? prec.right : prec.left;
            return prec_fn(Number(precedence),
              seq(
                field('left', $._expr),
                field('operator', token(op)),
                field('right', $._expr)
              )
            );
          })
        )
      )
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

    flyweight: ($) => seq(
      "<",
      field("parent", $._expr),
      field("slots", $.map),
      field("contents", $.list),
      ">"
    ),

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

    arglist: ($) => seq("(", $._expr_list, ")"),

    _atom: ($) => prec(0, choice(
      $.identifier,
      $.INTEGER,
      $.FLOAT,
      $.STRING,
      $.objid,
      $.sysprop,
      $.symbol,
      $.boolean,
      $.range_end
    )),

    range_end: ($) => "$",
    symbol: ($) => seq("'", $.identifier),
    boolean: ($) => choice("true", "false"),
    objid: ($) => seq("#", optional("-"), $.INTEGER),
    sysprop: ($) => seq("$", $.identifier),

    identifier: ($) => /[A-Za-z_][A-Za-z0-9_]*/,
    INTEGER: ($) => /[+-]?[0-9]+/,
    FLOAT: ($) => {
      // Define a regex pattern that can properly handle all floating point formats
      // Including negatives and scientific notation
      return token(/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    },

    STRING: ($) => /"[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*'/,

    ERR: ($) => {
      const errorCodes = [
        "E_NONE", "E_TYPE", "E_DIV", "E_PERM", "E_PROPNF", "E_VERBNF",
        "E_VARNF", "E_INVIND", "E_RECMOVE", "E_MAXREC", "E_RANGE", "E_ARGS",
        "E_NACC", "E_INVARG", "E_QUOTA", "E_FLOAT"
      ];

      return choice(...errorCodes.map(err => {
        // Create a case-insensitive regex for each error code
        const pattern = err.split('').map(c =>
          c.match(/[a-zA-Z]/) ? `[${c.toLowerCase()}${c.toUpperCase()}]` : c
        ).join('');
        return alias(new RegExp(pattern), err);
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

function intersperse(rule, separator) {
  return seq(rule, repeat(seq(separator, rule)));
}

function commaSep1(rule) {
  return intersperse(rule, ",");
}

function commaSep(rule) {
  return optional(commaSep1(rule));
}

