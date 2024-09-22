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

    this.alternates = new Array(6);

    for (let i = 0; i < this.alternates.length; i++) {        
        this.alternates[i] = {
            name: (() => {
                switch (i) {
                    case 0: return "underwater";
                    case 1: return "night vision / underslime";
                    case 2: return "3d realms logo";
                    case 3: return "title screen";
                    case 4: return "episode 1 ending";
                    case 5: return "temporary slot for .anm files";
                }
            })(),
            colors: new Array(256).fill(0).map(() => [
                lerp(0, 255, byte() / 64),
                lerp(0, 255, byte() / 64),
                lerp(0, 255, byte() / 64),
            ])
        };    
    }

    // prevent anything from being left behind
    this.remaining = bytes.slice(index);

    // revert back to byte array
    this.serialize = () => {

        const int16ToBytes = (i) => [i>>0,i>>8];
        const int32ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24];
        const int64ToBytes = (i) => [i>>0,i>>8,i>>16,i>>24,i>>32,i>>40,i>>48,i>>56];

        const byteArray = [];        

        // first byte is the number of swap tables
        byteArray.push(this.swaps.length);

        // the rest of the bytes are the swap table index + the table itself
        for (let i = 0; i < this.swaps.length; i++) {        
            byteArray.push(this.swaps[i].index);
            byteArray.push(...this.swaps[i].table);
        }

        // alternative palette tables => arrays of 256 [byte,byte,byte] byte arrays scaled down to 0...64
        for (let i = 0; i < this.alternatives.length; i++) {
            const color = this.alternatives[i].colors;
            const r = lerp(0, 64, color[0] / 255);
            const g = lerp(0, 64, color[1] / 255);
            const b = lerp(0, 64, color[2] / 255);
            byteArray.push(...[r,g,b]);
        }

        // add remaining bytes if any
        byteArray.push(...this.remaining);

        // convert to uint8array (not sure if necessary)
        return new Uint8Array(byteArray);

    };

}