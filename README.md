Brackets Bookmarks Extension
============================

This Extension provides functionality to bookmark lines in [Brackets](https://github.com/adobe/brackets).  

`Navigate > Toggle Bookmark` or press ⇧⌘K (`Ctrl+Shift+K` on Windows)

And recall those bookmarks later

`Navigate > Next Bookmark` or press ⌘P (`Ctrl+P` on Windows)

`Navigate > Previous Bookmark` or press ⇧⌘P (`Ctrl+Shift+P` on Windows)

Bookmarks are serialized and remembered globally. Add bookmarks to a file, close the file, reopen the file. Brackets will restore the bookmarks. Bookmarks are represented with a color and a bookmark icon.

Bookmarked lines with Live Editing Syntax Errors will show using a different color

 `View > Show Bookmarks Panel` To see all bookmarks of open files (open, temporary views and views of files in the working set which may not have been open yet) 

The default mode for the Bookmarks panel is to show bookmarks of only "open" files.  This can be confusing when bookmarking files that Brackets has created a temporary view for then switching to another view. The result would cause the bookmark to disappear from the bookmarks view with the only way to get back to it is by reopening the file.

Add the following to your Brackets preferences file to show all bookmarks within a "project"

    "bracketsEditorBookmarks.viewOptions": {
        "show": "project"
    }


Add the following to your Brackets preferences file to show all bookmarks

    "bracketsEditorBookmarks.viewOptions": {
        "show": "all"
    }

the default for the "show" preference is "opened".  

**ProTip**: Setting the show preference "all" will enable you to quickly jump between files in other projects.

##TODO
1. Localize. I've set this extension up for localization so please contribute pull requests to translate this extension
1. Sync bookmarks if files are changed externally... Use a hash of the line maybe?
1. Better Bookmark Affordance (@larz0) especially when bookmarking lines in files with more than 999 lines since the bookmark UI encroaches on the line number
1. Bookmark UI when line numbers are turned off 
1. Bookmark filtering (show bookmarks with xxx in the file's name, annotation, etc..)
1. Bookmark groups (allow bookmarks to belong to a task like "refactoring functionXXX")
1. Bookmark annotation (why was the bookmark added -- a quick glance at the context of the bookmark)
