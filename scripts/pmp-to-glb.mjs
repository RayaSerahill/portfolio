#!/usr/bin/env node
/*
  Turns the model inside a Penumbra mod pack (.pmp) into a compact GLB that three.js can load.

    node scripts/pmp-to-glb.mjs "<mod>.pmp" public/christmas-market/necklace.glb
    node scripts/pmp-to-glb.mjs "<mod>.pmp" out.glb --model chara/.../c0201a0095_nek.mdl

  What ends up in the GLB:
    - geometry of LOD 0: positions, normals, UVs and indices, one node per .mdl mesh ("mesh0", ...)
    - one PBR material per .mtrl, built from its Dawntrail color table. The id texture picks the
      color table row per texel, exactly like the game does. When every texel a mesh touches lands
      on the same values the material is written as plain factors, otherwise the result is baked
      into base color / metal-roughness / emissive textures.
    - vertex data is quantized (KHR_mesh_quantization) and compressed (EXT_meshopt_compression),
      so the loader needs a meshopt decoder: loader.setMeshoptDecoder(MeshoptDecoder)

  What it does not carry over: skinning, vertex colors, sheen, anisotropy, sphere maps and tiling.
  Block-compressed textures, non-flat normal maps and non-white mask textures are skipped with a
  warning, and legacy (pre-Dawntrail) color tables only get an approximate roughness.
*/

import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateRawSync } from "node:zlib";
import { MeshoptEncoder } from "meshoptimizer/encoder";

const args = process.argv.slice(2);
const modelFlag = args.indexOf("--model");
const wantedModel = modelFlag >= 0 ? args.splice(modelFlag, 2)[1] : null;
const [pmpPath, outPath] = args;

if (!pmpPath || !outPath) {
  console.error('usage: node scripts/pmp-to-glb.mjs "<mod>.pmp" <out.glb> [--model <game path of the .mdl>]');
  process.exit(1);
}

const warnings = new Set();
const warn = (message) => warnings.add(message);
const norm = (path) => path.replaceAll("\\", "/").replace(/^\/+/, "").toLowerCase();
const clamp01 = (value) => Math.min(1, Math.max(0, value));
const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function half(bits) {
  const sign = bits & 0x8000 ? -1 : 1;
  const exponent = (bits >> 10) & 0x1f;
  const fraction = bits & 0x3ff;
  if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024);
  if (exponent === 31) return fraction ? NaN : sign * Infinity;
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}

/* ------------------------------------------------------------------ */
/*  .pmp is a zip: read its directory and the Penumbra file map        */
/* ------------------------------------------------------------------ */

function readZip(buffer) {
  let end = buffer.length - 22;
  while (end >= 0 && buffer.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0) throw new Error("Not a zip archive (a .pmp should be one).");

  const entries = new Map();
  let at = buffer.readUInt32LE(end + 16);
  for (let i = 0; i < buffer.readUInt16LE(end + 10); i++) {
    if (buffer.readUInt32LE(at) !== 0x02014b50) throw new Error("Broken zip directory.");
    const method = buffer.readUInt16LE(at + 10);
    const size = buffer.readUInt32LE(at + 20);
    const nameLength = buffer.readUInt16LE(at + 28);
    const local = buffer.readUInt32LE(at + 42);
    const name = buffer.toString("utf8", at + 46, at + 46 + nameLength);
    entries.set(norm(name), () => {
      const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
      const data = buffer.subarray(start, start + size);
      if (method === 0) return data;
      if (method === 8) return inflateRawSync(data);
      throw new Error(`Unsupported zip compression method ${method} for ${name}`);
    });
    at += 46 + nameLength + buffer.readUInt16LE(at + 30) + buffer.readUInt16LE(at + 32);
  }
  return entries;
}

const zip = readZip(readFileSync(pmpPath));
const readJson = (name) => JSON.parse(zip.get(name)().toString("utf8").replace(/^﻿/, ""));
const meta = zip.has("meta.json") ? readJson("meta.json") : {};

/* game path -> path inside the archive. Only the default option is followed. */
const gameFiles = new Map();
const addFiles = (files) => {
  for (const [gamePath, archivePath] of Object.entries(files ?? {})) gameFiles.set(norm(gamePath), norm(archivePath));
};
addFiles(meta.DefaultData?.Files);
if (zip.has("default_mod.json")) addFiles(readJson("default_mod.json").Files);
for (const name of zip.keys()) if (!gameFiles.has(name)) gameFiles.set(name, name);

const readGameFile = (gamePath) => {
  const archivePath = gameFiles.get(norm(gamePath));
  return archivePath && zip.has(archivePath) ? zip.get(archivePath)() : null;
};

/* ------------------------------------------------------------------ */
/*  .mdl (versions 5 and 6): geometry of LOD 0                         */
/* ------------------------------------------------------------------ */

const USAGE = { position: 0, normal: 3, uv: 4 };

function readElement(view, at, type) {
  const f = (i) => view.getFloat32(at + i * 4, true);
  const h = (i) => half(view.getUint16(at + i * 2, true));
  const b = (i) => view.getUint8(at + i);
  switch (type) {
    case 1: return [f(0), f(1)];
    case 2: return [f(0), f(1), f(2)];
    case 3: return [f(0), f(1), f(2), f(3)];
    case 8: return [b(0) / 255, b(1) / 255, b(2) / 255, b(3) / 255];
    case 13: return [h(0), h(1)];
    case 14: return [h(0), h(1), h(2), h(3)];
    default: throw new Error(`Unsupported vertex element type ${type}`);
  }
}

function parseMdl(data) {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const u8 = (at) => view.getUint8(at);
  const u16 = (at) => view.getUint16(at, true);
  const u32 = (at) => view.getUint32(at, true);

  const version = u32(0);
  if (version !== 0x01000005 && version !== 0x01000006) throw new Error(`Unsupported .mdl version 0x${version.toString(16)}`);
  const declarationCount = u16(12);
  const vertexOffset = u32(16);
  const indexOffset = u32(28);

  let at = 68;
  const declarations = [];
  for (let d = 0; d < declarationCount; d++) {
    const elements = [];
    for (let e = 0; e < 17; e++) {
      const stream = u8(at + e * 8);
      if (stream === 255) break;
      elements.push({ stream, offset: u8(at + e * 8 + 1), type: u8(at + e * 8 + 2), usage: u8(at + e * 8 + 3), usageIndex: u8(at + e * 8 + 4) });
    }
    declarations.push(elements);
    at += 17 * 8;
  }

  const stringSize = u32(at + 4);
  const strings = data.subarray(at + 8, at + 8 + stringSize);
  const cstring = (offset) => strings.toString("utf8", offset, strings.indexOf(0, offset));
  at += 8 + stringSize;

  const header = at;
  const meshCount = u16(header + 4);
  const attributeCount = u16(header + 6);
  const submeshCount = u16(header + 8);
  const materialCount = u16(header + 10);
  const elementIdCount = u16(header + 24);
  const terrainShadowMeshCount = u8(header + 26);
  const extraLods = (u8(header + 27) & 0x10) !== 0;
  const terrainShadowSubmeshCount = u16(header + 38);
  at = header + 56 + elementIdCount * 32;

  const lodMeshIndex = u16(at);
  const lodMeshCount = u16(at + 2);
  at += 3 * 60 + (extraLods ? 3 * 40 : 0);

  const meshTable = at;
  at += meshCount * 36 + attributeCount * 4 + terrainShadowMeshCount * 20 + submeshCount * 16 + terrainShadowSubmeshCount * 10;
  const materialNames = Array.from({ length: materialCount }, (_, i) => cstring(u32(at + i * 4)));

  const meshes = [];
  for (let m = lodMeshIndex; m < lodMeshIndex + lodMeshCount && m < meshCount; m++) {
    const base = meshTable + m * 36;
    const vertexCount = u16(base);
    const indexCount = u32(base + 4);
    const startIndex = u32(base + 16);
    const streamOffsets = [u32(base + 20), u32(base + 24), u32(base + 28)];
    const strides = [u8(base + 32), u8(base + 33), u8(base + 34)];
    if (!vertexCount || !indexCount) continue;

    const positions = new Float32Array(vertexCount * 3);
    const normals = new Float32Array(vertexCount * 3);
    const uvs = new Float32Array(vertexCount * 2);
    const targets = { [USAGE.position]: [positions, 3], [USAGE.normal]: [normals, 3], [USAGE.uv]: [uvs, 2] };

    for (const element of declarations[m]) {
      const target = targets[element.usage];
      if (!target || element.usageIndex !== 0) continue;
      const [array, size] = target;
      const start = vertexOffset + streamOffsets[element.stream] + element.offset;
      for (let v = 0; v < vertexCount; v++) {
        const value = readElement(view, start + v * strides[element.stream], element.type);
        for (let c = 0; c < size; c++) array[v * size + c] = value[c] ?? 0;
      }
    }

    const indices = new Uint32Array(indexCount);
    for (let i = 0; i < indexCount; i++) indices[i] = u16(indexOffset + (startIndex + i) * 2);

    meshes.push({ name: `mesh${m}`, materialName: materialNames[u16(base + 8)] ?? "", positions, normals, uvs, indices });
  }

  return { meshes, materialNames };
}

/* ------------------------------------------------------------------ */
/*  .tex and .mtrl                                                     */
/* ------------------------------------------------------------------ */

/* Returns top mip as RGBA8, or null for formats this script does not decode. */
function parseTex(data, label) {
  const format = data.readUInt32LE(4);
  const width = data.readUInt16LE(8);
  const height = data.readUInt16LE(10);
  const start = data.readUInt32LE(28);
  if (format !== 0x1450 && format !== 0x1451) {
    warn(`${label}: texture format 0x${format.toString(16)} is not decoded, texture ignored`);
    return null;
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = data[start + i * 4 + 2];
    rgba[i * 4 + 1] = data[start + i * 4 + 1];
    rgba[i * 4 + 2] = data[start + i * 4];
    rgba[i * 4 + 3] = format === 0x1450 ? data[start + i * 4 + 3] : 255;
  }
  return { width, height, rgba };
}

const SAMPLER = { 0x115306be: "diffuse", 0x0c5ec1f1: "normal", 0x8a4e82b6: "mask", 0x565f8fd8: "index" };

function parseMtrl(data) {
  const dataSetSize = data.readUInt32LE(4) >>> 16;
  const stringSize = data.readUInt16LE(8);
  const shaderOffset = data.readUInt16LE(10);
  const textureCount = data[12];
  let at = 16;
  const textureOffsets = Array.from({ length: textureCount }, (_, i) => data.readUInt16LE(at + i * 4));
  at += (textureCount + data[13] + data[14]) * 4;
  const strings = data.subarray(at, at + stringSize);
  const cstring = (offset) => strings.toString("utf8", offset, strings.indexOf(0, offset));
  at += stringSize + data[15];

  /* color table: 32 rows of 32 halfs since Dawntrail, 16 rows of 16 halfs before */
  const [rowCount, rowSize] = dataSetSize >= 2048 ? [32, 32] : dataSetSize >= 512 ? [16, 16] : [0, 0];
  const rows = Array.from({ length: rowCount }, (_, r) =>
    Array.from({ length: rowSize }, (_, i) => half(data.readUInt16LE(at + (r * rowSize + i) * 2))),
  );
  at += dataSetSize;

  const keyCount = data.readUInt16LE(at + 2);
  const constantCount = data.readUInt16LE(at + 4);
  const samplerCount = data.readUInt16LE(at + 6);
  at += 12 + keyCount * 8 + constantCount * 8;

  const textures = {};
  for (let s = 0; s < samplerCount; s++) {
    const role = SAMPLER[data.readUInt32LE(at + s * 12)];
    const path = cstring(textureOffsets[data[at + s * 12 + 8]]);
    if (role) textures[role] = path;
  }

  return { shader: cstring(shaderOffset), rows, textures };
}

/* One color table row as glTF-style PBR values (colors are linear). */
function rowToPbr(row) {
  if (row.length === 32) {
    return { color: row.slice(0, 3), emissive: row.slice(8, 11), roughness: row[16], metalness: row[18] };
  }
  warn("legacy color table: roughness is approximated from gloss, metalness is 0");
  return { color: row.slice(0, 3), emissive: row.slice(8, 11), roughness: Math.sqrt(2 / (Math.max(row[7], 0) + 2)), metalness: 0 };
}

const WHITE_ROW = { color: [1, 1, 1], emissive: [0, 0, 0], roughness: 0.5, metalness: 0 };

/*
  Evaluates a material per texel: the id texture's red channel picks a row pair, green blends
  inside the pair (255 = even row). Returns float layers at the largest texture resolution.
*/
function bakeMaterial(mtrl, label) {
  const load = (role) => {
    const path = mtrl.textures[role];
    const data = path && readGameFile(path);
    if (path && !data) warn(`${label}: ${role} texture ${path} is not in the mod, ignored`);
    return data ? parseTex(data, `${label} ${role}`) : null;
  };
  const index = load("index");
  const diffuse = load("diffuse");
  const normal = load("normal");
  const mask = load("mask");

  if (normal && normal.rgba.some((value, i) => i % 4 < 2 && Math.abs(value - 127.5) > 1.5)) {
    warn(`${label}: normal map is not flat and was not exported`);
  }
  if (mask && mask.rgba.some((value) => value !== 255)) warn(`${label}: mask texture is not plain white and was not exported`);

  const pbrRows = mtrl.rows.map(rowToPbr);
  const dawntrail = mtrl.rows.length === 32;
  const width = Math.max(index?.width ?? 1, diffuse?.width ?? 1);
  const height = Math.max(index?.height ?? 1, diffuse?.height ?? 1);
  const texel = (texture, x, y, channel) =>
    texture.rgba[(Math.floor((y * texture.height) / height) * texture.width + Math.floor((x * texture.width) / width)) * 4 + channel] / 255;

  /* per texel: r g b (linear), metalness, roughness, emissive r g b */
  const layers = new Float32Array(width * height * 8);
  const rowAt = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let a = pbrRows[0] ?? WHITE_ROW;
      let b = a;
      let blend = 0;
      if (index && pbrRows.length) {
        const red = texel(index, x, y, 0);
        if (dawntrail) {
          const pair = Math.round(red * 15);
          a = pbrRows[pair * 2];
          b = pbrRows[pair * 2 + 1];
          blend = 1 - texel(index, x, y, 1);
          rowAt[y * width + x] = pair * 2 + (blend > 0.5 ? 1 : 0);
        } else {
          const row = Math.floor(red * 15);
          a = pbrRows[row];
          b = pbrRows[Math.min(row + 1, 15)];
          blend = red * 15 - row;
          rowAt[y * width + x] = row;
        }
      }

      const mix = (pick) => pick(a) * (1 - blend) + pick(b) * blend;
      const out = (y * width + x) * 8;
      for (let c = 0; c < 3; c++) {
        const tint = diffuse ? srgbToLinear(texel(diffuse, x, y, c)) : 1;
        layers[out + c] = clamp01(mix((row) => row.color[c]) * tint);
        layers[out + 5 + c] = clamp01(mix((row) => row.emissive[c]));
      }
      layers[out + 3] = clamp01(mix((row) => row.metalness));
      layers[out + 4] = clamp01(mix((row) => row.roughness));
    }
  }

  return { width, height, layers, rowAt };
}

/* Marks every texel that the UV bounding box of some triangle overlaps. */
function touchedTexels(meshes, width, height) {
  const touched = new Uint8Array(width * height);
  for (const { uvs, indices } of meshes) {
    for (let i = 0; i < indices.length; i += 3) {
      let minU = Infinity, minV = Infinity, maxU = -Infinity, maxV = -Infinity;
      for (let k = 0; k < 3; k++) {
        const u = uvs[indices[i + k] * 2];
        const v = uvs[indices[i + k] * 2 + 1];
        minU = Math.min(minU, u); maxU = Math.max(maxU, u);
        minV = Math.min(minV, v); maxV = Math.max(maxV, v);
      }
      const x0 = Math.floor(minU * width), x1 = Math.floor(maxU * width);
      const y0 = Math.floor(minV * height), y1 = Math.floor(maxV * height);
      if (x1 - x0 >= width || y1 - y0 >= height) return touched.fill(1);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) touched[(((y % height) + height) % height) * width + (((x % width) + width) % width)] = 1;
      }
    }
  }
  return touched;
}

/* ------------------------------------------------------------------ */
/*  PNG (for baked textures) and GLB assembly                          */
/* ------------------------------------------------------------------ */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});

function encodePng(width, height, rgba) {
  const chunk = (type, body) => {
    const out = Buffer.alloc(body.length + 12);
    out.writeUInt32BE(body.length, 0);
    out.write(type, 4, "latin1");
    Buffer.from(body).copy(out, 8);
    let crc = 0xffffffff;
    for (let i = 4; i < out.length - 4; i++) crc = CRC_TABLE[(crc ^ out[i]) & 0xff] ^ (crc >>> 8);
    out.writeUInt32BE((crc ^ 0xffffffff) >>> 0, out.length - 4);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

const model = (() => {
  const path = wantedModel ? norm(wantedModel) : [...gameFiles.keys()].filter((name) => name.endsWith(".mdl")).sort()[0];
  const data = path && readGameFile(path);
  if (!data) throw new Error(wantedModel ? `Model ${wantedModel} is not in the mod.` : "No .mdl found in the mod.");
  return { path, ...parseMdl(data) };
})();

await MeshoptEncoder.ready;

const gltf = {
  asset: { version: "2.0", generator: "pmp-to-glb.mjs" },
  extensionsUsed: ["KHR_mesh_quantization", "EXT_meshopt_compression"],
  extensionsRequired: ["KHR_mesh_quantization", "EXT_meshopt_compression"],
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [],
  meshes: [],
  materials: [],
  accessors: [],
  bufferViews: [],
  buffers: [],
};

/* buffer 0 is the GLB binary chunk; buffer 1 is the placeholder meshopt decodes into */
const binary = [];
let binaryLength = 0;
let fallbackLength = 0;
const appendBinary = (bytes) => {
  const offset = binaryLength;
  binary.push(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  const padding = (4 - (bytes.byteLength % 4)) % 4;
  if (padding) binary.push(Buffer.alloc(padding));
  binaryLength += bytes.byteLength + padding;
  return offset;
};

function compressedView(bytes, count, stride, mode, filter) {
  const encoded = MeshoptEncoder.encodeGltfBuffer(bytes, count, stride, mode);
  const view = {
    buffer: 1,
    byteOffset: fallbackLength,
    byteLength: count * stride,
    extensions: {
      EXT_meshopt_compression: { buffer: 0, byteOffset: appendBinary(encoded), byteLength: encoded.byteLength, byteStride: stride, count, mode, ...(filter && { filter }) },
    },
  };
  if (mode === "ATTRIBUTES") Object.assign(view, { byteStride: stride, target: 34962 });
  else view.target = 34963;
  fallbackLength += count * stride + ((4 - ((count * stride) % 4)) % 4);
  return gltf.bufferViews.push(view) - 1;
}

/* materials */
const textureIndex = (width, height, rgba, nearest) => {
  gltf.images ??= [];
  gltf.textures ??= [];
  gltf.samplers ??= [{ magFilter: 9728, minFilter: 9728, wrapS: 10497, wrapT: 10497 }, { magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
  const png = encodePng(width, height, rgba);
  const view = gltf.bufferViews.push({ buffer: 0, byteOffset: appendBinary(png), byteLength: png.byteLength }) - 1;
  const image = gltf.images.push({ bufferView: view, mimeType: "image/png" }) - 1;
  return { index: gltf.textures.push({ source: image, sampler: nearest ? 0 : 1 }) - 1 };
};

let needsUvs = false;
const materialIndex = new Map();
for (const name of new Set(model.meshes.map((mesh) => mesh.materialName))) {
  const file = name.replace(/^\/+/, "").toLowerCase();
  const path = [...gameFiles.keys()].filter((key) => key.endsWith(`/${file}`) || key === file).sort()[0];
  const material = { name: file.replace(/\.mtrl$/, ""), pbrMetallicRoughness: {} };
  materialIndex.set(name, gltf.materials.push(material) - 1);
  if (!path) {
    warn(`${file} is not in the mod, its meshes get a plain white material`);
    continue;
  }

  const mtrl = parseMtrl(readGameFile(path));
  const baked = bakeMaterial(mtrl, file);
  const users = model.meshes.filter((mesh) => mesh.materialName === name);
  const touched = touchedTexels(users, baked.width, baked.height);
  const first = touched.indexOf(1) * 8;
  let uniform = true;
  let hasEmissive = false;
  const rowsUsed = new Set();
  for (let t = 0; t < touched.length; t++) {
    if (!touched[t]) continue;
    rowsUsed.add(baked.rowAt[t]);
    for (let c = 0; c < 8; c++) {
      if (Math.abs(baked.layers[t * 8 + c] - baked.layers[first + c]) > 1 / 512) uniform = false;
      if (c >= 5 && baked.layers[t * 8 + c] > 0) hasEmissive = true;
    }
  }

  material.extras = { mtrl: path, shader: mtrl.shader, colorTableRows: mtrl.rows.length ? [...rowsUsed].sort((p, q) => p - q) : [] };
  const pbr = material.pbrMetallicRoughness;
  if (uniform) {
    const value = baked.layers.subarray(first, first + 8);
    pbr.baseColorFactor = [value[0], value[1], value[2], 1];
    pbr.metallicFactor = value[3];
    pbr.roughnessFactor = value[4];
    if (hasEmissive) material.emissiveFactor = [value[5], value[6], value[7]];
  } else {
    needsUvs = true;
    const { width, height, layers } = baked;
    const image = (pick) => {
      const rgba = new Uint8Array(width * height * 4);
      for (let t = 0; t < width * height; t++) rgba.set(pick(layers.subarray(t * 8, t * 8 + 8)).map((value) => Math.round(value * 255)), t * 4);
      return textureIndex(width, height, rgba, true);
    };
    pbr.baseColorTexture = image((v) => [linearToSrgb(v[0]), linearToSrgb(v[1]), linearToSrgb(v[2]), 1]);
    pbr.metallicRoughnessTexture = image((v) => [1, v[4], v[3], 1]);
    if (hasEmissive) {
      material.emissiveTexture = image((v) => [linearToSrgb(v[5]), linearToSrgb(v[6]), linearToSrgb(v[7]), 1]);
      material.emissiveFactor = [1, 1, 1];
    }
  }
}

/*
  geometry: all meshes share one quantization grid, undone by the root node's transform.
  14 bits per axis for positions and 10 bit octahedral normals keep the file small without
  visible loss (a 12 cm necklace lands on a 7 micrometre grid).
*/
const POSITION_STEPS = 2 ** 14 - 1;
const NORMAL_BITS = 10;
const min = [Infinity, Infinity, Infinity];
const max = [-Infinity, -Infinity, -Infinity];
for (const { positions } of model.meshes) {
  for (let i = 0; i < positions.length; i++) {
    min[i % 3] = Math.min(min[i % 3], positions[i]);
    max[i % 3] = Math.max(max[i % 3], positions[i]);
  }
}
const extent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
const step = extent / POSITION_STEPS;
const root = { name: meta.Name ?? "model", translation: min, scale: [step, step, step], children: [] };
gltf.nodes.push(root);

let totalVertices = 0;
let totalTriangles = 0;
for (const mesh of model.meshes) {
  /* reorder for the vertex cache and for compression, dropping unreferenced vertices */
  const [remap, vertexCount] = MeshoptEncoder.reorderMesh(mesh.indices, true, true);
  const positions = new Uint16Array(vertexCount * 4);
  const normals = new Float32Array(vertexCount * 4);
  const uvs = new Float32Array(vertexCount * 2);
  const low = [POSITION_STEPS, POSITION_STEPS, POSITION_STEPS];
  const high = [0, 0, 0];
  for (let old = 0; old < remap.length; old++) {
    const v = remap[old];
    if (v === 0xffffffff) continue;
    for (let c = 0; c < 3; c++) {
      const q = Math.round((mesh.positions[old * 3 + c] - min[c]) / step);
      positions[v * 4 + c] = q;
      low[c] = Math.min(low[c], q);
      high[c] = Math.max(high[c], q);
      normals[v * 4 + c] = mesh.normals[old * 3 + c];
    }
    uvs[v * 2] = mesh.uvs[old * 2];
    uvs[v * 2 + 1] = mesh.uvs[old * 2 + 1];
  }

  const attributes = {};
  const accessor = (definition) => gltf.accessors.push(definition) - 1;
  attributes.POSITION = accessor({
    bufferView: compressedView(new Uint8Array(positions.buffer), vertexCount, 8, "ATTRIBUTES"),
    componentType: 5123, count: vertexCount, type: "VEC3", min: low, max: high,
  });
  attributes.NORMAL = accessor({
    bufferView: compressedView(MeshoptEncoder.encodeFilterOct(normals, vertexCount, 8, NORMAL_BITS), vertexCount, 8, "ATTRIBUTES", "OCTAHEDRAL"),
    componentType: 5122, normalized: true, count: vertexCount, type: "VEC3",
  });
  if (needsUvs) {
    const inUnitRange = uvs.every((value) => value >= 0 && value <= 1);
    const packed = inUnitRange ? Uint16Array.from(uvs, (value) => Math.round(value * 65535)) : uvs;
    attributes.TEXCOORD_0 = accessor({
      bufferView: compressedView(new Uint8Array(packed.buffer), vertexCount, inUnitRange ? 4 : 8, "ATTRIBUTES"),
      componentType: inUnitRange ? 5123 : 5126, ...(inUnitRange && { normalized: true }), count: vertexCount, type: "VEC2",
    });
  }

  const wide = vertexCount > 65535;
  const indices = wide ? mesh.indices : Uint16Array.from(mesh.indices);
  const indexAccessor = accessor({
    bufferView: compressedView(new Uint8Array(indices.buffer, indices.byteOffset, indices.byteLength), indices.length, wide ? 4 : 2, "TRIANGLES"),
    componentType: wide ? 5125 : 5123, count: indices.length, type: "SCALAR",
  });

  const meshIndex = gltf.meshes.push({ name: mesh.name, primitives: [{ attributes, indices: indexAccessor, material: materialIndex.get(mesh.materialName) }] }) - 1;
  root.children.push(gltf.nodes.push({ name: mesh.name, mesh: meshIndex }) - 1);
  totalVertices += vertexCount;
  totalTriangles += indices.length / 3;
}

gltf.buffers.push({ byteLength: binaryLength }, { byteLength: fallbackLength, extensions: { EXT_meshopt_compression: { fallback: true } } });

const json = Buffer.from(JSON.stringify(gltf));
const jsonChunk = Buffer.concat([json, Buffer.alloc((4 - (json.length % 4)) % 4, 0x20)]);
const binaryChunk = Buffer.concat(binary);
const glbHeader = Buffer.alloc(12);
glbHeader.writeUInt32LE(0x46546c67, 0);
glbHeader.writeUInt32LE(2, 4);
glbHeader.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binaryChunk.length, 8);
const chunkHeader = (length, type) => {
  const out = Buffer.alloc(8);
  out.writeUInt32LE(length, 0);
  out.writeUInt32LE(type, 4);
  return out;
};
const glb = Buffer.concat([glbHeader, chunkHeader(jsonChunk.length, 0x4e4f534a), jsonChunk, chunkHeader(binaryChunk.length, 0x004e4942), binaryChunk]);
writeFileSync(outPath, glb);

console.log(`${model.path}`);
console.log(`  ${gltf.meshes.length} meshes, ${totalVertices} vertices, ${totalTriangles} triangles`);
for (const material of gltf.materials) {
  const pbr = material.pbrMetallicRoughness;
  const summary = pbr.baseColorTexture
    ? "baked textures"
    : `color ${pbr.baseColorFactor?.slice(0, 3).map((value) => value.toFixed(2)).join(" ") ?? "1 1 1"}, metalness ${pbr.metallicFactor ?? 1}, roughness ${pbr.roughnessFactor ?? 1}`;
  console.log(`  ${material.name}: ${summary}`);
}
for (const message of warnings) console.log(`  warning: ${message}`);
console.log(`wrote ${outPath} (${(glb.length / 1024).toFixed(0)} KB)`);
