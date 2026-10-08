import os
import struct
import hashlib
import json

folder = r"D:\jana_build\public\media\ashrama"

def get_jpeg_size(filepath):
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
            i = 0
            if data[:2] != b'\xff\xd8':
                return None
            i += 2
            while i < len(data):
                if data[i] != 0xff:
                    i += 1
                    continue
                marker = data[i+1]
                i += 2
                if marker in (0xd8, 0xd9, 0x01): # SOI, EOI, TEM
                    continue
                length = struct.unpack(">H", data[i:i+2])[0]
                if marker in (0xc0, 0xc1, 0xc2, 0xc3): # SOF markers
                    h, w = struct.unpack(">HH", data[i+3:i+7])
                    return (w, h)
                i += length
    except Exception as e:
        return None
    return None

files = os.listdir(folder)
res = []
seen_hashes = {}

for f in sorted(files):
    p = os.path.join(folder, f)
    if os.path.isfile(p):
        size = os.path.getsize(p)
        with open(p, 'rb') as fp:
            h = hashlib.sha256(fp.read()).hexdigest()
        is_dup = h in seen_hashes
        orig = seen_hashes.get(h, None)
        if not is_dup:
            seen_hashes[h] = f
        dims = get_jpeg_size(p) if f.endswith(('.jpeg', '.jpg')) else None
        res.append({
            "name": f,
            "size": size,
            "hash_prefix": h[:8],
            "is_dup": is_dup,
            "dup_of": orig,
            "dims": dims
        })

print(f"Total files: {len(res)}, Unique: {len(seen_hashes)}")
with open(r"D:\jana_build\scripts\ashrama_media_meta.json", "w") as out:
    json.dump(res, out, indent=2)
print("Saved metadata to scripts/ashrama_media_meta.json")
