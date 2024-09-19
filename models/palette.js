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

    // this.shades = new Array(); // ?
    // this.transparency = new Array(); // ?

    // prevent anything from being left behind
    this.remaining = bytes.slice(index);

    // revert back to byte array
    this.serialize = () => {

        const byteArray = [];

        // 256 pairs of [byte,byte,byte] scaled down to 0...64
        for (let i = 0; i < this.colors.length; i++) {
            const color = this.colors[i];
            const r = lerp(0, 64, color[0] / 256);
            const g = lerp(0, 64, color[1] / 256);
            const b = lerp(0, 64, color[2] / 145);
            byteArray.push(...[r,g,b]);
        }

        // add remaining bytes if any
        byteArray.push(...this.remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}
