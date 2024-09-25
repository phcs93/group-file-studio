# Group File Studio

A tool for editing .GRP files from Build Engine games.

You can access the app here:  
https://phcs93.github.io/group-file-studio/

# Features

- you can load a .grp file and see all its contents
- you can replace or edit the PALETTE.DAT file and export the modified file
- you can replace or edit the LOOKUP.DAT file and export the modified file
- you can reorder or replace tiles in an .ART file and export the modified file
- you can export the tiles as you see them (with palette swaps, shade, transparency and alterantive palettes)
    - the tiles will be exported as 8 bits .PNG files in a .ZIP

# TO-DO

- ability to unload .ART files
- ability to create new .ART files
- add ability to change .ART file "localtilestart" and "localtileend"
    - what should happen if art size gets smaller? discard out of bounds tiles?
        - maybe create a new art in between with the remaining tiles
    - what should happen with overlaping art files?
        - currently if you load an art file with overlaping localtilestart it just replaces it
            - but this only takes into account the "localtilestart" and **assumes** that the "localtileend" will not overlap any current loaded art files

- improve the ux    
    - disable upload lookup file button if no palette is loaded
    - disable upload art files button if no palette is loaded
    - validate uploaded files (for example, check if the GRP is a valid GRP)

- ability to edit art animations (because these will be messed by the tile reordering feature)

- ability to upload/edit/export a tiles.cfg (for Mapster32 tile groups)

- change the menu a little bit to show a file tree of the GRP, and display a different "editing tool" depending on the selected file
    - display a sound player for .VOC and .MID files
    - render .MAP files (2d view only just like [my other project does](https://github.com/phcs93/duke-map-viewer))
    - i don't know what to do with .ANM and .CON files (probably nothing)
    - allow extraction and insertion of individual files
    - add a "recompile" GRP button

- ability to edit tile pixels with loaded palette colors
    - this one might be too much...