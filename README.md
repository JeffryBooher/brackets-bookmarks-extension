Brackets Bokmarks Extension
============================

This Extension provides functionality to bookmark lines in [Brackets](https://github.com/adobe/brackets).  

`Navigate > Toggle Bookmark` or press ⇧⌘K (`Ctrl+Shift+K` on Windows)

And recall those bookmarks later

`Navigate > Next Bookmark` or press ⌘P (`Ctrl+P` on Windows)

`Navigate > Previous Bookmark` or press ⇧⌘P (`Ctrl+Shift+P` on Windows)

Bookmarks are serialized and remembered globally. Add bookmarks to a file, close the file, reopen the file. Brackets will restore the bookmarks. Bookmarks are represented with a color and a bookmark icon.

Bookmarked lines with Live Editing Syntax Errors will show using a different color

##TODO
-[ ] Localize. I've set this extension up for localization so please contribute pull requests to translate this extension
-[x] Bookmarks panel. Show the bookmarks in all open documents and recall or delete them.
-[ ] Sync bookmarks if files are changed externally... Use a hash of the line maybe?
-[ ] Better Bookmark Affordance (@larz0) especially when bookmarking lines in files with more than 999 lines since the bookmark UI encroaches on the line number
-[ ] Bookmark UI when line numbers are turned off 
