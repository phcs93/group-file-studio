function Art (bytes) {

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    const byte = () => b(0);
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);
    const int64 = () => b(0)|b(8)|b(16)|b(24)|b(32)|b(40)|b(48)|b(56);

    this.version = int32();

    int32(); // ignore numtiles    

    this.localtilestart = int32();
    this.localtileend = int32();

    this.tiles = new Array(this.localtileend - this.localtilestart + 1);

    this.tilesizx = new Array(this.tiles.length);
    for (let i = 0; i < this.tilesizx.length; i++) {
        this.tilesizx[i] = int16();
    }

    this.tilesizy = new Array(this.tiles.length);    
    for (let i = 0; i < this.tilesizy.length; i++) {
        this.tilesizy[i] = int16();
    }

    this.picanm = new Array(this.tiles.length);    
    for (let i = 0; i < this.picanm.length; i++) {
        this.picanm[i] = int32();
    }

    // each tile will be represented as an array of arrays of bytes => [x][y] = palette index
    for (let i = 0; i < this.tiles.length; i++) {
        this.tiles[i] = [];
        for (let x = 0; x < this.tilesizx[i] ; x++) {
            this.tiles[i][x] = [];
            for (let y = 0; y < this.tilesizy[i]; y++) {
                this.tiles[i][x][y] = byte();
            }
        }
    }

    // prevent anything from being left behind
    this.remaining = bytes.slice(index);

}
