import PDFDocument from "pdfkit";

export interface PdfTable {
	heading: string;
	columns: string[];
	rows: Array<Array<string | number>>;
}

export interface PdfReportInput {
	title: string;
	subtitle?: string;
	summary?: Array<[string, string | number]>;
	tables?: PdfTable[];
}

const BRAND = "#b91c1c";

/** Render a monospace table into the document, handling page breaks. */
const renderTable = (doc: PDFKit.PDFDocument, table: PdfTable): void => {
	doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text(table.heading);
	doc.moveDown(0.3);

	const widths = table.columns.map((col, i) =>
		Math.min(
			26,
			Math.max(col.length, ...table.rows.map((r) => String(r[i] ?? "").length)),
		),
	);

	const cell = (value: unknown, width: number): string => {
		const s = String(value ?? "");
		const clipped = s.length > width ? `${s.slice(0, width - 1)}…` : s;
		return clipped.padEnd(width + 2);
	};
	const formatRow = (cells: Array<string | number>): string =>
		cells.map((c, i) => cell(c, widths[i] ?? 10)).join("");

	const bottom = doc.page.height - doc.page.margins.bottom - 24;

	doc.font("Courier-Bold").fontSize(9).fillColor("#000").text(formatRow(table.columns));
	doc
		.moveTo(doc.page.margins.left, doc.y + 1)
		.lineTo(doc.page.width - doc.page.margins.right, doc.y + 1)
		.strokeColor("#cccccc")
		.stroke();
	doc.moveDown(0.2);

	doc.font("Courier").fontSize(9).fillColor("#222");
	if (table.rows.length === 0) {
		doc.fillColor("#888").text("(none)");
	}
	for (const row of table.rows) {
		if (doc.y > bottom) {
			doc.addPage();
			doc.font("Courier").fontSize(9).fillColor("#222");
		}
		doc.text(formatRow(row));
	}
};

/** Render a structured report to a PDF buffer using pdfkit's standard fonts. */
export const renderReportPdf = (input: PdfReportInput): Promise<Buffer> =>
	new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 48, size: "A4" });
		const chunks: Buffer[] = [];
		doc.on("data", (c: Buffer) => chunks.push(c));
		doc.on("end", () => resolve(Buffer.concat(chunks)));
		doc.on("error", reject);

		doc.font("Helvetica-Bold").fontSize(20).fillColor(BRAND).text("TZW Fire Safety");
		doc.font("Helvetica-Bold").fontSize(15).fillColor("#111").text(input.title);
		if (input.subtitle) {
			doc.font("Helvetica").fontSize(10).fillColor("#666").text(input.subtitle);
		}
		doc
			.font("Helvetica")
			.fontSize(8)
			.fillColor("#999")
			.text(`Generated ${new Date().toISOString()}`);
		doc.moveDown();

		if (input.summary?.length) {
			doc.font("Helvetica-Bold").fontSize(12).fillColor("#111").text("Summary");
			doc.moveDown(0.3);
			for (const [key, value] of input.summary) {
				doc
					.font("Helvetica-Bold")
					.fontSize(10)
					.fillColor("#333")
					.text(`${key}: `, { continued: true })
					.font("Helvetica")
					.fillColor("#000")
					.text(String(value));
			}
			doc.moveDown();
		}

		for (const table of input.tables ?? []) {
			renderTable(doc, table);
			doc.moveDown();
		}

		doc.end();
	});
