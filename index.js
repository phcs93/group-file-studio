Globals = {
    Pelette: null,
    Lookup: null,
    Arts: [],
    SelectedPaletteColorIndex: null
};

document.addEventListener("DOMContentLoaded", () => {

    // change grid size
    document.querySelector("input#grid-size-range").oninput = async e => {
        document.querySelector("label#grid-size-label").dataset.gridsize = e.target.value;
        document.querySelector(":root").style.setProperty("--grid-size", `${e.target.value}px`);
    };

    // change palette
    document.querySelector("input#palette-input").onchange = e => {
        const reader = new FileReader();
        reader.onload = () => {
            const bytes = new Uint8Array(reader.result);
            Globals.Palette = new Palette(bytes);
            console.log(Globals.Palette);
            renderPalette(Globals.Palette);

        };
        reader.readAsArrayBuffer(e.target.files[0]);
    };

    // change lookup
    document.querySelector("input#lookup-input").onchange = e => {
        const reader = new FileReader();
        reader.onload = () => {
            const bytes = new Uint8Array(reader.result);
            Globals.Lookup = new Lookup(bytes);
            console.log(Globals.Lookup);
            renderLookup(Globals.Palette, Globals.Lookup, null);
            renderSwapOptions(Globals.Lookup);
        };
        reader.readAsArrayBuffer(e.target.files[0]);
    };

    // change swapIndex
    document.querySelector("select#swap-select").onchange = e => {
        const swapIndex = e.target.value || null;
        renderLookup(Globals.Palette, Globals.Lookup, swapIndex);
        renderArts(Globals.Palette, Globals.Lookup, swapIndex, Globals.Arts);
    };

    // change art
    document.querySelector("input#art-input").onchange = async e => {
        Globals.Arts = [];
        const swap = document.querySelector("select#swap-select").value || null;
        for (const file of e.target.files) {
            const buffer = await file.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            const art = new Art(bytes);
            Globals.Arts.push(art);
            console.log(art);
        }
        renderArts(Globals.Palette, Globals.Lookup, swap, Globals.Arts);
    };

});

// render palette
function renderPalette(palette) {

    const svg = document.querySelector("svg#palette-svg");

    svg.innerHTML = "";

    const elements = [];

    const size = Math.sqrt(palette.colors.length);

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const color = palette.colors[x + y * size];
            const rect = `<rect data-selected="false" onclick="selectPaletteColorIndex(this, ${x + y * size})" x="${x * 16}" y="${y * 16}" width="16px" height="16px" fill="rgb(${color[0]},${color[1]},${color[2]})" />`;
            elements.push(rect);
        }
    }

    svg.insertAdjacentHTML("beforeend", elements.join(""));

}

// render lookup (swaped palette)
function renderLookup(palette, lookup, swapIndex) {

    const svg = document.querySelector("svg#lookup-svg");

    svg.innerHTML = "";

    const elements = [];

    const size = Math.sqrt(palette.colors.length);

    for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
            const colorIndex = swapIndex !== null ? lookup.swaps[swapIndex].table[x + y * size] : x + y * size;
            const color = palette.colors[colorIndex];
            const rect = `<rect onclick="editLookupTable(${swapIndex !== null ? swapIndex : "null"}, ${x + y * size})" x="${x * 16}" y="${y * 16}" width="16px" height="16px" fill="rgb(${color[0]},${color[1]},${color[2]})" />`;
            elements.push(rect);
        }
    }

    svg.insertAdjacentHTML("beforeend", elements.join(""));

}

// render swap options
function renderSwapOptions(lookup) {
    const sort = (a, b) => parseInt(a.index) - parseInt(b.index);
    const defaultOption = `<option value="">default</option>`;
    const options = lookup.swaps.sort(sort).map((swap, i) => `
        <option value="${i}">${swap.index}</option>
    `);
    document.querySelector("select#swap-select").innerHTML = [defaultOption].concat(options).join("");
}

// render art
function renderArts(palette, lookup, swapIndex, arts) {

    const grid = document.querySelector("div#tiles");

    grid.innerHTML = "";

    palette = palette.colors;

    if (lookup && swapIndex !== null) {
        palette = palette.map((c, i) => palette[lookup.swaps[swapIndex].table[i]]);
    }

    for (let a = 0; a < arts.length; a++) {

        const art = arts[a];

        for (let t = 0; t < art.tiles.length; t++) {

            const canvas = document.createElement("canvas");
            canvas.dataset.picnum = art.localtilestart + t;

            const tile = art.tiles[t];

            if (tile.length > 0) {

                canvas.dataset.width = tile.length;
                canvas.dataset.height = tile[0].length;

                canvas.setAttribute("title", `#${art.localtilestart + t} [${tile.length}x${tile[0].length}]`);

                // 1d array for the canvas
                const colors = [];

                // iterate the Y axis first because the tiles are stored in the opposite coordinate system than the screen memory is stored
                for (let y = 0; y < tile[0].length; y++) {
                    for (let x = 0; x < tile.length; x++) {
                        const index = tile[x][y];
                        const color = palette[index];
                        colors.push(color);
                    }
                }

                canvas.width = tile.length;
                canvas.height = tile[0].length;
                const context = canvas.getContext("2d");
                const data = context.createImageData(tile.length, tile[0].length);

                for (let i = 0; i < colors.length; i++) {
                    data.data[i * 4 + 0] = colors[i][0];
                    data.data[i * 4 + 1] = colors[i][1];
                    data.data[i * 4 + 2] = colors[i][2];
                    data.data[i * 4 + 3] = 255;
                }

                context.putImageData(data, 0, 0);

            } else {
                canvas.setAttribute("title", `#${art.localtilestart + t}`);
            }

            grid.appendChild(canvas);

        }

    }

}

// select palette color
function selectPaletteColorIndex(element, colorIndex) {
    document.querySelectorAll("svg#palette-svg rect").forEach(e => e.dataset.selected = false);
    element.dataset.selected = true;
    Globals.SelectedPaletteColorIndex = colorIndex;
}

// edit lookup table
function editLookupTable(swapIndex, colorIndex) {

    if (Globals.SelectedPaletteColorIndex && swapIndex !== null) {

        Globals.Lookup.swaps[swapIndex].table[colorIndex] = Globals.SelectedPaletteColorIndex;

        renderLookup(Globals.Palette, Globals.Lookup, swapIndex);
        renderArts(Globals.Palette, Globals.Lookup, swapIndex, Globals.Arts);

    }

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