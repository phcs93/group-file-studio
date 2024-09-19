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

    this.shades = new Array(); // ?
    this.transparency = new Array(); // ?

    // prevent anything from being left behind
    this.remaining = bytes.slice(index);

}
