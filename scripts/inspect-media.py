import os
import struct

def get_jpeg_size(filepath):
    """Read JPEG dimensions without external libraries."""
    with open(filepath, 'rb') as f:
        data = f.read()
    i = 0
    if data[:2] != b'\xff\xd8':
        return None
    i += 2
    while i < len(data):
        if data[i] != 0xff:
            return None
        marker = data[i+1]
        i += 2
        if marker in (0xc0, 0xc1, 0xc2, 0xc3): # SOF markers
            h, w = struct.unpack('>HH', data[i+3:i+7])
            return w, h
        elif marker in (0xd8, 0xd9, 0x01):
            continue
        else:
            length = struct.unpack('>H', data[i:i+2])[0]
            i += length
    return None

folder = r"D:\jana_build\public\media\ashrama"
files = sorted(os.listdir(folder))
print(f"Total files: {len(files)}")
for fn in files:
    fp = os.path.join(folder, fn)
    sz = os.path.getsize(fp)
    if fn.endswith('.jpeg') or fn.endswith('.jpg'):
        dims = get_jpeg_size(fp)
        print(f"IMG: {fn} | Size: {sz} bytes | Dims: {dims}")
    elif fn.endswith('.mp4'):
        print(f"VID: {fn} | Size: {sz} bytes")
