package tree_sitter_moo_test

import (
	"testing"

	tree_sitter "github.com/smacker/go-tree-sitter"
	"github.com/tree-sitter/tree-sitter-moo"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_moo.Language())
	if language == nil {
		t.Errorf("Error loading Moo grammar")
	}
}
