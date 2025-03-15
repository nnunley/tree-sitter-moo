import XCTest
import SwiftTreeSitter
import TreeSitterMoo

final class TreeSitterMooTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_moo())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Moo grammar")
    }
}
