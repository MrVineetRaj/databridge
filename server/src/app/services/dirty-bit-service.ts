class DirtyBitService {
  dirtyBitName: string;
  dirtyBitValue: number;

  constructor({ dirtyBitName }: { dirtyBitName: string }) {
    this.dirtyBitName = dirtyBitName;
    this.dirtyBitValue = 1;
  }

  makeItDirty() {
    this.dirtyBitValue = 1;
  }

  isDirty() {
    return this.dirtyBitValue === 1;
  }

  cleanBit() {
    this.dirtyBitValue = 0;
  }
}

export const dirtyBitForWhitelistingDB = new DirtyBitService({
  dirtyBitName: "for-whitelisting-ip",
});
