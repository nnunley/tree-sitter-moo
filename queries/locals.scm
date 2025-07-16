; locals.scm - Scope and variable binding queries for MOO

; =============================================================================
; SCOPES
; =============================================================================

; Program root is a scope
(program) @scope

; Function definitions create new scopes
(function_statement
  body: (_) @scope)

(function_expression
  body: (_) @scope)

; Lambda expressions create new scopes
(lambda
  body: (_) @scope)

; Control structures create new scopes
(block_statement) @scope

(if_statement
  then_body: (_) @scope)

(while_statement
  body: (_) @scope)

(for_statement
  body: (_) @scope)

(fork_statement
  body: (_) @scope)

(try_statement
  body: (_) @scope)

(except_clause
  body: (_) @scope)

; Object definitions create new scopes
(object_definition) @scope

; Verb definitions create new scopes  
(verb_definition) @scope

; =============================================================================
; DEFINITIONS
; =============================================================================

; Let statements
(let_statement
  target: (identifier) @definition.var)

(let_statement
  target: (binding_pattern
    name: (identifier) @definition.var))

(let_statement
  target: (binding_pattern
    (binding_optional
      name: (identifier) @definition.var)))

(let_statement
  target: (binding_pattern
    (binding_rest
      name: (identifier) @definition.var)))

; Const statements
(const_statement
  target: (identifier) @definition.constant)

(const_statement
  target: (binding_pattern
    name: (identifier) @definition.constant))

(const_statement
  target: (binding_pattern
    (binding_optional
      name: (identifier) @definition.constant)))

(const_statement
  target: (binding_pattern
    (binding_rest
      name: (identifier) @definition.constant)))

; Global statements
(global_statement
  target: (identifier) @definition.var)

; Function definitions
(function_statement
  name: (identifier) @definition.function)

; Parameter definitions in functions
(function_statement
  parameters: (lambda_parameters
    (identifier) @definition.parameter))

(function_statement
  parameters: (lambda_parameters
    (binding_optional
      name: (identifier) @definition.parameter)))

(function_statement
  parameters: (lambda_parameters
    (binding_rest
      name: (identifier) @definition.parameter)))

(function_expression
  parameters: (lambda_parameters
    (identifier) @definition.parameter))

(function_expression
  parameters: (lambda_parameters
    (binding_optional
      name: (identifier) @definition.parameter)))

(function_expression
  parameters: (lambda_parameters
    (binding_rest
      name: (identifier) @definition.parameter)))

; Lambda parameter definitions
(lambda
  parameters: (lambda_parameters
    (identifier) @definition.parameter))

(lambda
  parameters: (lambda_parameters
    (binding_optional
      name: (identifier) @definition.parameter)))

(lambda
  parameters: (lambda_parameters
    (binding_rest
      name: (identifier) @definition.parameter)))

; For loop variable definitions
(for_statement
  variable: (identifier) @definition.var)

; Exception handler variable definitions
(except_clause
  variable: (identifier) @definition.var)

; Property definitions
(property_definition
  name: (identifier) @definition.property)

(object_property
  name: (identifier) @definition.property)

; Verb definitions
(verb_definition
  name: (identifier) @definition.method)

(verb_definition
  name: (string) @definition.method)

; Verb argument definitions
(verb_definition
  direct_object: (identifier) @definition.parameter)

(verb_definition
  preposition: (identifier) @definition.parameter)

(verb_definition
  indirect_object: (identifier) @definition.parameter)

; =============================================================================
; REFERENCES
; =============================================================================

; All identifiers that aren't definitions are references
(identifier) @reference

; =============================================================================
; SPECIAL SCOPING RULES
; =============================================================================

; Assignment operations can define variables in parent scope
(assignment_operation
  left: (identifier) @definition.var)

(assignment_operation
  left: (binding_pattern
    name: (identifier) @definition.var))

(assignment_operation
  left: (binding_pattern
    (binding_optional
      name: (identifier) @definition.var)))

(assignment_operation
  left: (binding_pattern
    (binding_rest
      name: (identifier) @definition.var)))

; Object and property references don't create definitions
(property_access
  object: (identifier) @reference)

(method_call
  object: (identifier) @reference)

(index_access
  object: (identifier) @reference)

(slice
  object: (identifier) @reference)