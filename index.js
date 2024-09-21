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
            Globals.Palette = new Palette(Globals.GRP.getFileBytes("PALETTE.DAT"));
            console.log(Globals.Palette);

            // lookup
            Globals.Lookup = new Lookup(Globals.GRP.getFileBytes("LOOKUP.DAT"));
            console.log(Globals.Lookup);

            // all .art files in the grp
            Globals.Arts = [];
            for (const file of Globals.GRP.files.filter(f => f.name.toUpperCase().endsWith(".ART"))) {
                const art = new Art(Globals.GRP.getFileBytes(file.name), file.name);
                Globals.Arts.push(art);
                console.log(art);
            }

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
        Globals.Arts = Globals.Arts.sort((a,b) => a.localtilestart - b.localtilestart);
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
        document.querySelectorAll("div.grid").forEach(grid => grid.dataset.background = e.target.checked);
    };

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

// render alternates options
function renderAlternateOptions(lookup) {
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

    for (let a = 0; a < arts.length; a++) {

        const art = arts[a];

        const h1 = document.createElement("h1");
        h1.innerHTML = `${art.name} [${art.localtilestart}-${art.localtileend}]`;
        main.appendChild(h1);

        const div = document.createElement("div");
        div.setAttribute("class", "grow grid");

        for (let t = 0; t < art.tiles.length; t++) {

            const canvas = document.createElement("canvas");
            canvas.dataset.picnum = art.localtilestart + t;

            const tile = art.tiles[t];

            if (tile.length > 0) {

                canvas.dataset.width = tile.length;
                canvas.dataset.height = tile[0].length;

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