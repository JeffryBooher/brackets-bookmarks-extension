/*
 * Copyright (c) 2012 Jeffry Booher. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, window, $, Mustache, navigator */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var PreferencesManager          = brackets.getModule("preferences/PreferencesManager"),
        CommandManager              = brackets.getModule("command/CommandManager"),
        ExtensionUtils              = brackets.getModule("utils/ExtensionUtils"),
        Menus                       = brackets.getModule("command/Menus"),
        EditorManager               = brackets.getModule("editor/EditorManager"),
        _                           = brackets.getModule("thirdparty/lodash");
    
    // my modules
    var BookmarksView               = require("view/BookmarksView").BookmarksView,
        ExtensionStrings            = require("strings");
    

    /** @const {string} Extension Command ID */
    var MY_MODULENAME               = "bracketsBookmarksExtension";
    var CMD_TOGGLE_BOOKMARK         = "bracketsBookmarksExtension.toggleBookmark",
        CMD_GOTO_NEXT_BOOKMARK      = "bracketsBookmarksExtension.gotoNextBookmark",
        CMD_GOTO_PREV_BOOKMARK      = "bracketsBookmarksExtension.gotoPrevBookmark",
        CMD_TOGGLE_BOOKKMARK_VIEW   = "bracketsBookmarksExtension.toggleBookmarksPanel";
    
    /* Our extension's preferences */
    var prefs = PreferencesManager.getExtensionPrefs(MY_MODULENAME);
    
    // Define a preference to keep track of how many times our extension has been ivoked
    prefs.definePreference("bookmarks", "object", {});

    // Bookmarks Data Model
    var _bookmarks = {};
    
    // Bookmarks Panel
    var _bookmarksPanel = null;
    
    /**
     * Saves bookmarks to the internal cache for the specified editor instance
     * @param {Editor=} editor - brackets editor instance. current editor if null
     * @return {?Array.<Number>} array of cached bookmarked line numbers
     */
    function saveBookmarks(editor) {
        if (!editor) {
            editor = EditorManager.getCurrentFullEditor();
        }
        if (editor) {
            var i,
                fullPath = editor.document.file.fullPath,
                cm = editor._codeMirror,
                lineCount = cm.doc.lineCount(),
                bookmarkedLines = [];
        
            for (i = 0; i < lineCount; i++) {
                var lineInfo = cm.lineInfo(i);
            
                if (lineInfo.wrapClass && lineInfo.wrapClass.indexOf("bookmark") >= 0) {
                    bookmarkedLines.push(i);
                }
            }
            
            // we need to sort so that go to next bookmark works
            bookmarkedLines.sort(function (a, b) {
                return a > b;
            });
        
            _bookmarks[fullPath] = bookmarkedLines;
            $(_bookmarks).triggerHandler("change");

            return bookmarkedLines;
        }
        return null;
    }
    
    /**
     * Clears the internal cache for the specified editor instance
     * @param {!Editor} editor - brackets editor instance
     */
    function resetBookmarks(editor) {
        if (editor) {
            delete _bookmarks[editor.document.file.fullPath];
            $(_bookmarks).triggerHandler("change");
        }
        
    }
    
    /**
     * Loads the cached bookmarks into the specified editor instance
     * @param {Editor=} editor - brackets editor instance. current editor if null
     */
    function loadBookmarks(editor) {
        if (!editor) {
            editor = EditorManager.getCurrentFullEditor();
        }
        if (editor) {
            var cm = editor._codeMirror,
                bm = _bookmarks[editor.document.file.fullPath];
            
            if (bm) {
                bm.forEach(function (lineNo) {
                    if (lineNo < cm.doc.lineCount()) {
                        cm.addLineClass(lineNo, "wrap", "bookmark");
                    }
                });
            }
        }
    }

    /**
     * Traverses to cursor position to the next bookmark 
     *   in the specified editor instance
     * @param {!Editor} editor - brackets editor instance
     */
    function gotoNextBookmark(forward) {
        var editor = EditorManager.getCurrentFullEditor();
        if (editor) {
            var cursor = editor.getCursorPos(),
                fullPath = editor.document.file.fullPath,
                bm = _bookmarks[fullPath];

            if (!bm || !bm.length) {
                bm = saveBookmarks(editor);
                if (!bm) {
                    return;
                }
            }
            
            // find next bookmark
            var index;
            for (index = (forward ? 0 : bm.length - 1); forward ? (index < bm.length) : (index >= 0); forward ? (index++) : (index--)) {
                if (forward) {
                    if (bm[index] > cursor.line) {
                        editor.setCursorPos(bm[index], 0);
                        return;
                    }
                    if (index === bm.length - 1) {
                        // wrap around just pick the first one in the list
                        if (bm[0] !== cursor.line) {
                            editor.setCursorPos(bm[0], 0);
                        }
                        return;
                    }
                } else {
                    if (bm[index] < cursor.line) {
                        editor.setCursorPos(bm[index], 0);
                        return;
                    }
                    if (index === 0) {
                        // wrap around just pick the last one in the list
                        if (bm[bm.length - 1] !== cursor.line) {
                            editor.setCursorPos(bm[bm.length - 1], 0);
                        }
                        return;
                    }
                }
                
            }
        }
    }
    
    /**
     * Toogles the bookmarked state of the current line of the current editor
     */
    function toggleBookmark() {
        var editor = EditorManager.getCurrentFullEditor();
        if (editor) {
            var cursor = editor.getCursorPos(),
                lineNo = cursor.line,
                cm = editor._codeMirror,
                lineInfo = cm.lineInfo(cursor.line);
            
            if (!lineInfo.wrapClass || lineInfo.wrapClass.indexOf("bookmark") === -1) {
                cm.addLineClass(lineNo, "wrap", "bookmark");
            } else {
                cm.removeLineClass(lineNo, "wrap", "bookmark");
            }
            resetBookmarks(editor);
        }
    }
    
    function isBookmarkPanelVisible() {
        return (_bookmarksPanel && _bookmarksPanel.isOpen());
    }
    
    function toggleBookmarkPanel() {
        if (!_bookmarksPanel) {
            _bookmarksPanel = new BookmarksView(_bookmarks, saveBookmarks);
        }
        
        if (_bookmarksPanel.isOpen()) {
            _bookmarksPanel.close();
        } else {
            _bookmarksPanel.open();
        }
    }
    
    // load our styles
    ExtensionUtils.loadStyleSheet(module, "styles/styles.css");
    
    // register our commands
    CommandManager.register(ExtensionStrings.TOGGLE_BOOKMARK, CMD_TOGGLE_BOOKMARK, toggleBookmark);
    CommandManager.register(ExtensionStrings.GOTO_PREV_BOOKMARK, CMD_GOTO_PREV_BOOKMARK, _.partial(gotoNextBookmark, false));
    CommandManager.register(ExtensionStrings.GOTO_NEXT_BOOKMARK, CMD_GOTO_NEXT_BOOKMARK, _.partial(gotoNextBookmark, true));
    
    // add our menu items
    var menu = Menus.getMenu(Menus.AppMenuBar.NAVIGATE_MENU);

    menu.addMenuDivider();
    menu.addMenuItem(CMD_TOGGLE_BOOKMARK, "Ctrl-Shift-K");
    menu.addMenuItem(CMD_GOTO_NEXT_BOOKMARK, "Ctrl-P");
    menu.addMenuItem(CMD_GOTO_PREV_BOOKMARK, "Ctrl-Shift-P");
    
    menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    CommandManager.register(ExtensionStrings.TOGGLE_BOOKMARKS_PANEL, CMD_TOGGLE_BOOKKMARK_VIEW, toggleBookmarkPanel);
    menu.addMenuDivider();
    menu.addMenuItem(CMD_TOGGLE_BOOKKMARK_VIEW);
    
    // event handlers
    //  note: this is an undocumented, unsupported event when an editor is created
    // @TODO: invent a standard event
    $(EditorManager).on("_fullEditorCreatedForDocument", function (e, document, editor) {
        $(editor).on("beforeDestroy.bookmarks", function () {
            saveBookmarks(editor);
            $(editor).off(".bookmarks");
            $(document).off(".bookmarks");
        });
        $(document).on("change.bookmarks", function () {
            resetBookmarks(editor);
        });
        loadBookmarks(editor);
    });
});
