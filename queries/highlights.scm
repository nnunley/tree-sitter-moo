; Literals
(INTEGER) @number
(FLOAT) @number.float
(STRING) @string
(boolean) @boolean

; Identifiers
(identifier) @variable

; Object references
(objid) @constant.object

; Error codes
(ERR) @constant.error

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "^"
  "=="
  "!="
  "<"
  "<="
  ">"
  ">="
  "&&"
  "||"
  "!"
  "&."
  "|."
  "^."
  "<<"
  ">>"
  "in"
] @operator

; Assignment
"=" @operator.assignment

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ";"
  ","
  "."
  ":"
  "?"
  "|"
  "->"
  ".."
] @punctuation.delimiter

; Special symbols
"$" @symbol
"'" @symbol
"#" @symbol
"@" @symbol.splice

; Comments
(comment) @comment

; Function keywords
["fn" "endfn"] @keyword.function

; Object definition keywords
["object" "endobject"] @keyword

; Control flow keywords  
[
  "if"
  "else"
  "elseif"
  "endif"
  "while"
  "endwhile"
  "for"
  "endfor"
  "fork"
  "endfork"
  "try"
  "except"
  "finally"
  "endtry"
  "break"
  "continue"
  "return"
] @keyword.control

; Lambda arrow
"=>" @operator.lambda

; For/in keywords in comprehensions  
("for" @keyword.control
 "in" @keyword.control) @keyword.comprehension

; Scatter assignment
(scatter_pattern) @pattern.scatter
(scatter_target (identifier) @variable.parameter)
(scatter_optional (identifier) @variable.parameter)
(scatter_rest (identifier) @variable.parameter)

; Property access
(postfix_expr
  (postfix_expr)
  "."
  (identifier) @property)

; Method calls  
(postfix_expr
  (postfix_expr)
  ":"
  (identifier) @method
  (arglist))

; Function calls
(postfix_expr
  (identifier) @function
  (arglist))

; System properties
(sysprop 
  "$"
  (identifier) @variable.system)

; Binary expression operators (with fields)
(binary_expr
  operator: _ @operator)

; Unary expression operators (with fields)  
(unary_expr
  operator: _ @operator)