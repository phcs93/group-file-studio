function GRP (bytes) {

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

    this.signature = new Array(12).fill(0).map(() => String.fromCharCode(byte())).join("");

    this.files = new Array(uint32());

    for (let i = 0; i < this.files.length; i++) {
        this.files[i] = {
            i, // this is just to make the "getFile" calculation easier
            name: new Array(12).fill(0).map(() => String.fromCharCode(byte())).join("").replace(/\x00/g, ""),
            size: uint32()
        }        
    }

    // read only the bytes from the desired file
    this.getFileBytes = (name) => {

        const filtered = this.files.filter(f => f.name.toUpperCase() === name.toUpperCase());

        if (filtered.length === 1) {

            const file = filtered[0];

            const bytesToSkipStartingFromIndex = this.files.filter(f => f.i < file.i).reduce((acc, crr) => {
                acc += crr.size;
                return acc;
            }, 0);

            return bytes.slice(index + bytesToSkipStartingFromIndex, index + bytesToSkipStartingFromIndex + file.size);

        } else {
            return null;
        }

    }

}