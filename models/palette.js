function Palette (bytes) {

    // linear interpolation
    const lerp = (a, b, v) => (1 - v) * a + v * b;

    let index = 0; 

    const b = (n) => bytes[index++] << n;
    const byte = () => b(0);
    const int16 = () => b(0)|b(8);
    const int32 = () => b(0)|b(8)|b(16)|b(24);
    const int64 = () => b(0)|b(8)|b(16)|b(24)|b(32)|b(40)|b(48)|b(56);

    this.colors = new Array(256);

    for (let i = 0; i < this.colors.length; i++) {
        // scale from 0...64 to 0...256 (DOS was limited)
        const r = lerp(0, 255, byte() / 64);
        const g = lerp(0, 255, byte() / 64);
        const b = lerp(0, 255, byte() / 64);
        this.colors[i] = [r, g, b];
    }

    this.shades = new Array(int16());

    for (let i = 0; i < this.shades.length; i++) {
        this.shades[i] = new Array(256).fill(0).map(() => byte());
    }

    // this.transparency = new Array(256).fill(new Array(256));

    // for (let x = 0; x < this.transparency.length; x++) {
    //     for (let y = 0; y < this.transparency[x].length; y++) {
    //         this.transparency[x][y] = byte();
    //     }
    // }

    // prevent anything from being left behind
    this.remaining = bytes.slice(index);

    // revert back to byte array
    this.serialize = () => {

        const int16ToBytes = (i) => [i>>0,i>>8];
        const int32ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24];
        const int64ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24,i>>32,i>>40,i>>48,i>>56];

        const byteArray = [];

        // 256 pairs of [byte,byte,byte] scaled down to 0...64
        for (let i = 0; i < this.colors.length; i++) {
            const color = this.colors[i];
            const r = lerp(0, 64, color[0] / 255);
            const g = lerp(0, 64, color[1] / 255);
            const b = lerp(0, 64, color[2] / 255);
            byteArray.push(...[r,g,b]);
        }

        // shades number
        byteArray.push(...int16ToBytes(this.shades.length));

        // arrays of 256 bytes
        for (let i = 0; i < this.shades.length; i++) {
            byteArray.push(...this.shades[i]);
        }

        // add remaining bytes if any
        byteArray.push(...this.remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}
