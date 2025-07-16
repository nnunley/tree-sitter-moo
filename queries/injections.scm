; injections.scm - Language injection queries for MOO

; =============================================================================
; SQL INJECTIONS
; =============================================================================

; Common SQL query patterns in MOO strings
; Match strings that look like SQL queries (SELECT, INSERT, UPDATE, DELETE)
((string) @injection.content
  (#match? @injection.content "^[\"']\\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\\s+")
  (#set! injection.language "sql"))

; SQL in specific function calls (if MOO has db_query or similar)
((call
  function: (identifier) @_func
  arguments: (expression (string) @injection.content))
  (#match? @_func "^(db_query|sql_query|execute_sql)$")
  (#set! injection.language "sql"))

; =============================================================================
; REGULAR EXPRESSIONS
; =============================================================================

; Regex patterns in match/regexp function calls
((call
  function: (identifier) @_func
  arguments: (expression (string) @injection.content))
  (#match? @_func "^(match|regexp|regex_match|pattern_match)$")
  (#set! injection.language "regex"))

; Regex in specific verb calls that are commonly used for pattern matching
((method_call
  method: (identifier) @_method
  arguments: (expression (string) @injection.content))
  (#match? @_method "^(match|find_pattern|grep)$")
  (#set! injection.language "regex"))

; =============================================================================
; MOO CODE INJECTIONS
; =============================================================================

; eval() or eval_str() function calls - MOO code in strings
((call
  function: (identifier) @_func
  arguments: (expression (string) @injection.content))
  (#match? @_func "^(eval|eval_str|compile|execute)$")
  (#set! injection.language "moo"))

; MOO code in verb_code or similar contexts
((method_call
  method: (identifier) @_method
  arguments: (expression (string) @injection.content))
  (#match? @_method "^(set_verb_code|compile_verb|add_verb)$")
  (#set! injection.language "moo"))

; =============================================================================
; JSON INJECTIONS
; =============================================================================

; JSON parsing functions (if MOO has JSON support)
((call
  function: (identifier) @_func
  arguments: (expression (string) @injection.content))
  (#match? @_func "^(parse_json|json_decode|from_json)$")
  (#set! injection.language "json"))

; JSON in specific contexts
((string) @injection.content
  (#match? @injection.content "^[\"']\\s*\\{.*\\}\\s*[\"']$")
  (#match? @injection.content "\"\\s*:\\s*")
  (#set! injection.language "json"))

; =============================================================================
; COMMENTS
; =============================================================================

; Markdown in multi-line comments (for documentation)
((comment) @injection.content
  (#match? @injection.content "^/\\*\\*")
  (#set! injection.language "markdown"))

; =============================================================================
; PROPERTY VALUES
; =============================================================================

; HTML in string properties that look like HTML content
((property_definition
  name: (identifier) @_prop
  value: (expression (string) @injection.content))
  (#match? @_prop "^(html|template|page_content|description)$")
  (#match? @injection.content "<[a-zA-Z]+.*>")
  (#set! injection.language "html"))

; CSS in style-related properties
((property_definition
  name: (identifier) @_prop
  value: (expression (string) @injection.content))
  (#match? @_prop "^(style|css|stylesheet)$")
  (#set! injection.language "css"))

; =============================================================================
; ESCAPE SEQUENCES
; =============================================================================

; Note: Tree-sitter will automatically handle escape sequences in strings,
; but we document the pattern here for completeness

; MOO supports standard escape sequences in strings:
; \" - double quote
; \\ - backslash  
; \n - newline
; \r - carriage return
; \t - tab
; \xHH - hex escape
; \ooo - octal escape (in some implementations)