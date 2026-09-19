// Robot que sincroniza el STOCK de la lista de precios con StockVence.
//
// Corre solo, programado por GitHub Actions (ver .github/workflows/sync-stock.yml),
// asi que no depende de que ningun celular este prendido ni conectado.
//
// Que hace, cada vez que corre:
//   Lee todos los productos y sus lotes desde Firestore y arma stock.json:
//   por cada codigo de barra, si hay stock disponible o no. La lista de
//   precios usa ese archivo para no dejar pedir algo sin stock.
//
// Las FOTOS no las toca este robot — la app StockVence las sube directo a
// este repositorio (carpeta img/) al dar de alta el producto, asi que no
// hace falta ningun paso intermedio para eso (ver GitHubRepository.kt en
// el proyecto de la app).
//
// Credenciales: usa una cuenta de servicio de Firebase de SOLO LECTURA,
// guardada como secreto de GitHub (FIREBASE_SERVICE_ACCOUNT) — nunca queda
// expuesta en el repo ni en la pagina publica. Esto solo lee Firestore
// (que es gratis en el plan Spark), no usa Storage para nada.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const credencialesJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!credencialesJson) {
  console.error('Falta la variable de entorno FIREBASE_SERVICE_ACCOUNT.');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(credencialesJson)) });

const db = getFirestore();
const STOCK_JSON_PATH = path.resolve('stock.json');

async function main() {
  const stock = await armarStockJson();
  await writeFile(STOCK_JSON_PATH, JSON.stringify(stock, null, 2) + '\n', 'utf-8');
  console.log(`stock.json actualizado con ${Object.keys(stock).length} productos.`);
}

async function armarStockJson() {
  const productosSnap = await db.collection('productos').get();
  const stock = {};

  for (const doc of productosSnap.docs) {
    const producto = doc.data();
    const codigoBarra = (producto.codigoBarra || '').trim();
    if (!codigoBarra) continue;

    const lotesSnap = await db.collection('productos').doc(doc.id).collection('lotes').get();
    const stockTotal = lotesSnap.docs.reduce((suma, l) => suma + (l.data().cantidad || 0), 0);

    stock[codigoBarra] = {
      disponible: stockTotal > 0,
      stock: stockTotal,
    };
  }

  return stock;
}

main().catch((err) => {
  console.error('Error sincronizando con StockVence:', err);
  process.exit(1);
});
