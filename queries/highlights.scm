; Literals
(integer) @number
(float) @number.float
(string) @string
(boolean) @boolean

; Identifiers
(identifier) @variable

; Object references
(object_id) @constant.object

; Error codes
(error_code) @constant.error

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
(binding_pattern) @pattern.binding
(binding_pattern name: (identifier) @variable.parameter)
(binding_optional name: (identifier) @variable.parameter)
(binding_rest name: (identifier) @variable.parameter)

; Property access
(property_access
  property: (identifier) @property)

; Method calls  
(method_call
  method: (identifier) @method)

; Function calls
(call
  function: (identifier) @function)

; System properties
(system_property 
  "$"
  (identifier) @variable.system)

; Binary expression operators (with fields)
(binary_operation
  operator: _ @operator)

; Unary expression operators (with fields)  
(unary_operation
  operator: _ @operator)