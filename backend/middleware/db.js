import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getFilePath(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

export function readDB(name) {
  const filePath = getFilePath(name);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return [];
  }
}

export function writeDB(name, data) {
  fs.writeFileSync(getFilePath(name), JSON.stringify(data, null, 2));
}

export function findOne(collection, predicate) {
  return readDB(collection).find(predicate) || null;
}

export function findAll(collection, predicate) {
  const data = readDB(collection);
  return predicate ? data.filter(predicate) : data;
}

export function insertOne(collection, doc) {
  const data = readDB(collection);
  data.push(doc);
  writeDB(collection, data);
  return doc;
}

export function updateOne(collection, predicate, updates) {
  const data = readDB(collection);
  const idx = data.findIndex(predicate);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...updates };
  writeDB(collection, data);
  return data[idx];
}

export function upsertOne(collection, predicate, doc) {
  const data = readDB(collection);
  const idx = data.findIndex(predicate);
  if (idx === -1) {
    data.push(doc);
  } else {
    data[idx] = { ...data[idx], ...doc };
  }
  writeDB(collection, data);
  return idx === -1 ? doc : data[data.findIndex(predicate)];
}

export function deleteOne(collection, predicate) {
  const data = readDB(collection);
  const idx = data.findIndex(predicate);
  if (idx === -1) return false;
  data.splice(idx, 1);
  writeDB(collection, data);
  return true;
}
