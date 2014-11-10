/*
 * Copyright (c) 2014 Adobe Systems Incorporated. All rights reserved.
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

/*global define, brackets, window, $, Mustache, navigator */

/*
 * Panel showing search results for a Find/Replace in Files operation.
 */
define(function (require, exports, module) {
    "use strict";

    var CommandManager        = brackets.getModule("command/CommandManager"),
        Commands              = brackets.getModule("command/Commands"),
        DocumentManager       = brackets.getModule("document/DocumentManager"),
        EditorManager         = brackets.getModule("editor/EditorManager"),
        ProjectManager        = brackets.getModule("project/ProjectManager"),
        FileViewController    = brackets.getModule("project/FileViewController"),
        FileUtils             = brackets.getModule("file/FileUtils"),
        FindUtils             = brackets.getModule("search/FindUtils"),
        WorkspaceManager      = brackets.getModule("view/WorkspaceManager"),
        _                     = brackets.getModule("thirdparty/lodash"),

        StringUtils           = brackets.getModule("utils/StringUtils"),
        Strings               = require("strings"),
        
        bookmarksPanelTemplate = require("text!htmlContent/bookmarks-panel.html"),
        bookmarksListTemplate  = require("text!htmlContent/bookmarks-list.html");

    
    /**
     * @const
     * Debounce time for document changes updating the search results view.
     * @type {number}
     */
    var UPDATE_TIMEOUT   = 400;

    /**
     * @constructor
     * Creates a bookmarks panel
     * Dispatches the following events:
     *      close - when the panel is closed.
     * 
     * @typedef {Object.<string, Array<number>>} BookmarksModel
     * @parm {BookmarksModel} model - bookmarks model
     */
    function BookmarksView(model) {
        var panelHtml  = Mustache.render(bookmarksPanelTemplate);

        this._panel    = WorkspaceManager.createBottomPanel("bookmarks", $(panelHtml), 100);
        this._$panel   = this._panel.$panel;
        this._$title   = this._$panel.find(".title");
        this._$table   = this._$panel.find(".table-container");
        this._model    = model;
    }
    
    /** @type {BookmarksModel} bookmarks model */
    BookmarksView.prototype._model = null;
    
    /** @type {Panel} Bottom panel holding the bookmarks */
    BookmarksView.prototype._panel = null;
    
    /** @type {$.Element} The element where the title is placed */
    BookmarksView.prototype._$title = null;
    
    /** @type {$.Element} The table that holds the results */
    BookmarksView.prototype._$table = null;
    
    /** @type {number} The ID we use for timeouts when handling model changes. */
    BookmarksView.prototype._timeoutID = null;
        
    /**
     * @private
     * Handles when model changes. Updates the view, buffering changes if necessary so as not to churn too much.
     */
    BookmarksView.prototype._handleModelChange = function () {
        var self = this;
        if (this._timeoutID) {
            window.clearTimeout(this._timeoutID);
        }
        this._timeoutID = window.setTimeout(function () {
            self._updateResults();
            self._timeoutID = null;
        }, UPDATE_TIMEOUT);
    };
    
    /**
     * @private
     * Adds the listeners for close and clicking on a bookmark in the list
     */
    BookmarksView.prototype._addPanelListeners = function () {
        var self = this;
        this._$panel
            .off(".bookmarks")  // Remove the old events
            .on("click.bookmarks", ".close", function () {
                self.close();
            })
            // Add the click event listener directly on the table parent
            .on("click.bookmarks .table-container", function (e) {
                var $row = $(e.target).closest("tr");

                if ($row.length) {
                    if (self._$selectedRow) {
                        self._$selectedRow.removeClass("selected");
                    }
                    $row.addClass("selected");
                    self._$selectedRow = $row;
                    
                    var fullPathAndLineNo = $row.find(".line-text").text();

                    CommandManager.execute(Commands.FILE_OPEN, {fullPath: fullPathAndLineNo});
                    //@TODO: 
                }
            });
        
    };

    /**
     * @private
     * Shows the current set of results.
     */
    BookmarksView.prototype._render = function () {
        var bookmarks = [];
        
        // Iterates throuh the files to display the results sorted by filenamess. The loop ends as soon as
        // we filled the results for one page
        _.each(this._model, function (fullPath) {
            this._model[fullPath].forEach(function (lineNo) {
                bookmarks.push({
                    fullPath: fullPath,
                    lineNo: lineNo
                });
            });
        });
        
        // Insert the search results
        this._$table
            .empty()
            .append(Mustache.render(bookmarksListTemplate, {
                bookmarks:   bookmarks,
                Strings:     Strings
            }));
        
        if (this._$selectedRow) {
            this._$selectedRow.removeClass("selected");
            this._$selectedRow = null;
        }
        
        this._panel.show();
        this._$table.scrollTop(0); // Otherwise scroll pos from previous contents is remembered
    };
    
    /**
     * Updates the results view after a model change, preserving scroll position and selection.
     */
    BookmarksView.prototype._updateResults = function () {
        // In general this shouldn't get called if the panel is closed, but in case some
        // asynchronous process kicks this (e.g. a debounced model change), we double-check.
        if (this._panel.isVisible()) {
            var scrollTop  = this._$table.scrollTop(),
                index      = this._$selectedRow ? this._$selectedRow.index() : null;
            this._render();
            this._$table.scrollTop(scrollTop);
            if (index) {
                this._$selectedRow = this._$table.find("tr:eq(" + index + ")");
                this._$selectedRow.addClass("selected");
            }
        }
    };
    
    /**
     * Opens the results panel and displays the current set of results from the model.
     */
    BookmarksView.prototype.open = function () {
        this._render();
        this._addPanelListeners();
        $(this._model).on("change.BookmarksView", this._handleModelChange.bind(this));
    };
    
    /**
     * Hides the Search Results Panel and unregisters listeners.
     */
    BookmarksView.prototype.close = function () {
        if (this._panel && this._panel.isVisible()) {
            this._$table.empty();
            this._panel.hide();
            this._panel.$panel.off(".bookmarks");
            $(this._model).off("change.BookmarksView");
            $(this).triggerHandler("close");
        }
    };
    
        /**
     * Hides the Search Results Panel and unregisters listeners.
     */
    BookmarksView.prototype.isOpen = function () {
        return (this._panel && this._panel.isVisible());
    };
    
    // Public API
    exports.BookmarksView = BookmarksView;
});
