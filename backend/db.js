// ============================================================
// db.js — Simple JSON file-based database helper
// All data is stored in /data/*.json files
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Read a JSON file, return empty array if not exists
export function readDB(filename) {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '[]', 'utf-8');
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Write data to a JSON file
export function writeDB(filename, data) {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Find one record by field match
export function findOne(filename, field, value) {
  const data = readDB(filename);
  return data.find(item => item[field] === value) || null;
}

// Find all records by field match
export function findMany(filename, field, value) {
  const data = readDB(filename);
  return data.filter(item => item[field] === value);
}

// Insert a new record
export function insertOne(filename, record) {
  const data = readDB(filename);
  data.push(record);
  writeDB(filename, data);
  return record;
}

// Update a record by field match
export function updateOne(filename, field, value, updates) {
  const data = readDB(filename);
  const index = data.findIndex(item => item[field] === value);
  if (index === -1) return null;
  data[index] = { ...data[index], ...updates };
  writeDB(filename, data);
  return data[index];
}

// Upsert: update if exists, insert if not
export function upsertOne(filename, field, value, record) {
  const data = readDB(filename);
  const index = data.findIndex(item => item[field] === value);
  if (index === -1) {
    data.push(record);
  } else {
    data[index] = { ...data[index], ...record };
  }
  writeDB(filename, data);
  return index === -1 ? record : data[data.findIndex(item => item[field] === value)];
}

// Delete a record by field match
export function deleteOne(filename, field, value) {
  const data = readDB(filename);
  const newData = data.filter(item => item[field] !== value);
  writeDB(filename, newData);
  return data.length !== newData.length;
}
