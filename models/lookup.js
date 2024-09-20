function Lookup (bytes) {

    // linear interpolation
    const lerp = (a, b, v) => (1 - v) * a + v * b;

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    const byte = () => b(0);
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);
    const int64 = () => b(0)|b(8)|b(16)|b(24)|b(32)|b(40)|b(48)|b(56);

    this.swaps = new Array(byte());

    for (let i = 0; i < this.swaps.length; i++) {        
        this.swaps[i] = {
            index: byte(),
            table: new Array(256).fill(0).map(() => byte())
        };
    }

    // TO-DO => only in duke nukem 3d
    // this.alternates = new Array(6);

    // for (let i = 0; i < this.alternates.length; i++) {        
    //     this.alternates[i] = new Array(256).fill(0).map(() => [
    //         lerp(0, 255, byte() / 64),
    //         lerp(0, 255, byte() / 64),
    //         lerp(0, 255, byte() / 64),
    //     ]);
    // }

    // prevent anything from being left behind
    this.remaining = bytes.slice(index);

    // revert back to byte array
    this.serialize = () => {

        const byteArray = [];        

        // first byte is the number of swap tables
        byteArray.push(this.swaps.length);

        // the rest of the bytes are the swap table index + the table itself
        for (let i = 0; i < this.swaps.length; i++) {        
            byteArray.push(this.swaps[i].index);
            byteArray.push(...this.swaps[i].table);
        }

        // add remaining bytes if any
        byteArray.push(...this.remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}