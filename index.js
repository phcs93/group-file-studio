Globals = {
    GRP: null,
    Pelette: null,
    Lookup: null,
    Arts: [],
    SelectedPaletteColorIndex: null
};

document.addEventListener("DOMContentLoaded", () => {

    // upload GRP
    document.querySelector("input#grp-input").onchange = e => {

        const reader = new FileReader();

        reader.onload = async () => {

            const bytes = new Uint8Array(reader.result);
            Globals.GRP = new GRP(bytes);
            console.log(Globals.GRP);

            // palette
            const paletteBytes = Globals.GRP.getFileBytes("PALETTE.DAT");
            Globals.Palette = new Palette(paletteBytes);
            console.log(Globals.Palette);

            // lookup
            const lookupBytes = Globals.GRP.getFileBytes("LOOKUP.DAT");
            if (lookupBytes) {
                Globals.Lookup = new Lookup(lookupBytes);
                console.log(Globals.Lookup);
            } else {
                Globals.Lookup = null;
            }

            // all .art files in the grp
            Globals.Arts = [];
            for (const file of Globals.GRP.files.filter(f => f.name.toUpperCase().endsWith(".ART"))) {
                const art = new Art(Globals.GRP.getFileBytes(file.name), file.name);
                Globals.Arts.push(art);
                console.log(art);
            }
            // sort based on "localtilestart"
            Globals.Arts = Globals.Arts.sort((a, b) => a.localtilestart - b.localtilestart);

            render();

        };

        reader.readAsArrayBuffer(e.target.files[0]);

    };

    // upload palette
    document.querySelector("input#palette-input").onchange = e => {
        const reader = new FileReader();
        reader.onload = () => {
            const bytes = new Uint8Array(reader.result);
            Globals.Palette = new Palette(bytes);
            console.log(Globals.Palette);
            render();

        };
        reader.readAsArrayBuffer(e.target.files[0]);
    };

    // upload lookup
    document.querySelector("input#lookup-input").onchange = e => {
        const reader = new FileReader();
        reader.onload = () => {
            const bytes = new Uint8Array(reader.result);
            Globals.Lookup = new Lookup(bytes);
            console.log(Globals.Lookup);
            render();
        };
        reader.readAsArrayBuffer(e.target.files[0]);
    };

    // upload art
    document.querySelector("input#art-input").onchange = async e => {
        for (const file of e.target.files) {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            const art = new Art(bytes, file.name);
            // check if uploaded tile should replace one of the current ones
            const correspondingArtIndex = Globals.Arts.findIndex(a => a.localtilestart === art.localtilestart);
            if (correspondingArtIndex > -1) {
                Globals.Arts[correspondingArtIndex] = art;
            } else {
                Globals.Arts.push(art);
            }
            console.log(art);
        }
        // sort based on "localtilestart"
        Globals.Arts = Globals.Arts.sort((a, b) => a.localtilestart - b.localtilestart);
        render();
    };

    // change shade (only label for better feedback)
    document.querySelector("input#shade-range").oninput = e => {
        document.querySelector("label#shade-label").dataset.shade = e.target.value;
    };

    // change shade (when user stops sliding)
    document.querySelector("input#shade-range").onchange = e => {
        render();
    };

    // change swapIndex
    document.querySelector("select#swap-select").onchange = e => {
        render();
    };

    // change alternateIndex
    document.querySelector("select#alternate-select").onchange = e => {
        render();
    };

    // change grid size
    document.querySelector("input#grid-size-range").oninput = e => {
        document.querySelector("label#grid-size-label").dataset.gridsize = e.target.value;
        document.querySelector(":root").style.setProperty("--grid-size", `${e.target.value}px`);
    };

    // change enable transparency
    document.querySelector("input#enable-transparency").onchange = e => {
        render();
    };

    // change enable background
    document.querySelector("input#enable-background").onchange = e => {
        document.querySelector("div#tiles").dataset.background = e.target.checked;
    };

    // change tile (double click)
    document.body.addEventListener("dblclick", async e => {
        if (e.target.tagName.toLowerCase() === "canvas" /*&& e.target.draggable*/) {
            const tileIndex = e.target.dataset.index;
            const artIndex = e.target.dataset.artIndex;
            const [file] = await showOpenFilePicker({
                types: [
                    {
                        description: "Images",
                        accept: {
                            "image/*": [".png", ".gif", ".jpeg", ".jpg"],
                        }
                    }
                ],
                excludeAcceptAllOption: true,
                multiple: false
            });
            const image = new Image(); // this is an actual <img> tag element
            image.src = URL.createObjectURL(await file.getFile());
            image.onload = () => {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                canvas.width = image.width;
                canvas.height = image.height;
                context.drawImage(image, 0, 0);
                const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
                const pixels = [];
                for (let y = 0; y < canvas.height; y++) {
                    const row = [];
                    for (let x = 0; x < canvas.width; x++) {
                        const offset = (y * canvas.width + x) * 4;
                        const pixel = [
                            data[offset + 0], // r
                            data[offset + 1], // g
                            data[offset + 2], // b
                            data[offset + 3]  // alpha
                        ];
                        row.push(pixel);
                    }
                    pixels.push(row);
                }
                editTile(artIndex, tileIndex, pixels);
            };
        }
    });

    // dag tile
    document.body.addEventListener("dragstart", e => {
        if (e.target.tagName.toLowerCase() === "canvas" && e.target.draggable) {
            e.dataTransfer.setData("order", e.target.dataset.order);
            e.dataTransfer.effectAllowed = "move";
        } else {
            e.preventDefault();
        }
    });

    // drag tile over another
    document.body.addEventListener("dragover", e => {
        if (e.target.tagName.toLowerCase() === "canvas" && e.target.draggable) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            const position = e.offsetX / e.target.clientWidth;
            if (position < 0.25) {
                e.target.classList.add("drag-over-left");
                e.target.classList.remove("drag-over-center");
                e.target.classList.remove("drag-over-right");
            } else if (position > 0.75) {
                e.target.classList.add("drag-over-right");
                e.target.classList.remove("drag-over-center");
                e.target.classList.remove("drag-over-left");
            } else {
                e.target.classList.add("drag-over-center");
                e.target.classList.remove("drag-over-left");
                e.target.classList.remove("drag-over-right");
            }
        }
    });

    // drag tile out of another
    document.body.addEventListener("dragleave", e => {
        if (e.target.tagName.toLowerCase() === "canvas" && e.target.draggable) {
            e.preventDefault();
            e.target.classList.remove("drag-over-center");
            e.target.classList.remove("drag-over-left");
            e.target.classList.remove("drag-over-right");
        }
    });

    // drop tile
    document.body.addEventListener("drop", e => {
        if (e.target.tagName.toLowerCase() === "canvas" && e.target.draggable) {
            e.preventDefault();
            const fromIndex = parseInt(e.dataTransfer.getData("order"));
            if (fromIndex || fromIndex === 0) {
                e.target.classList.remove("drag-over-center");
                e.target.classList.remove("drag-over-left");
                e.target.classList.remove("drag-over-right");
                let toIndex = parseInt(e.target.dataset["order"]);
                let swap = false;
                const position = e.offsetX / e.target.clientWidth;
                if (position < 0.25) {
                    if (fromIndex < toIndex) {
                        toIndex = toIndex - 1;
                    } else {
                        toIndex = toIndex;
                    }
                    swap = false;
                } else if (position > 0.75) {
                    if (fromIndex > toIndex) {
                        toIndex = toIndex + 1;
                    } else {
                        toIndex = toIndex;
                    }
                    swap = false;
                } else {
                    toIndex = toIndex;
                    swap = true;
                }
                editTileOrder(fromIndex, toIndex, swap);
            }
        }
    });

});

// render everything
function render() {
    const transparency = document.querySelector("input#enable-transparency").checked;
    const shadeIndex = document.querySelector("input#shade-range").value;
    const swapIndex = document.querySelector("select#swap-select").value || null;
    const alternateIndex = document.querySelector("select#alternate-select").value || null;
    renderPalette(Globals.Palette);
    renderShadeOptions(Globals.Palette);
    renderShade(Globals.Palette, shadeIndex);
    renderSwapOptions(Globals.Lookup);
    renderLookup(Globals.Palette, Globals.Lookup, swapIndex);
    renderAlternateOptions(Globals.Lookup);
    renderAlternate(Globals.Palette, Globals.Lookup, alternateIndex);
    renderArts(Globals.Palette, shadeIndex, Globals.Lookup, swapIndex, alternateIndex, Globals.Arts, transparency);
    document.querySelector("input#shade-range").value = shadeIndex;
    document.querySelector("select#swap-select").value = swapIndex || "";
    document.querySelector("select#alternate-select").value = alternateIndex || "";
}

// render palette
function renderPalette(palette) {

    const svg = document.querySelector("svg#palette-svg");

    svg.innerHTML = "";

    const elements = [];

    const size = Math.sqrt(palette.colors.length);

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const index = x + y * size;
            const color = palette.colors[index];
            const rect = `<rect 
                data-selected="${Globals.SelectedPaletteColorIndex === index}" 
                onclick="selectPaletteColorIndex(this, ${index})" 
                ondblclick="editPaletteTable(${index}, event)" 
                x="${x * 16}" 
                y="${y * 16}" 
                width="16px" 
                height="16px" 
                fill="rgb(${color[0]},${color[1]},${color[2]})" 
            />`;
            elements.push(rect);
        }
    }

    svg.insertAdjacentHTML("beforeend", elements.join(""));

}

// render shade options (range max)
function renderShadeOptions(palette) {
    if (palette) {
        document.querySelector("input#shade-range").setAttribute("max", palette.shades.length - 1);
    }
}

// render shade
function renderShade(palette, shadeIndex) {

    const svg = document.querySelector("svg#shade-svg");

    svg.innerHTML = "";

    const elements = [];

    const size = Math.sqrt(palette.colors.length);

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const index = x + y * size;
            const color = palette.colors[palette.shades[shadeIndex][index]];
            const rect = `<rect 
                onclick="editShadeTable(${shadeIndex}, ${index})" 
                x="${x * 16}" 
                y="${y * 16}" 
                width="16px" 
                height="16px" 
                fill="rgb(${color[0]},${color[1]},${color[2]})" 
            />`;
            elements.push(rect);
        }
    }

    svg.insertAdjacentHTML("beforeend", elements.join(""));

}

// render swap options
function renderSwapOptions(lookup) {
    document.querySelector("select#swap-select").innerHTML = "";
    if (lookup) {
        const sort = (a, b) => parseInt(a.index) - parseInt(b.index);
        const defaultOption = `<option value="">none</option>`;
        const options = lookup.swaps.sort(sort).map((swap, i) => `
            <option value="${i}">${swap.index}</option>
        `);
        document.querySelector("select#swap-select").innerHTML = [defaultOption].concat(options).join("");
    }
}

// render lookup (swaped palette)
function renderLookup(palette, lookup, swapIndex) {

    const svg = document.querySelector("svg#lookup-svg");
    svg.innerHTML = "";

    if (lookup) {

        const elements = [];

        const size = Math.sqrt(palette.colors.length);

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const index = x + y * size;
                const colorIndex = swapIndex !== null ? lookup.swaps[swapIndex].table[index] : index;
                const color = palette.colors[colorIndex];
                const rect = `<rect 
                    onclick="editLookupTable(${swapIndex !== null ? swapIndex : "null"}, ${index})" 
                    x="${x * 16}" 
                    y="${y * 16}" 
                    width="16px" 
                    height="16px" 
                    fill="rgb(${color[0]},${color[1]},${color[2]})" 
                />`;
                elements.push(rect);
            }
        }

        svg.insertAdjacentHTML("beforeend", elements.join(""));

    }

}

// render alternates options
function renderAlternateOptions(lookup) {
    document.querySelector("select#alternate-select").innerHTML = "";
    if (lookup) {
        const defaultOption = `<option value="">none</option>`;
        const options = lookup.alternates.map((alternate, i) => `
            <option value="${i}">${alternate.name}</option>
        `);
        document.querySelector("select#alternate-select").innerHTML = [defaultOption].concat(options).join("");
    }
}

// render alternate
function renderAlternate(palette, lookup, alternateIndex) {

    const svg = document.querySelector("svg#alternate-svg");
    svg.innerHTML = "";

    if (lookup) {

        const elements = [];

        const size = Math.sqrt(palette.colors.length);

        const colors = alternateIndex ? lookup.alternates[alternateIndex].colors : palette.colors;

        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const index = x + y * size;
                const color = colors[index];
                const rect = `<rect 
                    ondblclick="editAlternateTable(${alternateIndex}, ${index})" 
                    x="${x * 16}" 
                    y="${y * 16}" 
                    width="16px" 
                    height="16px" 
                    fill="rgb(${color[0]},${color[1]},${color[2]})" 
                />`;
                elements.push(rect);
            }
        }

        svg.insertAdjacentHTML("beforeend", elements.join(""));

    }

}

// render art
function renderArts(palette, shadeIndex, lookup, swapIndex, alternateIndex, arts, transparency) {

    const main = document.querySelector("div#tiles");

    main.innerHTML = "";

    // apply alternate palette if any selected
    let colors = alternateIndex ? lookup.alternates[alternateIndex].colors : palette.colors;

    // apply swap if any selected
    if (lookup && swapIndex !== null) {
        colors = colors.map((c, i) => colors[lookup.swaps[swapIndex].table[i]]);
    }

    // apply shade
    colors = colors.map((c, i) => colors[palette.shades[shadeIndex][i]]);

    const startTime = new Date(); // for calculating performance

    let order = 0; // only used for the reordering feature

    for (let a = 0; a < arts.length; a++) {

        const art = arts[a];

        const h1 = document.createElement("h1");
        h1.innerHTML = `${art.name} [${art.localtilestart}-${art.localtileend}] <span class="numtiles">(${art.tiles.length} tiles)</span>`;
        main.appendChild(h1);

        main.insertAdjacentHTML("beforeend", `
            <span class="tip">drag and drop to reorder or swap tiles</span>
            <span class="tip">double click to change tile</span>
            <br>
        `);

        const div = document.createElement("div");
        div.setAttribute("class", "grow grid");

        for (let t = 0; t < art.tiles.length; t++) {

            const canvas = document.createElement("canvas");
            canvas.dataset.index = art.localtilestart + t;
            canvas.dataset.order = order++;
            canvas.dataset.artIndex = a; // this is only used for the edit tile function
            canvas.setAttribute("draggable", "true");

            // tile = [x][y] = byte (palette color index)
            const tile = art.tiles[t];

            if (tile.length > 0) {

                canvas.dataset.width = tile.length;
                canvas.dataset.height = tile[0].length;

                //canvas.dataset.animation = art.picanm[t].frames > 0;
                //canvas.dataset.animation = art.picanm[t].type === 3;

                canvas.setAttribute("title", `#${art.localtilestart + t} [${tile.length}x${tile[0].length}]`);
                canvas.width = tile.length;
                canvas.height = tile[0].length;

                const context = canvas.getContext("2d");
                const data = context.createImageData(tile.length, tile[0].length);

                // iterate the Y axis first because the tiles are stored in the opposite coordinate system than the screen memory is stored
                for (let y = 0; y < tile[0].length; y++) {
                    for (let x = 0; x < tile.length; x++) {
                        const index = tile[x][y];
                        const color = colors[index];
                        const i = x + y * tile.length;
                        data.data[i * 4 + 0] = color[0];
                        data.data[i * 4 + 1] = color[1];
                        data.data[i * 4 + 2] = color[2];
                        data.data[i * 4 + 3] = transparency ? (index === 255 ? 0 : 255) : 255;
                    }
                }

                context.putImageData(data, 0, 0);

            } else {
                canvas.setAttribute("title", `#${art.localtilestart + t}`);
            }

            div.appendChild(canvas);

        }

        main.appendChild(div);

    }

    const endTime = new Date();
    const timeDiff = endTime - startTime; // in ms
    console.log(`renderArts() took ${timeDiff}ms`);

}

// select palette color
function selectPaletteColorIndex(element, colorIndex) {
    document.querySelectorAll("svg#palette-svg rect").forEach(e => e.dataset.selected = false);
    element.dataset.selected = true;
    Globals.SelectedPaletteColorIndex = colorIndex;
}

// edit palette table
function editPaletteTable(colorIndex, event) {

    const currentColor = Globals.Palette.colors[colorIndex];

    const colorPicker = document.createElement("input");

    document.body.appendChild(colorPicker);

    colorPicker.value = "#" + currentColor.map(c => parseInt(c).toString(16).padStart(2, 0)).join("");
    colorPicker.setAttribute("type", "color");
    colorPicker.style.position = "absolute";
    colorPicker.style.top = `${event.clientY}px`;
    colorPicker.style.left = `${event.clientX}px`;

    colorPicker.style.backgroundColor = "transparent";
    colorPicker.style.border = "none";
    colorPicker.style.width = "0px";
    colorPicker.style.height = "0px";

    colorPicker.onchange = e => {
        Globals.Palette.colors[colorIndex] = e.target.value.slice(1).match(/.{1,2}/g).map(c => parseInt(c, 16));
        render();
    };
    colorPicker.onblur = e => {
        // remove itself
        e.target.remove();
    };

    colorPicker.focus();
    colorPicker.click();
}

// edit alternate table
function editAlternateTable(alternateIndex, colorIndex) {

    if (alternateIndex !== null) {

        const currentColor = Globals.Lookup.alternates[alternateIndex].colors[colorIndex];

        const colorPicker = document.createElement("input");

        document.body.appendChild(colorPicker);

        colorPicker.value = "#" + currentColor.map(c => parseInt(c).toString(16).padStart(2, 0)).join("");
        colorPicker.setAttribute("type", "color");
        colorPicker.style.position = "absolute";
        colorPicker.style.top = `${event.clientY}px`;
        colorPicker.style.left = `${event.clientX}px`;

        colorPicker.style.backgroundColor = "transparent";
        colorPicker.style.border = "none";
        colorPicker.style.width = "0px";
        colorPicker.style.height = "0px";

        colorPicker.onchange = e => {
            Globals.Lookup.alternates[alternateIndex].colors[colorIndex] = e.target.value.slice(1).match(/.{1,2}/g).map(c => parseInt(c, 16));
            render();
        };
        colorPicker.onblur = e => {
            // remove itself
            e.target.remove();
        };

        colorPicker.focus();
        colorPicker.click();

    }

}

// edit shade table
function editShadeTable(shadeIndex, colorIndex) {
    if (Globals.SelectedPaletteColorIndex) {
        Globals.Palette.shades[shadeIndex][colorIndex] = Globals.SelectedPaletteColorIndex;
        render();
    }
}

// edit lookup table
function editLookupTable(swapIndex, colorIndex) {
    if (Globals.SelectedPaletteColorIndex && swapIndex !== null) {
        Globals.Lookup.swaps[swapIndex].table[colorIndex] = Globals.SelectedPaletteColorIndex;
        render();
    }
}

// edit tile
function editTile (artIndex, tileIndex, pixels) {

    const findClosestColor = (color, colors) => {
        let closestColorIndex = null;
        let minDistance = Infinity;
        for (let index = 0; index < colors.length; index++) {
            const c = colors[index];
            // get eucliedean distance between the two colors
            const distance = Math.sqrt(
                Math.pow(color[0] - c[0], 2) +
                Math.pow(color[1] - c[1], 2) +
                Math.pow(color[2] - c[2], 2)
            );
            // using less or equal ensures that the last index has priority
            // so transparency will always be prioritized
            if (distance <= minDistance) {
                minDistance = distance;
                closestColorIndex = index;
            }
        }
        return closestColorIndex;
    };

    const localTileIndex = tileIndex - Globals.Arts[artIndex].localtilestart;

    for (let y = 0; y < pixels[0].length; y++) {
        Globals.Arts[artIndex].tiles[localTileIndex][y] = [];
        for (let x = 0; x < pixels.length; x++) {
            const pixelColor = pixels[x][y];
            let colorIndex = null;
            if (pixelColor[3] === 0) { // if alpha is zero => set to transparent
                colorIndex = 255;
            } else {
                colorIndex = findClosestColor(pixelColor, Globals.Palette.colors);
            }
            Globals.Arts[artIndex].tiles[localTileIndex][y][x] = colorIndex;
        }
    }

    // update tilesizx and tilesizy
    Globals.Arts[artIndex].tilesizx[localTileIndex] = pixels.length;
    Globals.Arts[artIndex].tilesizy[localTileIndex] = pixels[0].length;

    render();

}

// edit tile order
function editTileOrder(fromIndex, toIndex, swap) {   

    // group all tiles in a single array
    const tiles = Globals.Arts.reduce((tiles, art) => {  tiles.push(...art.tiles);  return tiles; }, []);

    // move the tile (based on internal ordering index, not display index)
    // this is to make sure that tiles from non-adjacent art files are properly reordered
    // the swapping doesn't really need to use the internal ordering index but we do anyway just to keep it simple
    if (swap) {        
        const tile1 = tiles[fromIndex];
        const tile2 = tiles[toIndex];
        tiles[fromIndex] = tile2;
        tiles[toIndex] = tile1;
    } else {
        tiles.splice(toIndex, 0, tiles.splice(fromIndex, 1)[0]);
    }

    // redistribute the files between the art files (based on localtilestart and localtileend)
    // update tilesizx and tilesizy as well
    // yeah, picanm will be fucked for now    
    let index = 0;
    for (const artIndex in Globals.Arts) {
        const start = Globals.Arts[artIndex].localtilestart;
        const end = Globals.Arts[artIndex].localtileend;
        const numtiles = end - start + 1;
        for (let i = 0; i < numtiles; i++) {
            const tile = tiles[index++];
            Globals.Arts[artIndex].tiles[i] = tile;
            Globals.Arts[artIndex].tilesizx[i] = tile.length;
            Globals.Arts[artIndex].tilesizy[i] = tile[0] ? tile[0].length : 0;
        }
    }

    render();

}

// export palette.dat
function exportPaletteFile() {

    const bytes = Globals.Palette.serialize();

    downloadBlob = function (data, fileName, mimeType) {
        var blob, url;
        blob = new Blob([data], {
            type: mimeType
        });
        url = window.URL.createObjectURL(blob);
        downloadURL(url, fileName);
        setTimeout(function () {
            return window.URL.revokeObjectURL(url);
        }, 1000);
    };

    downloadURL = function (data, fileName) {
        var a;
        a = document.createElement('a');
        a.href = data;
        a.download = fileName;
        document.body.appendChild(a);
        a.style = 'display: none';
        a.click();
        a.remove();
    };

    downloadBlob(bytes, "PALETTE.DAT", "application/octet-stream");

}

// export lookup.dat
function exportLookupFile() {

    const bytes = Globals.Lookup.serialize();

    downloadBlob = function (data, fileName, mimeType) {
        var blob, url;
        blob = new Blob([data], {
            type: mimeType
        });
        url = window.URL.createObjectURL(blob);
        downloadURL(url, fileName);
        setTimeout(function () {
            return window.URL.revokeObjectURL(url);
        }, 1000);
    };

    downloadURL = function (data, fileName) {
        var a;
        a = document.createElement('a');
        a.href = data;
        a.download = fileName;
        document.body.appendChild(a);
        a.style = 'display: none';
        a.click();
        a.remove();
    };

    downloadBlob(bytes, "LOOKUP.DAT", "application/octet-stream");

}

// export .art files
function exportArtFiles() {

    const zip = new JSZip();

    for (const art of Globals.Arts) {
        const bytes = art.serialize();
        zip.file(art.name, bytes, { binary: true });
    }

    downloadBlob = function (blob, fileName, mimeType) {
        var url = window.URL.createObjectURL(blob);
        downloadURL(url, fileName);
        setTimeout(function () {
            return window.URL.revokeObjectURL(url);
        }, 1000);
    };

    downloadURL = function (data, fileName) {
        var a;
        a = document.createElement('a');
        a.href = data;
        a.download = fileName;
        document.body.appendChild(a);
        a.style = 'display: none';
        a.click();
        a.remove();
    };

    zip.generateAsync({ type: 'blob' }).then(content => {
        downloadBlob(content, "arts.zip", "application/octet-stream");
    });

}

// export tiles pngs
function exportTileFiles() {

    const transparency = document.querySelector("input#enable-transparency").checked;
    const shadeIndex = document.querySelector("input#shade-range").value;
    const swapIndex = document.querySelector("select#swap-select").value || null;
    const alternateIndex = document.querySelector("select#alternate-select").value || null;

    // apply palette
    let colors = alternateIndex ? Globals.Lookup.alternates[alternateIndex].colors : Globals.Palette.colors;
    
    // apply swap
    if (Globals.Lookup && swapIndex !== null) {
        colors = colors.map((c, i) => colors[Globals.Lookup.swaps[swapIndex].table[i]]);
    }

    // apply shade
    colors = colors.map((c, i) => colors[Globals.Palette.shades[shadeIndex][i]]);
    
    // convert to [r,g,b,a] array
    colors = colors.map((color, index) => {
        if (transparency && index === 255) {
            return [0,0,0,0];
        } else {
            return [...color, 255];
        }
    });

    const zip = new JSZip();

    for (const art of Globals.Arts) {
        for (let t = 0; t < art.tiles.length; t++) {
            const tile = art.tiles[t];
            if (tile.length) {                
                const width = tile.length;
                const height = tile[0].length;        
                const pixels = new Uint8Array((width * height)*4);        
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const index = tile[x][y];
                        const color = colors[index];
                        const i = x + y * width;
                        pixels[i*4+0] = color[0];
                        pixels[i*4+1] = color[1];
                        pixels[i*4+2] = color[2];
                        pixels[i*4+3] = color[3];
                    }
                }        
                const png8bytes = UPNG.encode([pixels.buffer], width, height, 256);
                zip.file(`${art.localtilestart + t}.png`, png8bytes, { binary: true });
            }
        }
    }

    downloadBlob = function (data, fileName, mimeType) {
        var blob, url;
        blob = new Blob([data], {
            type: mimeType
        });
        url = window.URL.createObjectURL(blob);
        downloadURL(url, fileName);
        setTimeout(function () {
            return window.URL.revokeObjectURL(url);
        }, 1000);
    };

    downloadURL = function (data, fileName) {
        var a;
        a = document.createElement("a");
        a.href = data;
        a.download = fileName;
        document.body.appendChild(a);
        a.style = "display: none";
        a.click();
        a.remove();
    };

    zip.generateAsync({ type: 'blob' }).then(content => {
        downloadBlob(content, "tiles.zip", "application/octet-stream");
    });

}