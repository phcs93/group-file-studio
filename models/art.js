function Art (bytes, name) {

    this.name = name;

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    const byte = () => b(0);
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);
    const int64 = () => b(0)|b(8)|b(16)|b(24)|b(32)|b(40)|b(48)|b(56);

    const isolate = (v, s, e) => (v >> s) & (1 << e - s + 1) - 1;
    const attach = (v, s, e, n) => (v & ~(((1 << (e - s + 1)) - 1) << s)) | ((n & ((1 << (e - s + 1)) - 1)) << s);

    this.version = int32();
    this.numtiles = int32();
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
        const picanm = int32();
        this.picanm[i] = {
            frames: isolate(picanm, 0, 5),
            type: isolate(picanm, 6, 7),
            offsetX: isolate(picanm, 8, 15),
            offsetY: isolate(picanm, 16, 23),
            speed: isolate(picanm, 24, 27),
            unused: isolate(picanm, 28, 31)
        };
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

    // revert back to byte array
    this.serialize = () => {

        const int16ToBytes = (i) => [i>>0,i>>8];
        const int32ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24];
        const int64ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24,i>>32,i>>40,i>>48,i>>56];

        const byteArray = [];

        byteArray.push(...int32ToBytes(this.version));
        byteArray.push(...int32ToBytes(this.numtiles));
        byteArray.push(...int32ToBytes(this.localtilestart));
        byteArray.push(...int32ToBytes(this.localtileend));
        
        for (let i = 0; i < this.tilesizx.length; i++) {
            byteArray.push(...int16ToBytes(this.tilesizx[i]));
        }

        for (let i = 0; i < this.tilesizy.length; i++) {
            byteArray.push(...int16ToBytes(this.tilesizy[i]));
        }        

        for (let i = 0; i < this.picanm.length; i++) {
            let picanm = 0;
            picanm = attach(picanm, 0, 5, this.picanm[i].frames);
            picanm = attach(picanm, 6, 7, this.picanm[i].type);
            picanm = attach(picanm, 8, 15, this.picanm[i].offsetX);
            picanm = attach(picanm, 16, 23, this.picanm[i].offsetY);
            picanm = attach(picanm, 24, 27, this.picanm[i].speed);
            picanm = attach(picanm, 28, 31, this.picanm[i].unused);
            byteArray.push(...int32ToBytes(picanm));
        }

        for (let i = 0; i < this.tiles.length; i++) {
            for (let x = 0; x < this.tilesizx[i] ; x++) {
                for (let y = 0; y < this.tilesizy[i]; y++) {
                    byteArray.push(this.tiles[i][x][y]);
                }
            }
        }

        // add remaining bytes if any
        byteArray.push(...this.remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}