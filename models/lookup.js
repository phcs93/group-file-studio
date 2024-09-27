function Lookup (bytes) {

    // linear interpolation
    const lerp = (a, b, v) => (1 - v) * a + v * b;

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    
    const byte = () => b(0);
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);
    const int64 = () => b(0)|b(8)|b(16)|b(24)|b(32)|b(40)|b(48)|b(56);

    const ubyte = () => byte() & 0xFF;
    const uint16 = () => int16() & 0xFFFF;
    const uint32 = () => int32() & 0xFFFFFFFF;
    const uint64 = () => int64() & 0xFFFFFFFFFFFFFFFF;

    this.swaps = new Array(ubyte());

    for (let i = 0; i < this.swaps.length; i++) {        
        this.swaps[i] = {
            index: ubyte(),
            table: new Array(256).fill(0).map(() => ubyte())
        };
    }

    this.alternates = new Array((bytes.length - index) / (256*3));

    for (let i = 0; i < this.alternates.length; i++) {        
        this.alternates[i] = new Array(256).fill(0).map(() => [
            lerp(0, 255, ubyte() / 64),
            lerp(0, 255, ubyte() / 64),
            lerp(0, 255, ubyte() / 64)
        ]);   
    }

    // prevent anything from being left behind
    this.remaining = bytes.slice(index);

    // revert back to byte array
    this.serialize = () => {

        const int16ToBytes = (i) => [i>>0,i>>8];
        const int32ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24];
        const int64ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24,i>>32,i>>40,i>>48,i>>56];

        const byteArray = [];        
        
        byteArray.push(this.swaps.length);
        
        for (let i = 0; i < this.swaps.length; i++) {        
            byteArray.push(this.swaps[i].index);
            byteArray.push(...this.swaps[i].table);
        }

        for (let i = 0; i < this.alternates.length; i++) {
            const alternate = this.alternates[i];
            for (const color of alternate) {
                const r = lerp(0, 64, color[0] / 255);
                const g = lerp(0, 64, color[1] / 255);
                const b = lerp(0, 64, color[2] / 255);
                byteArray.push(...[r,g,b]);
            }
        }

        // add remaining bytes if any
        byteArray.push(...this.remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}