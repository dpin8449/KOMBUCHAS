//import fs from 'fs';



import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('Does .env exist?', fs.existsSync(path.resolve(__dirname, '../.env')));
console.log('Contents:', fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8'));
import fs from 'fs';
console.log('Does .env exist?', fs.existsSync(path.resolve(__dirname, '../.env')));
console.log('Contents:', fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf-8'));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('Using connection string:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
import { Pool } from 'pg';
import { parse } from 'csv-parse/sync';

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});
const csv = fs.readFileSync('../data/kombuchas.csv', 'utf-8');
const records = parse(csv, { columns: true, delimiter: ';' });




const toPgDate = (val: string | undefined) => {
	if (!val || val.trim() === '') return null;
	const [d, m, y] = val.split('/');
	if (!d || !m || !y) return null;
	return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
};
const safeInt = (val: string | undefined) => {
	const n = Number(val);
	return val && !isNaN(n) ? n : null;
};

(async () => {
	for (const r of records) {
		await pool.query(
			'INSERT INTO batch (id, type, start_date, end_date, days, origin_batch_id, temperature, comment, result, production, total_time, final_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT (id) DO NOTHING',
			[
				r.LOTE,
				r.TIPO,
				r.TIPO === 'FINAL' ? toPgDate(r.F2_INICIO) : toPgDate(r.F1_INICIO),
				r.TIPO === 'FINAL' ? toPgDate(r.F2_FIN) : toPgDate(r.F1_FIN),
				r.TIPO === 'FINAL' ? safeInt(r.F2_DIAS) : safeInt(r.F1_DIAS),
				r.LOTE_ORIGEN || null,
				safeInt(r.TEMPERATURA),
				r.COMENTARIO || null,
				r.RESULTADO || null,
				r.PRODUCCION || null,
				safeInt(r.TIEMPO_TOTAL),
				r.FIN || null
			]
		);
	}
	await pool.end();
	console.log('Seed complete');
})();
